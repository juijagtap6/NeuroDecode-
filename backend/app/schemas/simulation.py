"""Simulation module schemas for Leaky Integrate-and-Fire (LIF) population models and dataset uploads."""
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator
from .common import ProvenanceEnum
from .matrix import CanonicalSpikeMatrix

class SimulationModeEnum(str, Enum):
    """Simulation operating modes."""
    QUICK = "quick"
    CUSTOM = "custom"
    BYOD = "byod"

class LIFSimConfig(BaseModel):
    """Legacy configuration parameters for single LIF neuron simulation."""
    v_rest: float = Field(default=-70.0, description="Resting membrane potential in mV")
    v_thresh: float = Field(default=-50.0, description="Spike action potential threshold in mV")
    v_reset: float = Field(default=-65.0, description="Reset potential after spike in mV")
    tau_m: float = Field(default=20.0, description="Membrane time constant in ms (tau = R_m * C_m)")
    r_m: float = Field(default=10.0, description="Membrane resistance in MegaOhms")
    t_ref: float = Field(default=2.0, description="Absolute refractory period in ms")
    duration_ms: float = Field(default=500.0, ge=10.0, le=5000.0, description="Total simulation time in ms")
    dt_ms: float = Field(default=0.1, ge=0.01, le=1.0, description="Integration time step dt in ms")
    i_inj_type: str = Field(default="step", description="Current type: 'step', 'pulse', 'ramp', or 'noisy'")
    i_inj_amplitude: float = Field(default=2.5, description="Input current amplitude in nA")
    i_inj_onset_ms: float = Field(default=50.0, description="Stimulus onset time in ms")
    i_inj_offset_ms: float = Field(default=450.0, description="Stimulus offset time in ms")
    noise_sigma: float = Field(default=0.2, description="Noise standard deviation for 'noisy' current")

class LIFSimResult(BaseModel):
    """Result of legacy single LIF simulation."""
    provenance: ProvenanceEnum = Field(default=ProvenanceEnum.SYNTHETIC_LIF, description="Origin tag - always synthetic_lif")
    time_ms: List[float] = Field(..., description="Time points in ms")
    v_m: List[float] = Field(..., description="Membrane potential V(t) in mV")
    i_inj: List[float] = Field(..., description="Injected current trace I(t) in nA")
    spike_times_ms: List[float] = Field(..., description="Timestamps of generated spikes in ms")
    total_spikes: int = Field(..., description="Total count of emitted action potentials")
    mean_firing_rate_hz: float = Field(..., description="Mean firing rate across simulation in Hz")
    config: LIFSimConfig = Field(..., description="Simulation parameters used")

# =========================================================================
# Population LIF Schemas
# =========================================================================

class LIFPopulationParams(BaseModel):
    """Configuration parameters for population LIF neural simulation."""
    num_neurons: int = Field(default=100, ge=1, le=2000, description="Total number of neurons in population")
    ei_ratio: float = Field(default=0.8, ge=0.0, le=1.0, description="Fraction of excitatory neurons (0.8 = 80% E, 20% I)")
    connection_density: float = Field(default=0.1, ge=0.0, le=1.0, description="Synaptic connection density (0.0 = uncoupled, 1.0 = fully connected)")
    tau_m: float = Field(default=20.0, ge=1.0, le=200.0, description="Membrane time constant tau_m in ms")
    v_rest: float = Field(default=-65.0, ge=-100.0, le=0.0, description="Resting membrane potential in mV")
    v_thresh: float = Field(default=-50.0, ge=-80.0, le=0.0, description="Spike action potential threshold in mV")
    v_reset: float = Field(default=-65.0, ge=-100.0, le=0.0, description="Reset potential after spike in mV")
    r_m: float = Field(default=1.5, ge=0.01, le=50.0, description="Membrane resistance in MegaOhms")
    t_ref: float = Field(default=2.0, ge=0.0, le=50.0, description="Refractory period in ms")
    i_inj: float = Field(default=14.0, ge=-100.0, le=500.0, description="Input current in pA")
    noise: float = Field(default=0.8, ge=0.0, le=20.0, description="Noise amplitude sigma")
    duration_ms: float = Field(default=500.0, ge=10.0, le=10000.0, description="Simulation duration in ms")
    dt_ms: float = Field(default=0.1, ge=0.01, le=2.0, description="Integration time step dt in ms")
    random_seed: Optional[int] = Field(default=None, description="Optional random seed for deterministic reproduction")
    selected_neuron_id: int = Field(default=0, ge=0, description="Neuron ID selected for detailed membrane potential recording")

    @model_validator(mode="after")
    def validate_physics(self) -> "LIFPopulationParams":
        if self.v_reset >= self.v_thresh:
            raise ValueError(f"Reset potential ({self.v_reset} mV) must be strictly less than threshold ({self.v_thresh} mV).")
        if self.dt_ms >= self.tau_m:
            raise ValueError(f"Integration timestep dt ({self.dt_ms} ms) must be smaller than membrane time constant tau_m ({self.tau_m} ms).")
        if self.selected_neuron_id >= self.num_neurons:
            self.selected_neuron_id = 0
        return self

