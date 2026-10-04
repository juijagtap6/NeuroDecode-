import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Rocket, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';

interface FinalCtaProps {
  onLaunch: () => void;
  onOpenAuth: () => void;
}

export const FinalCta: React.FC<FinalCtaProps> = ({ onLaunch, onOpenAuth }) => {
  const { tokens } = useTheme();
  const { user } = useAuth();

  return (
    <section
      id="launch-section"
      style={{
        padding: '5rem 2rem 6rem',
        maxWidth: '1100px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          background: tokens.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(241, 245, 249, 0.9) 0%, rgba(226, 232, 240, 0.8) 100%)',
          border: `1px solid ${tokens.accentBorder}`,
          borderRadius: '24px',
          padding: '4rem 2.5rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: tokens.shadow,
        }}
      >
        {/* Subtle grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(${tokens.borderSubtle} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            opacity: 0.25,
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: tokens.accentBg,
              color: tokens.accent,
              border: `1px solid ${tokens.accentBorder}`,
              marginBottom: '1.25rem',
            }}
          >
            <ShieldCheck size={14} />
            Instant Interactive Access
          </div>

          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: tokens.text,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              margin: '0 0 1rem 0',
            }}
          >
            Ready to Explore the Language of Neural Activity?
          </h2>

          <p
            style={{
              fontSize: '1.05rem',
              color: tokens.textMuted,
              lineHeight: 1.6,
              marginBottom: '2.5rem',
            }}
          >
            Access the integrated platform now. Seamlessly inspect raw spike recordings, train kinematic decoders, simulate LIF membrane mechanics, and compare multi-session responses.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              id="cta-launch-neurodecode"
              onClick={onLaunch}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.85rem 1.85rem',
                borderRadius: '12px',
                backgroundColor: tokens.accent,
                color: '#ffffff',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = tokens.accentHover;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = tokens.accent;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Rocket size={18} />
              <span>Launch NeuroDecode</span>
              <ArrowRight size={18} />
            </button>

            {!user ? (
              <button
                id="cta-signin-button"
                onClick={onOpenAuth}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.6rem',
                  borderRadius: '12px',
                  backgroundColor: tokens.surface,
                  color: tokens.text,
                  border: `1px solid ${tokens.border}`,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = tokens.accent;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = tokens.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <UserCheck size={16} />
                <span>Institutional Sign In</span>
              </button>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  backgroundColor: tokens.surface,
                  color: tokens.text,
                  border: `1px solid ${tokens.border}`,
                  fontSize: '0.9rem',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399' }} />
                <span>Logged in as <strong>{user.username}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
