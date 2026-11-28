# RNN Dynamics & Backpropagation (BPTT) Visualizer

An interactive educational simulator for exploring the internal mechanics of **Recurrent Neural Networks (RNNs)** and **Backpropagation Through Time (BPTT)**. 

This tool visualizes hidden state transitions across sequential data points, demystifies vector-matrix transformations, exposes the mathematical roots of vanishing and exploding gradients, and provides real-time eigenvalue and spectral radius analysis.

---

## 🌟 Key Features

### 1. Unrolled Temporal Computation Graph
- **Step-by-Step & Continuous Playback**: Scrub or animate through sequence time steps ($t = 1, \dots, T$) with forward and reverse flow modes.
- **Dynamic Hidden State Vectors**: Live dual-bar level meters display values in real time for 2D hidden states $h_t = [h^{(1)}, h^{(2)}]$, bounded within $[-1, 1]$ by $\tanh$.
- **Animated Flow Particles**: Color-coded pulses reveal the propagation of input projections ($W_{xh}$), recurrent transitions ($W_{hh}$), and output predictions ($W_{hy}$).

### 2. Folded vs. Unrolled Architecture Comparison
- **Compact Cyclic Representation**: Visualizes the single-unit RNN with its feedback loop and unit delay element ($z^{-1}$).
- **Parameter Sharing**: Demonstrates why $W_{xh}$, $W_{hh}$, and $W_{hy}$ remain identical across all time steps.
- **Latent Memory**: Shows how $h_t$ summarizes past context into a compact representation.

### 3. Vector Transformations & Matrix Math Inspector
- **Row-by-Column Dot Products**: Interactive inspection of matrix multiplications with color-coded row tracing.
- **Explicit Step Breakdown**:
  1. Input Projection: $W_{xh} \cdot x_t$
  2. Recurrent Memory: $W_{hh} \cdot h_{t-1}$
  3. Pre-Activation Summation with Bias: $a_t = W_{xh} x_t + W_{hh} h_{t-1} + b_h$
  4. Non-Linear Activation: $h_t = \text{activation}(a_t)$
  5. Output Projection & Loss: $\hat{y}_t = \text{activation}(W_{hy} h_t + b_y)$ and $L_t = \frac{1}{2}(\hat{y}_t - y^*_t)^2$

### 4. Backpropagation Through Time (BPTT) Simulator
- **Reverse Gradient Flow Mode**: Watch error signals propagate backwards through time from step $T$ down to step $1$.
- **Temporal Gradient Profile**: Bar chart tracking $\|\frac{\partial L}{\partial h_t}\|$ across time steps.
- **Automatic Diagnostics**: Instantly flags **Vanishing Gradients** ($\|\nabla h\| \approx 0$ at early steps) or **Exploding Gradients** ($\|\nabla h\| > 3.0$).
- **Accumulated Weight Updates**: Computes cumulative parameter updates $\frac{\partial L}{\partial W_{hh}} = \sum_t \delta_t \cdot h_{t-1}^T$ and $\frac{\partial L}{\partial W_{xh}} = \sum_t \delta_t \cdot x_t^T$.

### 5. Spectral Radius $\rho(W_{hh})$ & Stability Analysis
- **Live Complex Plane (Argand Diagram)**: Plots the eigenvalues $\lambda_1, \lambda_2$ of $W_{hh}$ relative to the unit circle ($|z| = 1.0$).
- **Dynamical Regime Identification**:
  - **$\rho(W_{hh}) < 1.0$ (Contraction)**: Past memories decay like $\rho^t \to 0$; triggers vanishing gradients.
  - **$\rho(W_{hh}) \approx 1.0$ (Critical / Latch)**: The "Goldilocks Zone" where signals and gradients circulate stably.
  - **$\rho(W_{hh}) > 1.0$ (Expansion)**: Hidden states saturate $\tanh$ bounds; causes exploding gradients.

### 6. 2D State Space Phase Portrait
- **Geometric Trajectory**: Plots the sequential path $h_0 \to h_1 \to \dots \to h_T$ across the $[-1.5, 1.5]^2$ coordinate plane.
- **Vector Flow Field**: Background field arrows reveal autonomous attractor drift $\Delta h = \tanh(W_{hh} h) - h$.
- **Interactive State Injection**: Click anywhere on the plane to set a custom initial state $h_0$.

### 7. Sequence Presets & Custom Data Stream Editor
- **Preset Scenarios**:
  - *Balanced Working Memory*: Moderate spectral radius ($\rho \approx 0.85$).
  - *Vanishing Gradient Trap*: Small weights causing gradients to decay to zero by step 1.
  - *Exploding Gradient Risk*: Large eigenvalues causing rapid gradient blowup.
  - *Memory Latch*: Identity recurrent weights ($W_{hh} \approx I$) preserving signals.
  - *State Space Oscillator*: Rotation matrix producing cyclical orbits.
  - *NLP Sentiment Stream*: Word embedding vectors showing state flipping (e.g. on negation tokens).
  - *Sine Wave Forecaster*: Continuous sequence signal tracking.
  - *Binary Bit Parity*: Even/odd parity flip-flop counter.
