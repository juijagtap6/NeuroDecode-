import React from 'react';
import { ComparisonProvider, useComparison } from './comparison/ComparisonContext';
import { ComparisonNav } from './comparison/ComparisonNav';
import { ComparisonOverviewView } from './comparison/ComparisonOverviewView';
import { SessionComparisonView } from './comparison/SessionComparisonView';
import { PopulationComparisonView } from './comparison/PopulationComparisonView';

const ComparisonContent: React.FC = () => {
  const { activeSubmodule } = useComparison();

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      {/* Persistent Comparison Context Bar & Header */}
      <ComparisonNav />

      {/* Submodule Dynamic Router */}
      <div style={{ marginTop: '8px' }}>
        {activeSubmodule === 'overview' && <ComparisonOverviewView />}
        {activeSubmodule === 'session-comparison' && <SessionComparisonView />}
        {activeSubmodule === 'population-comparison' && <PopulationComparisonView />}
      </div>
    </div>
  );
};

export const ComparisonView: React.FC = () => {
  return (
    <ComparisonProvider>
      <ComparisonContent />
    </ComparisonProvider>
  );
};
