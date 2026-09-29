import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api, extractErrorMessage } from '../api/client';
import {
  SimulationMode,
  LIFPopulationParams,
  SimulationResponse,
  MembranePotentialData,
} from '../types';
import { SpikeRasterPlot } from '../components/simulation/SpikeRasterPlot';
import { MembranePotentialPlot } from '../components/simulation/MembranePotentialPlot';
import { PopulationRatePlot } from '../components/simulation/PopulationRatePlot';
import { NeuronInspector } from '../components/simulation/NeuronInspector';
import { SimulationSummaryBar } from '../components/simulation/SimulationSummaryBar';
import {
  Activity,
  Play,
  Upload,
  Sparkles,
  Download,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

/**
 * Format any error into a helpful human-readable string.
 * Prevents [object Object] from ever reaching the user.
 */
export function formatErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message && err.message !== '[object Object]') {
      return err.message;
    }
  }
  if (typeof err === 'string' && err !== '[object Object]') {
    return err;
  }
  if (typeof err === 'object' && err !== null) {
    return extractErrorMessage(err);
  }
  return String(err);
}

interface PresetConfig {
  name: string;
  description: string;
  params: Partial<LIFPopulationParams>;
}

const PRESETS: PresetConfig[] = [
  {
    name: 'Cortical Population Default',
    description: '100 neurons balanced E/I (80/20) with standard physiological cortical parameters.',
    params: {
      num_neurons: 100,
      ei_ratio: 0.8,
      connection_density: 0.1,
      tau_m: 20.0,
      v_rest: -65.0,
      v_thresh: -50.0,
      v_reset: -65.0,
      r_m: 1.5,
      t_ref: 2.0,
      i_inj: 14.0,
      noise: 0.8,
      duration_ms: 500.0,
      dt_ms: 0.1,
    },
  },
  {
    name: 'Asynchronous Balanced Network',
    description: 'High synaptic density with strong inhibitory feedback maintaining asynchronous irregular firing.',
    params: {
      num_neurons: 120,
      ei_ratio: 0.8,
      connection_density: 0.2,
      tau_m: 18.0,
      v_rest: -65.0,
      v_thresh: -50.0,
      v_reset: -65.0,
      r_m: 1.5,
      t_ref: 2.0,
      i_inj: 13.0,
      noise: 1.2,
      duration_ms: 500.0,
      dt_ms: 0.1,
    },
  },
  {
    name: 'Synchronous Population Bursting',
    description: 'Strong recurrent excitation and moderate drive triggering coordinated network volleys.',
    params: {
      num_neurons: 100,
      ei_ratio: 0.85,
      connection_density: 0.25,
      tau_m: 25.0,
      v_rest: -65.0,
      v_thresh: -50.0,
      v_reset: -65.0,
      r_m: 1.8,
      t_ref: 2.5,
      i_inj: 16.0,
      noise: 0.5,
      duration_ms: 500.0,
      dt_ms: 0.1,
    },
  },
  {
    name: 'Sparse Low-Noise Population',
    description: 'Weak drive with sparse connectivity producing localized sporadic action potentials.',
    params: {
      num_neurons: 80,
      ei_ratio: 0.8,
      connection_density: 0.05,
      tau_m: 20.0,
      v_rest: -65.0,
      v_thresh: -50.0,
      v_reset: -65.0,
      r_m: 1.2,
      t_ref: 2.0,
      i_inj: 12.5,
      noise: 0.6,
      duration_ms: 500.0,
      dt_ms: 0.1,
    },
  },
];

