import React from 'react';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { Cpu, CheckCircle2, Layers, BarChart3, HelpCircle } from 'lucide-react';

export const DecoderView: React.FC = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={24} color="#8b5cf6" />
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>2. Decoder Module</h1>
            <ProvenanceBadge provenance="allen_experimental" />
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Decode visual stimulus conditions from authentic Allen Neuropixels neural population vectors across cortex and thalamus.
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', marginBottom: '8px' }}>
            <Layers size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Submodule 1: Models</h3>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>
            Train and run classifiers (Logistic Regression, Ridge, Random Forest) on binned population spike counts during stimulus presentation.
          </p>
        </div>

        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '8px',
          border: '1px solid #1e293b',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', marginBottom: '8px' }}>
            <BarChart3 size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Submodule 2: Performance</h3>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>
            Calculate held-out test accuracy, stratified cross-validation scores, and full confusion matrix using strictly separated test data.
          </p>
        </div>

        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '8px',
          border: '1px solid #1e293b',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', marginBottom: '8px' }}>
            <HelpCircle size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Submodule 3: Explainability</h3>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>
            Provide defensible model explanations (model weights / feature importance rankings) mapped back to individual Neuropixels units and brain regions.
          </p>
        </div>
      </div>

      <div style={{
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
        border: '1px dashed #7c3aed',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <CheckCircle2 color="#8b5cf6" size={24} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#c4b5fd' }}>
            Shared Contract Ready: DecoderTrainRequest & DecoderResult
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Pydantic schema in <code>backend/app/schemas/decoder.py</code> and TypeScript contract in <code>frontend/src/types/index.ts</code> are verified and ready for implementation.
          </div>
        </div>
      </div>
    </div>
  );
};
