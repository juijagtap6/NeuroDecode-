import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { X, Lock, Mail, Building, ArrowRight, ShieldCheck, Sparkles, Loader2, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const { tokens, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'signin' | 'guest'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeTab === 'signin') {
      if (!identifier.trim()) {
        setError('Please enter your institutional email or username.');
        return;
      }
      if (!password || password.length < 4) {
        setError('Password must be at least 4 characters.');
        return;
      }

      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        const username = identifier.includes('@') ? identifier.split('@')[0] : identifier;
        login(username, identifier.includes('@') ? identifier : `${username}@neurodecode.org`, false, institution || 'Neuroscience Institute');
        onSuccess();
        onClose();
      }, 500);
    } else {
      // Guest access
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        login('Guest Scientist', 'guest@neurodecode.org', true, 'Open Science Observatory');
        onSuccess();
        onClose();
      }, 300);
    }
  };

  const handleGuestQuickLaunch = () => {
    login('Guest Scientist', 'guest@neurodecode.org', true, 'Open Science Observatory');
    onSuccess();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: isDark ? 'rgba(3, 7, 18, 0.75)' : 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: tokens.surface,
          borderRadius: '16px',
          border: `1px solid ${tokens.border}`,
          boxShadow: tokens.shadow,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '24px 28px 18px',
            borderBottom: `1px solid ${tokens.border}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1.2rem',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              }}
            >
              Ψ
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.15rem', color: tokens.text, letterSpacing: '-0.02em' }}>
                NeuroDecode Access
              </div>
              <div style={{ fontSize: '0.75rem', color: tokens.textMuted }}>
                Computational Neuroscience Platform
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: tokens.textMuted,
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switch: Sign In vs Quick Guest Access */}
        <div
          style={{
            display: 'flex',
            backgroundColor: tokens.bgAlt,
            padding: '4px',
            margin: '18px 28px 0',
            borderRadius: '8px',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setError(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'signin' ? tokens.surface : 'transparent',
              color: activeTab === 'signin' ? tokens.text : tokens.textMuted,
              boxShadow: activeTab === 'signin' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('guest'); setError(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'guest' ? tokens.surface : 'transparent',
              color: activeTab === 'guest' ? tokens.text : tokens.textMuted,
              boxShadow: activeTab === 'guest' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Guest Scientist
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 28px 24px' }}>
          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: tokens.errorBg,
                border: `1px solid ${tokens.errorBorder}`,
                color: tokens.error,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'signin' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: tokens.textMuted, marginBottom: '6px' }}>
                  Institutional Email or Username
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '12px', color: tokens.textSubtle }}>
                    <Mail size={16} />
                  </span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. j.doe@university.edu"
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: '8px',
                      backgroundColor: tokens.bgAlt,
                      border: `1px solid ${tokens.border}`,
                      color: tokens.text,
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: tokens.textMuted, marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '12px', color: tokens.textSubtle }}>
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 38px',
                      borderRadius: '8px',
                      backgroundColor: tokens.bgAlt,
                      border: `1px solid ${tokens.border}`,
                      color: tokens.text,
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'transparent',
                      border: 'none',
                      color: tokens.textSubtle,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: tokens.textMuted, marginBottom: '6px' }}>
                  Institution / Affiliation (Optional)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '12px', color: tokens.textSubtle }}>
                    <Building size={16} />
                  </span>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Allen Institute / Harvard"
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: '8px',
                      backgroundColor: tokens.bgAlt,
                      border: `1px solid ${tokens.border}`,
                      color: tokens.text,
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: tokens.accent,
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: loading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In & Enter Platform</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: tokens.accentBg,
                  border: `1px solid ${tokens.accentBorder}`,
                  color: tokens.text,
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: tokens.accent, marginBottom: '6px' }}>
                  <Sparkles size={16} />
                  <span>Instant Guest Scientist Access</span>
                </div>
                Explore all 4 computational modules (Explorer, Decoder, Simulation, Comparison) with authentic Neuropixels sessions and biophysical LIF models immediately.
              </div>

              <button
                type="button"
                onClick={handleGuestQuickLaunch}
                disabled={loading}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: tokens.accent,
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <span>Continue as Guest Scientist</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Transparent Research Disclaimer as required by prompt */}
          <div
            style={{
              marginTop: '20px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: tokens.bgAlt,
              border: `1px solid ${tokens.border}`,
              fontSize: '0.72rem',
              color: tokens.textSubtle,
              lineHeight: 1.45,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <ShieldCheck size={16} style={{ color: tokens.accent, flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Scientific Notice:</strong> NeuroDecode operates in open research mode. User sessions are maintained locally in browser storage for experiment state persistence. No personal credentials are sent to external auth servers.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
