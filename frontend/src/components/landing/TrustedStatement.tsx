import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Cpu, Activity, Database, GitBranch, Layers, ShieldCheck } from 'lucide-react';

export const TrustedStatement: React.FC = () => {
  const { tokens } = useTheme();

  const metrics = [
    {
      label: 'Channel Density',
      value: '384 Ch',
      detail: 'Neuropixels @ 30 kHz raw acquisition rate',
      icon: Activity,
    },
    {
      label: 'Biophysical Fidelity',
      value: '0.1 ms',
      detail: 'Euler/RK4 Leaky Integrate-and-Fire simulation steps',
      icon: Cpu,
    },
    {
      label: 'Manifold Parcellation',
      value: 'Allen CCFv3',
      detail: 'V1, CA1, ALM, STR anatomical 3D space alignment',
      icon: Layers,
    },
    {
      label: 'Decoding Models',
      value: 'Sub-millisecond',
      detail: 'Kalman filter, Ridge, and Ensemble kinematics decoders',
      icon: GitBranch,
    },
  ];

  const standards = [
    'Allen Brain Observatory Compatible',
    'NWB (Neurodata Without Borders) 2.0',
    'SpikeGLX & Open Ephys Pipeline',
    'CCFv3 Common Coordinate Framework',
    'IBL Standardization Protocols',
  ];

  return (
    <section
      id="technical-foundation"
      style={{
        padding: '3rem 2rem 4rem',
        borderTop: `1px solid ${tokens.border}`,
        borderBottom: `1px solid ${tokens.border}`,
        background: tokens.mode === 'dark'
          ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.5) 0%, rgba(8, 12, 20, 0.8) 100%)'
          : 'linear-gradient(180deg, rgba(241, 245, 249, 0.6) 0%, rgba(248, 250, 252, 0.9) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header indicator */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: tokens.accentBg,
              color: tokens.accent,
              border: `1px solid ${tokens.accentBorder}`,
              marginBottom: '0.75rem',
            }}
          >
            <ShieldCheck size={14} />
            Rigorous Scientific Foundation
          </div>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: tokens.text,
              letterSpacing: '-0.02em',
              margin: '0 0 0.5rem 0',
            }}
          >
            Engineered for High-Yield In-Vivo Electrophysiology
          </h2>
          <p
            style={{
              fontSize: '0.925rem',
              color: tokens.textMuted,
              maxWidth: '650px',
              margin: '0 auto',
              lineHeight: 1.5,
            }}
          >
            NeuroDecode interfaces directly with standardized extracellular electrophysiology datasets,
            enabling seamless transitions from raw spike times to biophysical modeling and latent manifold decoding.
          </p>
        </div>

        {/* 4 Technical Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                style={{
                  background: tokens.surface,
                  border: `1px solid ${tokens.border}`,
                  borderRadius: '10px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: tokens.shadow,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = tokens.accent;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = tokens.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: tokens.textSubtle, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    {item.label}
                  </span>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: tokens.accentBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: tokens.accent,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: tokens.text,
                    fontFamily: 'monospace',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {item.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: tokens.textMuted, lineHeight: 1.4 }}>
                  {item.detail}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scientific standards ticker bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem 2.5rem',
            padding: '1rem',
            background: tokens.mode === 'dark' ? 'rgba(17, 24, 39, 0.4)' : 'rgba(255, 255, 255, 0.6)',
            borderRadius: '8px',
            border: `1px dashed ${tokens.borderSubtle}`,
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: tokens.textSubtle,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Database size={13} />
            Data Standard Compliance:
          </div>
          {standards.map((std, idx) => (
            <div
              key={idx}
              style={{
                fontSize: '0.8rem',
                fontWeight: 500,
                color: tokens.textMuted,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: tokens.accent,
                  display: 'inline-block',
                }}
              />
              {std}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
