import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../api/client';
import {
  ExplorerSessionSummary,
  SessionMetadata,
  PCAResponse,
  HeatmapResponse,
  PopulationTraceResponse,
  TrialMetadata,
  ProvenanceType,
} from '../../types';

export type ExplorerSubmodule =
  | 'overview'
  | 'dataset-browser'
  | 'population-activity'
  | 'trial-inspector'
  | 'metadata';

interface ExplorerContextType {
  // Navigation
  activeSubmodule: ExplorerSubmodule;
  setActiveSubmodule: (sub: ExplorerSubmodule) => void;

  // Session & Source
  activeSource: 'allen' | 'upload';
  setActiveSource: (source: 'allen' | 'upload') => void;
  sessions: ExplorerSessionSummary[];
  displayedSessions: ExplorerSessionSummary[];
  selectedSessionId: string;
  setSelectedSessionId: (id: string) => void;
  currentSession: ExplorerSessionSummary | null;
  sessionMetadata: SessionMetadata | null;
  activeProvenance: ProvenanceType;

  // Filter & Selection Controls
  regions: string[];
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  stimuli: string[];
  selectedStimulus: string;
  setSelectedStimulus: (stimulus: string) => void;
  selectedTrialId: string | number;
  setSelectedTrialId: (trialId: string | number) => void;
  pcaDimensions: '1_2' | '1_3' | '2_3';
  setPcaDimensions: (dims: '1_2' | '1_3' | '2_3') => void;
  pcX: number;
  pcY: number;

  // Visualizer Settings
  normalization: 'none' | 'z-score' | 'min-max';
  setNormalization: (norm: 'none' | 'z-score' | 'min-max') => void;
  maxNeurons: number;
  setMaxNeurons: (count: number) => void;
  smoothingWindow: number;
  setSmoothingWindow: (window: number) => void;
  averagingMethod: 'mean' | 'median';
  setAveragingMethod: (method: 'mean' | 'median') => void;

  // Data
  pcaData: PCAResponse | null;
  heatmapData: HeatmapResponse | null;
  populationTraceData: PopulationTraceResponse | null;
  trialMetadata: TrialMetadata | null;

  // Loading & Error States
  loadingSessions: boolean;
  loadingCharts: { pca: boolean; heatmap: boolean; trace: boolean };
  isRefreshing: boolean;
  globalError: string | null;
  setGlobalError: (err: string | null) => void;
  uploadStatus: { loading: boolean; error: string | null; success: string | null };
  dismissUploadStatus: () => void;

  // Actions
  refreshAll: () => Promise<void>;
  handleFileUpload: (file: File) => Promise<boolean>;
  loadDemoSampleDataset: () => Promise<void>;
  selectTrialAndInspect: (trialId: string | number) => void;
}

const ExplorerContext = createContext<ExplorerContextType | undefined>(undefined);

