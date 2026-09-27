import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { SessionSummary } from '../types';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { Compass, CheckCircle2 } from 'lucide-react';

export const ExplorerView: React.FC = () => {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getSessions()
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Compass size={24} color="#3b82f6" />
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>1. Explorer Module</h1>
            <ProvenanceBadge provenance="allen_experimental" />
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Explore experimental sessions, units/recording metadata, visual stimuli, and neural activity from the official Allen Institute Neuropixels dataset.
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
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#f1f5f9' }}>
          Phase 1 Foundation Status: Connected to Data Access Layer
        </h3>
        {loading && <p style={{ color: '#94a3b8' }}>Loading authentic sessions from backend cache...</p>}
        {error && <p style={{ color: '#f87171' }}>Error: {error}</p>}
        {!loading && !error && (
          <div>
            <p style={{ margin: '0 0 12px 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Successfully retrieved <strong>{sessions.length}</strong> official Allen Neuropixels sessions via shared API contract:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {sessions.slice(0, 6).map((s) => (
                <div key={s.session_id} style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>Session {s.session_id}</span>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{s.unit_count} units</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                    Type: {s.session_type}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                    Genotype: {s.genotype || 'wildtype'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        border: '1px dashed #2563eb',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <CheckCircle2 color="#3b82f6" size={24} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#93c5fd' }}>
            Shared Contract Ready for Branch Development
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            The UI reference panels (Session selector, Unit table with CCFv3 brain structures, Stimulus presentations, and high-performance Canvas raster plot) will be implemented on Dev Branch 1.
          </div>
        </div>
      </div>
    </div>
  );
};
