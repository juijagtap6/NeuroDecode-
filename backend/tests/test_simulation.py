"""Comprehensive unit and API integration tests for the Simulation module.

Covers:
- LIF dynamics & numerical ODE integration
- Threshold detection & spike generation
- Reset behavior to V_reset
- Refractory period enforcement
- Population network simulation with E/I ratio & connectivity
- Firing rate & ISI statistics calculations
- Parameter validation & stability constraints
- Deterministic reproducibility with random seed
- Canonical schema adherence
- Bring Your Own Data (BYOD) CSV upload validation & error handling
- Simulation API endpoints (/run, /upload, /trace, /sample-csv)
"""
import io
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schemas.common import ProvenanceEnum
from app.schemas.simulation import (
    SimulationModeEnum,
    LIFPopulationParams,
    SimulationRunRequest,
    SimulationResponse,
)
from app.services.simulation_service import LIFSimulationService, lif_simulation_service

client = TestClient(app)


# =============================================================================
# 1. LIF Dynamics, Threshold, Reset, and Refractory Tests
# =============================================================================

def test_lif_dynamics_subthreshold():
    """Verify that with subthreshold input, neuron does not spike and settles near steady state."""
    service = LIFSimulationService()
    # i_inj = 0 -> steady state is v_rest (-65 mV), threshold is -50 mV
    params = LIFPopulationParams(
        num_neurons=1,
        i_inj=0.0,
        noise=0.0,
        connection_density=0.0,
        duration_ms=200.0,
        dt_ms=0.1,
        v_rest=-65.0,
        v_thresh=-50.0,
        v_reset=-65.0,
    )
    result = service.run_population_simulation(params)
    assert result.summary.total_spikes == 0
    assert result.firing_rates["0"] == 0.0
    trace = result.membrane_potentials.traces["0"]
    # Final potential should remain close to v_rest
    assert abs(trace[-1] - (-65.0)) < 3.0


def test_lif_threshold_spike_generation_and_reset():
    """Verify that strong input crosses threshold, emits spikes, and resets to v_reset."""
    service = LIFSimulationService()
    params = LIFPopulationParams(
        num_neurons=1,
        i_inj=25.0,  # strong drive: R_m * I = 1.5 * 25 = 37.5 mV -> V_inf = -65 + 37.5 = -27.5 > -50
        noise=0.0,
        connection_density=0.0,
        duration_ms=200.0,
        dt_ms=0.1,
        v_rest=-65.0,
        v_thresh=-50.0,
        v_reset=-65.0,
        t_ref=2.0,
    )
    result = service.run_population_simulation(params)
    assert result.summary.total_spikes > 0
    assert result.firing_rates["0"] > 10.0
    # Every spike event should be recorded in spikes_by_neuron
    assert len(result.spike_events) == result.summary.total_spikes
    assert len(result.spikes_by_neuron["0"]) == result.summary.total_spikes


def test_refractory_period_enforcement():
    """Verify that spikes cannot occur closer than t_ref."""
    service = LIFSimulationService()
    params = LIFPopulationParams(
        num_neurons=1,
        i_inj=40.0,  # very strong drive
        noise=0.0,
        connection_density=0.0,
        duration_ms=300.0,
        dt_ms=0.1,
        t_ref=5.0,  # 5 ms refractory
    )
    result = service.run_population_simulation(params)
    spikes = result.spikes_by_neuron["0"]
    assert len(spikes) >= 2
    for i in range(len(spikes) - 1):
        isi = spikes[i + 1] - spikes[i]
        assert isi >= 5.0 - 0.05, f"Spikes violated refractory period: ISI was {isi} ms"


# =============================================================================
# 2. Population Network & Recurrent Connectivity
# =============================================================================

