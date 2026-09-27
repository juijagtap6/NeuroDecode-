"""Leaky Integrate-and-Fire (LIF) Simulation Service."""
import numpy as np
from typing import List, Tuple
from ..schemas.simulation import LIFSimConfig, LIFSimResult
from ..schemas.common import ProvenanceEnum

class LIFSimulationService:
    """
    Simulates a Leaky Integrate-and-Fire (LIF) neuron model.
    Governing ODE:
        tau_m * dV/dt = -(V(t) - V_rest) + R_m * I_inj(t)
    Threshold event:
        If V(t) >= V_thresh -> emit spike, reset to V_reset for t_ref.
    """

    @staticmethod
    def run_simulation(config: LIFSimConfig) -> LIFSimResult:
        dt = config.dt_ms
        t_total = config.duration_ms
        time_points = np.arange(0, t_total, dt)
        n_steps = len(time_points)

        # Generate injected current profile
        i_inj = np.zeros(n_steps)
        onset_idx = int(config.i_inj_onset_ms / dt)
        offset_idx = int(config.i_inj_offset_ms / dt)

        if config.i_inj_type == "step":
            i_inj[onset_idx:offset_idx] = config.i_inj_amplitude
        elif config.i_inj_type == "pulse":
            pulse_width_steps = max(1, int(10.0 / dt))
            i_inj[onset_idx:min(n_steps, onset_idx + pulse_width_steps)] = config.i_inj_amplitude
        elif config.i_inj_type == "ramp":
            ramp_len = max(1, offset_idx - onset_idx)
            i_inj[onset_idx:offset_idx] = np.linspace(0, config.i_inj_amplitude, ramp_len)
        elif config.i_inj_type == "noisy":
            i_inj[onset_idx:offset_idx] = config.i_inj_amplitude + np.random.normal(
                0, config.noise_sigma, max(0, offset_idx - onset_idx)
            )

        # Simulation state variables
        v_m = np.zeros(n_steps)
        v_m[0] = config.v_rest
        spike_times_ms: List[float] = []
        refractory_steps_left = 0

        # Euler numerical integration
        for i in range(1, n_steps):
            if refractory_steps_left > 0:
                v_m[i] = config.v_reset
                refractory_steps_left -= 1
                continue

            # tau_m * dV/dt = -(V - V_rest) + R_m * I
            dv = (-(v_m[i - 1] - config.v_rest) + config.r_m * i_inj[i - 1]) * (dt / config.tau_m)
            v_next = v_m[i - 1] + dv

            if v_next >= config.v_thresh:
                # Spike emitted
                spike_times_ms.append(round(float(time_points[i]), 3))
                v_m[i] = 20.0  # Visual AP action potential peak
                refractory_steps_left = int(config.t_ref / dt)
            else:
                v_m[i] = v_next

        duration_sec = config.duration_ms / 1000.0
        firing_rate = len(spike_times_ms) / duration_sec if duration_sec > 0 else 0.0

        return LIFSimResult(
            provenance=ProvenanceEnum.SYNTHETIC_LIF,
            time_ms=[round(float(t), 2) for t in time_points],
            v_m=[round(float(v), 2) for v in v_m],
            i_inj=[round(float(i), 3) for i in i_inj],
            spike_times_ms=spike_times_ms,
            total_spikes=len(spike_times_ms),
            mean_firing_rate_hz=round(firing_rate, 2),
            config=config,
        )

lif_simulation_service = LIFSimulationService()
