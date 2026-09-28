import React, { useMemo } from 'react';
import { useExplorer } from './ExplorerContext';
import { LightweightContextBar } from './LightweightContextBar';
import Plot from '../../components/PlotlyChart';
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  Zap,
} from 'lucide-react';

export const TrialInspectorView: React.FC = () => {
  const {
    activeProvenance,
    selectedRegion,
    setSelectedRegion,
    regions,
    selectedTrialId,
    setSelectedTrialId,
    pcaData,
    heatmapData,
    trialMetadata,
    normalization,
    setNormalization,
    maxNeurons,
    setMaxNeurons,
    loadingCharts,
  } = useExplorer();

  // All available trial IDs from PCA or default range
  const availableTrialIds = useMemo(() => {
    if (pcaData?.points && pcaData.points.length > 0) {
      return pcaData.points.map((p) => p.trial_id);
    }
    return Array.from({ length: 52 }, (_, i) => i + 1);
  }, [pcaData]);

  // Current trial index in availableTrialIds
  const currentTrialIndex = useMemo(() => {
    return availableTrialIds.findIndex((id) => String(id) === String(selectedTrialId));
  }, [availableTrialIds, selectedTrialId]);

  // Previous & Next Trial navigation
  const handlePrevTrial = () => {
    if (currentTrialIndex > 0) {
      setSelectedTrialId(availableTrialIds[currentTrialIndex - 1]);
    }
  };

  const handleNextTrial = () => {
    if (currentTrialIndex < availableTrialIds.length - 1 && currentTrialIndex >= 0) {
      setSelectedTrialId(availableTrialIds[currentTrialIndex + 1]);
    }
  };

  // Lightweight context metrics
  const trialIdStr = `Trial ${selectedTrialId}`;
  const activeStimulus = trialMetadata?.stimulus?.replace(/_/g, ' ') || 'drifting gratings';
  const activeRegion = selectedRegion || trialMetadata?.region || 'All Recorded Regions';
  const activeUnitsCount = heatmapData?.neuron_ids ? heatmapData.neuron_ids.length : 30;
  const trialDurationStr = trialMetadata?.duration ? `${trialMetadata.duration.toFixed(2)} s` : '2.00 s';

  // Base Plotly Layout
  const basePlotlyLayout = useMemo(() => {
    return {
      autosize: true,
      paper_bgcolor: 'transparent',
      plot_bgcolor: '#0a0f1d',
      font: {
        family: 'Inter, system-ui, -apple-system, sans-serif',
        size: 11,
        color: '#94a3b8',
      },
      margin: { t: 40, r: 28, b: 50, l: 70 },
      xaxis: {
        gridcolor: 'rgba(51, 65, 85, 0.35)',
        zerolinecolor: '#334155',
        tickfont: { color: '#94a3b8', size: 10 },
      },
      yaxis: {
        gridcolor: 'rgba(51, 65, 85, 0.35)',
        zerolinecolor: '#334155',
        tickfont: { color: '#94a3b8', size: 10 },
      },
    };
  }, []);

  // Prepare Heatmap Plot Data with smart label management
  const { heatmapPlotData, yAxisConfig } = useMemo(() => {
    if (!heatmapData || !heatmapData.matrix || heatmapData.matrix.length === 0) {
      return { heatmapPlotData: [], yAxisConfig: {} };
    }

    const nNeurons = heatmapData.neuron_ids.length;
    const neuronLabels = heatmapData.neuron_ids.map((id) => `U${id}`);

    // Smart label management: if nNeurons > 25, prevent label collision by downsampling visible ticks
    let yConfig: Record<string, any> = {
      title: { text: `Recorded Units (N=${nNeurons})`, font: { size: 11, color: '#94a3b8' } },
      autorange: 'reversed',
      tickfont: { color: '#94a3b8', size: nNeurons > 40 ? 8 : (nNeurons > 25 ? 9 : 10) },
    };

    if (nNeurons > 25) {
      const step = Math.ceil(nNeurons / 20);
      const tickvals: string[] = [];
      const ticktext: string[] = [];
      for (let i = 0; i < nNeurons; i += step) {
        tickvals.push(neuronLabels[i]);
        ticktext.push(neuronLabels[i]);
      }
      // Ensure last neuron is included
      if (tickvals[tickvals.length - 1] !== neuronLabels[nNeurons - 1]) {
        tickvals.push(neuronLabels[nNeurons - 1]);
        ticktext.push(neuronLabels[nNeurons - 1]);
      }
      yConfig.tickmode = 'array';
      yConfig.tickvals = tickvals;
      yConfig.ticktext = ticktext;
    }

    const data = [
      {
        z: heatmapData.matrix,
        x: heatmapData.time_bins,
        y: neuronLabels,
        type: 'heatmap' as const,
        colorscale: 'Viridis',
        colorbar: {
          title: {
            text:
              heatmapData.normalization === 'z-score'
                ? 'Z-Score'
                : heatmapData.normalization === 'min-max'
                ? 'Normalized'
                : 'Firing Rate (Hz)',
            side: 'right',
            font: { color: '#94a3b8', size: 10 },
          },
          tickfont: { color: '#94a3b8', size: 9 },
          len: 0.9,
          thickness: 14,
        },
        hoverongaps: false,
        hovertemplate: 'Neuron: %{y}<br>Time: %{x:.2f}s<br>Rate: %{z:.2f}<extra></extra>',
      },
    ];

    return { heatmapPlotData: data, yAxisConfig: yConfig };
  }, [heatmapData]);

  // Compute Single-Trial Statistics from Heatmap Matrix
  const trialStatistics = useMemo(() => {
    if (!heatmapData || !heatmapData.matrix || heatmapData.matrix.length === 0) {
      return { meanRate: 0, peakRate: 0, activePercent: 0 };
    }
    const flatRates = heatmapData.matrix.flat();
    const peak = Math.max(...flatRates);
    const mean = flatRates.reduce((a, b) => a + b, 0) / flatRates.length;
    const activeNeurons = heatmapData.matrix.filter((row) => row.some((v) => v > 0.5)).length;
    const activePct = Math.round((activeNeurons / heatmapData.matrix.length) * 100);

    return {
      meanRate: Number(mean.toFixed(2)),
      peakRate: Number(peak.toFixed(2)),
      activePercent: activePct,
    };
  }, [heatmapData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. Lightweight Contextual Bar */}
      <LightweightContextBar
        submoduleTitle="Trial Inspector"
        submoduleSubtitle="Fine-grained single trial raster & population firing rate matrix inspection"
        provenance={activeProvenance}
        items={[
          { label: 'Trial ID', value: trialIdStr, highlight: true, accentColor: '#facc15' },
          { label: 'Active Stimulus', value: activeStimulus, accentColor: '#38bdf8' },
          { label: 'Brain Region', value: activeRegion, accentColor: '#34d399' },
          { label: 'Active Units', value: `${activeUnitsCount} units` },
          { label: 'Trial Duration', value: trialDurationStr },
        ]}
      />

      {/* 2. Interactive Trial Navigation Toolbar */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Previous / Next Trial Fast Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={handlePrevTrial}
              disabled={currentTrialIndex <= 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: currentTrialIndex <= 0 ? '#1e293b' : '#334155',
                border: '1px solid #475569',
                color: currentTrialIndex <= 0 ? '#64748b' : '#f8fafc',
                cursor: currentTrialIndex <= 0 ? 'not-allowed' : 'pointer',
              }}
              title="Previous Trial"
            >
              <ChevronLeft size={18} />
            </button>

            <select
              value={selectedTrialId}
              onChange={(e) => setSelectedTrialId(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                minWidth: '180px',
              }}
            >
              {availableTrialIds.map((id) => (
                <option key={String(id)} value={id}>
                  Trial {id} {trialMetadata?.trial_id === id ? `(${trialMetadata.label})` : ''}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextTrial}
              disabled={currentTrialIndex >= availableTrialIds.length - 1 || currentTrialIndex < 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor:
                  currentTrialIndex >= availableTrialIds.length - 1 || currentTrialIndex < 0 ? '#1e293b' : '#334155',
                border: '1px solid #475569',
                color: currentTrialIndex >= availableTrialIds.length - 1 || currentTrialIndex < 0 ? '#64748b' : '#f8fafc',
                cursor: currentTrialIndex >= availableTrialIds.length - 1 || currentTrialIndex < 0 ? 'not-allowed' : 'pointer',
              }}
              title="Next Trial"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Region Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">All Regions ({regions.length})</option>
              {regions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* Normalization Mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Normalization:</span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {(['none', 'z-score', 'min-max'] as const).map((norm) => (
                <button
                  key={norm}
                  onClick={() => setNormalization(norm)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    border: '1px solid #334155',
                    backgroundColor: normalization === norm ? '#38bdf8' : '#1e293b',
                    color: normalization === norm ? '#020617' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {norm === 'none' ? 'Raw Hz' : norm}
                </button>
              ))}
            </div>
          </div>

          {/* Max Neurons Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Max Units:</span>
            <input
              type="range"
              min={10}
              max={100}
              step={10}
              value={maxNeurons}
              onChange={(e) => setMaxNeurons(Number(e.target.value))}
              style={{ width: '80px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.78rem', color: '#f8fafc', fontWeight: 600 }}>{maxNeurons}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Dominant Firing Rate Heatmap & Trial Analysis Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 0.8fr)', gap: '18px', alignItems: 'stretch' }}>
        
        {/* DOMINANT HEATMAP CONTAINER */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            minHeight: '560px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#818cf8" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                  Firing Rate Heatmap &bull; Trial {selectedTrialId}
                </h3>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Neural population raster matrix: {heatmapData?.neuron_ids.length || 0} units &times; {heatmapData?.time_bins.length || 0} time bins ({normalization} normalized)
              </p>
            </div>
            {loadingCharts.heatmap && (
              <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>
                Loading Heatmap...
              </span>
            )}
          </div>

          <div style={{ flex: 1, minHeight: '480px', width: '100%', position: 'relative' }}>
            {heatmapPlotData.length > 0 ? (
              <Plot
                data={heatmapPlotData}
                layout={{
                  ...basePlotlyLayout,
                  title: '',
                  xaxis: {
                    ...basePlotlyLayout.xaxis,
                    title: { text: 'Time from Trial Onset (seconds)', font: { size: 11, color: '#94a3b8' } },
                  },
                  yaxis: {
                    ...basePlotlyLayout.yaxis,
                    ...yAxisConfig,
                  },
                }}
                config={{ responsive: true, displayModeBar: true, displaylogo: false }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                {loadingCharts.heatmap ? 'Loading firing rate matrix...' : 'No heatmap data available for current selection'}
              </div>
            )}
          </div>
        </div>

        {/* TRIAL ANALYSIS PANEL & METADATA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Trial Statistics Card */}
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '18px 20px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Zap size={18} color="#facc15" />
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>
                Trial {selectedTrialId} Activity Metrics
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
              <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Mean Activity</span>
                <strong style={{ fontSize: '1rem', color: '#38bdf8' }}>{trialStatistics.meanRate} Hz</strong>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Peak Activity</span>
                <strong style={{ fontSize: '1rem', color: '#facc15' }}>{trialStatistics.peakRate} Hz</strong>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Active Units</span>
                <strong style={{ fontSize: '1rem', color: '#34d399' }}>{trialStatistics.activePercent}%</strong>
              </div>
            </div>
          </div>

          {/* Trial Parameters & Metadata Card */}
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '18px 20px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
              flex: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Info size={18} color="#38bdf8" />
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>
                Trial Analysis & Parameter Table
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8' }}>Trial ID</span>
                <strong style={{ color: '#facc15' }}>{selectedTrialId}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8' }}>Stimulus Protocol</span>
                <strong style={{ color: '#38bdf8' }}>{trialMetadata?.stimulus || 'drifting_gratings'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8' }}>Trial Condition / Label</span>
                <strong style={{ color: '#f8fafc' }}>{trialMetadata?.label || `trial_${selectedTrialId}`}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8' }}>Brain Region</span>
                <strong style={{ color: '#34d399' }}>{trialMetadata?.region || selectedRegion || 'VISp'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8' }}>Active Units in Trial</span>
                <strong style={{ color: '#f8fafc' }}>{activeUnitsCount} units</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8' }}>Trial Duration</span>
                <strong style={{ color: '#f8fafc' }}>{trialDurationStr}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8' }}>Onset / Offset Time</span>
                <strong style={{ color: '#cbd5e1' }}>
                  {trialMetadata ? `${trialMetadata.start_time.toFixed(2)}s - ${trialMetadata.stop_time.toFixed(2)}s` : '0.00s - 2.00s'}
                </strong>
              </div>
            </div>

            {/* Stimulus Parameters Table */}
            {trialMetadata?.parameters && Object.keys(trialMetadata.parameters).length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                  Stimulus Parameters
                </span>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <tbody>
                    {Object.entries(trialMetadata.parameters).map(([key, val]) => (
                      <tr key={key} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '4px 0', color: '#94a3b8', textTransform: 'capitalize' }}>
                          {key.replace(/_/g, ' ')}
                        </td>
                        <td style={{ padding: '4px 0', textAlign: 'right', color: '#38bdf8', fontWeight: 600 }}>
                          {String(val)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
