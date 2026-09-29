/**
 * NeuroDecode API Client
 * Centralized HTTP service communicating with the FastAPI backend under /api/v1
 */
import {
  HealthResponse,
  SessionSummary,
  UnitMetadata,
  StimulusPresentation,
  ExplorerSessionSummary,
  SessionMetadata,
  PCAResponse,
  HeatmapResponse,
  PopulationTraceResponse,
  TrialMetadata,
  UploadResponse,
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
  SimulationRunRequest,
  SimulationResponse,
  MembranePotentialData,
  ComparisonSessionOption,
  ComparisonBaseRequest,
  ComparisonOverviewResponse,
  SessionComparisonResponse,
  PopulationComparisonResponse,
} from '../types';

const BASE_URL = '/api/v1';

/**
 * Extracts a human-readable, helpful error message from API responses.
 * Handles FastAPI / Pydantic validation errors (array of objects),
 * custom HTTPException detail strings, object details, and network errors.
 */
export function extractErrorMessage(errBody: unknown, statusText = '', status = 0): string {
  if (!errBody) {
    return statusText ? `${statusText} (${status})` : `API Error [${status}]`;
  }

  if (typeof errBody === 'string') {
    return errBody;
  }

  if (typeof errBody === 'object' && errBody !== null) {
    const errObj = errBody as Record<string, unknown>;

    // Case 1: FastAPI standard error object with "detail"
    if ('detail' in errObj && errObj.detail !== undefined && errObj.detail !== null) {
      const detail = errObj.detail;

      // 1a. Array of Pydantic validation errors
      if (Array.isArray(detail)) {
        const formattedList = detail.map((item) => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            const locArray = Array.isArray(item.loc) ? item.loc : [];
            const fieldPath = locArray.filter((part: unknown) => part !== 'body').join('.');
            let rawMsg = typeof item.msg === 'string' ? item.msg : JSON.stringify(item);
            rawMsg = rawMsg.replace(/^Value error,\s*/i, '');
            return fieldPath ? `${fieldPath}: ${rawMsg}` : rawMsg;
          }
          return String(item);
        });

        if (formattedList.length > 0) {
          return formattedList.join('; ');
        }
      }

      // 1b. Detail is a string (e.g. HTTPException(status_code=400, detail="..."))
      if (typeof detail === 'string') {
        return detail;
      }

      // 1c. Detail is an object (e.g. { message: "..." })
      if (typeof detail === 'object' && detail !== null) {
        const detailObj = detail as Record<string, unknown>;
        if (typeof detailObj.message === 'string') return detailObj.message;
        if (typeof detailObj.msg === 'string') return detailObj.msg;
        return JSON.stringify(detail);
      }
    }

    // Case 2: Top-level message or error
    if (typeof errObj.message === 'string') return errObj.message;
    if (typeof errObj.error === 'string') return errObj.error;

    // Fallback: stringify object
    try {
      return JSON.stringify(errObj);
    } catch {
      // ignore
    }
  }

  return statusText ? `${statusText} (${status})` : `API Error [${status}]`;
}

// In-memory frontend response cache and in-flight request deduplication map
const queryCache = new Map<string, { timestamp: number; data: unknown }>();
const inFlightRequests = new Map<string, Promise<unknown>>();
const CACHE_TTL_MS = 60000; // 1 minute client-side TTL

async function request<T>(
  endpoint: string,
  options?: RequestInit,
  useCache: boolean = false,
  skipCache: boolean = false
): Promise<T> {
  const cacheKey = `${options?.method || 'GET'}:${endpoint}`;

  if (skipCache) {
    queryCache.delete(cacheKey);
  } else if (useCache && (!options || options.method === 'GET' || !options.method)) {
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }

    // Request deduplication for matching concurrent queries
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey) as Promise<T>;
    }
  }

  const headers = options?.body instanceof FormData
    ? { ...options?.headers }
    : { 'Content-Type': 'application/json', ...options?.headers };

  const fetchPromise = (async () => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const errJson = await response.json();
          errorDetail = extractErrorMessage(errJson, response.statusText, response.status);
        } catch {
          try {
            const text = await response.text();
            errorDetail = text || response.statusText || `API Error [${response.status}]`;
          } catch {
            errorDetail = response.statusText || `API Error [${response.status}]`;
          }
        }
        throw new Error(errorDetail || `API Error [${response.status}]`);
      }

      const data = await response.json();
      if (useCache) {
        queryCache.set(cacheKey, { timestamp: Date.now(), data });
      }
      return data as T;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  if (useCache && !skipCache) {
    inFlightRequests.set(cacheKey, fetchPromise);
  }

  return fetchPromise;
}

