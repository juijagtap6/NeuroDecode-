import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onLaunch: (tab?: 'explorer' | 'decoder' | 'simulation' | 'comparison') => void;
  onExploreModules: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onLaunch, onExploreModules }) => {
  const { tokens, isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Elegant scientific canvas animation: pulsing neural connectivity graph & real-time voltage wave
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 420);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Neural nodes
    const nodeCount = 22;
    const nodes: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseRadius: number;
      v_m: number; // membrane potential
      refractory: number;
      spiking: boolean;
      region: string;
    }[] = [];

    const regions = ['VISp', 'VISl', 'VISam', 'CA1', 'LP', 'LGd'];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * (width - 80) + 40,
        y: Math.random() * (height - 80) + 40,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 3.5,
        baseRadius: 3.5,
        v_m: -70 + Math.random() * 15,
        refractory: 0,
        spiking: false,
        region: regions[i % regions.length],
      });
    }

    let t = 0;

    const render = () => {
      t += 0.03;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle background scientific grid
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(2, 132, 199, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update nodes & LIF dynamics simulation
      for (let i = 0; i < nodeCount; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 30 || n.x > width - 30) n.vx *= -1;
        if (n.y < 30 || n.y > height - 30) n.vy *= -1;

        // Subthreshold membrane integration
        if (n.refractory > 0) {
          n.refractory--;
          n.v_m = -65;
          n.spiking = false;
        } else {
          n.v_m += 0.4 + Math.sin(t + i) * 0.5;
          if (n.v_m >= -50) {
            // Action potential spike
            n.v_m = 20;
            n.spiking = true;
            n.refractory = 6;
          } else {
            n.spiking = false;
          }
        }
      }

      // Draw synaptic connections
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.35;
            const isSpiking = nodes[i].spiking || nodes[j].spiking;

            ctx.strokeStyle = isSpiking
              ? isDark ? 'rgba(56, 189, 248, 0.8)' : 'rgba(2, 132, 199, 0.8)'
              : isDark ? `rgba(148, 163, 184, ${alpha * 0.5})` : `rgba(71, 85, 105, ${alpha * 0.5})`;
            ctx.lineWidth = isSpiking ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();

            // Synaptic action potential pulse traveling along axon
            if (isSpiking) {
              const pulsePos = (Math.sin(t * 3) + 1) / 2;
              const px = nodes[i].x + (nodes[j].x - nodes[i].x) * pulsePos;
              const py = nodes[i].y + (nodes[j].y - nodes[i].y) * pulsePos;
              ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
              ctx.beginPath();
              ctx.arc(px, py, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // Draw neural nodes
      for (let i = 0; i < nodeCount; i++) {
        const n = nodes[i];
        const isSpike = n.spiking;

        ctx.fillStyle = isSpike
          ? (isDark ? '#38bdf8' : '#0284c7')
          : (isDark ? '#64748b' : '#94a3b8');

        ctx.beginPath();
        ctx.arc(n.x, n.y, isSpike ? 6 : n.radius, 0, Math.PI * 2);
        ctx.fill();

        if (isSpike) {
          ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.5)' : 'rgba(2, 132, 199, 0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 12, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw real-time intracellular voltage waveform at bottom
      const waveY = height - 42;
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.8)' : 'rgba(2, 132, 199, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let x = 0; x < width; x += 3) {
        const sampleT = t * 2 + x * 0.04;
        let v = Math.sin(sampleT) * 12 + Math.cos(sampleT * 2.3) * 6;
        if (Math.sin(sampleT * 0.5) > 0.85) {
          v -= 28; // Action potential excursion
        }
        const y = waveY + v;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Waveform label
      ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.8)' : 'rgba(71, 85, 105, 0.8)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText('V_m(t) [LIF Membrane Potential Trace · dt=0.1ms]', 16, height - 12);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDark]);

  return (
    <section
      style={{
        position: 'relative',
        padding: '72px 24px 60px',
        overflow: 'hidden',
        borderBottom: `1px solid ${tokens.border}`,
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
          gap: '48px',
          alignItems: 'center',
        }}
      >
        {/* Left: Headline, Subtext, CTAs */}
        <div>
          {/* Eyebrow Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: tokens.accentBg,
              border: `1px solid ${tokens.accentBorder}`,
              color: tokens.accent,
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '24px',
            }}
          >
            <Sparkles size={14} />
            <span>Computational Neuroscience & Neuromorphic AI</span>
          </div>

          {/* Main Title Required by Prompt */}
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              lineHeight: 1.1,
              fontWeight: 800,
              letterSpacing: '-0.035em',
              color: tokens.text,
              margin: '0 0 22px 0',
            }}
          >
            Decode the language of neural activity.
          </h1>

          {/* Supporting Text Required by Prompt */}
          <p
            style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
              lineHeight: 1.6,
              color: tokens.textMuted,
              margin: '0 0 34px 0',
              maxWidth: '620px',
            }}
          >
            NeuroDecode is an interactive computational neuroscience platform for exploring neural data, decoding activity patterns, simulating neural dynamics, and comparing neural responses.
          </p>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
              marginBottom: '38px',
            }}
          >
            <button
              onClick={() => onLaunch('explorer')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 28px',
                borderRadius: '10px',
                backgroundColor: tokens.accent,
                color: '#ffffff',
                fontSize: '0.98rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Launch NeuroDecode</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={onExploreModules}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 24px',
                borderRadius: '10px',
                backgroundColor: tokens.bgAlt,
                color: tokens.text,
                fontSize: '0.95rem',
                fontWeight: 600,
                border: `1px solid ${tokens.border}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = tokens.surfaceElevated;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = tokens.bgAlt;
              }}
            >
              <Compass size={17} />
              <span>Explore the platform</span>
            </button>
          </div>

          {/* Scientific Badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '20px',
              borderTop: `1px solid ${tokens.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: tokens.textMuted }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399' }} />
              <strong>Allen Brain Observatory</strong>
            </div>
            <div style={{ color: tokens.borderSubtle }}>·</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: tokens.textMuted }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
              <strong>Neuropixels 384-Ch</strong>
            </div>
            <div style={{ color: tokens.borderSubtle }}>·</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: tokens.textMuted }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#a78bfa' }} />
              <strong>CCFv3 3D Coordinate Mapping</strong>
            </div>
          </div>
        </div>

        {/* Right: Interactive Scientific Canvas & Telemetry Panel */}
        <div
          style={{
            position: 'relative',
            borderRadius: '18px',
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            boxShadow: tokens.shadow,
            overflow: 'hidden',
            minHeight: '420px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Card Window Header */}
          <div
            style={{
              padding: '12px 18px',
              borderBottom: `1px solid ${tokens.border}`,
              backgroundColor: tokens.bgAlt,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f87171' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#fbbf24' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#34d399' }} />
              <span style={{ marginLeft: '10px', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: tokens.textSubtle }}>
                synaptic_network_manifold.lif
              </span>
            </div>

            <div
              style={{
                fontSize: '0.72rem',
                fontFamily: 'JetBrains Mono, monospace',
                color: tokens.accent,
                fontWeight: 600,
              }}
            >
              LIVE TELEMETRY
            </div>
          </div>

          {/* Interactive Scientific Canvas */}
          <div style={{ position: 'relative', flex: 1, minHeight: '360px' }}>
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />

            {/* Overlay floating telemetry badge */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${tokens.border}`,
                fontSize: '0.75rem',
                fontFamily: 'JetBrains Mono, monospace',
                color: tokens.text,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ color: tokens.textSubtle, fontSize: '0.68rem' }}>CURRENT SESSION</div>
              <div style={{ fontWeight: 600, color: tokens.accent }}>#715093703 (VISp)</div>
              <div style={{ fontSize: '0.68rem', color: '#34d399' }}>● 120 Units Synchronized</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
