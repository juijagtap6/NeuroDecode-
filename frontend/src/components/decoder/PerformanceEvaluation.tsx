import React, { useState } from 'react';
import {
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import {
  DecoderRunResponse,
  PerformanceResponse,
  ConfusionMatrixResponse,
} from '../../types';
import { PlotlyConfusionMatrix } from '../PlotlyConfusionMatrix';

interface PerformanceEvaluationProps {
  currentRun: DecoderRunResponse | null;
  performanceData: PerformanceResponse | null;
  confusionMatrixData: ConfusionMatrixResponse | null;
  onNavigateToOverview: () => void;
}

export const PerformanceEvaluation: React.FC<PerformanceEvaluationProps> = ({
  currentRun,
  performanceData,
  confusionMatrixData,
  onNavigateToOverview,
}) => {
  const [showNormalized, setShowNormalized] = useState<boolean>(true);

  if (!currentRun || !performanceData || !confusionMatrixData) {
    return (
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px dashed #334155',
          borderRadius: '12px',
          padding: '60px 20px',
          textAlign: 'center',
          color: '#94a3b8',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: '#a78bfa',
          }}
        >
          <BarChart3 size={24} />
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#f1f5f9', fontWeight: 600 }}>
          No Active Decoder Run
        </h3>
        <p style={{ margin: '0 auto 20px auto', maxWidth: '400px', fontSize: '0.85rem', lineHeight: '1.5' }}>
          Performance metrics, cross-validation scores, and the confusion matrix populate once a decoder model is trained.
        </p>
        <button
          onClick={onNavigateToOverview}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            backgroundColor: '#7c3aed',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.85rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Go to Overview & Setup <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  const held = performanceData.held_out_metrics;
  const cv = performanceData.cross_validation;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* SECTION 1: HELD-OUT TEST PERFORMANCE */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  letterSpacing: '0.05em',
                }}
              >
                HELD-OUT TEST SET EVALUATION
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Strictly separated test partition ({held.support} trials, {String(currentRun.dataset_summary?.neural_units ?? '')} units)
              </span>
            </div>
            <h2 style={{ margin: '6px 0 0 0', fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              Held-Out Generalization Metrics
            </h2>
          </div>

          <div
            style={{
              padding: '6px 12px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: '#94a3b8',
            }}
          >
            Model: <strong style={{ color: '#c4b5fd' }}>{currentRun.model_name}</strong>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>TEST ACCURACY</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>
              {(held.accuracy * 100).toFixed(1)}%
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {(held.accuracy * held.support).toFixed(0)} of {held.support} correct trials
            </span>
          </div>

          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>BALANCED ACCURACY</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a78bfa' }}>
              {(held.balanced_accuracy * 100).toFixed(1)}%
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Accounts for class representation</span>
          </div>

          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>MACRO F1-SCORE</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>
              {(held.f1_macro * 100).toFixed(1)}%
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Weighted F1: {(held.f1_weighted * 100).toFixed(1)}%
            </span>
          </div>

          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>MACRO PRECISION / RECALL</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fbbf24', marginTop: '4px' }}>
              {(held.precision_macro * 100).toFixed(0)}% / {(held.recall_macro * 100).toFixed(0)}%
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Unweighted cross-category mean</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: CONFUSION MATRIX */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9' }}>
              Held-Out Test Confusion Matrix
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Predicted vs true stimulus condition on {held.support} held-out test trials.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#1e293b',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #334155',
            }}
          >
            <button
              onClick={() => setShowNormalized(false)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: !showNormalized ? '#7c3aed' : 'transparent',
                color: !showNormalized ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              Counts
            </button>
            <button
              onClick={() => setShowNormalized(true)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: showNormalized ? '#7c3aed' : 'transparent',
                color: showNormalized ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              Normalized
            </button>
          </div>
        </div>

        <PlotlyConfusionMatrix
          classLabels={confusionMatrixData.class_labels}
          matrix={confusionMatrixData.matrix}
          normalizedMatrix={confusionMatrixData.normalized_matrix}
          showNormalized={showNormalized}
        />
      </div>

      {/* SECTION 3: STRATIFIED CROSS-VALIDATION */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(167, 139, 250, 0.15)',
                color: '#a78bfa',
                letterSpacing: '0.05em',
              }}
            >
              STRATIFIED K-FOLD CROSS-VALIDATION
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Conducted strictly on the training partition ({cv.cv_folds} folds)
            </span>
          </div>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9' }}>
            Internal Stability & Fold Breakdown
          </h3>
        </div>

        {cv.adjusted_folds_note && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#fde047',
              marginBottom: '16px',
            }}
          >
            {cv.adjusted_folds_note}
          </div>
        )}

        {/* CV Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>MEAN CV ACCURACY</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a78bfa', marginTop: '2px' }}>
              {(cv.mean_accuracy * 100).toFixed(1)}%
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              ± {(cv.std_accuracy * 100).toFixed(1)}% std dev
            </span>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>MEAN CV PRECISION</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
              {(cv.mean_precision * 100).toFixed(1)}%
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              ± {(cv.std_precision * 100).toFixed(1)}% std dev
            </span>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>MEAN CV RECALL</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
              {(cv.mean_recall * 100).toFixed(1)}%
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              ± {(cv.std_recall * 100).toFixed(1)}% std dev
            </span>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>MEAN CV F1</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fbbf24', marginTop: '2px' }}>
              {(cv.mean_f1 * 100).toFixed(1)}%
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              ± {(cv.std_f1 * 100).toFixed(1)}% std dev
            </span>
          </div>
        </div>

        {/* Fold Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '8px 12px' }}>Fold</th>
                <th style={{ padding: '8px 12px' }}>Train / Val Samples</th>
                <th style={{ padding: '8px 12px' }}>Accuracy</th>
                <th style={{ padding: '8px 12px' }}>Macro Precision</th>
                <th style={{ padding: '8px 12px' }}>Macro Recall</th>
                <th style={{ padding: '8px 12px' }}>Macro F1</th>
              </tr>
            </thead>
            <tbody>
              {cv.fold_metrics.map((f) => (
                <tr
                  key={f.fold}
                  style={{
                    borderBottom: '1px solid #1e293b',
                    color: '#f8fafc',
                  }}
                >
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: '#c4b5fd' }}>
                    Fold #{f.fold}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#94a3b8' }}>
                    {f.train_samples} / {f.val_samples}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{(f.accuracy * 100).toFixed(1)}%</td>
                  <td style={{ padding: '8px 12px' }}>{(f.precision_macro * 100).toFixed(1)}%</td>
                  <td style={{ padding: '8px 12px' }}>{(f.recall_macro * 100).toFixed(1)}%</td>
                  <td style={{ padding: '8px 12px' }}>{(f.f1_macro * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
