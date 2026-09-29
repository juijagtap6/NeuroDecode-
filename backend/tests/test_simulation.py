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


# =============================================================================
# 8. Regression Safety Tests: Custom Build, BYOD CSV, Presets & Membrane Potential
# =============================================================================

def test_valid_custom_build_request_and_reproducibility():
    """
    Regression Test: Valid Custom Build test configuration from user specification:
    Neurons (N): 10, tau_m: 20 ms, V_rest: -65 mV, V_thresh: -50 mV, V_reset: -65 mV,
    Resistance R_m: 100 MΩ, Refractory t_ref: 2 ms, Input Current: 200 pA,
    Noise (σ): 0, E/I Ratio: 0.8, Duration: 500 ms, Timestep dt: 0.1 ms, Seed: 42.

    Confirm that this configuration successfully runs and produces:
    - spike events
    - firing rates
    - ISI statistics
    - population firing rate
    - canonical spike matrix
    - membrane-potential data
    - deterministic reproducibility with seed=42
    """
    payload = {
        "mode": "custom",
        "params": {
            "num_neurons": 10,
            "tau_m": 20.0,
            "v_rest": -65.0,
            "v_thresh": -50.0,
            "v_reset": -65.0,
            "r_m": 100.0,
            "t_ref": 2.0,
            "i_inj": 200.0,
            "noise": 0.0,
            "ei_ratio": 0.8,
            "duration_ms": 500.0,
            "dt_ms": 0.1,
            "random_seed": 42,
        },
    }

    # Run first time via API
    res1 = client.post("/api/v1/simulation/run", json=payload)
    assert res1.status_code == 200, f"Custom Build failed: {res1.text}"
    data1 = res1.json()

    # 1. Spike events
    assert len(data1["spike_events"]) > 0
    assert data1["summary"]["total_spikes"] > 0
    assert data1["summary"]["total_neurons"] == 10
    assert len(data1["neuron_ids"]) == 10

    # 2. Firing rates
    assert len(data1["firing_rates"]) == 10
    assert data1["summary"]["mean_firing_rate_hz"] > 0

    # 3. ISI statistics
    isi_stats = data1["isi_statistics"]
    assert "mean_isi_ms" in isi_stats
    assert "cv_isi" in isi_stats
    assert "population_mean_isi_ms" in isi_stats
    assert "population_cv_isi" in isi_stats
    assert isi_stats["population_mean_isi_ms"] > 0

    # 4. Population firing rate
    pop_rate = data1["population_firing_rate"]
    assert len(pop_rate["time_bins_ms"]) > 0
    assert len(pop_rate["rates_hz"]) == len(pop_rate["time_bins_ms"])
    assert pop_rate["bin_size_ms"] > 0

    # 5. Canonical spike matrix
    assert data1["canonical_matrix"] is not None
    matrix = data1["canonical_matrix"]
    assert len(matrix["unit_ids"]) == 10
    assert len(matrix["matrix"]) == 10
    assert len(matrix["time_bin_edges"]) > 0
    assert matrix["provenance"] == "synthetic_lif"

    # 6. Membrane potential data
    assert data1["membrane_potentials"] is not None
    membrane = data1["membrane_potentials"]
    assert len(membrane["time_ms"]) > 0
    assert len(membrane["traces"]) > 0
    assert str(data1["summary"]["selected_neuron"]) in membrane["traces"]

    # 7. Reproducibility test: run a second time with seed=42 and compare
    res2 = client.post("/api/v1/simulation/run", json=payload)
    assert res2.status_code == 200
    data2 = res2.json()

    assert data1["summary"]["total_spikes"] == data2["summary"]["total_spikes"]
    assert data1["summary"]["mean_firing_rate_hz"] == data2["summary"]["mean_firing_rate_hz"]
    assert [e["time_ms"] for e in data1["spike_events"]] == [e["time_ms"] for e in data2["spike_events"]]


