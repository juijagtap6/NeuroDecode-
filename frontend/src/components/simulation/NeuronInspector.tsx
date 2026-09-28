import React from 'react';
import { SimulationResponse } from '../../types';
import { Cpu, ChevronLeft, ChevronRight, Activity, Clock, Zap, Hash } from 'lucide-react';

interface NeuronInspectorProps {
  simulationData: SimulationResponse;
  selectedNeuronId: number;
  onSelectNeuron: (neuronId: number) => void;
}

export const NeuronInspector: React.FC<NeuronInspectorProps> = ({
  simulationData,
  selectedNeuronId,
  onSelectNeuron,
}) => {
  const {
    neuron_ids,
    spike_counts,
    firing_rates,
    isi_statistics,
    membrane_potentials,
  } = simulationData;

  const nidStr = String(selectedNeuronId);
  const count = spike_counts[nidStr] ?? 0;
  const rate = firing_rates[nidStr] ?? 0.0;
  const meanIsi = isi_statistics.mean_isi_ms[nidStr] ?? 0.0;
  const cvIsi = isi_statistics.cv_isi[nidStr] ?? 0.0;

  // Peak voltage calculation from membrane trace if available
  let peakVoltage: number | null = null;
  const trace = membrane_potentials?.traces?.[nidStr];
  if (trace && trace.length > 0) {
    peakVoltage = Math.round(Math.max(...trace) * 10) / 10;
  } else if (count > 0 && membrane_potentials) {
    // Spiking LIF emits at threshold/peak
    peakVoltage = 20.0;
  }

  // Navigation handlers
  const currentIndex = neuron_ids.indexOf(selectedNeuronId);
  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectNeuron(neuron_ids[currentIndex - 1]);
    }
  };
  const handleNext = () => {
    if (currentIndex < neuron_ids.length - 1) {
      onSelectNeuron(neuron_ids[currentIndex + 1]);
    }
  };

  // Mini sparkline for membrane potential
  const sparklineWidth = 240;
  const sparklineHeight = 44;
  let sparklinePath = '';

  if (trace && trace.length > 0) {
    const minV = -75;
    const maxV = 25;
    const step = Math.max(1, Math.floor(trace.length / 80));
    const sampled = [];
    for (let i = 0; i < trace.length; i += step) {
      sampled.push(trace[i]);
    }
    const nPts = sampled.length;
    for (let i = 0; i < nPts; i++) {
      const x = (i / (nPts - 1 || 1)) * sparklineWidth;
      const y = sparklineHeight - ((sampled[i] - minV) / (maxV - minV)) * sparklineHeight;
      sparklinePath += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        border: '1px solid #1e293b',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header with neuron selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={18} color="#38bdf8" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc' }}>
            Neuron Inspector
          </span>
        </div>

        {/* Stepper & Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            style={{
              padding: '4px 6px',
              backgroundColor: currentIndex <= 0 ? 'transparent' : '#1e293b',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: currentIndex <= 0 ? '#475569' : '#cbd5e1',
              cursor: currentIndex <= 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
            }}
          >
            <ChevronLeft size={14} />
          </button>

          <select
            value={selectedNeuronId}
            onChange={(e) => onSelectNeuron(Number(e.target.value))}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #38bdf8',
              borderRadius: '4px',
              color: '#38bdf8',
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '4px 8px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {neuron_ids.map((id) => (
              <option key={id} value={id}>
                Neuron #{id}
              </option>
            ))}
          </select>

          <button
            onClick={handleNext}
            disabled={currentIndex >= neuron_ids.length - 1}
            style={{
              padding: '4px 6px',
              backgroundColor: currentIndex >= neuron_ids.length - 1 ? 'transparent' : '#1e293b',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: currentIndex >= neuron_ids.length - 1 ? '#475569' : '#cbd5e1',
              cursor: currentIndex >= neuron_ids.length - 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {/* Spike Count */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: '#1e293b',
            borderRadius: '6px',
            border: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.75rem' }}>
            <Hash size={13} color="#38bdf8" />
            Spike Count
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
            {count}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>action potentials</div>
        </div>

        {/* Mean Firing Rate */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: '#1e293b',
            borderRadius: '6px',
            border: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.75rem' }}>
            <Activity size={13} color="#10b981" />
            Mean Rate
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399', marginTop: '4px' }}>
            {rate} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Hz</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>spikes / sec</div>
        </div>

        {/* Peak Voltage */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: '#1e293b',
            borderRadius: '6px',
            border: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.75rem' }}>
            <Zap size={13} color="#f59e0b" />
            Peak Voltage
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fbbf24', marginTop: '4px' }}>
            {peakVoltage !== null ? `${peakVoltage} mV` : 'N/A'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>max recorded AP</div>
        </div>

        {/* Mean ISI & CV */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: '#1e293b',
            borderRadius: '6px',
            border: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.75rem' }}>
            <Clock size={13} color="#a855f7" />
            Mean ISI (CV)
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#c084fc', marginTop: '4px' }}>
            {meanIsi > 0 ? `${meanIsi} ms` : 'N/A'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
            CV: <strong style={{ color: '#e2e8f0' }}>{cvIsi > 0 ? cvIsi : 'N/A'}</strong>
          </div>
        </div>
      </div>

      {/* Mini Membrane Potential Sparkline */}
      <div
        style={{
          padding: '10px 12px',
          backgroundColor: '#090d16',
          borderRadius: '6px',
          border: '1px solid #1e293b',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
            Mini Membrane V(t) Trace
          </span>
          <span style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace' }}>
            0 → {simulationData.summary.duration_ms} ms
          </span>
        </div>

        {sparklinePath ? (
          <svg width="100%" height={sparklineHeight} viewBox={`0 0 ${sparklineWidth} ${sparklineHeight}`} preserveAspectRatio="none">
            {/* Threshold dashed line */}
            <line
              x1={0}
              y1={sparklineHeight * 0.3}
              x2={sparklineWidth}
              y2={sparklineHeight * 0.3}
              stroke="#f59e0b"
              strokeDasharray="3 2"
              strokeWidth={1}
            />
            {/* Trace */}
            <path
              d={sparklinePath}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <div
            style={{
              height: `${sparklineHeight}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              color: '#64748b',
            }}
          >
            {count > 0 ? 'Extracellular timestamps only' : 'No spikes emitted'}
          </div>
        )}
      </div>
    </div>
  );
};
