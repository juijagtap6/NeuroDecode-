"""Decoder module API contracts and schemas."""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from .common import ProvenanceEnum

# =====================================================================
# Request Schemas
# =====================================================================

class DecoderTrainRequest(BaseModel):
    """Request to train a neural population decoder on stimulus conditions."""
    session_id: int = Field(..., description="Allen Neuropixels session ID")
    stimulus_name: Optional[str] = Field(
        default="drifting_gratings",
        description="Stimulus protocol to decode (e.g. drifting_gratings, natural_scenes)"
    )
    target_variable: str = Field(
        default="orientation",
        description="Target stimulus feature to predict (e.g. orientation, stimulus, label)"
    )
    model_type: str = Field(
        default="logistic_regression",
        description="Decoder model: 'logistic_regression', 'linear_svm', 'random_forest'"
    )
    model_parameters: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Hyperparameters for the selected model (e.g., C, max_iter, n_estimators, max_depth)"
    )
    test_size: float = Field(default=0.2, ge=0.05, le=0.5, description="Fraction held out for testing")
    cv_folds: int = Field(default=5, ge=2, le=10, description="K-fold cross-validation folds")
    selected_structures: Optional[List[str]] = Field(
        None,
        description="Filter units by brain structures (e.g. ['VISp', 'LGd'])"
    )
    selected_unit_ids: Optional[List[int]] = Field(
        None,
        description="Filter by specific neural unit IDs"
    )
    bin_size_sec: Optional[float] = Field(
        default=0.05,
        description="Temporal bin size in seconds"
    )
    time_window_sec: List[float] = Field(
        default=[0.0, 2.0],
        description="Post-stimulus onset window [start, stop] in seconds"
    )
    random_state: int = Field(default=42, description="Random seed for reproducibility")


# =====================================================================
# Dataset & Target Discovery Schemas
# =====================================================================

class DecoderDatasetSummary(BaseModel):
    """Overview of a neural dataset available for population decoding."""
    dataset_id: str = Field(..., description="Dataset or session identifier")
    session_id: int = Field(..., description="Numeric session ID")
    name: str = Field(..., description="Display name of dataset")
    session_metadata: Dict[str, Any] = Field(..., description="Acquisition and specimen metadata")
    available_labels: List[str] = Field(..., description="Class labels present in dataset")
    available_brain_regions: List[str] = Field(..., description="CCFv3 brain regions present")
    available_units: List[int] = Field(..., description="Neural unit IDs recorded")
    available_stimuli: List[str] = Field(..., description="Visual stimulus protocols")
    trial_count: int = Field(..., description="Total trial count")
    unit_count: int = Field(..., description="Total unit count")
    provenance: str = Field(default="allen_experimental", description="Dataset provenance")

class DecoderDatasetDetail(BaseModel):
    """Detailed metadata for a selected neural dataset."""
    dataset_id: str
    session_id: int
    name: str
    session_metadata: Dict[str, Any]
    available_labels: List[str]
    available_brain_regions: List[str]
    available_units: List[int]
    available_stimuli: List[str]
    unit_region_mapping: Dict[str, str] = Field(default_factory=dict)
    trial_count: int
    unit_count: int
    stimulus_counts: Dict[str, int] = Field(default_factory=dict)
    condition_counts: Dict[str, int] = Field(default_factory=dict)
    provenance: str = "allen_experimental"

class DecodingTargetInfo(BaseModel):
    """Information about a specific decoding target available in a dataset."""
    name: str = Field(..., description="Target parameter identifier (e.g. orientation, stimulus)")
    display_name: str = Field(..., description="Human-readable label for UI")
    description: str = Field(..., description="Scientific description of the decoded target")
    target_type: str = Field(default="categorical", description="Variable type")
    classes: List[str] = Field(..., description="Unique categorical class labels")
    class_count: int = Field(..., description="Number of distinct classes")
    sample_count: int = Field(..., description="Number of valid trials with this target")
    class_balance: Dict[str, int] = Field(..., description="Number of trials per class")
    compatible_stimulus: Optional[str] = Field(None, description="Protocol name if target is stimulus-specific")

