import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Compass, Cpu, ArrowRight, Database, Binary, GitCompare } from 'lucide-react';

interface HowItWorksProps {
  onSelectStep?: (moduleId: 'explorer' | 'decoder' | 'simulation' | 'comparison') => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onSelectStep }) => {
  const { tokens } = useTheme();

  const steps = [
    {
      step: '01',
      title: 'Explore',
      summary: 'Select and inspect neural data.',
      moduleId: 'explorer' as const,
      icon: Database,
      accent: '#38bdf8',
      details: [
        'Load Neuropixels 384-channel recording sessions',
        'Filter single-unit spikes across anatomical CCFv3 depths',
        'Examine peri-stimulus time histograms (PSTH) & waveforms',
      ],
    },
    {
      step: '02',
      title: 'Decode',
      summary: 'Extract interpretable neural representations.',
      moduleId: 'decoder' as const,
      icon: Binary,
      accent: '#818cf8',
      details: [
        'Map high-dimensional population vectors to kinematics',
        'Evaluate Kalman filter & Ridge regression architectures',
        'Calculate cross-validated R² trajectories & spatial tuning',
      ],
    },
    {
      step: '03',
      title: 'Simulate',
      summary: 'Model neural dynamics and activity.',
      moduleId: 'simulation' as const,
      icon: Cpu,
      accent: '#34d399',
      details: [
        'Configure biophysical Leaky Integrate-and-Fire parameters',
        'Inject step, ramp, or noisy Poisson synaptic currents',
        'Analyze membrane potentials V_m(t), refractory periods & spikes',
      ],
    },
    {
      step: '04',
      title: 'Compare',
      summary: 'Compare sessions, populations, and responses.',
      moduleId: 'comparison' as const,
      icon: GitCompare,
      accent: '#f472b6',
      details: [
        'Evaluate population stability across multi-day sessions',
        'Measure Wasserstein drift distance and firing correlations',
        'Track receptive field plasticity and sensory tuning shifts',
      ],
    },
  ];

  return (
    <section
      id="how-it-works"
      style={{
        padding: '5rem 2rem',
        maxWidth: '1280px',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
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
          <Compass size={14} />
          End-to-End Pipeline
        </div>
        <h2
          style={{
            fontSize: '2.25rem',
            fontWeight: 800,
            color: tokens.text,
            letterSpacing: '-0.03em',
            margin: '0 0 0.75rem 0',
          }}
        >
          How NeuroDecode Works
        </h2>
        <p
          style={{
            fontSize: '1rem',
            color: tokens.textMuted,
            maxWidth: '650px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          A unified, mathematically consistent analytical workflow bridging raw electrophysiology recordings
          and predictive neurodynamic modeling.
        </p>
      </div>

      {/* Visual Workflow Journey Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
          position: 'relative',
        }}
      >
        {steps.map((st) => {
          const Icon = st.icon;
          return (
            <div
              key={st.step}
              onClick={() => onSelectStep?.(st.moduleId)}
              style={{
                background: tokens.surface,
                border: `1px solid ${tokens.border}`,
                borderRadius: '16px',
                padding: '2rem 1.5rem',
                position: 'relative',
                boxShadow: tokens.shadow,
                cursor: onSelectStep ? 'pointer' : 'default',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = st.accent;
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = tokens.border;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                {/* Step indicator & Icon */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: st.accent,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {st.step}
                  </span>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: `${st.accent}15`,
                      border: `1px solid ${st.accent}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: st.accent,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                </div>

                {/* Title & summary */}
                <h3
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    color: tokens.text,
                    margin: '0 0 0.5rem 0',
                  }}
                >
                  {st.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: tokens.textMuted,
                    marginBottom: '1.25rem',
                    lineHeight: 1.5,
                  }}
                >
                  {st.summary}
                </p>

                {/* Sub-steps */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {st.details.map((detail, dIdx) => (
                    <div
                      key={dIdx}
                      style={{
                        fontSize: '0.8rem',
                        color: tokens.textSubtle,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        lineHeight: 1.4,
                      }}
                    >
                      <span style={{ color: st.accent, fontWeight: 700, marginTop: '-1px' }}>›</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step footer link */}
              <div
                style={{
                  paddingTop: '1rem',
                  borderTop: `1px solid ${tokens.borderSubtle}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: st.accent,
                }}
              >
                <span>Launch Stage {st.step}</span>
                <ArrowRight size={14} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
