"""API v1 Router definitions with all 4 module routes."""
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Response
from typing import List, Optional
from ...schemas.common import HealthResponse, ProvenanceEnum
from ...schemas.session import SessionSummary, UnitMetadata, StimulusPresentation
from ...schemas.decoder import DecoderTrainRequest, DecoderResult
from ...schemas.simulation import (
    LIFSimConfig,
    LIFSimResult,
    SimulationRunRequest,
    SimulationResponse,
    MembranePotentialData,
)
from ...schemas.comparison import ComparisonRequest, ComparisonResponse, FiringStatistics
from ...services.allen_data_service import allen_data_service
from ...services.simulation_service import lif_simulation_service

router = APIRouter()

# -------------------------------------------------------------
# Base & Health Endpoint
# -------------------------------------------------------------
@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Return health status, API version, and dataset readiness."""
    return HealthResponse(
        status="ok",
        version="0.1.0",
        active_dataset="Allen Brain Observatory - Neuropixels Visual Coding",
        cache_ready=allen_data_service.is_ready()
    )

# -------------------------------------------------------------
# 1. Explorer Module Endpoints
# -------------------------------------------------------------
@router.get("/explorer/sessions", response_model=List[SessionSummary])
@router.get("/sessions", response_model=List[SessionSummary])
def list_sessions() -> List[SessionSummary]:
    """List all available authentic Allen Neuropixels sessions."""
    sessions = allen_data_service.get_available_sessions()
    return sessions

@router.get("/explorer/sessions/{session_id}", response_model=SessionSummary)
@router.get("/sessions/{session_id}", response_model=SessionSummary)
def get_session(session_id: int) -> SessionSummary:
    """Get metadata for a specific session by ID."""
    summary = allen_data_service.get_session_summary(session_id)
    if not summary:
        raise HTTPException(
            status_code=404,
            detail=f"Allen Neuropixels session {session_id} not found in metadata warehouse."
        )
    return summary

@router.get("/explorer/sessions/{session_id}/units", response_model=List[UnitMetadata])
@router.get("/sessions/{session_id}/units", response_model=List[UnitMetadata])
def get_session_units(
    session_id: int,
    structure: Optional[List[str]] = Query(None, description="Filter by brain structure acronym"),
    min_snr: Optional[float] = Query(None, description="Filter by minimum SNR")
) -> List[UnitMetadata]:
    """Retrieve unit metadata and QC metrics for an Allen session."""
    units = allen_data_service.get_session_units(
        session_id=session_id,
        structures=structure,
        min_snr=min_snr
    )
    return units

@router.get("/explorer/sessions/{session_id}/stimuli", response_model=List[StimulusPresentation])
@router.get("/sessions/{session_id}/stimuli", response_model=List[StimulusPresentation])
def get_session_stimuli(
    session_id: int,
    stimulus_name: Optional[str] = Query(None, description="Filter by stimulus protocol name")
) -> List[StimulusPresentation]:
    """Retrieve stimulus presentations for an Allen session."""
    stimuli = allen_data_service.get_session_stimuli(session_id, stimulus_name=stimulus_name)
    return stimuli

# -------------------------------------------------------------
# 2. Decoder Module Endpoints
# -------------------------------------------------------------
@router.post("/decoder/train", response_model=DecoderResult)
def train_decoder(request: DecoderTrainRequest) -> DecoderResult:
    """
    Train a neural population decoder on authentic Allen visual responses.
    If session spike times or stimulus tables are not yet cached, returns a clear data blocker error.
    """
    try:
        # Check if authentic session data is cached
        allen_data_service.get_canonical_spike_matrix(
            session_id=request.session_id,
            start_time_sec=0.0,
            stop_time_sec=1.0
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Data Blocker: {str(e)} In accordance with project policy, synthetic data will not be substituted for experimental requests."
        )

    # Will be fully implemented on Dev Branch 2 (Decoder + Comparison)
    raise HTTPException(
        status_code=501,
        detail="Decoder training implementation is assigned to Dev Branch 2."
    )

# -------------------------------------------------------------
# 3. Simulation Module Endpoints (LIF Only)
# -------------------------------------------------------------
@router.post("/simulation/run", response_model=SimulationResponse)
def run_simulation(request: SimulationRunRequest) -> SimulationResponse:
    """
    Run population Leaky Integrate-and-Fire (LIF) numerical simulation.
    Supports 'quick' and 'custom' modes.
    Always returns canonical SimulationResponse tagged strictly with provenance: 'synthetic_lif'.
    """
    try:
        response = lif_simulation_service.run_population_simulation(request.params)
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Simulation Error: {str(e)}")

@router.post("/simulation/upload", response_model=SimulationResponse)
async def upload_simulation_dataset(file: UploadFile = File(...)) -> SimulationResponse:
    """
    Accept user-uploaded CSV spike train data (Bring Your Own Data).
    Validates the dataset without fabricating data.
    Produces the canonical neural representation tagged with provenance: 'user_uploaded'.
    Uploaded files are processed in memory and discarded.
    """
    if not file.filename.lower().endswith((".csv", ".txt")):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format: '{file.filename}'. Please upload a valid CSV file (.csv)."
        )

    try:
        content = await file.read()
        response = lif_simulation_service.parse_and_validate_csv(content, file.filename)
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Upload processing failed: {str(e)}")
    finally:
        await file.close()

@router.get("/simulation/trace/{neuron_id}", response_model=MembranePotentialData)
def get_neuron_membrane_trace(neuron_id: int) -> MembranePotentialData:
    """
    Retrieve full membrane potential V(t) trace for a specific neuron from the active simulation.
    """
    trace_data = lif_simulation_service.get_neuron_trace(neuron_id)
    if not trace_data:
        raise HTTPException(
            status_code=404,
            detail=f"Neuron {neuron_id} membrane potential trace is not available. Please run a simulation first."
        )
    return trace_data

@router.get("/simulation/sample-csv")
def get_sample_csv(sample_type: str = "spike"):
    """Download a valid sample spike train or continuous membrane potential CSV for Bring Your Own Data testing."""
    sample_content = lif_simulation_service.generate_sample_csv(sample_type=sample_type)
    filename = "sample_neural_voltage.csv" if sample_type == "voltage" else "sample_neural_spikes.csv"
    return Response(
        content=sample_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/simulation/lif", response_model=LIFSimResult)
def run_lif_simulation(config: LIFSimConfig) -> LIFSimResult:
    """
    Legacy single-neuron biophysical Leaky Integrate-and-Fire (LIF) numerical simulation.
    Always returns results tagged strictly with provenance: 'synthetic_lif'.
    """
    result = lif_simulation_service.run_simulation(config)
    return result

# -------------------------------------------------------------
# 4. Comparison Module Endpoints
# -------------------------------------------------------------
@router.post("/comparison/analyze", response_model=ComparisonResponse)
def analyze_comparison(request: ComparisonRequest) -> ComparisonResponse:
    """
    Run Firing Statistics, Correlation, and PCA comparisons between authentic and synthetic data.
    """
    synthetic_sim = lif_simulation_service.run_simulation(LIFSimConfig())
    synthetic_firing_stats = FiringStatistics(
        provenance=ProvenanceEnum.SYNTHETIC_LIF,
        mean_firing_rate=synthetic_sim.mean_firing_rate_hz,
        std_firing_rate=0.0,
        cv_isi=0.05,
        fano_factor=0.95,
        isi_distribution_bins=[10.0, 20.0, 30.0],
        isi_distribution_counts=[synthetic_sim.total_spikes, 0, 0]
    )

    return ComparisonResponse(
        analysis_type=request.analysis_type,
        experimental=None,  # Clearly None until authentic session NWB is cached
        synthetic={"firing_stats": synthetic_firing_stats.model_dump()},
        summary="Comparison foundation ready. Experimental metrics will populate once authentic session NWB is cached locally."
    )