class TargetsResponse(BaseModel):
    """List of available decoding targets for a session."""
    session_id: int
    dataset_id: str
    targets: List[DecodingTargetInfo]


# =====================================================================
# Performance & Evaluation Schemas
# =====================================================================

class PerClassMetric(BaseModel):
    """Performance metrics for an individual class."""
    class_name: str
    precision: float
    recall: float
    f1_score: float
    support: int

class FoldMetric(BaseModel):
    """Performance metrics for an individual cross-validation fold."""
    fold: int
    accuracy: float
    precision_macro: float
    recall_macro: float
    f1_macro: float
    train_samples: int
    val_samples: int

class CrossValidationMetrics(BaseModel):
    """Summary of stratified K-fold cross-validation."""
    cv_folds: int
    mean_accuracy: float
    std_accuracy: float
    mean_precision: float
    std_precision: float
    mean_recall: float
    std_recall: float
    mean_f1: float
    std_f1: float
    fold_metrics: List[FoldMetric]
    adjusted_folds_note: Optional[str] = None

class HeldOutMetrics(BaseModel):
    """Performance evaluated strictly on held-out test data."""
    accuracy: float
    balanced_accuracy: float
    precision_macro: float
    precision_weighted: float
    recall_macro: float
    recall_weighted: float
    f1_macro: float
    f1_weighted: float
    support: int
    per_class: Dict[str, PerClassMetric]

class PerformanceResponse(BaseModel):
    """Complete evaluation report separating held-out test and cross-validation."""
    run_id: str
    held_out_metrics: HeldOutMetrics
    cross_validation: CrossValidationMetrics
    data_split_info: Dict[str, Any] = Field(
        ...,
        description="total_samples, train_samples, test_samples, classes, neural_units, brain_regions"
    )


# =====================================================================
# Confusion Matrix Schema
# =====================================================================

class ConfusionMatrixResponse(BaseModel):
    """Confusion matrix generated strictly from held-out test predictions."""
    run_id: str
    class_labels: List[str] = Field(..., description="Ordered class labels")
    matrix: List[List[int]] = Field(..., description="Raw count matrix [true_class x predicted_class]")
    normalized_matrix: List[List[float]] = Field(..., description="Row-normalized true class matrix [0..1]")
    total_samples: int


# =====================================================================
# Feature Importance & Explainability Schemas
# =====================================================================

class FeatureImportanceItem(BaseModel):
    """Per-unit explainability record with anatomical mapping and model weights."""
    rank: int
    unit_id: int
    importance_score: float = Field(..., description="Absolute weight magnitude or Gini importance")
    signed_weight: Optional[float] = Field(None, description="Signed linear coefficient (None for Random Forest)")
    direction: Optional[str] = Field(None, description="'positive', 'negative', or 'n/a'")
    structure: str = Field(..., description="CCFv3 brain structure acronym")
    ccfv3_area: str = Field(..., description="Full anatomical region name")
    class_associations: Optional[Dict[str, float]] = Field(
        None,
        description="Per-class coefficients for multiclass linear models"
    )
    firing_rate: Optional[float] = None
    snr: Optional[float] = None

class FeatureImportanceResponse(BaseModel):
    """Model explainability and ranked feature weights."""
    run_id: str
    model_type: str
    interpretation_type: str = Field(
        ...,
        description="'model_coefficients' for linear models or 'feature_importance_gini' for Random Forest"
    )
    explanation_note: str = Field(..., description="Scientific note on model-specific weight interpretation")
    features: List[FeatureImportanceItem]


# =====================================================================
# CCFv3 Brain Mapping Schemas
# =====================================================================

class RegionAggregation(BaseModel):
    """Aggregate decoder importance across CCFv3 brain areas."""
    rank: int
    region: str
    full_name: str
    hierarchy: str
    division: str
    unit_count: int
    mean_importance: float
    total_importance: float
    max_importance: float
    units: List[int]

class UnitBrainMap(BaseModel):
    """Anatomical mapping of an individual neural unit."""
    unit_id: int
    region: str
    full_name: str
    hierarchy: str
    importance_score: float
    signed_weight: Optional[float]
    rank: int

