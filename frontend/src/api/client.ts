/**
 * NeuroDecode API Client
 * Centralized HTTP service communicating with the FastAPI backend under /api/v1
 */
import {
  HealthResponse,
  SessionSummary,
  UnitMetadata,
  StimulusPresentation,
  DecoderDatasetSummary,
  DecoderDatasetDetail,
  TargetsResponse,
  DecoderTrainRequest,
  DecoderRunResponse,
  PerformanceResponse,
  ConfusionMatrixResponse,
  FeatureImportanceResponse,
  BrainMappingResponse,
  PredictionsResponse,
  PredictionDetailResponse,
} from '../types';

const BASE_URL = '/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let parsedMessage = errorBody;
    try {
      const errJson = JSON.parse(errorBody);
      if (errJson.detail) parsedMessage = errJson.detail;
    } catch {
      // keep raw errorBody
    }
    throw new Error(`API Error [${response.status}]: ${parsedMessage}`);
  }

  return response.json();
}

export const api = {
  getHealth: (): Promise<HealthResponse> => request<HealthResponse>('/health'),
  getSessions: (): Promise<SessionSummary[]> => request<SessionSummary[]>('/sessions'),
  getSession: (id: number): Promise<SessionSummary> => request<SessionSummary>(`/sessions/${id}`),
  getSessionUnits: (id: number, structure?: string): Promise<UnitMetadata[]> => {
    const query = structure ? `?structure=${encodeURIComponent(structure)}` : '';
    return request<UnitMetadata[]>(`/sessions/${id}/units${query}`);
  },
  getSessionStimuli: (id: number): Promise<StimulusPresentation[]> =>
    request<StimulusPresentation[]>(`/sessions/${id}/stimuli`),

  // Decoder Module Endpoints
  getDecoderDatasets: (): Promise<DecoderDatasetSummary[]> =>
    request<DecoderDatasetSummary[]>('/decoder/datasets'),

  getDecoderDatasetDetail: (id: string | number): Promise<DecoderDatasetDetail> =>
    request<DecoderDatasetDetail>(`/decoder/dataset/${id}`),

  getDecoderTargets: (id: string | number): Promise<TargetsResponse> =>
    request<TargetsResponse>(`/decoder/targets?dataset_id=${encodeURIComponent(id)}`),

  trainDecoder: (req: DecoderTrainRequest): Promise<DecoderRunResponse> =>
    request<DecoderRunResponse>('/decoder/train', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  getDecoderRun: (runId: string): Promise<DecoderRunResponse> =>
    request<DecoderRunResponse>(`/decoder/run/${runId}`),

  getDecoderPerformance: (runId: string): Promise<PerformanceResponse> =>
    request<PerformanceResponse>(`/decoder/run/${runId}/performance`),

  getDecoderConfusionMatrix: (runId: string): Promise<ConfusionMatrixResponse> =>
    request<ConfusionMatrixResponse>(`/decoder/run/${runId}/confusion-matrix`),

  getDecoderFeatureImportance: (runId: string): Promise<FeatureImportanceResponse> =>
    request<FeatureImportanceResponse>(`/decoder/run/${runId}/feature-importance`),

  getDecoderBrainMapping: (runId: string): Promise<BrainMappingResponse> =>
    request<BrainMappingResponse>(`/decoder/run/${runId}/brain-mapping`),

  getDecoderPredictions: (runId: string): Promise<PredictionsResponse> =>
    request<PredictionsResponse>(`/decoder/run/${runId}/predictions`),

  getDecoderPredictionDetail: (runId: string, trialId: number): Promise<PredictionDetailResponse> =>
    request<PredictionDetailResponse>(`/decoder/run/${runId}/predictions/${trialId}`),
};