def test_invalid_custom_build_requests_return_validation_errors():
    """
    Regression Test: Intentionally invalid Custom Build requests must fail validation
    with 422 Unprocessable Entity and clear structured field/message details.
    """
    # 1. Physics violation: v_reset >= v_thresh
    invalid_physics = {
        "mode": "custom",
        "params": {
            "num_neurons": 10,
            "v_thresh": -50.0,
            "v_reset": -40.0,  # invalid: reset cannot be above threshold
        },
    }
    res1 = client.post("/api/v1/simulation/run", json=invalid_physics)
    assert res1.status_code == 422
    err_detail1 = res1.json()["detail"]
    assert isinstance(err_detail1, list)
    assert any("must be strictly less than threshold" in str(item) for item in err_detail1)

    # 2. Physics violation: dt >= tau_m
    invalid_dt = {
        "mode": "custom",
        "params": {
            "num_neurons": 10,
            "tau_m": 1.0,
            "dt_ms": 2.0,  # invalid: dt cannot exceed tau_m
        },
    }
    res2 = client.post("/api/v1/simulation/run", json=invalid_dt)
    assert res2.status_code == 422
    err_detail2 = res2.json()["detail"]
    assert any("must be smaller than membrane time constant" in str(item) for item in err_detail2)

    # 3. Parameter bounds violation: num_neurons <= 0
    invalid_neurons = {
        "mode": "custom",
        "params": {
            "num_neurons": 0,  # invalid: ge=1
        },
    }
    res3 = client.post("/api/v1/simulation/run", json=invalid_neurons)
    assert res3.status_code == 422
    assert any("num_neurons" in str(item.get("loc", [])) for item in res3.json()["detail"])


def test_byod_csv_header_parsing():
    """
    Regression Test: BYOD CSV header parsing verifies:
    - Header row is NOT interpreted as data
    - Column names with mixed case/whitespace are supported
    - neuron_id is parsed as numeric integer
    - timestamp_ms is parsed as numeric float
    """
    service = LIFSimulationService()
    # Test CSV with leading spaces in header and mixed casing
    csv_text = "  Neuron_ID  ,  Timestamp_ms  \n1,10.5\n2,20.0\n"
    res = service.parse_and_validate_csv(csv_text.encode("utf-8"), "header_test.csv")
    assert res.summary.total_neurons == 2
    assert res.summary.total_spikes == 2
    assert res.neuron_ids == [1, 2]
    assert [ev.neuron_id for ev in res.spike_events] == [1, 2]
    assert [ev.time_ms for ev in res.spike_events] == [10.5, 20.0]


def test_valid_byod_csv_exact_user_format():
    """
    Regression Test: User specified BYOD test CSV:
    neuron_id,timestamp_ms
    1,10.5
    1,20.5
    1,30.5
    2,15.0
    2,27.0
    2,39.0
    3,12.0
    3,25.0
    3,38.0

    Verify:
    - Provenance is marked as user_uploaded
    - Header row is not data (exactly 9 spikes)
    - All 3 neuron IDs [1, 2, 3] parsed as numeric
    - All timestamps parsed as numeric
    - Raster receives uploaded spikes
    - Membrane potential is None (extracellular recordings)
    """
    valid_csv = (
        "neuron_id,timestamp_ms\n"
        "1,10.5\n"
        "1,20.5\n"
        "1,30.5\n"
        "2,15.0\n"
        "2,27.0\n"
        "2,39.0\n"
        "3,12.0\n"
        "3,25.0\n"
        "3,38.0\n"
    )

    # Test via service
    service = LIFSimulationService()
    res = service.parse_and_validate_csv(valid_csv.encode("utf-8"), "user_sample.csv")
    assert res.provenance == ProvenanceEnum.USER_UPLOADED
    assert res.summary.provenance == ProvenanceEnum.USER_UPLOADED
    assert res.summary.total_neurons == 3
    assert res.summary.total_spikes == 9
    assert res.neuron_ids == [1, 2, 3]
    assert len(res.spike_events) == 9
    assert res.spike_counts["1"] == 3
    assert res.spike_counts["2"] == 3
    assert res.spike_counts["3"] == 3
    assert res.membrane_potentials is None

    # Test via API /api/v1/simulation/upload
    files = {"file": ("user_sample.csv", io.BytesIO(valid_csv.encode("utf-8")), "text/csv")}
    api_res = client.post("/api/v1/simulation/upload", files=files)
    assert api_res.status_code == 200
    api_data = api_res.json()
    assert api_data["provenance"] == "user_uploaded"
    assert api_data["summary"]["total_spikes"] == 9
    assert api_data["membrane_potentials"] is None


