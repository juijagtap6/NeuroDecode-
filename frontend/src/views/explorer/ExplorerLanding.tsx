import React from 'react';
import { useExplorer } from './ExplorerContext';
import { ProvenanceBadge } from '../../components/ProvenanceBadge';
import {
  Database,
  Activity,
  Layers,
  FileText,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Sliders,
} from 'lucide-react';

export const ExplorerLanding: React.FC = () => {
  const {
    currentSession,
    sessionMetadata,
    selectedSessionId,
    activeProvenance,
    activeSource,
    setActiveSource,
    setSelectedSessionId,
    setActiveSubmodule,
    sessions,
    regions,
    stimuli,
  } = useExplorer();

  // Summary Metrics
  const activeDatasetName =
    activeProvenance === 'user_uploaded'
      ? (sessionMetadata?.extra?.filename as string) || `Custom Upload (${selectedSessionId})`
      : `Allen Neuropixels Visual Coding (Session ${selectedSessionId})`;

  const datasetSourceLabel =
    activeProvenance === 'user_uploaded'
      ? 'User CSV Ingestion (In-Memory Canonical)'
      : 'Allen Brain Observatory (Neuropixels)';

  const totalNeurons = sessionMetadata?.total_units || currentSession?.unit_count || 120;
  const totalTrials = sessionMetadata?.total_trials || currentSession?.total_trials || 52;
  const regionCount = regions.length || sessionMetadata?.available_brain_regions?.length || 6;
  const stimulusCount = stimuli.length || sessionMetadata?.available_stimuli?.length || 3;
  const recordingDuration = sessionMetadata?.duration_sec
    ? `${sessionMetadata.duration_sec.toFixed(1)} s`
    : '130.0 s';
  const datasetStatus = currentSession?.data_status || 'Ready';

  // Submodule navigation cards
  const submodules = [
    {
      id: 'dataset-browser' as const,
      title: '1. Dataset Browser',
      description:
        'Manage and select experimental sessions, switch between Allen Neuropixels and User Upload modes, apply brain region and stimulus filters, and upload custom neural CSV files.',
      icon: <Database size={24} color="#38bdf8" />,
      accentColor: '#38bdf8',
      buttonText: 'Open Dataset Browser',
    },
    {
      id: 'population-activity' as const,
      title: '2. Population Activity',
      description:
        'Inspect population-level neural state-space trajectories via interactive PCA projections, and evaluate population mean firing rate dynamics and dispersion metrics.',
      icon: <Activity size={24} color="#818cf8" />,
      accentColor: '#818cf8',
      buttonText: 'Explore Population Activity',
    },
    {
      id: 'trial-inspector' as const,
      title: '3. Trial Inspector',
      description:
        'Deep-dive into trial-level electrophysiology with high-resolution firing rate heatmaps (units × time), trial parameter tables, and single-trial activation statistics.',
      icon: <Layers size={24} color="#34d399" />,
      accentColor: '#34d399',
      buttonText: 'Inspect Trials',
    },
    {
      id: 'metadata' as const,
      title: '4. Scientific Metadata',
      description:
        'Authoritative scientific reference center with session provenance, mouse genotype details, recording parameters, anatomical brain structure tables, and schema documentation.',
      icon: <FileText size={24} color="#c084fc" />,
      accentColor: '#c084fc',
      buttonText: 'View Metadata',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. Primary Dataset Overview Hero Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          border: '1px solid #334155',
          borderRadius: '14px',
          padding: '24px 28px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Active Dataset Overview
              </span>
              <ProvenanceBadge provenance={activeProvenance} />
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  color: '#4ade80',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle size={12} /> {datasetStatus}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              {activeDatasetName}
            </h2>
            <p style={{ margin: '6px 0 0 0', color: '#cbd5e1', fontSize: '0.88rem', maxWidth: '780px' }}>
              Currently inspecting <strong>Session {selectedSessionId}</strong> ({datasetSourceLabel}) through the unified Canonical Neural Dataset representation.
            </p>
          </div>

          {/* Quick Submodule Switcher Action */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveSubmodule('dataset-browser')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Sliders size={16} /> Dataset Browser
            </button>
            <button
              onClick={() => setActiveSubmodule('population-activity')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                color: '#f8fafc',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <BarChart3 size={16} /> Population Activity
            </button>
          </div>
        </div>

        {/* 9 Scientific Overview Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px',
            marginTop: '22px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* 1. Active Dataset */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '12px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Active Dataset</span>
            <strong style={{ fontSize: '0.92rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
              {activeProvenance === 'user_uploaded' ? 'User Custom' : 'Allen Neuropixels'}
            </strong>
          </div>

          {/* 2. Dataset Source */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '12px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Dataset Source</span>
            <strong style={{ fontSize: '0.92rem', color: '#38bdf8' }}>
              {activeProvenance === 'user_uploaded' ? 'CSV Ingestion' : 'Brain Observatory'}
            </strong>
          </div>

          {/* 3. Session ID */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '12px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Session ID</span>
            <strong style={{ fontSize: '0.92rem', color: '#facc15' }}>{selectedSessionId}</strong>
          </div>

          {/* 4. Total Neurons */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '12px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Total Neurons</span>
            <strong style={{ fontSize: '0.92rem', color: '#34d399' }}>{totalNeurons.toLocaleString()} units</strong>
          </div>

          {/* 5. Total Trials */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '12px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Total Trials</span>
            <strong style={{ fontSize: '0.92rem', color: '#f8fafc' }}>{totalTrials} trials</strong>
          </div>

          {/* 6. Brain Region Count */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '12px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Brain Regions</span>
            <strong style={{ fontSize: '0.92rem', color: '#818cf8' }}>{regionCount} structures</strong>
          </div>

          {/* 7. Available Stimuli */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '12px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Visual Stimuli</span>
            <strong style={{ fontSize: '0.92rem', color: '#f472b6' }}>{stimulusCount} protocols</strong>
          </div>

          {/* 8. Recording Duration */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '12px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Duration</span>
            <strong style={{ fontSize: '0.92rem', color: '#f8fafc' }}>{recordingDuration}</strong>
          </div>

          {/* 9. Dataset Status */}
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '12px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Dataset Status</span>
            <strong style={{ fontSize: '0.92rem', color: '#4ade80' }}>Canonical {datasetStatus}</strong>
          </div>
        </div>
      </div>

      {/* 2. Submodule Exploration Cards Grid (The 4 Defined Submodules) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              Explorer Submodules
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Navigate to specialized scientific workspaces for dataset selection, population trajectories, single trials, or reference metadata.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {submodules.map((sub) => (
            <div
              key={sub.id}
              onClick={() => setActiveSubmodule(sub.id)}
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = sub.accentColor;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1e293b';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: `${sub.accentColor}18`,
                      border: `1px solid ${sub.accentColor}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {sub.icon}
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                    {sub.title}
                  </h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.45' }}>
                  {sub.description}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: sub.accentColor,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginTop: '18px',
                  paddingTop: '12px',
                  borderTop: '1px solid #1e293b',
                }}
              >
                <span>{sub.buttonText}</span>
                <ArrowRight size={15} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Quick Sessions Directory Preview */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '20px 24px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              Available Exploration Sessions ({sessions.length})
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Click any session to immediately switch the active recording across all Explorer submodules.
            </p>
          </div>

          {/* Quick source filter toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#020617',
              padding: '3px',
              borderRadius: '7px',
              border: '1px solid #1e293b',
            }}
          >
            <button
              onClick={() => setActiveSource('allen')}
              style={{
                padding: '4px 12px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: activeSource === 'allen' ? '#1e293b' : 'transparent',
                color: activeSource === 'allen' ? '#38bdf8' : '#94a3b8',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Allen Datasets
            </button>
            <button
              onClick={() => setActiveSource('upload')}
              style={{
                padding: '4px 12px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: activeSource === 'upload' ? '#1e293b' : 'transparent',
                color: activeSource === 'upload' ? '#c084fc' : '#94a3b8',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              User Uploads
            </button>
          </div>
        </div>

        {/* Sessions Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '8px 12px' }}>Session ID</th>
                <th style={{ padding: '8px 12px' }}>Provenance</th>
                <th style={{ padding: '8px 12px' }}>Genotype / Specimen</th>
                <th style={{ padding: '8px 12px' }}>Units</th>
                <th style={{ padding: '8px 12px' }}>Trials</th>
                <th style={{ padding: '8px 12px' }}>Recorded Structures</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions
                .filter((s) => (activeSource === 'upload' ? s.provenance === 'user_uploaded' : s.provenance === 'allen_experimental'))
                .map((s) => {
                  const isSelected = String(s.session_id) === String(selectedSessionId);
                  return (
                    <tr
                      key={String(s.session_id)}
                      style={{
                        borderBottom: '1px solid #1e293b',
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                        {s.session_id}
                        {isSelected && (
                          <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#38bdf8' }}>● Active</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <ProvenanceBadge provenance={s.provenance} />
                      </td>
                      <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>
                        {s.genotype?.split(';')[0] || 'wildtype'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#f8fafc', fontWeight: 600 }}>
                        {s.unit_count}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>
                        {s.total_trials}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                        {s.available_brain_regions?.slice(0, 5).join(', ')}
                        {(s.available_brain_regions?.length || 0) > 5 ? ` +${s.available_brain_regions.length - 5}` : ''}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        {isSelected ? (
                          <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>
                            Loaded
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedSessionId(String(s.session_id))}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              color: '#cbd5e1',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            Load Session
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