export const SimulationView: React.FC = () => {
  // Mode selection
  const [mode, setMode] = useState<SimulationMode>('quick');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);

  // LIF & Population parameters
  const [params, setParams] = useState<LIFPopulationParams>({
    num_neurons: 100,
    ei_ratio: 0.8,
    connection_density: 0.1,
    tau_m: 20.0,
    v_rest: -65.0,
    v_thresh: -50.0,
    v_reset: -65.0,
    r_m: 1.5,
    t_ref: 2.0,
    i_inj: 14.0,
    noise: 0.8,
    duration_ms: 500.0,
    dt_ms: 0.1,
    random_seed: 42,
    selected_neuron_id: 0,
  });

  // Selected neuron for linked interaction
  const [selectedNeuronId, setSelectedNeuronId] = useState<number>(0);

  // File upload state for BYOD
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulation status & results
  const [simulationData, setSimulationData] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cache of membrane potentials to avoid redundant requests
  const [activeMembraneData, setActiveMembraneData] = useState<MembranePotentialData | null>(null);

  // Run simulation
  const handleRunSimulation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.runSimulation({
        mode,
        params: {
          ...params,
          selected_neuron_id: selectedNeuronId,
        },
      });
      setSimulationData(response);
      setActiveMembraneData(response.membrane_potentials ?? null);
      if (response.neuron_ids.length > 0 && !response.neuron_ids.includes(selectedNeuronId)) {
        setSelectedNeuronId(response.neuron_ids[0]);
      }
    } catch (err: unknown) {
      const msg = formatErrorMessage(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [mode, params, selectedNeuronId]);

  // Initial simulation run on mount
  useEffect(() => {
    handleRunSimulation();
  }, []); // Run once on mount

  // Preset change handler
  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const chosen = PRESETS[index];
    if (chosen) {
      setParams((prev) => ({
        ...prev,
        ...chosen.params,
      }));
    }
  };

  // Linked interaction: when selected neuron changes, update inspector and membrane trace
  const handleSelectNeuron = useCallback(
    async (neuronId: number) => {
      setSelectedNeuronId(neuronId);

      const nidStr = String(neuronId);
      if (activeMembraneData?.traces?.[nidStr]) {
        return;
      }

      // If trace not yet loaded in activeMembraneData, fetch from backend (works for synthetic LIF & cached BYOD)
      if (simulationData) {
        try {
          const traceData = await api.getNeuronTrace(neuronId);
          setActiveMembraneData((prev) => {
            if (!prev) return traceData;
            return {
              ...prev,
              traces: {
                ...prev.traces,
                [nidStr]: traceData.traces[nidStr],
              },
            };
          });
        } catch {
          // If on-demand trace fetch fails, fallback quietly
        }
      }
    },
    [simulationData, activeMembraneData]
  );

  // Upload BYOD file
  const handleUploadCsv = async () => {
    if (!uploadFile) {
      setError('Please select a CSV file to upload.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.uploadSimulationCsv(uploadFile);
      setSimulationData(response);
      setActiveMembraneData(response.membrane_potentials ?? null);
      if (response.neuron_ids.length > 0) {
        setSelectedNeuronId(response.neuron_ids[0]);
      }
    } catch (err: unknown) {
      const msg = formatErrorMessage(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Download Sample CSV
  const handleDownloadSample = async (sampleType: 'spike' | 'voltage' = 'spike') => {
    try {
      const csvText = await api.getSampleCsv(sampleType);
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = sampleType === 'voltage' ? 'sample_neural_voltage.csv' : 'sample_neural_spikes.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = formatErrorMessage(err);
      setError(msg || 'Failed to download sample CSV.');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={24} color="#f59e0b" />
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              3. Simulation Lab (LIF Population)
            </h1>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Interactive biophysical Leaky Integrate-and-Fire (LIF) neural population platform. Supports Quick Presets, Custom Biophysical Networks, and Bring Your Own Data (BYOD) spike train ingestion.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              fontSize: '0.8rem',
              color: '#cbd5e1',
            }}
          >
            ODE: <strong style={{ color: '#f59e0b' }}>τ_m·(dV/dt) = -(V - V_rest) + R_m·I(t)</strong>
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '18px',
            color: '#fca5a5',
            fontSize: '0.85rem',
          }}
        >
          <AlertCircle size={20} color="#f87171" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong>Simulation / Validation Alert:</strong> {error}
          </div>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Simulation Summary Bar */}
      {simulationData && <SimulationSummaryBar summary={simulationData.summary} />}

      {/* Main Workspace: Left Controls Sidebar + Right Visualization Canvas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '360px minmax(0, 1fr)',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* ========================================================================= */}
        {/* LEFT SIDEBAR: Simulation Controls & Mode Selector */}
        {/* ========================================================================= */}
        <div
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '8px',
            border: '1px solid #1e293b',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Mode Switcher Tabs */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Simulation Mode
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px',
                padding: '3px',
                backgroundColor: '#090d16',
                borderRadius: '6px',
                border: '1px solid #1e293b',
              }}
            >
              <button
                onClick={() => setMode('quick')}
                style={{
                  padding: '8px 4px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: mode === 'quick' ? '#1e293b' : 'transparent',
                  color: mode === 'quick' ? '#f8fafc' : '#64748b',
                  boxShadow: mode === 'quick' ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
                  outline: mode === 'quick' ? '1px solid #38bdf8' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Quick Presets
              </button>
              <button
                onClick={() => setMode('custom')}
                style={{
                  padding: '8px 4px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: mode === 'custom' ? '#1e293b' : 'transparent',
                  color: mode === 'custom' ? '#f8fafc' : '#64748b',
                  boxShadow: mode === 'custom' ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
                  outline: mode === 'custom' ? '1px solid #38bdf8' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Custom Build
              </button>
              <button
                onClick={() => setMode('byod')}
                style={{
                  padding: '8px 4px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: mode === 'byod' ? '#1e293b' : 'transparent',
                  color: mode === 'byod' ? '#f8fafc' : '#64748b',
                  boxShadow: mode === 'byod' ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
                  outline: mode === 'byod' ? '1px solid #8b5cf6' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                BYOD (CSV)
              </button>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* TAB 1: Quick Configure */}
          {/* ===================================================================== */}
          {mode === 'quick' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Sparkles size={14} color="#f59e0b" />
                  Population Preset
                </label>
                <select
                  value={selectedPresetIndex}
                  onChange={(e) => handleSelectPreset(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                >
                  {PRESETS.map((p, idx) => (
                    <option key={idx} value={idx}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px', lineHeight: '1.4' }}>
                  {PRESETS[selectedPresetIndex]?.description}
                </div>
              </div>

              {/* Number of Neurons */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span style={{ color: '#cbd5e1' }}>Number of Neurons</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{params.num_neurons}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={params.num_neurons}
                  onChange={(e) => setParams({ ...params, num_neurons: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>

              {/* Excitatory / Inhibitory Ratio */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span style={{ color: '#cbd5e1' }}>E/I Ratio (Excitatory %)</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                    {Math.round(params.ei_ratio * 100)}% E / {Math.round((1 - params.ei_ratio) * 100)}% I
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={params.ei_ratio}
                  onChange={(e) => setParams({ ...params, ei_ratio: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>

              {/* Connection Density */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span style={{ color: '#cbd5e1' }}>Connection Density</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{Math.round(params.connection_density * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.5"
                  step="0.02"
                  value={params.connection_density}
                  onChange={(e) => setParams({ ...params, connection_density: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>

              {/* Input Current */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span style={{ color: '#cbd5e1' }}>Input Current (I_inj)</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{params.i_inj} pA</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={params.i_inj}
                  onChange={(e) => setParams({ ...params, i_inj: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>

              {/* Noise */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span style={{ color: '#cbd5e1' }}>Noise Amplitude (σ)</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{params.noise}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="3.0"
                  step="0.1"
                  value={params.noise}
                  onChange={(e) => setParams({ ...params, noise: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>

              {/* Core LIF Parameters Accordion / Compact */}
              <div
                style={{
                  padding: '10px',
                  backgroundColor: '#090d16',
                  borderRadius: '6px',
                  border: '1px solid #1e293b',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                  Core LIF Parameters
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>τ_m:</span>{' '}
                    <strong style={{ color: '#cbd5e1' }}>{params.tau_m} ms</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>R_m:</span>{' '}
                    <strong style={{ color: '#cbd5e1' }}>{params.r_m} MΩ</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>V_thresh:</span>{' '}
                    <strong style={{ color: '#cbd5e1' }}>{params.v_thresh} mV</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>V_reset:</span>{' '}
                    <strong style={{ color: '#cbd5e1' }}>{params.v_reset} mV</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: Custom Build */}
          {/* ===================================================================== */}
          {mode === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Neurons (N)</label>
                  <input
                    type="number"
                    min="1"
                    max="2000"
                    value={params.num_neurons}
                    onChange={(e) => setParams({ ...params, num_neurons: Math.max(1, Number(e.target.value)) })}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Membrane τ_m (ms)</label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    step="0.5"
                    value={params.tau_m}
                    onChange={(e) => setParams({ ...params, tau_m: Math.max(1, Number(e.target.value)) })}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Resting V_rest (mV)</label>
                  <input
                    type="number"
                    min="-100"
                    max="0"
                    step="1"
                    value={params.v_rest}
                    onChange={(e) => setParams({ ...params, v_rest: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Threshold V_thresh (mV)</label>
                  <input
                    type="number"
                    min="-80"
                    max="0"
                    step="1"
                    value={params.v_thresh}
                    onChange={(e) => setParams({ ...params, v_thresh: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Reset V_reset (mV)</label>
                  <input
                    type="number"
                    min="-100"
                    max="0"
                    step="1"
                    value={params.v_reset}
                    onChange={(e) => setParams({ ...params, v_reset: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Resistance R_m (MΩ)</label>
                  <input
                    type="number"
                    min="0.01"
                    max="1000"
                    step="1"
                    value={params.r_m}
                    onChange={(e) => setParams({ ...params, r_m: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Refractory t_ref (ms)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={params.t_ref}
                    onChange={(e) => setParams({ ...params, t_ref: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Input Current (pA)</label>
                  <input
                    type="number"
                    min="-100"
                    max="1000"
                    step="1"
                    value={params.i_inj}
                    onChange={(e) => setParams({ ...params, i_inj: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Noise (σ)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={params.noise}
                    onChange={(e) => setParams({ ...params, noise: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>E/I Ratio (fraction E)</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={params.ei_ratio}
                    onChange={(e) => setParams({ ...params, ei_ratio: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Duration (ms)</label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    step="50"
                    value={params.duration_ms}
                    onChange={(e) => setParams({ ...params, duration_ms: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Timestep dt (ms)</label>
                  <input
                    type="number"
                    min="0.01"
                    max="2.0"
                    step="0.01"
                    value={params.dt_ms}
                    onChange={(e) => setParams({ ...params, dt_ms: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Deterministic Seed (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 42 (blank for random)"
                  value={params.random_seed ?? ''}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      random_seed: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '6px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontSize: '0.8rem',
                  }}
                />
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: Bring Your Own Data (BYOD) */}
          {/* ===================================================================== */}
          {mode === 'byod' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setUploadFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging ? '2px dashed #8b5cf6' : '2px dashed #334155',
                  backgroundColor: isDragging ? 'rgba(139, 92, 246, 0.08)' : '#090d16',
                  borderRadius: '8px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Upload size={28} color={isDragging ? '#c084fc' : '#64748b'} style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                  {uploadFile ? uploadFile.name : 'Choose CSV or Drop File Here'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                  {uploadFile
                    ? `${(uploadFile.size / 1024).toFixed(1)} KB`
                    : 'Accepted format: CSV containing spike event timestamps or matrix'}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  aria-label="Upload Spike Train CSV"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const target = e.target as HTMLInputElement & { files?: FileList | File[] };
                    const native = e.nativeEvent as unknown as { target?: { files?: File[] }; files?: File[] };
                    const files = target.files?.length
                      ? target.files
                      : native?.target?.files?.length
                      ? native.target.files
                      : native?.files;
                    if (files && files[0]) {
                      setUploadFile(files[0] as File);
                    }
                  }}
                />
              </div>

              {/* Sample CSV Download and Guidance */}
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#090d16',
                  borderRadius: '6px',
                  border: '1px solid #1e293b',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1' }}>
                    Supported CSV Formats
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleDownloadSample('spike')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        color: '#38bdf8',
                        cursor: 'pointer',
                      }}
                      title="Download sample spike event CSV (STATE A)"
                    >
                      <Download size={12} />
                      Sample CSV
                    </button>
                    <button
                      onClick={() => handleDownloadSample('voltage')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        color: '#34d399',
                        cursor: 'pointer',
                      }}
                      title="Download sample continuous membrane potential CSV (STATE B)"
                    >
                      <Download size={12} />
                      Sample Voltage
                    </button>
                  </div>
                </div>
                <pre
                  style={{
                    backgroundColor: '#1e293b',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                    color: '#94a3b8',
                    fontFamily: 'monospace',
                    margin: 0,
                    lineHeight: '1.4',
                  }}
                >
                  # Format A: Spike Events (timestamps only){'\n'}
                  neuron_id,timestamp_ms{'\n'}
                  0,12.4{'\n'}
                  1,25.1{'\n'}
                  {'\n'}
                  # Format B: Intracellular V(t) Dynamics:{'\n'}
                  neuron_id,timestamp_ms,membrane_potential_mv{'\n'}
                  0,0.0,-65.0{'\n'}
                  0,1.0,-64.2{'\n'}
                </pre>
              </div>

              {/* Upload Action Button */}
              <button
                onClick={handleUploadCsv}
                disabled={loading || !uploadFile}
                style={{
                  padding: '10px 16px',
                  backgroundColor: uploadFile ? '#7c3aed' : '#334155',
                  color: uploadFile ? '#ffffff' : '#94a3b8',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: uploadFile ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.15s ease',
                }}
              >
                {loading ? <RefreshCw size={16} className="spin" /> : <Upload size={16} />}
                {loading ? 'Validating Dataset...' : 'Upload & Process Dataset'}
              </button>
            </div>
          )}

          {/* Run Simulation Action Button (for Quick & Custom) */}
          {mode !== 'byod' && (
            <button
              onClick={handleRunSimulation}
              disabled={loading}
              style={{
                marginTop: '6px',
                padding: '12px 18px',
                backgroundColor: loading ? '#0284c7' : '#0284c7',
                color: '#ffffff',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Simulating Biophysical Population...
                </>
              ) : (
                <>
                  <Play size={18} />
                  {mode === 'custom' ? 'Run Custom Simulation' : 'Run LIF Simulation'}
                </>
              )}
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT AREA: Primary Visualizations & Linked Inspector */}
        {/* ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Chart: Spike Raster Plot */}
          {simulationData && (
            <SpikeRasterPlot
              spikeEvents={simulationData.spike_events}
              neuronIds={simulationData.neuron_ids}
              durationMs={simulationData.summary.duration_ms}
              selectedNeuronId={selectedNeuronId}
              onSelectNeuron={handleSelectNeuron}
              height={320}
            />
          )}

          {/* Middle Grid: Neuron Inspector + Membrane Potential Dynamics */}
          {simulationData && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 340px) minmax(0, 1fr)',
                gap: '20px',
              }}
            >
              {/* Neuron Inspector */}
              <NeuronInspector
                simulationData={simulationData}
                selectedNeuronId={selectedNeuronId}
                onSelectNeuron={handleSelectNeuron}
                activeMembraneData={activeMembraneData}
              />

              {/* Membrane Potential Dynamics */}
              <MembranePotentialPlot
                membraneData={activeMembraneData}
                selectedNeuronId={selectedNeuronId}
                height={260}
              />
            </div>
          )}

          {/* Bottom Chart: Population Average Firing Rate Plot */}
          {simulationData && (
            <PopulationRatePlot
              populationRate={simulationData.population_firing_rate}
              durationMs={simulationData.summary.duration_ms}
              height={190}
            />
          )}

          {/* Empty / Loading State fallback */}
          {!simulationData && !loading && (
            <div
              style={{
                backgroundColor: '#0f172a',
                borderRadius: '8px',
                border: '1px dashed #334155',
                padding: '60px 20px',
                textAlign: 'center',
              }}
            >
              <Activity size={48} color="#f59e0b" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem' }}>
                Simulation Lab Initialized
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '420px', margin: '8px auto 20px auto' }}>
                Select a preset or configure custom biophysical LIF parameters on the left to start population ODE integration.
              </p>
              <button
                onClick={handleRunSimulation}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0284c7',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Play size={16} /> Run Default Simulation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
