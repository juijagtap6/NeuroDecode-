import React from 'react';
import { SimulationSummary } from '../../types';
import { ProvenanceBadge } from '../ProvenanceBadge';
import { Users, Clock, Flame, Activity, Target } from 'lucide-react';

interface SimulationSummaryBarProps {
  summary: SimulationSummary;
}

export const SimulationSummaryBar: React.FC<SimulationSummaryBarProps> = ({ summary }) => {
  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        border: '1px solid #1e293b',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        {/* Neuron count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              borderRadius: '6px',
              color: '#38bdf8',
            }}
          >
            <Users size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Population Size
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              {summary.total_neurons} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>neurons</span>
            </div>
          </div>
        </div>

        {/* Duration */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              borderRadius: '6px',
              color: '#c084fc',
            }}
          >
            <Clock size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Duration
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              {summary.duration_ms} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>ms</span>
            </div>
          </div>
        </div>

        {/* Total Spikes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '6px',
              color: '#fbbf24',
            }}
          >
            <Flame size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Spikes
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              {summary.total_spikes.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Population Mean Firing Rate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '6px',
              color: '#34d399',
            }}
          >
            <Activity size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pop. Mean Rate
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399' }}>
              {summary.mean_firing_rate_hz} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>Hz</span>
            </div>
          </div>
        </div>

        {/* Selected Neuron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px',
              backgroundColor: 'rgba(2, 132, 199, 0.15)',
              borderRadius: '6px',
              color: '#38bdf8',
            }}
          >
            <Target size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Inspected Neuron
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>
              Neuron #{summary.selected_neuron}
            </div>
          </div>
        </div>
      </div>

      {/* Provenance Tag */}
      <div>
        <ProvenanceBadge provenance={summary.provenance} />
      </div>
    </div>
  );
};