def test_invalid_byod_csv_rejections_with_clear_messages():
    """
    Regression Test: Invalid BYOD CSV uploads must be rejected with HTTP 400
    and a clear user-facing explanation specifying the invalid row and column.
    """
    service = LIFSimulationService()

    # 1. Non-numeric timestamp in row 3
    bad_time_csv = b"neuron_id,timestamp_ms\n1,10.5\n2,not_a_time\n3,25.0\n"
    with pytest.raises(ValueError) as exc1:
        service.parse_and_validate_csv(bad_time_csv, "bad_time.csv")
    assert "Row 3" in str(exc1.value)
    assert "timestamp" in str(exc1.value).lower()

    # 2. Non-numeric neuron ID in row 2
    bad_neuron_csv = b"neuron_id,timestamp_ms\nneuron_x,10.5\n2,20.0\n"
    with pytest.raises(ValueError) as exc2:
        service.parse_and_validate_csv(bad_neuron_csv, "bad_neuron.csv")
    assert "Row 2" in str(exc2.value)
    assert "neuron" in str(exc2.value).lower()

    # 3. Negative timestamp
    neg_time_csv = b"neuron_id,timestamp_ms\n1,-15.0\n2,20.0\n"
    with pytest.raises(ValueError) as exc3:
        service.parse_and_validate_csv(neg_time_csv, "neg_time.csv")
    assert "negative" in str(exc3.value).lower()

    # 4. Non-integer neuron ID
    float_neuron_csv = b"neuron_id,timestamp_ms\n1.8,10.5\n"
    with pytest.raises(ValueError) as exc4:
        service.parse_and_validate_csv(float_neuron_csv, "float_neuron.csv")
    assert "integer" in str(exc4.value).lower()


def test_membrane_potential_availability_by_simulation_mode():
    """
    Regression Test:
    - Quick Presets: membrane_potentials is provided.
    - Custom Build: membrane_potentials is provided.
    - BYOD (CSV): membrane_potentials is None ("Intracellular Membrane Potential Not Available").
    """
    # Quick mode
    quick_res = client.post(
        "/api/v1/simulation/run",
        json={"mode": "quick", "params": {"num_neurons": 10, "duration_ms": 100.0, "random_seed": 42}},
    )
    assert quick_res.status_code == 200
    assert quick_res.json()["membrane_potentials"] is not None

    # Custom mode
    custom_res = client.post(
        "/api/v1/simulation/run",
        json={"mode": "custom", "params": {"num_neurons": 10, "r_m": 100.0, "i_inj": 200.0, "duration_ms": 100.0, "random_seed": 42}},
    )
    assert custom_res.status_code == 200
    assert custom_res.json()["membrane_potentials"] is not None

    # BYOD mode
    csv_bytes = b"neuron_id,timestamp_ms\n1,10.0\n2,20.0\n"
    byod_res = client.post(
        "/api/v1/simulation/upload",
        files={"file": ("spikes.csv", io.BytesIO(csv_bytes), "text/csv")},
    )
    assert byod_res.status_code == 200
    assert byod_res.json()["membrane_potentials"] is None


