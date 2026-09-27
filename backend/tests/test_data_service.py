"""Tests for the Allen Data Access Layer and contract conformance."""
import pytest
from app.services.allen_data_service import AllenDataService
from app.services.data_access_interface import IDataAccessService
from app.schemas.common import ProvenanceEnum

def test_allen_service_implements_interface():
    service = AllenDataService()
    assert isinstance(service, IDataAccessService)

def test_allen_service_handles_missing_raw_spikes_safely():
    """Verify service raises FileNotFoundError instead of fabricating data."""
    service = AllenDataService()
    with pytest.raises(FileNotFoundError) as exc_info:
        service.get_canonical_spike_matrix(
            session_id=999999999,
            start_time_sec=0.0,
            stop_time_sec=1.0
        )
    assert "Authentic spike times" in str(exc_info.value)
    assert "not substitute synthetic data" in str(exc_info.value)
