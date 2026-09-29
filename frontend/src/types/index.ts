/**
 * NeuroDecode Shared TypeScript API Types
 * Strictly mirrored from backend/app/schemas/
 */

export type ProvenanceType = 'allen_experimental' | 'synthetic_lif' | 'user_upload';

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

export interface ComparisonSessionOption {
  session_id: number | string;
  name: string;
  source: string;
  genotype: string;
  session_type: string;
  unit_count: number;
  structures: string[];
  stimuli: string[];
  duration_sec: number;
  has_matrix?: boolean;
}

export interface ComparisonBaseRequest {
  session_a_id: number | string;
  session_b_id: number | string;
  source_a?: string;
  source_b?: string;
}

export interface DatasetOverviewSummary {
  session_id: number | string;
  name: string;
  source: string;
  provenance: ProvenanceType;
  genotype?: string | null;
  session_type?: string | null;
  total_units: number;
  total_trials: number;
  duration_sec: number;
  region_count: number;
  regions: string[];
  stimulus_count: number;
  stimuli: string[];
}

export interface OverviewMetricDiff {
  value_a: number;
  value_b: number;
  delta: number;
  percent_change?: number | null;
}

export interface RegionOverlapSummary {
  shared_regions: string[];
  unique_to_a: string[];
  unique_to_b: string[];
  total_union_count: number;
  shared_count: number;
  jaccard_similarity: number;
}

export interface StimulusOverlapSummary {
  shared_stimuli: string[];
  unique_to_a: string[];
  unique_to_b: string[];
  total_union_count: number;
  shared_count: number;
  jaccard_similarity: number;
}

export interface PopulationSimilarityBreakdown {
  overall_similarity_pct: number;
  pca_similarity_pct: number;
  region_overlap_pct: number;
  stimulus_overlap_pct: number;
  rate_similarity_pct: number;
  scale_similarity_pct?: number;
}

export interface ComparisonOverviewResponse {
  dataset_a: DatasetOverviewSummary;
  dataset_b: DatasetOverviewSummary;
  neuron_diff: OverviewMetricDiff;
  trial_diff: OverviewMetricDiff;
  duration_diff: OverviewMetricDiff;
  region_overlap: RegionOverlapSummary;
  stimulus_overlap: StimulusOverlapSummary;
  similarity: PopulationSimilarityBreakdown;
  scientific_summary: string;
}

export interface SessionMetadataRecord {
  session_id: number | string;
  specimen_id?: number | string | null;
  mouse_id?: number | string | null;
  genotype?: string | null;
  session_type?: string | null;
  date_of_acquisition?: string | null;
  source: string;
  has_nwb: boolean;
  total_units: number;
  total_trials: number;
  duration_sec: number;
}

export interface RegionComparisonItem {
  region: string;
  present_in_a: boolean;
  present_in_b: boolean;
  units_a: number;
  units_b: number;
  pct_a: number;
  pct_b: number;
}

export interface StimulusComparisonItem {
  stimulus_name: string;
  present_in_a: boolean;
  present_in_b: boolean;
  presentations_a: number;
  presentations_b: number;
}

export interface SessionComparisonResponse {
  session_a: SessionMetadataRecord;
  session_b: SessionMetadataRecord;
  region_items: RegionComparisonItem[];
  stimulus_items: StimulusComparisonItem[];
  region_overlap: RegionOverlapSummary;
  stimulus_overlap: StimulusOverlapSummary;
  similarity: PopulationSimilarityBreakdown;
  scientific_difference_summary: string;
}

export interface PCAPoint {
  pc1: number;
  pc2: number;
  label?: string | null;
  time_sec?: number | null;
}

export interface DatasetPCAResult {
  session_id: number | string;
  dataset_name: string;
  provenance: ProvenanceType;
  explained_variance_ratio: number[];
  total_variance_explained_2d: number;
  points: PCAPoint[];
}

export interface PopulationStatsRecord {
  mean_firing_rate: number;
  median_firing_rate: number;
  peak_firing_rate: number;
  std_firing_rate: number;
  active_neuron_count: number;
  total_neuron_count: number;
  active_neuron_pct: number;
  fano_factor?: number | null;
  cv_isi?: number | null;
}

export interface ActivityDistributionHistogram {
  bin_edges: number[];
  counts: number[];
  frequencies: number[];
}

export interface RegionActivityItem {
  region: string;
  mean_firing_rate_a?: number | null;
  mean_firing_rate_b?: number | null;
  unit_count_a: number;
  unit_count_b: number;
  delta_rate?: number | null;
}

export interface PopulationComparisonResponse {
  dataset_a_name: string;
  dataset_b_name: string;
  pca_a: DatasetPCAResult;
  pca_b: DatasetPCAResult;
  stats_a: PopulationStatsRecord;
  stats_b: PopulationStatsRecord;
  distribution_a: ActivityDistributionHistogram;
  distribution_b: ActivityDistributionHistogram;
  region_activity: RegionActivityItem[];
  similarity: PopulationSimilarityBreakdown;
  population_summary: string;
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
  pc_projections: number[][];
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

