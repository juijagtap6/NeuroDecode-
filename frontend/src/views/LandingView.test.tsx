import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LandingView } from './LandingView';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';

// Helper component to render LandingView wrapped in providers
const TestWrapper: React.FC<{ onLaunchApp?: (module?: any) => void }> = ({ onLaunchApp = vi.fn() }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LandingView onLaunchApp={onLaunchApp} />
      </AuthProvider>
    </ThemeProvider>
  );
};

// Component to test theme toggle directly
const ThemeTestConsumer: React.FC = () => {
  const { theme, toggleTheme, tokens, isDark } = useTheme();
  return (
    <div>
      <span data-testid="theme-name">{theme}</span>
      <span data-testid="is-dark">{isDark ? 'yes' : 'no'}</span>
      <span data-testid="token-bg">{tokens.bg}</span>
      <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
    </div>
  );
};

describe('Landing Page & Core Enhancements', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders all primary landing page sections and scientific copy', () => {
    const handleLaunch = vi.fn();
    render(<TestWrapper onLaunchApp={handleLaunch} />);

    // 1. Navbar & Branding
    expect(screen.getByText('NeuroDecode')).toBeDefined();
    expect(screen.getByText('Computational Neuroscience')).toBeDefined();

    // 2. Hero Headline & Supporting Text
    expect(screen.getByText('Decode the language of neural activity.')).toBeDefined();
    expect(screen.getByText(/NeuroDecode is an interactive computational neuroscience platform/i)).toBeDefined();
    expect(screen.getAllByRole('button', { name: /Launch NeuroDecode/i }).length).toBeGreaterThanOrEqual(1);

    // 3. Trusted Statement / Technical Metrics
    expect(screen.getByText(/Rigorous Scientific Foundation/i)).toBeDefined();
    expect(screen.getByText('384 Ch')).toBeDefined();
    expect(screen.getByText('0.1 ms')).toBeDefined();
    expect(screen.getByText('Allen CCFv3')).toBeDefined();

    // 4. Four Core Modules
    expect(screen.getByText('Four Specialized Pillars of Computational Neuroscience')).toBeDefined();
    expect(screen.getByRole('button', { name: /Launch Explorer/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Launch Decoder/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Launch Simulation/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Launch Comparison/i })).toBeDefined();

    // 5. Product Visualization Telemetry Console
    expect(screen.getByText('Real-Time Neurocomputational Telemetry')).toBeDefined();
    expect(screen.getByText('Spike Raster & PSTH')).toBeDefined();
    expect(screen.getByText('Kinematic Trajectory')).toBeDefined();
    expect(screen.getByText('LIF Membrane Dynamics')).toBeDefined();
    expect(screen.getByText('Multi-Session Manifold')).toBeDefined();

    // 6. How it works pipeline
    expect(screen.getByText('How NeuroDecode Works')).toBeDefined();
    expect(screen.getByText('Select and inspect neural data.')).toBeDefined();
    expect(screen.getByText('Extract interpretable neural representations.')).toBeDefined();
    expect(screen.getByText('Model neural dynamics and activity.')).toBeDefined();
    expect(screen.getByText('Compare sessions, populations, and responses.')).toBeDefined();

    // 7. Computational Neuroscience Capabilities
    expect(screen.getByText('Computational Neuroscience Capabilities')).toBeDefined();
    expect(screen.getByText('Biophysical Membrane Modeling')).toBeDefined();
    expect(screen.getByText('Recursive State-Space Decoding')).toBeDefined();

    // 8. Final CTA
    expect(screen.getByText('Ready to Explore the Language of Neural Activity?')).toBeDefined();

    // 9. Footer
    expect(screen.getByText(/Open Research Instrumentation/i)).toBeDefined();
  });

  it('triggers module navigation when Launch buttons are clicked', () => {
    const handleLaunch = vi.fn();
    render(<TestWrapper onLaunchApp={handleLaunch} />);

    // Click Launch Decoder
    const launchDecoderBtn = screen.getByRole('button', { name: /Launch Decoder/i });
    fireEvent.click(launchDecoderBtn);
    expect(handleLaunch).toHaveBeenCalledWith('decoder');

    // Click Launch Simulation
    const launchSimBtn = screen.getByRole('button', { name: /Launch Simulation/i });
    fireEvent.click(launchSimBtn);
    expect(handleLaunch).toHaveBeenCalledWith('simulation');
  });

  it('opens Authentication Modal and supports Guest Scientist sign-in', async () => {
    const handleLaunch = vi.fn();
    render(<TestWrapper onLaunchApp={handleLaunch} />);

    // Click Sign In button in navbar
    const signInBtn = screen.getAllByRole('button', { name: /Sign In/i })[0];
    fireEvent.click(signInBtn);

    // Modal should now be visible
    expect(screen.getByText('NeuroDecode Access')).toBeDefined();

    // Switch to Guest Scientist tab
    const guestTab = screen.getByRole('button', { name: /^Guest Scientist$/i });
    fireEvent.click(guestTab);

    expect(screen.getByText('Instant Guest Scientist Access')).toBeDefined();

    // Click Continue as Guest Scientist
    const guestLaunchBtn = screen.getByRole('button', { name: /Continue as Guest Scientist/i });
    fireEvent.click(guestLaunchBtn);

    // After success, it should launch explorer module
    await waitFor(() => {
      expect(handleLaunch).toHaveBeenCalledWith('explorer');
    });

    // And session should be stored
    const stored = JSON.parse(localStorage.getItem('neurodecode_user_session') || '{}');
    expect(stored.username).toBe('Guest Scientist');
  });

  it('toggles light/dark theme and updates token colors and persistence', () => {
    render(
      <ThemeProvider>
        <ThemeTestConsumer />
      </ThemeProvider>
    );

    const themeName = screen.getByTestId('theme-name');
    const isDark = screen.getByTestId('is-dark');
    const tokenBg = screen.getByTestId('token-bg');
    const toggleBtn = screen.getByTestId('toggle-btn');

    // Default is dark
    expect(themeName.textContent).toBe('dark');
    expect(isDark.textContent).toBe('yes');
    expect(tokenBg.textContent).toBe('#080c14');

    // Toggle to light
    fireEvent.click(toggleBtn);
    expect(themeName.textContent).toBe('light');
    expect(isDark.textContent).toBe('no');
    expect(tokenBg.textContent).toBe('#f8fafc');
    expect(localStorage.getItem('neurodecode_theme')).toBe('light');

    // Toggle back to dark
    fireEvent.click(toggleBtn);
    expect(themeName.textContent).toBe('dark');
    expect(isDark.textContent).toBe('yes');
    expect(tokenBg.textContent).toBe('#080c14');
    expect(localStorage.getItem('neurodecode_theme')).toBe('dark');
  });
});
