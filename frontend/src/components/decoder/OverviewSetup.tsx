import React from 'react';
import {
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Database,
  ArrowRight,
} from 'lucide-react';
import {
  DecoderDatasetSummary,
  DecoderDatasetDetail,
  DecodingTargetInfo,
  DecoderModelType,
  DecoderRunResponse,
} from '../../types';

interface OverviewSetupProps {
  datasets: DecoderDatasetSummary[];
  selectedSessionId: number;
  onSelectSession: (sid: number) => void;
  datasetDetail: DecoderDatasetDetail | null;
  targets: DecodingTargetInfo[];
  selectedTarget: string;
  onSelectTarget: (t: string) => void;
  selectedModel: DecoderModelType;
  onSelectModel: (m: DecoderModelType) => void;
  modelParams: Record<string, unknown>;
  onUpdateModelParams: (params: Record<string, unknown>) => void;
  selectedStructures: string[];
  onToggleStructure: (struct: string) => void;
  binSizeSec: number;
  onChangeBinSize: (val: number) => void;
  timeWindow: [number, number];
  onChangeTimeWindow: (window: [number, number]) => void;
  testSize: number;
  onChangeTestSize: (val: number) => void;
  cvFolds: number;
  onChangeCvFolds: (val: number) => void;
  randomSeed: number;
  onChangeRandomSeed: (val: number) => void;
  onTrain: () => void;
  trainingStatus: 'idle' | 'preparing' | 'training' | 'evaluating' | 'completed' | 'failed';
  trainingError: string | null;
  currentRun: DecoderRunResponse | null;
  onNavigateToPerformance: () => void;
}

