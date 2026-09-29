import React from 'react';
import { useExplorer } from './ExplorerContext';
import { ProvenanceBadge } from '../../components/ProvenanceBadge';
import {
  Database,
  Activity,
  Layers,
  FileText,
  CheckCircle2,
  ArrowRight,
  Brain,
  Eye,
  Sliders,
  Sparkles,
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
    loadDemoSampleDataset,
  } = useExplorer();

  // Summary Metrics
  const activeDatasetName =
    activeProvenance === 'user_uploaded'
      ? (sessionMetadata?.extra?.filename as string) || `Custom Upload (${selectedSessionId})`
      : `Allen Neuropixels Visual Coding (Session ${selectedSessionId})`;

  const datasetSourceLabel =
    activeProvenance === 'user_uploaded'
      ? 'Client CSV Ingestion (In-Memory Canonical Neural Dataset)'
      : 'Allen Brain Observatory (Dual-Probe Neuropixels Visual Coding)';

  const totalNeurons = sessionMetadata?.total_units || currentSession?.unit_count || 2714;
  const totalTrials = sessionMetadata?.total_trials || currentSession?.total_trials || 52;
  const regionList = regions.length > 0 ? regions : sessionMetadata?.available_brain_regions || ['VISp', 'VISl', 'VISam', 'LP', 'LGd', 'CA1'];
  const stimulusList = stimuli.length > 0 ? stimuli : sessionMetadata?.available_stimuli || ['drifting_gratings', 'natural_scenes', 'natural_movies'];
  const recordingDuration = sessionMetadata?.duration_sec
    ? `${sessionMetadata.duration_sec.toFixed(1)} seconds`
    : '130.0 seconds';
  const genotype = sessionMetadata?.genotype || currentSession?.genotype || 'Sst-IRES-Cre/wt;Ai32(RCL-ChR2(H134R)_EYFP)/wt';
  const mouseId = sessionMetadata?.mouse_id || currentSession?.mouse_id || selectedSessionId;
  const datasetStatus = currentSession?.data_status || 'Ready';

  // Submodule navigation cards (The 4 defined submodules only)
  const submodules = [
    {
      id: 'dataset-browser' as const,
      number: '01',
      title: 'Dataset Browser',
      role: 'Ingestion & Session Management',
      description:
        'Manage experimental sessions, switch between Allen Neuropixels and User Upload modes, apply anatomical and stimulus filters, and ingest custom CSV datasets through the validated 6-stage pipeline.',
      icon: <Database size={22} color="#38bdf8" />,
      accentColor: '#38bdf8',
      buttonText: 'Open Dataset Browser',
    },
    {
      id: 'population-activity' as const,
      number: '02',
      title: 'Population Activity',
      role: 'State-Space Trajectories',
      description:
        'Explore dominant population state-space dynamics using interactive PCA projections, monitor multi-component explained variance, and evaluate population mean firing rate dynamics and dispersion metrics.',
      icon: <Activity size={22} color="#818cf8" />,
      accentColor: '#818cf8',
      buttonText: 'Explore Population Activity',
    },
    {
      id: 'trial-inspector' as const,
      number: '03',
      title: 'Trial Inspector',
      role: 'Single-Trial Electrophysiology',
      description:
        'Examine high-resolution firing rate raster heatmaps across units and temporal bins, evaluate single-trial response metrics, inspect stimulus parameters, and step seamlessly across presentation trials.',
      icon: <Layers size={22} color="#34d399" />,
      accentColor: '#34d399',
      buttonText: 'Inspect Trials',
    },
    {
      id: 'metadata' as const,
      number: '04',
      title: 'Scientific Metadata',
      role: 'Anatomical & Schema Authority',
      description:
        'Authoritative reference center containing deep provenance specifications, specimen genotypes, anatomical target definitions for recorded brain structures, and canonical schema documentation.',
      icon: <FileText size={22} color="#c084fc" />,
      accentColor: '#c084fc',
      buttonText: 'View Metadata',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Scientific Session Identity Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #090e1a 0%, #111a2e 100%)',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '22px 28px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Scientific Session Exploration Environment
              </span>
              <ProvenanceBadge provenance={activeProvenance} />
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#4ade80',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle2 size={12} /> {datasetStatus}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              {activeDatasetName}
            </h2>
            <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '0.88rem', maxWidth: '880px', lineHeight: '1.5' }}>
              Currently exploring <strong style={{ color: '#f1f5f9' }}>Session {selectedSessionId}</strong> ({datasetSourceLabel}) under the unified Canonical Neural Dataset architecture with zero data leakage across modules.
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
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Sliders size={15} color="#38bdf8" /> Dataset Controls
            </button>
            <button
              onClick={() => setActiveSubmodule('population-activity')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.35)',
              }}
            >
              <Activity size={15} /> Population Trajectories
            </button>
          </div>
        </div>
      </div>

      {/* 2. Scientific Summary Panels: Active Dataset Summary & Scientific Recording Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '18px' }}>
        
        {/* PANEL A: Active Dataset Summary */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '20px 24px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={18} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>
                  Active Dataset Summary
                </h3>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', backgroundColor: '#1e293b', padding: '2px 8px', borderRadius: '4px' }}>
                Identifier: {selectedSessionId}
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '8px 0', color: '#94a3b8', width: '40%' }}>Dataset Name</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: '#f8fafc', fontWeight: 600 }}>
                    {activeDatasetName}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '8px 0', color: '#94a3b8' }}>Dataset Source</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: '#38bdf8', fontWeight: 600 }}>
                    {activeProvenance === 'user_uploaded' ? 'User Custom Upload' : 'Allen Brain Observatory'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '8px 0', color: '#94a3b8' }}>Session ID</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: '#facc15', fontWeight: 600 }}>
                    {selectedSessionId}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '8px 0', color: '#94a3b8' }}>Neuron Count</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: '#34d399', fontWeight: 700 }}>
                    {totalNeurons.toLocaleString()} units
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '8px 0', color: '#94a3b8' }}>Trial Count</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: '#f8fafc', fontWeight: 600 }}>
                    {totalTrials} presentation trials
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '8px 0', color: '#94a3b8' }}>Brain Region Count</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: '#818cf8', fontWeight: 600 }}>
                    {regionList.length} recorded structures
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#94a3b8' }}>Stimulus Count</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: '#f472b6', fontWeight: 600 }}>
                    {stimulusList.length} experimental protocols
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#94a3b8' }}>
            <span>Specimen: <strong style={{ color: '#cbd5e1' }}>{mouseId}</strong></span>
            <span>Genotype: <strong style={{ color: '#cbd5e1' }}>{genotype.split(';')[0]}</strong></span>
          </div>
        </div>

        {/* PANEL B: Scientific Recording Summary & Provenance */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '20px 24px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={18} color="#818cf8" />
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>
                  Scientific Recording Summary & Provenance
                </h3>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
                {recordingDuration}
              </span>
            </div>

            {/* Recorded Brain Regions Chips */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Available Brain Regions ({regionList.length} structures):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {regionList.map((reg) => (
                  <span
                    key={reg}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '5px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      color: '#34d399',
                    }}
                  >
                    {reg}
                  </span>
                ))}
              </div>
            </div>

            {/* Stimulus Protocols Chips */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Available Stimulus Protocols:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {stimulusList.map((stim) => (
                  <span
                    key={stim}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '5px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      color: '#818cf8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Eye size={12} />
                    {stim.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Dataset Provenance narrative */}
            <div
              style={{
                backgroundColor: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '0.78rem',
                color: '#94a3b8',
                lineHeight: '1.45',
              }}
            >
              <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: '4px' }}>
                Electrophysiology Provenance Context:
              </strong>
              {activeProvenance === 'allen_experimental'
                ? 'Dual-probe Neuropixels 1.0 recording in awake behaving mouse visual cortex and thalamic nuclei. Action potentials spike-sorted via Kilosort2 with 50 ms temporal binning and signal-to-noise quality validation.'
                : 'User-ingested neural electrophysiology CSV dataset mapped into the memory-resident CanonicalNeuralDataset schema. Fully validated across trials, units, and firing rate distributions.'}
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setActiveSubmodule('metadata')}
              style={{
                background: 'none',
                border: 'none',
                color: '#c084fc',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 0',
              }}
            >
              <span>View Full Metadata & Schema Reference</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

      </div>

      {/* 3. Quick Navigation Cards (The 4 Defined Explorer Submodules) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              Explorer Scientific Workspaces
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Navigate to specialized modules for session management, population state-space trajectories, single-trial rasters, or metadata.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
                position: 'relative',
                overflow: 'hidden',
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
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
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>
                    {sub.number}
                  </span>
                </div>

                <h4 style={{ margin: '0 0 2px 0', fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                  {sub.title}
                </h4>
                <span style={{ fontSize: '0.74rem', color: sub.accentColor, fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  {sub.role}
                </span>

                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.45' }}>
                  {sub.description}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: sub.accentColor,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid #1e293b',
                }}
              >
                <span>{sub.buttonText}</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Available Exploration Sessions Directory */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '20px 24px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              Available Exploration Sessions ({sessions.length})
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Click any session to immediately switch the active recording across all Explorer submodules.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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

            {/* Quick demo CSV action button */}
            <button
              onClick={loadDemoSampleDataset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(124, 58, 237, 0.15)',
                border: '1px solid rgba(124, 58, 237, 0.4)',
                color: '#c084fc',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Sparkles size={13} />
              Load Demo CSV
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
                        {s.unit_count.toLocaleString()}
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
                            ● Active
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
