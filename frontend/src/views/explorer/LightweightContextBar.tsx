import React from 'react';
import { ProvenanceBadge } from '../../components/ProvenanceBadge';
import { ProvenanceType } from '../../types';

export interface ContextItem {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
  accentColor?: string;
}

interface LightweightContextBarProps {
  submoduleTitle: string;
  submoduleSubtitle?: string;
  provenance: ProvenanceType;
  items: ContextItem[];
}

export const LightweightContextBar: React.FC<LightweightContextBarProps> = ({
  submoduleTitle,
  submoduleSubtitle,
  provenance,
  items,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Title & Provenance */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              {submoduleTitle}
            </h2>
            <ProvenanceBadge provenance={provenance} />
          </div>
          {submoduleSubtitle && (
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
              {submoduleSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Lightweight Context Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.75rem',
            }}
          >
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>{item.label}:</span>
            <span
              style={{
                color: item.accentColor || (item.highlight ? '#38bdf8' : '#f1f5f9'),
                fontWeight: 600,
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
