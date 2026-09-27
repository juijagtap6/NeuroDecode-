/**
 * NeuroDecode Shared TypeScript API Types
 * Strictly mirrored from backend/app/schemas/
 */

export type ProvenanceType = 'allen_experimental' | 'synthetic_lif';

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
  active_dataset: string;
  cache_ready: boolean;
}

export interface SessionSummary {
  session_id: number;
  date_of_acquisition: string | null;
  session_type: string;
  genotype: string | null;
  specimen_id: number | null;
  unit_count: number;
  structures: string[];
  has_nwb: boolean;
  data_status: string;
}

export interface UnitMetadata {
  unit_id: number;
  ecephys_session_id: number;
  ecephys_structure_acronym: string;
  firing_rate: number;
  snr: number | null;
  isi_violations: number | null;
  presence_ratio: number | null;
  isolation_distance: number | null;
  amplitude_cutoff: number | null;
}

export interface StimulusPresentation {
  stimulus_presentation_id: number;
  stimulus_name: string;
  start_time: number;
  stop_time: number;
  duration: number;
  orientation: number | null;
  spatial_frequency: number | null;
  temporal_frequency: number | null;
  contrast: number | null;
}

export interface CanonicalSpikeMatrix {
  provenance: ProvenanceType;
  session_id?: string | null;
  unit_ids: number[];
  structures?: string[] | null;
  time_bin_edges: number[];
  bin_size_sec: number;
  matrix: number[][]; // [N units x T time bins]
  metadata: Record<string, unknown>;
}

export interface DecoderTrainRequest {
  session_id: number;
  stimulus_name: string;
  target_variable: string;
  model_type: 'logistic_regression' | 'ridge_classifier' | 'random_forest';
  test_size: number;
  cv_folds: number;
  selected_structures?: string[];
  time_window_sec: [number, number];
}

export interface FeatureImportanceRecord {
  unit_id: number;
  structure: string;
  importance_score: number;
  rank: number;
}

export interface DecoderResult {
  model_name: string;
  target_variable: string;
  classes: unknown[];
  test_accuracy: number;
  cv_mean_accuracy: number;
  cv_std_accuracy: number;
  confusion_matrix: number[][];
  f1_score_macro: number;
  feature_importances: FeatureImportanceRecord[];
  summary: string;
}

export interface LIFSimConfig {
  v_rest: number;
  v_thresh: number;
  v_reset: number;
  tau_m: number;
  r_m: number;
  t_ref: number;
  duration_ms: number;
  dt_ms: number;
  i_inj_type: 'step' | 'pulse' | 'ramp' | 'noisy';
  i_inj_amplitude: number;
  i_inj_onset_ms: number;
  i_inj_offset_ms: number;
  noise_sigma: number;
}

export interface LIFSimResult {
  provenance: 'synthetic_lif';
  time_ms: number[];
  v_m: number[];
  i_inj: number[];
  spike_times_ms: number[];
  total_spikes: number;
  mean_firing_rate_hz: number;
  config: LIFSimConfig;
}

export interface FiringStatistics {
  provenance: ProvenanceType;
  mean_firing_rate: number;
  std_firing_rate: number;
  cv_isi: number;
  fano_factor: number;
  isi_distribution_bins: number[];
  isi_distribution_counts: number[];
}

export interface CorrelationAnalysis {
  provenance: ProvenanceType;
  unit_ids: number[];
  correlation_matrix: number[][];
  mean_pairwise_correlation: number;
}

export interface PCAResult {
  provenance: ProvenanceType;
  explained_variance_ratio: number[];
  time_points_sec: number[];
  pc_projections: number[][]; // [n_components x n_time_points]
}

export interface ComparisonRequest {
  analysis_type: 'all' | 'firing_statistics' | 'correlation' | 'pca';
  allen_session_id?: number;
  selected_structures?: string[];
  include_synthetic_lif: boolean;
}

export interface ComparisonResponse {
  analysis_type: string;
  experimental?: {
    firing_stats?: FiringStatistics;
    correlation?: CorrelationAnalysis;
    pca?: PCAResult;
  };
  synthetic?: {
    firing_stats?: FiringStatistics;
    correlation?: CorrelationAnalysis;
    pca?: PCAResult;
  };
  summary: string;
}
