import {
  HealthResponse,
  SessionSummary,
  UnitMetadata,
  StimulusPresentation,
  ComparisonSessionOption,
  ComparisonBaseRequest,
  ComparisonOverviewResponse,
  SessionComparisonResponse,
  PopulationComparisonResponse,
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
    throw new Error(`API Error [${response.status}]: ${errorBody}`);
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

  // Comparison Module Endpoints
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

  uploadDataset: (payload: Record<string, unknown>): Promise<{ session_id: string; status: string }> =>
    request<{ session_id: string; status: string }>('/comparison/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
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
};

