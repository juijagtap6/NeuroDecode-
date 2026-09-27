import React from 'react';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { GitCompare, CheckCircle2, TrendingUp, Grid, Orbit } from 'lucide-react';

export const ComparisonView: React.FC = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitCompare size={24} color="#10b981" />
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>4. Comparison Module</h1>
            <div style={{ display: 'flex', gap: '8px' }}>
              <ProvenanceBadge provenance="allen_experimental" />
              <ProvenanceBadge provenance="synthetic_lif" />
            </div>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Compare neural dynamics between authentic Allen Institute recordings and synthetic LIF benchmarks using unified canonical representations.
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
          Assigned to: <strong style={{ color: '#a78bfa' }}>Dev Branch 2</strong> (Decoder + Comparison)
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '8px',
          border: '1px solid #1e293b',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', marginBottom: '8px' }}>
            <TrendingUp size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>1. Firing Statistics</h3>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>
            Compare mean firing rate distributions, Inter-Spike Interval (ISI) histograms, CV of ISI (regularity), and Fano factor across populations.
          </p>
        </div>

        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '8px',
          border: '1px solid #1e293b',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', marginBottom: '8px' }}>
            <Grid size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>2. Correlation Analysis</h3>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>
            Pairwise Pearson correlation matrix of binned spike trains, comparing coordinated network synchrony vs. independent LIF neurons.
          </p>
        </div>

        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '8px',
          border: '1px solid #1e293b',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f472b6', marginBottom: '8px' }}>
            <Orbit size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>3. PCA Dimensionality Reduction</h3>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>
            Low-dimensional state space trajectories and explained variance spectra computed from the CanonicalSpikeMatrix.
          </p>
        </div>
      </div>

      <div style={{
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        border: '1px dashed #059669',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <CheckCircle2 color="#10b981" size={24} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#a7f3d0' }}>
            Shared Canonical Contract Enforced
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Both experimental and synthetic inputs are passed through the same <code>CanonicalSpikeMatrix</code> representation, with strict non-dismissible provenance badging.
          </div>
        </div>
      </div>
    </div>
  );
};