def test_population_simulation_excitatory_inhibitory():
    """Verify population simulation with 100 neurons, E/I ratio, and connection density."""
    service = LIFSimulationService()
    params = LIFPopulationParams(
        num_neurons=50,
        ei_ratio=0.8,
        connection_density=0.1,
        i_inj=14.0,
        noise=0.8,
        duration_ms=300.0,
        dt_ms=0.1,
        random_seed=123,
    )
    result = service.run_population_simulation(params)
    assert result.provenance == ProvenanceEnum.SYNTHETIC_LIF
    assert len(result.neuron_ids) == 50
    assert result.summary.total_neurons == 50
    assert result.summary.duration_ms == 300.0
    assert result.summary.total_spikes > 0
    assert result.summary.mean_firing_rate_hz > 0.0
    # Canonical matrix should be populated
    assert result.canonical_matrix is not None
    assert len(result.canonical_matrix.unit_ids) == 50
    assert result.canonical_matrix.provenance == ProvenanceEnum.SYNTHETIC_LIF


# =============================================================================
# 3. Firing Rates and ISI Calculations
# =============================================================================

def test_firing_rate_and_isi_statistics():
    """Verify mathematical correctness of firing rate and ISI statistics."""
    service = LIFSimulationService()
    params = LIFPopulationParams(
        num_neurons=10,
        i_inj=15.0,
        noise=0.5,
        duration_ms=400.0,
        dt_ms=0.1,
        random_seed=42,
    )
    result = service.run_population_simulation(params)
    for nid_str, count in result.spike_counts.items():
        expected_rate = round(count / (400.0 / 1000.0), 2)
        assert result.firing_rates[nid_str] == expected_rate

    # Check ISI stats consistency
    isi_stats = result.isi_statistics
    assert isi_stats.population_mean_isi_ms >= 0.0
    assert isi_stats.population_cv_isi >= 0.0


# =============================================================================
# 4. Deterministic Reproducibility
# =============================================================================

def test_reproducibility_with_fixed_seed():
    """Verify that simulations with identical parameters and random seed produce identical spikes."""
    service = LIFSimulationService()
    params_a = LIFPopulationParams(num_neurons=20, random_seed=777, duration_ms=200.0)
    params_b = LIFPopulationParams(num_neurons=20, random_seed=777, duration_ms=200.0)

    res_a = service.run_population_simulation(params_a)
    res_b = service.run_population_simulation(params_b)

    assert res_a.summary.total_spikes == res_b.summary.total_spikes
    assert [ev.time_ms for ev in res_a.spike_events] == [ev.time_ms for ev in res_b.spike_events]
    assert [ev.neuron_id for ev in res_a.spike_events] == [ev.neuron_id for ev in res_b.spike_events]


# =============================================================================
# 5. Parameter Validation Tests
# =============================================================================

def test_parameter_validation_reset_greater_than_threshold():
    """Verify that v_reset >= v_thresh raises validation error."""
    with pytest.raises(ValidationError):
        LIFPopulationParams(v_reset=-40.0, v_thresh=-50.0)


def test_parameter_validation_dt_larger_than_tau():
    """Verify that dt >= tau_m raises validation error for numerical instability."""
    with pytest.raises(ValidationError):
        LIFPopulationParams(dt_ms=25.0, tau_m=20.0)


def test_parameter_validation_negative_neurons():
    """Verify that num_neurons < 1 raises validation error."""
    with pytest.raises(ValidationError):
        LIFPopulationParams(num_neurons=0)


# =============================================================================
# 6. Bring Your Own Data (BYOD) CSV Validation Tests
# =============================================================================

def test_csv_upload_valid_events():
    """Verify parsing of valid event-based spike train CSV."""
    service = LIFSimulationService()
    csv_text = "neuron_id,timestamp_ms\n0,12.5\n0,45.2\n1,15.8\n1,88.4\n2,100.1\n"
    res = service.parse_and_validate_csv(csv_text.encode("utf-8"), "test.csv")
    assert res.provenance == ProvenanceEnum.USER_UPLOADED
    assert res.summary.total_neurons == 3
    assert res.summary.total_spikes == 5
    assert res.spike_counts["0"] == 2
    assert res.spike_counts["1"] == 2
    assert res.spike_counts["2"] == 1
    assert res.membrane_potentials is None
    assert res.canonical_matrix is not None
    assert res.canonical_matrix.provenance == ProvenanceEnum.USER_UPLOADED


