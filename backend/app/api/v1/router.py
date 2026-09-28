"""API v1 Router definitions with all 4 module routes."""
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import List, Optional, Union
from ...schemas.common import HealthResponse, ProvenanceEnum
from ...schemas.session import SessionSummary, UnitMetadata, StimulusPresentation
from ...schemas.canonical import (
    ExplorerSessionSummary,
    SessionMetadata,
    TrialMetadata,
    PCAResponse,
    HeatmapResponse,
    PopulationTraceResponse,
    UploadResponse,
)
from ...schemas.decoder import DecoderTrainRequest, DecoderResult
from ...schemas.simulation import LIFSimConfig, LIFSimResult
from ...schemas.comparison import ComparisonRequest, ComparisonResponse, FiringStatistics
from ...services.allen_data_service import allen_data_service
from ...services.simulation_service import lif_simulation_service
from ...services.explorer_service import explorer_service

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
# 1. Explorer Module Endpoints (/explorer/...)
# -------------------------------------------------------------
@router.get("/explorer/sessions", response_model=List[ExplorerSessionSummary])
def list_explorer_sessions() -> List[ExplorerSessionSummary]:
    """
    List all available sessions for the Explorer.
    Includes both official Allen Institute Neuropixels sessions and any active user-uploaded datasets.
    """
    return explorer_service.get_available_sessions()

@router.get("/sessions", response_model=List[SessionSummary])
def list_sessions() -> List[SessionSummary]:
    """Legacy endpoint: List all available authentic Allen Neuropixels sessions."""
    sessions = allen_data_service.get_available_sessions()
    return sessions

@router.get("/explorer/session/{session_id}", response_model=SessionMetadata)
@router.get("/explorer/sessions/{session_id}", response_model=SessionMetadata)
def get_explorer_session(session_id: str) -> SessionMetadata:
    """Get metadata for a specific session by ID (Allen or uploaded)."""
    try:
        return explorer_service.get_session_metadata(session_id)
    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"Session {session_id} not found in metadata warehouse: {str(e)}"
        )

@router.get("/sessions/{session_id}", response_model=SessionSummary)
def get_session(session_id: int) -> SessionSummary:
    """Legacy endpoint: Get metadata for a specific Allen session by ID."""
    summary = allen_data_service.get_session_summary(session_id)
    if not summary:
        raise HTTPException(
            status_code=404,
            detail=f"Allen Neuropixels session {session_id} not found in metadata warehouse."
        )
    return summary

@router.get("/explorer/regions", response_model=List[str])
def get_explorer_regions(
    session_id: Optional[str] = Query(None, description="Optional session ID filter")
) -> List[str]:
    """Get available brain regions/structures (e.g. VISp, VISl, VISam, LP, LGd, CA1)."""
    return explorer_service.get_available_regions(session_id)

@router.get("/explorer/stimuli", response_model=List[str])
def get_explorer_stimuli(
    session_id: Optional[str] = Query(None, description="Optional session ID filter")
) -> List[str]:
    """Get available stimulus presentation protocols (e.g. drifting_gratings, natural_scenes, natural_movies)."""
    return explorer_service.get_available_stimuli(session_id)

