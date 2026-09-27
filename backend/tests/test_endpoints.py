"""Tests for API v1 endpoints across all four modules."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.simulation import LIFSimConfig

client = TestClient(app)

def test_health_check():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert res.json()["version"] == "0.1.0"

def test_list_sessions():
    res = client.get("/api/v1/sessions")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["session_id"] == 715093703

def test_lif_simulation_endpoint():
    config = {
        "v_rest": -70.0,
        "v_thresh": -50.0,
        "v_reset": -65.0,
        "tau_m": 20.0,
        "r_m": 10.0,
        "t_ref": 2.0,
        "duration_ms": 200.0,
        "dt_ms": 0.1,
        "i_inj_type": "step",
        "i_inj_amplitude": 3.0,
        "i_inj_onset_ms": 20.0,
        "i_inj_offset_ms": 180.0,
        "noise_sigma": 0.0
    }
    res = client.post("/api/v1/simulation/lif", json=config)
    assert res.status_code == 200
    data = res.json()
    assert data["provenance"] == "synthetic_lif"
    assert data["total_spikes"] > 0
    assert data["mean_firing_rate_hz"] > 0.0
    assert len(data["v_m"]) == len(data["time_ms"])

def test_decoder_returns_clear_blocker_when_data_not_cached():
    """Verify decoder returns 400 with explicit blocker instead of fabricating synthetic data."""
    payload = {
        "session_id": 715093703,
        "stimulus_name": "drifting_gratings",
        "target_variable": "orientation",
        "model_type": "logistic_regression",
        "test_size": 0.2,
        "cv_folds": 5,
        "time_window_sec": [0.0, 0.5]
    }
    res = client.post("/api/v1/decoder/train", json=payload)
    assert res.status_code == 400
    assert "Data Blocker" in res.json()["detail"]
    assert "synthetic data will not be substituted" in res.json()["detail"]

def test_comparison_endpoint():
    payload = {
        "analysis_type": "firing_statistics",
        "include_synthetic_lif": True
    }
    res = client.post("/api/v1/comparison/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "synthetic" in data
    assert data["synthetic"]["firing_stats"]["provenance"] == "synthetic_lif"
