"""Tests for the Explorer Module endpoints, Canonical representation, PCA caching, and Upload validation."""
import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.explorer_service import explorer_service

client = TestClient(app)

def test_explorer_sessions_retrieval():
    """Verify GET /api/v1/explorer/sessions returns sessions with required fields."""
    res = client.get("/api/v1/explorer/sessions")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first = data[0]
    assert "session_id" in first
    assert "mouse_id" in first
    assert "genotype" in first
    assert "available_brain_regions" in first
    assert "available_stimuli" in first
    assert "provenance" in first
    assert len(first["available_brain_regions"]) > 0
    assert len(first["available_stimuli"]) > 0

def test_explorer_single_session_metadata():
    """Verify GET /api/v1/explorer/session/{session_id} returns session metadata."""
    res = client.get("/api/v1/explorer/session/715093703")
    assert res.status_code == 200
    data = res.json()
    assert str(data["session_id"]) == "715093703"
    assert "available_brain_regions" in data
    assert "available_stimuli" in data
    assert data["total_units"] > 0
    assert data["total_trials"] > 0

def test_explorer_regions_and_stimuli():
    """Verify GET /api/v1/explorer/regions and /api/v1/explorer/stimuli."""
    reg_res = client.get("/api/v1/explorer/regions")
    assert reg_res.status_code == 200
    regions = reg_res.json()
    assert "VISp" in regions
    assert "LGd" in regions
    assert "CA1" in regions

    stim_res = client.get("/api/v1/explorer/stimuli")
    assert stim_res.status_code == 200
    stimuli = stim_res.json()
    assert "drifting_gratings" in stimuli
    assert "natural_scenes" in stimuli

def test_explorer_trial_metadata():
    """Verify GET /api/v1/explorer/trial/{trial_id} returns trial presentation details."""
    res = client.get("/api/v1/explorer/trial/1?session_id=715093703")
    assert res.status_code == 200
    data = res.json()
    assert str(data["trial_id"]) == "1"
    assert data["stimulus"] == "drifting_gratings"
    assert "duration" in data

def test_explorer_pca_generation_and_dimensions():
    """Verify GET /api/v1/explorer/pca computes PCA server-side and supports PC dimensions."""
    # PC1 vs PC2
    res = client.get("/api/v1/explorer/pca?session_id=715093703&pc_x=1&pc_y=2")
    assert res.status_code == 200
    data = res.json()
    assert "session_id" in data
    assert "explained_variance_ratio" in data
    assert len(data["explained_variance_ratio"]) >= 2
    assert "points" in data
    assert len(data["points"]) > 0
    p0 = data["points"][0]
    assert "trial_id" in p0
    assert "x" in p0
    assert "y" in p0
    assert "label" in p0
    assert "stimulus" in p0
    assert "region" in p0

    # PC1 vs PC3
    res_pc3 = client.get("/api/v1/explorer/pca?session_id=715093703&pc_x=1&pc_y=3")
    assert res_pc3.status_code == 200
    data_pc3 = res_pc3.json()
    assert data_pc3["pc_x"] == 1
    assert data_pc3["pc_y"] == 3

def test_explorer_pca_caching_behavior():
    """Verify PCA caching: subsequent requests hit cache without error."""
    # Ensure cache directory exists and contains cached output
    res = client.get("/api/v1/explorer/pca?session_id=715093703&pc_x=1&pc_y=2")
    assert res.status_code == 200

    cache_files = list(explorer_service.pca_cache_dir.glob("*.json"))
    assert len(cache_files) > 0

    # Second call should load instantly from disk cache
    res2 = client.get("/api/v1/explorer/pca?session_id=715093703&pc_x=1&pc_y=2")
    assert res2.status_code == 200
    assert res2.json() == res.json()

