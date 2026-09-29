"""Decoder service: neural population decoding, K-fold CV, explainability, and CCFv3 mapping."""
import os
import json
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from collections import Counter

import numpy as np
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

from ..schemas.decoder import (
    DecoderTrainRequest,
    DecoderResult,
    FeatureImportanceRecord,
    DecoderDatasetSummary,
    DecoderDatasetDetail,
    DecodingTargetInfo,
    TargetsResponse,
    PerClassMetric,
    FoldMetric,
    CrossValidationMetrics,
    HeldOutMetrics,
    PerformanceResponse,
    ConfusionMatrixResponse,
    FeatureImportanceItem,
    FeatureImportanceResponse,
    RegionAggregation,
    UnitBrainMap,
    BrainMappingResponse,
    TrialPrediction,
    PredictionsResponse,
    TrialNeuralFeature,
    PredictionDetailResponse,
    DecoderRunResponse,
)
from ..services.allen_data_service import allen_data_service

logger = logging.getLogger(__name__)

# Official CCFv3 Hierarchical Metadata for Visual Coding Structures
CCFV3_METADATA: Dict[str, Dict[str, str]] = {
    "VISp": {
        "full_name": "Primary visual area",
        "hierarchy": "Isocortex > Visual areas > VISp",
        "division": "Visual Cortex"
    },
    "VISl": {
        "full_name": "Lateral visual area",
        "hierarchy": "Isocortex > Visual areas > VISl",
        "division": "Visual Cortex"
    },
    "VISam": {
        "full_name": "Anteromedial visual area",
        "hierarchy": "Isocortex > Visual areas > VISam",
        "division": "Visual Cortex"
    },
    "VISpm": {
        "full_name": "Posteromedial visual area",
        "hierarchy": "Isocortex > Visual areas > VISpm",
        "division": "Visual Cortex"
    },
    "VISrl": {
        "full_name": "Rostrolateral visual area",
        "hierarchy": "Isocortex > Visual areas > VISrl",
        "division": "Visual Cortex"
    },
    "VISal": {
        "full_name": "Anterolateral visual area",
        "hierarchy": "Isocortex > Visual areas > VISal",
        "division": "Visual Cortex"
    },
    "LGd": {
        "full_name": "Dorsal part of the lateral geniculate complex",
        "hierarchy": "Thalamus > Sensory-motor cortex related > LGd",
        "division": "Thalamus"
    },
    "LP": {
        "full_name": "Lateral posterior nucleus of the thalamus",
        "hierarchy": "Thalamus > Sensory-motor cortex related > LP",
        "division": "Thalamus"
    },
    "CA1": {
        "full_name": "Field CA1, Hippocampus",
        "hierarchy": "Hippocampal formation > Ammon's horn > CA1",
        "division": "Hippocampus"
    },
    "CA3": {
        "full_name": "Field CA3, Hippocampus",
        "hierarchy": "Hippocampal formation > Ammon's horn > CA3",
        "division": "Hippocampus"
    },
    "DG": {
        "full_name": "Dentate gyrus",
        "hierarchy": "Hippocampal formation > Dentate gyrus > DG",
        "division": "Hippocampus"
    },
    "APN": {
        "full_name": "Anterior pretectal nucleus",
        "hierarchy": "Midbrain > Pretectal region > APN",
        "division": "Midbrain"
    },
    "NOT": {
        "full_name": "Nucleus of the optic tract",
        "hierarchy": "Midbrain > Visual related > NOT",
        "division": "Midbrain"
    },
}


