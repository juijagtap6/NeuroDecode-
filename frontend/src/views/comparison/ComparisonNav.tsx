import React from 'react';
import { useComparison, ComparisonSubmodule } from './ComparisonContext';
import {
  Layers,
  FileSpreadsheet,
  Activity,
  RotateCw,
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const ComparisonNav: React.FC = () => {
  const {
    sourceA,
    sourceB,
    sessionAId,
    sessionBId,
    availableSessions,
    activeSubmodule,
    overviewData,
    loading,
    error,
    lastUpdated,
    setSourceA,
    setSourceB,
    setSessionAId,
    setSessionBId,
    swapSessions,
    setActiveSubmodule,
    refreshComparison,
  } = useComparison();

  const sessionAInfo = availableSessions.find((s) => String(s.session_id) === String(sessionAId));
  const sessionBInfo = availableSessions.find((s) => String(s.session_id) === String(sessionBId));

  const sessionsForA = availableSessions.filter((s) => s.source === sourceA);
  const sessionsForB = availableSessions.filter((s) => s.source === sourceB);

  const submodules: { id: ComparisonSubmodule; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Layers size={16} />,
      desc: 'High-level difference dashboard & key findings',
    },
    {
      id: 'session-comparison',
      label: 'Session Comparison',
      icon: <FileSpreadsheet size={16} />,
      desc: 'Anatomical structures, stimuli, & metadata diffs',
    },
    {
      id: 'population-comparison',
      label: 'Population Comparison',
      icon: <Activity size={16} />,
      desc: 'Enlarged PCA trajectories & firing rate dynamics',
    },
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Top Header & Overview Context */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
          }}>
            <Activity size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Comparison Module
            </h1>
            <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Comparative neuroscience workspace evaluating neural populations, anatomical targeting, and dynamic manifolds.
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={swapSessions}
            disabled={loading}
            title="Swap Dataset A and Dataset B"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#cbd5e1',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeftRight size={14} color="#60a5fa" />
            <span>Swap Datasets</span>
          </button>

          <button
            onClick={refreshComparison}
            disabled={loading}
            title="Re-run comparative calculations"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#cbd5e1',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCw size={14} className={loading ? 'spin' : ''} color="#34d399" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Persistent Global Comparison Context Bar */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
      }}>
        {/* Left: Dataset A & B Side-by-Side Context with Source Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Dataset A Context Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            padding: '6px 12px',
            borderRadius: '6px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
            }} />
            
            {/* Source Badge Toggle A */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#0b0f17', padding: '2px', borderRadius: '4px' }}>
              <button
                onClick={() => setSourceA('allen_experimental')}
                style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: 'none',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: sourceA === 'allen_experimental' ? '#3b82f6' : 'transparent',
                  color: sourceA === 'allen_experimental' ? '#fff' : '#64748b',
                }}
              >
                Allen
              </button>
              <button
                onClick={() => setSourceA('user_upload')}
                style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: 'none',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: sourceA === 'user_upload' ? '#8b5cf6' : 'transparent',
                  color: sourceA === 'user_upload' ? '#fff' : '#64748b',
                }}
              >
                Upload
              </button>
            </div>

            <select
              value={String(sessionAId)}
              onChange={(e) => setSessionAId(e.target.value)}
              disabled={loading}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                maxWidth: '180px',
              }}
            >
              {sessionsForA.length > 0 ? (
                sessionsForA.map((s) => (
                  <option key={`nav-a-${s.session_id}`} value={String(s.session_id)} style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>
                    {String(s.session_id).slice(0, 16)} ({s.unit_count}u, 52t)
                  </option>
                ))
              ) : (
                availableSessions.map((s) => (
                  <option key={`nav-a-all-${s.session_id}`} value={String(s.session_id)} style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>
                    {String(s.session_id).slice(0, 16)} ({s.unit_count}u)
                  </option>
                ))
              )}
            </select>

            <span style={{
              fontSize: '0.72rem',
              color: '#93c5fd',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}>
              {overviewData ? `${overviewData.dataset_a.total_units}u` : `${sessionAInfo?.unit_count || 0}u`}
            </span>
          </div>

          <div style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: '#64748b',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            letterSpacing: '0.05em',
          }}>
            VS
          </div>

          {/* Dataset B Context Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            padding: '6px 12px',
            borderRadius: '6px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
            }} />

            {/* Source Badge Toggle B */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#0b0f17', padding: '2px', borderRadius: '4px' }}>
              <button
                onClick={() => setSourceB('allen_experimental')}
                style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: 'none',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: sourceB === 'allen_experimental' ? '#10b981' : 'transparent',
                  color: sourceB === 'allen_experimental' ? '#fff' : '#64748b',
                }}
              >
                Allen
              </button>
              <button
                onClick={() => setSourceB('user_upload')}
                style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: 'none',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: sourceB === 'user_upload' ? '#8b5cf6' : 'transparent',
                  color: sourceB === 'user_upload' ? '#fff' : '#64748b',
                }}
              >
                Upload
              </button>
            </div>

            <select
              value={String(sessionBId)}
              onChange={(e) => setSessionBId(e.target.value)}
              disabled={loading}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                maxWidth: '180px',
              }}
            >
              {sessionsForB.length > 0 ? (
                sessionsForB.map((s) => (
                  <option key={`nav-b-${s.session_id}`} value={String(s.session_id)} style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>
                    {String(s.session_id).slice(0, 16)} ({s.unit_count}u, 52t)
                  </option>
                ))
              ) : (
                availableSessions.map((s) => (
                  <option key={`nav-b-all-${s.session_id}`} value={String(s.session_id)} style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>
                    {String(s.session_id).slice(0, 16)} ({s.unit_count}u)
                  </option>
                ))
              )}
            </select>

            <span style={{
              fontSize: '0.72rem',
              color: '#a7f3d0',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}>
              {overviewData ? `${overviewData.dataset_b.total_units}u` : `${sessionBInfo?.unit_count || 0}u`}
            </span>
          </div>
        </div>

        {/* Right: Synchronization Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#38bdf8',
              fontSize: '0.78rem',
              fontWeight: 500,
            }}>
              <Loader2 size={14} className="spin" />
              <span>Computing Dynamics...</span>
            </div>
          ) : error ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#f87171',
              fontSize: '0.78rem',
              fontWeight: 500,
            }}>
              <AlertCircle size={14} />
              <span>Calculation Failure</span>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#34d399',
              fontSize: '0.78rem',
              fontWeight: 500,
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}>
              <CheckCircle2 size={13} />
              <span>
                Synchronized {lastUpdated ? `(${lastUpdated})` : ''} — {overviewData ? `${overviewData.region_overlap.shared_count} Co-Sampled Regions` : 'Active'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Submodule Navigation Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginTop: '16px',
      }}>
        {submodules.map((sub) => {
          const isActive = activeSubmodule === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubmodule(sub.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: isActive ? 'rgba(59, 130, 246, 0.12)' : '#0f172a',
                border: isActive ? '1px solid #3b82f6' : '1px solid #1e293b',
                color: isActive ? '#f8fafc' : '#94a3b8',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: isActive ? '#60a5fa' : '#cbd5e1',
                fontWeight: 600,
                fontSize: '0.9rem',
                marginBottom: '4px',
              }}>
                {sub.icon}
                <span>{sub.label}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: isActive ? '#93c5fd' : '#64748b' }}>
                {sub.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
