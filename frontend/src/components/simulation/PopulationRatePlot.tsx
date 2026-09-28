import React, { useRef, useEffect, useState } from 'react';
import { PopulationFiringRate } from '../../types';
import { TrendingUp } from 'lucide-react';

interface PopulationRatePlotProps {
  populationRate: PopulationFiringRate;
  durationMs: number;
  height?: number;
}

export const PopulationRatePlot: React.FC<PopulationRatePlotProps> = ({
  populationRate,
  durationMs,
  height = 200,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

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

  const margin = { top: 20, right: 30, bottom: 35, left: 60 };
  const plotWidth = Math.max(50, containerWidth - margin.left - margin.right);
  const plotHeight = Math.max(50, height - margin.top - margin.bottom);

  const { time_bins_ms, rates_hz } = populationRate;
  const nBins = time_bins_ms.length;

  // Max firing rate for Y scaling
  const maxRate = Math.max(10.0, Math.ceil((Math.max(...(rates_hz.length ? rates_hz : [10])) * 1.25) / 5) * 5);

  const getX = (t: number) => margin.left + (t / (durationMs || 1)) * plotWidth;
  const getY = (r: number) => margin.top + plotHeight - (r / (maxRate || 1)) * plotHeight;

  // SVG Area and Line paths
  let lineD = '';
  let areaD = '';

  if (nBins > 0) {
    const firstX = getX(time_bins_ms[0]);
    const firstY = getY(rates_hz[0]);
    lineD = `M ${firstX.toFixed(1)} ${firstY.toFixed(1)}`;
    areaD = `M ${firstX.toFixed(1)} ${margin.top + plotHeight} L ${firstX.toFixed(1)} ${firstY.toFixed(1)}`;

    for (let i = 1; i < nBins; i++) {
      const x = getX(time_bins_ms[i]);
      const y = getY(rates_hz[i]);
      lineD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      areaD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }

    const lastX = getX(time_bins_ms[nBins - 1]);
    areaD += ` L ${lastX.toFixed(1)} ${margin.top + plotHeight} Z`;
  }

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    if (mouseX >= margin.left && mouseX <= margin.left + plotWidth && nBins > 0) {
      const ratio = (mouseX - margin.left) / plotWidth;
      const t = ratio * durationMs;
      // Find closest bin
      let closestIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < nBins; i++) {
        const diff = Math.abs(time_bins_ms[i] - t);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }
      setHoverIndex(closestIdx);
    } else {
      setHoverIndex(null);
    }
  };

  const yTicks = [0, maxRate * 0.25, maxRate * 0.5, maxRate * 0.75, maxRate];

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
          <TrendingUp size={16} color="#10b981" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc' }}>
            Population Average Firing Rate Over Time
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Bin width: <strong>{populationRate.bin_size_ms} ms</strong> · Metric:{' '}
          <span style={{ color: '#34d399' }}>Spikes / (N · Δt)</span>
        </div>
      </div>

      <svg
        width={containerWidth}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
        style={{ display: 'block', cursor: 'crosshair' }}
      >
        <defs>
          <linearGradient id="popRateGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect x={margin.left} y={margin.top} width={plotWidth} height={plotHeight} fill="#090d16" />

        {/* Horizontal grid lines */}
        {yTicks.map((val) => {
          const y = getY(val);
          return (
            <g key={val}>
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
                {Math.round(val)} Hz
              </text>
            </g>
          );
        })}

        {/* Time (X) ticks */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
          const t = frac * durationMs;
          const x = getX(t);
          return (
            <g key={frac}>
              <line
                x1={x}
                y1={margin.top}
                x2={x}
                y2={margin.top + plotHeight}
                stroke="#1e293b"
                strokeWidth={1}
              />
              <text
                x={x}
                y={margin.top + plotHeight + 16}
                fill="#64748b"
                fontSize={10}
                textAnchor="middle"
                fontFamily="ui-monospace, monospace"
              >
                {Math.round(t)} ms
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {areaD && <path d={areaD} fill="url(#popRateGradient)" />}

        {/* Line stroke */}
        {lineD && (
          <path
            d={lineD}
            fill="none"
            stroke="#10b981"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Hover marker */}
        {hoverIndex !== null && hoverIndex < nBins && (
          <g>
            <line
              x1={getX(time_bins_ms[hoverIndex])}
              y1={margin.top}
              x2={getX(time_bins_ms[hoverIndex])}
              y2={margin.top + plotHeight}
              stroke="#64748b"
              strokeDasharray="2 2"
            />
            <circle
              cx={getX(time_bins_ms[hoverIndex])}
              cy={getY(rates_hz[hoverIndex])}
              r={4}
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth={1.5}
            />
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
          Rate (Hz)
        </text>
      </svg>

      {/* Hover readout box */}
      {hoverIndex !== null && hoverIndex < nBins && (
        <div
          style={{
            position: 'absolute',
            right: '24px',
            top: '20px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #10b981',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '0.75rem',
            color: '#f8fafc',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          t = <strong>{Math.round(time_bins_ms[hoverIndex])} ms</strong> · Rate ={' '}
          <strong style={{ color: '#34d399' }}>{rates_hz[hoverIndex]} Hz</strong>
        </div>
      )}
    </div>
  );
};
