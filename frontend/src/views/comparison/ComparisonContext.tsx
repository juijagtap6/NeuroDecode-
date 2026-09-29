import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import {
  ComparisonSessionOption,
  ComparisonOverviewResponse,
  SessionComparisonResponse,
  PopulationComparisonResponse,
} from '../../types';

export type ComparisonSubmodule = 'overview' | 'session-comparison' | 'population-comparison';
export type DatasetSourceType = 'allen_experimental' | 'user_upload';

interface ComparisonContextType {
  sourceA: DatasetSourceType;
  sourceB: DatasetSourceType;
  sessionAId: number | string;
  sessionBId: number | string;
  availableSessions: ComparisonSessionOption[];
  activeSubmodule: ComparisonSubmodule;
  overviewData: ComparisonOverviewResponse | null;
  sessionData: SessionComparisonResponse | null;
  populationData: PopulationComparisonResponse | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  setSourceA: (source: DatasetSourceType) => void;
  setSourceB: (source: DatasetSourceType) => void;
  setSessionAId: (id: number | string) => void;
  setSessionBId: (id: number | string) => void;
  swapSessions: () => void;
  setActiveSubmodule: (tab: ComparisonSubmodule) => void;
  refreshComparison: () => void;
  generateComparison: (idA?: number | string, idB?: number | string) => Promise<void>;
  uploadCustomDataset: (datasetJson: Record<string, unknown>) => Promise<string>;
  uploadCsvOrJsonFile: (file: File) => Promise<string>;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [availableSessions, setAvailableSessions] = useState<ComparisonSessionOption[]>([]);
  const [sourceA, setSourceAState] = useState<DatasetSourceType>('allen_experimental');
  const [sourceB, setSourceBState] = useState<DatasetSourceType>('allen_experimental');
  const [sessionAId, setSessionAIdState] = useState<number | string>(715093703);
  const [sessionBId, setSessionBIdState] = useState<number | string>(719161530);
  const [activeSubmodule, setActiveSubmodule] = useState<ComparisonSubmodule>('overview');

  const [overviewData, setOverviewData] = useState<ComparisonOverviewResponse | null>(null);
  const [sessionData, setSessionData] = useState<SessionComparisonResponse | null>(null);
  const [populationData, setPopulationData] = useState<PopulationComparisonResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch all available comparison sessions (both Allen and Uploads)
  const fetchAvailableSessions = useCallback(async () => {
    try {
      const sessions = await api.getComparisonSessions();
      setAvailableSessions(sessions);
      return sessions;
    } catch (err) {
      console.error('Failed to load comparison sessions:', err);
      return [];
    }
  }, []);

  const generateComparison = useCallback(async (idA?: number | string, idB?: number | string) => {
    const curA = idA !== undefined ? idA : sessionAId;
    const curB = idB !== undefined ? idB : sessionBId;

    if (!curA || !curB) return;

    setLoading(true);
    setError(null);

    const payload = {
      session_a_id: curA,
      session_b_id: curB,
      source_a: sourceA,
      source_b: sourceB,
    };

    try {
      const [ovRes, sessRes, popRes] = await Promise.all([
        api.compareOverview(payload),
        api.compareSession(payload),
        api.comparePopulation(payload),
      ]);

      setOverviewData(ovRes);
      setSessionData(sessRes);
      setPopulationData(popRes);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown comparison calculation failure';
      setError(msg);
      console.error('Error generating comparison:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionAId, sessionBId, sourceA, sourceB]);

  // Initial load
  useEffect(() => {
    fetchAvailableSessions().then((sessions) => {
      if (sessions.length >= 2) {
        const allenSessions = sessions.filter((s) => s.source === 'allen_experimental');
        const defaultA = allenSessions.length >= 1 ? allenSessions[0].session_id : sessions[0].session_id;
        const defaultB = allenSessions.length >= 2 ? allenSessions[1].session_id : sessions[1].session_id;
        
        setSessionAIdState(defaultA);
        setSessionBIdState(defaultB);
        generateComparison(defaultA, defaultB);
      }
    });
  }, [fetchAvailableSessions, generateComparison]);

  const setSourceA = (newSource: DatasetSourceType) => {
    setSourceAState(newSource);
    const matchingSessions = availableSessions.filter((s) => s.source === newSource);
    if (matchingSessions.length > 0) {
      const isCurrentValid = matchingSessions.some((s) => String(s.session_id) === String(sessionAId));
      if (!isCurrentValid) {
        setSessionAIdState(matchingSessions[0].session_id);
      }
    }
  };

  const setSourceB = (newSource: DatasetSourceType) => {
    setSourceBState(newSource);
    const matchingSessions = availableSessions.filter((s) => s.source === newSource);
    if (matchingSessions.length > 0) {
      const isCurrentValid = matchingSessions.some((s) => String(s.session_id) === String(sessionBId));
      if (!isCurrentValid) {
        setSessionBIdState(matchingSessions[0].session_id);
      }
    }
  };

  const setSessionAId = (id: number | string) => {
    setSessionAIdState(id);
    const matched = availableSessions.find((s) => String(s.session_id) === String(id));
    if (matched) {
      setSourceAState(matched.source as DatasetSourceType);
    }
  };

  const setSessionBId = (id: number | string) => {
    setSessionBIdState(id);
    const matched = availableSessions.find((s) => String(s.session_id) === String(id));
    if (matched) {
      setSourceBState(matched.source as DatasetSourceType);
    }
  };

  const swapSessions = () => {
    const tempA = sessionAId;
    const tempB = sessionBId;
    const tempSrcA = sourceA;
    const tempSrcB = sourceB;
    setSessionAIdState(tempB);
    setSessionBIdState(tempA);
    setSourceAState(tempSrcB);
    setSourceBState(tempSrcA);
  };

  const refreshComparison = () => {
    generateComparison(sessionAId, sessionBId);
  };

  const uploadCustomDataset = async (datasetJson: Record<string, unknown>): Promise<string> => {
    const res = await api.uploadDataset(datasetJson);
    await fetchAvailableSessions();
    if (res.session_id) {
      setSourceBState('user_upload');
      setSessionBIdState(res.session_id);
      await generateComparison(sessionAId, res.session_id);
    }
    return res.session_id;
  };

  const uploadCsvOrJsonFile = async (file: File): Promise<string> => {
    const res = await api.uploadFile(file);
    await fetchAvailableSessions();
    if (res.session_id) {
      setSourceBState('user_upload');
      setSessionBIdState(res.session_id);
      await generateComparison(sessionAId, res.session_id);
    }
    return res.session_id;
  };

  return (
    <ComparisonContext.Provider
      value={{
        sourceA,
        sourceB,
        sessionAId,
        sessionBId,
        availableSessions,
        activeSubmodule,
        overviewData,
        sessionData,
        populationData,
        loading,
        error,
        lastUpdated,
        setSourceA,
        setSourceB,
        setSessionAId,
        setSessionBId,
        swapSessions,
        setActiveSubmodule,
        refreshComparison,
        generateComparison,
        uploadCustomDataset,
        uploadCsvOrJsonFile,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = (): ComparisonContextType => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};
