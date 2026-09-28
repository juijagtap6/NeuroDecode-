import React, { useMemo } from 'react';
import { useExplorer } from './ExplorerContext';
import { LightweightContextBar } from './LightweightContextBar';
import Plot from '../../components/PlotlyChart';
import {
  Activity,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

export const PopulationActivityView: React.FC = () => {
  const {
    selectedSessionId,
    activeProvenance,
    currentSession,
    sessionMetadata,
    regions,
    selectedRegion,
    setSelectedRegion,
    stimuli,
    selectedStimulus,
    setSelectedStimulus,
    selectedTrialId,
    setSelectedTrialId,
    pcaDimensions,
    setPcaDimensions,
    pcX,
    pcY,
    smoothingWindow,
    setSmoothingWindow,
    averagingMethod,
    setAveragingMethod,
    pcaData,
    populationTraceData,
    loadingCharts,
    selectTrialAndInspect,
  } = useExplorer();

  // Lightweight context metrics
  const unitsIncluded = sessionMetadata?.total_units || currentSession?.unit_count || 120;
  const trialsIncluded = pcaData?.points?.length || sessionMetadata?.total_trials || currentSession?.total_trials || 52;
  const activeRegionLabel = selectedRegion || 'All Recorded Regions';
  const activeStimulusLabel = selectedStimulus ? selectedStimulus.replace(/_/g, ' ') : 'All Stimuli Protocols';

  // Base Plotly Dark Theme
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
      margin: { t: 40, r: 24, b: 48, l: 56 },
      xaxis: {
        gridcolor: 'rgba(51, 65, 85, 0.4)',
        zerolinecolor: '#334155',
        tickfont: { color: '#94a3b8', size: 10 },
      },
      yaxis: {
        gridcolor: 'rgba(51, 65, 85, 0.4)',
        zerolinecolor: '#334155',
        tickfont: { color: '#94a3b8', size: 10 },
      },
    };
  }, []);

  // PCA Plot Traces
  const pcaPlotData = useMemo(() => {
    if (!pcaData || !pcaData.points || pcaData.points.length === 0) return [];

    const stimulusGroups: Record<string, { x: number[]; y: number[]; text: string[]; trialIds: (string | number)[] }> = {};

    pcaData.points.forEach((p) => {
      const groupKey = p.stimulus || 'other';
      if (!stimulusGroups[groupKey]) {
        stimulusGroups[groupKey] = { x: [], y: [], text: [], trialIds: [] };
      }
      stimulusGroups[groupKey].x.push(p.x);
      stimulusGroups[groupKey].y.push(p.y);
      stimulusGroups[groupKey].text.push(
        `<b>Trial ${p.trial_id}</b><br>Stimulus: ${p.stimulus.replace(/_/g, ' ')}<br>Condition: ${p.label}<br>Region: ${p.region}<br>PC${pcX}: ${p.x.toFixed(2)}, PC${pcY}: ${p.y.toFixed(2)}`
      );
      stimulusGroups[groupKey].trialIds.push(p.trial_id);
    });

    const traces: any[] = [];
    const colorPalette = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#f87171'];
    let colorIdx = 0;

    Object.entries(stimulusGroups).forEach(([stimName, grp]) => {
      traces.push({
        x: grp.x,
        y: grp.y,
        text: grp.text,
        customdata: grp.trialIds,
        mode: 'markers',
        type: 'scatter',
        name: stimName.replace(/_/g, ' '),
        marker: {
          size: 10,
          color: colorPalette[colorIdx % colorPalette.length],
          opacity: 0.85,
          line: { color: '#ffffff', width: 0.75 },
        },
        hoverinfo: 'text',
      });
      colorIdx++;
    });

    // Active Selected Trial Highlight Ring
    const activePoint = pcaData.points.find((p) => String(p.trial_id) === String(selectedTrialId));
    if (activePoint) {
      traces.push({
        x: [activePoint.x],
        y: [activePoint.y],
        mode: 'markers',
        type: 'scatter',
        name: `Selected: Trial ${activePoint.trial_id}`,
        marker: {
          size: 18,
          color: 'transparent',
          line: {
            color: '#facc15',
            width: 3.5,
          },
          symbol: 'circle',
        },
        hoverinfo: 'skip',
        showlegend: false,
      });
    }

    return traces;
  }, [pcaData, selectedTrialId, pcX, pcY]);

  // Population Trace Plot Traces
  const tracePlotData = useMemo(() => {
    if (!populationTraceData || !populationTraceData.timestamps || populationTraceData.timestamps.length === 0) return [];

    const traces: any[] = [];
    const t = populationTraceData.timestamps;
    const mean = populationTraceData.mean_firing_rate;
    const sem = populationTraceData.sem_firing_rate;

    // SEM shaded error ribbon
    if (sem && sem.length === t.length) {
      const upper = mean.map((m, i) => m + sem[i]);
      const lower = mean.map((m, i) => Math.max(0, m - sem[i]));

      traces.push({
        x: [...t, ...t.slice().reverse()],
        y: [...upper, ...lower.slice().reverse()],
        fill: 'toself',
        fillcolor: 'rgba(56, 189, 248, 0.15)',
        line: { color: 'transparent' },
        name: '± 1 SEM Dispersion',
        showlegend: true,
        type: 'scatter',
        hoverinfo: 'skip',
      });
    }

    // Mean / Median Population Trace Line
    traces.push({
      x: t,
      y: mean,
      mode: 'lines',
      type: 'scatter',
      name: `${populationTraceData.averaging_method === 'median' ? 'Median' : 'Mean'} Rate`,
      line: {
        color: '#38bdf8',
        width: 2.5,
      },
      hovertemplate: 'Time: %{x:.2f}s<br>Rate: %{y:.2f} Hz<extra></extra>',
    });

    return traces;
  }, [populationTraceData]);

  // Population Statistics calculation
  const populationStats = useMemo(() => {
    if (!populationTraceData || !populationTraceData.mean_firing_rate || populationTraceData.mean_firing_rate.length === 0) {
      return {
        peakRate: 0,
        baselineRate: 0,
        dynamicRange: 0,
        meanRate: 0,
        semAverage: 0,
      };
    }
    const rates = populationTraceData.mean_firing_rate;
    const peak = Math.max(...rates);
    // Baseline: first 15% of timestamps or first 3 bins
    const baselineLen = Math.max(1, Math.floor(rates.length * 0.15));
    const baseline = rates.slice(0, baselineLen).reduce((a, b) => a + b, 0) / baselineLen;
    const meanAll = rates.reduce((a, b) => a + b, 0) / rates.length;
    const semAvg =
      populationTraceData.sem_firing_rate && populationTraceData.sem_firing_rate.length > 0
        ? populationTraceData.sem_firing_rate.reduce((a, b) => a + b, 0) / populationTraceData.sem_firing_rate.length
        : 0;

    return {
      peakRate: Number(peak.toFixed(2)),
      baselineRate: Number(baseline.toFixed(2)),
      dynamicRange: Number(Math.max(0, peak - baseline).toFixed(2)),
      meanRate: Number(meanAll.toFixed(2)),
      semAverage: Number(semAvg.toFixed(2)),
    };
  }, [populationTraceData]);

  // Click on PCA scatter point selects trial
  const handlePcaPointClick = (event: any) => {
    if (!event || !event.points || event.points.length === 0) return;
    const pt = event.points[0];
    const clickedTrialId = pt.customdata ?? pt.pointIndex + 1;
    if (clickedTrialId !== undefined) {
      setSelectedTrialId(clickedTrialId);
    }
  };

  const pcXVariance = pcaData?.explained_variance_ratio?.[pcX - 1]
    ? (pcaData.explained_variance_ratio[pcX - 1] * 100).toFixed(1)
    : '0.0';
  const pcYVariance = pcaData?.explained_variance_ratio?.[pcY - 1]
    ? (pcaData.explained_variance_ratio[pcY - 1] * 100).toFixed(1)
    : '0.0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. Lightweight Contextual Bar */}
      <LightweightContextBar
        submoduleTitle="Population Activity"
        submoduleSubtitle="State-space neural trajectories and population firing rate dynamics"
        provenance={activeProvenance}
        items={[
          { label: 'Active Session', value: selectedSessionId, highlight: true },
          { label: 'Selected Brain Region', value: activeRegionLabel, accentColor: '#34d399' },
          { label: 'Selected Stimulus', value: activeStimulusLabel, accentColor: '#818cf8' },
          { label: 'Units Included', value: `${unitsIncluded} units` },
          { label: 'Trials Included', value: `${trialsIncluded} trials` },
        ]}
      />

      {/* 2. Compact Control Toolbar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* PCA Dimension Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>PCA Plane:</span>
            <select
              value={pcaDimensions}
              onChange={(e) => setPcaDimensions(e.target.value as any)}
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
              <option value="1_2">PC1 vs PC2 (Primary Trajectory)</option>
              <option value="1_3">PC1 vs PC3</option>
              <option value="2_3">PC2 vs PC3</option>
            </select>
          </div>

          {/* Brain Region Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

          {/* Stimulus Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Stimulus:</span>
            <select
              value={selectedStimulus}
              onChange={(e) => setSelectedStimulus(e.target.value)}
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
              <option value="">All Protocols ({stimuli.length})</option>
              {stimuli.map((stim) => (
                <option key={stim} value={stim}>
                  {stim.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Smoothing window */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Trace Smoothing:</span>
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={smoothingWindow}
              onChange={(e) => setSmoothingWindow(Number(e.target.value))}
              style={{ width: '70px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>
              {smoothingWindow > 0 ? `${smoothingWindow} bins` : 'Off'}
            </span>
          </div>

          {/* Averaging method */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Aggregation:</span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {(['mean', 'median'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setAveragingMethod(m)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #334155',
                    backgroundColor: averagingMethod === m ? '#818cf8' : '#1e293b',
                    color: averagingMethod === m ? '#020617' : '#94a3b8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected trial jump button */}
        {selectedTrialId && (
          <button
            onClick={() => selectTrialAndInspect(selectedTrialId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>Inspect Trial {selectedTrialId} in Trial Inspector</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* 3. Visualizations Area: Dominant PCA & Population Trace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 0.95fr)', gap: '18px', alignItems: 'stretch' }}>
        
        {/* COMPONENT 1: PCA Trial Projection (Dominant Primary Space) */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            minHeight: '520px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                  PCA Neural Population State-Space Projection
                </h3>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Principal Component {pcX} ({pcXVariance}%) vs Principal Component {pcY} ({pcYVariance}%) &bull; Click any point to select trial
              </p>
            </div>
            {loadingCharts.pca && (
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                Computing PCA...
              </span>
            )}
          </div>

          <div style={{ flex: 1, minHeight: '440px', width: '100%', position: 'relative' }}>
            {pcaPlotData.length > 0 ? (
              <Plot
                data={pcaPlotData}
                layout={{
                  ...basePlotlyLayout,
                  title: '',
                  xaxis: {
                    ...basePlotlyLayout.xaxis,
                    title: {
                      text: `Principal Component ${pcX} (${pcXVariance}% explained variance)`,
                      font: { size: 11, color: '#94a3b8' },
                    },
                  },
                  yaxis: {
                    ...basePlotlyLayout.yaxis,
                    title: {
                      text: `Principal Component ${pcY} (${pcYVariance}% explained variance)`,
                      font: { size: 11, color: '#94a3b8' },
                    },
                  },
                  legend: {
                    orientation: 'h',
                    y: 1.12,
                    x: 0,
                    font: { size: 10, color: '#cbd5e1' },
                  },
                  hovermode: 'closest',
                }}
                config={{ responsive: true, displayModeBar: true, displaylogo: false }}
                onClick={handlePcaPointClick}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                {loadingCharts.pca ? 'Computing PCA projection server-side...' : 'No PCA trajectory data available for current selection'}
              </div>
            )}
          </div>
        </div>

        {/* COMPONENT 2: Population Mean Trace & Population Statistics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Population Mean Trace */}
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
              minHeight: '340px',
              flex: 1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="#34d399" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                    Population Firing Rate Dynamics
                  </h3>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Population {averagingMethod} rate with ±1 SEM error ribbon ({smoothingWindow > 0 ? `${smoothingWindow}-bin moving average` : 'unfiltered'})
                </p>
              </div>
              {loadingCharts.trace && (
                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                  Computing Trace...
                </span>
              )}
            </div>

            <div style={{ flex: 1, minHeight: '260px', width: '100%', position: 'relative' }}>
              {tracePlotData.length > 0 ? (
                <Plot
                  data={tracePlotData}
                  layout={{
                    ...basePlotlyLayout,
                    title: '',
                    xaxis: {
                      ...basePlotlyLayout.xaxis,
                      title: { text: 'Time from Trial Onset (seconds)', font: { size: 10, color: '#94a3b8' } },
                    },
                    yaxis: {
                      ...basePlotlyLayout.yaxis,
                      title: { text: 'Population Firing Rate (Hz)', font: { size: 10, color: '#94a3b8' } },
                    },
                    legend: {
                      orientation: 'h',
                      y: 1.15,
                      x: 0,
                      font: { size: 9, color: '#cbd5e1' },
                    },
                  }}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  {loadingCharts.trace ? 'Calculating population dynamics...' : 'No population trace available'}
                </div>
              )}
            </div>
          </div>

          {/* Population Statistics Panel */}
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '16px 20px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
              Population Activity Statistics
            </span>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
              }}
            >
              <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Peak Firing Rate</span>
                <strong style={{ fontSize: '1rem', color: '#38bdf8' }}>{populationStats.peakRate} Hz</strong>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Baseline Rate</span>
                <strong style={{ fontSize: '1rem', color: '#94a3b8' }}>{populationStats.baselineRate} Hz</strong>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Evoked Amplitude</span>
                <strong style={{ fontSize: '1rem', color: '#34d399' }}>{populationStats.dynamicRange} Hz</strong>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Mean Activity</span>
                <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>{populationStats.meanRate} Hz</strong>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Mean SEM</span>
                <strong style={{ fontSize: '1rem', color: '#818cf8' }}>± {populationStats.semAverage} Hz</strong>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
