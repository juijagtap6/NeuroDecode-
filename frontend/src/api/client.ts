/**
 * NeuroDecode API Client
 * Centralized HTTP service communicating with the FastAPI backend under /api/v1
 */
import {
  HealthResponse,
  SessionSummary,
  UnitMetadata,
  StimulusPresentation,
  SimulationRunRequest,
  SimulationResponse,
  MembranePotentialData,
} from '../types';

const BASE_URL = '/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers = options?.body instanceof FormData
    ? { ...options?.headers }
    : { 'Content-Type': 'application/json', ...options?.headers };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `API Error [${response.status}]`);
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

  // Simulation Lab Endpoints
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

  getSampleCsv: async (): Promise<string> => {
    const response = await fetch(`${BASE_URL}/simulation/sample-csv`);
    if (!response.ok) throw new Error('Failed to download sample CSV');
    return response.text();
  },
};
