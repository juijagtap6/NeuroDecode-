"""Unit tests for shared Pydantic schemas and provenance enforcement."""
import pytest
from pydantic import ValidationError
from app.schemas.common import ProvenanceEnum, HealthResponse
from app.schemas.matrix import CanonicalSpikeMatrix
from app.schemas.simulation import LIFSimConfig, LIFSimResult
from app.schemas.session import SessionSummary, UnitMetadata

def test_provenance_enum_values():
    assert ProvenanceEnum.ALLEN_EXPERIMENTAL.value == "allen_experimental"
    assert ProvenanceEnum.SYNTHETIC_LIF.value == "synthetic_lif"

def test_canonical_spike_matrix_valid():
    matrix = CanonicalSpikeMatrix(
        provenance=ProvenanceEnum.ALLEN_EXPERIMENTAL,
        session_id="715093703",
        unit_ids=[101, 102],
        structures=["VISp", "LGd"],
        time_bin_edges=[0.0, 0.1, 0.2, 0.3],
        bin_size_sec=0.1,
        matrix=[
            [1.0, 2.0, 0.0],
            [0.0, 1.0, 3.0]
        ],
        metadata={"stimulus": "drifting_gratings"}
    )
    assert matrix.provenance == ProvenanceEnum.ALLEN_EXPERIMENTAL
    assert len(matrix.unit_ids) == 2
    assert len(matrix.matrix[0]) == 3

def test_canonical_spike_matrix_invalid_provenance():
    with pytest.raises(ValidationError):
        CanonicalSpikeMatrix(
            provenance="unknown_fabricated_source",
            unit_ids=[1],
            time_bin_edges=[0.0, 0.1],
            bin_size_sec=0.1,
            matrix=[[1.0]]
        )

def test_lif_sim_config_defaults():
    config = LIFSimConfig()
    assert config.v_rest == -70.0
    assert config.v_thresh == -50.0
    assert config.v_reset == -65.0
    assert config.tau_m == 20.0
    assert config.dt_ms == 0.1

def test_session_summary_serialization():
    summary = SessionSummary(
        session_id=715093703,
        session_type="brain_observatory_1.1",
        unit_count=884,
        structures=["VISp", "LGd", "CA1"],
        has_nwb=True
    )
    assert summary.session_id == 715093703
    assert len(summary.structures) == 3