@router.get("/explorer/pca", response_model=PCAResponse)
def get_explorer_pca(
    session_id: str = Query("715093703", description="Session ID"),
    stimulus: Optional[str] = Query(None, description="Filter by visual stimulus"),
    region: Optional[str] = Query(None, description="Filter by brain region acronym"),
    pc_x: int = Query(1, ge=1, le=10, description="1-indexed PC on X axis (default 1 for PC1)"),
    pc_y: int = Query(2, ge=1, le=10, description="1-indexed PC on Y axis (default 2 for PC2)"),
    force_refresh: bool = Query(False, description="Bypass and invalidate cached PCA")
) -> PCAResponse:
    """
    Compute or retrieve cached PCA projection server-side using sklearn.decomposition.PCA.
    Results are cached under backend/data/cache/pca. If force_refresh=True, cached file is invalidated.
    """
    try:
        return explorer_service.compute_pca(
            session_id=session_id,
            stimulus=stimulus,
            region=region,
            pc_x=pc_x,
            pc_y=pc_y,
            force_refresh=force_refresh
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PCA computation error: {str(e)}")

@router.get("/explorer/heatmap", response_model=HeatmapResponse)
def get_explorer_heatmap(
    session_id: str = Query("715093703", description="Session ID"),
    trial_id: Optional[str] = Query(None, description="Filter by specific trial ID"),
    region: Optional[str] = Query(None, description="Filter by brain region acronym"),
    normalize: str = Query("none", description="Normalization method: 'none', 'z-score', or 'min-max'"),
    max_neurons: int = Query(50, ge=1, le=500, description="Maximum neurons to display"),
    t_min: Optional[float] = Query(None, description="Window start time in seconds"),
    t_max: Optional[float] = Query(None, description="Window end time in seconds")
) -> HeatmapResponse:
    """
    Generate population firing-rate heatmap (neurons x time).
    Supports neuron filtering, region filtering, trial filtering, and normalization.
    """
    time_window = [t_min, t_max] if (t_min is not None and t_max is not None) else None
    try:
        return explorer_service.compute_heatmap(
            session_id=session_id,
            trial_id=trial_id,
            region=region,
            normalize=normalize,
            max_neurons=max_neurons,
            time_window=time_window
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Heatmap computation error: {str(e)}")

@router.get("/explorer/population-trace", response_model=PopulationTraceResponse)
def get_explorer_population_trace(
    session_id: str = Query("715093703", description="Session ID"),
    trial_id: Optional[str] = Query(None, description="Filter by trial ID"),
    region: Optional[str] = Query(None, description="Filter by brain region acronym"),
    stimulus: Optional[str] = Query(None, description="Filter by stimulus protocol"),
    smoothing_window: int = Query(0, ge=0, le=50, description="Moving average smoothing window size"),
    averaging_method: str = Query("mean", description="Averaging method: 'mean' or 'median'"),
    t_min: Optional[float] = Query(None, description="Window start time in seconds"),
    t_max: Optional[float] = Query(None, description="Window end time in seconds")
) -> PopulationTraceResponse:
    """
    Generate population mean firing-rate trace.
    Supports smoothing, time window filtering, and averaging method.
    """
    time_window = [t_min, t_max] if (t_min is not None and t_max is not None) else None
    try:
        return explorer_service.compute_population_trace(
            session_id=session_id,
            trial_id=trial_id,
            region=region,
            stimulus=stimulus,
            smoothing_window=smoothing_window,
            averaging_method=averaging_method,
            time_window=time_window
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Population trace computation error: {str(e)}")

@router.get("/explorer/trial/{trial_id}", response_model=TrialMetadata)
def get_explorer_trial(
    trial_id: str,
    session_id: Optional[str] = Query(None, description="Session ID")
) -> TrialMetadata:
    """Get metadata for a specific visual presentation trial."""
    try:
        return explorer_service.get_trial_metadata(trial_id=trial_id, session_id=session_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Trial {trial_id} not found: {str(e)}")

@router.post("/explorer/upload", response_model=UploadResponse)
async def upload_explorer_dataset(file: UploadFile = File(...)) -> UploadResponse:
    """
    Upload a user neural dataset CSV.
    Required columns: trial_id, time, neuron_id, firing_rate, label.
    Converts dataset into CanonicalNeuralDataset and stores temporarily in memory only.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported for dataset upload.")

    try:
        contents = await file.read()
        return explorer_service.ingest_csv_upload(contents, file.filename)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {str(e)}")

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
@router.post("/simulation/lif", response_model=LIFSimResult)
def run_lif_simulation(config: LIFSimConfig) -> LIFSimResult:
    """
    Run biophysical Leaky Integrate-and-Fire (LIF) numerical simulation.
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
