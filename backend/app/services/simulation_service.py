"""Leaky Integrate-and-Fire (LIF) Simulation and Neural Dataset Service.

Governing LIF ODE:
    tau_m * dV/dt = -(V(t) - V_rest) + R_m * I_tot(t)
Threshold event:
    If V(t) >= V_thresh -> emit spike, reset to V_reset for refractory period t_ref.
"""
import io
import math
from typing import List, Tuple, Dict, Any, Optional
import numpy as np
import pandas as pd

from ..schemas.simulation import (
    LIFSimConfig,
    LIFSimResult,
    LIFPopulationParams,
    SimulationResponse,
    SpikeEvent,
    MembranePotentialData,
    ISIStats,
    PopulationFiringRate,
    SimulationSummary,
)
from ..schemas.common import ProvenanceEnum
from ..schemas.matrix import CanonicalSpikeMatrix


class LIFSimulationService:
    """
    Biophysical Leaky Integrate-and-Fire (LIF) Population Simulation Service.
    Supports:
    1. Single neuron LIF simulation (legacy/quick API).
    2. Recurrent population LIF simulation with E/I balance, noise, and connectivity.
    3. Bring Your Own Data (BYOD) spike train CSV validation and canonical ingestion.
    """

    def __init__(self):
        # In-memory storage for the latest simulation run to enable on-demand neuron trace inspection
        self._last_simulation: Optional[Dict[str, Any]] = None

    # -------------------------------------------------------------------------
    # Legacy Single Neuron Simulation
    # -------------------------------------------------------------------------
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

        v_m = np.zeros(n_steps)
        v_m[0] = config.v_rest
        spike_times_ms: List[float] = []
        refractory_steps_left = 0

        for i in range(1, n_steps):
            if refractory_steps_left > 0:
                v_m[i] = config.v_reset
                refractory_steps_left -= 1
                continue

            dv = (-(v_m[i - 1] - config.v_rest) + config.r_m * i_inj[i - 1]) * (dt / config.tau_m)
            v_next = v_m[i - 1] + dv

            if v_next >= config.v_thresh:
                spike_times_ms.append(round(float(time_points[i]), 3))
                v_m[i] = 20.0
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

    # -------------------------------------------------------------------------
    # Population LIF Simulation
    # -------------------------------------------------------------------------
    def run_population_simulation(self, params: LIFPopulationParams) -> SimulationResponse:
        """
        Run biophysical population simulation of LIF neurons.
        Deterministic when random_seed is set.
        Returns canonical SimulationResponse.
        """
        N = params.num_neurons
        dt = params.dt_ms
        t_total = params.duration_ms
        time_points = np.arange(0, t_total, dt)
        n_steps = len(time_points)

        # Reproducible RNG
        rng = np.random.default_rng(params.random_seed)

        # Partition population into Excitatory (E) and Inhibitory (I)
        n_e = int(round(N * params.ei_ratio))
        n_i = N - n_e

        # Synaptic weight matrix [N_postsynaptic, N_presynaptic]
        W = np.zeros((N, N), dtype=np.float32)
        if params.connection_density > 0 and N > 1:
            conn_mask = rng.random((N, N)) < params.connection_density
            np.fill_diagonal(conn_mask, False)

            # Balanced scaling: inhibitory connections have larger conductance
            scale = 1.0 / np.sqrt(max(N, 1))
            w_e = 0.5 * scale
            w_i = 1.5 * scale

            if n_e > 0:
                W[:, :n_e] = np.where(conn_mask[:, :n_e], w_e, 0.0)
            if n_i > 0:
                W[:, n_e:] = np.where(conn_mask[:, n_e:], -w_i, 0.0)

        # State vectors
        V = np.full(N, params.v_rest, dtype=np.float32)
        # Random initial voltages slightly distributed near v_rest for natural heterogeneity
        V += rng.uniform(-2.0, 2.0, N).astype(np.float32)

        refractory_counter = np.zeros(N, dtype=np.int32)
        ref_steps_const = int(round(params.t_ref / dt))

        # Synaptic current with exponential decay
        I_syn = np.zeros(N, dtype=np.float32)
        tau_syn = 5.0  # ms synaptic decay
        decay_syn = np.exp(-dt / tau_syn)

        # Neurons to record membrane potential traces for inspection
        # Always record selected_neuron_id and a small representative subset
        selected_id = min(params.selected_neuron_id, N - 1)
        trace_neuron_ids = sorted(list({selected_id, 0, min(1, N - 1), min(max(0, n_e - 1), N - 1), min(n_e, N - 1)}))
        recorded_traces = {nid: np.zeros(n_steps, dtype=np.float32) for nid in trace_neuron_ids}

        # Spike storage
        spike_events: List[SpikeEvent] = []
        spikes_by_neuron: Dict[str, List[float]] = {str(i): [] for i in range(N)}

        # Numerical integration loop (Euler)
        for step in range(n_steps):
            t_ms = float(time_points[step])

            # Record membrane potentials
            for nid in trace_neuron_ids:
                recorded_traces[nid][step] = V[nid]

            # Decrement refractory counters
            in_ref = refractory_counter > 0
            refractory_counter[in_ref] -= 1

            # Injected current + Gaussian white noise + recurrent synaptic current
            noise_inj = rng.normal(0.0, params.noise, N).astype(np.float32)
            I_tot = params.i_inj + noise_inj + I_syn

            # Integrate non-refractory neurons: tau_m * dV/dt = -(V - V_rest) + R_m * I_tot
            active = ~in_ref
            dV = (-(V[active] - params.v_rest) + params.r_m * I_tot[active]) * (dt / params.tau_m)
            V[active] += dV

            # Stabilize against numerical extremes
            V = np.clip(V, -100.0, 40.0)

            # Action potential threshold crossing
            spiked = V >= params.v_thresh
            spiked_indices = np.where(spiked)[0]

            if len(spiked_indices) > 0:
                for s_idx in spiked_indices:
                    t_event = round(t_ms, 2)
                    spike_events.append(SpikeEvent(neuron_id=int(s_idx), time_ms=t_event))
                    spikes_by_neuron[str(s_idx)].append(t_event)

                    # Reset and enter refractory period
                    V[s_idx] = params.v_reset
                    refractory_counter[s_idx] = ref_steps_const

                    # Spike peak marker in recorded trace for visual realism
                    if s_idx in trace_neuron_ids:
                        recorded_traces[s_idx][step] = 20.0

                # Synaptic transmission
                syn_input = np.sum(W[:, spiked_indices], axis=1)
                I_syn += syn_input

            # Decay synaptic currents
            I_syn *= decay_syn

        # Compute statistics from actual simulation output
        duration_sec = max(0.001, t_total / 1000.0)
        spike_counts: Dict[str, int] = {str(i): len(spikes_by_neuron[str(i)]) for i in range(N)}
        firing_rates: Dict[str, float] = {
            str(i): round(len(spikes_by_neuron[str(i)]) / duration_sec, 2) for i in range(N)
        }

        # ISI calculation
        mean_isi_dict: Dict[str, float] = {}
        cv_isi_dict: Dict[str, float] = {}
        all_isis: List[float] = []

        for i in range(N):
            s_times = spikes_by_neuron[str(i)]
            if len(s_times) >= 2:
                isis = np.diff(s_times)
                all_isis.extend(isis.tolist())
                m_isi = float(np.mean(isis))
                std_isi = float(np.std(isis))
                cv = (std_isi / m_isi) if m_isi > 0 else 0.0
                mean_isi_dict[str(i)] = round(m_isi, 2)
                cv_isi_dict[str(i)] = round(cv, 3)
            else:
                mean_isi_dict[str(i)] = 0.0
                cv_isi_dict[str(i)] = 0.0

        pop_mean_isi = round(float(np.mean(all_isis)), 2) if len(all_isis) > 0 else 0.0
        pop_cv_isi = (
            round(float(np.std(all_isis) / np.mean(all_isis)), 3)
            if len(all_isis) > 0 and np.mean(all_isis) > 0
            else 0.0
        )

        isi_stats = ISIStats(
            mean_isi_ms=mean_isi_dict,
            cv_isi=cv_isi_dict,
            population_mean_isi_ms=pop_mean_isi,
            population_cv_isi=pop_cv_isi,
        )

        # Population firing rate over time (binned)
        bin_size_ms = max(5.0, min(25.0, t_total / 50.0))
        bin_size_sec = bin_size_ms / 1000.0
        bin_edges = np.arange(0, t_total + bin_size_ms, bin_size_ms)
        n_bins = len(bin_edges) - 1

        all_spike_times = [ev.time_ms for ev in spike_events]
        if len(all_spike_times) > 0:
            counts, _ = np.histogram(all_spike_times, bins=bin_edges)
            rates_hz = [round(float(c) / (N * bin_size_sec), 2) for c in counts]
        else:
            rates_hz = [0.0] * n_bins

        bin_centers = [round(float(bin_edges[b] + bin_size_ms / 2.0), 2) for b in range(n_bins)]
        pop_firing_rate = PopulationFiringRate(
            time_bins_ms=bin_centers,
            rates_hz=rates_hz,
            bin_size_ms=bin_size_ms,
        )

        # Build CanonicalSpikeMatrix
        matrix_data: List[List[float]] = []
        for i in range(N):
            neuron_spikes = spikes_by_neuron[str(i)]
            if len(neuron_spikes) > 0:
                c, _ = np.histogram(neuron_spikes, bins=bin_edges)
                matrix_data.append([float(x) for x in c])
            else:
                matrix_data.append([0.0] * n_bins)

        canonical_matrix = CanonicalSpikeMatrix(
            provenance=ProvenanceEnum.SYNTHETIC_LIF,
            session_id=None,
            unit_ids=list(range(N)),
            structures=["SYNTHETIC_CORTEX"] * N,
            time_bin_edges=[round(float(b) / 1000.0, 4) for b in bin_edges],
            bin_size_sec=round(bin_size_sec, 4),
            matrix=matrix_data,
            metadata={
                "model": "LIF_population",
                "num_neurons": N,
                "duration_ms": t_total,
                "ei_ratio": params.ei_ratio,
                "connection_density": params.connection_density,
                "random_seed": params.random_seed,
            },
        )

        # Downsample membrane traces if steps > 2000 for efficient network transfer
        step_factor = max(1, n_steps // 1500)
        decimated_times = [round(float(time_points[idx]), 2) for idx in range(0, n_steps, step_factor)]
        decimated_traces: Dict[str, List[float]] = {}
        for nid, tr in recorded_traces.items():
            # If decimation step skips spike peaks, preserve peak in sample window
            resampled = []
            for b_idx in range(0, n_steps, step_factor):
                chunk = tr[b_idx:min(n_steps, b_idx + step_factor)]
                # If chunk contains a spike peak (>= 15 mV), preserve the peak
                max_val = float(np.max(chunk))
                if max_val >= 15.0:
                    resampled.append(round(max_val, 2))
                else:
                    resampled.append(round(float(chunk[0]), 2))
            decimated_traces[str(nid)] = resampled

        membrane_data = MembranePotentialData(
            time_ms=decimated_times,
            traces=decimated_traces,
            v_thresh=params.v_thresh,
            v_reset=params.v_reset,
            v_rest=params.v_rest,
        )

        total_spikes = len(spike_events)
        mean_pop_rate = round(float(total_spikes / (N * duration_sec)), 2)

        summary = SimulationSummary(
            total_neurons=N,
            duration_ms=t_total,
            total_spikes=total_spikes,
            mean_firing_rate_hz=mean_pop_rate,
            selected_neuron=selected_id,
            provenance=ProvenanceEnum.SYNTHETIC_LIF,
        )

        # Cache simulation in-memory for on-demand neuron trace inspection
        self._last_simulation = {
            "params": params,
            "time_points": time_points,
            "traces": recorded_traces,
            "spikes_by_neuron": spikes_by_neuron,
            "v_thresh": params.v_thresh,
            "v_reset": params.v_reset,
            "v_rest": params.v_rest,
            "step_factor": step_factor,
        }

        return SimulationResponse(
            provenance=ProvenanceEnum.SYNTHETIC_LIF,
            neuron_ids=list(range(N)),
            spike_events=spike_events,
            spikes_by_neuron=spikes_by_neuron,
            membrane_potentials=membrane_data,
            spike_counts=spike_counts,
            firing_rates=firing_rates,
            isi_statistics=isi_stats,
            population_firing_rate=pop_firing_rate,
            summary=summary,
            simulation_parameters=params.model_dump(),
            canonical_matrix=canonical_matrix,
        )

    # -------------------------------------------------------------------------
    # On-Demand Neuron Trace Retrieval
    # -------------------------------------------------------------------------
    def get_neuron_trace(self, neuron_id: int) -> Optional[MembranePotentialData]:
        """Fetch membrane potential trace for a specific neuron from the cached simulation."""
        if not self._last_simulation:
            return None

        traces = self._last_simulation["traces"]
        nid_str = str(neuron_id)

        # If already recorded, return it
        if neuron_id in traces:
            time_pts = self._last_simulation["time_points"]
            step_factor = self._last_simulation["step_factor"]
            n_steps = len(time_pts)
            decimated_times = [round(float(time_pts[idx]), 2) for idx in range(0, n_steps, step_factor)]
            tr = traces[neuron_id]
            resampled = []
            for b_idx in range(0, n_steps, step_factor):
                chunk = tr[b_idx:min(n_steps, b_idx + step_factor)]
                max_val = float(np.max(chunk))
                if max_val >= 15.0:
                    resampled.append(round(max_val, 2))
                else:
                    resampled.append(round(float(chunk[0]), 2))

            return MembranePotentialData(
                time_ms=decimated_times,
                traces={nid_str: resampled},
                v_thresh=self._last_simulation["v_thresh"],
                v_reset=self._last_simulation["v_reset"],
                v_rest=self._last_simulation["v_rest"],
            )

        # If not already recorded in trace dictionary, run quick single neuron simulation with same parameters
        params: LIFPopulationParams = self._last_simulation["params"]
        time_pts = self._last_simulation["time_points"]
        dt = params.dt_ms
        n_steps = len(time_pts)

        rng = np.random.default_rng(
            params.random_seed + neuron_id if params.random_seed is not None else None
        )
        V_single = np.zeros(n_steps, dtype=np.float32)
        V_curr = params.v_rest
        ref_counter = 0
        ref_steps_const = int(round(params.t_ref / dt))

        for step in range(n_steps):
            V_single[step] = V_curr
            if ref_counter > 0:
                V_curr = params.v_reset
                ref_counter -= 1
                continue

            noise = rng.normal(0.0, params.noise)
            I_tot = params.i_inj + noise
            dV = (-(V_curr - params.v_rest) + params.r_m * I_tot) * (dt / params.tau_m)
            V_curr += dV
            if V_curr >= params.v_thresh:
                V_single[step] = 20.0
                V_curr = params.v_reset
                ref_counter = ref_steps_const

        traces[neuron_id] = V_single
        step_factor = self._last_simulation["step_factor"]
        decimated_times = [round(float(time_pts[idx]), 2) for idx in range(0, n_steps, step_factor)]
        resampled = []
        for b_idx in range(0, n_steps, step_factor):
            chunk = V_single[b_idx:min(n_steps, b_idx + step_factor)]
            max_val = float(np.max(chunk))
            if max_val >= 15.0:
                resampled.append(round(max_val, 2))
            else:
                resampled.append(round(float(chunk[0]), 2))

        return MembranePotentialData(
            time_ms=decimated_times,
            traces={nid_str: resampled},
            v_thresh=params.v_thresh,
            v_reset=params.v_reset,
            v_rest=params.v_rest,
        )

    # -------------------------------------------------------------------------
    # Bring Your Own Data (BYOD) CSV Parser & Validator
    # -------------------------------------------------------------------------
    def parse_and_validate_csv(self, file_content: bytes, filename: str) -> SimulationResponse:
        """
        Validate and ingest user-uploaded neural spike train CSV.
        Does not fabricate data upon failure.
        Produces the canonical SimulationResponse representation.
        """
        if not file_content or len(file_content.strip()) == 0:
            raise ValueError("Uploaded file is empty. Please provide a valid CSV containing neural spike events.")

        # Decode content
        text_str = ""
        for encoding in ("utf-8", "utf-8-sig", "latin-1"):
            try:
                text_str = file_content.decode(encoding)
                break
            except UnicodeDecodeError:
                continue

        if not text_str:
            raise ValueError("Failed to decode file. Please ensure the file is valid UTF-8 encoded CSV text.")

        try:
            df = pd.read_csv(io.StringIO(text_str))
        except Exception as e:
            raise ValueError(f"CSV Parsing Error: Could not parse CSV table. Details: {str(e)}")

        if df.empty:
            raise ValueError("Uploaded CSV contains no data rows.")

        # Clean column names
        df.columns = [str(c).strip() for c in df.columns]
        lower_cols = {c.lower(): c for c in df.columns}

        spike_events: List[SpikeEvent] = []
        neuron_ids_set = set()

        # Check for event log format: (neuron_id, timestamp)
        neuron_col_candidates = ["neuron_id", "unit_id", "neuron", "unit", "channel", "cell_id", "id", "cell"]
        time_col_candidates = [
            "timestamp", "time_ms", "time", "spike_time", "spike_time_s",
            "spike_time_ms", "time_s", "timestamp_ms", "timestamp_s", "t"
        ]

        found_neuron_col = None
        for candidate in neuron_col_candidates:
            if candidate in lower_cols:
                found_neuron_col = lower_cols[candidate]
                break
        if not found_neuron_col:
            for lk, orig in lower_cols.items():
                if any(kw in lk for kw in ["neuron", "unit", "cell"]):
                    found_neuron_col = orig
                    break

        found_time_col = None
        for candidate in time_col_candidates:
            if candidate in lower_cols:
                found_time_col = lower_cols[candidate]
                break
        if not found_time_col:
            for lk, orig in lower_cols.items():
                if any(kw in lk for kw in ["time", "timestamp", "spike"]) or lk == "t":
                    found_time_col = orig
                    break

        if found_neuron_col and found_time_col:
            # Event format
            # Validate types
            time_series = pd.to_numeric(df[found_time_col], errors="coerce")
            neuron_series = pd.to_numeric(df[found_neuron_col], errors="coerce")

            valid_mask = ~(time_series.isna() | neuron_series.isna())
            if not valid_mask.any():
                raise ValueError(
                    f"Columns '{found_neuron_col}' and '{found_time_col}' contain non-numeric data. "
                    "Neuron IDs and timestamps must be valid numbers."
                )

            valid_times = time_series[valid_mask].to_numpy()
            valid_neurons = neuron_series[valid_mask].astype(int).to_numpy()

            if np.any(valid_times < 0):
                raise ValueError("Spike timestamps cannot be negative.")
            if np.any(valid_neurons < 0):
                raise ValueError("Neuron IDs cannot be negative integers.")

            # Detect whether timestamps are in seconds or milliseconds
            max_time = float(np.max(valid_times)) if len(valid_times) > 0 else 0.0
            is_seconds = found_time_col.lower().endswith(("_s", "_sec")) or (max_time < 30.0 and "ms" not in found_time_col.lower())

            scale_to_ms = 1000.0 if is_seconds else 1.0

            for n_id, t_val in zip(valid_neurons, valid_times):
                t_ms = round(float(t_val * scale_to_ms), 2)
                spike_events.append(SpikeEvent(neuron_id=int(n_id), time_ms=t_ms))
                neuron_ids_set.add(int(n_id))

        else:
            # Check for Binned Matrix / Wide format (e.g. rows = neurons, columns = time bins or vice versa)
            # Try to see if first column is neuron/id or time
            numeric_df = df.apply(pd.to_numeric, errors="coerce")
            non_na_ratio = numeric_df.notna().mean().mean()

            if non_na_ratio >= 0.8 and df.shape[1] >= 2:
                # Wide format: each row is a neuron, columns 1..T are time points
                first_col = df.columns[0]
                row_neuron_ids = pd.to_numeric(df[first_col], errors="coerce")

                if row_neuron_ids.notna().all():
                    # Columns 1..M are time bins
                    time_col_names = df.columns[1:]
                    time_values: List[float] = []
                    for tc in time_col_names:
                        try:
                            time_values.append(float(tc))
                        except ValueError:
                            pass

                    if len(time_values) == len(time_col_names):
                        # Clean column time headers
                        scale = 1000.0 if max(time_values) < 30.0 else 1.0
                        for r_idx, n_id in enumerate(row_neuron_ids):
                            n_int = int(n_id)
                            neuron_ids_set.add(n_int)
                            for t_idx, col_name in enumerate(time_col_names):
                                val = numeric_df.iloc[r_idx, t_idx + 1]
                                if val > 0:
                                    t_ms = round(time_values[t_idx] * scale, 2)
                                    # If val is an integer count > 1, emit that many spikes
                                    for _ in range(min(int(val), 10)):
                                        spike_events.append(SpikeEvent(neuron_id=n_int, time_ms=t_ms))
                    else:
                        # Fallback: treat column index as arbitrary time bin of 10ms
                        for r_idx, n_id in enumerate(row_neuron_ids):
                            n_int = int(n_id)
                            neuron_ids_set.add(n_int)
                            for col_idx in range(1, df.shape[1]):
                                val = numeric_df.iloc[r_idx, col_idx]
                                if val > 0:
                                    t_ms = round(float((col_idx - 1) * 10.0), 2)
                                    spike_events.append(SpikeEvent(neuron_id=n_int, time_ms=t_ms))
                else:
                    raise ValueError(
                        f"Unsupported CSV format. Could not locate 'neuron_id' and 'timestamp' columns. "
                        f"Found columns: {list(df.columns)}. Supported columns include 'neuron_id, timestamp_ms' "
                        "or 'unit_id, spike_time'."
                    )
            else:
                raise ValueError(
                    f"Unsupported CSV structure in '{filename}'. "
                    f"Expected columns: 'neuron_id' and 'timestamp_ms' (or 'unit_id', 'spike_time'). "
                    f"Detected columns: {list(df.columns)}."
                )

        if not neuron_ids_set:
            raise ValueError("No valid neural units detected in the uploaded CSV.")

        # Sort spike events chronologically
        spike_events.sort(key=lambda ev: ev.time_ms)
        sorted_neuron_ids = sorted(list(neuron_ids_set))
        N = len(sorted_neuron_ids)

        # Re-index neuron IDs if needed for clean display, keeping map
        spikes_by_neuron: Dict[str, List[float]] = {str(nid): [] for nid in sorted_neuron_ids}
        for ev in spike_events:
            spikes_by_neuron[str(ev.neuron_id)].append(ev.time_ms)

        # Estimate duration
        max_time_ms = max([ev.time_ms for ev in spike_events]) if spike_events else 100.0
        duration_ms = max(50.0, math.ceil(max_time_ms / 50.0) * 50.0)
        duration_sec = duration_ms / 1000.0

        spike_counts: Dict[str, int] = {str(nid): len(spikes_by_neuron[str(nid)]) for nid in sorted_neuron_ids}
        firing_rates: Dict[str, float] = {
            str(nid): round(len(spikes_by_neuron[str(nid)]) / duration_sec, 2) for nid in sorted_neuron_ids
        }

        # ISI calculations
        mean_isi_dict: Dict[str, float] = {}
        cv_isi_dict: Dict[str, float] = {}
        all_isis: List[float] = []

        for nid in sorted_neuron_ids:
            s_times = spikes_by_neuron[str(nid)]
            if len(s_times) >= 2:
                isis = np.diff(s_times)
                all_isis.extend(isis.tolist())
                m_isi = float(np.mean(isis))
                std_isi = float(np.std(isis))
                cv = (std_isi / m_isi) if m_isi > 0 else 0.0
                mean_isi_dict[str(nid)] = round(m_isi, 2)
                cv_isi_dict[str(nid)] = round(cv, 3)
            else:
                mean_isi_dict[str(nid)] = 0.0
                cv_isi_dict[str(nid)] = 0.0

        pop_mean_isi = round(float(np.mean(all_isis)), 2) if len(all_isis) > 0 else 0.0
        pop_cv_isi = (
            round(float(np.std(all_isis) / np.mean(all_isis)), 3)
            if len(all_isis) > 0 and np.mean(all_isis) > 0
            else 0.0
        )

        isi_stats = ISIStats(
            mean_isi_ms=mean_isi_dict,
            cv_isi=cv_isi_dict,
            population_mean_isi_ms=pop_mean_isi,
            population_cv_isi=pop_cv_isi,
        )

        # Population firing rate over time
        bin_size_ms = max(5.0, min(25.0, duration_ms / 50.0))
        bin_size_sec = bin_size_ms / 1000.0
        bin_edges = np.arange(0, duration_ms + bin_size_ms, bin_size_ms)
        n_bins = len(bin_edges) - 1

        all_times = [ev.time_ms for ev in spike_events]
        if len(all_times) > 0:
            counts, _ = np.histogram(all_times, bins=bin_edges)
            rates_hz = [round(float(c) / (N * bin_size_sec), 2) for c in counts]
        else:
            rates_hz = [0.0] * n_bins

        bin_centers = [round(float(bin_edges[b] + bin_size_ms / 2.0), 2) for b in range(n_bins)]
        pop_firing_rate = PopulationFiringRate(
            time_bins_ms=bin_centers,
            rates_hz=rates_hz,
            bin_size_ms=bin_size_ms,
        )

        # Canonical spike matrix
        matrix_data: List[List[float]] = []
        for nid in sorted_neuron_ids:
            n_spikes = spikes_by_neuron[str(nid)]
            if len(n_spikes) > 0:
                c, _ = np.histogram(n_spikes, bins=bin_edges)
                matrix_data.append([float(x) for x in c])
            else:
                matrix_data.append([0.0] * n_bins)

        canonical_matrix = CanonicalSpikeMatrix(
            provenance=ProvenanceEnum.USER_UPLOADED,
            session_id=None,
            unit_ids=sorted_neuron_ids,
            structures=["USER_DATASET"] * N,
            time_bin_edges=[round(float(b) / 1000.0, 4) for b in bin_edges],
            bin_size_sec=round(bin_size_sec, 4),
            matrix=matrix_data,
            metadata={
                "source_file": filename,
                "total_events": len(spike_events),
                "total_neurons": N,
                "duration_ms": duration_ms,
            },
        )

        total_spikes = len(spike_events)
        mean_pop_rate = round(float(total_spikes / (N * duration_sec)), 2)

        summary = SimulationSummary(
            total_neurons=N,
            duration_ms=duration_ms,
            total_spikes=total_spikes,
            mean_firing_rate_hz=mean_pop_rate,
            selected_neuron=sorted_neuron_ids[0],
            provenance=ProvenanceEnum.USER_UPLOADED,
        )

        return SimulationResponse(
            provenance=ProvenanceEnum.USER_UPLOADED,
            neuron_ids=sorted_neuron_ids,
            spike_events=spike_events,
            spikes_by_neuron=spikes_by_neuron,
            membrane_potentials=None,  # Extracellular spikes have no intracellular membrane trace
            spike_counts=spike_counts,
            firing_rates=firing_rates,
            isi_statistics=isi_stats,
            population_firing_rate=pop_firing_rate,
            summary=summary,
            simulation_parameters={"source_file": filename, "format": "csv_spike_train"},
            canonical_matrix=canonical_matrix,
        )

    # -------------------------------------------------------------------------
    # Sample CSV Generator for Testing
    # -------------------------------------------------------------------------
    @staticmethod
    def generate_sample_csv() -> str:
        """Generate a valid sample spike train CSV for quick testing."""
        rng = np.random.default_rng(42)
        n_neurons = 25
        duration_ms = 500.0
        lines = ["neuron_id,timestamp_ms"]
        for n_id in range(n_neurons):
            # Poisson-like firing ~15-35 Hz
            rate_hz = rng.uniform(15.0, 35.0)
            expected_spikes = int(rate_hz * (duration_ms / 1000.0))
            spike_times = np.sort(rng.uniform(5.0, duration_ms - 5.0, expected_spikes))
            for t in spike_times:
                lines.append(f"{n_id},{round(float(t), 2)}")
        return "\n".join(lines)


lif_simulation_service = LIFSimulationService()