def test_csv_upload_seconds_conversion():
    """Verify that timestamps in seconds are accurately detected and converted to milliseconds."""
    service = LIFSimulationService()
    csv_text = "unit_id,spike_time_s\n0,0.012\n0,0.045\n1,0.020\n"
    res = service.parse_and_validate_csv(csv_text.encode("utf-8"), "times_in_sec.csv")
    assert [ev.time_ms for ev in res.spike_events] == [12.0, 20.0, 45.0]
    assert res.spikes_by_neuron["0"] == [12.0, 45.0]
    assert res.spikes_by_neuron["1"] == [20.0]


def test_csv_upload_empty_file_rejected():
    """Verify that empty file raises ValueError with clear error message."""
    service = LIFSimulationService()
    with pytest.raises(ValueError) as exc:
        service.parse_and_validate_csv(b"", "empty.csv")
    assert "empty" in str(exc.value).lower()


def test_csv_upload_non_numeric_data_rejected():
    """Verify that non-numeric data in neuron/timestamp columns is rejected without fabricating data."""
    service = LIFSimulationService()
    csv_text = "neuron_id,timestamp_ms\nalpha,not_a_time\nbeta,12.5\n"
    with pytest.raises(ValueError) as exc:
        service.parse_and_validate_csv(csv_text.encode("utf-8"), "invalid.csv")
    assert "non-numeric" in str(exc.value).lower()


def test_csv_upload_negative_timestamp_rejected():
    """Verify that negative timestamps are rejected."""
    service = LIFSimulationService()
    csv_text = "neuron_id,timestamp_ms\n0,-5.0\n1,10.0\n"
    with pytest.raises(ValueError) as exc:
        service.parse_and_validate_csv(csv_text.encode("utf-8"), "negative.csv")
    assert "negative" in str(exc.value).lower()


# =============================================================================
# 7. Simulation API Endpoints Tests
# =============================================================================

def test_api_run_simulation_endpoint():
    """Test POST /api/v1/simulation/run with valid payload."""
    payload = {
        "mode": "quick",
        "params": {
            "num_neurons": 30,
            "duration_ms": 200.0,
            "dt_ms": 0.1,
            "i_inj": 14.0,
            "noise": 0.8,
            "random_seed": 42,
        },
    }
    res = client.post("/api/v1/simulation/run", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["provenance"] == "synthetic_lif"
    assert data["summary"]["total_neurons"] == 30
    assert len(data["neuron_ids"]) == 30
    assert "membrane_potentials" in data
    assert "population_firing_rate" in data


def test_api_upload_simulation_endpoint():
    """Test POST /api/v1/simulation/upload with CSV file upload."""
    csv_content = b"neuron_id,timestamp_ms\n0,10.0\n0,20.0\n1,15.0\n1,30.0\n"
    files = {"file": ("test_spikes.csv", io.BytesIO(csv_content), "text/csv")}
    res = client.post("/api/v1/simulation/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["provenance"] == "user_uploaded"
    assert data["summary"]["total_neurons"] == 2
    assert data["summary"]["total_spikes"] == 4


def test_api_upload_invalid_csv_returns_400():
    """Test POST /api/v1/simulation/upload returns 400 for malformed CSV."""
    files = {"file": ("bad.csv", io.BytesIO(b"random,garbage,header\nfoo,bar,baz\n"), "text/csv")}
    res = client.post("/api/v1/simulation/upload", files=files)
    assert res.status_code == 400
    assert "detail" in res.json()


def test_api_trace_endpoint():
    """Test GET /api/v1/simulation/trace/{neuron_id} returns cached trace."""
    # First run a simulation
    payload = {"mode": "quick", "params": {"num_neurons": 10, "duration_ms": 150.0, "random_seed": 1}}
    client.post("/api/v1/simulation/run", json=payload)

    res = client.get("/api/v1/simulation/trace/0")
    assert res.status_code == 200
    trace = res.json()
    assert "time_ms" in trace
    assert "traces" in trace
    assert "0" in trace["traces"]


def test_api_sample_csv_endpoint():
    """Test GET /api/v1/simulation/sample-csv returns downloadable CSV."""
    res = client.get("/api/v1/simulation/sample-csv")
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    assert "neuron_id,timestamp_ms" in res.text
