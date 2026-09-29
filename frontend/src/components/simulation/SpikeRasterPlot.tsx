import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SpikeEvent } from '../../types';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface SpikeRasterPlotProps {
  spikeEvents: SpikeEvent[];
  neuronIds: number[];
  durationMs: number;
  selectedNeuronId: number;
  onSelectNeuron: (neuronId: number) => void;
  height?: number;
}

export const SpikeRasterPlot: React.FC<SpikeRasterPlotProps> = ({
  spikeEvents,
  neuronIds,
  durationMs,
  selectedNeuronId,
  onSelectNeuron,
  height = 340,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [hoveredNeuron, setHoveredNeuron] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number; timeMs: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [timeOffsetMs, setTimeOffsetMs] = useState<number>(0);

  // Margins for axes
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };

  // Observe container size
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

  const totalNeurons = Math.max(neuronIds.length, 1);
  const plotWidth = Math.max(100, containerWidth - margin.left - margin.right);
  const plotHeight = Math.max(100, height - margin.top - margin.bottom);

  // Visible time window
  const visibleDuration = durationMs / zoomLevel;
  const startTime = Math.max(0, Math.min(timeOffsetMs, durationMs - visibleDuration));
  const endTime = Math.min(durationMs, startTime + visibleDuration);

  // Coordinate transforms
  const timeToX = useCallback(
    (t: number) => {
      return margin.left + ((t - startTime) / (endTime - startTime || 1)) * plotWidth;
    },
    [startTime, endTime, plotWidth, margin.left]
  );

  const neuronToY = useCallback(
    (neuronIndex: number) => {
      return margin.top + (neuronIndex / totalNeurons) * plotHeight;
    },
    [totalNeurons, plotHeight, margin.top]
  );

  const yToNeuron = useCallback(
    (y: number) => {
      const clampedY = Math.max(margin.top, Math.min(margin.top + plotHeight, y));
      const ratio = (clampedY - margin.top) / plotHeight;
      const index = Math.min(totalNeurons - 1, Math.floor(ratio * totalNeurons));
      return neuronIds[index] ?? index;
    },
    [margin.top, plotHeight, totalNeurons, neuronIds]
  );

  // Render on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, containerWidth, height);

    // Plot area background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(margin.left, margin.top, plotWidth, plotHeight);

    // Grid lines - Time (vertical)
    const tickCount = Math.max(4, Math.floor(plotWidth / 90));
    const timeStep = (endTime - startTime) / tickCount;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';

    for (let i = 0; i <= tickCount; i++) {
      const t = startTime + i * timeStep;
      const x = timeToX(t);
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + plotHeight);
      ctx.stroke();

      // Time label
      ctx.fillText(`${Math.round(t)} ms`, x, margin.top + plotHeight + 18);
    }

    // Grid lines - Neurons (horizontal)
    const yTickCount = Math.min(totalNeurons, 5);
    const neuronStep = Math.max(1, Math.floor(totalNeurons / yTickCount));
    ctx.textAlign = 'right';
    for (let i = 0; i <= totalNeurons; i += neuronStep) {
      const y = neuronToY(i);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotWidth, y);
      ctx.stroke();

      // Neuron label
      const nid = neuronIds[Math.min(i, totalNeurons - 1)] ?? i;
      ctx.fillText(`N#${nid}`, margin.left - 8, y + 4);
    }

    // Selected Neuron Highlight Band
    const selectedIndex = neuronIds.indexOf(selectedNeuronId);
    if (selectedIndex !== -1) {
      const rowHeight = Math.max(3, plotHeight / totalNeurons);
      const selY = neuronToY(selectedIndex);

      // Glowing banner
      ctx.fillStyle = 'rgba(14, 165, 233, 0.18)';
      ctx.fillRect(margin.left, selY - rowHeight * 0.4, plotWidth, rowHeight * 1.8);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(margin.left, selY - rowHeight * 0.4, plotWidth, rowHeight * 1.8);
    }

    // Hovered Neuron Highlight Band
    if (hoveredNeuron !== null && hoveredNeuron !== selectedNeuronId) {
      const hoverIndex = neuronIds.indexOf(hoveredNeuron);
      if (hoverIndex !== -1) {
        const rowHeight = Math.max(3, plotHeight / totalNeurons);
        const hY = neuronToY(hoverIndex);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(margin.left, hY - rowHeight * 0.3, plotWidth, rowHeight * 1.6);
      }
    }

    // Draw Spikes
    // Clip to plot area
    ctx.save();
    ctx.beginPath();
    ctx.rect(margin.left, margin.top, plotWidth, plotHeight);
    ctx.clip();

    const spikeHeight = Math.max(2.5, Math.min(10, (plotHeight / totalNeurons) * 0.9));

    // Fast rendering: regular spikes first
    ctx.fillStyle = '#94a3b8';
    for (const ev of spikeEvents) {
      if (ev.time_ms < startTime || ev.time_ms > endTime) continue;
      if (ev.neuron_id === selectedNeuronId) continue; // draw selected later for emphasis

      const nIdx = neuronIds.indexOf(ev.neuron_id);
      if (nIdx === -1) continue;

      const x = timeToX(ev.time_ms);
      const y = neuronToY(nIdx);
      ctx.fillRect(x - 0.75, y - spikeHeight / 2, 1.5, spikeHeight);
    }

    // Selected neuron spikes rendered on top with vivid vibrant cyan glow
    if (selectedNeuronId !== undefined) {
      const selIdx = neuronIds.indexOf(selectedNeuronId);
      if (selIdx !== -1) {
        const selY = neuronToY(selIdx);
        const selSpikeHeight = Math.max(4, spikeHeight * 1.5);

        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 6;

        for (const ev of spikeEvents) {
          if (ev.neuron_id !== selectedNeuronId) continue;
          if (ev.time_ms < startTime || ev.time_ms > endTime) continue;

          const x = timeToX(ev.time_ms);
          ctx.fillRect(x - 1.25, selY - selSpikeHeight / 2, 2.5, selSpikeHeight);
        }
        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();

    // Plot Border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(margin.left, margin.top, plotWidth, plotHeight);

    // Axis titles
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Time (ms)', margin.left + plotWidth / 2, height - 8);

    ctx.save();
    ctx.translate(14, margin.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Neuron Index', 0, 0);
    ctx.restore();

    ctx.restore();
  }, [
    containerWidth,
    height,
    spikeEvents,
    neuronIds,
    durationMs,
    selectedNeuronId,
    hoveredNeuron,
    startTime,
    endTime,
    totalNeurons,
    plotWidth,
    plotHeight,
    timeToX,
    neuronToY,
    margin.left,
    margin.top,
    margin.bottom,
    margin.right,
  ]);

  // Click handler to select neuron
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickY = e.clientY - rect.top;
    const clickedNeuron = yToNeuron(clickY);
    onSelectNeuron(clickedNeuron);
  };

  // Mouse move for hover tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (
      mouseX >= margin.left &&
      mouseX <= margin.left + plotWidth &&
      mouseY >= margin.top &&
      mouseY <= margin.top + plotHeight
    ) {
      const nid = yToNeuron(mouseY);
      const ratio = (mouseX - margin.left) / plotWidth;
      const t = startTime + ratio * (endTime - startTime);
      setHoveredNeuron(nid);
      setHoverPos({ x: mouseX, y: mouseY, timeMs: Math.round(t) });
    } else {
      setHoveredNeuron(null);
      setHoverPos(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredNeuron(null);
    setHoverPos(null);
  };

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
          marginBottom: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc' }}>
              Population Spike Raster Plot
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              {spikeEvents.length.toLocaleString()} spikes emitted
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
            Click anywhere on the raster to inspect a neuron. Highlighted in cyan: Neuron #{selectedNeuronId}.
          </p>
        </div>

        {/* Zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setZoomLevel((z) => Math.min(8.0, z * 1.5))}
            title="Zoom In"
            style={{
              padding: '6px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(1.0, z / 1.5))}
            title="Zoom Out"
            style={{
              padding: '6px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1.0);
              setTimeOffsetMs(0);
            }}
            title="Reset Zoom"
            style={{
              padding: '6px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            cursor: 'crosshair',
            display: 'block',
            borderRadius: '6px',
          }}
        />

        {/* Hover Tooltip */}
        {hoverPos && (
          <div
            style={{
              position: 'absolute',
              left: `${hoverPos.x + 12}px`,
              top: `${hoverPos.y - 30}px`,
              pointerEvents: 'none',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid #38bdf8',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              color: '#f8fafc',
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
            }}
          >
            <strong>Neuron #{hoveredNeuron}</strong> · t = {hoverPos.timeMs} ms
          </div>
        )}
      </div>
    </div>
  );
};
