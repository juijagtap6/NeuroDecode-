import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Activity,
} from 'lucide-react';
import {
  DecoderRunResponse,
  PredictionsResponse,
  PredictionDetailResponse,
} from '../../types';
import { api } from '../../api/client';
import { TrialDetailDrawer } from './TrialDetailDrawer';

interface PredictionInspectorProps {
  currentRun: DecoderRunResponse | null;
  predictionsData: PredictionsResponse | null;
  onNavigateToOverview: () => void;
}

type FilterStatus = 'all' | 'correct' | 'errors';

export const PredictionInspector: React.FC<PredictionInspectorProps> = ({
  currentRun,
  predictionsData,
  onNavigateToOverview,
}) => {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchTrial, setSearchTrial] = useState<string>('');
  const [selectedTrueClass, setSelectedTrueClass] = useState<string>('all');
  const [selectedTrialDetail, setSelectedTrialDetail] = useState<PredictionDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  if (!currentRun || !predictionsData) {
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
          <Activity size={24} />
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#f1f5f9', fontWeight: 600 }}>
          No Prediction Inspection Data
        </h3>
        <p style={{ margin: '0 auto 20px auto', maxWidth: '400px', fontSize: '0.85rem', lineHeight: '1.5' }}>
          Train a decoder model to inspect individual trial predictions and identify classification errors.
        </p>
        <button
          onClick={onNavigateToOverview}
          style={{
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
          Go to Overview & Setup
        </button>
      </div>
    );
  }

  const { predictions, total_predictions, correct_count, incorrect_count, accuracy, score_type } = predictionsData;

  const allClasses = useMemo(() => {
    return Array.from(new Set(predictions.map((p) => p.true_label))).sort();
  }, [predictions]);

  const filteredPredictions = useMemo(() => {
    return predictions.filter((p) => {
      // Status filter
      if (filterStatus === 'correct' && !p.correct) return false;
      if (filterStatus === 'errors' && p.correct) return false;

      // Class filter
      if (selectedTrueClass !== 'all' && p.true_label !== selectedTrueClass) return false;

      // Search filter
      if (searchTrial !== '' && !String(p.trial_id).includes(searchTrial)) return false;

      return true;
    });
  }, [predictions, filterStatus, selectedTrueClass, searchTrial]);

  const handleInspectTrial = async (trialId: number) => {
    setIsLoadingDetail(true);
    try {
      const detail = await api.getDecoderPredictionDetail(currentRun.run_id, trialId);
      setSelectedTrialDetail(detail);
    } catch (err) {
      console.error('Failed to load trial detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Trial Detail Drawer */}
      <TrialDetailDrawer
        trial={selectedTrialDetail}
        onClose={() => setSelectedTrialDetail(null)}
        targetVariable={currentRun.target_variable}
      />

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>TOTAL HELD-OUT TRIALS</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
            {total_predictions}
          </div>
        </div>

        <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>CORRECT PREDICTIONS</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#34d399', marginTop: '4px' }}>
            {correct_count}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            {(accuracy * 100).toFixed(1)}% of test set
          </span>
        </div>

        <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>MISCLASSIFICATIONS</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f87171', marginTop: '4px' }}>
            {incorrect_count}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            {((incorrect_count / total_predictions) * 100).toFixed(1)}% error rate
          </span>
        </div>

        <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>MODEL SCORE TYPE</span>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#a78bfa', marginTop: '6px' }}>
            {score_type === 'probability' ? 'Posterior Probability' : 'Decision Function Score'}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            {score_type === 'probability' ? 'predict_proba() confidence' : 'Margin distance'}
          </span>
        </div>
      </div>

      {/* Main Table Container */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        {/* Table Filters Header */}
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Trial-Level Prediction Records
              {isLoadingDetail && (
                <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 400 }}>
                  Loading details...
                </span>
              )}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Showing {filteredPredictions.length} of {predictions.length} held-out test predictions.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Status Pills */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#1e293b',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid #334155',
              }}
            >
              <button
                onClick={() => setFilterStatus('all')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: filterStatus === 'all' ? '#7c3aed' : 'transparent',
                  color: filterStatus === 'all' ? '#ffffff' : '#94a3b8',
                }}
              >
                All ({total_predictions})
              </button>
              <button
                onClick={() => setFilterStatus('correct')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: filterStatus === 'correct' ? '#065f46' : 'transparent',
                  color: filterStatus === 'correct' ? '#34d399' : '#94a3b8',
                }}
              >
                Correct ({correct_count})
              </button>
              <button
                onClick={() => setFilterStatus('errors')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: filterStatus === 'errors' ? '#991b1b' : 'transparent',
                  color: filterStatus === 'errors' ? '#f87171' : '#94a3b8',
                }}
              >
                Errors ({incorrect_count})
              </button>
            </div>

            {/* True Class Filter */}
            <select
              value={selectedTrueClass}
              onChange={(e) => setSelectedTrueClass(e.target.value)}
              style={{
                padding: '6px 10px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            >
              <option value="all">All True Classes</option>
              {allClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>

            {/* Search Trial ID */}
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search trial ID..."
                value={searchTrial}
                onChange={(e) => setSearchTrial(e.target.value)}
                style={{
                  padding: '6px 12px 6px 30px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  outline: 'none',
                  width: '140px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Prediction Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '10px 12px' }}>Trial ID</th>
                <th style={{ padding: '10px 12px' }}>True Condition</th>
                <th style={{ padding: '10px 12px' }}>Predicted Condition</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>
                  {score_type === 'probability' ? 'Confidence' : 'Decision Score'}
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPredictions.map((p) => (
                <tr
                  key={p.trial_id}
                  onClick={() => handleInspectTrial(p.trial_id)}
                  style={{
                    borderBottom: '1px solid #1e293b',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#cbd5e1' }}>
                    #{p.trial_id}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{p.true_label}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        fontWeight: 600,
                        color: p.correct ? '#34d399' : '#f87171',
                      }}
                    >
                      {p.predicted_label}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {p.correct ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(52, 211, 153, 0.15)',
                          color: '#34d399',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      >
                        <CheckCircle size={12} /> Correct
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(248, 113, 113, 0.15)',
                          color: '#f87171',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      >
                        <XCircle size={12} /> Misclassified
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#c4b5fd', fontWeight: 600 }}>
                    {p.confidence !== null && p.confidence !== undefined
                      ? `${(p.confidence * 100).toFixed(1)}%`
                      : p.decision_score !== null && p.decision_score !== undefined
                        ? p.decision_score.toFixed(3)
                        : '-'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspectTrial(p.trial_id);
                      }}
                      disabled={isLoadingDetail}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        color: '#c4b5fd',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: isLoadingDetail ? 'wait' : 'pointer',
                        opacity: isLoadingDetail ? 0.7 : 1,
                      }}
                    >
                      <Eye size={12} /> Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
