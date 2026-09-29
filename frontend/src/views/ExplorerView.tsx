import React from 'react';
import { ExplorerProvider, useExplorer } from './explorer/ExplorerContext';
import { ExplorerNav } from './explorer/ExplorerNav';
import { ExplorerLanding } from './explorer/ExplorerLanding';
import { DatasetBrowserView } from './explorer/DatasetBrowserView';
import { PopulationActivityView } from './explorer/PopulationActivityView';
import { TrialInspectorView } from './explorer/TrialInspectorView';
import { MetadataView } from './explorer/MetadataView';

const ExplorerContent: React.FC = () => {
  const { activeSubmodule } = useExplorer();

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1920px',
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      {/* Explorer Header, Global Actions & 4-Submodule Sub-navigation */}
      <ExplorerNav />

      {/* Render Active Explorer Submodule */}
      <main style={{ minHeight: '600px', width: '100%' }}>
        {activeSubmodule === 'overview' && <ExplorerLanding />}
        {activeSubmodule === 'dataset-browser' && <DatasetBrowserView />}
        {activeSubmodule === 'population-activity' && <PopulationActivityView />}
        {activeSubmodule === 'trial-inspector' && <TrialInspectorView />}
        {activeSubmodule === 'metadata' && <MetadataView />}
      </main>
    </div>
  );
};

export const ExplorerView: React.FC = () => {
  return (
    <ExplorerProvider>
      <ExplorerContent />
    </ExplorerProvider>
  );
};

export default ExplorerView;
