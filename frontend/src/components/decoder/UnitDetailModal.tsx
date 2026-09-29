import React from 'react';
import { X, Brain, Activity, Tag, Award } from 'lucide-react';
import { FeatureImportanceItem } from '../../types';

interface UnitDetailModalProps {
  unit: FeatureImportanceItem | null;
  onClose: () => void;
  modelType: string;
}

export const UnitDetailModal: React.FC<UnitDetailModalProps> = ({ unit, onClose, modelType }) => {
  if (!unit) return null;

  const isLinear = modelType === 'logistic_regression' || modelType === 'linear_svm';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '560px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          color: '#f8fafc',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a78bfa',
              }}
            >
              <Brain size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Neural Unit #{unit.unit_id}</h2>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                CCFv3 Anatomical & Decoder Feature Detail
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
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '4px' }}>
              <Award size={14} color="#f59e0b" />
              <span>OVERALL RANK</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fbbf24' }}>
              #{unit.rank}
            </div>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '4px' }}>
              <Activity size={14} color="#a78bfa" />
              <span>{isLinear ? 'WEIGHT MAGNITUDE' : 'GINI IMPORTANCE'}</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#c084fc' }}>
              {unit.importance_score.toFixed(4)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#1e293b', borderRadius: '6px' }}>
            <span style={{ color: '#94a3b8' }}>CCFv3 Structure:</span>
            <span style={{ fontWeight: 600, color: '#38bdf8' }}>{unit.structure} ({unit.ccfv3_area})</span>
          </div>

          {isLinear && unit.signed_weight !== null && unit.signed_weight !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#1e293b', borderRadius: '6px' }}>
              <span style={{ color: '#94a3b8' }}>Dominant Signed Weight:</span>
              <span style={{ fontWeight: 600, color: unit.signed_weight >= 0 ? '#34d399' : '#f87171' }}>
                {unit.signed_weight > 0 ? `+${unit.signed_weight.toFixed(4)}` : unit.signed_weight.toFixed(4)}
              </span>
            </div>
          )}

          {unit.firing_rate !== null && unit.firing_rate !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#1e293b', borderRadius: '6px' }}>
              <span style={{ color: '#94a3b8' }}>Mean Experimental Firing Rate:</span>
              <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{unit.firing_rate.toFixed(2)} Hz</span>
            </div>
          )}
        </div>

        {unit.class_associations && Object.keys(unit.class_associations).length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={14} color="#818cf8" />
              Per-Class Model Coefficients
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                maxHeight: '160px',
                overflowY: 'auto',
                backgroundColor: '#090d16',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #1e293b',
              }}
            >
              {Object.entries(unit.class_associations).map(([cls, weight]) => (
                <div key={cls} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '4px 6px', borderRadius: '4px', backgroundColor: '#1e293b' }}>
                  <span style={{ color: '#cbd5e1', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{cls}</span>
                  <span style={{ fontWeight: 600, color: weight >= 0 ? '#34d399' : '#f87171', marginLeft: '6px' }}>
                    {weight > 0 ? `+${weight.toFixed(3)}` : weight.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: '20px',
            padding: '10px 12px',
            backgroundColor: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: '#fde047',
            lineHeight: '1.4',
          }}
        >
          <strong>Scientific Integrity Notice:</strong> Statistical model weights represent the classifier's optimal decision boundary on binned spike rates. They must not be conflated with direct biophysical connectivity or causal influence.
        </div>
      </div>
    </div>
  );
};
