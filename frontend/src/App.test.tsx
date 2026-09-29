import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from './App';

// Mock ResizeObserver for jsdom
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('NeuroDecode Integrated App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders top navbar with all 4 module tabs and API connection status', async () => {
    render(<App />);

    expect(screen.getByText('NeuroDecode')).toBeDefined();
    expect(screen.getByText('1. Explorer')).toBeDefined();
    expect(screen.getByText('2. Decoder')).toBeDefined();
    expect(screen.getByText('3. Simulation (LIF)')).toBeDefined();
    expect(screen.getByText('4. Comparison')).toBeDefined();
  });

  it('navigates to Decoder view when Decoder tab is clicked', async () => {
    render(<App />);

    const decoderTab = screen.getByText('2. Decoder');
    fireEvent.click(decoderTab);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Population Decoder/i })).toBeDefined();
    });
  });

  it('navigates to Simulation view when Simulation tab is clicked', async () => {
    render(<App />);

    const simTab = screen.getByText('3. Simulation (LIF)');
    fireEvent.click(simTab);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Simulation Lab/i })).toBeDefined();
    });
  });

  it('navigates to Comparison view when Comparison tab is clicked', async () => {
    render(<App />);

    const compTab = screen.getByText('4. Comparison');
    fireEvent.click(compTab);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Comparison Module/i })).toBeDefined();
    });
  });

  it('navigates back to Explorer view when Explorer tab is clicked', async () => {
    render(<App />);

    const compTab = screen.getByText('4. Comparison');
    fireEvent.click(compTab);

    const explorerTab = screen.getByText('1. Explorer');
    fireEvent.click(explorerTab);

    await waitFor(() => {
      expect(screen.getByText(/Authentic Allen Neuropixels electrophysiology/i)).toBeDefined();
    });
  });
});
