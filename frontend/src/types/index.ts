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
