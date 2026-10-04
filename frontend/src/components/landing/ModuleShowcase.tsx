import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Database, Binary, Cpu, GitCompare, ArrowRight, Activity, CheckCircle2 } from 'lucide-react';

interface ModuleShowcaseProps {
  onSelectModule: (moduleId: 'explorer' | 'decoder' | 'simulation' | 'comparison') => void;
}

export const ModuleShowcase: React.FC<ModuleShowcaseProps> = ({ onSelectModule }) => {
  const { tokens } = useTheme();

  const modules = [
    {
      id: 'explorer' as const,
      number: '01',
      title: 'Explorer',
      tagline: 'High-Density Electrophysiology & Population Rasters',
      description: 'Explore neural recordings, populations, trials, and activity patterns.',
      icon: Database,
      badge: 'Allen Brain Observatory',
      features: [
        'Interactive Spike Raster & PSTH histograms',
        'CCFv3 anatomical probe depth alignment',
        'Unit-level mean waveform isolation',
        'Multi-session trial condition filtering',
      ],
      previewType: 'raster',
      accentColor: '#38bdf8', // Cyan
    },
    {
      id: 'decoder' as const,
      number: '02',
      title: 'Decoder',
      tagline: 'Neural Decoding & Population Kinematics',
      description: 'Decode neural activity into interpretable representations.',
      icon: Binary,
      badge: 'Kinematic & Latent Decoding',
      features: [
        'Kalman Filter & Ridge Regression models',
        'Position & velocity kinematic reconstruction',
        'Cross-validated R² performance metrics',
        'Temporal lag & receptive field weighting',
      ],
      previewType: 'decoder',
      accentColor: '#818cf8', // Indigo/Blue
    },
    {
      id: 'simulation' as const,
      number: '03',
      title: 'Simulation',
      tagline: 'Leaky Integrate-and-Fire (LIF) Biophysics',
      description: 'Model neural dynamics and visualize membrane potential and population activity.',
      icon: Cpu,
      badge: 'Biophysical Dynamics',
      features: [
        'Exact analytic & Euler step LIF integration',
        'Step, ramp, Poisson & custom synaptic current',
        'Refractory periods & adaptive thresholding',
        'Multi-neuron network synchrony modeling',
      ],
      previewType: 'simulation',
      accentColor: '#34d399', // Emerald/Teal
    },
    {
      id: 'comparison' as const,
      number: '04',
      title: 'Comparison',
      tagline: 'Cross-Session Analytics & Population Manifolds',
      description: 'Compare neural sessions, populations, and activity patterns.',
      icon: GitCompare,
      badge: 'Comparative Telemetry',
      features: [
        'Multi-session firing rate cross-correlation',
        'Population vector distance & Wasserstein metrics',
        'Tuning curve stability across recording days',
        'Differential responsiveness by brain region',
      ],
      previewType: 'comparison',
      accentColor: '#f472b6', // Rose/Violet
    },
  ];

  return (
    <section
      id="modules"
      style={{
        padding: '5rem 2rem',
        maxWidth: '1280px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
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
          <Activity size={14} />
          Integrated Scientific Modules
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
          Four Specialized Pillars of Computational Neuroscience
        </h2>
        <p
          style={{
            fontSize: '1.05rem',
            color: tokens.textMuted,
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Each module is purpose-built to handle distinct stages of neural data analysis,
          from raw spike inspection to predictive population decoding and biophysical simulation.
        </p>
      </div>

      {/* Grid of 4 Modules */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
        }}
      >
        {modules.map((mod) => {
          const Icon = mod.icon;

          return (
            <div
              key={mod.id}
              style={{
                background: tokens.surface,
                border: `1px solid ${tokens.border}`,
                borderRadius: '16px',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: tokens.shadow,
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = mod.accentColor;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 16px 36px -12px ${mod.accentColor}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = tokens.border;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = tokens.shadow;
              }}
            >
              <div>
                {/* Header row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: `${mod.accentColor}18`,
                      border: `1px solid ${mod.accentColor}35`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: mod.accentColor,
                    }}
                  >
                    <Icon size={22} />
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      background: tokens.bgAlt,
                      color: tokens.textSubtle,
                      border: `1px solid ${tokens.borderSubtle}`,
                    }}
                  >
                    MODULE {mod.number}
                  </span>
                </div>

                {/* Title & Tagline */}
                <h3
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: tokens.text,
                    margin: '0 0 0.35rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {mod.title}
                </h3>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: mod.accentColor,
                    marginBottom: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {mod.tagline}
                </div>

                <p
                  style={{
                    fontSize: '0.9rem',
                    color: tokens.textMuted,
                    lineHeight: 1.5,
                    marginBottom: '1.25rem',
                  }}
                >
                  {mod.description}
                </p>

                {/* Miniature Visualization Graphic */}
                <div
                  style={{
                    height: '110px',
                    borderRadius: '8px',
                    background: tokens.mode === 'dark' ? '#070a12' : '#f1f5f9',
                    border: `1px solid ${tokens.borderSubtle}`,
                    marginBottom: '1.25rem',
                    padding: '0.75rem',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  {/* Visual preview content according to module */}
                  {mod.previewType === 'raster' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ fontSize: '0.7rem', color: tokens.textSubtle, fontFamily: 'monospace' }}>
                        SPIKE RASTER [384 CHANNELS / 10 TRIALS]
                      </div>
                      <svg width="100%" height="60" style={{ opacity: 0.85 }}>
                        {/* Sample spike tick marks */}
                        {[...Array(6)].map((_, r) => (
                          <g key={r}>
                            <line x1="0" y1={r * 10 + 5} x2="100%" y2={r * 10 + 5} stroke={tokens.borderSubtle} strokeWidth="0.5" strokeDasharray="2,4" />
                            {[15, 38, 55, 90, 110, 140, 180, 210, 240, 260, 290, 310].map((x, i) => (
                              <line
                                key={i}
                                x1={`${(x + (r * 17)) % 100}%`}
                                y1={r * 10 + 2}
                                x2={`${(x + (r * 17)) % 100}%`}
                                y2={r * 10 + 8}
                                stroke={mod.accentColor}
                                strokeWidth="1.5"
                              />
                            ))}
                          </g>
                        ))}
                      </svg>
                    </div>
                  )}

                  {mod.previewType === 'decoder' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: tokens.textSubtle, fontFamily: 'monospace' }}>
                        <span>TRAJECTORY DECODING</span>
                        <span style={{ color: mod.accentColor, fontWeight: 700 }}>R² = 0.84</span>
                      </div>
                      <svg width="100%" height="65">
                        {/* Target vs Decoded curve */}
                        <path
                          d="M 10 45 Q 60 10, 120 40 T 220 20 T 320 45"
                          fill="none"
                          stroke={tokens.textSubtle}
                          strokeWidth="2"
                          strokeDasharray="4,4"
                        />
                        <path
                          d="M 10 48 Q 62 14, 122 38 T 218 24 T 320 42"
                          fill="none"
                          stroke={mod.accentColor}
                          strokeWidth="2.5"
                        />
                      </svg>
                    </div>
                  )}

                  {mod.previewType === 'simulation' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: tokens.textSubtle, fontFamily: 'monospace' }}>
                        <span>LIF V_m(t) MEMBRANE</span>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>θ = -50 mV</span>
                      </div>
                      <svg width="100%" height="65">
                        <line x1="0" y1="15" x2="100%" y2="15" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
                        <path
                          d="M 10 50 C 40 50, 50 48, 60 15 L 60 55 L 75 52 C 105 52, 115 48, 125 15 L 125 55 L 140 52 C 170 52, 180 48, 190 15 L 190 55 L 210 52"
                          fill="none"
                          stroke={mod.accentColor}
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  )}

                  {mod.previewType === 'comparison' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: tokens.textSubtle, fontFamily: 'monospace' }}>
                        <span>CROSS-SESSION TUNING</span>
                        <span style={{ color: mod.accentColor, fontWeight: 700 }}>Δ Corr 0.91</span>
                      </div>
                      <svg width="100%" height="65">
                        <path
                          d="M 10 55 C 50 55, 70 15, 110 15 C 150 15, 170 55, 220 55"
                          fill="none"
                          stroke={tokens.accent}
                          strokeWidth="2"
                        />
                        <path
                          d="M 10 55 C 50 55, 80 20, 115 20 C 150 20, 180 55, 220 55"
                          fill="none"
                          stroke={mod.accentColor}
                          strokeWidth="2"
                          strokeDasharray="2,2"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Feature Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.5rem' }}>
                  {mod.features.map((feat, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.825rem',
                        color: tokens.textMuted,
                      }}
                    >
                      <CheckCircle2 size={14} color={mod.accentColor} style={{ flexShrink: 0 }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button: Opens the existing module directly */}
              <button
                id={`launch-module-${mod.id}`}
                onClick={() => onSelectModule(mod.id)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: tokens.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                  border: `1px solid ${tokens.border}`,
                  color: tokens.text,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = mod.accentColor;
                  e.currentTarget.style.borderColor = mod.accentColor;
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = tokens.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
                  e.currentTarget.style.borderColor = tokens.border;
                  e.currentTarget.style.color = tokens.text;
                }}
              >
                <span>Launch {mod.title}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
