import React, { useState } from 'react';
import { useExplorer } from './ExplorerContext';
import { LightweightContextBar } from './LightweightContextBar';
import {
  Database,
  Upload,
  Sliders,
  FileSpreadsheet,
  Download,
  Sparkles,
  Info,
  HelpCircle,
} from 'lucide-react';

export const DatasetBrowserView: React.FC = () => {
  const {
    activeSource,
    setActiveSource,
    sessions,
    displayedSessions,
    selectedSessionId,
    setSelectedSessionId,
    currentSession,
    sessionMetadata,
    activeProvenance,
    regions,
    selectedRegion,
    setSelectedRegion,
    stimuli,
    selectedStimulus,
    setSelectedStimulus,
    selectedTrialId,
    setSelectedTrialId,
    pcaData,
    loadingSessions,
    uploadStatus,
    handleFileUpload,
    loadDemoSampleDataset,
  } = useExplorer();

  const [showSchemaGuide, setShowSchemaGuide] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  // File input change
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
      e.target.value = '';
    }
  };

  // Drag and drop handlers
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  // Download sample CSV template
  const downloadSampleTemplate = () => {
    const templateContent = `trial_id,time,neuron_id,firing_rate,label,region
1,0.00,unit_01,2.4,drifting_gratings_0deg,VISp
1,0.05,unit_01,8.1,drifting_gratings_0deg,VISp
1,0.10,unit_01,24.5,drifting_gratings_0deg,VISp
1,0.15,unit_01,18.2,drifting_gratings_0deg,VISp
1,0.20,unit_01,10.0,drifting_gratings_0deg,VISp
1,0.00,unit_02,1.2,drifting_gratings_0deg,VISp
1,0.05,unit_02,4.5,drifting_gratings_0deg,VISp
1,0.10,unit_02,16.8,drifting_gratings_0deg,VISp
1,0.15,unit_02,12.3,drifting_gratings_0deg,VISp
1,0.20,unit_02,5.1,drifting_gratings_0deg,VISp
2,0.00,unit_01,3.1,drifting_gratings_90deg,VISp
2,0.05,unit_01,5.2,drifting_gratings_90deg,VISp
2,0.10,unit_01,9.0,drifting_gratings_90deg,VISp
2,0.15,unit_01,6.4,drifting_gratings_90deg,VISp
2,0.20,unit_01,3.0,drifting_gratings_90deg,VISp
2,0.00,unit_02,2.0,drifting_gratings_90deg,VISp
2,0.05,unit_02,11.5,drifting_gratings_90deg,VISp
2,0.10,unit_02,29.4,drifting_gratings_90deg,VISp
2,0.15,unit_02,22.0,drifting_gratings_90deg,VISp
2,0.20,unit_02,14.2,drifting_gratings_90deg,VISp`;

    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neurodecode_canonical_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Lightweight context chips
  const activeDatasetName =
    activeProvenance === 'user_uploaded'
      ? (sessionMetadata?.extra?.filename as string) || `Custom Upload (${selectedSessionId})`
      : `Allen Neuropixels (Session ${selectedSessionId})`;

  const unitCount = sessionMetadata?.total_units || currentSession?.unit_count || 120;
  const trialCount = sessionMetadata?.total_trials || currentSession?.total_trials || 52;
  const regionCount = regions.length || sessionMetadata?.available_brain_regions?.length || 6;
  const stimulusCount = stimuli.length || sessionMetadata?.available_stimuli?.length || 3;
  const recordingDuration = sessionMetadata?.duration_sec
    ? `${sessionMetadata.duration_sec.toFixed(1)} s`
    : '130.0 s';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. Lightweight Contextual Bar */}
      <LightweightContextBar
        submoduleTitle="Dataset Browser"
        submoduleSubtitle="Dataset selection, global session controls, and neural CSV ingestion"
        provenance={activeProvenance}
        items={[
          { label: 'Active Dataset', value: activeDatasetName, highlight: true },
          { label: 'Session ID', value: selectedSessionId, accentColor: '#facc15' },
          {
            label: 'Dataset Source',
            value: activeProvenance === 'user_uploaded' ? 'User Upload' : 'Allen Brain Observatory',
            accentColor: '#38bdf8',
          },
          { label: 'Unit Count', value: `${unitCount} units` },
          { label: 'Trial Count', value: `${trialCount} trials` },
        ]}
      />

      {/* 2. Primary Control Center Card */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '20px 24px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1e293b',
            paddingBottom: '14px',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={20} color="#38bdf8" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Dataset & Filter Controls
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Selections made here immediately propagate across Population Activity, Trial Inspector, and Metadata.
              </p>
            </div>
          </div>

          {/* Dataset Source Segmented Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#020617',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #1e293b',
            }}
          >
            <button
              onClick={() => {
                setActiveSource('allen');
                const firstAllen = sessions.find((s) => s.provenance === 'allen_experimental');
                if (firstAllen) {
                  setSelectedSessionId(String(firstAllen.session_id));
                  setSelectedRegion('');
                  setSelectedStimulus('');
                  setSelectedTrialId(1);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeSource === 'allen' ? '#1e293b' : 'transparent',
                color: activeSource === 'allen' ? '#38bdf8' : '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Database size={15} /> Allen Dataset Mode
            </button>
            <button
              onClick={() => {
                setActiveSource('upload');
                const firstUpload = sessions.find((s) => s.provenance === 'user_uploaded');
                if (firstUpload) {
                  setSelectedSessionId(String(firstUpload.session_id));
                  setSelectedRegion('');
                  setSelectedStimulus('');
                  setSelectedTrialId(1);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeSource === 'upload' ? '#1e293b' : 'transparent',
                color: activeSource === 'upload' ? '#c084fc' : '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Upload size={15} /> User Upload Mode
            </button>
          </div>
        </div>

        {/* Form Controls Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          {/* 1. Session Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Session Selector ({displayedSessions.length} available)
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => {
                setSelectedSessionId(e.target.value);
                setSelectedTrialId(1);
              }}
              disabled={loadingSessions || displayedSessions.length === 0}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {displayedSessions.length === 0 ? (
                <option value="">No sessions available for this mode</option>
              ) : (
                displayedSessions.map((s) => (
                  <option key={String(s.session_id)} value={String(s.session_id)}>
                    Session {s.session_id} ({s.unit_count} units - {s.genotype?.split(';')[0] || 'wildtype'})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 2. Brain Region Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Brain Region Filter
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">All Brain Regions ({regions.length})</option>
              {regions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Stimulus Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Stimulus Protocol Filter
            </label>
            <select
              value={selectedStimulus}
              onChange={(e) => setSelectedStimulus(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">All Stimuli ({stimuli.length})</option>
              {stimuli.map((stim) => (
                <option key={stim} value={stim}>
                  {stim.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Trial Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Active Trial Selector
            </label>
            <select
              value={selectedTrialId}
              onChange={(e) => setSelectedTrialId(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {pcaData?.points && pcaData.points.length > 0 ? (
                pcaData.points.map((p) => (
                  <option key={String(p.trial_id)} value={p.trial_id}>
                    Trial {p.trial_id} ({p.stimulus} - {p.label})
                  </option>
                ))
              ) : (
                <option value={1}>Trial 1 (Default)</option>
              )}
            </select>
          </div>
        </div>

        {/* 3. Dataset Summary Section */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #1e293b',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
            Dataset Summary Section
          </span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px',
            }}
          >
            <div style={{ backgroundColor: '#1e293b', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Session ID</span>
              <strong style={{ fontSize: '0.95rem', color: '#facc15' }}>{selectedSessionId}</strong>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Neuron Count</span>
              <strong style={{ fontSize: '0.95rem', color: '#34d399' }}>{unitCount} units</strong>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Trial Count</span>
              <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>{trialCount} trials</strong>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Region Count</span>
              <strong style={{ fontSize: '0.95rem', color: '#818cf8' }}>{regionCount} regions</strong>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Stimulus Count</span>
              <strong style={{ fontSize: '0.95rem', color: '#f472b6' }}>{stimulusCount} stimuli</strong>
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Recording Duration</span>
              <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>{recordingDuration}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Complete User Dataset Workflow & Upload Center */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '22px 26px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={20} color="#c084fc" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                User Dataset Ingestion Workspace
              </h3>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Upload your own neural recording CSV file into the Canonical Neural representation with immediate validation.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowSchemaGuide(!showSchemaGuide)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: showSchemaGuide ? '#334155' : '#1e293b',
                border: '1px solid #475569',
                color: '#cbd5e1',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              <HelpCircle size={14} />
              {showSchemaGuide ? 'Hide Schema Guide' : 'CSV Schema Documentation'}
            </button>

            <button
              onClick={downloadSampleTemplate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                color: '#38bdf8',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <Download size={14} />
              Download Template CSV
            </button>

            <button
              onClick={loadDemoSampleDataset}
              disabled={uploadStatus.loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: 'rgba(124, 58, 237, 0.2)',
                border: '1px solid rgba(124, 58, 237, 0.5)',
                color: '#c084fc',
                fontSize: '0.78rem',
                cursor: uploadStatus.loading ? 'wait' : 'pointer',
                fontWeight: 600,
              }}
            >
              <Sparkles size={14} />
              Load Verified Demo CSV
            </button>
          </div>
        </div>

        {/* Drag-and-Drop / Upload Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? '#38bdf8' : '#334155'}`,
            borderRadius: '10px',
            backgroundColor: dragOver ? 'rgba(56, 189, 248, 0.05)' : '#090d16',
            padding: '30px 20px',
            textAlign: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <FileSpreadsheet size={36} color={dragOver ? '#38bdf8' : '#64748b'} style={{ marginBottom: '10px' }} />
          <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600, color: '#f8fafc' }}>
            {uploadStatus.loading ? 'Validating and Ingesting Neural Dataset...' : 'Select or Drag & Drop Neural CSV File'}
          </h4>
          <p style={{ margin: '4px 0 14px 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Supported format: Standard comma-delimited <strong>.csv</strong> with required columns:{' '}
            <code style={{ color: '#38bdf8', backgroundColor: '#1e293b', padding: '1px 5px', borderRadius: '4px' }}>trial_id</code>,{' '}
            <code style={{ color: '#38bdf8', backgroundColor: '#1e293b', padding: '1px 5px', borderRadius: '4px' }}>time</code>,{' '}
            <code style={{ color: '#38bdf8', backgroundColor: '#1e293b', padding: '1px 5px', borderRadius: '4px' }}>neuron_id</code>,{' '}
            <code style={{ color: '#38bdf8', backgroundColor: '#1e293b', padding: '1px 5px', borderRadius: '4px' }}>firing_rate</code>,{' '}
            <code style={{ color: '#38bdf8', backgroundColor: '#1e293b', padding: '1px 5px', borderRadius: '4px' }}>label</code>
          </p>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 20px',
              borderRadius: '7px',
              backgroundColor: uploadStatus.loading ? '#334155' : '#3b82f6',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: uploadStatus.loading ? 'wait' : 'pointer',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
            }}
          >
            <Upload size={16} />
            <span>{uploadStatus.loading ? 'Ingesting...' : 'Browse CSV File'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={onFileChange}
              disabled={uploadStatus.loading}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* CSV Schema Documentation Accordion / Drawer */}
        {showSchemaGuide && (
          <div
            style={{
              marginTop: '18px',
              backgroundColor: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Info size={16} color="#38bdf8" />
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
                Canonical Neural CSV Specification
              </h4>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '6px 10px' }}>Column</th>
                  <th style={{ padding: '6px 10px' }}>Type</th>
                  <th style={{ padding: '6px 10px' }}>Required?</th>
                  <th style={{ padding: '6px 10px' }}>Description</th>
                  <th style={{ padding: '6px 10px' }}>Example</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '6px 10px', color: '#38bdf8', fontWeight: 600 }}>trial_id</td>
                  <td style={{ padding: '6px 10px', color: '#cbd5e1' }}>Int / String</td>
                  <td style={{ padding: '6px 10px', color: '#4ade80' }}>Yes</td>
                  <td style={{ padding: '6px 10px', color: '#94a3b8' }}>Unique presentation trial index or ID</td>
                  <td style={{ padding: '6px 10px', color: '#facc15' }}>1, 2, "trial_01"</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '6px 10px', color: '#38bdf8', fontWeight: 600 }}>time</td>
                  <td style={{ padding: '6px 10px', color: '#cbd5e1' }}>Float</td>
                  <td style={{ padding: '6px 10px', color: '#4ade80' }}>Yes</td>
                  <td style={{ padding: '6px 10px', color: '#94a3b8' }}>Relative time in seconds from trial onset</td>
                  <td style={{ padding: '6px 10px', color: '#facc15' }}>0.0, 0.05, 0.10</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '6px 10px', color: '#38bdf8', fontWeight: 600 }}>neuron_id</td>
                  <td style={{ padding: '6px 10px', color: '#cbd5e1' }}>Int / String</td>
                  <td style={{ padding: '6px 10px', color: '#4ade80' }}>Yes</td>
                  <td style={{ padding: '6px 10px', color: '#94a3b8' }}>Unique unit or neuron identifier</td>
                  <td style={{ padding: '6px 10px', color: '#facc15' }}>unit_01, 1001</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '6px 10px', color: '#38bdf8', fontWeight: 600 }}>firing_rate</td>
                  <td style={{ padding: '6px 10px', color: '#cbd5e1' }}>Float</td>
                  <td style={{ padding: '6px 10px', color: '#4ade80' }}>Yes</td>
                  <td style={{ padding: '6px 10px', color: '#94a3b8' }}>Instantaneous activity rate in Hz</td>
                  <td style={{ padding: '6px 10px', color: '#facc15' }}>14.5, 0.0, 32.1</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '6px 10px', color: '#38bdf8', fontWeight: 600 }}>label</td>
                  <td style={{ padding: '6px 10px', color: '#cbd5e1' }}>String</td>
                  <td style={{ padding: '6px 10px', color: '#4ade80' }}>Yes</td>
                  <td style={{ padding: '6px 10px', color: '#94a3b8' }}>Stimulus condition or experimental label</td>
                  <td style={{ padding: '6px 10px', color: '#facc15' }}>drifting_gratings_0deg</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', color: '#38bdf8', fontWeight: 600 }}>region</td>
                  <td style={{ padding: '6px 10px', color: '#cbd5e1' }}>String</td>
                  <td style={{ padding: '6px 10px', color: '#94a3b8' }}>Optional</td>
                  <td style={{ padding: '6px 10px', color: '#94a3b8' }}>Brain structure acronym (defaults to UserRegion)</td>
                  <td style={{ padding: '6px 10px', color: '#facc15' }}>VISp, LGd, CA1</td>
                </tr>
              </tbody>
            </table>

            {/* Validation rules explanation */}
            <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4' }}>
              <strong style={{ color: '#e2e8f0' }}>Validation Rules & Error Handling:</strong>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                <li>Missing any of the 5 required columns will reject the upload with an exact list of missing columns.</li>
                <li>Non-numeric entries in <code style={{ color: '#38bdf8' }}>time</code> or <code style={{ color: '#38bdf8' }}>firing_rate</code> will trigger a type conversion error.</li>
                <li>Empty files or files with only headers are rejected with a clear row count warning.</li>
                <li>Uploaded datasets are converted into memory-only canonical representation and wiped upon server restart for privacy.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
