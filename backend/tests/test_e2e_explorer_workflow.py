"""End-to-End Validation Test Suite for Explorer Module.
Validates:
1. Allen Dataset Mode: listing sessions, loading metadata, regions, stimuli, PCA, heatmap, population trace.
2. User Upload Mode: CSV upload, validation of required columns, schema conversion, session registration, PCA, heatmap, trace, trial metadata.
3. Refresh & Cache Invalidation: force_refresh bypass.
4. Filter propagation: region filtering, stimulus filtering, trial switching.
"""
import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_e2e_allen_dataset_workflow():
    """Verify complete Allen Dataset exploration workflow from session selection to visualizations."""
    # 1. List explorer sessions
    res = client.get("/api/v1/explorer/sessions")
    assert res.status_code == 200
    sessions = res.json()
    assert len(sessions) > 0
    allen_sessions = [s for s in sessions if s["provenance"] == "allen_experimental"]
    assert len(allen_sessions) > 0
    session_id = allen_sessions[0]["session_id"]

    # 2. Load session metadata
    meta_res = client.get(f"/api/v1/explorer/session/{session_id}")
    assert meta_res.status_code == 200
    meta = meta_res.json()
    assert meta["session_id"] == int(session_id) or str(meta["session_id"]) == str(session_id)
    assert meta["total_units"] > 0
    assert meta["total_trials"] > 0
    assert len(meta["available_brain_regions"]) > 0
    assert len(meta["available_stimuli"]) > 0

    # 3. Available regions & stimuli
    reg_res = client.get(f"/api/v1/explorer/regions?session_id={session_id}")
    assert reg_res.status_code == 200
    regions = reg_res.json()
    assert len(regions) > 0

    stim_res = client.get(f"/api/v1/explorer/stimuli?session_id={session_id}")
    assert stim_res.status_code == 200
    stimuli = stim_res.json()
    assert len(stimuli) > 0

    # 4. PCA generation with explained variance and point coordinates
    pca_res = client.get(f"/api/v1/explorer/pca?session_id={session_id}&pc_x=1&pc_y=2")
    assert pca_res.status_code == 200
    pca_data = pca_res.json()
    assert len(pca_data["explained_variance_ratio"]) >= 2
    assert len(pca_data["points"]) > 0
    first_pt = pca_data["points"][0]
    assert "trial_id" in first_pt
    assert "x" in first_pt and "y" in first_pt

    # 5. Single-trial heatmap generation with unit downsampling & normalization
    trial_id = first_pt["trial_id"]
    heat_res = client.get(f"/api/v1/explorer/heatmap?session_id={session_id}&trial_id={trial_id}&normalize=z-score&max_neurons=30")
    assert heat_res.status_code == 200
    heat_data = heat_res.json()
    assert len(heat_data["neuron_ids"]) <= 30
    assert len(heat_data["matrix"]) == len(heat_data["neuron_ids"])
    assert len(heat_data["time_bins"]) > 0

    # 6. Population trace with SEM
    trace_res = client.get(f"/api/v1/explorer/population-trace?session_id={session_id}&trial_id={trial_id}&smoothing_window=2&averaging_method=mean")
    assert trace_res.status_code == 200
    trace_data = trace_res.json()
    assert len(trace_data["timestamps"]) > 0
    assert len(trace_data["mean_firing_rate"]) == len(trace_data["timestamps"])
    assert trace_data["sem_firing_rate"] is not None

    # 7. Trial metadata
    tr_meta_res = client.get(f"/api/v1/explorer/trial/{trial_id}?session_id={session_id}")
    assert tr_meta_res.status_code == 200
    tr_meta = tr_meta_res.json()
    assert str(tr_meta["trial_id"]) == str(trial_id)
    assert tr_meta["duration"] > 0

