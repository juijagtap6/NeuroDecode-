/**
 * NeuroDecode Shared TypeScript API Types
 * Strictly mirrored from backend/app/schemas/
 */

export type ProvenanceType = 'allen_experimental' | 'synthetic_lif' | 'user_uploaded' | 'user_upload';

// -------------------------------------------------------------
// Common & Base Types
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// 1. Explorer Module Types
// -------------------------------------------------------------
export interface ExplorerSessionSummary {
  session_id: string | number;
  mouse_id: string | number | null;
  genotype: string | null;
  available_brain_regions: string[];
  available_stimuli: string[];
  unit_count: number;
  total_trials: number;
  provenance: ProvenanceType;
  data_status: string;
}

export interface SessionMetadata {
  session_id: string | number;
  mouse_id: string | number | null;
  genotype: string | null;
  session_type: string | null;
  date_of_acquisition: string | null;
  total_units: number;
  total_trials: number;
  duration_sec: number | null;
  available_brain_regions: string[];
  available_stimuli: string[];
  extra: Record<string, unknown>;
}

export interface PCAPoint {
  trial_id: string | number;
  x: number;
  y: number;
  label: string;
  stimulus: string;
  region: string;
}

export interface PCAResponse {
  session_id: string | number;
  explained_variance_ratio: number[];
  points: PCAPoint[];
  pc_x: number;
  pc_y: number;
}

export interface HeatmapResponse {
  neuron_ids: (string | number)[];
  time_bins: number[];
  matrix: number[][];
  trial_id: string | number | null;
  normalization: string;
}

export interface PopulationTraceResponse {
  timestamps: number[];
  mean_firing_rate: number[];
  sem_firing_rate?: number[] | null;
  averaging_method: string;
  smoothing_window: number;
}

export interface TrialMetadata {
  trial_id: string | number;
  stimulus: string;
  label: string;
  start_time: number;
  stop_time: number;
  duration: number;
  region?: string | null;
  parameters: Record<string, unknown>;
}

export type UploadStage =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'validating'
  | 'canonicalizing'
  | 'creating_session'
  | 'generating_metadata'
  | 'completed'
  | 'error';

export interface UploadWorkflowState {
  stage: UploadStage;
  fileName: string | null;
  fileSize: number | null;
  rowCount: number | null;
  timestamp: string | null;
  error: string | null;
  success: string | null;
  assignedSessionId: string | null;
  totalUnits: number | null;
  totalTrials: number | null;
}

export interface UploadResponse {
  session_id: string;
  mouse_id: string;
  genotype: string;
  available_brain_regions: string[];
  available_stimuli: string[];
  total_units: number;
  total_trials: number;
  row_count?: number;
  upload_timestamp?: string;
  provenance: ProvenanceType;
  message: string;
}

// -------------------------------------------------------------
// 2. Decoder Module Types
// -------------------------------------------------------------
export type DecoderModelType = 'logistic_regression' | 'linear_svm' | 'random_forest' | 'ridge_classifier';

export interface DecoderTrainRequest {
  session_id: number;
  stimulus_name?: string;
  target_variable: string;
  model_type: DecoderModelType;
  model_parameters?: Record<string, unknown>;
  test_size: number;
  cv_folds: number;
  selected_structures?: string[];
  selected_unit_ids?: number[];
  bin_size_sec?: number;
  time_window_sec: [number, number];
  random_state?: number;
}

export interface DecoderDatasetSummary {
  dataset_id: string;
  session_id: number;
  name: string;
  session_metadata: Record<string, unknown>;
  available_labels: string[];
  available_brain_regions: string[];
  available_units: number[];
  available_stimuli: string[];
  trial_count: number;
  unit_count: number;
  provenance: string;
}

export interface DecoderDatasetDetail {
  dataset_id: string;
  session_id: number;
  name: string;
  session_metadata: Record<string, unknown>;
  available_labels: string[];
  available_brain_regions: string[];
  available_units: number[];
  available_stimuli: string[];
  unit_region_mapping: Record<string, string>;
  trial_count: number;
  unit_count: number;
  stimulus_counts: Record<string, number>;
  condition_counts: Record<string, number>;
  provenance: string;
}

export interface DecodingTargetInfo {
  name: string;
  display_name: string;
  description: string;
  target_type: string;
  classes: string[];
  class_count: number;
  sample_count: number;
  class_balance: Record<string, number>;
  compatible_stimulus?: string | null;
}

export interface TargetsResponse {
  session_id: number;
  dataset_id: string;
  targets: DecodingTargetInfo[];
}

