"""Canonical Spike Matrix schema representing population neural activity."""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from .common import ProvenanceEnum

class CanonicalSpikeMatrix(BaseModel):
    """
    Standard analysis representation of population neural activity.
    Shared contract used across Explorer, Decoder, Simulation, and Comparison.
    """
    provenance: ProvenanceEnum = Field(
        ...,
        description="Origin of the spike data: 'allen_experimental' or 'synthetic_lif'"
    )
    session_id: Optional[str] = Field(None, description="Allen session ID if experimental")
    unit_ids: List[int] = Field(..., description="List of N unit identifiers")
    structures: Optional[List[str]] = Field(None, description="Brain structure for each unit in unit_ids")
    time_bin_edges: List[float] = Field(..., description="Edges of the T time bins in seconds (length T+1)")
    bin_size_sec: float = Field(..., description="Width of each time bin in seconds (e.g. 0.010 for 10ms)")
    # Matrix shape: [N units x T time bins] containing spike counts or binned firing rates
    matrix: List[List[float]] = Field(
        ...,
        description="2D array of shape [N_units, T_bins] representing binned spike counts"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Contextual metadata (e.g. stimulus condition, simulation params, sampling rate)"
    )
