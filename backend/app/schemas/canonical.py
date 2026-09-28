"""Canonical Neural Dataset and Explorer API schemas."""
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field
from .common import ProvenanceEnum

class SessionMetadata(BaseModel):
    """Metadata describing a recording or uploaded neural session."""
    session_id: Union[int, str] = Field(..., description="Unique session identifier")
    mouse_id: Optional[Union[int, str]] = Field(None, description="Mouse / specimen identifier")
    genotype: Optional[str] = Field(None, description="Transgenic line or mouse genotype")
    session_type: Optional[str] = Field("brain_observatory_1.1", description="Recording protocol")
    date_of_acquisition: Optional[str] = Field(None, description="Acquisition date")
    total_units: int = Field(0, description="Total number of recorded neurons / units")
    total_trials: int = Field(0, description="Total stimulus presentation trials")
    duration_sec: Optional[float] = Field(None, description="Total duration in seconds")
    available_brain_regions: List[str] = Field(default_factory=list, description="Brain regions present in session")
    available_stimuli: List[str] = Field(default_factory=list, description="Stimulus protocols present in session")
    extra: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class TrialMetadata(BaseModel):
    """Metadata describing a single presentation trial."""
    trial_id: Union[int, str] = Field(..., description="Unique trial presentation index")
    stimulus: str = Field(..., description="Stimulus protocol category (e.g. drifting_gratings)")
    label: str = Field(..., description="Detailed trial label (e.g. orientation or condition)")
    start_time: float = Field(..., description="Onset time in seconds")
    stop_time: float = Field(..., description="Offset time in seconds")
    duration: float = Field(..., description="Duration in seconds")
    region: Optional[str] = Field(None, description="Primary brain region or target structure")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Stimulus parameters (contrast, frequency, etc.)")

class CanonicalNeuralDataset(BaseModel):
    """
    Standard Canonical Neural Dataset structure.
    Ingestion target for both Allen Institute data and user-uploaded datasets.
    Every Explorer visualization operates on this unified representation.
    """
    session_metadata: SessionMetadata = Field(..., description="Session-level metadata")
    neuron_ids: List[Union[int, str]] = Field(..., description="Ordered list of neuron/unit identifiers")
    firing_rate_matrix: List[List[float]] = Field(
        ...,
        description="2D firing rate matrix of shape [N_neurons, T_time_bins]"
    )
    trial_metadata: List[TrialMetadata] = Field(..., description="List of all trial presentations")
    stimulus_information: List[str] = Field(..., description="List of available stimulus categories")
    brain_region_information: List[str] = Field(..., description="List of available brain regions")
    labels: List[str] = Field(..., description="List of distinct condition/stimulus labels")
    provenance: ProvenanceEnum = Field(..., description="Origin provenance: 'allen_experimental' or 'user_uploaded'")
    time_bins: List[float] = Field(default_factory=list, description="Time bin timestamps relative to trial onset (length T)")
    neuron_regions: Dict[str, str] = Field(default_factory=dict, description="Mapping of neuron_id string to brain region acronym")
    trial_firing_rates: Optional[Dict[str, List[float]]] = Field(
        None,
        description="Optional mapping of str(trial_id) to mean firing rates across neurons [N_neurons]"
    )

# -------------------------------------------------------------
# Explorer Endpoint Response Models
# -------------------------------------------------------------

class ExplorerSessionSummary(BaseModel):
    """Summary of session metadata for the Explorer session selector."""
    session_id: Union[int, str] = Field(..., description="Session identifier")
    mouse_id: Optional[Union[int, str]] = Field(None, description="Mouse / specimen identifier")
    genotype: Optional[str] = Field(None, description="Mouse genotype or 'custom'")
    available_brain_regions: List[str] = Field(default_factory=list, description="Brain regions recorded")
    available_stimuli: List[str] = Field(default_factory=list, description="Stimuli presented")
    unit_count: int = Field(0, description="Number of units in session")
    total_trials: int = Field(0, description="Number of trials in session")
    provenance: ProvenanceEnum = Field(..., description="Data provenance")
    data_status: str = Field("ready", description="Status string")

class PCAPoint(BaseModel):
    """Single point in the PCA trial state space."""
    trial_id: Union[int, str] = Field(..., description="Trial index")
    x: float = Field(..., description="Coordinate on primary selected PC")
    y: float = Field(..., description="Coordinate on secondary selected PC")
    label: str = Field(..., description="Condition label")
    stimulus: str = Field(..., description="Stimulus category")
    region: str = Field(..., description="Brain region")

class PCAResponse(BaseModel):
    """PCA projection response containing points and explained variance ratios."""
    session_id: Union[int, str] = Field(..., description="Session identifier")
    explained_variance_ratio: List[float] = Field(..., description="Variance explained by computed PCs")
    points: List[PCAPoint] = Field(..., description="Projected trial points")
    pc_x: int = Field(1, description="1-indexed component on X axis")
    pc_y: int = Field(2, description="1-indexed component on Y axis")

class HeatmapResponse(BaseModel):
    """Firing rate heatmap response (neurons x time)."""
    neuron_ids: List[Union[int, str]] = Field(..., description="Ordered neuron IDs (rows)")
    time_bins: List[float] = Field(..., description="Relative time bin timestamps in seconds (columns)")
    matrix: List[List[float]] = Field(..., description="2D array [neurons x time] of firing rates")
    trial_id: Optional[Union[int, str]] = Field(None, description="Associated trial ID if filtered")
    normalization: str = Field("none", description="Applied normalization ('none', 'z-score', 'min-max')")

class PopulationTraceResponse(BaseModel):
    """Population mean firing rate trace over time."""
    timestamps: List[float] = Field(..., description="Time points in seconds")
    mean_firing_rate: List[float] = Field(..., description="Population mean firing rate in Hz")
    sem_firing_rate: Optional[List[float]] = Field(None, description="Standard error of the mean across neurons")
    averaging_method: str = Field("mean", description="Averaging method ('mean' or 'median')")
    smoothing_window: int = Field(0, description="Smoothing window size applied")

class UploadResponse(BaseModel):
    """Response returned upon successful CSV upload and ingestion."""
    session_id: str = Field(..., description="Temporary session ID assigned to the upload")
    mouse_id: str = Field(..., description="Derived mouse/dataset label")
    genotype: str = Field(..., description="Genotype label")
    available_brain_regions: List[str] = Field(..., description="Discovered brain regions")
    available_stimuli: List[str] = Field(..., description="Discovered stimuli")
    total_units: int = Field(..., description="Count of parsed neurons")
    total_trials: int = Field(..., description="Count of parsed trials")
    provenance: ProvenanceEnum = Field(ProvenanceEnum.USER_UPLOADED, description="Provenance tag")
    message: str = Field("Dataset successfully uploaded and converted to CanonicalNeuralDataset", description="Status message")
