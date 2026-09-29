import React, { useState } from 'react';
import { useComparison } from './ComparisonContext';
import {
  Orbit,
  BarChart2,
  TrendingUp,
  Brain,
  Sparkles,
  AlertTriangle,
  Award,
} from 'lucide-react';

export const PopulationComparisonView: React.FC = () => {
  const { populationData, loading, error, refreshComparison } = useComparison();
  const [hoveredPointA, setHoveredPointA] = useState<number | null>(null);
  const [hoveredPointB, setHoveredPointB] = useState<number | null>(null);

  if (loading && !populationData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <p>Computing population dynamics and dimensionality reductions...</p>
      </div>
    );
  }

  if (error || !populationData) {
    return (
      <div style={{
        padding: '32px',
        backgroundColor: '#1e1b2e',
        borderRadius: '10px',
        border: '1px solid #7f1d1d',
        color: '#fca5a5',
        textAlign: 'center',
      }}>
        <AlertTriangle size={32} color="#ef4444" style={{ margin: '0 auto 12px auto' }} />
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#f87171' }}>Population Dynamics Unavailable</h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
          {error || 'Unable to retrieve population comparison analytics.'}
        </p>
        <button
          onClick={refreshComparison}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    dataset_a_name,
    dataset_b_name,
    pca_a,
    pca_b,
    stats_a,
    stats_b,
    distribution_a,
    distribution_b,
    region_activity,
    similarity,
    population_summary,
  } = populationData;

  // Find most active and largest difference region
  let mostActiveRegion = 'VISp';
  let highestRate = 0;
  let largestDiffRegion = 'CA1';
  let maxAbsDiff = 0;

  region_activity.forEach((ra) => {
    const rateA = ra.mean_firing_rate_a || 0;
    const rateB = ra.mean_firing_rate_b || 0;
    const maxR = Math.max(rateA, rateB);
    if (maxR > highestRate) {
      highestRate = maxR;
      mostActiveRegion = ra.region;
    }
    const diff = Math.abs(ra.delta_rate !== null && ra.delta_rate !== undefined ? ra.delta_rate : 0);
    if (diff > maxAbsDiff) {
      maxAbsDiff = diff;
      largestDiffRegion = ra.region;
    }
  });

  // Render large, dominant scientific PCA manifold figure
  const renderEnlargedPCAPlot = (
    pca: typeof pca_a,
    primaryColor: string,
    accentColor: string,
    hoveredIdx: number | null,
    setHoveredIdx: (idx: number | null) => void,
    title: string
  ) => {
    const pts = pca.points;
    if (!pts || pts.length === 0) {
      return <div style={{ color: '#94a3b8', padding: '20px' }}>No PCA coordinates available.</div>;
    }

    const pc1Vals = pts.map((p) => p.pc1);
    const pc2Vals = pts.map((p) => p.pc2);

    const minX = Math.min(...pc1Vals);
    const maxX = Math.max(...pc1Vals);
    const minY = Math.min(...pc2Vals);
    const maxY = Math.max(...pc2Vals);

    const padX = (maxX - minX) * 0.15 || 1.0;
    const padY = (maxY - minY) * 0.15 || 1.0;

    const domainX = [minX - padX, maxX + padX];
    const domainY = [minY - padY, maxY + padY];

    const width = 600;
    const height = 380;
    const margin = { top: 25, right: 25, bottom: 45, left: 55 };

    const scaleX = (val: number) =>
      margin.left + ((val - domainX[0]) / (domainX[1] - domainX[0])) * (width - margin.left - margin.right);
    const scaleY = (val: number) =>
      height - margin.bottom - ((val - domainY[0]) / (domainY[1] - domainY[0])) * (height - margin.top - margin.bottom);

    const pathD = pts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(p.pc1).toFixed(1)} ${scaleY(p.pc2).toFixed(1)}`)
      .join(' ');

    return (
      <div style={{ position: 'relative', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <strong style={{ color: '#f8fafc', fontSize: '1rem' }}>{title}</strong>
            <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem' }}>
              Neural state space trajectory projection ($PC_1$ vs $PC_2$)
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: primaryColor,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '3px 8px',
              borderRadius: '4px',
              border: `1px solid ${primaryColor}40`,
            }}>
              PC1: {Math.round(pca.explained_variance_ratio[0] * 100)}%
            </span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: accentColor,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '3px 8px',
              borderRadius: '4px',
              border: `1px solid ${accentColor}40`,
            }}>
              PC2: {Math.round(pca.explained_variance_ratio[1] * 100)}%
            </span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#f8fafc',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '3px 8px',
              borderRadius: '4px',
            }}>
              2D Manifold: {Math.round(pca.total_variance_explained_2d * 100)}%
            </span>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '420px',
            backgroundColor: '#090d16',
            borderRadius: '8px',
            border: '1px solid #1e293b',
          }}
        >
          {/* Subtle Grid lines */}
          {[-1, -0.5, 0, 0.5, 1].map((step, i) => {
            const yPos = scaleY(step * (maxY || 1));
            return (
              <line
                key={`grid-y-${i}`}
                x1={margin.left}
                y1={yPos}
                x2={width - margin.right}
                y2={yPos}
                stroke="#1e293b"
                strokeDasharray="3 3"
              />
            );
          })}
          {[-1, -0.5, 0, 0.5, 1].map((step, i) => {
            const xPos = scaleX(step * (maxX || 1));
            return (
              <line
                key={`grid-x-${i}`}
                x1={xPos}
                y1={margin.top}
                x2={xPos}
                y2={height - margin.bottom}
                stroke="#1e293b"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Zero Axis lines */}
          <line
            x1={margin.left}
            y1={scaleY(0)}
            x2={width - margin.right}
            y2={scaleY(0)}
            stroke="#334155"
            strokeDasharray="4 4"
          />
          <line
            x1={scaleX(0)}
            y1={margin.top}
            x2={scaleX(0)}
            y2={height - margin.bottom}
            stroke="#334155"
            strokeDasharray="4 4"
          />

          {/* Axes */}
          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            stroke="#475569"
            strokeWidth="1.5"
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 12}
            fill="#cbd5e1"
            fontSize="12"
            textAnchor="middle"
            fontWeight="700"
          >
            Principal Component 1 ({Math.round(pca.explained_variance_ratio[0] * 100)}% Variance)
          </text>
          <text
            x={-height / 2}
            y={18}
            fill="#cbd5e1"
            fontSize="12"
            textAnchor="middle"
            transform="rotate(-90)"
            fontWeight="700"
          >
            Principal Component 2 ({Math.round(pca.explained_variance_ratio[1] * 100)}% Variance)
          </text>

          {/* Gradient Trajectory Path */}
          <path
            d={pathD}
            fill="none"
            stroke={primaryColor}
            strokeWidth="2.5"
            strokeOpacity="0.85"
          />

          {/* Temporal Scatter Points */}
          {pts.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            const progress = idx / pts.length;
            return (
              <circle
                key={`pt-${idx}`}
                cx={scaleX(p.pc1)}
                cy={scaleY(p.pc2)}
                r={isHovered ? 7.5 : 4.5}
                fill={isHovered ? '#fff' : primaryColor}
                fillOpacity={0.35 + progress * 0.65}
                stroke={isHovered ? accentColor : '#090d16'}
                strokeWidth={isHovered ? 2.5 : 1}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
              >
                <title>{`${p.label || `t=${idx}`}: PC1=${p.pc1.toFixed(2)}, PC2=${p.pc2.toFixed(2)}`}</title>
              </circle>
            );
          })}
        </svg>

        {hoveredIdx !== null && pts[hoveredIdx] && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            color: '#f8fafc',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
          }}>
            <strong>{pts[hoveredIdx].label}</strong>: PC1 = {pts[hoveredIdx].pc1.toFixed(3)}, PC2 = {pts[hoveredIdx].pc2.toFixed(3)}
          </div>
        )}
      </div>
    );
  };

  const meanDiff = Math.round((stats_b.mean_firing_rate - stats_a.mean_firing_rate) * 100) / 100;
  const medianDiff = Math.round((stats_b.median_firing_rate - stats_a.median_firing_rate) * 100) / 100;
  const peakDiff = Math.round((stats_b.peak_firing_rate - stats_a.peak_firing_rate) * 100) / 100;
  const activePctDiff = Math.round((stats_b.active_neuron_pct - stats_a.active_neuron_pct) * 10) / 10;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 0. TOP-LEVEL POPULATION SIMILARITY SCORE CARD */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
            }}>
              <Award size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>OVERALL COMPOSITE METRIC</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  {similarity ? `${similarity.overall_similarity_pct}%` : '0%'}
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399' }}>
                  Population Similarity Index
                </span>
              </div>
            </div>
          </div>
          <span style={{
            fontSize: '0.75rem',
            color: '#cbd5e1',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            padding: '6px 12px',
            borderRadius: '6px',
            maxWidth: '440px',
            lineHeight: '1.4',
          }}>
            Multi-dimensional composite: 25% Region Jaccard + 20% PCA Manifold + 20% Firing Rate + 20% Population Scale + 15% Stimulus Concordance.
          </span>
        </div>

        {/* Sub-Score Breakdown Bars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          backgroundColor: '#1e293b',
          padding: '14px',
          borderRadius: '8px',
        }}>
          {/* Sub 1: PCA Manifold */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>PCA Manifold Match</span>
              <strong style={{ color: '#38bdf8' }}>{similarity?.pca_similarity_pct ?? 0}%</strong>
            </div>
            <div style={{ height: '6px', backgroundColor: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${similarity?.pca_similarity_pct ?? 0}%`, height: '100%', backgroundColor: '#38bdf8' }} />
            </div>
          </div>

          {/* Sub 2: Region Overlap */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Anatomical Overlap</span>
              <strong style={{ color: '#a78bfa' }}>{similarity?.region_overlap_pct ?? 0}%</strong>
            </div>
            <div style={{ height: '6px', backgroundColor: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${similarity?.region_overlap_pct ?? 0}%`, height: '100%', backgroundColor: '#a78bfa' }} />
            </div>
          </div>

          {/* Sub 3: Rate Alignment */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Rate Excitability Match</span>
              <strong style={{ color: '#34d399' }}>{similarity?.rate_similarity_pct ?? 0}%</strong>
            </div>
            <div style={{ height: '6px', backgroundColor: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${similarity?.rate_similarity_pct ?? 0}%`, height: '100%', backgroundColor: '#34d399' }} />
            </div>
          </div>

          {/* Sub 4: Scale Similarity */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Neuron Scale Match</span>
              <strong style={{ color: '#f472b6' }}>{similarity?.scale_similarity_pct ?? 0}%</strong>
            </div>
            <div style={{ height: '6px', backgroundColor: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${similarity?.scale_similarity_pct ?? 0}%`, height: '100%', backgroundColor: '#f472b6' }} />
            </div>
          </div>

          {/* Sub 5: Stimulus Overlap */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Stimulus Concordance</span>
              <strong style={{ color: '#fbbf24' }}>{similarity?.stimulus_overlap_pct ?? 0}%</strong>
            </div>
            <div style={{ height: '6px', backgroundColor: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${similarity?.stimulus_overlap_pct ?? 0}%`, height: '100%', backgroundColor: '#fbbf24' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 1. ENLARGED SIDE-BY-SIDE PCA COMPARISON (VISUALLY DOMINANT) */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Orbit size={22} color="#38bdf8" />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              Neural Population Dimensionality & State Space Dynamics (PCA)
            </h2>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Full-width low-dimensional manifold trajectories
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '8px',
            border: '1px solid #334155',
            padding: '18px',
          }}>
            {renderEnlargedPCAPlot(
              pca_a,
              '#3b82f6',
              '#60a5fa',
              hoveredPointA,
              setHoveredPointA,
              `Dataset A: ${dataset_a_name}`
            )}
          </div>

          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '8px',
            border: '1px solid #334155',
            padding: '18px',
          }}>
            {renderEnlargedPCAPlot(
              pca_b,
              '#10b981',
              '#34d399',
              hoveredPointB,
              setHoveredPointB,
              `Dataset B: ${dataset_b_name}`
            )}
          </div>
        </div>
      </div>

      {/* 2. POPULATION STATISTICS DIFFERENCE GRID */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="#34d399" />
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              Population Firing Rate Statistics & Excitability Metrics
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Contrasting baseline rates, dynamic range, and active unit proportions
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}>
          {/* Mean Firing Rate */}
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Mean Firing Rate</span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: meanDiff >= 0 ? '#34d399' : '#f87171',
                backgroundColor: meanDiff >= 0 ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                Δ {meanDiff >= 0 ? `+${meanDiff}` : meanDiff} Hz
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#60a5fa' }}>{stats_a.mean_firing_rate} Hz</span>
              <span style={{ color: '#64748b' }}>vs</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#34d399' }}>{stats_b.mean_firing_rate} Hz</span>
            </div>
          </div>

          {/* Median Firing Rate */}
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Median Firing Rate</span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: medianDiff >= 0 ? '#34d399' : '#f87171',
                backgroundColor: medianDiff >= 0 ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                Δ {medianDiff >= 0 ? `+${medianDiff}` : medianDiff} Hz
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#60a5fa' }}>{stats_a.median_firing_rate} Hz</span>
              <span style={{ color: '#64748b' }}>vs</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#34d399' }}>{stats_b.median_firing_rate} Hz</span>
            </div>
          </div>

          {/* Peak (95th Pct) Firing Rate */}
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Peak (95th%) Excitability</span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: peakDiff >= 0 ? '#fbbf24' : '#f87171',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                Δ {peakDiff >= 0 ? `+${peakDiff}` : peakDiff} Hz
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#60a5fa' }}>{stats_a.peak_firing_rate} Hz</span>
              <span style={{ color: '#64748b' }}>vs</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#34d399' }}>{stats_b.peak_firing_rate} Hz</span>
            </div>
          </div>

          {/* Active Neuron Proportion */}
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Active Units (&gt;0.1Hz)</span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: activePctDiff >= 0 ? '#a78bfa' : '#f87171',
                backgroundColor: 'rgba(167, 139, 250, 0.1)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                Δ {activePctDiff >= 0 ? `+${activePctDiff}` : activePctDiff}%
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#60a5fa' }}>{stats_a.active_neuron_pct}%</span>
              <span style={{ color: '#64748b' }}>vs</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#34d399' }}>{stats_b.active_neuron_pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ACTIVITY DISTRIBUTION HISTOGRAMS & REGIONAL ACTIVITY (INSIGHT-FIRST) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
      }}>
        {/* Activity Distribution Histograms */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={20} color="#a78bfa" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Firing Rate Distribution Histograms
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Population probability density
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {distribution_a.counts.map((cntA, idx) => {
              const cntB = distribution_b.counts[idx] || 0;
              const edgeStart = distribution_a.bin_edges[idx];
              const edgeEnd = distribution_a.bin_edges[idx + 1] || edgeStart + 2.5;
              const maxCnt = Math.max(...distribution_a.counts, ...distribution_b.counts, 1);
              const pctA = (cntA / maxCnt) * 100;
              const pctB = (cntB / maxCnt) * 100;

              return (
                <div key={`dist-bin-${idx}`} style={{ fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '2px' }}>
                    <span>{edgeStart.toFixed(1)} - {edgeEnd.toFixed(1)} Hz</span>
                    <span>
                      <strong style={{ color: '#60a5fa' }}>{cntA} units</strong> (A) vs <strong style={{ color: '#34d399' }}>{cntB} units</strong> (B)
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{
                      height: '6px',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      <div style={{ width: `${pctA}%`, height: '100%', backgroundColor: '#3b82f6' }} />
                    </div>
                    <div style={{
                      height: '6px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      <div style={{ width: `${pctB}%`, height: '100%', backgroundColor: '#10b981' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px', fontSize: '0.78rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontWeight: 600 }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', borderRadius: '2px' }} />
              Dataset A ({dataset_a_name})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 600 }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '2px' }} />
              Dataset B ({dataset_b_name})
            </span>
          </div>
        </div>

        {/* Regional Mean Activity (Summary Metrics + Visual Bars + Table) */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={20} color="#fbbf24" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Regional Activity & Yield Rankings
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {region_activity.length} sampled structures
            </span>
          </div>

          {/* Regional Summary Badges */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '14px',
          }}>
            <div style={{ backgroundColor: '#1e293b', padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>Most Active Region</span>
              <strong style={{ color: '#fbbf24', fontSize: '0.9rem' }}>{mostActiveRegion} ({highestRate.toFixed(1)} Hz)</strong>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>Largest Difference</span>
              <strong style={{ color: '#38bdf8', fontSize: '0.9rem' }}>{largestDiffRegion} (Δ {maxAbsDiff.toFixed(1)} Hz)</strong>
            </div>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '250px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '8px 10px', color: '#cbd5e1', textAlign: 'left' }}>Structure</th>
                  <th style={{ padding: '8px 10px', color: '#60a5fa', textAlign: 'right' }}>Dataset A</th>
                  <th style={{ padding: '8px 10px', color: '#34d399', textAlign: 'right' }}>Dataset B</th>
                  <th style={{ padding: '8px 10px', color: '#cbd5e1', textAlign: 'right' }}>Difference</th>
                </tr>
              </thead>
              <tbody>
                {region_activity.map((ra, idx) => (
                  <tr
                    key={ra.region}
                    style={{
                      backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(30, 41, 59, 0.4)',
                      borderBottom: '1px solid #1e293b',
                    }}
                  >
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: '#f8fafc' }}>
                      {ra.region}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: typeof ra.mean_firing_rate_a === 'number' ? '#e2e8f0' : '#64748b' }}>
                      {typeof ra.mean_firing_rate_a === 'number' ? `${ra.mean_firing_rate_a.toFixed(1)} Hz` : 'Missing in A'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: typeof ra.mean_firing_rate_b === 'number' ? '#e2e8f0' : '#64748b' }}>
                      {typeof ra.mean_firing_rate_b === 'number' ? `${ra.mean_firing_rate_b.toFixed(1)} Hz` : 'Missing in B'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      {typeof ra.delta_rate === 'number' ? (
                        <span style={{
                          color: ra.delta_rate >= 0 ? '#34d399' : '#f87171',
                          fontWeight: 700,
                        }}>
                          {ra.delta_rate >= 0 ? `+${ra.delta_rate.toFixed(1)}` : ra.delta_rate.toFixed(1)} Hz
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. SCIENTIFIC POPULATION DYNAMICS INTERPRETATION */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={20} color="#34d399" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
            Population Dynamics & Manifold Observations
          </h3>
        </div>
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '6px',
          padding: '16px',
          borderLeft: '4px solid #10b981',
          color: '#e2e8f0',
          fontSize: '0.88rem',
          lineHeight: '1.6',
        }}>
          {population_summary}
        </div>
      </div>
    </div>
  );
};

