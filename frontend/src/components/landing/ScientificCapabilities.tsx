import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Terminal, Network, Waves, Cpu, Database, Binary, GitFork } from 'lucide-react';

export const ScientificCapabilities: React.FC = () => {
  const { tokens } = useTheme();

  const capabilities = [
    {
      title: 'Biophysical Membrane Modeling',
      icon: Cpu,
      formula: 'τ_m · (dV/dt) = -(V - E_L) + R_m · I(t)',
      description: 'Analytic & numerical Euler ODE integration for Leaky Integrate-and-Fire neurons with customizable capacitance, resting potentials, and absolute refractory periods.',
      accent: '#38bdf8',
    },
    {
      title: 'Recursive State-Space Decoding',
      icon: Binary,
      formula: 'x̂_t|t = x̂_t|t-1 + K_t(y_t - H x̂_t|t-1)',
      description: 'Continuous Kalman filters and regularized Ridge estimators translating multi-unit spike train matrices into continuous 2D motor velocity and position predictions.',
      accent: '#818cf8',
    },
    {
      title: 'Population Manifold Extraction',
      icon: Network,
      formula: 'z_t = W^T (r_t - μ)',
      description: 'Dimensionality reduction mapping thousands of heterogeneous spike channels into compact low-dimensional neural manifolds preserving behavioral covariation.',
      accent: '#34d399',
    },
    {
      title: 'Cross-Session Drift Metrics',
      icon: GitFork,
      formula: 'W_1(u, v) = ∫ |U(x) - V(x)| dx',
      description: 'Earth Mover’s / Wasserstein distance and tuning curve Pearson correlations quantifying long-term functional stability across multi-day chronic recordings.',
      accent: '#f472b6',
    },
    {
      title: 'CCFv3 Anatomical Registration',
      icon: Database,
      formula: 'z_depth ∈ [0, 3840 µm] ↦ CCFv3',
      description: 'Linear coordinate transformation mapping Neuropixels shank electrode positions directly into Allen Mouse Brain Common Coordinate Framework v3 parcellations.',
      accent: '#fbbf24',
    },
    {
      title: 'Interactive Vector-Grade Telemetry',
      icon: Waves,
      formula: 'f_s = 30 kHz → 10 ms Bins',
      description: 'Optimized client-side SVG and HTML5 Canvas rendering engine capable of displaying multi-thousand spike raster trains without frame rate degradation.',
      accent: '#38bdf8',
    },
  ];

  return (
    <section
      id="capabilities"
      style={{
        padding: '5rem 2rem',
        maxWidth: '1280px',
        margin: '0 auto',
        borderTop: `1px solid ${tokens.border}`,
      }}
    >
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
          <Terminal size={14} />
          Mathematical &amp; Algorithmic Rigor
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
          Computational Neuroscience Capabilities
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
          Built upon peer-reviewed computational electrophysiology formulas and standardized data structures.
        </p>
      </div>

      {/* Grid of 6 capability cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.75rem',
        }}
      >
        {capabilities.map((cap, idx) => {
          const Icon = cap.icon;
          return (
            <div
              key={idx}
              style={{
                background: tokens.surface,
                border: `1px solid ${tokens.border}`,
                borderRadius: '14px',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: tokens.shadow,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = cap.accent;
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = tokens.border;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: `${cap.accent}15`,
                      border: `1px solid ${cap.accent}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: cap.accent,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: tokens.text,
                      margin: 0,
                    }}
                  >
                    {cap.title}
                  </h3>
                </div>

                {/* Mathematical formula badge */}
                <div
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: tokens.codeBg,
                    border: `1px solid ${tokens.borderSubtle}`,
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: cap.accent,
                    marginBottom: '1rem',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cap.formula}
                </div>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: tokens.textMuted,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  {cap.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
