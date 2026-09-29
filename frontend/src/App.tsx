import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ExplorerView } from './views/ExplorerView';
import { DecoderView } from './views/DecoderView';
import { SimulationView } from './views/SimulationView';
import { ComparisonView } from './views/ComparisonView';
import { api } from './api/client';

function getInitialTab(): ActiveTab {
  if (typeof window === 'undefined') return 'explorer';
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
  if (hash.startsWith('decoder')) return 'decoder';
  if (hash.startsWith('simulation')) return 'simulation';
  if (hash.startsWith('comparison')) return 'comparison';
  if (hash.startsWith('explorer')) return 'explorer';

  const path = window.location.pathname.toLowerCase().replace(/^\//, '');
  if (path.startsWith('decoder')) return 'decoder';
  if (path.startsWith('simulation')) return 'simulation';
  if (path.startsWith('comparison')) return 'comparison';
  if (path.startsWith('explorer')) return 'explorer';

  return 'explorer';
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);
  const [apiReady, setApiReady] = useState<boolean>(false);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = `#/${tab}`;
    }
  };

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
        onTabChange={handleTabChange}
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
