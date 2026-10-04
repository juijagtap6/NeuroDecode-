import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ExplorerView } from './views/ExplorerView';
import { DecoderView } from './views/DecoderView';
import { SimulationView } from './views/SimulationView';
import { ComparisonView } from './views/ComparisonView';
import { LandingView } from './views/LandingView';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { api } from './api/client';

export type { ActiveTab };

function getInitialTab(): ActiveTab {
  if (typeof window === 'undefined') return 'landing';
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
  if (hash.startsWith('decoder')) return 'decoder';
  if (hash.startsWith('simulation')) return 'simulation';
  if (hash.startsWith('comparison')) return 'comparison';
  if (hash.startsWith('explorer')) return 'explorer';
  if (hash.startsWith('landing')) return 'landing';

  const path = window.location.pathname.toLowerCase().replace(/^\//, '');
  if (path.startsWith('decoder')) return 'decoder';
  if (path.startsWith('simulation')) return 'simulation';
  if (path.startsWith('comparison')) return 'comparison';
  if (path.startsWith('explorer')) return 'explorer';
  if (path.startsWith('landing')) return 'landing';

  return 'landing';
}

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);
  const [apiReady, setApiReady] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const { tokens } = useTheme();

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

  if (activeTab === 'landing') {
    return (
      <LandingView
        onLaunchApp={(targetModule) => handleTabChange(targetModule || 'explorer')}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: tokens.bg,
        color: tokens.text,
        transition: 'background-color 0.2s ease, color 0.2s ease',
      }}
    >
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        apiReady={apiReady}
        onOpenAuth={() => setShowAuthModal(true)}
      />
      <main style={{ paddingBottom: '40px' }}>
        {activeTab === 'explorer' && <ExplorerView />}
        {activeTab === 'decoder' && <DecoderView />}
        {activeTab === 'simulation' && <SimulationView />}
        {activeTab === 'comparison' && <ComparisonView />}
      </main>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
