"""API v1 Router definitions with all 4 module routes."""
import json
import logging
from typing import List, Optional, Union
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Response

from ...schemas.common import HealthResponse, ProvenanceEnum
from ...schemas.session import SessionSummary, UnitMetadata, StimulusPresentation
from ...schemas.canonical import (
    SessionMetadata,
    TrialMetadata,
    ExplorerSessionSummary,
    PCAResponse,
    HeatmapResponse,
    PopulationTraceResponse,
    UploadResponse,
)
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
from ...schemas.simulation import (
    LIFSimConfig,
    LIFSimResult,
    SimulationRunRequest,
    SimulationResponse,
    MembranePotentialData,
)
from ...schemas.comparison import (
    ComparisonBaseRequest,
    ComparisonOverviewResponse,
    SessionComparisonResponse,
    PopulationComparisonResponse,
    ComparisonRequest,
    ComparisonResponse,
    FiringStatistics,
)

from ...services.allen_data_service import allen_data_service
from ...services.explorer_service import explorer_service
from ...services.decoder_service import decoder_service
from ...services.simulation_service import lif_simulation_service
from ...services.comparison_service import comparison_service

logger = logging.getLogger(__name__)

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
@router.get("/comparison/sessions")
def get_comparison_sessions():
    """List all available recording sessions for comparison selection (Allen & Uploads)."""
    return comparison_service.get_available_comparison_sessions()

@router.post("/comparison/upload")
def upload_comparison_dataset(payload: dict):
    """Upload and validate a custom ecephys dataset JSON for comparison against Allen or other uploads."""
    try:
        return comparison_service.save_uploaded_dataset(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded dataset: {str(e)}")

@router.post("/comparison/upload-file")
async def upload_comparison_file(file: UploadFile = File(...)):
    """Upload and parse a CSV or JSON file containing unit metrics or recordings."""
    try:
        content = await file.read()
        filename = file.filename or "uploaded_dataset"
        if filename.endswith(".csv"):
            text = content.decode("utf-8", errors="replace")
            return comparison_service.save_uploaded_csv(text, filename=filename)
        elif filename.endswith(".json"):
            text = content.decode("utf-8", errors="replace")
            data = json.loads(text)
            return comparison_service.save_uploaded_dataset(data)
        else:
            text = content.decode("utf-8", errors="replace")
            return comparison_service.save_uploaded_csv(text, filename=filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process uploaded file: {str(e)}")

@router.post("/comparison/overview", response_model=ComparisonOverviewResponse)
def compare_overview(request: ComparisonBaseRequest) -> ComparisonOverviewResponse:
    """Generate high-level comparative overview and metrics between Dataset A and Dataset B."""
    try:
        return comparison_service.compute_overview(request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate comparison overview: {str(e)}")

@router.post("/comparison/session", response_model=SessionComparisonResponse)
def compare_session(request: ComparisonBaseRequest) -> SessionComparisonResponse:
    """Generate detailed side-by-side session metadata, region distribution, and stimulus comparisons."""
    try:
        return comparison_service.compute_session_comparison(request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate session comparison: {str(e)}")

@router.post("/comparison/population", response_model=PopulationComparisonResponse)
def compare_population(request: ComparisonBaseRequest) -> PopulationComparisonResponse:
    """Generate population dynamics comparison including side-by-side PCA, firing distributions, and regional rates."""
    try:
        return comparison_service.compute_population_comparison(request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate population comparison: {str(e)}")

@router.post("/comparison/analyze", response_model=ComparisonResponse)
def analyze_comparison(request: ComparisonRequest) -> ComparisonResponse:
    """
    Legacy comparison endpoint for Firing Statistics, Correlation, and PCA between authentic and synthetic data.
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
        experimental=None,
        synthetic={"firing_stats": synthetic_firing_stats.model_dump()},
        summary="Comparison foundation ready. Experimental metrics populate dynamically via the comparison service."
    )
