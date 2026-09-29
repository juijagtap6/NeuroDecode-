import React, { useRef, useEffect, useState } from 'react';
import { MembranePotentialData } from '../../types';
import { Zap, Info } from 'lucide-react';

interface MembranePotentialPlotProps {
  membraneData?: MembranePotentialData | null;
  selectedNeuronId: number;
  height?: number;
}

export const MembranePotentialPlot: React.FC<MembranePotentialPlotProps> = ({
  membraneData,
  selectedNeuronId,
  height = 260,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; t: number; v: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const hasData = Boolean(
    membraneData &&
    membraneData.traces &&
    Object.keys(membraneData.traces).length > 0 &&
    (membraneData.traces[String(selectedNeuronId)] || Object.values(membraneData.traces)[0])
  );

  const traceKeys = membraneData?.traces ? Object.keys(membraneData.traces) : [];
  const nidStr = String(selectedNeuronId);
  const trace = membraneData?.traces ? (membraneData.traces[nidStr] ?? membraneData.traces[traceKeys[0]]) : null;
  const timeMs = membraneData?.time_ms ?? [];

  const margin = { top: 20, right: 30, bottom: 35, left: 55 };
  const plotWidth = Math.max(50, containerWidth - margin.left - margin.right);
  const plotHeight = Math.max(50, height - margin.top - margin.bottom);

  // Determine Y range (typical LIF voltage is -80 to +30 mV)
  const vRest = membraneData?.v_rest ?? -65.0;
  const vThresh = membraneData?.v_thresh ?? -50.0;
  const minV = Math.min(-80.0, vRest - 10.0);
  const maxV = Math.max(25.0, vThresh + 40.0);
  const vRange = maxV - minV;

  const maxT = timeMs.length > 0 ? timeMs[timeMs.length - 1] : 500.0;

  const getX = (t: number) => margin.left + (t / (maxT || 1)) * plotWidth;
  const getY = (v: number) => margin.top + plotHeight - ((v - minV) / (vRange || 1)) * plotHeight;

  // Build SVG path
  let pathD = '';
  if (hasData && trace && trace.length > 0) {
    const pointsCount = Math.min(trace.length, timeMs.length);
    for (let i = 0; i < pointsCount; i++) {
      const x = getX(timeMs[i]);
      const y = getY(trace[i]);
      pathD += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }

  // Handle Mouse Probe
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!hasData || !trace || trace.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    if (mouseX >= margin.left && mouseX <= margin.left + plotWidth) {
      const ratio = (mouseX - margin.left) / plotWidth;
      const t = ratio * maxT;
      const idx = Math.min(trace.length - 1, Math.max(0, Math.floor(ratio * trace.length)));
      const v = trace[idx];
      setHoverPoint({
        x: getX(timeMs[idx] ?? t),
        y: getY(v),
        t: Math.round(timeMs[idx] ?? t),
        v: Math.round(v * 10) / 10,
      });
    } else {
      setHoverPoint(null);
    }
  };

  const yThresh = membraneData ? getY(membraneData.v_thresh) : 0;
  const yReset = membraneData ? getY(membraneData.v_reset) : 0;

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        border: '1px solid #1e293b',
        padding: '16px',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} color="#38bdf8" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc' }}>
            Intracellular Membrane Potential {hasData ? `Dynamics V(t) — Neuron #${selectedNeuronId}` : ''}
          </span>
        </div>
        {hasData && membraneData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
              <span style={{ width: '12px', height: '2px', borderBottom: '2px dashed #f59e0b' }} />
              V_thresh ({membraneData.v_thresh} mV)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6' }}>
              <span style={{ width: '12px', height: '2px', borderBottom: '2px dashed #3b82f6' }} />
              V_reset ({membraneData.v_reset} mV)
            </span>
          </div>
        )}
      </div>

      {!hasData ? (
        <div
          style={{
            backgroundColor: '#090d16',
            borderRadius: '6px',
            border: '1px dashed #334155',
            padding: '20px',
            height: `${height}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <Info size={32} color="#64748b" style={{ marginBottom: '10px' }} />
          <div style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.9rem' }}>
            Intracellular Membrane Potential Not Available
          </div>
          <p style={{ color: '#64748b', fontSize: '0.8rem', maxWidth: '380px', marginTop: '6px' }}>
            Extracellular recordings (such as uploaded spike event CSVs) record timestamps of emitted action potentials without intracellular voltage trajectories. Upload a CSV with membrane potential values to view V(t) traces.
          </p>
        </div>
      ) : (
        <>
          <svg
            width={containerWidth}
            height={height}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverPoint(null)}
            style={{ display: 'block', cursor: 'crosshair' }}
          >
            {/* Background */}
            <rect x={margin.left} y={margin.top} width={plotWidth} height={plotHeight} fill="#090d16" />

            {/* Horizontal grid lines */}
            {[-70, -60, -50, -40, 0, 20].map((v) => {
              if (v < minV || v > maxV) return null;
              const y = getY(v);
              return (
                <g key={v}>
                  <line
                    x1={margin.left}
                    y1={y}
                    x2={margin.left + plotWidth}
                    y2={y}
                    stroke="#1e293b"
                    strokeWidth={1}
                  />
                  <text
                    x={margin.left - 8}
                    y={y + 4}
                    fill="#64748b"
                    fontSize={10}
                    textAnchor="end"
                    fontFamily="ui-monospace, monospace"
                  >
                    {v} mV
                  </text>
                </g>
              );
            })}

            {/* Threshold dashed line */}
            <line
              x1={margin.left}
              y1={yThresh}
              x2={margin.left + plotWidth}
              y2={yThresh}
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />

            {/* Reset dashed line */}
            <line
              x1={margin.left}
              y1={yReset}
              x2={margin.left + plotWidth}
              y2={yReset}
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />

            {/* Membrane trajectory line */}
            <path
              d={pathD}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Hover Crosshair */}
            {hoverPoint && (
              <g>
                <line
                  x1={hoverPoint.x}
                  y1={margin.top}
                  x2={hoverPoint.x}
                  y2={margin.top + plotHeight}
                  stroke="#64748b"
                  strokeDasharray="2 2"
                />
                <circle cx={hoverPoint.x} cy={hoverPoint.y} r={4} fill="#38bdf8" stroke="#ffffff" strokeWidth={1.5} />
              </g>
            )}

            {/* Border */}
            <rect
              x={margin.left}
              y={margin.top}
              width={plotWidth}
              height={plotHeight}
              fill="none"
              stroke="#334155"
              strokeWidth={1}
            />

            {/* Axis Labels */}
            <text
              x={margin.left + plotWidth / 2}
              y={height - 6}
              fill="#cbd5e1"
              fontSize={11}
              fontWeight={600}
              textAnchor="middle"
            >
              Time (ms)
            </text>

            <text
              x={14}
              y={margin.top + plotHeight / 2}
              fill="#cbd5e1"
              fontSize={11}
              fontWeight={600}
              textAnchor="middle"
              transform={`rotate(-90 14 ${margin.top + plotHeight / 2})`}
            >
              Membrane V (mV)
            </text>
          </svg>

          {/* Hover readout box */}
          {hoverPoint && (
            <div
              style={{
                position: 'absolute',
                right: '24px',
                top: '20px',
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid #38bdf8',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                color: '#f8fafc',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              t = <strong>{hoverPoint.t} ms</strong> · V = <strong>{hoverPoint.v} mV</strong>
            </div>
          )}
        </>
      )}
    </div>
  );
};