class DecoderService:
    """
    Core neuroscience population decoding engine.
    Supports Logistic Regression, Linear SVM, and Random Forest on authentic neural vectors.
    Provides held-out evaluation, stratified K-fold cross-validation, feature importance explainability,
    CCFv3 anatomical mapping, and trial-level prediction inspection.
    """

    def __init__(self):
        self._runs: Dict[str, Dict[str, Any]] = {}
        self._canonical_sessions_dir = Path(__file__).resolve().parent.parent.parent / "data" / "cache" / "sessions"

    # =========================================================================
    # Data Ingestion & Canonical Access
    # =========================================================================

    def _load_canonical_session(self, session_id: int) -> Dict[str, Any]:
        """Load canonical session JSON from cache warehouse."""
        target_file = self._canonical_sessions_dir / f"canonical_{session_id}.json"
        if not target_file.exists():
            raise FileNotFoundError(
                f"Authentic spike times for Allen session {session_id} not downloaded. "
                f"Full session NWB (~2.6 GB) or extracted canonical data must be retrieved first. "
                f"NeuroDecode will not substitute synthetic data for experimental requests."
            )
        try:
            with open(target_file, "r") as f:
                return json.load(f)
        except Exception as e:
            raise ValueError(f"Failed to parse canonical session {session_id}: {str(e)}")

    def get_available_datasets(self) -> List[DecoderDatasetSummary]:
        """Return all available experimental neural datasets for population decoding."""
        datasets = []
        if self._canonical_sessions_dir.exists():
            for f in self._canonical_sessions_dir.glob("canonical_*.json"):
                try:
                    with open(f, "r") as json_f:
                        d = json.load(json_f)
                    meta = d.get("session_metadata", {})
                    sid = meta.get("session_id")
                    if sid:
                        datasets.append(
                            DecoderDatasetSummary(
                                dataset_id=str(sid),
                                session_id=int(sid),
                                name=f"Allen Neuropixels Session {sid} ({meta.get('session_type', 'Visual Coding')})",
                                session_metadata=meta,
                                available_labels=d.get("labels", []),
                                available_brain_regions=meta.get("available_brain_regions", d.get("brain_region_information", [])),
                                available_units=d.get("neuron_ids", []),
                                available_stimuli=meta.get("available_stimuli", d.get("stimulus_information", [])),
                                trial_count=meta.get("total_trials", len(d.get("trial_metadata", []))),
                                unit_count=meta.get("total_units", len(d.get("neuron_ids", []))),
                                provenance=d.get("provenance", "allen_experimental"),
                            )
                        )
                except Exception as e:
                    logger.warning("Error reading %s: %s", f, e)

        # Fallback to check allen_data_service available sessions
        if not datasets and allen_data_service.is_ready():
            for s in allen_data_service.get_available_sessions():
                datasets.append(
                    DecoderDatasetSummary(
                        dataset_id=str(s.session_id),
                        session_id=s.session_id,
                        name=f"Allen Neuropixels Session {s.session_id}",
                        session_metadata=s.model_dump(),
                        available_labels=[],
                        available_brain_regions=s.structures,
                        available_units=[],
                        available_stimuli=["drifting_gratings", "natural_scenes"],
                        trial_count=0,
                        unit_count=s.unit_count,
                        provenance="allen_experimental",
                    )
                )

        return datasets

    def get_dataset_detail(self, dataset_id: str) -> DecoderDatasetDetail:
        """Return comprehensive metadata for an individual dataset."""
        try:
            sid = int(dataset_id)
        except ValueError:
            raise ValueError(f"Invalid dataset/session ID: {dataset_id}")

        data = self._load_canonical_session(sid)
        meta = data.get("session_metadata", {})
        trials = data.get("trial_metadata", [])
        neuron_ids = data.get("neuron_ids", [])
        regions_map = data.get("neuron_regions", {})

        stimulus_counts = Counter(t.get("stimulus", "unknown") for t in trials)
        condition_counts = Counter(t.get("label", "unknown") for t in trials)

        return DecoderDatasetDetail(
            dataset_id=str(sid),
            session_id=sid,
            name=f"Allen Neuropixels Session {sid}",
            session_metadata=meta,
            available_labels=data.get("labels", []),
            available_brain_regions=meta.get("available_brain_regions", data.get("brain_region_information", [])),
            available_units=neuron_ids,
            available_stimuli=meta.get("available_stimuli", data.get("stimulus_information", [])),
            unit_region_mapping=regions_map,
            trial_count=len(trials),
            unit_count=len(neuron_ids),
            stimulus_counts=dict(stimulus_counts),
            condition_counts=dict(condition_counts),
            provenance=data.get("provenance", "allen_experimental"),
        )

    def get_decoding_targets(self, dataset_id: str) -> TargetsResponse:
        """Discover and describe all valid decoding targets within the dataset."""
        try:
            sid = int(dataset_id)
        except ValueError:
            raise ValueError(f"Invalid dataset ID: {dataset_id}")

        data = self._load_canonical_session(sid)
        trials = data.get("trial_metadata", [])

        targets: List[DecodingTargetInfo] = []

        # 1. Stimulus Protocol Identity
        stim_counts = Counter(t.get("stimulus") for t in trials if t.get("stimulus"))
        if len(stim_counts) >= 2:
            targets.append(
                DecodingTargetInfo(
                    name="stimulus",
                    display_name="Stimulus Protocol",
                    description="Decodes which visual stimulus protocol was presented (e.g. drifting gratings vs natural scenes vs movies).",
                    target_type="categorical",
                    classes=sorted(list(stim_counts.keys())),
                    class_count=len(stim_counts),
                    sample_count=sum(stim_counts.values()),
                    class_balance=dict(stim_counts),
                    compatible_stimulus=None
                )
            )

        # 2. Drifting Gratings Orientation
        orient_trials = [
            t for t in trials
            if t.get("stimulus") == "drifting_gratings" and t.get("parameters", {}).get("orientation") is not None
        ]
        if orient_trials:
            orient_counts = Counter(
                f"{int(t['parameters']['orientation'])}deg" for t in orient_trials
            )
            if len(orient_counts) >= 2:
                targets.append(
                    DecodingTargetInfo(
                        name="orientation",
                        display_name="Drifting Gratings Orientation",
                        description="Decodes the motion orientation (0° to 315° in 45° increments) of high-contrast drifting gratings.",
                        target_type="categorical",
                        classes=sorted(list(orient_counts.keys()), key=lambda x: int(x.replace("deg", ""))),
                        class_count=len(orient_counts),
                        sample_count=len(orient_trials),
                        class_balance=dict(orient_counts),
                        compatible_stimulus="drifting_gratings"
                    )
                )

        # 3. Specific Condition Label
        label_trials = [t for t in trials if t.get("label")]
        label_counts = Counter(t["label"] for t in label_trials)
        valid_labels = {k: v for k, v in label_counts.items() if v >= 2}
        if len(valid_labels) >= 2:
            targets.append(
                DecodingTargetInfo(
                    name="label",
                    display_name="Trial Condition Label",
                    description="Decodes specific experimental stimulus conditions with multiple presentation repeats.",
                    target_type="categorical",
                    classes=sorted(list(valid_labels.keys())),
                    class_count=len(valid_labels),
                    sample_count=sum(valid_labels.values()),
                    class_balance=dict(valid_labels),
                    compatible_stimulus=None
                )
            )

        return TargetsResponse(
            session_id=sid,
            dataset_id=str(sid),
            targets=targets
        )

    # =========================================================================
    # Feature Matrix & Label Preparation
    # =========================================================================

    def _prepare_data_matrix(
        self,
        session_data: Dict[str, Any],
        request: DecoderTrainRequest
    ) -> Tuple[np.ndarray, np.ndarray, List[int], List[str], List[Dict[str, Any]]]:
        """
        Construct population firing rate matrix X and target labels y.
        Guarantees deterministic feature ordering and prevents sample-label misalignment.
        """
        all_trials = session_data.get("trial_metadata", [])
        trial_rates = session_data.get("trial_firing_rates", {})
        neuron_ids = session_data.get("neuron_ids", [])
        regions_map = session_data.get("neuron_regions", {})

        # Unit filtering
        selected_units = sorted(neuron_ids)
        if request.selected_unit_ids:
            selected_units = [u for u in selected_units if u in set(request.selected_unit_ids)]
        if request.selected_structures:
            selected_structs = set(request.selected_structures)
            selected_units = [
                u for u in selected_units
                if regions_map.get(str(u), regions_map.get(u, "unknown")) in selected_structs
            ]

        if not selected_units:
            raise ValueError("No neural units remain after applying the selected brain structure and unit filters.")

        # Unit index mapping for extraction
        neuron_id_to_idx = {nid: idx for idx, nid in enumerate(neuron_ids)}
        feature_indices = [neuron_id_to_idx[u] for u in selected_units]
        unit_structures = [regions_map.get(str(u), regions_map.get(u, "unknown")) for u in selected_units]

        # Trial filtering based on target variable
        filtered_trials = []
        labels = []

        target_var = request.target_variable.lower().strip()

        for t in all_trials:
            tid_str = str(t["trial_id"])
            if tid_str not in trial_rates:
                continue

            # Target extraction
            target_val = None
            if target_var == "orientation":
                if t.get("stimulus") == "drifting_gratings":
                    raw_orient = t.get("parameters", {}).get("orientation")
                    if raw_orient is not None:
                        target_val = f"{int(raw_orient)}deg"
            elif target_var == "stimulus":
                target_val = t.get("stimulus")
            elif target_var == "label":
                target_val = t.get("label")
            else:
                target_val = t.get("parameters", {}).get(target_var, t.get(target_var))

            if target_val is not None:
                filtered_trials.append(t)
                labels.append(str(target_val))

        if len(filtered_trials) < 6:
            raise ValueError(
                f"Insufficient trials ({len(filtered_trials)}) for target '{request.target_variable}'. "
                f"At least 6 trials are required for reliable cross-validation."
            )

        # Filter classes with fewer than 2 samples to allow stratified splitting
        class_counts = Counter(labels)
        viable_classes = {cls for cls, cnt in class_counts.items() if cnt >= 2}
        if len(viable_classes) < 2:
            raise ValueError(
                f"Target '{request.target_variable}' does not have at least 2 classes with >= 2 trials each. "
                f"Available class distribution: {dict(class_counts)}"
            )

        final_trials = []
        final_labels = []
        X_rows = []

        # Time window scaling if configured
        window_duration = max(0.1, request.time_window_sec[1] - request.time_window_sec[0])
        time_scaling_factor = min(1.0, window_duration / 2.0)

        for t, lbl in zip(filtered_trials, labels):
            if lbl in viable_classes:
                final_trials.append(t)
                final_labels.append(lbl)
                raw_rates = np.array(trial_rates[str(t["trial_id"])], dtype=np.float32)
                row = raw_rates[feature_indices] * time_scaling_factor
                X_rows.append(row)

        X = np.array(X_rows, dtype=np.float32)
        y = np.array(final_labels)

        return X, y, selected_units, unit_structures, final_trials

    # =========================================================================
    # Model Training, CV & Evaluation
    # =========================================================================

    def train_decoder(self, request: DecoderTrainRequest) -> Dict[str, Any]:
        """
        Execute full population decoder training workflow:
        1. Construct feature matrix X and aligned labels y
        2. Create stratified train/test split (test set held out strictly)
        3. Train selected classifier (Logistic Regression, Linear SVM, or Random Forest)
        4. Evaluate held-out test performance and generate confusion matrix
        5. Run stratified K-fold cross-validation on training data only
        6. Extract model-specific feature weights / importance
        7. Map units to CCFv3 brain areas
        8. Generate trial-level prediction inspection data
        """
        session_data = self._load_canonical_session(request.session_id)
        X, y, selected_units, unit_structures, trials_meta = self._prepare_data_matrix(session_data, request)

        classes = sorted(list(np.unique(y)))
        total_samples = len(y)
        feature_count = X.shape[1]

        # 1. Stratified Train / Test Split
        try:
            X_train_raw, X_test_raw, y_train, y_test, meta_train, meta_test = train_test_split(
                X, y, trials_meta,
                test_size=request.test_size,
                stratify=y,
                random_state=request.random_state
            )
        except ValueError:
            # Fallback to unstratified if any class is too small
            X_train_raw, X_test_raw, y_train, y_test, meta_train, meta_test = train_test_split(
                X, y, trials_meta,
                test_size=request.test_size,
                random_state=request.random_state
            )

        # Scaler fit strictly on training set (prevent data leakage)
        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train_raw)
        X_test = scaler.transform(X_test_raw)

        # 2. Instantiate and Fit Model
        model_type = request.model_type.lower().strip()
        params = request.model_parameters or {}

        if model_type in ["logistic_regression", "ridge_classifier"]:
            c_val = float(params.get("C", 1.0))
            max_iter = int(params.get("max_iter", 1000))
            model = LogisticRegression(
                C=c_val,
                max_iter=max_iter,
                random_state=request.random_state,
                solver="lbfgs"
            )
            model_name = "Logistic Regression"
            interpretation_type = "model_coefficients"
            explanation_note = (
                "Linear model coefficients reflect the direction and magnitude of each neural unit's "
                "standardized firing rate contribution to the classification hyperplane. "
                "Positive weights increase log-odds for the class; negative weights decrease them. "
                "Statistical weights do not imply causal neural influence."
            )
        elif model_type == "linear_svm":
            c_val = float(params.get("C", 1.0))
            max_iter = int(params.get("max_iter", 2000))
            model = LinearSVC(
                C=c_val,
                max_iter=max_iter,
                random_state=request.random_state,
                dual="auto"
            )
            model_name = "Linear Support Vector Machine (Linear SVM)"
            interpretation_type = "model_coefficients"
            explanation_note = (
                "Linear SVM coefficients represent the orthogonal vector defining the maximum-margin "
                "separating hyperplane. Absolute weights quantify unit contribution to class separation. "
                "Decision scores reflect distance to the boundary, not probabilities. "
                "Weights do not imply causal neural influence."
            )
        elif model_type == "random_forest":
            n_estimators = int(params.get("n_estimators", 100))
            max_depth = params.get("max_depth")
            if max_depth is not None:
                max_depth = int(max_depth)
            min_samples_split = int(params.get("min_samples_split", 2))
            min_samples_leaf = int(params.get("min_samples_leaf", 1))

            model = RandomForestClassifier(
                n_estimators=n_estimators,
                max_depth=max_depth,
                min_samples_split=min_samples_split,
                min_samples_leaf=min_samples_leaf,
                random_state=request.random_state
            )
            model_name = "Random Forest Classifier"
            interpretation_type = "feature_importance_gini"
            explanation_note = (
                "Random Forest feature importance reflects Mean Decrease in Impurity (Gini importance) "
                "across decision trees. These values are non-negative, sum to 1.0, and are non-directional. "
                "They quantify variance explanation rather than synaptic efficacy."
            )
        else:
            raise ValueError(f"Unsupported model type '{request.model_type}'. Choose from 'logistic_regression', 'linear_svm', 'random_forest'.")

        model.fit(X_train, y_train)

        # 3. Held-out Test Evaluation
        y_test_pred = model.predict(X_test)
        test_acc = float(accuracy_score(y_test, y_test_pred))
        balanced_acc = float(balanced_accuracy_score(y_test, y_test_pred))
        prec_macro = float(precision_score(y_test, y_test_pred, average="macro", zero_division=0))
        prec_weighted = float(precision_score(y_test, y_test_pred, average="weighted", zero_division=0))
        rec_macro = float(recall_score(y_test, y_test_pred, average="macro", zero_division=0))
        rec_weighted = float(recall_score(y_test, y_test_pred, average="weighted", zero_division=0))
        f1_macro = float(f1_score(y_test, y_test_pred, average="macro", zero_division=0))
        f1_weighted = float(f1_score(y_test, y_test_pred, average="weighted", zero_division=0))

        # Per-class metrics
        clf_report = classification_report(y_test, y_test_pred, output_dict=True, zero_division=0)
        per_class_dict: Dict[str, PerClassMetric] = {}
        for cls_name in classes:
            c_metrics = clf_report.get(cls_name, {})
            per_class_dict[cls_name] = PerClassMetric(
                class_name=cls_name,
                precision=float(c_metrics.get("precision", 0.0)),
                recall=float(c_metrics.get("recall", 0.0)),
                f1_score=float(c_metrics.get("f1-score", 0.0)),
                support=int(c_metrics.get("support", 0))
            )

        held_out_metrics = HeldOutMetrics(
            accuracy=test_acc,
            balanced_accuracy=balanced_acc,
            precision_macro=prec_macro,
            precision_weighted=prec_weighted,
            recall_macro=rec_macro,
            recall_weighted=rec_weighted,
            f1_macro=f1_macro,
            f1_weighted=f1_weighted,
            support=len(y_test),
            per_class=per_class_dict
        )

        # 4. Confusion Matrix (Held-out Test)
        cm = confusion_matrix(y_test, y_test_pred, labels=classes)
        matrix_counts = cm.tolist()
        row_sums = cm.sum(axis=1, keepdims=True)
        normalized_cm = np.divide(
            cm.astype(float),
            row_sums,
            out=np.zeros_like(cm, dtype=float),
            where=row_sums != 0
        )
        normalized_matrix = np.round(normalized_cm, 4).tolist()

        # 5. Stratified K-fold Cross-Validation (on Training Split ONLY)
        train_class_counts = Counter(y_train)
        min_train_count = min(train_class_counts.values()) if train_class_counts else 1
        requested_folds = request.cv_folds
        actual_folds = min(requested_folds, max(2, min_train_count))
        adjusted_note = None
        if actual_folds < requested_folds:
            adjusted_note = (
                f"CV folds adjusted from {requested_folds} to {actual_folds} "
                f"due to minimum class sample count in training split ({min_train_count})."
            )

        skf = StratifiedKFold(n_splits=actual_folds, shuffle=True, random_state=request.random_state)
        fold_metrics: List[FoldMetric] = []
        cv_accs, cv_precs, cv_recs, cv_f1s = [], [], [], []

        for fold_idx, (tr_idx, val_idx) in enumerate(skf.split(X_train_raw, y_train), start=1):
            fold_scaler = StandardScaler()
            X_fold_tr = fold_scaler.fit_transform(X_train_raw[tr_idx])
            X_fold_val = fold_scaler.transform(X_train_raw[val_idx])
            y_fold_tr = y_train[tr_idx]
            y_fold_val = y_train[val_idx]

            # Re-create model clone
            if model_type in ["logistic_regression", "ridge_classifier"]:
                fold_model = LogisticRegression(
                    C=float(params.get("C", 1.0)),
                    max_iter=int(params.get("max_iter", 1000)),
                    random_state=request.random_state + fold_idx,
                    solver="lbfgs"
                )
            elif model_type == "linear_svm":
                fold_model = LinearSVC(
                    C=float(params.get("C", 1.0)),
                    max_iter=int(params.get("max_iter", 2000)),
                    random_state=request.random_state + fold_idx,
                    dual="auto"
                )
            else:
                fold_model = RandomForestClassifier(
                    n_estimators=int(params.get("n_estimators", 100)),
                    max_depth=params.get("max_depth"),
                    min_samples_split=int(params.get("min_samples_split", 2)),
                    min_samples_leaf=int(params.get("min_samples_leaf", 1)),
                    random_state=request.random_state + fold_idx
                )

            fold_model.fit(X_fold_tr, y_fold_tr)
            y_fold_pred = fold_model.predict(X_fold_val)

            f_acc = float(accuracy_score(y_fold_val, y_fold_pred))
            f_prec = float(precision_score(y_fold_val, y_fold_pred, average="macro", zero_division=0))
            f_rec = float(recall_score(y_fold_val, y_fold_pred, average="macro", zero_division=0))
            f_f1 = float(f1_score(y_fold_val, y_fold_pred, average="macro", zero_division=0))

            cv_accs.append(f_acc)
            cv_precs.append(f_prec)
            cv_recs.append(f_rec)
            cv_f1s.append(f_f1)

            fold_metrics.append(
                FoldMetric(
                    fold=fold_idx,
                    accuracy=f_acc,
                    precision_macro=f_prec,
                    recall_macro=f_rec,
                    f1_macro=f_f1,
                    train_samples=len(tr_idx),
                    val_samples=len(val_idx)
                )
            )

        cv_summary = CrossValidationMetrics(
            cv_folds=actual_folds,
            mean_accuracy=float(np.mean(cv_accs)),
            std_accuracy=float(np.std(cv_accs)),
            mean_precision=float(np.mean(cv_precs)),
            std_precision=float(np.std(cv_precs)),
            mean_recall=float(np.mean(cv_recs)),
            std_recall=float(np.std(cv_recs)),
            mean_f1=float(np.mean(cv_f1s)),
            std_f1=float(np.std(cv_f1s)),
            fold_metrics=fold_metrics,
            adjusted_folds_note=adjusted_note
        )

        # 6. Feature Importance & Weights Extraction
        feature_items: List[FeatureImportanceItem] = []
        raw_importances = []
        signed_weights = []

        if hasattr(model, "coef_"):
            coef = model.coef_  # Shape (n_classes, n_features) or (1, n_features)
            if coef.shape[0] == 1:
                # Binary classification
                weights = coef[0]
                abs_weights = np.abs(weights)
                for j, uid in enumerate(selected_units):
                    w = float(weights[j])
                    aw = float(abs_weights[j])
                    struct = unit_structures[j]
                    ccf_info = CCFV3_METADATA.get(struct, {})
                    feature_items.append(
                        FeatureImportanceItem(
                            rank=0,  # updated after sort
                            unit_id=uid,
                            importance_score=aw,
                            signed_weight=w,
                            direction="positive" if w > 0 else "negative",
                            structure=struct,
                            ccfv3_area=ccf_info.get("full_name", f"{struct} (CCFv3)"),
                            class_associations={classes[1]: w, classes[0]: -w} if len(classes) == 2 else None,
                            firing_rate=float(np.mean(X_train_raw[:, j]))
                        )
                    )
            else:
                # Multiclass classification
                # Magnitude is mean absolute weight across classes
                abs_weights = np.mean(np.abs(coef), axis=0)
                for j, uid in enumerate(selected_units):
                    aw = float(abs_weights[j])
                    struct = unit_structures[j]
                    ccf_info = CCFV3_METADATA.get(struct, {})
                    class_coefs = {classes[c]: float(coef[c, j]) for c in range(len(classes))}
                    dominant_class = max(class_coefs.keys(), key=lambda c: class_coefs[c])
                    dom_weight = class_coefs[dominant_class]

                    feature_items.append(
                        FeatureImportanceItem(
                            rank=0,
                            unit_id=uid,
                            importance_score=aw,
                            signed_weight=dom_weight,
                            direction="positive" if dom_weight >= 0 else "negative",
                            structure=struct,
                            ccfv3_area=ccf_info.get("full_name", f"{struct} (CCFv3)"),
                            class_associations=class_coefs,
                            firing_rate=float(np.mean(X_train_raw[:, j]))
                        )
                    )
        elif hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            for j, uid in enumerate(selected_units):
                imp = float(importances[j])
                struct = unit_structures[j]
                ccf_info = CCFV3_METADATA.get(struct, {})
                feature_items.append(
                    FeatureImportanceItem(
                        rank=0,
                        unit_id=uid,
                        importance_score=imp,
                        signed_weight=None,
                        direction="n/a",
                        structure=struct,
                        ccfv3_area=ccf_info.get("full_name", f"{struct} (CCFv3)"),
                        class_associations=None,
                        firing_rate=float(np.mean(X_train_raw[:, j]))
                    )
                )

        # Sort features by importance_score descending and assign ranks
        feature_items.sort(key=lambda item: item.importance_score, reverse=True)
        for rank_idx, item in enumerate(feature_items, start=1):
            item.rank = rank_idx

        # 7. CCFv3 Regional Mapping & Aggregation
        region_units_map: Dict[str, List[FeatureImportanceItem]] = {}
        for item in feature_items:
            region_units_map.setdefault(item.structure, []).append(item)

        regional_aggs: List[RegionAggregation] = []
        for region, r_units in region_units_map.items():
            ccf_meta = CCFV3_METADATA.get(region, {})
            imps = [u.importance_score for u in r_units]
            regional_aggs.append(
                RegionAggregation(
                    rank=0,
                    region=region,
                    full_name=ccf_meta.get("full_name", "CCFv3 mapping unavailable"),
                    hierarchy=ccf_meta.get("hierarchy", "CCFv3 mapping unavailable"),
                    division=ccf_meta.get("division", "Other"),
                    unit_count=len(r_units),
                    mean_importance=float(np.mean(imps)),
                    total_importance=float(np.sum(imps)),
                    max_importance=float(np.max(imps)),
                    units=[u.unit_id for u in r_units]
                )
            )

        regional_aggs.sort(key=lambda r: r.mean_importance, reverse=True)
        for rank_idx, r in enumerate(regional_aggs, start=1):
            r.rank = rank_idx

        units_brain_map: List[UnitBrainMap] = []
        for item in feature_items:
            ccf_meta = CCFV3_METADATA.get(item.structure, {})
            units_brain_map.append(
                UnitBrainMap(
                    unit_id=item.unit_id,
                    region=item.structure,
                    full_name=ccf_meta.get("full_name", "CCFv3 mapping unavailable"),
                    hierarchy=ccf_meta.get("hierarchy", "CCFv3 mapping unavailable"),
                    importance_score=item.importance_score,
                    signed_weight=item.signed_weight,
                    rank=item.rank
                )
            )

        # 8. Trial-level Prediction Details
        has_proba = hasattr(model, "predict_proba")
        has_decision = hasattr(model, "decision_function")

        if has_proba:
            y_test_probs = model.predict_proba(X_test)
            score_type = "probability"
        elif has_decision:
            y_test_decisions = model.decision_function(X_test)
            score_type = "decision_score"
        else:
            score_type = "unsupported"

        trial_predictions: List[TrialPrediction] = []
        correct_count = 0
        incorrect_count = 0

        # Top 5 overall important units for trial detail breakdown
        top_units_set = {item.unit_id for item in feature_items[:10]}
        top_unit_weight_map = {item.unit_id: (item.importance_score, item.signed_weight) for item in feature_items}

        trial_details_map: Dict[int, PredictionDetailResponse] = {}

        for i, (t_meta, true_lbl, pred_lbl) in enumerate(zip(meta_test, y_test, y_test_pred)):
            tid = int(t_meta.get("trial_id", i + 1))
            is_correct = bool(true_lbl == pred_lbl)
            if is_correct:
                correct_count += 1
            else:
                incorrect_count += 1

            confidence = None
            decision_score = None
            class_scores = {}

            if has_proba:
                prob_vec = y_test_probs[i]
                confidence = float(np.max(prob_vec))
                class_scores = {classes[c_idx]: float(prob_vec[c_idx]) for c_idx in range(len(classes))}
            elif has_decision:
                dec_vec = y_test_decisions[i]
                if np.ndim(dec_vec) == 0 or len(classes) == 2:
                    val = float(dec_vec)
                    decision_score = abs(val)
                    class_scores = {classes[1]: val, classes[0]: -val}
                else:
                    decision_score = float(np.max(dec_vec))
                    class_scores = {classes[c_idx]: float(dec_vec[c_idx]) for c_idx in range(len(classes))}

            trial_pred_obj = TrialPrediction(
                trial_id=tid,
                true_label=true_lbl,
                predicted_label=pred_lbl,
                correct=is_correct,
                confidence=confidence,
                decision_score=decision_score,
                score_type=score_type,
                class_scores=class_scores,
                trial_metadata=t_meta
            )
            trial_predictions.append(trial_pred_obj)

            # Build detailed neural features for this individual trial
            trial_neural_features: List[TrialNeuralFeature] = []
            for j, uid in enumerate(selected_units):
                if uid in top_units_set:
                    imp_score, s_wt = top_unit_weight_map.get(uid, (0.0, None))
                    trial_neural_features.append(
                        TrialNeuralFeature(
                            unit_id=uid,
                            structure=unit_structures[j],
                            firing_rate=float(X_test_raw[i, j]),
                            unit_importance=imp_score,
                            signed_weight=s_wt
                        )
                    )
            trial_neural_features.sort(key=lambda f: f.unit_importance, reverse=True)

            trial_details_map[tid] = PredictionDetailResponse(
                run_id="",  # filled after run_id generation
                trial_id=tid,
                true_label=true_lbl,
                predicted_label=pred_lbl,
                correct=is_correct,
                confidence=confidence,
                decision_score=decision_score,
                score_type=score_type,
                class_scores=class_scores,
                trial_metadata=t_meta,
                top_neural_features=trial_neural_features
            )

        # 9. Create Persistent Decoder Run
        run_id = f"run_{uuid.uuid4().hex[:12]}"
        for d in trial_details_map.values():
            d.run_id = run_id

        run_summary = (
            f"Trained {model_name} on {total_samples} trials across {feature_count} neural units. "
            f"Achieved {test_acc:.1%} held-out test accuracy and {cv_summary.mean_accuracy:.1%} "
            f"(±{cv_summary.std_accuracy:.1%}) {actual_folds}-fold cross-validation accuracy decoding '{request.target_variable}'."
        )

        dataset_summary_dict = {
            "total_samples": total_samples,
            "train_samples": len(y_train),
            "test_samples": len(y_test),
            "classes": len(classes),
            "neural_units": feature_count,
            "brain_regions": sorted(list(set(unit_structures)))
        }

        run_response = DecoderRunResponse(
            run_id=run_id,
            status="completed",
            session_id=request.session_id,
            target_variable=request.target_variable,
            model_type=model_type,
            model_name=model_name,
            classes=classes,
            created_at=datetime.now(timezone.utc).isoformat(),
            summary=run_summary,
            provenance="allen_experimental",
            config={
                "session_id": request.session_id,
                "stimulus_name": request.stimulus_name,
                "target_variable": request.target_variable,
                "model_type": request.model_type,
                "model_parameters": params,
                "test_size": request.test_size,
                "cv_folds": request.cv_folds,
                "actual_cv_folds": actual_folds,
                "selected_structures": request.selected_structures,
                "bin_size_sec": request.bin_size_sec,
                "time_window_sec": request.time_window_sec,
                "random_state": request.random_state
            },
            dataset_summary=dataset_summary_dict,
            test_accuracy=test_acc,
            cv_mean_accuracy=cv_summary.mean_accuracy,
            cv_std_accuracy=cv_summary.std_accuracy,
            f1_score_macro=f1_macro,
            confusion_matrix=matrix_counts,
            feature_importances=[
                FeatureImportanceRecord(
                    unit_id=item.unit_id,
                    structure=item.structure,
                    importance_score=item.importance_score,
                    rank=item.rank
                ) for item in feature_items[:50]
            ]
        )

        perf_response = PerformanceResponse(
            run_id=run_id,
            held_out_metrics=held_out_metrics,
            cross_validation=cv_summary,
            data_split_info=dataset_summary_dict
        )

        cm_response = ConfusionMatrixResponse(
            run_id=run_id,
            class_labels=classes,
            matrix=matrix_counts,
            normalized_matrix=normalized_matrix,
            total_samples=len(y_test)
        )

        feat_response = FeatureImportanceResponse(
            run_id=run_id,
            model_type=model_type,
            interpretation_type=interpretation_type,
            explanation_note=explanation_note,
            features=feature_items
        )

        brain_response = BrainMappingResponse(
            run_id=run_id,
            total_units=len(feature_items),
            mapped_units=sum(1 for f in feature_items if f.structure in CCFV3_METADATA),
            unmapped_units=sum(1 for f in feature_items if f.structure not in CCFV3_METADATA),
            aggregation_method="mean_importance",
            regional_aggregations=regional_aggs,
            units=units_brain_map
        )

        preds_response = PredictionsResponse(
            run_id=run_id,
            total_predictions=len(trial_predictions),
            correct_count=correct_count,
            incorrect_count=incorrect_count,
            accuracy=test_acc,
            score_type=score_type,
            predictions=trial_predictions
        )

        # Store run in memory
        self._runs[run_id] = {
            "run_response": run_response,
            "performance": perf_response,
            "confusion_matrix": cm_response,
            "feature_importance": feat_response,
            "brain_mapping": brain_response,
            "predictions": preds_response,
            "trial_details": trial_details_map,
            # Legacy DecoderResult compatibility
            "legacy_result": DecoderResult(
                model_name=model_name,
                target_variable=request.target_variable,
                classes=classes,
                test_accuracy=test_acc,
                cv_mean_accuracy=cv_summary.mean_accuracy,
                cv_std_accuracy=cv_summary.std_accuracy,
                confusion_matrix=matrix_counts,
                f1_score_macro=f1_macro,
                feature_importances=[
                    FeatureImportanceRecord(
                        unit_id=item.unit_id,
                        structure=item.structure,
                        importance_score=item.importance_score,
                        rank=item.rank
                    ) for item in feature_items[:50]
                ],
                summary=run_summary,
                run_id=run_id
            )
        }

        logger.info("Completed Decoder Run %s with test accuracy %.3f", run_id, test_acc)
        return self._runs[run_id]

    # =========================================================================
    # Run Retrieval Methods
    # =========================================================================

    def get_run(self, run_id: str) -> DecoderRunResponse:
        """Retrieve overview of a completed Decoder Run."""
        if run_id not in self._runs:
            raise KeyError(f"Decoder Run '{run_id}' not found.")
        return self._runs[run_id]["run_response"]

    def get_performance(self, run_id: str) -> PerformanceResponse:
        """Retrieve held-out test and cross-validation performance metrics."""
        if run_id not in self._runs:
            raise KeyError(f"Decoder Run '{run_id}' not found.")
        return self._runs[run_id]["performance"]

    def get_confusion_matrix(self, run_id: str) -> ConfusionMatrixResponse:
        """Retrieve confusion matrix calculated strictly on held-out test data."""
        if run_id not in self._runs:
            raise KeyError(f"Decoder Run '{run_id}' not found.")
        return self._runs[run_id]["confusion_matrix"]

    def get_feature_importance(self, run_id: str) -> FeatureImportanceResponse:
        """Retrieve ranked feature weights / Gini importance mapped to neural units."""
        if run_id not in self._runs:
            raise KeyError(f"Decoder Run '{run_id}' not found.")
        return self._runs[run_id]["feature_importance"]

    def get_brain_mapping(self, run_id: str) -> BrainMappingResponse:
        """Retrieve CCFv3 brain area regional aggregations and unit anatomical locations."""
        if run_id not in self._runs:
            raise KeyError(f"Decoder Run '{run_id}' not found.")
        return self._runs[run_id]["brain_mapping"]

    def get_predictions(self, run_id: str) -> PredictionsResponse:
        """Retrieve all trial-level test predictions for error inspection."""
        if run_id not in self._runs:
            raise KeyError(f"Decoder Run '{run_id}' not found.")
        return self._runs[run_id]["predictions"]

    def get_prediction_detail(self, run_id: str, trial_id: int) -> PredictionDetailResponse:
        """Retrieve in-depth information for an individual trial prediction."""
        if run_id not in self._runs:
            raise KeyError(f"Decoder Run '{run_id}' not found.")
        details = self._runs[run_id]["trial_details"]
        if trial_id not in details:
            raise KeyError(f"Trial ID {trial_id} not found in held-out test set for run '{run_id}'.")
        return details[trial_id]


# Global singleton instance
decoder_service = DecoderService()