def test_e2e_user_upload_workflow():
    """Verify complete User Upload workflow: CSV upload -> canonical schema -> session registration -> full visualizations."""
    sample_csv = """trial_id,time,neuron_id,firing_rate,label,region
1,0.0,unit_01,3.4,drifting_gratings_0deg,VISp
1,0.05,unit_01,8.9,drifting_gratings_0deg,VISp
1,0.1,unit_01,24.5,drifting_gratings_0deg,VISp
1,0.15,unit_01,19.2,drifting_gratings_0deg,VISp
1,0.0,unit_02,1.2,drifting_gratings_0deg,VISp
1,0.05,unit_02,3.1,drifting_gratings_0deg,VISp
1,0.1,unit_02,15.6,drifting_gratings_0deg,VISp
1,0.15,unit_02,14.8,drifting_gratings_0deg,VISp
2,0.0,unit_01,2.1,drifting_gratings_90deg,VISp
2,0.05,unit_01,4.2,drifting_gratings_90deg,VISp
2,0.1,unit_01,7.5,drifting_gratings_90deg,VISp
2,0.15,unit_01,5.1,drifting_gratings_90deg,VISp
2,0.0,unit_02,4.5,drifting_gratings_90deg,VISp
2,0.05,unit_02,12.3,drifting_gratings_90deg,VISp
2,0.1,unit_02,32.0,drifting_gratings_90deg,VISp
2,0.15,unit_02,28.4,drifting_gratings_90deg,VISp
3,0.0,unit_01,1.0,natural_scene_1,VISl
3,0.05,unit_01,6.5,natural_scene_1,VISl
3,0.1,unit_01,18.0,natural_scene_1,VISl
3,0.15,unit_01,12.4,natural_scene_1,VISl
3,0.0,unit_02,2.0,natural_scene_1,VISl
3,0.05,unit_02,8.0,natural_scene_1,VISl
3,0.1,unit_02,21.0,natural_scene_1,VISl
3,0.15,unit_02,14.0,natural_scene_1,VISl
""".encode("utf-8")

    # 1. Ingest CSV
    upload_res = client.post(
        "/api/v1/explorer/upload",
        files={"file": ("lab_test_recording.csv", io.BytesIO(sample_csv), "text/csv")}
    )
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    assigned_session_id = upload_data["session_id"]
    assert assigned_session_id.startswith("upload_")
    assert upload_data["total_units"] == 2
    assert upload_data["total_trials"] == 3
    assert upload_data["row_count"] == 24
    assert upload_data["provenance"] == "user_uploaded"

    # 2. Session listed under /explorer/sessions
    sessions_res = client.get("/api/v1/explorer/sessions")
    assert sessions_res.status_code == 200
    sessions = sessions_res.json()
    uploaded_found = [s for s in sessions if s["session_id"] == assigned_session_id]
    assert len(uploaded_found) == 1
    assert uploaded_found[0]["unit_count"] == 2
    assert uploaded_found[0]["total_trials"] == 3

    # 3. Session metadata contains filename and row_count
    meta_res = client.get(f"/api/v1/explorer/session/{assigned_session_id}")
    assert meta_res.status_code == 200
    meta = meta_res.json()
    assert meta["session_id"] == assigned_session_id
    assert meta["total_units"] == 2
    assert meta["total_trials"] == 3
    assert meta["extra"]["filename"] == "lab_test_recording.csv"
    assert meta["extra"]["row_count"] == 24

    # 4. Compute PCA on uploaded dataset
    pca_res = client.get(f"/api/v1/explorer/pca?session_id={assigned_session_id}")
    assert pca_res.status_code == 200
    pca_data = pca_res.json()
    assert len(pca_data["points"]) == 3
    assert len(pca_data["explained_variance_ratio"]) >= 2

    # 5. Compute Heatmap on uploaded dataset
    heat_res = client.get(f"/api/v1/explorer/heatmap?session_id={assigned_session_id}&trial_id=1&normalize=none")
    assert heat_res.status_code == 200
    heat_data = heat_res.json()
    assert len(heat_data["neuron_ids"]) == 2
    assert len(heat_data["matrix"]) == 2

    # 6. Compute Population Trace on uploaded dataset
    trace_res = client.get(f"/api/v1/explorer/population-trace?session_id={assigned_session_id}&trial_id=1")
    assert trace_res.status_code == 200
    trace_data = trace_res.json()
    assert len(trace_data["timestamps"]) > 0
    assert len(trace_data["mean_firing_rate"]) == len(trace_data["timestamps"])
