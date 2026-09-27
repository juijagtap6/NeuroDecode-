import React from 'react';
import { ProvenanceType } from '../types';

interface ProvenanceBadgeProps {
  provenance: ProvenanceType;
  showIcon?: boolean;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ provenance, showIcon = true }) => {
  const isExperimental = provenance === 'allen_experimental';

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: isExperimental ? '1px solid #059669' : '1px solid #d97706',
    backgroundColor: isExperimental ? 'rgba(5, 150, 105, 0.12)' : 'rgba(217, 119, 6, 0.12)',
    color: isExperimental ? '#34d399' : '#fbbf24',
  };

  const dotStyle: React.CSSProperties = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: isExperimental ? '#34d399' : '#fbbf24',
  };

  return (
    <span style={badgeStyle} title={isExperimental ? 'Official experimental recording from Allen Institute' : 'Synthetic simulation (LIF neuron)'}>
      {showIcon && <span style={dotStyle} />}
      {isExperimental ? 'Allen Experimental' : 'Synthetic (LIF)'}
    </span>
  );
};
