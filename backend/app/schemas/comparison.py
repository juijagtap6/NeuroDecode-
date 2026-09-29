"""Comparison module API schemas for Overview, Session Comparison, and Population Comparison."""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Union
from .common import ProvenanceEnum


# ==============================================================================
# Common & Request Schemas
# ==============================================================================

class ComparisonSessionSelector(BaseModel):
    """Payload to identify a dataset / session for comparison."""
    session_id: Union[int, str] = Field(..., description="Session identifier (integer for Allen, string for custom/upload)")
    source: str = Field(default="allen_experimental", description="Dataset source/provenance")

ComparisonSessionOption = ComparisonSessionSelector


class ComparisonBaseRequest(BaseModel):
    """Base request specifying two datasets to compare."""
    session_a_id: Union[int, str] = Field(..., description="Session/Dataset A identifier")
    session_b_id: Union[int, str] = Field(..., description="Session/Dataset B identifier")
    source_a: str = Field(default="allen_experimental", description="Source for Dataset A")
    source_b: str = Field(default="allen_experimental", description="Source for Dataset B")


# ==============================================================================
# 1. Overview Schemas
# ==============================================================================

class DatasetOverviewSummary(BaseModel):
    """High-level summary of a single dataset in the comparison."""
    session_id: Union[int, str]
    name: str
    source: str
    provenance: ProvenanceEnum
    genotype: Optional[str] = None
    session_type: Optional[str] = None
    total_units: int
    total_trials: int
    duration_sec: float
    region_count: int
    regions: List[str]
    stimulus_count: int
    stimuli: List[str]


class OverviewMetricDiff(BaseModel):
    """Difference calculation for a numeric metric."""
    value_a: float
    value_b: float
    delta: float = Field(..., description="value_b - value_a")
    percent_change: Optional[float] = Field(None, description="Percentage change from A to B")


class RegionOverlapSummary(BaseModel):
    """Overlap summary for recorded brain structures."""
    shared_regions: List[str]
    unique_to_a: List[str]
    unique_to_b: List[str]
    total_union_count: int
    shared_count: int
    jaccard_similarity: float


class StimulusOverlapSummary(BaseModel):
    """Overlap summary for stimulus protocols."""
    shared_stimuli: List[str]
    unique_to_a: List[str]
    unique_to_b: List[str]
    total_union_count: int
    shared_count: int
    jaccard_similarity: float


class PopulationSimilarityBreakdown(BaseModel):
    """Aggregate population similarity score and underlying dimensional breakdown."""
    overall_similarity_pct: float = Field(..., description="Overall aggregate population similarity percentage (0-100%)")
    pca_similarity_pct: float = Field(..., description="PCA manifold dynamic correlation & variance match (0-100%)")
    region_overlap_pct: float = Field(..., description="Anatomical brain structure Jaccard similarity (0-100%)")
    stimulus_overlap_pct: float = Field(..., description="Sensory protocol concordance percentage (0-100%)")
    rate_similarity_pct: float = Field(..., description="Baseline firing rate alignment percentage (0-100%)")
    scale_similarity_pct: Optional[float] = Field(default=100.0, description="Population unit yield scale concordance (0-100%)")


class ComparisonOverviewResponse(BaseModel):
    """Comprehensive comparison overview response."""
    dataset_a: DatasetOverviewSummary
    dataset_b: DatasetOverviewSummary
    neuron_diff: OverviewMetricDiff
    trial_diff: OverviewMetricDiff
    duration_diff: OverviewMetricDiff
    region_overlap: RegionOverlapSummary
    stimulus_overlap: StimulusOverlapSummary
    similarity: PopulationSimilarityBreakdown
    scientific_summary: str = Field(..., description="Data-driven scientific overview narrative")


# ==============================================================================
# 2. Session Comparison Schemas
# ==============================================================================

class SessionMetadataRecord(BaseModel):
    """Metadata specification for a session."""
    session_id: Union[int, str]
    specimen_id: Optional[Union[int, str]] = None
    mouse_id: Optional[Union[int, str]] = None
    genotype: Optional[str] = None
    session_type: Optional[str] = None
    date_of_acquisition: Optional[str] = None
    source: str
    has_nwb: bool = True
    total_units: int
    total_trials: int
    duration_sec: float


