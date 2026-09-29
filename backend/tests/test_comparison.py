from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_comparison_sessions():
    """Verify available sessions for comparison selector are returned."""
    response = client.get("/api/v1/comparison/sessions")
    assert response.status_code == 200
    sessions = response.json()
    assert isinstance(sessions, list)
    assert len(sessions) > 0
    first = sessions[0]
    assert "session_id" in first
    assert "name" in first
    assert "structures" in first
    assert "unit_count" in first


def test_compare_overview():
    """Verify Overview comparison calculation between two authentic sessions."""
    payload = {
        "session_a_id": 715093703,
        "session_b_id": 719161530,
        "source_a": "allen_experimental",
        "source_b": "allen_experimental",
    }
    response = client.post("/api/v1/comparison/overview", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Check dataset summaries
    assert data["dataset_a"]["session_id"] == 715093703
    assert data["dataset_b"]["session_id"] == 719161530
    assert data["dataset_a"]["total_units"] > 0
    assert data["dataset_b"]["total_units"] > 0
    
    # Check differences
    assert "delta" in data["neuron_diff"]
    assert "delta" in data["trial_diff"]
    assert "delta" in data["duration_diff"]
    
    # Check region overlap
    assert "shared_regions" in data["region_overlap"]
    assert "jaccard_similarity" in data["region_overlap"]
    assert data["region_overlap"]["shared_count"] > 0
    
    # Check stimulus overlap
    assert "shared_stimuli" in data["stimulus_overlap"]
    assert len(data["stimulus_overlap"]["shared_stimuli"]) > 0
    
    # Check scientific summary
    assert isinstance(data["scientific_summary"], str)
    assert len(data["scientific_summary"]) > 20


def test_compare_session():
    """Verify side-by-side Session comparison with region and stimulus breakdowns."""
    payload = {
        "session_a_id": 715093703,
        "session_b_id": 719161530,
    }
    response = client.post("/api/v1/comparison/session", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Session metadata records
    assert data["session_a"]["session_id"] == 715093703
    assert data["session_b"]["session_id"] == 719161530
    
    # Region items
    assert len(data["region_items"]) > 0
    for reg in data["region_items"]:
        assert "region" in reg
        assert "present_in_a" in reg
        assert "present_in_b" in reg
        assert "units_a" in reg
        assert "units_b" in reg
        
    # Stimulus items
    assert len(data["stimulus_items"]) > 0
    for stim in data["stimulus_items"]:
        assert "stimulus_name" in stim
        assert "present_in_a" in stim
        assert "present_in_b" in stim

    # Scientific difference summary
    assert isinstance(data["scientific_difference_summary"], str)
    assert len(data["scientific_difference_summary"]) > 20


def test_compare_population():
    """Verify Population comparison with PCA, statistics, and regional firing rates."""
    payload = {
        "session_a_id": 715093703,
        "session_b_id": 719161530,
    }
    response = client.post("/api/v1/comparison/population", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # PCA
    assert "pca_a" in data
    assert "pca_b" in data
    assert len(data["pca_a"]["points"]) > 0
    assert len(data["pca_b"]["points"]) > 0
    assert len(data["pca_a"]["explained_variance_ratio"]) >= 2
    assert len(data["pca_b"]["explained_variance_ratio"]) >= 2
    assert data["pca_a"]["total_variance_explained_2d"] > 0
    
    # Population Statistics
    stats_a = data["stats_a"]
    stats_b = data["stats_b"]
    assert stats_a["mean_firing_rate"] > 0
    assert stats_b["mean_firing_rate"] > 0
    assert stats_a["active_neuron_count"] > 0
    assert stats_b["active_neuron_count"] > 0
    
    # Activity distribution histograms
    assert len(data["distribution_a"]["bin_edges"]) > 2
    assert len(data["distribution_b"]["bin_edges"]) > 2
    assert sum(data["distribution_a"]["counts"]) > 0
    
    # Region activity
    assert len(data["region_activity"]) > 0
    for ra in data["region_activity"]:
        assert "region" in ra
        assert "mean_firing_rate_a" in ra
        assert "mean_firing_rate_b" in ra
        
    # Population summary
    assert isinstance(data["population_summary"], str)
    assert len(data["population_summary"]) > 20


def test_compare_missing_session_error_handling():
    """Verify proper 404/error handling when an invalid session is requested."""
    payload = {
        "session_a_id": 999999999999,
        "session_b_id": 719161530,
    }
    response = client.post("/api/v1/comparison/overview", json=payload)
    assert response.status_code == 404


def test_compare_allen_vs_upload():
    """Verify Allen vs Uploaded dataset comparison end-to-end."""
    payload = {
        "session_a_id": 715093703,
        "session_b_id": "upload_neuropixels_lab_881",
        "source_a": "allen_experimental",
        "source_b": "user_upload",
    }
    response = client.post("/api/v1/comparison/overview", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["dataset_a"]["source"] == "allen_experimental"
    assert data["dataset_b"]["source"] == "user_upload"
    assert data["region_overlap"]["shared_count"] > 0
    assert len(data["scientific_summary"]) > 20

    # Test Session Comparison for Allen vs Upload
    sess_res = client.post("/api/v1/comparison/session", json=payload)
    assert sess_res.status_code == 200
    sess_data = sess_res.json()
    assert sess_data["session_b"]["session_id"] == "upload_neuropixels_lab_881"
    assert len(sess_data["region_items"]) > 0

    # Test Population Comparison for Allen vs Upload
    pop_res = client.post("/api/v1/comparison/population", json=payload)
    assert pop_res.status_code == 200
    pop_data = pop_res.json()
    assert len(pop_data["pca_b"]["points"]) > 0
    assert pop_data["stats_b"]["mean_firing_rate"] > 0


def test_compare_upload_vs_allen():
    """Verify Uploaded vs Allen dataset comparison."""
    payload = {
        "session_a_id": "upload_two_photon_v1_992",
        "session_b_id": 715093703,
        "source_a": "user_upload",
        "source_b": "allen_experimental",
    }
    response = client.post("/api/v1/comparison/overview", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["dataset_a"]["source"] == "user_upload"
    assert data["dataset_b"]["source"] == "allen_experimental"


def test_upload_custom_dataset_endpoint():
    """Verify POST /api/v1/comparison/upload validates and stores user dataset."""
    sample_upload = {
        "session_metadata": {
            "session_id": "test_upload_session_404",
            "mouse_id": "TEST_MOUSE_404",
            "genotype": "Vip-IRES-Cre",
            "session_type": "optogenetic_tagging",
            "total_units": 45,
            "total_trials": 30,
            "duration_sec": 90.0,
            "available_brain_regions": ["VISp", "CA1"],
            "available_stimuli": ["drifting_gratings", "flashes"]
        },
        "neuron_ids": list(range(45)),
        "unit_rates": [8.5] * 45,
        "neuron_regions": ["VISp"] * 30 + ["CA1"] * 15
    }
    res = client.post("/api/v1/comparison/upload", json=sample_upload)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["session_id"] == "test_upload_session_404"
    assert res_data["status"] == "validated_and_saved"


def test_upload_csv_file_endpoint():
    """Verify POST /api/v1/comparison/upload-file accepts and parses CSV unit tables."""
    csv_content = """unit_id,structure,firing_rate,snr
301,VISp,12.5,3.2
302,VISp,15.1,4.1
303,VISl,8.4,2.9
304,VISl,9.7,3.5
305,CA1,5.2,2.8
"""
    files = {
        "file": ("lab_probe_units.csv", csv_content.encode("utf-8"), "text/csv")
    }
    res = client.post("/api/v1/comparison/upload-file", files=files)
    assert res.status_code == 200
    res_data = res.json()
    assert "upload_lab_probe_units" in res_data["session_id"]
    assert res_data["total_units"] == 5
    assert "VISp" in res_data["structures"]


def test_population_similarity_score():
    """Verify Population Similarity Score computation and breakdown."""
    payload = {
        "session_a_id": 715093703,
        "session_b_id": 719161530,
    }
    res = client.post("/api/v1/comparison/population", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "similarity" in data
    sim = data["similarity"]
    assert 0 <= sim["overall_similarity_pct"] <= 100
    assert 0 <= sim["pca_similarity_pct"] <= 100
    assert 0 <= sim["region_overlap_pct"] <= 100
    assert 0 <= sim["stimulus_overlap_pct"] <= 100
    assert 0 <= sim["rate_similarity_pct"] <= 100
    assert "scale_similarity_pct" in sim
    assert 0 <= sim["scale_similarity_pct"] <= 100


def test_scientific_sanity_identical_session_is_100_percent():
    """Sanity Check: A session compared with itself must yield exactly 100% across all submetrics."""
    payload = {
        "session_a_id": 715093703,
        "session_b_id": 715093703,
    }
    res = client.post("/api/v1/comparison/overview", json=payload)
    assert res.status_code == 200
    data = res.json()
    sim = data["similarity"]
    assert sim["overall_similarity_pct"] == 100.0
    assert sim["pca_similarity_pct"] == 100.0
    assert sim["region_overlap_pct"] == 100.0
    assert sim["stimulus_overlap_pct"] == 100.0
    assert sim["rate_similarity_pct"] == 100.0
    assert sim["scale_similarity_pct"] == 100.0
    assert data["neuron_diff"]["delta"] == 0.0


def test_scientific_sanity_large_yield_difference_penalized():
    """Sanity Check: Datasets with large neuron count differences must not receive near-perfect similarity."""
    payload = {
        "session_a_id": 715093703,  # 2714 units
        "session_b_id": "upload_neuropixels_lab_881",  # 94 units
    }
    res = client.post("/api/v1/comparison/overview", json=payload)
    assert res.status_code == 200
    data = res.json()
    sim = data["similarity"]
    # Overall similarity must be heavily penalized by yield and region disparity (under 50%)
    assert sim["overall_similarity_pct"] < 50.0
    assert sim["scale_similarity_pct"] < 30.0
    assert data["neuron_diff"]["delta"] < -2000.0


def test_scientific_sanity_pca_independence():
    """Verify PCA coordinates and variance ratios are computed independently and not duplicated."""
    payload = {
        "session_a_id": 715093703,
        "session_b_id": "upload_two_photon_v1_992",
    }
    res = client.post("/api/v1/comparison/population", json=payload)
    assert res.status_code == 200
    data = res.json()
    pca_a = data["pca_a"]
    pca_b = data["pca_b"]

    pts_a = [(p["pc1"], p["pc2"]) for p in pca_a["points"]]
    pts_b = [(p["pc1"], p["pc2"]) for p in pca_b["points"]]
    assert pts_a != pts_b
    assert pca_a["explained_variance_ratio"] != pca_b["explained_variance_ratio"]


def test_dataset_swapping_inverts_deltas():
    """Verify swapping Dataset A and B perfectly inverts delta values."""
    payload_ab = {
        "session_a_id": 715093703,
        "session_b_id": 719161530,
    }
    payload_ba = {
        "session_a_id": 719161530,
        "session_b_id": 715093703,
    }
    res_ab = client.post("/api/v1/comparison/overview", json=payload_ab).json()
    res_ba = client.post("/api/v1/comparison/overview", json=payload_ba).json()

    delta_ab = res_ab["neuron_diff"]["delta"]
    delta_ba = res_ba["neuron_diff"]["delta"]
    assert delta_ab == -delta_ba
    assert res_ab["similarity"]["overall_similarity_pct"] == res_ba["similarity"]["overall_similarity_pct"]



