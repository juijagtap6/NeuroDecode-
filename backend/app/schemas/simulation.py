"""Simulation module schemas for Leaky Integrate-and-Fire (LIF) neuron."""
from pydantic import BaseModel, Field
from typing import List, Optional
from .common import ProvenanceEnum

class LIFSimConfig(BaseModel):
    """Configuration parameters for Leaky Integrate-and-Fire (LIF) neuron simulation."""
    v_rest: float = Field(default=-70.0, description="Resting membrane potential in mV")
    v_thresh: float = Field(default=-50.0, description="Spike action potential threshold in mV")
    v_reset: float = Field(default=-65.0, description="Reset potential after spike in mV")
    tau_m: float = Field(default=20.0, description="Membrane time constant in ms (tau = R_m * C_m)")
    r_m: float = Field(default=10.0, description="Membrane resistance in MegaOhms")
    t_ref: float = Field(default=2.0, description="Absolute refractory period in ms")
    
    # Simulation duration and input
    duration_ms: float = Field(default=500.0, ge=10.0, le=5000.0, description="Total simulation time in ms")
    dt_ms: float = Field(default=0.1, ge=0.01, le=1.0, description="Integration time step dt in ms")
    
    # Injected current stimulus
    i_inj_type: str = Field(
        default="step",
        description="Current type: 'step', 'pulse', 'ramp', or 'noisy'"
    )
    i_inj_amplitude: float = Field(default=2.5, description="Input current amplitude in nA")
    i_inj_onset_ms: float = Field(default=50.0, description="Stimulus onset time in ms")
    i_inj_offset_ms: float = Field(default=450.0, description="Stimulus offset time in ms")
    noise_sigma: float = Field(default=0.2, description="Noise standard deviation for 'noisy' current")

class LIFSimResult(BaseModel):
    """Result of LIF simulation containing membrane potential trajectory and spike events."""
    provenance: ProvenanceEnum = Field(
        default=ProvenanceEnum.SYNTHETIC_LIF,
        description="Origin tag - always explicitly synthetic_lif"
    )
    time_ms: List[float] = Field(..., description="Time points in ms")
    v_m: List[float] = Field(..., description="Membrane potential V(t) in mV")
    i_inj: List[float] = Field(..., description="Injected current trace I(t) in nA")
    spike_times_ms: List[float] = Field(..., description="Timestamps of generated spikes in ms")
    total_spikes: int = Field(..., description="Total count of emitted action potentials")
    mean_firing_rate_hz: float = Field(..., description="Mean firing rate across simulation in Hz")
    config: LIFSimConfig = Field(..., description="Simulation parameters used")