class RegionComparisonItem(BaseModel):
    """Region comparison entry with unit counts across datasets."""
    region: str
    present_in_a: bool
    present_in_b: bool
    units_a: int = 0
    units_b: int = 0
    pct_a: float = 0.0
    pct_b: float = 0.0


class StimulusComparisonItem(BaseModel):
    """Stimulus presentation comparison entry."""
    stimulus_name: str
    present_in_a: bool
    present_in_b: bool
    presentations_a: int = 0
    presentations_b: int = 0


class SessionComparisonResponse(BaseModel):
    """Side-by-side session comparison response."""
    session_a: SessionMetadataRecord
    session_b: SessionMetadataRecord
    region_items: List[RegionComparisonItem]
    stimulus_items: List[StimulusComparisonItem]
    region_overlap: RegionOverlapSummary
    stimulus_overlap: StimulusOverlapSummary
    similarity: PopulationSimilarityBreakdown
    scientific_difference_summary: str = Field(..., description="Scientific session difference observations")


# ==============================================================================
# 3. Population Comparison Schemas
# ==============================================================================

class PCAPoint(BaseModel):
    """Single 2D coordinate in PCA state space."""
    pc1: float
    pc2: float
    label: Optional[str] = None
    time_sec: Optional[float] = None


class DatasetPCAResult(BaseModel):
    """PCA dimensionality reduction result for a single dataset."""
    session_id: Union[int, str]
    dataset_name: str
    provenance: ProvenanceEnum
    explained_variance_ratio: List[float] = Field(..., description="Variance explained by top PCs (e.g. PC1, PC2, PC3)")
    total_variance_explained_2d: float = Field(..., description="Sum of PC1 and PC2 explained variance")
    points: List[PCAPoint] = Field(..., description="Projected 2D coordinates")


class PopulationStatsRecord(BaseModel):
    """Firing rate population statistics."""
    mean_firing_rate: float
    median_firing_rate: float
    peak_firing_rate: float
    std_firing_rate: float
    active_neuron_count: int
    total_neuron_count: int
    active_neuron_pct: float
    fano_factor: Optional[float] = None
    cv_isi: Optional[float] = None


class ActivityDistributionHistogram(BaseModel):
    """Histogram of firing rates across the neural population."""
    bin_edges: List[float]
    counts: List[int]
    frequencies: List[float]


class RegionActivityItem(BaseModel):
    """Regional mean activity comparison."""
    region: str
    mean_firing_rate_a: Optional[float] = None
    mean_firing_rate_b: Optional[float] = None
    unit_count_a: int = 0
    unit_count_b: int = 0
    delta_rate: Optional[float] = None


class PopulationComparisonResponse(BaseModel):
    """Population dynamics comparison response."""
    dataset_a_name: str
    dataset_b_name: str
    pca_a: DatasetPCAResult
    pca_b: DatasetPCAResult
    stats_a: PopulationStatsRecord
    stats_b: PopulationStatsRecord
    distribution_a: ActivityDistributionHistogram
    distribution_b: ActivityDistributionHistogram
    region_activity: List[RegionActivityItem]
    similarity: PopulationSimilarityBreakdown
    population_summary: str = Field(..., description="Scientific summary of population dynamics and dimensionality")



# Legacy compatibility models if needed by any older references
class FiringStatistics(BaseModel):
    provenance: ProvenanceEnum
    mean_firing_rate: float
    std_firing_rate: float
    cv_isi: float
    fano_factor: float
    isi_distribution_bins: List[float] = Field(default_factory=list)
    isi_distribution_counts: List[int] = Field(default_factory=list)

class CorrelationAnalysis(BaseModel):
    provenance: ProvenanceEnum
    unit_ids: List[int]
    correlation_matrix: List[List[float]]
    mean_pairwise_correlation: float

class PCAResult(BaseModel):
    provenance: ProvenanceEnum
    explained_variance_ratio: List[float]
    time_points_sec: List[float]
    pc_projections: List[List[float]]

class ComparisonRequest(BaseModel):
    analysis_type: str = "all"
    allen_session_id: Optional[int] = None
    selected_structures: Optional[List[str]] = None
    include_synthetic_lif: bool = True

class ComparisonResponse(BaseModel):
    analysis_type: str
    experimental: Optional[Dict[str, Any]] = None
    synthetic: Optional[Dict[str, Any]] = None
    summary: str
