import React, { useState, useMemo } from 'react';
import {
  Brain,
  ArrowUpDown,
  Search,
  Info,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import {
  DecoderRunResponse,
  FeatureImportanceResponse,
  BrainMappingResponse,
  FeatureImportanceItem,
} from '../../types';
import { UnitDetailModal } from './UnitDetailModal';

interface FeatureImportanceMappingProps {
  currentRun: DecoderRunResponse | null;
  featureImportanceData: FeatureImportanceResponse | null;
  brainMappingData: BrainMappingResponse | null;
  onNavigateToOverview: () => void;
}

type SortField = 'importance' | 'signed_weight' | 'unit_id' | 'region';

export const FeatureImportanceMapping: React.FC<FeatureImportanceMappingProps> = ({
  currentRun,
  featureImportanceData,
  brainMappingData,
  onNavigateToOverview,
}) => {
  const [sortField, setSortField] = useState<SortField>('importance');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<FeatureImportanceItem | null>(null);

  if (!currentRun || !featureImportanceData || !brainMappingData) {
    return (
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px dashed #334155',
          borderRadius: '12px',
          padding: '60px 20px',
          textAlign: 'center',
          color: '#94a3b8',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: '#a78bfa',
          }}
        >
          <Brain size={24} />
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#f1f5f9', fontWeight: 600 }}>
          No Feature Importance Data
        </h3>
        <p style={{ margin: '0 auto 20px auto', maxWidth: '400px', fontSize: '0.85rem', lineHeight: '1.5' }}>
          Train a decoder model to inspect unit-level weights and CCFv3 anatomical mappings.
        </p>
        <button
          onClick={onNavigateToOverview}
          style={{
            padding: '9px 18px',
            backgroundColor: '#7c3aed',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.85rem',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Go to Overview & Setup
        </button>
      </div>
    );
  }

  const isLinear =
    featureImportanceData.interpretation_type === 'model_coefficients';

  // Filter & Sort
  const filteredFeatures = useMemo(() => {
    return featureImportanceData.features.filter((f) => {
      const matchesSearch =
        searchQuery === '' ||
        String(f.unit_id).includes(searchQuery) ||
        f.structure.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.ccfv3_area.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRegion =
        selectedRegionFilter === 'all' || f.structure === selectedRegionFilter;

      return matchesSearch && matchesRegion;
    });
  }, [featureImportanceData.features, searchQuery, selectedRegionFilter]);

  const sortedFeatures = useMemo(() => {
    return [...filteredFeatures].sort((a, b) => {
      let diff = 0;
      if (sortField === 'importance') {
        diff = a.importance_score - b.importance_score;
      } else if (sortField === 'signed_weight') {
        const wa = a.signed_weight ?? 0;
        const wb = b.signed_weight ?? 0;
        diff = wa - wb;
      } else if (sortField === 'unit_id') {
        diff = a.unit_id - b.unit_id;
      } else if (sortField === 'region') {
        diff = a.structure.localeCompare(b.structure);
      }
      return sortAsc ? diff : -diff;
    });
  }, [filteredFeatures, sortField, sortAsc]);

  const maxImp = Math.max(...featureImportanceData.features.map((f) => f.importance_score), 0.0001);

  const availableRegions = useMemo(() => {
    return Array.from(new Set(featureImportanceData.features.map((f) => f.structure))).sort();
  }, [featureImportanceData.features]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Unit Detail Modal */}
      <UnitDetailModal
        unit={selectedUnit}
        onClose={() => setSelectedUnit(null)}
        modelType={currentRun.model_type}
      />

      {/* Scientific Notice Banner */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <Info color="#a78bfa" size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>
            {isLinear
              ? 'Linear Model Coefficients (Signed Margin Weights)'
              : 'Random Forest Feature Importance (Mean Decrease in Impurity)'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px', lineHeight: '1.45' }}>
            {featureImportanceData.explanation_note}
          </div>
        </div>
      </div>

      {/* SECTION 1: CCFv3 REGIONAL AGGREGATIONS */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(167, 139, 250, 0.15)',
                  color: '#a78bfa',
                  letterSpacing: '0.05em',
                }}
              >
                ANATOMICAL MAPPING
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {brainMappingData.mapped_units} of {brainMappingData.total_units} units localized in Allen CCFv3
              </span>
            </div>
            <h2 style={{ margin: '6px 0 0 0', fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              CCFv3 Regional Population Importance
            </h2>
          </div>
        </div>

        {/* Region Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {brainMappingData.regional_aggregations.map((reg) => (
            <div
              key={reg.region}
              onClick={() => setSelectedRegionFilter(selectedRegionFilter === reg.region ? 'all' : reg.region)}
              style={{
                backgroundColor: selectedRegionFilter === reg.region ? 'rgba(139, 92, 246, 0.12)' : '#0f172a',
                border: `1px solid ${selectedRegionFilter === reg.region ? '#8b5cf6' : '#1e293b'}`,
                borderRadius: '10px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="#38bdf8" />
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc' }}>{reg.region}</span>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#cbd5e1' }}>
                    {reg.division}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24' }}>
                  Rank #{reg.rank}
                </span>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px' }}>
                {reg.full_name}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingTop: '10px', borderTop: '1px solid #1e293b' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>UNITS</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0' }}>{reg.unit_count}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>MEAN IMP.</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#a78bfa' }}>
                    {reg.mean_importance.toFixed(3)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>MAX IMP.</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#38bdf8' }}>
                    {reg.max_importance.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: UNIT-LEVEL FEATURE IMPORTANCE TABLE */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9' }}>
              Unit-Level Model Weights & Feature Importance
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Showing {sortedFeatures.length} of {featureImportanceData.features.length} neural units. Click a row to inspect anatomical detail.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search unit or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '6px 12px 6px 30px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  outline: 'none',
                  width: '180px',
                }}
              />
            </div>

            <select
              value={selectedRegionFilter}
              onChange={(e) => setSelectedRegionFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            >
              <option value="all">All Regions</option>
              {availableRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Features Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th
                  onClick={() => handleSort('importance')}
                  style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Rank <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('unit_id')}
                  style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Unit ID <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('region')}
                  style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    CCFv3 Structure <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('importance')}
                  style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isLinear ? 'Weight Magnitude' : 'Gini Importance'} <ArrowUpDown size={12} />
                  </div>
                </th>
                {isLinear && (
                  <th
                    onClick={() => handleSort('signed_weight')}
                    style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Signed Direction <ArrowUpDown size={12} />
                    </div>
                  </th>
                )}
                <th style={{ padding: '10px 12px' }}>Firing Rate</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedFeatures.slice(0, 50).map((feat) => {
                const barWidth = Math.max(4, Math.min(100, (feat.importance_score / maxImp) * 100));

                return (
                  <tr
                    key={feat.unit_id}
                    onClick={() => setSelectedUnit(feat)}
                    style={{
                      borderBottom: '1px solid #1e293b',
                      color: '#f8fafc',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#fbbf24' }}>
                      #{feat.rank}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                      Unit #{feat.unit_id}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          color: '#38bdf8',
                          fontWeight: 500,
                        }}
                      >
                        {feat.structure}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${barWidth}%`, height: '100%', backgroundColor: '#a78bfa' }} />
                        </div>
                        <span style={{ fontWeight: 600, color: '#c4b5fd' }}>
                          {feat.importance_score.toFixed(4)}
                        </span>
                      </div>
                    </td>
                    {isLinear && (
                      <td style={{ padding: '10px 12px' }}>
                        {feat.signed_weight !== null && feat.signed_weight !== undefined ? (
                          <span
                            style={{
                              fontWeight: 600,
                              color: feat.signed_weight >= 0 ? '#34d399' : '#f87171',
                            }}
                          >
                            {feat.signed_weight > 0 ? `+${feat.signed_weight.toFixed(3)}` : feat.signed_weight.toFixed(3)}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b' }}>n/a</span>
                        )}
                      </td>
                    )}
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                      {feat.firing_rate !== null && feat.firing_rate !== undefined ? `${feat.firing_rate.toFixed(1)} Hz` : '-'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <span style={{ color: '#8b5cf6', display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem' }}>
                        Inspect <ChevronRight size={14} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