export const api = {
  clearCache: () => {
    queryCache.clear();
    inFlightRequests.clear();
  },

  // -------------------------------------------------------------
  // Base & Shared Endpoints
  // -------------------------------------------------------------
  getHealth: (): Promise<HealthResponse> => request<HealthResponse>('/health'),
  getSessions: (): Promise<SessionSummary[]> => request<SessionSummary[]>('/sessions', undefined, true),
  getSession: (id: number): Promise<SessionSummary> => request<SessionSummary>(`/sessions/${id}`, undefined, true),
  getSessionUnits: (id: number, structure?: string): Promise<UnitMetadata[]> => {
    const query = structure ? `?structure=${encodeURIComponent(structure)}` : '';
    return request<UnitMetadata[]>(`/sessions/${id}/units${query}`, undefined, true);
  },
  getSessionStimuli: (id: number): Promise<StimulusPresentation[]> =>
    request<StimulusPresentation[]>(`/sessions/${id}/stimuli`, undefined, true),

  // -------------------------------------------------------------
  // Explorer Module Endpoints
  // -------------------------------------------------------------
  getExplorerSessions: (skipCache?: boolean): Promise<ExplorerSessionSummary[]> =>
    request<ExplorerSessionSummary[]>('/explorer/sessions', undefined, true, skipCache),

  getExplorerSession: (id: string | number, skipCache?: boolean): Promise<SessionMetadata> =>
    request<SessionMetadata>(`/explorer/session/${id}`, undefined, true, skipCache),

  getRegions: (sessionId?: string | number, skipCache?: boolean): Promise<string[]> => {
    const query = sessionId ? `?session_id=${encodeURIComponent(String(sessionId))}` : '';
    return request<string[]>(`/explorer/regions${query}`, undefined, true, skipCache);
  },

  getStimuli: (sessionId?: string | number, skipCache?: boolean): Promise<string[]> => {
    const query = sessionId ? `?session_id=${encodeURIComponent(String(sessionId))}` : '';
    return request<string[]>(`/explorer/stimuli${query}`, undefined, true, skipCache);
  },

  getPCA: (params: {
    sessionId: string | number;
    stimulus?: string;
    region?: string;
    pcX?: number;
    pcY?: number;
    forceRefresh?: boolean;
  }, skipCache?: boolean): Promise<PCAResponse> => {
    const searchParams = new URLSearchParams();
    searchParams.append('session_id', String(params.sessionId));
    if (params.stimulus) searchParams.append('stimulus', params.stimulus);
    if (params.region) searchParams.append('region', params.region);
    if (params.pcX) searchParams.append('pc_x', String(params.pcX));
    if (params.pcY) searchParams.append('pc_y', String(params.pcY));
    if (params.forceRefresh || skipCache) searchParams.append('force_refresh', 'true');
    return request<PCAResponse>(`/explorer/pca?${searchParams.toString()}`, undefined, true, skipCache);
  },

  getHeatmap: (params: {
    sessionId: string | number;
    trialId?: string | number;
    region?: string;
    normalize?: string;
    maxNeurons?: number;
    tMin?: number;
    tMax?: number;
  }, skipCache?: boolean): Promise<HeatmapResponse> => {
    const searchParams = new URLSearchParams();
    searchParams.append('session_id', String(params.sessionId));
    if (params.trialId !== undefined && params.trialId !== null) {
      searchParams.append('trial_id', String(params.trialId));
    }
    if (params.region) searchParams.append('region', params.region);
    if (params.normalize) searchParams.append('normalize', params.normalize);
    if (params.maxNeurons) searchParams.append('max_neurons', String(params.maxNeurons));
    if (params.tMin !== undefined) searchParams.append('t_min', String(params.tMin));
    if (params.tMax !== undefined) searchParams.append('t_max', String(params.tMax));
    return request<HeatmapResponse>(`/explorer/heatmap?${searchParams.toString()}`, undefined, true, skipCache);
  },

  getPopulationTrace: (params: {
    sessionId: string | number;
    trialId?: string | number;
    region?: string;
    stimulus?: string;
    smoothingWindow?: number;
    averagingMethod?: string;
    tMin?: number;
    tMax?: number;
  }, skipCache?: boolean): Promise<PopulationTraceResponse> => {
    const searchParams = new URLSearchParams();
    searchParams.append('session_id', String(params.sessionId));
    if (params.trialId !== undefined && params.trialId !== null) {
      searchParams.append('trial_id', String(params.trialId));
    }
    if (params.region) searchParams.append('region', params.region);
    if (params.stimulus) searchParams.append('stimulus', params.stimulus);
    if (params.smoothingWindow !== undefined) {
      searchParams.append('smoothing_window', String(params.smoothingWindow));
    }
    if (params.averagingMethod) searchParams.append('averaging_method', params.averagingMethod);
    if (params.tMin !== undefined) searchParams.append('t_min', String(params.tMin));
    if (params.tMax !== undefined) searchParams.append('t_max', String(params.tMax));
    return request<PopulationTraceResponse>(`/explorer/population-trace?${searchParams.toString()}`, undefined, true, skipCache);
  },

  getTrial: (trialId: string | number, sessionId?: string | number, skipCache?: boolean): Promise<TrialMetadata> => {
    const query = sessionId ? `?session_id=${encodeURIComponent(String(sessionId))}` : '';
    return request<TrialMetadata>(`/explorer/trial/${trialId}${query}`, undefined, true, skipCache);
  },

  // -------------------------------------------------------------
  // Decoder Module Endpoints
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Simulation Module Endpoints
  // -------------------------------------------------------------
  runSimulation: (req: SimulationRunRequest): Promise<SimulationResponse> =>
    request<SimulationResponse>('/simulation/run', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  uploadSimulationCsv: (file: File): Promise<SimulationResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return request<SimulationResponse>('/simulation/upload', {
      method: 'POST',
      body: formData,
    });
  },

  getNeuronTrace: (neuronId: number): Promise<MembranePotentialData> =>
    request<MembranePotentialData>(`/simulation/trace/${neuronId}`),

  getSampleCsv: async (sampleType: string = 'spike'): Promise<string> => {
    const url = sampleType && sampleType !== 'spike'
      ? `${BASE_URL}/simulation/sample-csv?sample_type=${encodeURIComponent(sampleType)}`
      : `${BASE_URL}/simulation/sample-csv`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to download sample CSV');
    return response.text();
  },

  // -------------------------------------------------------------
  // Comparison Module Endpoints
  // -------------------------------------------------------------
  getComparisonSessions: (): Promise<ComparisonSessionOption[]> =>
    request<ComparisonSessionOption[]>('/comparison/sessions'),

  compareOverview: (req: ComparisonBaseRequest): Promise<ComparisonOverviewResponse> =>
    request<ComparisonOverviewResponse>('/comparison/overview', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  compareSession: (req: ComparisonBaseRequest): Promise<SessionComparisonResponse> =>
    request<SessionComparisonResponse>('/comparison/session', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  comparePopulation: (req: ComparisonBaseRequest): Promise<PopulationComparisonResponse> =>
    request<PopulationComparisonResponse>('/comparison/population', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  uploadFile: async (file: File): Promise<{ session_id: string; total_units: number; structures: string[]; status: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/comparison/upload-file`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Upload Error [${response.status}]: ${errorBody}`);
    }
    return response.json();
  },

  // -------------------------------------------------------------
  // Overloaded uploadDataset (handles File for Explorer, JSON for Comparison)
  // -------------------------------------------------------------
  uploadDataset: ((
    fileOrPayload: File | Record<string, unknown>
  ): Promise<any> => {
    if (fileOrPayload instanceof File) {
      const formData = new FormData();
      formData.append('file', fileOrPayload);

      return fetch(`${BASE_URL}/explorer/upload`, {
        method: 'POST',
        body: formData,
      }).then(async (response) => {
        if (!response.ok) {
          const errorBody = await response.text();
          let msg = errorBody;
          try {
            const json = JSON.parse(errorBody);
            msg = json.detail || errorBody;
          } catch {
            // keep raw errorBody
          }
          throw new Error(`Upload Failed: ${msg}`);
        }
        queryCache.clear();
        return response.json();
      });
    } else {
      return request<{ session_id: string; status: string }>('/comparison/upload', {
        method: 'POST',
        body: JSON.stringify(fileOrPayload),
      });
    }
  }) as {
    (file: File): Promise<UploadResponse>;
    (payload: Record<string, unknown>): Promise<{ session_id: string; status: string }>;
  },
};
