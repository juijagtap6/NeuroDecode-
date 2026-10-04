import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Compass, Cpu, Activity, GitCompare, Sun, Moon, LogIn, LogOut, ArrowRight } from 'lucide-react';

interface LandingNavbarProps {
  onLaunch: (targetTab?: 'explorer' | 'decoder' | 'simulation' | 'comparison') => void;
  onOpenAuth: () => void;
  apiReady?: boolean;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onLaunch, onOpenAuth, apiReady = true }) => {
  const { theme, toggleTheme, tokens, isDark } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  const modules = [
    { id: 'explorer' as const, label: '1. Explorer', icon: <Compass size={14} /> },
    { id: 'decoder' as const, label: '2. Decoder', icon: <Cpu size={14} /> },
    { id: 'simulation' as const, label: '3. Simulation (LIF)', icon: <Activity size={14} /> },
    { id: 'comparison' as const, label: '4. Comparison', icon: <GitCompare size={14} /> },
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: isDark ? 'rgba(8, 12, 20, 0.88)' : 'rgba(248, 250, 252, 0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${tokens.border}`,
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '0 20px',
          height: '66px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            onClick={() => onLaunch('explorer')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #818cf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.05rem',
                color: '#ffffff',
                boxShadow: '0 2px 10px rgba(14, 165, 233, 0.35)',
              }}
            >
              Ψ
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: tokens.text }}>
                NeuroDecode
              </div>
              <div style={{ fontSize: '0.62rem', color: tokens.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Computational Neuroscience
              </div>
            </div>
          </div>

          {/* API Health Pill */}
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
            {apiReady ? 'API: v1 Connected' : 'Connecting'}
          </div>
        </div>

        {/* Desktop Nav: Navigation Links + Module Launchers */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Section Jump Links */}
          <div style={{ display: 'none', gap: '16px', marginRight: '6px' }} className="nav-section-links">
            <button
              onClick={() => scrollTo('product-telemetry')}
              style={{ background: 'none', border: 'none', color: tokens.textMuted, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}
            >
              Product
            </button>
            <button
              onClick={() => scrollTo('modules')}
              style={{ background: 'none', border: 'none', color: tokens.textMuted, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}
            >
              Modules
            </button>
            <button
              onClick={() => scrollTo('capabilities')}
              style={{ background: 'none', border: 'none', color: tokens.textMuted, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}
            >
              About
            </button>
          </div>

          {/* Direct module tabs matching existing App test expectations */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: tokens.bgAlt,
              padding: '3px',
              borderRadius: '8px',
              border: `1px solid ${tokens.border}`,
              gap: '2px',
            }}
          >
            {modules.map((m) => (
              <button
                key={m.id}
                onClick={() => onLaunch(m.id)}
                title={`Launch ${m.label}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 11px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: tokens.textMuted,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = tokens.text;
                  e.currentTarget.style.backgroundColor = tokens.surfaceElevated;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = tokens.textMuted;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle light/dark theme"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
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
            {isDark ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#0284c7" />}
          </button>

          {/* User Profile / Sign In */}
          {isAuthenticated && user ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px 4px 6px',
                borderRadius: '8px',
                backgroundColor: tokens.bgAlt,
                border: `1px solid ${tokens.border}`,
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: tokens.accentBg,
                  color: tokens.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: tokens.text }}>
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
              id="landing-signin-btn"
              onClick={onOpenAuth}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.bgAlt,
                color: tokens.text,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          )}

          {/* Primary Launch CTA */}
          <button
            id="landing-launch-btn"
            onClick={() => onLaunch('explorer')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: tokens.accent,
              color: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 3px 12px rgba(14, 165, 233, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Launch NeuroDecode</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
