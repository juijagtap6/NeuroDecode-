import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SimulationView } from './SimulationView';
import { api } from '../api/client';
import { SimulationResponse } from '../types';

// Mock ResizeObserver for jsdom
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock mock simulation response
const mockSimulationResponse: SimulationResponse = {
  provenance: 'synthetic_lif',
  neuron_ids: [0, 1, 2],
  spike_events: [
    { neuron_id: 0, time_ms: 25.5 },
    { neuron_id: 0, time_ms: 75.0 },
    { neuron_id: 1, time_ms: 40.2 },
    { neuron_id: 2, time_ms: 60.1 },
  ],
  spikes_by_neuron: {
    '0': [25.5, 75.0],
    '1': [40.2],
    '2': [60.1],
  },
  membrane_potentials: {
    time_ms: [0, 10, 20, 25.5, 30, 75, 80],
    traces: {
      '0': [-65, -60, -52, 20, -65, 20, -65],
      '1': [-65, -62, -55, -53, -50, 20, -65],
    },
    v_thresh: -50.0,
    v_reset: -65.0,
    v_rest: -65.0,
  },
  spike_counts: { '0': 2, '1': 1, '2': 1 },
  firing_rates: { '0': 20.0, '1': 10.0, '2': 10.0 },
  isi_statistics: {
    mean_isi_ms: { '0': 49.5, '1': 0.0, '2': 0.0 },
    cv_isi: { '0': 0.1, '1': 0.0, '2': 0.0 },
    population_mean_isi_ms: 49.5,
    population_cv_isi: 0.1,
  },
  population_firing_rate: {
    time_bins_ms: [25, 75],
    rates_hz: [13.3, 13.3],
    bin_size_ms: 50.0,
  },
  summary: {
    total_neurons: 3,
    duration_ms: 100.0,
    total_spikes: 4,
    mean_firing_rate_hz: 13.3,
    selected_neuron: 0,
    provenance: 'synthetic_lif',
  },
  simulation_parameters: {
    num_neurons: 3,
    duration_ms: 100.0,
  },
};

describe('SimulationView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'runSimulation').mockResolvedValue(mockSimulationResponse);
    vi.spyOn(api, 'getNeuronTrace').mockResolvedValue({
      time_ms: [0, 50, 100],
      traces: { '1': [-65, -50, -65] },
      v_thresh: -50,
      v_reset: -65,
      v_rest: -65,
    });
  });

  it('renders simulation lab header and auto-runs initial simulation', async () => {
    render(<SimulationView />);

    expect(screen.getByText(/3. Simulation Lab/i)).toBeDefined();
    await waitFor(() => {
      expect(api.runSimulation).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Population Spike Raster Plot/i)).toBeDefined();
    });
  });

  it('allows mode selection between Quick Presets, Custom Build, and BYOD', async () => {
    render(<SimulationView />);
    await waitFor(() => expect(api.runSimulation).toHaveBeenCalled());

    // Switch to Custom Build
    const customTab = screen.getByRole('button', { name: /Custom Build/i });
    fireEvent.click(customTab);
    expect(screen.getByText(/Membrane τ_m \(ms\)/i)).toBeDefined();

    // Switch to BYOD
    const byodTab = screen.getByRole('button', { name: /BYOD \(CSV\)/i });
    fireEvent.click(byodTab);
    expect(screen.getByText(/Supported CSV Format/i)).toBeDefined();
    expect(screen.getByText(/Upload & Process Dataset/i)).toBeDefined();
  });

  it('allows selecting presets in Quick Mode', async () => {
    render(<SimulationView />);
    await waitFor(() => expect(api.runSimulation).toHaveBeenCalled());

    const selects = screen.getAllByRole('combobox');
    const presetSelect = selects[0];
    fireEvent.change(presetSelect, { target: { value: '1' } }); // Select Asynchronous Balanced Network
    expect(screen.getByText(/Asynchronous Balanced Network/i)).toBeDefined();
  });

  it('renders synchronized Neuron Inspector with actual metrics', async () => {
    render(<SimulationView />);
    await waitFor(() => {
      expect(screen.getByText(/Neuron Inspector/i)).toBeDefined();
      expect(screen.getByText('20')).toBeDefined(); // Mean Rate 20 Hz
      expect(screen.getByText(/spikes \/ sec/i)).toBeDefined();
    });
  });

  it('updates inspector when another neuron is selected', async () => {
    render(<SimulationView />);
    await waitFor(() => expect(screen.getByText(/Neuron Inspector/i)).toBeDefined());

    // Look for neuron selector dropdown in inspector
    const selects = screen.getAllByRole('combobox');
    const inspectorSelect = selects[selects.length - 1]; // inspector dropdown

    fireEvent.change(inspectorSelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText('10')).toBeDefined(); // Neuron 1 has rate 10 Hz
    });
  });

  it('renders population firing rate plot', async () => {
    render(<SimulationView />);
    await waitFor(() => {
      expect(screen.getByText(/Population Average Firing Rate Over Time/i)).toBeDefined();
    });
  });

  it('renders membrane potential plot with threshold and reset lines', async () => {
    render(<SimulationView />);
    await waitFor(() => {
      expect(screen.getByText(/Membrane Potential Dynamics/i)).toBeDefined();
      expect(screen.getByText(/V_thresh \(-50 mV\)/i)).toBeDefined();
      expect(screen.getByText(/V_reset \(-65 mV\)/i)).toBeDefined();
    });
  });

  it('displays error banner when simulation fails', async () => {
    vi.spyOn(api, 'runSimulation').mockRejectedValueOnce(new Error('ODE diverged numerically'));
    render(<SimulationView />);

    await waitFor(() => {
      expect(screen.getByText(/Simulation \/ Validation Alert:/i)).toBeDefined();
      expect(screen.getByText(/ODE diverged numerically/i)).toBeDefined();
    });
  });
});
