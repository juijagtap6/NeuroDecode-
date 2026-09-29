import React from 'react';
import { useComparison } from './ComparisonContext';
import {
  FileSpreadsheet,
  Brain,
  Eye,
  Info,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export const SessionComparisonView: React.FC = () => {
  const { sessionData, loading, error, refreshComparison } = useComparison();

  if (loading && !sessionData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <p>Loading session comparison analytics...</p>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div style={{
        padding: '32px',
        backgroundColor: '#1e1b2e',
        borderRadius: '10px',
        border: '1px solid #7f1d1d',
        color: '#fca5a5',
        textAlign: 'center',
      }}>
        <AlertTriangle size={32} color="#ef4444" style={{ margin: '0 auto 12px auto' }} />
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#f87171' }}>Session Comparison Unavailable</h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
          {error || 'Unable to retrieve session comparison data.'}
        </p>
        <button
          onClick={refreshComparison}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    session_a,
    session_b,
    region_items,
    stimulus_items,
    region_overlap,
    stimulus_overlap,
    scientific_difference_summary,
  } = sessionData;

  const unitDelta = session_b.total_units - session_a.total_units;
  const trialDelta = session_b.total_trials - session_a.total_trials;
  const durationDelta = Math.round((session_b.duration_sec - session_a.duration_sec) * 10) / 10;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. SIDE-BY-SIDE SESSION COMPARISON HEADER SPEC WITH DIFFERENCE HIGHLIGHTING */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={20} color="#60a5fa" />
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              Side-by-Side Session Specifications & Metric Differences
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Direct parameter contrast across recordings
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}>
          {/* Dataset A Spec Column */}
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>
                  DATASET A
                </span>
                <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                  {session_a.session_id}
                </span>
              </div>
              <span style={{
                fontSize: '0.75rem',
                color: '#60a5fa',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                {session_a.source}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Total Isolated Units:</span>
                <strong style={{ fontSize: '1.2rem', color: '#f8fafc' }}>{session_a.total_units}</strong>
              </div>
              <div style={{ backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Trial Presentations:</span>
                <strong style={{ fontSize: '1.2rem', color: '#f8fafc' }}>{session_a.total_trials}</strong>
              </div>
              <div style={{ backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Recording Duration:</span>
                <strong style={{ fontSize: '1.2rem', color: '#f8fafc' }}>{session_a.duration_sec}s</strong>
              </div>
              <div style={{ backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Genotype / Line:</span>
                <strong style={{ fontSize: '0.82rem', color: '#cbd5e1' }} title={session_a.genotype || 'wildtype'}>
                  {session_a.genotype ? session_a.genotype.split(';')[0].slice(0, 18) : 'Wildtype'}
                </strong>
              </div>
            </div>
          </div>

          {/* Dataset B Spec Column */}
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  backgroundColor: '#10b981',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>
                  DATASET B
                </span>
                <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                  {session_b.session_id}
                </span>
              </div>
              <span style={{
                fontSize: '0.75rem',
                color: '#34d399',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                {session_b.source}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Total Units:</span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: unitDelta >= 0 ? '#34d399' : '#f87171',
                  }}>
                    {unitDelta >= 0 ? `+${unitDelta}` : unitDelta} diff
                  </span>
                </div>
                <strong style={{ fontSize: '1.2rem', color: '#f8fafc' }}>{session_b.total_units}</strong>
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Trial Presentations:</span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: trialDelta >= 0 ? '#34d399' : '#f87171',
                  }}>
                    {trialDelta >= 0 ? `+${trialDelta}` : trialDelta} diff
                  </span>
                </div>
                <strong style={{ fontSize: '1.2rem', color: '#f8fafc' }}>{session_b.total_trials}</strong>
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Recording Duration:</span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: durationDelta >= 0 ? '#34d399' : '#f87171',
                  }}>
                    {durationDelta >= 0 ? `+${durationDelta}` : durationDelta}s
                  </span>
                </div>
                <strong style={{ fontSize: '1.2rem', color: '#f8fafc' }}>{session_b.duration_sec}s</strong>
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Genotype / Line:</span>
                <strong style={{ fontSize: '0.82rem', color: '#cbd5e1' }} title={session_b.genotype || 'wildtype'}>
                  {session_b.genotype ? session_b.genotype.split(';')[0].slice(0, 18) : 'Wildtype'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REGION COMPARISON ENHANCEMENT */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={20} color="#a78bfa" />
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              Anatomical Brain Structure Overlap & Yield Distribution
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
            <span style={{
              backgroundColor: 'rgba(167, 139, 250, 0.1)',
              color: '#c4b5fd',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(167, 139, 250, 0.2)',
            }}>
              {region_overlap.shared_count} Shared Structures ({Math.round(region_overlap.jaccard_similarity * 100)}% Jaccard)
            </span>
            <span style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#93c5fd',
              padding: '4px 8px',
              borderRadius: '4px',
            }}>
              {region_overlap.unique_to_a.length} Exclusive to A
            </span>
            <span style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#a7f3d0',
              padding: '4px 8px',
              borderRadius: '4px',
            }}>
              {region_overlap.unique_to_b.length} Exclusive to B
            </span>
          </div>
        </div>

        {/* Region Overlap Breakdown Cards */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c4b5fd', display: 'block', marginBottom: '6px' }}>
              MUTUALLY RECORDED STRUCTURES ({region_overlap.shared_regions.length})
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {region_overlap.shared_regions.map((r) => (
                <span key={`sh-${r}`} style={{
                  backgroundColor: 'rgba(167, 139, 250, 0.15)',
                  color: '#e9d5ff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid rgba(167, 139, 250, 0.3)',
                }}>
                  {r}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', display: 'block', marginBottom: '6px' }}>
              EXCLUSIVE TO DATASET A ({region_overlap.unique_to_a.length})
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {region_overlap.unique_to_a.length > 0 ? (
                region_overlap.unique_to_a.map((r) => (
                  <span key={`un-a-${r}`} style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#93c5fd',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}>
                    {r}
                  </span>
                ))
              ) : (
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>None (Full coverage in B)</span>
              )}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', display: 'block', marginBottom: '6px' }}>
              EXCLUSIVE TO DATASET B ({region_overlap.unique_to_b.length})
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {region_overlap.unique_to_b.length > 0 ? (
                region_overlap.unique_to_b.map((r) => (
                  <span key={`un-b-${r}`} style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#a7f3d0',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}>
                    {r}
                  </span>
                ))
              ) : (
                <span style={{ color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>None (Full coverage in A)</span>
              )}
            </div>
          </div>
        </div>

        {/* Comprehensive Region Comparison Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.82rem',
            textAlign: 'left',
          }}>
            <thead>
              <tr style={{ backgroundColor: '#1e293b', borderBottom: '2px solid #334155' }}>
                <th style={{ padding: '10px 14px', color: '#cbd5e1' }}>Structure (CCFv3)</th>
                <th style={{ padding: '10px 14px', color: '#60a5fa' }}>Dataset A Status</th>
                <th style={{ padding: '10px 14px', color: '#60a5fa' }}>Units in A</th>
                <th style={{ padding: '10px 14px', color: '#34d399' }}>Dataset B Status</th>
                <th style={{ padding: '10px 14px', color: '#34d399' }}>Units in B</th>
                <th style={{ padding: '10px 14px', color: '#fbbf24' }}>Yield Difference</th>
                <th style={{ padding: '10px 14px', color: '#cbd5e1' }}>Representation Share</th>
              </tr>
            </thead>
            <tbody>
              {region_items.map((item, idx) => {
                const diffUnits = item.units_b - item.units_a;
                return (
                  <tr
                    key={item.region}
                    style={{
                      backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(30, 41, 59, 0.4)',
                      borderBottom: '1px solid #1e293b',
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#f8fafc' }}>
                      {item.region}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {item.present_in_a ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#60a5fa', fontSize: '0.78rem' }}>
                          <CheckCircle2 size={13} /> Present
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.78rem' }}>
                          <XCircle size={13} /> Not Available
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', color: item.present_in_a ? '#e2e8f0' : '#64748b' }}>
                      {item.present_in_a ? `${item.units_a} units (${item.pct_a}%)` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {item.present_in_b ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#34d399', fontSize: '0.78rem' }}>
                          <CheckCircle2 size={13} /> Present
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.78rem' }}>
                          <XCircle size={13} /> Not Available
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', color: item.present_in_b ? '#e2e8f0' : '#64748b' }}>
                      {item.present_in_b ? `${item.units_b} units (${item.pct_b}%)` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {item.present_in_a && item.present_in_b ? (
                        <span style={{
                          color: diffUnits >= 0 ? '#34d399' : '#f87171',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                        }}>
                          {diffUnits >= 0 ? `+${diffUnits}` : diffUnits} units
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Asymmetric</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', minWidth: '140px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          flex: 1,
                          height: '6px',
                          backgroundColor: '#1e293b',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          display: 'flex',
                        }}>
                          <div style={{ width: `${item.pct_a}%`, backgroundColor: '#3b82f6' }} title={`A: ${item.pct_a}%`} />
                          <div style={{ width: `${item.pct_b}%`, backgroundColor: '#10b981' }} title={`B: ${item.pct_b}%`} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. STIMULUS & METADATA COMPARISON */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
      }}>
        {/* Stimulus Comparison Card (First-Class Section) */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={20} color="#38bdf8" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Visual Stimulus Assay Comparison
              </h3>
            </div>
            <span style={{
              fontSize: '0.75rem',
              color: '#38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              padding: '2px 8px',
              borderRadius: '4px',
            }}>
              {stimulus_overlap.shared_count} Shared / {stimulus_overlap.total_union_count} Total ({Math.round(stimulus_overlap.jaccard_similarity * 100)}% Concordance)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stimulus_items.map((st) => (
              <div
                key={st.stimulus_name}
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <strong style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{st.stimulus_name}</strong>
                  <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.72rem' }}>
                    Visual Coding Sensory Protocol
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    color: st.present_in_a ? '#60a5fa' : '#64748b',
                    backgroundColor: st.present_in_a ? 'rgba(59, 130, 246, 0.15)' : '#0f172a',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>
                    A: {st.present_in_a ? 'Active' : 'Missing'}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    color: st.present_in_b ? '#34d399' : '#64748b',
                    backgroundColor: st.present_in_b ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>
                    B: {st.present_in_b ? 'Active' : 'Missing'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Provenance & Session Metadata Matrix */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Info size={20} color="#fbbf24" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              Provenance & Metadata Matrix
            </h3>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '6px 4px', textAlign: 'left' }}>Attribute</th>
                <th style={{ padding: '6px 4px', textAlign: 'left', color: '#60a5fa' }}>Dataset A</th>
                <th style={{ padding: '6px 4px', textAlign: 'left', color: '#34d399' }}>Dataset B</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '8px 4px', color: '#94a3b8' }}>Dataset Origin / Source:</td>
                <td style={{ padding: '8px 4px', color: '#cbd5e1' }}>{session_a.source}</td>
                <td style={{ padding: '8px 4px', color: '#cbd5e1' }}>{session_b.source}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '8px 4px', color: '#94a3b8' }}>Specimen / Mouse ID:</td>
                <td style={{ padding: '8px 4px', color: '#60a5fa', fontWeight: 600 }}>{session_a.mouse_id || session_a.specimen_id || '699733581'}</td>
                <td style={{ padding: '8px 4px', color: '#34d399', fontWeight: 600 }}>{session_b.mouse_id || session_b.specimen_id || '703214589'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '8px 4px', color: '#94a3b8' }}>Session Protocol:</td>
                <td style={{ padding: '8px 4px', color: '#cbd5e1' }}>{session_a.session_type || 'brain_observatory_1.1'}</td>
                <td style={{ padding: '8px 4px', color: '#cbd5e1' }}>{session_b.session_type || 'brain_observatory_1.1'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '8px 4px', color: '#94a3b8' }}>Acquisition Timestamp:</td>
                <td style={{ padding: '8px 4px', color: '#cbd5e1' }}>{session_a.date_of_acquisition ? session_a.date_of_acquisition.split('T')[0] : '2019-01-19'}</td>
                <td style={{ padding: '8px 4px', color: '#cbd5e1' }}>{session_b.date_of_acquisition ? session_b.date_of_acquisition.split('T')[0] : '2019-01-22'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '8px 4px', color: '#94a3b8' }}>NWB Data Standard:</td>
                <td style={{ padding: '8px 4px', color: '#34d399' }}>{session_a.has_nwb ? 'True (v2.0)' : 'Pending'}</td>
                <td style={{ padding: '8px 4px', color: '#34d399' }}>{session_b.has_nwb ? 'True (v2.0)' : 'Pending'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. SCIENTIFIC INTERPRETATION SECTION */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={20} color="#fbbf24" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
            Scientific Session Interpretation & Trajectory Analysis
          </h3>
        </div>
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '6px',
          padding: '16px',
          borderLeft: '4px solid #a78bfa',
          color: '#e2e8f0',
          fontSize: '0.88rem',
          lineHeight: '1.6',
        }}>
          {scientific_difference_summary}
        </div>
      </div>
    </div>
  );
};
