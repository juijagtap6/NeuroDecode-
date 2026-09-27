/**
 * NeuroDecode API Client
 * Centralized HTTP service communicating with the FastAPI backend under /api/v1
 */
import { HealthResponse, SessionSummary, UnitMetadata, StimulusPresentation } from '../types';

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
};
