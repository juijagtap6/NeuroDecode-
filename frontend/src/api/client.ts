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
