"""Comprehensive unit and integration tests for the Decoder module."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.decoder_service import decoder_service
from app.schemas.decoder import DecoderTrainRequest

client = TestClient(app)

# =====================================================================
# Dataset and Target Retrieval Tests
# =====================================================================

def test_get_decoder_datasets():
    """Verify available neural datasets endpoint returns session metadata."""
    res = client.get("/api/v1/decoder/datasets")
    assert res.status_code == 200
    datasets = res.json()
    assert isinstance(datasets, list)
    assert len(datasets) > 0
    first = datasets[0]
    assert "dataset_id" in first
    assert "session_metadata" in first
    assert "available_units" in first
    assert "available_brain_regions" in first
    assert first["provenance"] == "allen_experimental"

def test_get_decoder_dataset_detail():
    """Verify detailed dataset retrieval for session 715093703."""
    res = client.get("/api/v1/decoder/dataset/715093703")
    assert res.status_code == 200
    data = res.json()
    assert data["session_id"] == 715093703
    assert data["unit_count"] > 0
    assert len(data["available_brain_regions"]) > 0
    assert "VISp" in data["available_brain_regions"]
    assert "unit_region_mapping" in data

def test_get_decoder_dataset_not_found():
    """Verify 400 Data Blocker is returned for non-cached datasets."""
    res = client.get("/api/v1/decoder/dataset/999999999")
    assert res.status_code == 400
    assert "Data Blocker" in res.json()["detail"]

def test_get_decoding_targets():
    """Verify target discovery returns orientation and stimulus protocols."""
    res = client.get("/api/v1/decoder/targets?dataset_id=715093703")
    assert res.status_code == 200
    data = res.json()
    targets = {t["name"]: t for t in data["targets"]}
    assert "orientation" in targets
    assert "stimulus" in targets
    assert targets["orientation"]["class_count"] == 8
    assert targets["orientation"]["compatible_stimulus"] == "drifting_gratings"

# =====================================================================
# Decoder Model Training Tests (LR, SVM, RF)
# =====================================================================

def test_train_logistic_regression():
    """Verify Logistic Regression trains and populates run record with signed weights."""
    payload = {
        "session_id": 715093703,
        "stimulus_name": "drifting_gratings",
        "target_variable": "orientation",
        "model_type": "logistic_regression",
        "model_parameters": {"C": 1.0, "max_iter": 500},
        "test_size": 0.25,
        "cv_folds": 3,
        "random_state": 42
    }
    res = client.post("/api/v1/decoder/train", json=payload)
    assert res.status_code == 200
    run = res.json()
    assert run["status"] == "completed"
    assert run["model_type"] == "logistic_regression"
    assert run["test_accuracy"] is not None
    assert run["cv_mean_accuracy"] is not None
    assert run["f1_score_macro"] is not None
    assert len(run["classes"]) == 8

    # Verify run retrieval
    run_id = run["run_id"]
    r_get = client.get(f"/api/v1/decoder/run/{run_id}")
    assert r_get.status_code == 200
    assert r_get.json()["run_id"] == run_id

def test_train_linear_svm():
    """Verify Linear SVM trains and exposes decision scores (not probabilities)."""
    payload = {
        "session_id": 715093703,
        "target_variable": "stimulus",
        "model_type": "linear_svm",
        "model_parameters": {"C": 0.5, "max_iter": 1000},
        "test_size": 0.2,
        "cv_folds": 3,
        "random_state": 42
    }
    res = client.post("/api/v1/decoder/train", json=payload)
    assert res.status_code == 200
    run = res.json()
    run_id = run["run_id"]

    # Check predictions endpoint for score_type
    p_res = client.get(f"/api/v1/decoder/run/{run_id}/predictions")
    assert p_res.status_code == 200
    preds_data = p_res.json()
    assert preds_data["score_type"] == "decision_score"
    for p in preds_data["predictions"]:
        assert p["decision_score"] is not None
        assert p["confidence"] is None  # Linear SVM must NOT fabricate probability!

def test_train_random_forest():
    """Verify Random Forest trains, calculates Gini importance, and exposes probabilities."""
    payload = {
        "session_id": 715093703,
        "target_variable": "orientation",
        "model_type": "random_forest",
        "model_parameters": {"n_estimators": 50, "max_depth": 5},
        "test_size": 0.25,
        "cv_folds": 3,
        "random_state": 42
    }
    res = client.post("/api/v1/decoder/train", json=payload)
    assert res.status_code == 200
    run = res.json()
    run_id = run["run_id"]

    # Check feature importance for Gini importance
    f_res = client.get(f"/api/v1/decoder/run/{run_id}/feature-importance")
    assert f_res.status_code == 200
    feat_data = f_res.json()
    assert feat_data["interpretation_type"] == "feature_importance_gini"
    assert "Gini" in feat_data["explanation_note"]
    for f in feat_data["features"][:10]:
        assert f["importance_score"] >= 0.0
        assert f["signed_weight"] is None
        assert f["direction"] == "n/a"

# =====================================================================
# Performance & Cross-Validation Tests
# =====================================================================

def test_performance_metrics_separation():
    """Verify held-out test metrics and cross-validation metrics are distinctly recorded."""
    payload = {
        "session_id": 715093703,
        "target_variable": "stimulus",
        "model_type": "logistic_regression",
        "test_size": 0.2,
        "cv_folds": 4,
        "random_state": 42
    }
    train_res = client.post("/api/v1/decoder/train", json=payload)
    run_id = train_res.json()["run_id"]

    res = client.get(f"/api/v1/decoder/run/{run_id}/performance")
    assert res.status_code == 200
    data = res.json()

    # Held-out
    held = data["held_out_metrics"]
    assert "accuracy" in held
    assert "balanced_accuracy" in held
    assert "f1_macro" in held
    assert "per_class" in held
    assert held["support"] > 0

    # Cross-validation
    cv = data["cross_validation"]
    assert "mean_accuracy" in cv
    assert "std_accuracy" in cv
    assert "fold_metrics" in cv
    assert len(cv["fold_metrics"]) > 0

# =====================================================================
# Confusion Matrix Tests
# =====================================================================

def test_confusion_matrix():
    """Verify confusion matrix contains count and row-normalized values matching held-out test size."""
    payload = {
        "session_id": 715093703,
        "target_variable": "orientation",
        "model_type": "logistic_regression",
        "test_size": 0.25,
        "cv_folds": 3,
        "random_state": 42
    }
    train_res = client.post("/api/v1/decoder/train", json=payload)
    run_id = train_res.json()["run_id"]

    res = client.get(f"/api/v1/decoder/run/{run_id}/confusion-matrix")
    assert res.status_code == 200
    cm_data = res.json()
    labels = cm_data["class_labels"]
    matrix = cm_data["matrix"]
    norm_matrix = cm_data["normalized_matrix"]

    assert len(matrix) == len(labels)
    assert len(matrix[0]) == len(labels)
    assert len(norm_matrix) == len(labels)
    assert cm_data["total_samples"] == 8

# =====================================================================
# Feature Importance & CCFv3 Mapping Tests
# =====================================================================

def test_brain_mapping_ccfv3():
    """Verify neural units map to CCFv3 brain areas and aggregate regional importance."""
    payload = {
        "session_id": 715093703,
        "target_variable": "orientation",
        "model_type": "logistic_regression",
        "test_size": 0.25,
        "cv_folds": 3,
        "random_state": 42
    }
    train_res = client.post("/api/v1/decoder/train", json=payload)
    run_id = train_res.json()["run_id"]

    res = client.get(f"/api/v1/decoder/run/{run_id}/brain-mapping")
    assert res.status_code == 200
    data = res.json()
    assert data["mapped_units"] > 0
    assert len(data["regional_aggregations"]) > 0

    first_reg = data["regional_aggregations"][0]
    assert "region" in first_reg
    assert "mean_importance" in first_reg
    assert "hierarchy" in first_reg
    assert "unit_count" in first_reg
    assert "causal" in data["scientific_note"].lower()

# =====================================================================
# Prediction Inspector Tests
# =====================================================================

def test_prediction_inspector_and_trial_detail():
    """Verify trial-level predictions and single-trial feature drill-down."""
    payload = {
        "session_id": 715093703,
        "target_variable": "orientation",
        "model_type": "logistic_regression",
        "test_size": 0.25,
        "cv_folds": 3,
        "random_state": 42
    }
    train_res = client.post("/api/v1/decoder/train", json=payload)
    run_id = train_res.json()["run_id"]

    res = client.get(f"/api/v1/decoder/run/{run_id}/predictions")
    assert res.status_code == 200
    preds_data = res.json()
    assert len(preds_data["predictions"]) > 0

    first_trial = preds_data["predictions"][0]
    tid = first_trial["trial_id"]

    detail_res = client.get(f"/api/v1/decoder/run/{run_id}/predictions/{tid}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["trial_id"] == tid
    assert len(detail_data["top_neural_features"]) > 0
    assert "firing_rate" in detail_data["top_neural_features"][0]

# =====================================================================
# Error Handling Tests
# =====================================================================

def test_invalid_model_type():
    """Verify invalid model selection is rejected with a clear message."""
    payload = {
        "session_id": 715093703,
        "target_variable": "orientation",
        "model_type": "unsupported_deep_net"
    }
    res = client.post("/api/v1/decoder/train", json=payload)
    assert res.status_code == 400
    assert "Unsupported model type" in res.json()["detail"]

def test_missing_run_id():
    """Verify 404 for nonexistent run ID."""
    res = client.get("/api/v1/decoder/run/nonexistent_run_12345")
    assert res.status_code == 404

def test_region_filtering():
    """Verify unit filtering by CCFv3 brain structures."""
    payload = {
        "session_id": 715093703,
        "target_variable": "orientation",
        "model_type": "logistic_regression",
        "selected_structures": ["VISp"],
        "test_size": 0.25,
        "cv_folds": 3
    }
    res = client.post("/api/v1/decoder/train", json=payload)
    assert res.status_code == 200
    run_id = res.json()["run_id"]

    feat_res = client.get(f"/api/v1/decoder/run/{run_id}/feature-importance")
    assert feat_res.status_code == 200
    for f in feat_res.json()["features"]:
        assert f["structure"] == "VISp"
