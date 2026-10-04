import React from 'react';
import { Activity, Cpu, GitCompare, Compass, Sun, Moon, LogIn, LogOut, Home } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export type ActiveTab = 'landing' | 'explorer' | 'decoder' | 'simulation' | 'comparison';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  apiReady: boolean;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, apiReady, onOpenAuth }) => {
  const { theme, toggleTheme, tokens, isDark } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'explorer', label: '1. Explorer', icon: <Compass size={17} /> },
    { id: 'decoder', label: '2. Decoder', icon: <Cpu size={17} /> },
    { id: 'simulation', label: '3. Simulation (LIF)', icon: <Activity size={17} /> },
    { id: 'comparison', label: '4. Comparison', icon: <GitCompare size={17} /> },
  ];

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: '64px',
        backgroundColor: tokens.surface,
        borderBottom: `1px solid ${tokens.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 40,
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Brand & Home link */}
        <div
          onClick={() => onTabChange('landing')}
          title="Return to Landing Page"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '7px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #818cf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(14, 165, 233, 0.35)',
            }}
          >
            Ψ
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: tokens.text }}>
              Neuro<span style={{ color: tokens.accent }}>Decode</span>
            </div>
            <div style={{ fontSize: '0.62rem', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Allen Neuropixels Platform
            </div>
          </div>
        </div>

        {/* API Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: '999px',
            backgroundColor: apiReady ? tokens.successBg : tokens.errorBg,
            border: `1px solid ${apiReady ? tokens.successBorder : tokens.errorBorder}`,
            fontSize: '0.7rem',
            fontWeight: 600,
            color: apiReady ? tokens.success : tokens.error,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: apiReady ? tokens.success : tokens.error,
            }}
          />
          {apiReady ? 'API: v1 Connected' : 'API: Disconnected'}
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Landing Home button */}
        <button
          onClick={() => onTabChange('landing')}
          title="Return to Landing Page"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '7px 12px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.825rem',
            fontWeight: 600,
            color: activeTab === 'landing' ? tokens.text : tokens.textMuted,
            backgroundColor: activeTab === 'landing' ? tokens.bgAlt : 'transparent',
            outline: activeTab === 'landing' ? `1px solid ${tokens.accent}` : 'none',
            transition: 'all 0.15s ease',
            marginRight: '6px',
          }}
        >
          <Home size={15} />
          <span>Landing</span>
        </button>

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isActive ? '#ffffff' : tokens.textMuted,
                backgroundColor: isActive ? tokens.accent : 'transparent',
                outline: isActive ? `1px solid ${tokens.accentBorder}` : 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = tokens.text;
                  e.currentTarget.style.backgroundColor = tokens.bgAlt;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = tokens.textMuted;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', backgroundColor: tokens.border, margin: '0 6px' }} />

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle light/dark theme"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: `1px solid ${tokens.border}`,
            backgroundColor: tokens.bgAlt,
            color: tokens.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          {isDark ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#0284c7" />}
        </button>

        {/* User Session / Sign In */}
        {isAuthenticated && user ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px 3px 6px',
              borderRadius: '6px',
              backgroundColor: tokens.bgAlt,
              border: `1px solid ${tokens.border}`,
              fontSize: '0.78rem',
            }}
          >
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '4px',
                backgroundColor: tokens.accentBg,
                color: tokens.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <span style={{ fontWeight: 600, color: tokens.text }}>
              {user.username}
            </span>
            <button
              onClick={logout}
              title="Sign Out"
              style={{
                background: 'transparent',
                border: 'none',
                color: tokens.textMuted,
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.bgAlt,
              color: tokens.text,
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogIn size={13} />
            <span>Sign In</span>
          </button>
        )}
      </nav>
    </header>
  );
};
