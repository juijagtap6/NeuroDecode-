import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  BarChart3,
  Brain,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
  Sliders,
} from 'lucide-react';
import {
  DecoderDatasetSummary,
  DecoderDatasetDetail,
  DecodingTargetInfo,
  DecoderModelType,
  DecoderRunResponse,
  PerformanceResponse,
  ConfusionMatrixResponse,
  FeatureImportanceResponse,
  BrainMappingResponse,
  PredictionsResponse,
} from '../types';
import { api } from '../api/client';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { OverviewSetup } from '../components/decoder/OverviewSetup';
import { PerformanceEvaluation } from '../components/decoder/PerformanceEvaluation';
import { FeatureImportanceMapping } from '../components/decoder/FeatureImportanceMapping';
import { PredictionInspector } from '../components/decoder/PredictionInspector';

export type DecoderSubView = 'overview' | 'performance' | 'features' | 'predictions';

export const DecoderView: React.FC = () => {
  // Navigation State
  const [activeSubView, setActiveSubView] = useState<DecoderSubView>('overview');

  // Datasets and Target Metadata State
  const [datasets, setDatasets] = useState<DecoderDatasetSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number>(715093703);
  const [datasetDetail, setDatasetDetail] = useState<DecoderDatasetDetail | null>(null);
  const [targets, setTargets] = useState<DecodingTargetInfo[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('orientation');

  // Decoder Model & Feature Configuration State
  const [selectedModel, setSelectedModel] = useState<DecoderModelType>('logistic_regression');
  const [modelParams, setModelParams] = useState<Record<string, unknown>>({ C: 1.0, max_iter: 1000 });
  const [selectedStructures, setSelectedStructures] = useState<string[]>([]);
  const [binSizeSec, setBinSizeSec] = useState<number>(0.05);
  const [timeWindow, setTimeWindow] = useState<[number, number]>([0.0, 2.0]);
  const [testSize, setTestSize] = useState<number>(0.25);
  const [cvFolds, setCvFolds] = useState<number>(3);
  const [randomSeed, setRandomSeed] = useState<number>(42);

  // Training & Active Run State (PERSISTS ACROSS SUB-VIEWS)
  const [trainingStatus, setTrainingStatus] = useState<
    'idle' | 'preparing' | 'training' | 'evaluating' | 'completed' | 'failed'
  >('idle');
  const [trainingError, setTrainingError] = useState<string | null>(null);

  const [currentRun, setCurrentRun] = useState<DecoderRunResponse | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceResponse | null>(null);
  const [confusionMatrixData, setConfusionMatrixData] = useState<ConfusionMatrixResponse | null>(null);
  const [featureImportanceData, setFeatureImportanceData] = useState<FeatureImportanceResponse | null>(null);
  const [brainMappingData, setBrainMappingData] = useState<BrainMappingResponse | null>(null);
  const [predictionsData, setPredictionsData] = useState<PredictionsResponse | null>(null);

  // Initial Load: Discover Available Neural Datasets
  useEffect(() => {
    let isMounted = true;
    api.getDecoderDatasets()
      .then((data) => {
        if (!isMounted) return;
        setDatasets(data);
        if (data.length > 0) {
          const firstSid = data[0].session_id;
          setSelectedSessionId(firstSid);
        }
      })
      .catch((err) => {
        console.error('Failed to load datasets:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // When selected session changes, fetch details and targets
  useEffect(() => {
    let isMounted = true;
    if (!selectedSessionId) return;

    // Load dataset detail
    api.getDecoderDatasetDetail(selectedSessionId)
      .then((detail) => {
        if (!isMounted) return;
        setDatasetDetail(detail);
      })
      .catch((err) => console.error('Failed to load dataset detail:', err));

    // Load available targets
    api.getDecoderTargets(selectedSessionId)
      .then((res) => {
        if (!isMounted) return;
        setTargets(res.targets);
        if (res.targets.length > 0) {
          const hasOrient = res.targets.some((t) => t.name === 'orientation');
          setSelectedTarget(hasOrient ? 'orientation' : res.targets[0].name);
        }
      })
      .catch((err) => console.error('Failed to load targets:', err));

    return () => {
      isMounted = false;
    };
  }, [selectedSessionId]);

  // Model selection handler with default hyperparameter presets
  const handleSelectModel = useCallback((model: DecoderModelType) => {
    setSelectedModel(model);
    if (model === 'logistic_regression') {
      setModelParams({ C: 1.0, max_iter: 1000 });
    } else if (model === 'linear_svm') {
      setModelParams({ C: 1.0, max_iter: 2000 });
    } else if (model === 'random_forest') {
      setModelParams({ n_estimators: 100, max_depth: undefined, min_samples_split: 2 });
    }
  }, []);

  // Toggle CCFv3 structure filter
  const handleToggleStructure = useCallback((struct: string) => {
    setSelectedStructures((prev) => {
      if (prev.includes(struct)) {
        return prev.filter((s) => s !== struct);
      } else {
        return [...prev, struct];
      }
    });
  }, []);

  // Main Action: Trigger Decoder Training
  const handleTrainDecoder = async () => {
    setTrainingStatus('preparing');
    setTrainingError(null);

    const payload = {
      session_id: selectedSessionId,
      target_variable: selectedTarget,
      model_type: selectedModel,
      model_parameters: modelParams,
      test_size: testSize,
      cv_folds: cvFolds,
      selected_structures: selectedStructures.length > 0 ? selectedStructures : undefined,
      bin_size_sec: binSizeSec,
      time_window_sec: timeWindow,
      random_state: randomSeed,
    };

    try {
      setTrainingStatus('training');
      const runResponse = await api.trainDecoder(payload);
      setCurrentRun(runResponse);

      setTrainingStatus('evaluating');
      // Concurrently retrieve all evaluation sub-module artifacts
      const [perf, cm, feat, brain, preds] = await Promise.all([
        api.getDecoderPerformance(runResponse.run_id),
        api.getDecoderConfusionMatrix(runResponse.run_id),
        api.getDecoderFeatureImportance(runResponse.run_id),
        api.getDecoderBrainMapping(runResponse.run_id),
        api.getDecoderPredictions(runResponse.run_id),
      ]);

      setPerformanceData(perf);
      setConfusionMatrixData(cm);
      setFeatureImportanceData(feat);
      setBrainMappingData(brain);
      setPredictionsData(preds);

      setTrainingStatus('completed');
    } catch (err: unknown) {
      console.error('Training failed:', err);
      setTrainingStatus('failed');
      const msg = err instanceof Error ? err.message : 'Training failed due to an unexpected error.';
      setTrainingError(msg);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', color: '#f8fafc' }}>
      {/* 1. Header with Module Identity & Provenance */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a78bfa',
              }}
            >
              <Cpu size={22} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Population Decoder
            </h1>
            <ProvenanceBadge provenance="allen_experimental" />
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Train and evaluate scikit-learn population decoders on authentic Allen Neuropixels neural spike rates with CCFv3 anatomical mapping.
          </p>
        </div>

        {/* Persistent Run Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            fontSize: '0.8rem',
          }}
        >
          <span style={{ color: '#94a3b8' }}>Run Status:</span>
          {trainingStatus === 'completed' && (
            <span style={{ color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={14} /> Completed ({currentRun?.run_id})
            </span>
          )}
          {(trainingStatus === 'preparing' || trainingStatus === 'training' || trainingStatus === 'evaluating') && (
            <span style={{ color: '#a78bfa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={14} /> {trainingStatus.toUpperCase()}...
            </span>
          )}
          {trainingStatus === 'failed' && (
            <span style={{ color: '#f87171', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={14} /> Failed
            </span>
          )}
          {trainingStatus === 'idle' && (
            <span style={{ color: '#cbd5e1', fontWeight: 500 }}>Idle (Ready)</span>
          )}
        </div>
      </div>

      {/* 2. Persistent Run Context Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          padding: '12px 18px',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '0.8rem',
        }}
      >
        <div>
          <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>DATASET / SESSION</span>
          <span style={{ color: '#f8fafc', fontWeight: 600 }}>Session #{selectedSessionId}</span>
        </div>
        <div>
          <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>TARGET VARIABLE</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{selectedTarget}</span>
        </div>
        <div>
          <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>MODEL ARCHITECTURE</span>
          <span style={{ color: '#a78bfa', fontWeight: 600 }}>
            {selectedModel === 'logistic_regression' && 'Logistic Regression'}
            {selectedModel === 'linear_svm' && 'Linear SVM'}
            {selectedModel === 'random_forest' && 'Random Forest'}
          </span>
        </div>
        <div>
          <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>HELD-OUT TEST ACCURACY</span>
          <span
            style={{
              color: currentRun?.test_accuracy !== null && currentRun?.test_accuracy !== undefined ? '#34d399' : '#94a3b8',
              fontWeight: 700,
            }}
          >
            {currentRun?.test_accuracy !== null && currentRun?.test_accuracy !== undefined
              ? `${(currentRun.test_accuracy * 100).toFixed(1)}%`
              : 'Not Trained Yet'}
          </span>
        </div>
      </div>

      {/* 3. Persistent Four-Section Sub-Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #1e293b',
          marginBottom: '24px',
          gap: '4px',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'overview', label: '1. Overview & Setup', icon: Sliders },
          { id: 'performance', label: '2. Performance & Evaluation', icon: BarChart3 },
          { id: 'features', label: '3. Feature Importance & Mapping', icon: Brain },
          { id: 'predictions', label: '4. Prediction Inspector', icon: Search },
        ].map((tab) => {
          const isActive = activeSubView === tab.id;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubView(tab.id as DecoderSubView)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #8b5cf6' : '2px solid transparent',
                color: isActive ? '#a78bfa' : '#94a3b8',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <IconComp size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. Active Sub-View Body */}
      <div>
        {activeSubView === 'overview' && (
          <OverviewSetup
            datasets={datasets}
            selectedSessionId={selectedSessionId}
            onSelectSession={setSelectedSessionId}
            datasetDetail={datasetDetail}
            targets={targets}
            selectedTarget={selectedTarget}
            onSelectTarget={setSelectedTarget}
            selectedModel={selectedModel}
            onSelectModel={handleSelectModel}
            modelParams={modelParams}
            onUpdateModelParams={setModelParams}
            selectedStructures={selectedStructures}
            onToggleStructure={handleToggleStructure}
            binSizeSec={binSizeSec}
            onChangeBinSize={setBinSizeSec}
            timeWindow={timeWindow}
            onChangeTimeWindow={setTimeWindow}
            testSize={testSize}
            onChangeTestSize={setTestSize}
            cvFolds={cvFolds}
            onChangeCvFolds={setCvFolds}
            randomSeed={randomSeed}
            onChangeRandomSeed={setRandomSeed}
            onTrain={handleTrainDecoder}
            trainingStatus={trainingStatus}
            trainingError={trainingError}
            currentRun={currentRun}
            onNavigateToPerformance={() => setActiveSubView('performance')}
          />
        )}

        {activeSubView === 'performance' && (
          <PerformanceEvaluation
            currentRun={currentRun}
            performanceData={performanceData}
            confusionMatrixData={confusionMatrixData}
            onNavigateToOverview={() => setActiveSubView('overview')}
          />
        )}

        {activeSubView === 'features' && (
          <FeatureImportanceMapping
            currentRun={currentRun}
            featureImportanceData={featureImportanceData}
            brainMappingData={brainMappingData}
            onNavigateToOverview={() => setActiveSubView('overview')}
          />
        )}

        {activeSubView === 'predictions' && (
          <PredictionInspector
            currentRun={currentRun}
            predictionsData={predictionsData}
            onNavigateToOverview={() => setActiveSubView('overview')}
          />
        )}
      </div>
    </div>
  );
};
