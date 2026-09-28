import React from 'react';
import { useExplorer, ExplorerSubmodule } from './ExplorerContext';
import { ProvenanceBadge } from '../../components/ProvenanceBadge';
import {
  Compass,
  Database,
  Activity,
  Layers,
  FileText,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

export const ExplorerNav: React.FC = () => {
  const {
    activeSubmodule,
    setActiveSubmodule,
    selectedSessionId,
    activeProvenance,
    currentSession,
    isRefreshing,
    refreshAll,
    loadDemoSampleDataset,
    globalError,
    setGlobalError,
    uploadStatus,
    dismissUploadStatus,
  } = useExplorer();

  const navItems: { id: ExplorerSubmodule; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Compass size={17} />,
    },
    {
      id: 'dataset-browser',
      label: 'Dataset Browser',
      icon: <Database size={17} />,
      badge: currentSession ? `${currentSession.unit_count} units` : undefined,
    },
    {
      id: 'population-activity',
      label: 'Population Activity',
      icon: <Activity size={17} />,
    },
    {
      id: 'trial-inspector',
      label: 'Trial Inspector',
      icon: <Layers size={17} />,
    },
    {
      id: 'metadata',
      label: 'Metadata',
      icon: <FileText size={17} />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '8px' }}>
      {/* Top Banner: Module Title, Active Session, Provenance, Global Refresh & Demo Actions */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Left: Branding & Active Session */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '9px',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={22} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Explorer
              </h1>
              <ProvenanceBadge provenance={activeProvenance} />
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  backgroundColor: '#1e293b',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                }}
              >
                Active Session: <strong style={{ color: '#38bdf8' }}>{selectedSessionId}</strong>
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
              Authentic Allen Neuropixels electrophysiology and user-uploaded recordings under the Canonical Neural representation.
            </p>
          </div>
        </div>

        {/* Right: Refresh & Demo CSV Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={refreshAll}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 14px',
              borderRadius: '7px',
              backgroundColor: isRefreshing ? '#334155' : '#1e293b',
              border: '1px solid #334155',
              color: isRefreshing ? '#94a3b8' : '#e2e8f0',
              fontSize: '0.8rem',
              cursor: isRefreshing ? 'wait' : 'pointer',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            title="Re-fetch and refresh all active Explorer sessions, visualizations, and metadata"
          >
            <RefreshCw
              size={14}
              style={{
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              }}
            />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={loadDemoSampleDataset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 14px',
              borderRadius: '7px',
              backgroundColor: 'rgba(124, 58, 237, 0.15)',
              border: '1px solid rgba(124, 58, 237, 0.45)',
              color: '#c084fc',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            title="Load a verified sample neural dataset to test User Upload workflows end-to-end"
          >
            <Sparkles size={14} />
            <span>Load Demo CSV</span>
          </button>
        </div>
      </div>

      {/* Explorer Navigation Tabs (4 Submodules + Default Overview) */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '6px 8px',
          overflowX: 'auto',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        {navItems.map((item) => {
          const isActive = activeSubmodule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubmodule(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#f8fafc' : '#94a3b8',
                backgroundColor: isActive ? '#1e293b' : 'transparent',
                outline: isActive ? '1px solid #38bdf8' : 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: isActive ? '#38bdf8' : '#64748b' }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    backgroundColor: isActive ? '#0f172a' : '#1e293b',
                    color: isActive ? '#38bdf8' : '#64748b',
                    border: '1px solid #334155',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Global Error Banner */}
      {globalError && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fca5a5',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#ef4444" />
            <span>{globalError}</span>
          </div>
          <button
            onClick={() => setGlobalError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
              padding: '2px',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload Feedback Success Banner */}
      {uploadStatus.success && (
        <div
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid #22c55e',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#86efac',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#22c55e" />
            <span>{uploadStatus.success}</span>
          </div>
          <button
            onClick={dismissUploadStatus}
            style={{
              background: 'none',
              border: 'none',
              color: '#86efac',
              cursor: 'pointer',
              padding: '2px',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload Feedback Error Banner */}
      {uploadStatus.error && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fca5a5',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#ef4444" />
            <span>{uploadStatus.error}</span>
          </div>
          <button
            onClick={dismissUploadStatus}
            style={{
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
              padding: '2px',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
