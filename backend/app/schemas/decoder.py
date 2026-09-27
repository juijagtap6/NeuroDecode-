"""Decoder module API contracts and schemas."""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class DecoderTrainRequest(BaseModel):
    """Request to train a neural population decoder on stimulus conditions."""
    session_id: int = Field(..., description="Allen Neuropixels session ID")
    stimulus_name: str = Field(
        default="drifting_gratings",
        description="Stimulus protocol to decode (e.g. drifting_gratings, natural_scenes)"
    )
    target_variable: str = Field(
        default="orientation",
        description="Target stimulus feature to predict (e.g. orientation)"
    )
    model_type: str = Field(
        default="logistic_regression",
        description="Decoder model: 'logistic_regression', 'ridge_classifier', 'random_forest'"
    )
    test_size: float = Field(default=0.2, ge=0.05, le=0.5, description="Fraction held out for testing")
    cv_folds: int = Field(default=5, ge=2, le=10, description="K-fold cross-validation folds")
    selected_structures: Optional[List[str]] = Field(
        None,
        description="Filter units by brain structures (e.g. ['VISp', 'LGd'])"
    )
    time_window_sec: List[float] = Field(
        default=[0.0, 0.5],
        description="Post-stimulus onset window [start, stop] in seconds"
    )

class FeatureImportanceRecord(BaseModel):
    """Explainability record mapping a unit to its decoder weight/importance."""
    unit_id: int
    structure: str
    importance_score: float = Field(..., description="Normalized weight or feature importance")
    rank: int

class DecoderResult(BaseModel):
    """Result of decoder training, performance evaluation, and explainability analysis."""
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