def test_explorer_heatmap_generation():
    """Verify GET /api/v1/explorer/heatmap produces neurons x time matrix and supports normalization."""
    # Raw
    res = client.get("/api/v1/explorer/heatmap?session_id=715093703&trial_id=1&normalize=none&max_neurons=20")
    assert res.status_code == 200
    data = res.json()
    assert len(data["neuron_ids"]) == 20
    assert len(data["time_bins"]) > 0
    assert len(data["matrix"]) == 20
    assert len(data["matrix"][0]) == len(data["time_bins"])
    assert data["normalization"] == "none"

    # Z-score normalization
    res_z = client.get("/api/v1/explorer/heatmap?session_id=715093703&trial_id=1&normalize=z-score&max_neurons=15")
    assert res_z.status_code == 200
    data_z = res_z.json()
    assert data_z["normalization"] == "z-score"

def test_explorer_population_trace():
    """Verify GET /api/v1/explorer/population-trace returns trace and supports smoothing and averaging."""
    res = client.get("/api/v1/explorer/population-trace?session_id=715093703&trial_id=1&smoothing_window=3&averaging_method=mean")
    assert res.status_code == 200
    data = res.json()
    assert len(data["timestamps"]) > 0
    assert len(data["mean_firing_rate"]) == len(data["timestamps"])
    assert data["averaging_method"] == "mean"
    assert data["smoothing_window"] == 3

def test_explorer_upload_validation_missing_columns():
    """Verify upload fails with 400 when required columns are missing."""
    invalid_csv = b"trial_id,time,neuron_id\n1,0.0,unit_1\n"
    res = client.post(
        "/api/v1/explorer/upload",
        files={"file": ("invalid.csv", io.BytesIO(invalid_csv), "text/csv")}
    )
    assert res.status_code == 400
    assert "missing required columns" in res.json()["detail"].lower()

def test_explorer_upload_validation_non_csv():
    """Verify upload rejects non-CSV files."""
    res = client.post(
        "/api/v1/explorer/upload",
        files={"file": ("test.txt", io.BytesIO(b"random text"), "text/plain")}
    )
    assert res.status_code == 400
    assert "CSV files" in res.json()["detail"]

def test_explorer_upload_and_e2e_visualization():
    """Verify successful upload, ingestion to CanonicalNeuralDataset, and subsequent PCA/heatmap execution."""
    valid_csv = """trial_id,time,neuron_id,firing_rate,label,region
1,0.0,u1,2.5,stim_alpha,VISp
1,0.1,u1,10.0,stim_alpha,VISp
1,0.0,u2,1.0,stim_alpha,VISp
1,0.1,u2,4.0,stim_alpha,VISp
2,0.0,u1,1.0,stim_beta,VISp
2,0.1,u1,2.0,stim_beta,VISp
2,0.0,u2,8.0,stim_beta,VISp
2,0.1,u2,12.0,stim_beta,VISp
""".encode("utf-8")

    res = client.post(
        "/api/v1/explorer/upload",
        files={"file": ("user_dataset.csv", io.BytesIO(valid_csv), "text/csv")}
    )
    assert res.status_code == 200
    data = res.json()
    uploaded_id = data["session_id"]
    assert uploaded_id.startswith("upload_")
    assert data["provenance"] == "user_uploaded"
    assert data["total_units"] == 2
    assert data["total_trials"] == 2

    # Query sessions to ensure upload appears
    sess_res = client.get("/api/v1/explorer/sessions")
    assert sess_res.status_code == 200
    all_sessions = sess_res.json()
    assert any(s["session_id"] == uploaded_id for s in all_sessions)

    # PCA on uploaded session
    pca_res = client.get(f"/api/v1/explorer/pca?session_id={uploaded_id}")
    assert pca_res.status_code == 200
    pca_data = pca_res.json()
    assert len(pca_data["points"]) == 2

    # Heatmap on uploaded session
    hm_res = client.get(f"/api/v1/explorer/heatmap?session_id={uploaded_id}&trial_id=1")
    assert hm_res.status_code == 200
    hm_data = hm_res.json()
    assert len(hm_data["neuron_ids"]) == 2

    # Population trace on uploaded session
    pt_res = client.get(f"/api/v1/explorer/population-trace?session_id={uploaded_id}&trial_id=1")
    assert pt_res.status_code == 200
    assert len(pt_res.json()["mean_firing_rate"]) == 2