class BrainMappingResponse(BaseModel):
    """CCFv3 anatomical mapping and regional population importance."""
    run_id: str
    total_units: int
    mapped_units: int
    unmapped_units: int
    aggregation_method: str = "mean_importance"
    regional_aggregations: List[RegionAggregation]
    units: List[UnitBrainMap]
    scientific_note: str = Field(
        default="Regional aggregations represent statistical associations within the trained decoder and must not be interpreted as causal evidence."
    )


# =====================================================================
# Prediction Inspector Schemas
# =====================================================================

class TrialPrediction(BaseModel):
    """Trial-level prediction record from the held-out test set."""
    trial_id: int
    true_label: str
    predicted_label: str
    correct: bool
    confidence: Optional[float] = Field(
        None,
        description="Predicted class probability (strictly for probabilistic models)"
    )
    decision_score: Optional[float] = Field(
        None,
        description="Model decision function score (strictly for non-probabilistic models like Linear SVM)"
    )
    score_type: str = Field(..., description="'probability' or 'decision_score'")
    class_scores: Optional[Dict[str, float]] = None
    trial_metadata: Dict[str, Any] = Field(default_factory=dict)

class PredictionsResponse(BaseModel):
    """Collection of trial-level predictions for error inspection."""
    run_id: str
    total_predictions: int
    correct_count: int
    incorrect_count: int
    accuracy: float
    score_type: str
    predictions: List[TrialPrediction]

class TrialNeuralFeature(BaseModel):
    """Neural unit activity during a single trial."""
    unit_id: int
    structure: str
    firing_rate: float
    unit_importance: float
    signed_weight: Optional[float] = None

class PredictionDetailResponse(BaseModel):
    """Deep-dive into a single trial prediction with neural features."""
    run_id: str
    trial_id: int
    true_label: str
    predicted_label: str
    correct: bool
    confidence: Optional[float] = None
    decision_score: Optional[float] = None
    score_type: str
    class_scores: Optional[Dict[str, float]] = None
    trial_metadata: Dict[str, Any] = Field(default_factory=dict)
    top_neural_features: List[TrialNeuralFeature] = Field(default_factory=list)


# =====================================================================
# Decoder Run Record & Backward Compatibility Schemas
# =====================================================================

class FeatureImportanceRecord(BaseModel):
    """Explainability record mapping a unit to its decoder weight/importance (compatibility)."""
    unit_id: int
    structure: str
    importance_score: float = Field(..., description="Normalized weight or feature importance")
    rank: int

class DecoderRunResponse(BaseModel):
    """Metadata and execution status for a persistent Decoder Run."""
    run_id: str
    status: str = Field(..., description="'completed', 'training', 'failed'")
    session_id: int
    target_variable: str
    model_type: str
    model_name: str
    classes: List[str]
    created_at: str
    summary: str
    provenance: str = "allen_experimental"
    config: Dict[str, Any]
    dataset_summary: Dict[str, Any]
    test_accuracy: Optional[float] = None
    cv_mean_accuracy: Optional[float] = None
    cv_std_accuracy: Optional[float] = None
    f1_score_macro: Optional[float] = None
    confusion_matrix: Optional[List[List[int]]] = None
    feature_importances: Optional[List[FeatureImportanceRecord]] = None

class DecoderResult(BaseModel):
    """Result of decoder training, performance evaluation, and explainability analysis (compatibility)."""
    model_name: str = Field(..., description="Model architecture used")
    target_variable: str = Field(..., description="Decoded target label")
    classes: List[Any] = Field(..., description="List of target classes")
    
    # Performance Submodule
    test_accuracy: float = Field(..., description="Held-out test set accuracy")
    cv_mean_accuracy: float = Field(..., description="Mean cross-validation accuracy")
    cv_std_accuracy: float = Field(..., description="Standard deviation of CV accuracy")
    confusion_matrix: List[List[int]] = Field(..., description="Confusion matrix [true x pred]")
    f1_score_macro: float = Field(..., description="Macro-averaged F1 score")
    
    # Explainability Submodule
    feature_importances: List[FeatureImportanceRecord] = Field(
        default_factory=list,
        description="Per-unit importance scores and brain region rankings"
    )
    summary: str = Field(..., description="Scientific interpretation of decoding performance")
    
    # Extra run metadata
    run_id: Optional[str] = None