def test_all_quick_presets_produce_real_data_and_spikes():
    """
    Regression Test: Verify that every Quick Preset runs successfully,
    reaches the backend, and produces real simulation data with actual spikes.
    """
    presets = [
        {"name": "Cortical Population Default", "params": {"num_neurons": 100, "ei_ratio": 0.8, "connection_density": 0.1, "tau_m": 20.0, "v_rest": -65.0, "v_thresh": -50.0, "v_reset": -65.0, "r_m": 1.5, "t_ref": 2.0, "i_inj": 14.0, "noise": 0.8, "duration_ms": 500.0, "dt_ms": 0.1, "random_seed": 42}},
        {"name": "Asynchronous Balanced Network", "params": {"num_neurons": 120, "ei_ratio": 0.8, "connection_density": 0.2, "tau_m": 18.0, "v_rest": -65.0, "v_thresh": -50.0, "v_reset": -65.0, "r_m": 1.5, "t_ref": 2.0, "i_inj": 13.0, "noise": 1.2, "duration_ms": 500.0, "dt_ms": 0.1, "random_seed": 42}},
        {"name": "Synchronous Population Bursting", "params": {"num_neurons": 100, "ei_ratio": 0.85, "connection_density": 0.25, "tau_m": 25.0, "v_rest": -65.0, "v_thresh": -50.0, "v_reset": -65.0, "r_m": 1.8, "t_ref": 2.5, "i_inj": 16.0, "noise": 0.5, "duration_ms": 500.0, "dt_ms": 0.1, "random_seed": 42}},
        {"name": "Sparse Low-Noise Population", "params": {"num_neurons": 80, "ei_ratio": 0.8, "connection_density": 0.05, "tau_m": 20.0, "v_rest": -65.0, "v_thresh": -50.0, "v_reset": -65.0, "r_m": 1.2, "t_ref": 2.0, "i_inj": 12.5, "noise": 0.6, "duration_ms": 500.0, "dt_ms": 0.1, "random_seed": 42}},
    ]

    for p in presets:
        res = client.post("/api/v1/simulation/run", json={"mode": "quick", "params": p["params"]})
        assert res.status_code == 200, f"Preset {p['name']} failed: {res.text}"
        data = res.json()
        assert data["provenance"] == "synthetic_lif"
        assert data["summary"]["total_spikes"] > 0, f"Preset {p['name']} produced 0 spikes"
        assert data["summary"]["mean_firing_rate_hz"] > 0
        assert len(data["spike_events"]) == data["summary"]["total_spikes"]
        assert data["membrane_potentials"] is not None
        assert data["canonical_matrix"] is not None
        assert data["population_firing_rate"] is not None
        assert data["isi_statistics"] is not None


def test_byod_download_sample_csv_and_upload_workflow():
    """
    Test 1 & 6: Download Sample CSV -> Take exact downloaded CSV -> Upload through BYOD.
    Validates that:
    1. GET /api/v1/simulation/sample-csv returns valid spike-only CSV.
    2. Uploading that exact CSV is accepted with status 200.
    3. Provenance is strictly 'user_uploaded'.
    4. State A: membrane_potentials is None (Intracellular Membrane Potential Not Available).
    5. No intracellular voltage data is fabricated.
    """
    # 1. Download sample CSV
    download_res = client.get("/api/v1/simulation/sample-csv")
    assert download_res.status_code == 200
    assert "neuron_id,timestamp_ms" in download_res.text
    downloaded_content = download_res.content

    # 2. Upload exact same downloaded CSV
    upload_res = client.post(
        "/api/v1/simulation/upload",
        files={"file": ("sample_neural_spikes.csv", io.BytesIO(downloaded_content), "text/csv")},
    )
    assert upload_res.status_code == 200
    byod_data = upload_res.json()

    assert byod_data["provenance"] == "user_uploaded"
    assert byod_data["membrane_potentials"] is None
    assert len(byod_data["neuron_ids"]) > 0
    assert len(byod_data["spike_events"]) > 0
    assert byod_data["summary"]["provenance"] == "user_uploaded"

    # Verify /api/v1/simulation/trace/{neuron_id} does not fabricate data for spike-only BYOD
    first_nid = byod_data["neuron_ids"][0]
    trace_res = client.get(f"/api/v1/simulation/trace/{first_nid}")
    assert trace_res.status_code == 404