export interface PerClassMetric {
  class_name: string;
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

export interface FoldMetric {
  fold: number;
  accuracy: number;
  precision_macro: number;
  recall_macro: number;
  f1_macro: number;
  train_samples: number;
  val_samples: number;
}

export interface CrossValidationMetrics {
  cv_folds: number;
  mean_accuracy: number;
  std_accuracy: number;
  mean_precision: number;
  std_precision: number;
  mean_recall: number;
  std_recall: number;
  mean_f1: number;
  std_f1: number;
  fold_metrics: FoldMetric[];
  adjusted_folds_note?: string | null;
}

export interface HeldOutMetrics {
  accuracy: number;
  balanced_accuracy: number;
  precision_macro: number;
  precision_weighted: number;
  recall_macro: number;
  recall_weighted: number;
  f1_macro: number;
  f1_weighted: number;
  support: number;
  per_class: Record<string, PerClassMetric>;
}

export interface PerformanceResponse {
  run_id: string;
  held_out_metrics: HeldOutMetrics;
  cross_validation: CrossValidationMetrics;
  data_split_info: Record<string, unknown>;
}

export interface ConfusionMatrixResponse {
  run_id: string;
  class_labels: string[];
  matrix: number[][];
  normalized_matrix: number[][];
  total_samples: number;
}

export interface FeatureImportanceItem {
  rank: number;
  unit_id: number;
  importance_score: number;
  signed_weight?: number | null;
  direction?: string | null;
  structure: string;
  ccfv3_area: string;
  class_associations?: Record<string, number> | null;
  firing_rate?: number | null;
  snr?: number | null;
}

export interface FeatureImportanceResponse {
  run_id: string;
  model_type: string;
  interpretation_type: string;
  explanation_note: string;
  features: FeatureImportanceItem[];
}

export interface RegionAggregation {
  rank: number;
  region: string;
  full_name: string;
  hierarchy: string;
  division: string;
  unit_count: number;
  mean_importance: number;
  total_importance: number;
  max_importance: number;
  units: number[];
}

export interface UnitBrainMap {
  unit_id: number;
  region: string;
  full_name: string;
  hierarchy: string;
  importance_score: number;
  signed_weight?: number | null;
  rank: number;
}

export interface BrainMappingResponse {
  run_id: string;
  total_units: number;
  mapped_units: number;
  unmapped_units: number;
  aggregation_method: string;
  regional_aggregations: RegionAggregation[];
  units: UnitBrainMap[];
  scientific_note: string;
}

export interface TrialPrediction {
  trial_id: number;
  true_label: string;
  predicted_label: string;
  correct: boolean;
  confidence?: number | null;
  decision_score?: number | null;
  score_type: string;
  class_scores?: Record<string, number> | null;
  trial_metadata: Record<string, unknown>;
}

export interface PredictionsResponse {
  run_id: string;
  total_predictions: number;
  correct_count: number;
  incorrect_count: number;
  accuracy: number;
  score_type: string;
  predictions: TrialPrediction[];
}

export interface TrialNeuralFeature {
  unit_id: number;
  structure: string;
  firing_rate: number;
  unit_importance: number;
  signed_weight?: number | null;
}

export interface PredictionDetailResponse {
  run_id: string;
  trial_id: number;
  true_label: string;
  predicted_label: string;
  correct: boolean;
  confidence?: number | null;
  decision_score?: number | null;
  score_type: string;
  class_scores?: Record<string, number> | null;
  trial_metadata: Record<string, unknown>;
  top_neural_features: TrialNeuralFeature[];
}

export interface DecoderRunResponse {
  run_id: string;
  status: string;
  session_id: number;
  target_variable: string;
  model_type: string;
  model_name: string;
  classes: string[];
  created_at: string;
  summary: string;
  provenance: string;
  config: Record<string, unknown>;
  dataset_summary: Record<string, unknown>;
  test_accuracy?: number | null;
  cv_mean_accuracy?: number | null;
  cv_std_accuracy?: number | null;
  f1_score_macro?: number | null;
  confusion_matrix?: number[][] | null;
  feature_importances?: FeatureImportanceRecord[] | null;
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
  run_id?: string;
}

// -------------------------------------------------------------
// 3. Simulation Module Types
// -------------------------------------------------------------
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

export type SimulationMode = 'quick' | 'custom' | 'byod';

export interface LIFPopulationParams {
  num_neurons: number;
  ei_ratio: number;
  connection_density: number;
  tau_m: number;
  v_rest: number;
  v_thresh: number;
  v_reset: number;
  r_m: number;
  t_ref: number;
  i_inj: number;
  noise: number;
  duration_ms: number;
  dt_ms: number;
  random_seed?: number | null;
  selected_neuron_id?: number;
}

export interface SimulationRunRequest {
  mode: SimulationMode;
  params: LIFPopulationParams;
}

export interface SpikeEvent {
  neuron_id: number;
  time_ms: number;
}

export interface MembranePotentialData {
  time_ms: number[];
  traces: Record<string, number[]>;
  v_thresh: number;
  v_reset: number;
  v_rest: number;
}

export interface ISIStats {
  mean_isi_ms: Record<string, number>;
  cv_isi: Record<string, number>;
  population_mean_isi_ms: number;
  population_cv_isi: number;
}

export interface PopulationFiringRate {
  time_bins_ms: number[];
  rates_hz: number[];
  bin_size_ms: number;
}

export interface SimulationSummary {
  total_neurons: number;
  duration_ms: number;
  total_spikes: number;
  mean_firing_rate_hz: number;
  selected_neuron: number;
  provenance: ProvenanceType;
}

export interface SimulationResponse {
  provenance: ProvenanceType;
  neuron_ids: number[];
  spike_events: SpikeEvent[];
  spikes_by_neuron: Record<string, number[]>;
  membrane_potentials?: MembranePotentialData | null;
  spike_counts: Record<string, number>;
  firing_rates: Record<string, number>;
  isi_statistics: ISIStats;
  population_firing_rate: PopulationFiringRate;
  summary: SimulationSummary;
  simulation_parameters: Record<string, unknown>;
  canonical_matrix?: CanonicalSpikeMatrix | null;
}

// -------------------------------------------------------------
// 4. Comparison Module Types
// -------------------------------------------------------------
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

export interface ComparisonPCAPoint {
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
  points: ComparisonPCAPoint[];
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
