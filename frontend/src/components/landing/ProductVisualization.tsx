import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Activity, BarChart2, Cpu, GitCompare, Eye, Sliders } from 'lucide-react';

export const ProductVisualization: React.FC = () => {
  const { tokens } = useTheme();
  const [activeTab, setActiveTab] = useState<'raster' | 'decoding' | 'lif' | 'tuning'>('raster');
  const [showStimulus, setShowStimulus] = useState(true);

  const tabs = [
    { id: 'raster' as const, label: 'Spike Raster & PSTH', icon: Activity, metric: 'VISp / 384 Units' },
    { id: 'decoding' as const, label: 'Kinematic Trajectory', icon: BarChart2, metric: 'Kalman / R² 0.86' },
    { id: 'lif' as const, label: 'LIF Membrane Dynamics', icon: Cpu, metric: 'τ = 20ms / θ = -50mV' },
    { id: 'tuning' as const, label: 'Multi-Session Manifold', icon: GitCompare, metric: 'IBL Session A vs B' },
  ];

  return (
    <section
      id="product-telemetry"
      style={{
        padding: '5rem 2rem',
        maxWidth: '1280px',
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
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
          <Sliders size={14} />
          High-Precision Telemetry
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
          Real-Time Neurocomputational Telemetry
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
          Interact with specialized electrophysiology visualizers designed for high-channel count probes,
          latent trajectory modeling, and biophysical dynamics.
        </p>
      </div>

      {/* Main Console Frame */}
      <div
        style={{
          background: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: '16px',
          boxShadow: tokens.shadow,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Console Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.5rem',
            borderBottom: `1px solid ${tokens.border}`,
            background: tokens.bgAlt,
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.9rem',
                    borderRadius: '8px',
                    border: `1px solid ${isSelected ? tokens.accentBorder : 'transparent'}`,
                    background: isSelected ? tokens.accentBg : 'transparent',
                    color: isSelected ? tokens.accent : tokens.textMuted,
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setShowStimulus(!showStimulus)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: showStimulus ? tokens.accent : tokens.textSubtle,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Eye size={14} />
              <span>Stimulus Overlay: {showStimulus ? 'ON' : 'OFF'}</span>
            </button>
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: tokens.textSubtle,
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: tokens.surface,
                border: `1px solid ${tokens.borderSubtle}`,
              }}
            >
              {tabs.find((t) => t.id === activeTab)?.metric}
            </span>
          </div>
        </div>

        {/* Console Workspace Display */}
        <div
          style={{
            padding: '1.5rem',
            background: tokens.mode === 'dark' ? '#060911' : '#f8fafc',
            minHeight: '400px',
            position: 'relative',
          }}
        >
          {/* TAB 1: SPIKE RASTER & PSTH */}
          {activeTab === 'raster' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.825rem', fontFamily: 'monospace', color: tokens.textMuted }}>
                  RECORDING: <strong style={{ color: tokens.text }}>session_715093703_probeC.nwb</strong> | 384 Neuropixels Channels | Depth: 0–3840 µm
                </div>
                <div style={{ fontSize: '0.75rem', color: tokens.accent, fontWeight: 600 }}>
                  Active Region: Primary Visual Cortex (VISp)
                </div>
              </div>

              {/* Raster Grid */}
              <div
                style={{
                  height: '220px',
                  background: tokens.mode === 'dark' ? '#090d18' : '#ffffff',
                  border: `1px solid ${tokens.border}`,
                  borderRadius: '8px',
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '10px 15px',
                }}
              >
                {/* Stimulus onset overlay */}
                {showStimulus && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '35%',
                      width: '25%',
                      top: 0,
                      bottom: 0,
                      background: 'rgba(56, 189, 248, 0.08)',
                      borderLeft: '1px dashed #38bdf8',
                      borderRight: '1px dashed #38bdf8',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      paddingTop: '6px',
                    }}
                  >
                    <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 600 }}>
                      Gabor Grating Flash (500 ms)
                    </span>
                  </div>
                )}

                {/* 20 simulated unit spike trains */}
                <svg width="100%" height="100%" preserveAspectRatio="none">
                  {[...Array(22)].map((_, uIndex) => {
                    const y = (uIndex / 22) * 190 + 10;
                    // generate deterministic tick patterns with burst in stimulus window
                    const ticks = [
                      5, 12, 18, 25,
                      36, 38, 41, 45, 48, 52, 55, 58, // burst during stimulus
                      65, 75, 82, 91, 98,
                    ];
                    return (
                      <g key={uIndex}>
                        <text x="5" y={y + 3} fill={tokens.textSubtle} fontSize="8" fontFamily="monospace">
                          U{uIndex + 1}
                        </text>
                        {ticks.map((t, idx) => {
                          const jitter = ((uIndex * 7 + idx * 13) % 8) - 4;
                          const xPercent = Math.min(98, Math.max(8, t + jitter * 0.4));
                          const inStim = xPercent >= 35 && xPercent <= 60;
                          return (
                            <line
                              key={idx}
                              x1={`${xPercent}%`}
                              y1={y - 4}
                              x2={`${xPercent}%`}
                              y2={y + 4}
                              stroke={inStim ? '#38bdf8' : tokens.mode === 'dark' ? '#94a3b8' : '#64748b'}
                              strokeWidth={inStim ? 1.5 : 1}
                              opacity={inStim ? 0.95 : 0.65}
                            />
                          );
                        })}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* PSTH (Peristimulus Time Histogram) below raster */}
              <div
                style={{
                  height: '90px',
                  background: tokens.mode === 'dark' ? '#090d18' : '#ffffff',
                  border: `1px solid ${tokens.border}`,
                  borderRadius: '8px',
                  padding: '8px 15px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: tokens.textSubtle, fontFamily: 'monospace' }}>
                  <span>POPULATION PSTH (Binned at 10 ms)</span>
                  <span style={{ color: tokens.accent, fontWeight: 600 }}>Peak: 48.2 Hz/unit</span>
                </div>
                <svg width="100%" height="55" preserveAspectRatio="none">
                  {/* Histogram bars */}
                  {[...Array(40)].map((_, i) => {
                    const x = (i / 40) * 100;
                    const isStim = i >= 14 && i <= 24;
                    const height = isStim
                      ? 35 + Math.sin((i - 14) * 0.3) * 15
                      : 8 + ((i * 3) % 7);
                    return (
                      <rect
                        key={i}
                        x={`${x}%`}
                        y={55 - height}
                        width="2%"
                        height={height}
                        fill={isStim ? '#38bdf8' : tokens.mode === 'dark' ? '#334155' : '#cbd5e1'}
                        rx="1"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* TAB 2: KINEMATIC DECODING */}
          {activeTab === 'decoding' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.825rem', fontFamily: 'monospace', color: tokens.textMuted }}>
                  TASK: <strong style={{ color: tokens.text }}>Center-Out Reach Kinematics</strong> | Algorithm: Continuous State-Space Kalman Filter
                </div>
                <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>
                  Kinematic Correlation: R² = 0.86 (p &lt; 0.001)
                </div>
              </div>

              <div
                style={{
                  height: '320px',
                  background: tokens.mode === 'dark' ? '#090d18' : '#ffffff',
                  border: `1px solid ${tokens.border}`,
                  borderRadius: '8px',
                  position: 'relative',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '18px', height: '3px', backgroundColor: tokens.textSubtle, borderBottom: '1px dashed' }} />
                    <span style={{ color: tokens.textMuted }}>Ground Truth Position (X, Y)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '18px', height: '3px', backgroundColor: '#818cf8' }} />
                    <span style={{ color: '#818cf8', fontWeight: 600 }}>Kalman Decoded Estimate</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '18px', height: '3px', backgroundColor: '#38bdf8' }} />
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>Ridge Regression Baseline</span>
                  </div>
                </div>

                <svg width="100%" height="240" viewBox="0 0 800 240" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="60" x2="800" y2="60" stroke={tokens.borderSubtle} strokeDasharray="3,3" />
                  <line x1="0" y1="120" x2="800" y2="120" stroke={tokens.borderSubtle} strokeDasharray="3,3" />
                  <line x1="0" y1="180" x2="800" y2="180" stroke={tokens.borderSubtle} strokeDasharray="3,3" />

                  {/* Ground Truth trajectory */}
                  <path
                    d="M 20 120 C 120 40, 200 200, 320 70 C 440 -10, 520 210, 640 100 L 780 130"
                    fill="none"
                    stroke={tokens.textSubtle}
                    strokeWidth="2.5"
                    strokeDasharray="6,4"
                    opacity="0.8"
                  />
                  {/* Kalman Decoded */}
                  <path
                    d="M 20 125 C 120 46, 204 194, 322 74 C 438 -4, 522 204, 638 104 L 780 128"
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="3"
                  />
                  {/* Ridge Decoded */}
                  <path
                    d="M 20 115 C 115 55, 210 185, 315 85 C 445 10, 515 195, 645 110 L 780 135"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.8"
                    opacity="0.7"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* TAB 3: LIF MEMBRANE DYNAMICS */}
          {activeTab === 'lif' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.825rem', fontFamily: 'monospace', color: tokens.textMuted }}>
                  MODEL: <strong style={{ color: tokens.text }}>Leaky Integrate-and-Fire (LIF)</strong> | C_m: 250 pF | g_L: 12.5 nS | E_L: -70 mV
                </div>
                <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                  Threshold: -50.0 mV | Reset: -65.0 mV
                </div>
              </div>

              <div
                style={{
                  height: '320px',
                  background: tokens.mode === 'dark' ? '#090d18' : '#ffffff',
                  border: `1px solid ${tokens.border}`,
                  borderRadius: '8px',
                  position: 'relative',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  <span style={{ color: tokens.textMuted }}>Membrane Voltage V_m(t) &amp; Synaptic Injected Current I_syn(t)</span>
                  <span style={{ color: '#ef4444' }}>--- Spike Threshold (-50 mV)</span>
                </div>

                <svg width="100%" height="240" viewBox="0 0 800 240" preserveAspectRatio="none">
                  {/* Threshold line */}
                  <line x1="0" y1="70" x2="800" y2="70" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,4" />
                  <text x="10" y="65" fill="#ef4444" fontSize="10" fontFamily="monospace">
                    Threshold θ = -50 mV
                  </text>

                  {/* Resting potential line */}
                  <line x1="0" y1="200" x2="800" y2="200" stroke={tokens.borderSubtle} strokeWidth="1" strokeDasharray="2,2" />
                  <text x="10" y="195" fill={tokens.textSubtle} fontSize="10" fontFamily="monospace">
                    Resting E_L = -70 mV
                  </text>

                  {/* LIF Action Potential Traces */}
                  <path
                    d="M 20 200 
                       C 60 200, 90 180, 110 70 L 110 30 L 110 185 
                       C 130 185, 170 170, 200 70 L 200 30 L 200 185
                       C 220 185, 260 160, 280 70 L 280 30 L 280 185
                       C 300 185, 340 155, 360 70 L 360 30 L 360 185
                       C 380 185, 430 190, 500 200 L 800 200"
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="2.5"
                  />

                  {/* Injected current profile */}
                  <path
                    d="M 20 230 L 70 230 L 70 215 L 380 215 L 380 230 L 800 230"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    opacity="0.8"
                  />
                  <text x="80" y="210" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                    Step Current Pulse I_inj = 450 pA
                  </text>
                </svg>
              </div>
            </div>
          )}

          {/* TAB 4: MULTI-SESSION MANIFOLD */}
          {activeTab === 'tuning' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.825rem', fontFamily: 'monospace', color: tokens.textMuted }}>
                  ANALYSIS: <strong style={{ color: tokens.text }}>Cross-Session Tuning Stability</strong> | Drift Metric: Wasserstein Distance W_1 = 0.082
                </div>
                <div style={{ fontSize: '0.75rem', color: '#f472b6', fontWeight: 600 }}>
                  Tuning Curve Correlation: r = 0.942
                </div>
              </div>

              <div
                style={{
                  height: '320px',
                  background: tokens.mode === 'dark' ? '#090d18' : '#ffffff',
                  border: `1px solid ${tokens.border}`,
                  borderRadius: '8px',
                  position: 'relative',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '18px', height: '3px', backgroundColor: '#38bdf8' }} />
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>Session Day 1 (128 trials)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '18px', height: '3px', backgroundColor: '#f472b6' }} />
                    <span style={{ color: '#f472b6', fontWeight: 600 }}>Session Day 4 (128 trials)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: tokens.textSubtle }}>Grating Drift Angle: 0° – 360°</span>
                  </div>
                </div>

                <svg width="100%" height="240" viewBox="0 0 800 240" preserveAspectRatio="none">
                  {/* Tuning curves */}
                  <line x1="0" y1="200" x2="800" y2="200" stroke={tokens.borderSubtle} strokeWidth="1" />
                  
                  {/* Gaussian Bell Tuning curve Day 1 */}
                  <path
                    d="M 50 200 C 250 200, 300 40, 400 40 C 500 40, 550 200, 750 200"
                    fill="rgba(56, 189, 248, 0.08)"
                    stroke="#38bdf8"
                    strokeWidth="3"
                  />

                  {/* Gaussian Bell Tuning curve Day 4 */}
                  <path
                    d="M 50 200 C 240 200, 310 50, 410 50 C 510 50, 560 200, 750 200"
                    fill="rgba(244, 114, 182, 0.08)"
                    stroke="#f472b6"
                    strokeWidth="3"
                    strokeDasharray="4,2"
                  />

                  {/* Preferred orientation marker */}
                  <line x1="400" y1="40" x2="400" y2="200" stroke={tokens.borderSubtle} strokeWidth="1" strokeDasharray="3,3" />
                  <text x="410" y="35" fill={tokens.text} fontSize="11" fontFamily="monospace" fontWeight="600">
                    Preferred Angle θ = 180°
                  </text>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Footer of console */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: `1px solid ${tokens.border}`,
            background: tokens.bgAlt,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: tokens.textSubtle,
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399' }} />
            <span>Interactive Telemetry Pipeline Active</span>
          </div>
          <div>All visualizations generated directly in client space via high-performance vector rendering.</div>
        </div>
      </div>
    </section>
  );
};
