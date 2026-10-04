import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemeTokens {
  mode: ThemeMode;
  bg: string;
  bgAlt: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentHover: string;
  accentBg: string;
  accentBorder: string;
  secondaryAccent: string;
  success: string;
  successBg: string;
  successBorder: string;
  error: string;
  errorBg: string;
  errorBorder: string;
  warning: string;
  codeBg: string;
  shadow: string;
  gridLine: string;
}

const darkTokens: ThemeTokens = {
  mode: 'dark',
  bg: '#080c14',
  bgAlt: '#0f172a',
  surface: '#111827',
  surfaceElevated: '#1e293b',
  border: '#1e293b',
  borderSubtle: '#334155',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  textSubtle: '#64748b',
  accent: '#38bdf8',
  accentHover: '#0ea5e9',
  accentBg: 'rgba(56, 189, 248, 0.1)',
  accentBorder: 'rgba(56, 189, 248, 0.25)',
  secondaryAccent: '#a78bfa',
  success: '#34d399',
  successBg: 'rgba(52, 211, 153, 0.12)',
  successBorder: '#059669',
  error: '#f87171',
  errorBg: 'rgba(239, 68, 68, 0.12)',
  errorBorder: '#991b1b',
  warning: '#fbbf24',
  codeBg: '#050811',
  shadow: '0 10px 30px -10px rgba(0, 0, 0, 0.6)',
  gridLine: 'rgba(56, 189, 248, 0.04)',
};

const lightTokens: ThemeTokens = {
  mode: 'light',
  bg: '#f8fafc',
  bgAlt: '#f1f5f9',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  border: '#e2e8f0',
  borderSubtle: '#cbd5e1',
  text: '#0f172a',
  textMuted: '#475569',
  textSubtle: '#94a3b8',
  accent: '#0284c7',
  accentHover: '#0369a1',
  accentBg: 'rgba(2, 132, 199, 0.08)',
  accentBorder: 'rgba(2, 132, 199, 0.25)',
  secondaryAccent: '#7c3aed',
  success: '#16a34a',
  successBg: 'rgba(22, 163, 74, 0.08)',
  successBorder: '#86efac',
  error: '#dc2626',
  errorBg: 'rgba(220, 38, 38, 0.08)',
  errorBorder: '#fca5a5',
  warning: '#d97706',
  codeBg: '#f1f5f9',
  shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
  gridLine: 'rgba(2, 132, 199, 0.04)',
};

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  tokens: ThemeTokens;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
  isDark: true,
  tokens: darkTokens,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('neurodecode_theme') as ThemeMode | null;
      if (stored === 'dark' || stored === 'light') return stored;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
    return 'dark';
  });

  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('neurodecode_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      document.body.style.backgroundColor = tokens.bg;
      document.body.style.color = tokens.text;
    }
  }, [theme, tokens]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark: theme === 'dark', tokens }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
