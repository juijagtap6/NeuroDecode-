import React from 'react';
import { Activity, Cpu, GitCompare, Compass } from 'lucide-react';

export type ActiveTab = 'explorer' | 'decoder' | 'simulation' | 'comparison';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  apiReady: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, apiReady }) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'explorer', label: '1. Explorer', icon: <Compass size={18} /> },
    { id: 'decoder', label: '2. Decoder', icon: <Cpu size={18} /> },
    { id: 'simulation', label: '3. Simulation (LIF)', icon: <Activity size={18} /> },
    { id: 'comparison', label: '4. Comparison', icon: <GitCompare size={18} /> },
  ];

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: '64px',
      backgroundColor: '#0f172a',
      borderBottom: '1px solid #1e293b',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1rem',
          }}>
            Ψ
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#f8fafc' }}>
              NeuroDecode
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Allen Neuropixels Platform
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: apiReady ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${apiReady ? '#15803d' : '#991b1b'}`,
          fontSize: '0.7rem',
          color: apiReady ? '#4ade80' : '#f87171',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: apiReady ? '#4ade80' : '#f87171',
          }} />
          {apiReady ? 'API: v1 Connected' : 'API: Disconnected'}
        </div>
      </div>

      <nav style={{ display: 'flex', gap: '8px' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isActive ? '#ffffff' : '#94a3b8',
                backgroundColor: isActive ? '#1e293b' : 'transparent',
                outline: isActive ? '1px solid #3b82f6' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
