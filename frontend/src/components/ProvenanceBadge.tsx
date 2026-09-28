import React from 'react';
import { ProvenanceType } from '../types';

interface ProvenanceBadgeProps {
  provenance: ProvenanceType;
  showIcon?: boolean;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ provenance, showIcon = true }) => {
  const isExperimental = provenance === 'allen_experimental';
  const isUserUploaded = provenance === 'user_uploaded';

  let borderColor = '#d97706';
  let bgColor = 'rgba(217, 119, 6, 0.12)';
  let textColor = '#fbbf24';
  let label = 'Synthetic (LIF)';
  let title = 'Synthetic simulation (LIF population model)';

  if (isExperimental) {
    borderColor = '#059669';
    bgColor = 'rgba(5, 150, 105, 0.12)';
    textColor = '#34d399';
    label = 'Allen Experimental';
    title = 'Official experimental recording from Allen Institute';
  } else if (isUserUploaded) {
    borderColor = '#8b5cf6';
    bgColor = 'rgba(139, 92, 246, 0.12)';
    textColor = '#c084fc';
    label = 'User Uploaded (CSV)';
    title = 'User-provided spike train dataset';
  }

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