export const ExplorerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State - default to overview landing page
  const [activeSubmodule, setActiveSubmodule] = useState<ExplorerSubmodule>('overview');

  // Source & Session State
  const [activeSource, setActiveSource] = useState<'allen' | 'upload'>('allen');
  const [sessions, setSessions] = useState<ExplorerSessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('715093703');
  const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata | null>(null);

  // Filters & Dimensions
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>(''); // '' = all
  const [stimuli, setStimuli] = useState<string[]>([]);
  const [selectedStimulus, setSelectedStimulus] = useState<string>(''); // '' = all
  const [selectedTrialId, setSelectedTrialId] = useState<string | number>(1);
  const [pcaDimensions, setPcaDimensions] = useState<'1_2' | '1_3' | '2_3'>('1_2');

  // Visualizer settings
  const [normalization, setNormalization] = useState<'none' | 'z-score' | 'min-max'>('z-score');
  const [maxNeurons, setMaxNeurons] = useState<number>(40);
  const [smoothingWindow, setSmoothingWindow] = useState<number>(3);
  const [averagingMethod, setAveragingMethod] = useState<'mean' | 'median'>('mean');

  // Visualization Data
  const [pcaData, setPcaData] = useState<PCAResponse | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapResponse | null>(null);
  const [populationTraceData, setPopulationTraceData] = useState<PopulationTraceResponse | null>(null);
  const [trialMetadata, setTrialMetadata] = useState<TrialMetadata | null>(null);

  // Loading & Error States
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [loadingCharts, setLoadingCharts] = useState<{ pca: boolean; heatmap: boolean; trace: boolean }>({
    pca: false,
    heatmap: false,
    trace: false,
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ loading: boolean; error: string | null; success: string | null }>({
    loading: false,
    error: null,
    success: null,
  });

  // PC dimensions
  const [pcX, pcY] = useMemo(() => {
    if (pcaDimensions === '1_3') return [1, 3];
    if (pcaDimensions === '2_3') return [2, 3];
    return [1, 2];
  }, [pcaDimensions]);

  // Current session summary
  const currentSession = useMemo(() => {
    return sessions.find((s) => String(s.session_id) === String(selectedSessionId)) || null;
  }, [sessions, selectedSessionId]);

  // Displayed sessions filtered by active source
  const displayedSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (activeSource === 'upload') return s.provenance === 'user_uploaded';
      return s.provenance === 'allen_experimental';
    });
  }, [sessions, activeSource]);

  // Active provenance
  const activeProvenance: ProvenanceType = useMemo(() => {
    if (currentSession) return currentSession.provenance;
    return activeSource === 'allen' ? 'allen_experimental' : 'user_uploaded';
  }, [currentSession, activeSource]);

  // Load sessions from API
  const loadSessions = useCallback(async (skipCache: boolean = false) => {
    setLoadingSessions(true);
    try {
      const data = await api.getExplorerSessions(skipCache);
      setSessions(data);

      if (data.length > 0) {
        // If current selectedSessionId is not in data, set default
        const exists = data.some((s) => String(s.session_id) === String(selectedSessionId));
        if (!exists) {
          const candidate = data.find((s) => String(s.session_id) === '715093703');
          setSelectedSessionId(candidate ? '715093703' : String(data[0].session_id));
        }
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load regions, stimuli, and detailed session metadata when session changes
  const loadSessionDetails = useCallback(async (sessionId: string, skipCache: boolean = false) => {
    if (!sessionId) return;
    try {
      const [regList, stimList, meta] = await Promise.all([
        api.getRegions(sessionId, skipCache),
        api.getStimuli(sessionId, skipCache),
        api.getExplorerSession(sessionId, skipCache).catch(() => null),
      ]);
      setRegions(regList);
      setStimuli(stimList);
      if (meta) {
        setSessionMetadata(meta);
      }
    } catch (err: any) {
      console.warn('Metadata loading warning:', err);
    }
  }, []);

  useEffect(() => {
    loadSessionDetails(selectedSessionId);
  }, [selectedSessionId, loadSessionDetails]);

  // Fetch Visualizations (PCA, Heatmap, Trace, Trial Metadata)
  const fetchVisualizations = useCallback(async (skipCache: boolean = false) => {
    if (!selectedSessionId) return;

    setLoadingCharts({ pca: true, heatmap: true, trace: true });

    // 1. PCA
    api.getPCA(
      {
        sessionId: selectedSessionId,
        stimulus: selectedStimulus || undefined,
        region: selectedRegion || undefined,
        pcX,
        pcY,
        forceRefresh: skipCache,
      },
      skipCache
    )
      .then((res) => setPcaData(res))
      .catch((err) => {
        console.error('PCA Fetch Error:', err);
        setPcaData(null);
      })
      .finally(() => setLoadingCharts((prev) => ({ ...prev, pca: false })));

    // 2. Heatmap
    api.getHeatmap(
      {
        sessionId: selectedSessionId,
        trialId: selectedTrialId,
        region: selectedRegion || undefined,
        normalize: normalization,
        maxNeurons,
      },
      skipCache
    )
      .then((res) => setHeatmapData(res))
      .catch((err) => {
        console.error('Heatmap Fetch Error:', err);
        setHeatmapData(null);
      })
      .finally(() => setLoadingCharts((prev) => ({ ...prev, heatmap: false })));

    // 3. Population Trace
    api.getPopulationTrace(
      {
        sessionId: selectedSessionId,
        trialId: selectedTrialId,
        region: selectedRegion || undefined,
        stimulus: selectedStimulus || undefined,
        smoothingWindow,
        averagingMethod,
      },
      skipCache
    )
      .then((res) => setPopulationTraceData(res))
      .catch((err) => {
        console.error('Trace Fetch Error:', err);
        setPopulationTraceData(null);
      })
      .finally(() => setLoadingCharts((prev) => ({ ...prev, trace: false })));

    // 4. Trial Metadata
    api.getTrial(selectedTrialId, selectedSessionId, skipCache)
      .then((meta) => setTrialMetadata(meta))
      .catch(() => setTrialMetadata(null));
  }, [
    selectedSessionId,
    selectedRegion,
    selectedStimulus,
    selectedTrialId,
    pcX,
    pcY,
    normalization,
    maxNeurons,
    smoothingWindow,
    averagingMethod,
  ]);

  // Synchronize visualizations whenever filters or parameters change
  useEffect(() => {
    fetchVisualizations();
  }, [fetchVisualizations]);

  // Comprehensive Refresh
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    setGlobalError(null);
    try {
      api.clearCache();
      await Promise.all([
        loadSessions(true),
        loadSessionDetails(selectedSessionId, true),
        fetchVisualizations(true),
      ]);
    } catch (err: any) {
      setGlobalError(err.message || 'Refresh encountered an issue');
    } finally {
      setIsRefreshing(false);
    }
  }, [loadSessions, loadSessionDetails, fetchVisualizations, selectedSessionId]);

  // CSV Upload Handler
  const handleFileUpload = useCallback(async (file: File): Promise<boolean> => {
    if (!file) return false;
    setUploadStatus({ loading: true, error: null, success: null });
    try {
      const res = await api.uploadDataset(file);
      setUploadStatus({
        loading: false,
        error: null,
        success: `Successfully ingested "${file.name}"! Assigned Session ID: ${res.session_id} (${res.total_units} units, ${res.total_trials} trials)`,
      });

      // Reload sessions and switch active source and session
      const updatedSessions = await api.getExplorerSessions(true);
      setSessions(updatedSessions);
      setActiveSource('upload');
      setSelectedSessionId(res.session_id);
      setSelectedTrialId(1);
      setSelectedRegion('');
      setSelectedStimulus('');
      return true;
    } catch (err: any) {
      setUploadStatus({
        loading: false,
        error: err.message || 'CSV upload failed',
        success: null,
      });
      return false;
    }
  }, []);

  // Demo CSV Loader
  const loadDemoSampleDataset = useCallback(async () => {
    setUploadStatus({ loading: true, error: null, success: null });
    const sampleCsv = `trial_id,time,neuron_id,firing_rate,label,region
1,0.0,unit_01,3.4,drifting_gratings_0deg,VISp
1,0.05,unit_01,8.9,drifting_gratings_0deg,VISp
1,0.1,unit_01,24.5,drifting_gratings_0deg,VISp
1,0.15,unit_01,19.2,drifting_gratings_0deg,VISp
1,0.2,unit_01,11.0,drifting_gratings_0deg,VISp
1,0.0,unit_02,1.2,drifting_gratings_0deg,VISp
1,0.05,unit_02,3.1,drifting_gratings_0deg,VISp
1,0.1,unit_02,15.6,drifting_gratings_0deg,VISp
1,0.15,unit_02,14.8,drifting_gratings_0deg,VISp
1,0.2,unit_02,6.2,drifting_gratings_0deg,VISp
2,0.0,unit_01,2.1,drifting_gratings_90deg,VISp
2,0.05,unit_01,4.2,drifting_gratings_90deg,VISp
2,0.1,unit_01,7.5,drifting_gratings_90deg,VISp
2,0.15,unit_01,5.1,drifting_gratings_90deg,VISp
2,0.2,unit_01,2.8,drifting_gratings_90deg,VISp
2,0.0,unit_02,4.5,drifting_gratings_90deg,VISp
2,0.05,unit_02,12.3,drifting_gratings_90deg,VISp
2,0.1,unit_02,32.0,drifting_gratings_90deg,VISp
2,0.15,unit_02,28.4,drifting_gratings_90deg,VISp
2,0.2,unit_02,16.5,drifting_gratings_90deg,VISp
3,0.0,unit_01,1.0,natural_scene_1,VISl
3,0.05,unit_01,6.5,natural_scene_1,VISl
3,0.1,unit_01,18.0,natural_scene_1,VISl
3,0.15,unit_01,12.4,natural_scene_1,VISl
3,0.2,unit_01,4.0,natural_scene_1,VISl
3,0.0,unit_02,2.0,natural_scene_1,VISl
3,0.05,unit_02,8.0,natural_scene_1,VISl
3,0.1,unit_02,21.0,natural_scene_1,VISl
3,0.15,unit_02,14.0,natural_scene_1,VISl
3,0.2,unit_02,5.0,natural_scene_1,VISl`;

    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const file = new File([blob], 'demo_neural_recording.csv', { type: 'text/csv' });
    await handleFileUpload(file);
  }, [handleFileUpload]);

  const dismissUploadStatus = useCallback(() => {
    setUploadStatus({ loading: false, error: null, success: null });
  }, []);

  const selectTrialAndInspect = useCallback((trialId: string | number) => {
    setSelectedTrialId(trialId);
    setActiveSubmodule('trial-inspector');
  }, []);

  const value: ExplorerContextType = {
    activeSubmodule,
    setActiveSubmodule,
    activeSource,
    setActiveSource,
    sessions,
    displayedSessions,
    selectedSessionId,
    setSelectedSessionId,
    currentSession,
    sessionMetadata,
    activeProvenance,
    regions,
    selectedRegion,
    setSelectedRegion,
    stimuli,
    selectedStimulus,
    setSelectedStimulus,
    selectedTrialId,
    setSelectedTrialId,
    pcaDimensions,
    setPcaDimensions,
    pcX,
    pcY,
    normalization,
    setNormalization,
    maxNeurons,
    setMaxNeurons,
    smoothingWindow,
    setSmoothingWindow,
    averagingMethod,
    setAveragingMethod,
    pcaData,
    heatmapData,
    populationTraceData,
    trialMetadata,
    loadingSessions,
    loadingCharts,
    isRefreshing,
    globalError,
    setGlobalError,
    uploadStatus,
    dismissUploadStatus,
    refreshAll,
    handleFileUpload,
    loadDemoSampleDataset,
    selectTrialAndInspect,
  };

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>;
};

export const useExplorer = (): ExplorerContextType => {
  const context = useContext(ExplorerContext);
  if (!context) {
    throw new Error('useExplorer must be used within an ExplorerProvider');
  }
  return context;
};
