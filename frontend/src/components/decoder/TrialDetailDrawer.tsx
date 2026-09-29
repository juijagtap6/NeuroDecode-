import React from 'react';
import { X, CheckCircle, XCircle, Activity, Info, BarChart2 } from 'lucide-react';
import { PredictionDetailResponse } from '../../types';

interface TrialDetailDrawerProps {
  trial: PredictionDetailResponse | null;
  onClose: () => void;
  targetVariable: string;
}

export const TrialDetailDrawer: React.FC<TrialDetailDrawerProps> = ({ trial, onClose, targetVariable }) => {
  if (!trial) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '460px',
        maxWidth: '90vw',
        backgroundColor: '#0f172a',
        borderLeft: '1px solid #334155',
        boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.6)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        color: '#f8fafc',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {trial.correct ? (
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
              <CheckCircle size={20} />
            </div>
          ) : (
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(248, 113, 113, 0.15)', color: '#f87171' }}>
              <XCircle size={20} />
            </div>
          )}
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Trial #{trial.trial_id}</h3>
            <span style={{ fontSize: '0.8rem', color: trial.correct ? '#34d399' : '#f87171', fontWeight: 500 }}>
              {trial.correct ? 'Correctly Decoded' : 'Decoder Error (Misclassified)'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Body Scroll */}
      <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Prediction Summary */}
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #334155', fontSize: '0.75rem' }}>
            <span style={{ color: '#94a3b8' }}>TARGET VARIABLE</span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{targetVariable}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>TRUE LABEL</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>{trial.true_label}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>PREDICTED LABEL</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: trial.correct ? '#34d399' : '#f87171' }}>
                {trial.predicted_label}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #334155', fontSize: '0.8rem' }}>
            <span style={{ color: '#94a3b8' }}>
              {trial.score_type === 'probability' ? 'Model Confidence:' : 'Margin Decision Score:'}
            </span>
            <span style={{ fontWeight: 600, color: '#a78bfa' }}>
              {trial.confidence !== null && trial.confidence !== undefined
                ? `${(trial.confidence * 100).toFixed(1)}%`
                : trial.decision_score !== null && trial.decision_score !== undefined
                ? trial.decision_score.toFixed(3)
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Candidate Class Scores */}
        {trial.class_scores && Object.keys(trial.class_scores).length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '10px' }}>
              <BarChart2 size={16} color="#38bdf8" />
              Candidate Class {trial.score_type === 'probability' ? 'Probabilities' : 'Decision Scores'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.entries(trial.class_scores).map(([cName, score]) => {
                const isTrue = cName === trial.true_label;
                const isPred = cName === trial.predicted_label;
                const pct = trial.score_type === 'probability' ? Math.max(0, Math.min(100, score * 100)) : 50;

                return (
                  <div
                    key={cName}
                    style={{
                      backgroundColor: '#1e293b',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${isPred ? '#8b5cf6' : '#334155'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: isPred ? 600 : 400 }}>
                        {cName}
                        {isTrue && <span style={{ fontSize: '0.65rem', backgroundColor: '#064e3b', color: '#6ee7b7', padding: '1px 5px', borderRadius: '4px' }}>True</span>}
                        {isPred && <span style={{ fontSize: '0.65rem', backgroundColor: '#4c1d95', color: '#c4b5fd', padding: '1px 5px', borderRadius: '4px' }}>Pred</span>}
                      </span>
                      <span style={{ fontWeight: 600, color: '#94a3b8' }}>
                        {trial.score_type === 'probability' ? `${(score * 100).toFixed(1)}%` : score.toFixed(3)}
                      </span>
                    </div>
                    {trial.score_type === 'probability' && (
                      <div style={{ width: '100%', height: '4px', backgroundColor: '#090d16', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            backgroundColor: isPred ? (trial.correct ? '#34d399' : '#f87171') : '#64748b',
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Neural Unit Activity Drill-down */}
        {trial.top_neural_features && trial.top_neural_features.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '10px' }}>
              <Activity size={16} color="#a78bfa" />
              Top Active Neural Units During Trial
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {trial.top_neural_features.map((feat) => (
                <div
                  key={feat.unit_id}
                  style={{
                    backgroundColor: '#1e293b',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: '#f1f5f9' }}>Unit #{feat.unit_id}</span>
                    <span style={{ marginLeft: '6px', color: '#38bdf8', fontSize: '0.75rem' }}>{feat.structure}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: '#a78bfa' }}>{feat.firing_rate.toFixed(1)} Hz</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      Weight: {feat.unit_importance.toFixed(3)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trial Metadata */}
        {trial.trial_metadata && Object.keys(trial.trial_metadata).length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
              <Info size={16} color="#94a3b8" />
              Trial Acquisition Metadata
            </div>
            <div
              style={{
                backgroundColor: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {Object.entries(trial.trial_metadata).map(([k, v]) => {
                if (typeof v === 'object' && v !== null) {
                  return Object.entries(v as Record<string, unknown>).map(([subK, subV]) => (
                    <div key={`${k}.${subK}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>{subK}:</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{String(subV)}</span>
                    </div>
                  ));
                }
                return (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>{k}:</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{String(v)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
