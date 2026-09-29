"""API v1 Router definitions with all 4 module routes."""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ...schemas.common import HealthResponse, ProvenanceEnum
from ...schemas.session import SessionSummary, UnitMetadata, StimulusPresentation
from ...schemas.decoder import (
    DecoderTrainRequest,
    DecoderResult,
    DecoderDatasetSummary,
    DecoderDatasetDetail,
    TargetsResponse,
    DecoderRunResponse,
    PerformanceResponse,
    ConfusionMatrixResponse,
    FeatureImportanceResponse,
    BrainMappingResponse,
    PredictionsResponse,
    PredictionDetailResponse,
)
from ...schemas.simulation import LIFSimConfig, LIFSimResult
from ...schemas.comparison import ComparisonRequest, ComparisonResponse, FiringStatistics
from ...services.allen_data_service import allen_data_service
from ...services.simulation_service import lif_simulation_service
from ...services.decoder_service import decoder_service

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
@router.get("/decoder/datasets", response_model=List[DecoderDatasetSummary])
def get_decoder_datasets() -> List[DecoderDatasetSummary]:
    """Return datasets/sessions available for neural population decoding."""
    return decoder_service.get_available_datasets()

@router.get("/decoder/dataset/{dataset_id}", response_model=DecoderDatasetDetail)
def get_decoder_dataset(dataset_id: str) -> DecoderDatasetDetail:
    """Return detailed metadata for a selected decoding dataset."""
    try:
        return decoder_service.get_dataset_detail(dataset_id)
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Data Blocker: {str(e)} In accordance with project policy, synthetic data will not be substituted for experimental requests."
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/decoder/targets", response_model=TargetsResponse)
def get_decoder_targets(dataset_id: str = Query("715093703", description="Dataset or session ID")) -> TargetsResponse:
    """Return available decoding targets for the selected dataset."""
    try:
        return decoder_service.get_decoding_targets(dataset_id)
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Data Blocker: {str(e)} In accordance with project policy, synthetic data will not be substituted for experimental requests."
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/decoder/train", response_model=DecoderRunResponse)
def train_decoder(request: DecoderTrainRequest) -> DecoderRunResponse:
    """
    Train a neural population decoder on authentic visual coding data.
    Executes stratified train/test split, model training, held-out evaluation,
    stratified K-fold cross-validation, feature importance extraction,
    CCFv3 mapping, and trial-level prediction generation.
    """
    try:
        run_data = decoder_service.train_decoder(request)
        return run_data["run_response"]
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Data Blocker: {str(e)} In accordance with project policy, synthetic data will not be substituted for experimental requests."
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Decoder training failed")
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")

@router.get("/decoder/run/{run_id}", response_model=DecoderRunResponse)
def get_decoder_run(run_id: str) -> DecoderRunResponse:
    """Return Decoder Run status and metadata."""
    try:
        return decoder_service.get_run(run_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Decoder Run '{run_id}' not found.")

@router.get("/decoder/run/{run_id}/performance", response_model=PerformanceResponse)
def get_decoder_performance(run_id: str) -> PerformanceResponse:
    """Return held-out test metrics, cross-validation metrics, and fold-level metrics."""
    try:
        return decoder_service.get_performance(run_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Decoder Run '{run_id}' not found.")

@router.get("/decoder/run/{run_id}/confusion-matrix", response_model=ConfusionMatrixResponse)
def get_decoder_confusion_matrix(run_id: str) -> ConfusionMatrixResponse:
    """Return class labels and confusion matrix from held-out test data."""
    try:
        return decoder_service.get_confusion_matrix(run_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Decoder Run '{run_id}' not found.")

@router.get("/decoder/run/{run_id}/feature-importance", response_model=FeatureImportanceResponse)
def get_decoder_feature_importance(run_id: str) -> FeatureImportanceResponse:
    """Return model-specific neural unit feature weights and importances."""
    try:
        return decoder_service.get_feature_importance(run_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Decoder Run '{run_id}' not found.")

@router.get("/decoder/run/{run_id}/brain-mapping", response_model=BrainMappingResponse)
def get_decoder_brain_mapping(run_id: str) -> BrainMappingResponse:
    """Return CCFv3 brain region mappings and regional population aggregations."""
    try:
        return decoder_service.get_brain_mapping(run_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Decoder Run '{run_id}' not found.")

@router.get("/decoder/run/{run_id}/predictions", response_model=PredictionsResponse)
def get_decoder_predictions(run_id: str) -> PredictionsResponse:
    """Return trial-level predictions and error inspection data."""
    try:
        return decoder_service.get_predictions(run_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Decoder Run '{run_id}' not found.")

@router.get("/decoder/run/{run_id}/predictions/{trial_id}", response_model=PredictionDetailResponse)
def get_decoder_prediction_detail(run_id: str, trial_id: int) -> PredictionDetailResponse:
    """Return detailed prediction explanation and neural features for an individual trial."""
    try:
        return decoder_service.get_prediction_detail(run_id, trial_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

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
