# NeuroDecode

**NeuroDecode** is a scientific neuroscience web application for exploring, decoding, simulating, and comparing neural population activity using authentic electrophysiology data from the official **Allen Institute for Brain Science**.

---

## 1. System Architecture & Tech Stack

```mermaid
graph TD
    subgraph Frontend ["React 19 + TypeScript + Vite (Port 5173)"]
        UI[App Shell & Navigation]
        M1[Explorer View]
        M2[Decoder View]
        M3[Simulation View - LIF]
        M4[Comparison View]
        Badge[Provenance Badge System]
    end

    subgraph Backend ["FastAPI + Python 3.11 (Port 8000)"]
        API[API Router /api/v1/]
        Health[/api/v1/health]
        Sessions[/api/v1/sessions]
        DAL[Data Access Layer: AllenDataService]
        Cache[(Local Allen Cache: sessions.csv, units.csv)]
    end

    subgraph Scientific ["Scientific Analysis Stack"]
        Sci[NumPy, SciPy, pandas, scikit-learn]
        NWB[PyNWB, h5py, AllenSDK]
    end

    UI --> API
    API --> DAL
    DAL --> Cache
    DAL --> Sci
    DAL --> NWB
```

* **Frontend**: React 19, TypeScript 5.7, Vite 6, Lucide React.
* **Backend**: Python 3.11, FastAPI, Pydantic v2, Uvicorn.
* **Scientific & Neural Processing**: NumPy, SciPy, pandas, scikit-learn, PyNWB, h5py, AllenSDK.

---

## 2. The Four Distinct Modules

1. **Explorer**:
   * Browse 58 official Allen Brain Observatory Neuropixels visual coding sessions.
   * Inspect recorded single units and quality control metrics (SNR, firing rate, ISI violations, presence ratio).
   * Filter units across visual cortex and thalamus structures (e.g., `VISp`, `VISl`, `VISpm`, `LGd`, `LP`, `CA1`).
   * Explore visual stimulus presentation protocols (`drifting_gratings`, `natural_scenes`, `static_gratings`, `flashes`).
2. **Decoder**:
   * **Models**: Train population decoders (Logistic Regression, Ridge Classifier, Random Forest) on binned neural vectors.
   * **Performance**: Held-out test evaluation, stratified K-fold cross-validation, and confusion matrices.
   * **Explainability**: Defensible model weight distributions and feature importance rankings mapped to units and CCFv3 brain areas.
3. **Simulation (LIF Only)**:
   * Biophysical Leaky Integrate-and-Fire (LIF) numerical integration.
   * Adjustable biological parameters: $V_{\text{rest}}$, $V_{\text{thresh}}$, $V_{\text{reset}}$, $\tau_m$, $R_m$, $t_{\text{ref}}$.
   * Configurable stimulus currents: step, pulse, ramp, or noisy input.
   * Visualizations of membrane potential trajectory $V(t)$ and spike timestamps.
   * *Note*: Izhikevich and Hodgkin-Huxley models are strictly reserved for future scope.
4. **Comparison**:
   * Standardized comparison across authentic Allen experimental data and synthetic LIF simulations using the identical **Canonical Spike Matrix** representation (`CanonicalSpikeMatrix`).
   * Supported comparative metrics:
     1. **Firing Statistics**: Mean firing rate distributions, Inter-Spike Interval (ISI) histograms, CV of ISI, and Fano factor.
     2. **Correlation**: Pairwise Pearson correlation matrices of binned spike trains.
     3. **PCA**: Population state space trajectories and explained variance spectra.
   * **Strict Provenance Enforcement**: Experimental data is tagged `allen_experimental` and synthetic data is tagged `synthetic_lif`. Synthetic results are never presented as experimental.

---

## 3. Real-Data Feasibility & Provenance Report

A minimal real-data feasibility test was executed on candidate session **`715093703`** (`Sst-IRES-Cre/wt;Ai32` mouse, `brain_observatory_1.1` protocol):

| Metric | Verified Value |
| :--- | :--- |
| **Official Source** | Allen Brain Observatory Neuropixels Visual Coding (White, de Vries, Siegle et al.) |
| **Access Method** | AllenSDK `EcephysProjectCache.from_warehouse` querying `api.brain-map.org` |
| **Total Sessions Available** | 58 experimental sessions |
| **Session 715093703 Units** | 884 units across 14 structures (`CA1`: 145, `LP`: 139, `LGd`: 82, `VISrl`: 76, `VISp`: 60, `VISpm`: 50, `VISl`: 42, `VISam`: 30) |
| **Unit Quality Metrics Available** | `snr`, `firing_rate`, `isi_violations`, `presence_ratio`, `isolation_distance`, `amplitude_cutoff` |
| **Metadata Download Footprint** | Sessions table: ~7.9 KB; Units table: ~51.5 MB; Probes: ~27.2 KB; Channels: ~6.4 MB |
| **Full Session NWB Size** | **2,723.92 MB (2.66 GB)** via WellKnownFile `1026124469` |
| **Byte-Range Capability** | HTTP 206 Partial Content verified on Allen API endpoint |
| **Data Policy Safeguard** | Monolithic 2.66 GB raw NWB is **not** downloaded without explicit user approval. Session summaries and unit metadata tables are loaded from local cache. Missing raw data triggers a clear `FileNotFoundError` rather than fabricating synthetic data. |

---

## 4. Local Execution Guide

### Prerequisites
* Python 3.11 (`py -3.11`)
* Node.js v20+ (`npm.cmd`)

### Backend Setup
```powershell
# 1. Create and activate virtual environment
py -3.11 -m venv backend/.venv
backend\.venv\Scripts\activate

# 2. Install pinned dependencies
pip install -r backend/requirements.txt

# 3. Run backend tests
$env:PYTHONPATH="backend"
pytest backend/tests

# 4. Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend will be live at: `http://localhost:8000` (API Docs: `http://localhost:8000/docs`).

### Frontend Setup
```powershell
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm.cmd install

# 3. Build and test bundle
npm.cmd run build

# 4. Start Vite development server
npm.cmd run dev
```
Frontend will be live at: `http://localhost:5173`.

---

## 5. Branching & Development Workflow

To meet the 2-day MVP target, work is divided across two dedicated Git branches based on the agreed Phase 1 shared contracts:

* **Branch 1 (`feature/explorer-simulation`)**:
  * Explorer Module (Session selector, CCFv3 Unit table, Stimulus presentation viewer, Canvas raster plot).
  * Simulation Module (LIF ODE integrator, parameter sliders, $V(t)$ trace, and spike raster).
* **Branch 2 (`feature/decoder-comparison`)**:
  * Decoder Module (Population spike vectorizer, scikit-learn models, test evaluation metrics, unit importance explainability).
  * Comparison Module (Firing statistics, correlation matrix, PCA projection, comparative visualizations).