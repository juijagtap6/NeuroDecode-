"""Abstract base interface for electrophysiology data access."""
from abc import ABC, abstractmethod
from typing import List, Optional
from ..schemas.session import SessionSummary, UnitMetadata, StimulusPresentation
from ..schemas.matrix import CanonicalSpikeMatrix

class IDataAccessService(ABC):
    """
    Contract for electrophysiology data access.
    All modules (Explorer, Decoder, Comparison) must access neural data
    strictly through this service. Independent data loaders are prohibited.
    """

    @abstractmethod
    def get_available_sessions(self) -> List[SessionSummary]:
        """Retrieve list of experimental sessions with metadata."""
        pass

    @abstractmethod
    def get_session_summary(self, session_id: int) -> Optional[SessionSummary]:
        """Retrieve metadata summary for a specific session."""
        pass

    @abstractmethod
    def get_session_units(
        self,
        session_id: int,
        structures: Optional[List[str]] = None,
        min_snr: Optional[float] = None
    ) -> List[UnitMetadata]:
        """Retrieve single-unit metadata and QC metrics for a session."""
        pass

    @abstractmethod
    def get_session_stimuli(
        self,
        session_id: int,
        stimulus_name: Optional[str] = None
    ) -> List[StimulusPresentation]:
        """Retrieve stimulus presentations table for a session."""
        pass

    @abstractmethod
    def get_canonical_spike_matrix(
        self,
        session_id: int,
        start_time_sec: float,
        stop_time_sec: float,
        bin_size_sec: float = 0.010,
        unit_ids: Optional[List[int]] = None
    ) -> CanonicalSpikeMatrix:
        """
        Extract binned spike count matrix for selected units within a time window.
        Returns CanonicalSpikeMatrix tagged with ProvenanceEnum.ALLEN_EXPERIMENTAL.
        """
        pass