class SimulationRunRequest(BaseModel):
    """Request payload for POST /api/v1/simulation/run."""
    mode: SimulationModeEnum = Field(default=SimulationModeEnum.QUICK, description="Simulation mode: 'quick' or 'custom'")
    params: LIFPopulationParams = Field(default_factory=LIFPopulationParams, description="LIF and network parameters")

class SpikeEvent(BaseModel):
    """Individual action potential event."""
    neuron_id: int = Field(..., description="Neuron index (0 to N-1)")
    time_ms: float = Field(..., description="Spike timestamp in ms")

class MembranePotentialData(BaseModel):
    """Membrane potential V(t) trajectory for inspected neuron(s)."""
    time_ms: List[float] = Field(..., description="Time vector in ms")
    traces: Dict[str, List[float]] = Field(..., description="Mapping of neuron_id string to V(t) in mV")
    v_thresh: float = Field(..., description="Threshold potential in mV")
    v_reset: float = Field(..., description="Reset potential in mV")
    v_rest: float = Field(..., description="Resting potential in mV")

class ISIStats(BaseModel):
    """Inter-spike interval (ISI) statistics."""
    mean_isi_ms: Dict[str, float] = Field(..., description="Mean ISI in ms per neuron")
    cv_isi: Dict[str, float] = Field(..., description="Coefficient of variation (CV) of ISI per neuron")
    population_mean_isi_ms: float = Field(..., description="Mean ISI across the entire spiking population in ms")
    population_cv_isi: float = Field(..., description="Pooled CV ISI across population")

class PopulationFiringRate(BaseModel):
    """Population average firing rate over time."""
    time_bins_ms: List[float] = Field(..., description="Time bin centers in ms")
    rates_hz: List[float] = Field(..., description="Average population firing rate in each bin in Hz")
    bin_size_ms: float = Field(..., description="Bin width in ms")

class SimulationSummary(BaseModel):
    """Top-level summary of simulation or uploaded neural dataset."""
    total_neurons: int = Field(..., description="Number of neurons")
    duration_ms: float = Field(..., description="Total duration in ms")
    total_spikes: int = Field(..., description="Total spikes emitted across population")
    mean_firing_rate_hz: float = Field(..., description="Population mean firing rate in Hz")
    selected_neuron: int = Field(..., description="Currently selected neuron ID")
    provenance: ProvenanceEnum = Field(..., description="Provenance tag: synthetic_lif or user_uploaded")

class SimulationResponse(BaseModel):
    """
    Canonical neural representation produced by both simulation runs and BYOD uploads.
    Used downstream by PCA, decoding, SHAP, and Comparison modules without conversion.
    """
    provenance: ProvenanceEnum = Field(..., description="Data origin: synthetic_lif or user_uploaded")
    neuron_ids: List[int] = Field(..., description="List of neuron IDs")
    spike_events: List[SpikeEvent] = Field(..., description="List of all spike events (neuron_id, time_ms)")
    spikes_by_neuron: Dict[str, List[float]] = Field(..., description="Dictionary mapping neuron_id string to spike timestamps in ms")
    membrane_potentials: Optional[MembranePotentialData] = Field(None, description="Membrane potential traces for inspected neuron(s)")
    spike_counts: Dict[str, int] = Field(..., description="Total spike count per neuron")
    firing_rates: Dict[str, float] = Field(..., description="Mean firing rate in Hz per neuron")
    isi_statistics: ISIStats = Field(..., description="ISI statistics per neuron and population")
    population_firing_rate: PopulationFiringRate = Field(..., description="Population firing rate over time")
    summary: SimulationSummary = Field(..., description="Key summary metrics")
    simulation_parameters: Dict[str, Any] = Field(default_factory=dict, description="Simulation or upload configuration metadata")
    canonical_matrix: Optional[CanonicalSpikeMatrix] = Field(None, description="Standard CanonicalSpikeMatrix representation")