def test_byod_voltage_csv_workflow_and_trace_retrieval():
    """
    Test B: CSV with membrane potential measurements.
    Validates that:
    1. Download sample voltage CSV or custom CSV with membrane_potential_mv is parsed.
    2. Validates membrane_potentials data structure with real uploaded values.
    3. Mini Membrane trace data is returned and available on-demand.
    4. Spike events are accurately detected at action potential threshold crossings.
    """
    # 1. Download sample voltage CSV
    volt_sample_res = client.get("/api/v1/simulation/sample-csv?sample_type=voltage")
    assert volt_sample_res.status_code == 200
    assert "neuron_id,timestamp_ms,membrane_potential_mv" in volt_sample_res.text

    # 2. Upload exact downloaded voltage CSV
    upload_res = client.post(
        "/api/v1/simulation/upload",
        files={"file": ("sample_neural_voltage.csv", io.BytesIO(volt_sample_res.content), "text/csv")},
    )
    assert upload_res.status_code == 200
    data = upload_res.json()

    assert data["provenance"] == "user_uploaded"
    assert data["membrane_potentials"] is not None
    assert "traces" in data["membrane_potentials"]
    assert "0" in data["membrane_potentials"]["traces"]
    # Check that peak voltage reaches action potential level (+20 mV)
    v0_trace = data["membrane_potentials"]["traces"]["0"]
    assert max(v0_trace) >= 15.0

    # 3. Verify on-demand trace retrieval for uploaded neuron
    trace_res = client.get("/api/v1/simulation/trace/0")
    assert trace_res.status_code == 200
    trace_json = trace_res.json()
    assert "0" in trace_json["traces"]
    assert trace_json["traces"]["0"] == v0_trace


def test_byod_custom_voltage_csv_schema():
    """
    Test custom small CSV schema matching prompt specifications:
    neuron_id,timestamp_ms,membrane_potential_mv
    """
    csv_text = (
        "neuron_id,timestamp_ms,membrane_potential_mv\n"
        "1,0,-65.0\n"
        "1,1,-64.2\n"
        "1,2,-62.5\n"
        "1,3,-58.0\n"
        "1,4,-52.0\n"
        "1,5,-49.5\n"
        "1,6,-65.0\n"
        "2,0,-65.0\n"
        "2,1,-63.8\n"
        "2,2,-60.5\n"
        "2,3,-55.0\n"
        "2,4,-50.5\n"
        "2,5,-65.0\n"
    )
    res = client.post(
        "/api/v1/simulation/upload",
        files={"file": ("custom_voltage.csv", io.BytesIO(csv_text.encode("utf-8")), "text/csv")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["provenance"] == "user_uploaded"
    assert data["membrane_potentials"] is not None
    assert "1" in data["membrane_potentials"]["traces"]
    assert "2" in data["membrane_potentials"]["traces"]
    assert data["membrane_potentials"]["traces"]["1"] == [-65.0, -64.2, -62.5, -58.0, -52.0, -49.5, -65.0]
    assert data["membrane_potentials"]["traces"]["2"] == [-65.0, -63.8, -60.5, -55.0, -50.5, -65.0]
    # Spikes detected from threshold crossings (-50 mV)
    assert len(data["spike_events"]) >= 1


def test_byod_invalid_voltage_csv():
    """Test that non-numeric membrane potential values in CSV are rejected with helpful row error."""
    bad_volt_csv = (
        "neuron_id,timestamp_ms,membrane_potential_mv\n"
        "1,0.0,-65.0\n"
        "1,1.0,not_a_voltage\n"
    )
    res = client.post(
        "/api/v1/simulation/upload",
        files={"file": ("bad_volt.csv", io.BytesIO(bad_volt_csv.encode("utf-8")), "text/csv")},
    )
    assert res.status_code == 400
    assert "Row 3" in res.json()["detail"]
    assert "Membrane potential values must be valid numbers" in res.json()["detail"]


