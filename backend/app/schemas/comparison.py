"""Comparison module API schemas for Firing Statistics, Correlation, and PCA."""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from .common import ProvenanceEnum

class FiringStatistics(BaseModel):
    """Firing statistics computed on a neural population or simulation."""
    provenance: ProvenanceEnum
    mean_firing_rate: float = Field(..., description="Population mean firing rate in Hz")
    std_firing_rate: float = Field(..., description="Population std of firing rates in Hz")
    cv_isi: float = Field(..., description="Coefficient of variation of inter-spike intervals")
    fano_factor: float = Field(..., description="Fano factor (spike count variance / mean)")
    isi_distribution_bins: List[float] = Field(default_factory=list, description="ISI bin centers in ms")
    isi_distribution_counts: List[int] = Field(default_factory=list, description="ISI histogram counts")

class CorrelationAnalysis(BaseModel):
    """Spike train correlation matrix and summary statistics."""
    provenance: ProvenanceEnum
    unit_ids: List[int] = Field(..., description="Units included in correlation analysis")
    correlation_matrix: List[List[float]] = Field(
        ...,
        description="Pairwise Pearson correlation matrix [N x N] of binned spike trains"
    )
    mean_pairwise_correlation: float = Field(..., description="Average off-diagonal correlation")

class PCAResult(BaseModel):
    """Principal Component Analysis dimensionality reduction of population state space."""
    provenance: ProvenanceEnum
    explained_variance_ratio: List[float] = Field(
        ...,
        description="Fraction of variance explained by each principal component (PC1, PC2, ...)"
    )
    time_points_sec: List[float] = Field(..., description="Time coordinates for the trajectory")
    pc_projections: List[List[float]] = Field(
        ...,
        description="Projected coordinates over time: shape [n_components, n_time_points]"
    )

class ComparisonRequest(BaseModel):
    """Request to compare firing statistics, correlation, or PCA between sources."""
    analysis_type: str = Field(
        default="all",
        description="'firing_statistics', 'correlation', 'pca', or 'all'"
    )
    allen_session_id: Optional[int] = Field(None, description="Allen experimental session ID")
    selected_structures: Optional[List[str]] = Field(
        None,
        description="Filter experimental units by structure (e.g. ['VISp'])"
    )
    include_synthetic_lif: bool = Field(
        default=True,
        description="Include explicitly labeled synthetic LIF benchmark population"
    )

class ComparisonResponse(BaseModel):
    """Comparative response contrasting experimental and synthetic metrics."""
    analysis_type: str
    experimental: Optional[Dict[str, Any]] = Field(
        None,
        description="Metrics derived from authentic Allen Institute data (provenance: allen_experimental)"
    )
    synthetic: Optional[Dict[str, Any]] = Field(
        None,
        description="Metrics derived from synthetic LIF simulation (provenance: synthetic_lif)"
    )
    summary: str = Field(..., description="Scientific interpretation of the comparative metrics")
