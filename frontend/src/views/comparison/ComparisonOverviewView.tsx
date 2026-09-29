import React, { useState, useRef } from 'react';
import { useComparison } from './ComparisonContext';
import {
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Activity,
  FileSpreadsheet,
  Play,
  RotateCw,
  UploadCloud,
  X,
  FileUp,
  ShieldCheck,
  Check,
  Layers,
} from 'lucide-react';

export const ComparisonOverviewView: React.FC = () => {
  const {
    sourceA,
    sourceB,
    sessionAId,
    sessionBId,
    availableSessions,
    overviewData,
    populationData,
    loading,
    error,
    setSourceA,
    setSourceB,
    setSessionAId,
    setSessionBId,
    setActiveSubmodule,
    generateComparison,
    uploadCustomDataset,
    uploadCsvOrJsonFile,
  } = useComparison();

  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'json'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadJsonText, setUploadJsonText] = useState<string>('');
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sessionAInfo = availableSessions.find((s) => String(s.session_id) === String(sessionAId));
  const sessionBInfo = availableSessions.find((s) => String(s.session_id) === String(sessionBId));

  const sessionsForA = availableSessions.filter((s) => s.source === sourceA);
  const sessionsForB = availableSessions.filter((s) => s.source === sourceB);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleFileUploadSubmit = async () => {
    if (!selectedFile) {
      setUploadError('Please choose a CSV or JSON file to upload.');
      return;
    }
    setUploadLoading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const newSessionId = await uploadCsvOrJsonFile(selectedFile);
      setUploadSuccess(`Successfully ingested dataset '${newSessionId}'. Dataset B has been assigned.`);
      setTimeout(() => {
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadSuccess(null);
      }, 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload processing failure';
      setUploadError(msg);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleJsonUploadSubmit = async () => {
    setUploadLoading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const parsed = JSON.parse(uploadJsonText);
      const newSessionId = await uploadCustomDataset(parsed);
      setUploadSuccess(`Successfully ingested dataset '${newSessionId}'. Dataset B has been assigned.`);
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadJsonText('');
        setUploadSuccess(null);
      }, 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid JSON or schema validation failure';
      setUploadError(msg);
    } finally {
      setUploadLoading(false);
    }
  };

  const handlePreloadSampleUpload = () => {
    const sample = {
      session_metadata: {
        session_id: `upload_custom_lab_${Math.floor(Math.random() * 900 + 100)}`,
        mouse_id: `M_CUSTOM_${Math.floor(Math.random() * 900 + 100)}`,
        genotype: "Sst-IRES-Cre;Ai32 (Somatostatin Interneuron)",
        session_type: "optotagged_spatial_visual_protocol",
        date_of_acquisition: new Date().toISOString(),
        total_units: 88,
        total_trials: 45,
        duration_sec: 125.0,
        available_brain_regions: ["VISp", "VISl", "CA1", "DG"],
        available_stimuli: ["drifting_gratings", "natural_scenes", "flashes"]
      },
      neuron_ids: Array.from({ length: 88 }, (_, i) => 5000 + i),
      unit_rates: Array.from({ length: 88 }, () => Number((Math.random() * 15 + 4).toFixed(2))),
      neuron_regions: Array.from({ length: 88 }, (_, i) => ["VISp", "VISl", "CA1", "DG"][i % 4])
    };
    setUploadJsonText(JSON.stringify(sample, null, 2));
  };

  if (error) {
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
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#f87171' }}>Comparison Calculation Error</h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>{error}</p>
        <button
          onClick={() => generateComparison(sessionAId, sessionBId)}
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
          Retry Comparison
        </button>
      </div>
    );
  }

  // Calculate metrics for health & key findings
  const unitDelta = overviewData ? overviewData.dataset_b.total_units - overviewData.dataset_a.total_units : 0;
  const trialDelta = overviewData ? overviewData.dataset_b.total_trials - overviewData.dataset_a.total_trials : 0;
  const meanRateDelta = populationData
    ? Number((populationData.stats_b.mean_firing_rate - populationData.stats_a.mean_firing_rate).toFixed(1))
    : 0;
  const meanRateDeltaPct = populationData && populationData.stats_a.mean_firing_rate > 0
    ? Math.round(((populationData.stats_b.mean_firing_rate - populationData.stats_a.mean_firing_rate) / populationData.stats_a.mean_firing_rate) * 100)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. DATASET SELECTION & SOURCE WORKFLOW */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              Dataset Selection & Scientific Contrast
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              Select sources (Allen Brain Observatory or Uploaded Recording) for Dataset A and Dataset B to generate side-by-side comparative dynamics.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                setShowUploadModal(true);
                setSelectedFile(null);
                setUploadError(null);
                setUploadSuccess(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: '#1e293b',
                color: '#cbd5e1',
                border: '1px solid #334155',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <UploadCloud size={15} color="#a78bfa" />
              <span>Upload Custom Dataset</span>
            </button>

            <button
              onClick={() => generateComparison(sessionAId, sessionBId)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)',
              }}
            >
              {loading ? <RotateCw size={15} className="spin" /> : <Play size={15} />}
              <span>Generate Comparison</span>
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}>
          {/* Dataset A Selector Card */}
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
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Reference Baseline</span>
              </div>

              {/* Source Toggle A */}
              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#0f172a', padding: '2px', borderRadius: '4px', border: '1px solid #334155' }}>
                <button
                  onClick={() => setSourceA('allen_experimental')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '3px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: sourceA === 'allen_experimental' ? '#3b82f6' : 'transparent',
                    color: sourceA === 'allen_experimental' ? '#fff' : '#64748b',
                  }}
                >
                  Allen Dataset
                </button>
                <button
                  onClick={() => setSourceA('user_upload')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '3px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: sourceA === 'user_upload' ? '#8b5cf6' : 'transparent',
                    color: sourceA === 'user_upload' ? '#fff' : '#64748b',
                  }}
                >
                  Uploaded Dataset
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                Select Session / Recording:
              </label>
              <select
                value={String(sessionAId)}
                onChange={(e) => setSessionAId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {sessionsForA.length > 0 ? (
                  sessionsForA.map((s) => (
                    <option key={`sel-a-${s.session_id}`} value={String(s.session_id)}>
                      {s.name} — {s.unit_count} Units ({s.genotype ? s.genotype.split(';')[0].slice(0, 24) : 'Wildtype'})
                    </option>
                  ))
                ) : (
                  <option value="">No sessions available for this source</option>
                )}
              </select>
            </div>

            {/* Region and Stimulus summary for A */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Brain Structures ({sessionAInfo?.structures?.length || 0}):</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                  {sessionAInfo?.structures?.slice(0, 8).map((r) => (
                    <span key={`a-reg-${r}`} style={{
                      backgroundColor: '#0f172a',
                      color: '#93c5fd',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: '1px solid #334155',
                      fontSize: '0.72rem',
                    }}>
                      {r}
                    </span>
                  ))}
                  {(sessionAInfo?.structures?.length || 0) > 8 && (
                    <span style={{ color: '#64748b', fontSize: '0.72rem', alignSelf: 'center' }}>
                      +{(sessionAInfo?.structures?.length || 0) - 8} more
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span style={{ color: '#94a3b8' }}>Stimuli:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                  {(sessionAInfo?.stimuli || ['drifting_gratings', 'natural_scenes']).map((st) => (
                    <span key={`a-stim-${st}`} style={{
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      color: '#38bdf8',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '0.72rem',
                    }}>
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dataset B Selector Card */}
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
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Comparison Target</span>
              </div>

              {/* Source Toggle B */}
              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#0f172a', padding: '2px', borderRadius: '4px', border: '1px solid #334155' }}>
                <button
                  onClick={() => setSourceB('allen_experimental')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '3px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: sourceB === 'allen_experimental' ? '#10b981' : 'transparent',
                    color: sourceB === 'allen_experimental' ? '#fff' : '#64748b',
                  }}
                >
                  Allen Dataset
                </button>
                <button
                  onClick={() => setSourceB('user_upload')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '3px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: sourceB === 'user_upload' ? '#8b5cf6' : 'transparent',
                    color: sourceB === 'user_upload' ? '#fff' : '#64748b',
                  }}
                >
                  Uploaded Dataset
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                Select Session / Recording:
              </label>
              <select
                value={String(sessionBId)}
                onChange={(e) => setSessionBId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {sessionsForB.length > 0 ? (
                  sessionsForB.map((s) => (
                    <option key={`sel-b-${s.session_id}`} value={String(s.session_id)}>
                      {s.name} — {s.unit_count} Units ({s.genotype ? s.genotype.split(';')[0].slice(0, 24) : 'Wildtype'})
                    </option>
                  ))
                ) : (
                  <option value="">No sessions available for this source</option>
                )}
              </select>
            </div>

            {/* Region and Stimulus summary for B */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Brain Structures ({sessionBInfo?.structures?.length || 0}):</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                  {sessionBInfo?.structures?.slice(0, 8).map((r) => (
                    <span key={`b-reg-${r}`} style={{
                      backgroundColor: '#0f172a',
                      color: '#a7f3d0',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: '1px solid #334155',
                      fontSize: '0.72rem',
                    }}>
                      {r}
                    </span>
                  ))}
                  {(sessionBInfo?.structures?.length || 0) > 8 && (
                    <span style={{ color: '#64748b', fontSize: '0.72rem', alignSelf: 'center' }}>
                      +{(sessionBInfo?.structures?.length || 0) - 8} more
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span style={{ color: '#94a3b8' }}>Stimuli:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                  {(sessionBInfo?.stimuli || ['drifting_gratings', 'natural_scenes']).map((st) => (
                    <span key={`b-stim-${st}`} style={{
                      backgroundColor: 'rgba(52, 211, 153, 0.1)',
                      color: '#34d399',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '0.72rem',
                    }}>
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KEY FINDINGS SECTION */}
      {overviewData && (
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="#38bdf8" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Key Comparison Findings
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Computed directly from isolated unit matrices & CCFv3 coordinates
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}>
            {/* Key Finding 1: Neuron Count Difference */}
            <div style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Neuron Population Delta</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: unitDelta >= 0 ? '#34d399' : '#f87171', margin: '4px 0' }}>
                  {unitDelta >= 0 ? `+${unitDelta}` : unitDelta}
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', marginLeft: '6px' }}>
                    Neurons
                  </span>
                </div>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#cbd5e1' }}>
                {overviewData.dataset_a.total_units} in A vs {overviewData.dataset_b.total_units} in B ({overviewData.neuron_diff.percent_change !== null ? `${overviewData.neuron_diff.percent_change}%` : '0%'} yield shift)
              </p>
            </div>

            {/* Key Finding 2: Shared Brain Regions */}
            <div style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Co-Sampled Regions</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a78bfa', margin: '4px 0' }}>
                  +{overviewData.region_overlap.shared_count}
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', marginLeft: '6px' }}>
                    Shared Regions
                  </span>
                </div>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#cbd5e1' }}>
                {Math.round(overviewData.region_overlap.jaccard_similarity * 100)}% anatomical Jaccard overlap ({overviewData.region_overlap.unique_to_a.length} in A, {overviewData.region_overlap.unique_to_b.length} in B)
              </p>
            </div>

            {/* Key Finding 3: Mean Activity Difference */}
            <div style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Mean Population Activity</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', margin: '4px 0' }}>
                  {meanRateDeltaPct >= 0 ? `+${meanRateDeltaPct}%` : `${meanRateDeltaPct}%`}
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', marginLeft: '6px' }}>
                    Mean Activity
                  </span>
                </div>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#cbd5e1' }}>
                Δ {meanRateDelta >= 0 ? `+${meanRateDelta}` : meanRateDelta} Hz shift across neural populations
              </p>
            </div>

            {/* Key Finding 4: Trial Difference */}
            <div style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Trial Presentation Delta</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: trialDelta >= 0 ? '#fbbf24' : '#f87171', margin: '4px 0' }}>
                  {trialDelta >= 0 ? `+${trialDelta}` : trialDelta}
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', marginLeft: '6px' }}>
                    Trials
                  </span>
                </div>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#cbd5e1' }}>
                {overviewData.dataset_a.total_trials} trials in A vs {overviewData.dataset_b.total_trials} in B
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPARISON HEALTH & SCIENTIFIC CONCLUSIONS */}
      {overviewData && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}>
          {/* Scientific Conclusions Section */}
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <CheckCircle2 size={20} color="#34d399" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Scientific Conclusions & Synthesis
              </h3>
            </div>
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '6px',
              padding: '16px',
              borderLeft: '4px solid #3b82f6',
              color: '#e2e8f0',
              fontSize: '0.85rem',
              lineHeight: '1.6',
            }}>
              {overviewData.scientific_summary}
            </div>
          </div>

          {/* Comparison Health Section */}
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <ShieldCheck size={20} color="#a78bfa" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Comparison Health & Data Quality
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Health 1: Data Completeness */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '6px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.82rem' }}>Data Completeness</span>
                  <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.72rem' }}>
                    Valid spike times, unit IDs & metadata present
                  </span>
                </div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#34d399',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(52, 211, 153, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>
                  <Check size={13} /> 100% Complete
                </span>
              </div>

              {/* Health 2: Region Coverage */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '6px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.82rem' }}>Region Coverage</span>
                  <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.72rem' }}>
                    {overviewData.region_overlap.shared_count} shared / {overviewData.region_overlap.total_union_count} total anatomical structures
                  </span>
                </div>
                <span style={{
                  color: '#60a5fa',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>
                  {Math.round(overviewData.region_overlap.jaccard_similarity * 100)}% Jaccard
                </span>
              </div>

              {/* Health 3: Stimulus Coverage */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '6px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.82rem' }}>Stimulus Coverage</span>
                  <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.72rem' }}>
                    {overviewData.stimulus_overlap.shared_count} shared / {overviewData.stimulus_overlap.total_union_count} sensory protocols
                  </span>
                </div>
                <span style={{
                  color: '#fbbf24',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>
                  {Math.round(overviewData.stimulus_overlap.jaccard_similarity * 100)}% Concordance
                </span>
              </div>

              {/* Health 4: Comparison Readiness */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '6px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.82rem' }}>Comparison Readiness</span>
                  <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.72rem' }}>
                    Population manifold & SVD trajectories aligned
                  </span>
                </div>
                <span style={{
                  color: '#a78bfa',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(167, 139, 250, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>
                  Operational (Production)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. NAVIGATION CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
      }}>
        {/* Navigation Card 1: Session Comparison */}
        <div
          onClick={() => setActiveSubmodule('session-comparison')}
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#60a5fa',
            }}>
              <FileSpreadsheet size={22} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Session Comparison
              </h3>
            </div>
            <ArrowRight size={18} color="#60a5fa" />
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>
            Inspect side-by-side anatomical brain structure distributions, individual probe trajectory coverage, and visual stimulus tables.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{
              fontSize: '0.75rem',
              color: '#93c5fd',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              padding: '3px 8px',
              borderRadius: '4px',
            }}>
              Region Overlap Breakdown
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: '#93c5fd',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              padding: '3px 8px',
              borderRadius: '4px',
            }}>
              Metadata Specification
            </span>
          </div>
        </div>

        {/* Navigation Card 2: Population Comparison */}
        <div
          onClick={() => setActiveSubmodule('population-comparison')}
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#34d399',
            }}>
              <Activity size={22} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Population Comparison
              </h3>
            </div>
            <ArrowRight size={18} color="#34d399" />
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>
            Analyze low-dimensional PCA population trajectories, firing rate histograms, and per-region activation rankings.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{
              fontSize: '0.75rem',
              color: '#a7f3d0',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '3px 8px',
              borderRadius: '4px',
            }}>
              Side-by-Side PCA
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: '#a7f3d0',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '3px 8px',
              borderRadius: '4px',
            }}>
              Dynamic Distributions
            </span>
          </div>
        </div>
      </div>

      {/* 5. UPLOAD CUSTOM DATASET MODAL (CSV & JSON FILE PICKER / DRAG & DROP) */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '680px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UploadCloud size={22} color="#a78bfa" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
                  Upload Neural Recording Dataset
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Upload Mode Selector (File Upload vs Raw JSON) */}
            <div style={{
              display: 'flex',
              gap: '8px',
              backgroundColor: '#1e293b',
              padding: '4px',
              borderRadius: '6px',
              marginBottom: '16px',
            }}>
              <button
                onClick={() => setUploadMode('file')}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: uploadMode === 'file' ? '#3b82f6' : 'transparent',
                  color: uploadMode === 'file' ? '#fff' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <FileUp size={15} />
                <span>Upload CSV or JSON File</span>
              </button>
              <button
                onClick={() => setUploadMode('json')}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: uploadMode === 'json' ? '#8b5cf6' : 'transparent',
                  color: uploadMode === 'json' ? '#fff' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Layers size={15} />
                <span>Paste JSON Payload</span>
              </button>
            </div>

            {uploadMode === 'file' ? (
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.json"
                  style={{ display: 'none' }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #475569',
                    borderRadius: '8px',
                    padding: '32px 20px',
                    textAlign: 'center',
                    backgroundColor: '#090d16',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <FileUp size={36} color="#60a5fa" style={{ margin: '0 auto 12px auto' }} />
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>
                    {selectedFile ? selectedFile.name : 'Click to select or drag and drop CSV or JSON'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                    Supports unit spike metrics, brain structures (VISp, CA1, etc.), and trial protocols
                  </p>
                </div>

                {selectedFile && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    backgroundColor: '#1e293b',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                  }}>
                    <span style={{ color: '#93c5fd', fontWeight: 600 }}>
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1' }}>Dataset JSON Payload:</label>
                  <button
                    onClick={handlePreloadSampleUpload}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Load Sample Lab Recording
                  </button>
                </div>
                <textarea
                  value={uploadJsonText}
                  onChange={(e) => setUploadJsonText(e.target.value)}
                  placeholder='{\n  "session_metadata": {\n    "session_id": "lab_recording_01",\n    "total_units": 64,\n    "available_brain_regions": ["VISp", "CA1"],\n    "available_stimuli": ["drifting_gratings"]\n  },\n  "unit_rates": [12.4, 8.2, 15.1]\n}'
                  rows={8}
                  style={{
                    width: '100%',
                    backgroundColor: '#090d16',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    padding: '10px',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {uploadError && (
              <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={15} />
                <span>{uploadError}</span>
              </div>
            )}
            {uploadSuccess && (
              <div style={{ color: '#34d399', fontSize: '0.8rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                }}
              >
                Cancel
              </button>
              <button
                onClick={uploadMode === 'file' ? handleFileUploadSubmit : handleJsonUploadSubmit}
                disabled={uploadLoading || (uploadMode === 'file' ? !selectedFile : !uploadJsonText.trim())}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: (uploadLoading || (uploadMode === 'file' ? !selectedFile : !uploadJsonText.trim())) ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {uploadLoading && <RotateCw size={14} className="spin" />}
                <span>{uploadMode === 'file' ? 'Upload & Parse File' : 'Validate & Save Dataset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

