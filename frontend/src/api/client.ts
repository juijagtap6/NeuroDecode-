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
  UploadResponse
} from '../types';

const BASE_URL = '/api/v1';

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

  const fetchPromise = (async () => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error [${response.status}]: ${errorBody}`);
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
  // Explorer Module API Methods
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

  uploadDataset: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/explorer/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let msg = errorBody;
      try {
        const json = JSON.parse(errorBody);
        msg = json.detail || errorBody;
      } catch {
        // use raw errorBody
      }
      throw new Error(`Upload Failed: ${msg}`);
    }

    // Invalidate sessions cache on upload
    queryCache.clear();
    return response.json();
  },
};
