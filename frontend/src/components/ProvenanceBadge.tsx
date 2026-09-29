import React from 'react';
import { ProvenanceType } from '../types';

interface ProvenanceBadgeProps {
  provenance: ProvenanceType;
  showIcon?: boolean;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ provenance, showIcon = true }) => {
  let borderColor = '#059669';
  let bgColor = 'rgba(5, 150, 105, 0.12)';
  let textColor = '#34d399';
  let label = 'Allen Experimental';
  let title = 'Official experimental recording from Allen Institute';

  if (provenance === 'user_uploaded' || (provenance as string) === 'user_upload') {
    borderColor = '#7c3aed';
    bgColor = 'rgba(124, 58, 237, 0.14)';
    textColor = '#c084fc';
    label = 'User Uploaded';
    title = 'User-uploaded neural dataset';
  } else if (provenance === 'synthetic_lif') {
    borderColor = '#d97706';
    bgColor = 'rgba(217, 119, 6, 0.12)';
    textColor = '#fbbf24';
    label = 'Synthetic (LIF)';
    title = 'Synthetic simulation (LIF neuron / population model)';
  }

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: `1px solid ${borderColor}`,
    backgroundColor: bgColor,
    color: textColor,
  };

  const dotStyle: React.CSSProperties = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: textColor,
  };

  return (
    <span style={badgeStyle} title={title}>
      {showIcon && <span style={dotStyle} />}
      {label}
    </span>
  );
};