export const OverviewSetup: React.FC<OverviewSetupProps> = ({
  datasets,
  selectedSessionId,
  onSelectSession,
  datasetDetail,
  targets,
  selectedTarget,
  onSelectTarget,
  selectedModel,
  onSelectModel,
  modelParams,
  onUpdateModelParams,
  selectedStructures,
  onToggleStructure,
  binSizeSec,
  onChangeBinSize,
  timeWindow,
  onChangeTimeWindow,
  testSize,
  onChangeTestSize,
  cvFolds,
  onChangeCvFolds,
  randomSeed,
  onChangeRandomSeed,
  onTrain,
  trainingStatus,
  trainingError,
  currentRun,
  onNavigateToPerformance,
}) => {
  const currentTargetObj = targets.find((t) => t.name === selectedTarget);
  const totalSamples = currentTargetObj ? currentTargetObj.sample_count : (datasetDetail?.trial_count || 0);
  const testCount = Math.max(1, Math.round(totalSamples * testSize));
  const trainCount = Math.max(1, totalSamples - testCount);
  const classCount = currentTargetObj ? currentTargetObj.class_count : 0;
  const unitCount = datasetDetail?.unit_count || 0;

  const isTraining = trainingStatus === 'preparing' || trainingStatus === 'training' || trainingStatus === 'evaluating';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Run Complete Alert Banner */}
      {trainingStatus === 'completed' && currentRun && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10b981',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 color="#10b981" size={24} />
            <div>
              <div style={{ fontWeight: 600, color: '#ecfdf5', fontSize: '0.95rem' }}>
                Decoder Run Complete: {currentRun.run_id}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#a7f3d0' }}>
                Achieved <strong>{(currentRun.test_accuracy! * 100).toFixed(1)}%</strong> held-out test accuracy and{' '}
                <strong>{(currentRun.cv_mean_accuracy! * 100).toFixed(1)}%</strong> CV mean accuracy.
              </div>
            </div>
          </div>
          <button
            onClick={onNavigateToPerformance}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: '#064e3b',
              fontWeight: 600,
              fontSize: '0.85rem',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Inspect Performance <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {trainingStatus === 'failed' && trainingError && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertTriangle color="#ef4444" size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 600, color: '#fef2f2', fontSize: '0.95rem' }}>Training Failed</div>
            <div style={{ fontSize: '0.85rem', color: '#fca5a5', marginTop: '2px' }}>{trainingError}</div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Parameters & Model Selection */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Column 1: Dataset & Target */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
            <Database size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' }}>
              1. Dataset & Target Selection
            </h3>
          </div>

          {/* Dataset Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
              Experimental Neural Session
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => onSelectSession(Number(e.target.value))}
              disabled={isTraining}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            >
              {datasets.map((ds) => (
                <option key={ds.session_id} value={ds.session_id}>
                  {ds.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
              Decoding Target Variable
            </label>
            <select
              value={selectedTarget}
              onChange={(e) => onSelectTarget(e.target.value)}
              disabled={isTraining}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            >
              {targets.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.display_name} ({t.class_count} classes, {t.sample_count} trials)
                </option>
              ))}
            </select>
            {currentTargetObj && (
              <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4' }}>
                {currentTargetObj.description}
              </p>
            )}
          </div>

          {/* Target Classes Chips */}
          {currentTargetObj && (
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Target Class Categories ({currentTargetObj.classes.length}):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '100px', overflowY: 'auto' }}>
                {currentTargetObj.classes.map((cls) => {
                  const count = currentTargetObj.class_balance[cls] || 0;
                  return (
                    <span
                      key={cls}
                      style={{
                        padding: '3px 8px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: '#cbd5e1',
                      }}
                    >
                      {cls} <strong style={{ color: '#a78bfa' }}>({count})</strong>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Brain Structure Filters */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>CCFv3 Brain Structure Filter</label>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                {selectedStructures.length === 0 ? 'All Structures' : `${selectedStructures.length} Selected`}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(datasetDetail?.available_brain_regions || ['VISp', 'VISl', 'VISam', 'LP', 'LGd', 'CA1']).map(
                (struct) => {
                  const isSelected = selectedStructures.length === 0 || selectedStructures.includes(struct);
                  return (
                    <button
                      key={struct}
                      type="button"
                      onClick={() => onToggleStructure(struct)}
                      disabled={isTraining}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: `1px solid ${isSelected ? '#8b5cf6' : '#334155'}`,
                        backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.2)' : '#1e293b',
                        color: isSelected ? '#c4b5fd' : '#94a3b8',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {struct}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Model & Cross-Validation */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa' }}>
            <Sliders size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#f1f5f9' }}>
              2. Decoder Architecture & Hyperparameters
            </h3>
          </div>

          {/* Model Type Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>
              Classification Model
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { type: 'logistic_regression', label: 'Logistic Reg.', desc: 'L2 Linear Coefficients' },
                { type: 'linear_svm', label: 'Linear SVM', desc: 'Max-Margin Separator' },
                { type: 'random_forest', label: 'Random Forest', desc: 'Ensemble Tree Importance' },
              ].map((m) => {
                const isSelected = selectedModel === m.type;
                return (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => onSelectModel(m.type as DecoderModelType)}
                    disabled={isTraining}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: `1px solid ${isSelected ? '#8b5cf6' : '#334155'}`,
                      backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : '#1e293b',
                      color: isSelected ? '#f8fafc' : '#94a3b8',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: isSelected ? '#c4b5fd' : '#e2e8f0' }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Hyperparameters */}
          <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '10px' }}>
              Model-Specific Parameters
            </span>

            {selectedModel === 'logistic_regression' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Inverse Regularization (C): {String(modelParams.C ?? 1.0)}
                  </label>
                  <input
                    type="range"
                    min="0.01"
                    max="10.0"
                    step="0.05"
                    value={Number(modelParams.C ?? 1.0)}
                    onChange={(e) => onUpdateModelParams({ ...modelParams, C: parseFloat(e.target.value) })}
                    disabled={isTraining}
                    style={{ width: '100%', accentColor: '#8b5cf6' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Max Iterations
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    step="100"
                    value={Number(modelParams.max_iter ?? 1000)}
                    onChange={(e) => onUpdateModelParams({ ...modelParams, max_iter: parseInt(e.target.value) })}
                    disabled={isTraining}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>
            )}

            {selectedModel === 'linear_svm' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Regularization Parameter (C): {String(modelParams.C ?? 1.0)}
                  </label>
                  <input
                    type="range"
                    min="0.01"
                    max="10.0"
                    step="0.05"
                    value={Number(modelParams.C ?? 1.0)}
                    onChange={(e) => onUpdateModelParams({ ...modelParams, C: parseFloat(e.target.value) })}
                    disabled={isTraining}
                    style={{ width: '100%', accentColor: '#8b5cf6' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Max Iterations
                  </label>
                  <input
                    type="number"
                    min="500"
                    max="5000"
                    step="500"
                    value={Number(modelParams.max_iter ?? 2000)}
                    onChange={(e) => onUpdateModelParams({ ...modelParams, max_iter: parseInt(e.target.value) })}
                    disabled={isTraining}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>
            )}

            {selectedModel === 'random_forest' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Estimators: {String(modelParams.n_estimators ?? 100)}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="10"
                    value={Number(modelParams.n_estimators ?? 100)}
                    onChange={(e) => onUpdateModelParams({ ...modelParams, n_estimators: parseInt(e.target.value) })}
                    disabled={isTraining}
                    style={{ width: '100%', accentColor: '#8b5cf6' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Max Depth
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    placeholder="None"
                    value={modelParams.max_depth ? Number(modelParams.max_depth) : ''}
                    onChange={(e) =>
                      onUpdateModelParams({
                        ...modelParams,
                        max_depth: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    disabled={isTraining}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Validation & Split Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Held-Out Test Split: {(testSize * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.10"
                max="0.40"
                step="0.05"
                value={testSize}
                onChange={(e) => onChangeTestSize(parseFloat(e.target.value))}
                disabled={isTraining}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Stratified CV Folds: {cvFolds}
              </label>
              <input
                type="range"
                min="2"
                max="6"
                step="1"
                value={cvFolds}
                onChange={(e) => onChangeCvFolds(parseInt(e.target.value))}
                disabled={isTraining}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>
          </div>

          {/* Random Seed, Bin Size & Analysis Window */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Seed
              </label>
              <input
                type="number"
                value={randomSeed}
                onChange={(e) => onChangeRandomSeed(parseInt(e.target.value) || 42)}
                disabled={isTraining}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Bin: {(binSizeSec * 1000).toFixed(0)}ms
              </label>
              <input
                type="range"
                min="0.01"
                max="0.20"
                step="0.01"
                value={binSizeSec}
                onChange={(e) => onChangeBinSize(parseFloat(e.target.value))}
                disabled={isTraining}
                style={{ width: '100%', accentColor: '#10b981' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Window: {timeWindow[1].toFixed(1)}s
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={timeWindow[1]}
                onChange={(e) => onChangeTimeWindow([0.0, parseFloat(e.target.value)])}
                disabled={isTraining}
                style={{ width: '100%', accentColor: '#10b981' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
        <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>TOTAL SAMPLES</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9' }}>{totalSamples}</div>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>NEURAL UNITS</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>{unitCount}</div>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>CLASSES</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a78bfa' }}>{classCount}</div>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>TRAIN SAMPLES</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399' }}>~{trainCount}</div>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>TEST SAMPLES (HELD-OUT)</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fbbf24' }}>~{testCount}</div>
        </div>
      </div>

      {/* Train Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button
          onClick={onTrain}
          disabled={isTraining}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 28px',
            backgroundColor: isTraining ? '#4c1d95' : '#7c3aed',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.95rem',
            border: 'none',
            borderRadius: '8px',
            cursor: isTraining ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px 0 rgba(124, 58, 237, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {isTraining ? (
            <>
              <RotateCw size={18} className="animate-spin" />
              <span>
                {trainingStatus === 'preparing' && 'Preparing Population Vectors...'}
                {trainingStatus === 'training' && 'Fitting Decoder Model...'}
                {trainingStatus === 'evaluating' && 'Running Held-Out & CV Evaluation...'}
              </span>
            </>
          ) : (
            <>
              <Play size={18} fill="#ffffff" />
              <span>Train Population Decoder</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
