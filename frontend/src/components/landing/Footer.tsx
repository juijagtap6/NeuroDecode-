import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Activity, ExternalLink, BookOpen } from 'lucide-react';

interface FooterProps {
  onSelectModule?: (moduleId: 'explorer' | 'decoder' | 'simulation' | 'comparison') => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectModule }) => {
  const { tokens } = useTheme();

  return (
    <footer
      style={{
        borderTop: `1px solid ${tokens.border}`,
        backgroundColor: tokens.surface,
        padding: '4rem 2rem 2.5rem',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3.5rem',
          }}
        >
          {/* Col 1: Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #818cf8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Activity size={18} />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: tokens.text, letterSpacing: '-0.02em' }}>
                Neuro<span style={{ color: tokens.accent }}>Decode</span>
              </span>
            </div>

            <p style={{ fontSize: '0.875rem', color: tokens.textMuted, lineHeight: 1.6, margin: 0 }}>
              An interactive computational neuroscience platform for exploring neural data,
              decoding activity patterns, simulating neural dynamics, and comparing neural responses.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: tokens.textSubtle }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399' }} />
              <span>FastAPI Backend Services Active</span>
            </div>
          </div>

          {/* Col 2: Modules */}
          <div>
            <h4
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: tokens.text,
                marginBottom: '1.25rem',
              }}
            >
              Integrated Modules
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { name: 'Explorer', id: 'explorer' as const, desc: 'High-density Spike Rasters' },
                { name: 'Decoder', id: 'decoder' as const, desc: 'Kalman & Kinematic Models' },
                { name: 'Simulation', id: 'simulation' as const, desc: 'Leaky Integrate-and-Fire' },
                { name: 'Comparison', id: 'comparison' as const, desc: 'Cross-Session Drift Analytics' },
              ].map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => onSelectModule?.(m.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: tokens.textMuted,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      textAlign: 'left',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = tokens.accent)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = tokens.textMuted)}
                  >
                    <span>{m.name}</span>
                    <span style={{ fontSize: '0.75rem', color: tokens.textSubtle }}>— {m.desc}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Standards & Protocols */}
          <div>
            <h4
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: tokens.text,
                marginBottom: '1.25rem',
              }}
            >
              Scientific Standards
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Allen Brain Observatory', url: 'https://allensdk.readthedocs.io/' },
                { label: 'Neurodata Without Borders (NWB 2.0)', url: 'https://www.nwb.org/' },
                { label: 'Allen CCFv3 Atlas Reference', url: 'https://mouse.brain-map.org/static/atlas' },
                { label: 'International Brain Laboratory (IBL)', url: 'https://www.internationalbrainlab.com/' },
                { label: 'SpikeGLX Electrophysiology Acquisition', url: 'https://billkarsh.github.io/SpikeGLX/' },
              ].map((s, idx) => (
                <li key={idx}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: tokens.textMuted,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = tokens.accent)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = tokens.textMuted)}
                  >
                    <span>{s.label}</span>
                    <ExternalLink size={12} style={{ opacity: 0.6 }} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Platform & API */}
          <div>
            <h4
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: tokens.text,
                marginBottom: '1.25rem',
              }}
            >
              Platform Telemetry
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li>
                <a
                  href="/docs"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: tokens.textMuted,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = tokens.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = tokens.textMuted)}
                >
                  <BookOpen size={14} />
                  <span>FastAPI OpenAPI Specification</span>
                </a>
              </li>
              <li>
                <div style={{ fontSize: '0.85rem', color: tokens.textSubtle }}>
                  Protocol: HTTP/1.1 REST &amp; WebSocket Telemetry
                </div>
              </li>
              <li>
                <div style={{ fontSize: '0.85rem', color: tokens.textSubtle }}>
                  Engine: Python 3.10+ / FastAPI / NumPy / SciPy / Scikit-Learn
                </div>
              </li>
              <li>
                <div style={{ fontSize: '0.85rem', color: tokens.textSubtle }}>
                  Client: React 18 / TypeScript / Plotly.js / HTML5 Vector
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div
          style={{
            paddingTop: '2rem',
            borderTop: `1px solid ${tokens.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.8rem',
            color: tokens.textSubtle,
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} NeuroDecode Computational Neuroscience Platform. Open Research Instrumentation.
          </div>
          <div>
            Built for High-Yield In-Vivo Electrophysiology &amp; Latent Population Dynamics.
          </div>
        </div>
      </div>
    </footer>
  );
};
