import React from 'react';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { Activity, CheckCircle2, Sliders, AlertTriangle } from 'lucide-react';

export const SimulationView: React.FC = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={24} color="#f59e0b" />
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>3. Simulation Module (LIF Only)</h1>
            <ProvenanceBadge provenance="synthetic_lif" />
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Interactive Leaky Integrate-and-Fire (LIF) biophysical neuron simulation with customizable membrane parameters and injected current stimuli.
          </p>
        </div>

        <div style={{
          padding: '6px 12px',
          borderRadius: '6px',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          fontSize: '0.8rem',
          color: '#cbd5e1'
        }}>
          Assigned to: <strong style={{ color: '#60a5fa' }}>Dev Branch 1</strong> (Explorer + Simulation)
        </div>
      </div>

      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        border: '1px solid #1e293b',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', marginBottom: '12px' }}>
          <Sliders size={20} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Governing LIF Equation & Shared Parameters</h3>
        </div>

        <div style={{
          padding: '12px',
          backgroundColor: '#1e293b',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          color: '#e2e8f0',
          marginBottom: '16px'
        }}>
          τ_m · (dV/dt) = -(V - V_rest) + R_m · I_inj(t), &nbsp;&nbsp; if V ≥ V_thresh → Spike &amp; V ← V_reset
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <div style={{ padding: '10px', backgroundColor: '#1e293b', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Resting Potential (V_rest)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>-70.0 mV</div>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#1e293b', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Threshold (V_thresh)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>-50.0 mV</div>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#1e293b', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Reset Potential (V_reset)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>-65.0 mV</div>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#1e293b', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Membrane τ (tau_m)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>20.0 ms</div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '6px',
        backgroundColor: 'rgba(217, 119, 6, 0.08)',
        border: '1px solid rgba(217, 119, 6, 0.3)',
        marginBottom: '20px'
      }}>
        <AlertTriangle size={20} color="#f59e0b" />
        <div style={{ fontSize: '0.85rem', color: '#fbbf24' }}>
          <strong>Scope Safeguard:</strong> Only Leaky Integrate-and-Fire (LIF) is in scope. Izhikevich and Hodgkin-Huxley models are marked as future scope and will not be implemented for this MVP.
        </div>
      </div>

      <div style={{
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
        border: '1px dashed #d97706',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <CheckCircle2 color="#f59e0b" size={24} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fde68a' }}>
            Shared Contract Ready: LIFSimConfig & LIFSimResult
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Numerical ODE integration and interactive V(t) &amp; spike raster visualizations will be implemented on Dev Branch 1. Output is always tagged with <code>provenance: "synthetic_lif"</code>.
          </div>
        </div>
      </div>
    </div>
  );
};