- **Custom Editor**: Add, modify, or remove sequence steps, token embeddings, and target outputs.

---

## 📐 Mathematical Formulation

### Forward Pass
At each time step $t \in \{1, \dots, T\}$:

$$a_t = W_{xh} \cdot x_t + W_{hh} \cdot h_{t-1} + b_h$$

$$h_t = \sigma(a_t) \quad \text{where } \sigma = \tanh, \text{ReLU}, \text{ or } \text{Sigmoid}$$

$$\hat{y}_t = \sigma_{\text{out}}(W_{hy} \cdot h_t + b_y)$$

$$L_t = \frac{1}{2} \|\hat{y}_t - y^*_t\|_2^2 \quad \text{and} \quad L = \sum_{t=1}^T L_t$$

### Backward Pass (BPTT)
The total gradient with respect to the hidden state $h_t$ is the sum of the direct output error and the recurrent error flowing back from the next step:

$$\frac{\partial L}{\partial h_t} = \underbrace{W_{hy}^T \cdot \left(\hat{y}_t - y^*_t\right) \odot \sigma'_{\text{out}}}_{\text{Direct Output Error}} + \underbrace{W_{hh}^T \cdot \left(\frac{\partial L}{\partial h_{t+1}} \odot \sigma'(a_{t+1})\right)}_{\text{Recurrent Future Error}}$$

Unrolling this recurrence from final step $T$ down to earlier step $t$ reveals the repeated matrix product:

$$\frac{\partial h_T}{\partial h_t} = \prod_{k=t+1}^T \left( W_{hh}^T \cdot \operatorname{diag}\left(\sigma'(a_k)\right) \right)$$

This product explains why eigenvalues of $W_{hh}$ with $|\lambda| < 1$ cause exponential decay (vanishing gradients) and $|\lambda| > 1$ cause exponential growth (exploding gradients), providing the historical motivation for LSTMs, GRUs, and Transformers.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `Space` | Toggle Play / Pause simulation |
| `→` (Right Arrow) | Step forward one time step |
| `←` (Left Arrow) | Step backward one time step |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- `npm` or `yarn` / `pnpm`

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/rnn-dynamics-visualizer.git
   cd rnn-dynamics-visualizer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000` (or the URL printed in your terminal).

### Production Build
To build the optimized static production bundle:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```

---

## 📂 Project Structure

```
├── index.html                       # HTML entry point with fonts & metadata
├── package.json                     # Project scripts and dependencies
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript compiler options
└── src/
    ├── main.tsx                     # React application root
    ├── App.tsx                      # Main application container & state engine
    ├── index.css                    # Tailwind CSS v4 styling & custom scrollbars
    ├── types/
    │   └── rnn.ts                   # TypeScript interfaces (Matrices, Vectors, Gradients)
    ├── utils/
    │   └── rnnMath.ts               # Linear algebra, forward pass, BPTT, and eigenvalue analysis
    └── components/
        ├── Header.tsx               # Top bar navigation & preset selectors
        ├── PlaybackControls.tsx     # Timeline scrubber, speed, and mode toggles
        ├── UnrolledRNNCanvas.tsx    # SVG computation graph with dual-bar meters & flow pulses
        ├── FoldedRNNView.tsx        # Compact loop view comparing folded vs. unrolled models
        ├── MatrixMathInspector.tsx  # Step-by-step vector-matrix arithmetic walkthrough
        ├── ParameterControls.tsx    # Interactive sliders for W_xh, W_hh, W_hy, and biases
        ├── BPTTPanel.tsx            # BPTT gradient profiler & vanishing gradient diagnostics
        ├── PhaseSpaceCanvas.tsx     # 2D state space trajectory & vector field
        ├── SequenceEditor.tsx       # Sequential token & vector input editor
        └── SpectralRadiusExplainer.tsx # Complex plane Argand diagram & eigenvalue explainer
```

---

## 🛠️ Built With

- **[React 19](https://react.dev/)**: Component architecture and state orchestration
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe matrix arithmetic and computation pipelines
- **[Tailwind CSS v4](https://tailwindcss.com/)**: Modern styling and dark-theme aesthetics
- **[Vite](https://vitejs.dev/)**: Fast dev server and optimized production bundler
- **[Lucide React](https://lucide.dev/)**: Clean icon set

---

## 📄 License

This project is licensed under the Apache 2.0 License.
