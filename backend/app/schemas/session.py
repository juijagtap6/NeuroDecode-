"""Session and electrophysiology unit metadata schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List

class SessionSummary(BaseModel):
    """Summary of an Allen Neuropixels experimental recording session."""
    session_id: int = Field(..., description="Unique session identifier in Allen warehouse")
    date_of_acquisition: Optional[str] = Field(None, description="ISO acquisition timestamp")
    session_type: str = Field(..., description="Session protocol type, e.g. brain_observatory_1.1")
    genotype: Optional[str] = Field(None, description="Mouse genetic line/transgenic model")
    specimen_id: Optional[int] = Field(None, description="Specimen identifier")
    unit_count: int = Field(..., description="Total recorded units in session")
    structures: List[str] = Field(default_factory=list, description="Recorded brain structures (CCFv3)")
    has_nwb: bool = Field(default=True, description="Whether official NWB is available from Allen")
    data_status: str = Field(
        default="metadata_available",
        description="Local data status: 'metadata_available', 'cached', or 'raw_pending'"
    )

class UnitMetadata(BaseModel):
    """Single-unit metadata and quality control metrics from Neuropixels recording."""
    unit_id: int = Field(..., description="Unique unit identifier")
    ecephys_session_id: int = Field(..., description="Parent session ID")
    ecephys_structure_acronym: str = Field(..., description="Brain structure acronym (e.g. VISp, LGd, CA1)")
    firing_rate: float = Field(..., description="Baseline firing rate in Hz")
    snr: Optional[float] = Field(None, description="Signal-to-noise ratio")
    isi_violations: Optional[float] = Field(None, description="Fraction of inter-spike intervals < 1.5ms")
    presence_ratio: Optional[float] = Field(None, description="Fraction of session unit was present")
    isolation_distance: Optional[float] = Field(None, description="Cluster isolation distance")
    amplitude_cutoff: Optional[float] = Field(None, description="Estimate of missed spikes due to thresholding")

class StimulusPresentation(BaseModel):
    """Single presentation of a visual stimulus during experimental session."""
    stimulus_presentation_id: int = Field(..., description="Unique presentation ID")
    stimulus_name: str = Field(..., description="Stimulus category, e.g. drifting_gratings, natural_scenes")
    start_time: float = Field(..., description="Presentation onset time in seconds")
    stop_time: float = Field(..., description="Presentation offset time in seconds")
    duration: float = Field(..., description="Duration in seconds")
    orientation: Optional[float] = Field(None, description="Grating orientation in degrees")
    spatial_frequency: Optional[float] = Field(None, description="Spatial frequency in cycles/degree")
    temporal_frequency: Optional[float] = Field(None, description="Temporal frequency in Hz")
    contrast: Optional[float] = Field(None, description="Stimulus contrast (0.0 - 1.0)")
