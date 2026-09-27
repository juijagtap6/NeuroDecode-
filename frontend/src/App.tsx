import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ExplorerView } from './views/ExplorerView';
import { DecoderView } from './views/DecoderView';
import { SimulationView } from './views/SimulationView';
import { ComparisonView } from './views/ComparisonView';
import { api } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('explorer');
  const [apiReady, setApiReady] = useState<boolean>(false);

  useEffect(() => {
    api.getHealth()
      .then((res) => {
        if (res.status === 'ok') setApiReady(true);
      })
      .catch(() => setApiReady(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0f17', color: '#f1f5f9' }}>
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        apiReady={apiReady}
      />
      <main style={{ paddingBottom: '40px' }}>
        {activeTab === 'explorer' && <ExplorerView />}
        {activeTab === 'decoder' && <DecoderView />}
        {activeTab === 'simulation' && <SimulationView />}
        {activeTab === 'comparison' && <ComparisonView />}
      </main>
    </div>
  );
};

export default App;
