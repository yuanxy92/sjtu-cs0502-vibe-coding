import {
  Matrix,
  Vector,
  SequenceItem,
  StepMathDetails,
  StepGradientDetails,
  RNNWeights,
  ActivationType,
  EigenAnalysis,
  PresetKey,
} from '../types/rnn';

// Vector & Matrix Math Utilities
export function matVecMul(m: Matrix, v: Vector): Vector {
  return m.map((row) =>
    row.reduce((acc, cell, idx) => acc + cell * (v[idx] ?? 0), 0)
  );
}

export function matTranspose(m: Matrix): Matrix {
  if (m.length === 0) return [];
  const rows = m.length;
  const cols = m[0].length;
  const result: Matrix = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][r] = m[r][c];
    }
  }
  return result;
}

export function vecAdd(v1: Vector, v2: Vector): Vector {
  return v1.map((val, idx) => val + (v2[idx] ?? 0));
}

export function vecSub(v1: Vector, v2: Vector): Vector {
  return v1.map((val, idx) => val - (v2[idx] ?? 0));
}

export function vecScale(v: Vector, s: number): Vector {
  return v.map((val) => val * s);
}

export function vecDot(v1: Vector, v2: Vector): number {
  return v1.reduce((sum, val, idx) => sum + val * (v2[idx] ?? 0), 0);
}

export function vecNorm(v: Vector): number {
  return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
}

export function outerProduct(v1: Vector, v2: Vector): Matrix {
  return v1.map((a) => v2.map((b) => a * b));
}

export function matrixAdd(m1: Matrix, m2: Matrix): Matrix {
  return m1.map((row, r) => row.map((val, c) => val + (m2[r]?.[c] ?? 0)));
}

// Activations
export function activate(v: Vector, type: ActivationType): Vector {
  switch (type) {
    case 'tanh':
      return v.map((x) => Math.tanh(x));
    case 'relu':
      return v.map((x) => Math.max(0, x));
    case 'sigmoid':
      return v.map((x) => 1 / (1 + Math.exp(-Math.max(-50, Math.min(50, x)))));
    default:
      return v;
  }
}

export function activateDerivative(vActivated: Vector, type: ActivationType): Vector {
  switch (type) {
    case 'tanh':
      // d/dx tanh(x) = 1 - tanh^2(x)
      return vActivated.map((h) => Math.max(0, 1 - h * h));
    case 'relu':
      return vActivated.map((h) => (h > 0 ? 1 : 0));
    case 'sigmoid':
      return vActivated.map((h) => h * (1 - h));
    default:
      return vActivated.map(() => 1);
  }
}

// Eigenvalue & Stability Analysis for 2x2 Whh
export function analyzeEigenvalues(Whh: Matrix): EigenAnalysis {
  if (Whh.length < 2 || Whh[0].length < 2) {
    return {
      eigenvalues: [{ re: 1, im: 0 }, { re: 1, im: 0 }],
      spectralRadius: 1,
      stability: 'marginally-stable',
      description: 'Single-dimensional hidden state.',
    };
  }

  const a = Whh[0][0];
  const b = Whh[0][1];
  const c = Whh[1][0];
  const d = Whh[1][1];

  const trace = a + d;
  const det = a * d - b * c;
  const disc = trace * trace - 4 * det;

  let eigenvalues: { re: number; im: number }[] = [];
  let spectralRadius = 0;

  if (disc >= 0) {
    const sqrtDisc = Math.sqrt(disc);
    const l1 = (trace + sqrtDisc) / 2;
    const l2 = (trace - sqrtDisc) / 2;
    eigenvalues = [
      { re: l1, im: 0 },
      { re: l2, im: 0 },
    ];
    spectralRadius = Math.max(Math.abs(l1), Math.abs(l2));
  } else {
    const realPart = trace / 2;
    const imagPart = Math.sqrt(-disc) / 2;
    eigenvalues = [
      { re: realPart, im: imagPart },
      { re: realPart, im: -imagPart },
    ];
    spectralRadius = Math.sqrt(realPart * realPart + imagPart * imagPart);
  }

  let stability: 'stable' | 'marginally-stable' | 'unstable' = 'stable';
  let description = '';

  if (Math.abs(spectralRadius - 1) < 0.05) {
    stability = 'marginally-stable';
    description = 'Spectral radius ≈ 1.0 (Critical boundary: ideal for long-term memory retention without explosion).';
  } else if (spectralRadius < 1) {
    stability = 'stable';
    description = `Spectral radius ρ = ${spectralRadius.toFixed(2)} < 1.0 (Contraction mapping: gradients and hidden states decay exponentially).`;
  } else {
    stability = 'unstable';
    description = `Spectral radius ρ = ${spectralRadius.toFixed(2)} > 1.0 (Expansion: gradients and state activations risk exponential explosion).`;
  }

  return { eigenvalues, spectralRadius, stability, description };
}

// Forward Pass calculation
export function runForwardPass(
  sequence: SequenceItem[],
  weights: RNNWeights,
  activation: ActivationType = 'tanh'
): StepMathDetails[] {
  const steps: StepMathDetails[] = [];
  let currentH = [...weights.h0];

  for (let t = 0; t < sequence.length; t++) {
    const item = sequence[t];
    const x = item.x;
    const hPrev = currentH;

    const wxh_x = matVecMul(weights.Wxh, x);
    const whh_hPrev = matVecMul(weights.Whh, hPrev);
    const preAct = vecAdd(vecAdd(wxh_x, whh_hPrev), weights.bh);
    const h = activate(preAct, activation);

    const why_h = matVecMul(weights.Why, h);
    const preActY = vecAdd(why_h, weights.by);
    // Linear or tanh output projection
    const yHat = preActY.map((v) => Math.tanh(v));

    let loss: number | undefined;
    if (item.target) {
      loss =
        0.5 *
        item.target.reduce((acc, targetVal, idx) => {
          const diff = (yHat[idx] ?? 0) - targetVal;
          return acc + diff * diff;
        }, 0);
    }

    steps.push({
      t: t + 1,
      label: item.label,
      x,
      hPrev,
      wxh_x,
      whh_hPrev,
      bh: weights.bh,
      preAct,
      h,
      why_h,
      by: weights.by,
      preActY,
      yHat,
      target: item.target,
      loss,
    });

    currentH = h;
  }

  return steps;
}

// Backpropagation Through Time (BPTT)
export function runBPTT(
  steps: StepMathDetails[],
  weights: RNNWeights,
  activation: ActivationType = 'tanh'
): StepGradientDetails[] {
  const T = steps.length;
  const gradientSteps: StepGradientDetails[] = new Array(T);
  const WhyT = matTranspose(weights.Why);
  const WhhT = matTranspose(weights.Whh);

  // Gradient coming back from future step (starts at 0 after step T)
  let dL_dh_next: Vector = [0, 0];

  for (let t = T - 1; t >= 0; t--) {
    const step = steps[t];

    // 1. Output error dL/dyHat
    const dL_dyHat: Vector = step.target
      ? step.yHat.map((y, idx) => y - (step.target![idx] ?? 0))
      : [0];

    // Derivative of output activation tanh'(preActY) = 1 - yHat^2
    const dActY = step.yHat.map((y) => 1 - y * y);
    const dL_dPreActY = dL_dyHat.map((grad, i) => grad * dActY[i]);

    // 2. Direct gradient from output into hidden state h_t: dL_direct = Why^T * dL_dPreActY
    const dL_dh_direct = matVecMul(WhyT, dL_dPreActY);

    // 3. Recurrent gradient received from t+1: dL_dh_recurrent
    const dL_dh_recurrent = [...dL_dh_next];

    // Total gradient at h_t
    const dL_dh_total = vecAdd(dL_dh_direct, dL_dh_recurrent);
    const gNorm = vecNorm(dL_dh_total);

    // 4. Backprop through non-linearity: deltaH = dL_dh_total * act'(preAct)
    const actDeriv = activateDerivative(step.h, activation);
    const deltaH = dL_dh_total.map((grad, idx) => grad * actDeriv[idx]);

    // 5. Weight gradients for this timestep
    const dW_hh_step = outerProduct(deltaH, step.hPrev);
    const dW_xh_step = outerProduct(deltaH, step.x);
    const dB_h_step = [...deltaH];

    // 6. Compute gradient to send to step t-1:
    // dL/dh_{t-1} = Whh^T * deltaH
    dL_dh_next = matVecMul(WhhT, deltaH);

    let vanishedOrExploded: 'vanished' | 'exploding' | 'healthy' = 'healthy';
    if (gNorm < 0.05) vanishedOrExploded = 'vanished';
    else if (gNorm > 3.0) vanishedOrExploded = 'exploding';

    gradientSteps[t] = {
      t: t + 1,
      dL_dyHat,
      dL_dh_direct,
      dL_dh_recurrent,
      dL_dh_total,
      gradientNorm: gNorm,
      deltaH,
      dW_hh_step,
      dW_xh_step,
      dB_h_step,
      vanishedOrExploded,
    };
  }

  return gradientSteps;
}

// Presets
export const PRESETS: Record<
  PresetKey,
  {
    name: string;
    description: string;
    weights: RNNWeights;
    sequence: SequenceItem[];
    activation: ActivationType;
  }
> = {
  balanced: {
    name: 'Balanced Working Memory',
    description:
      'Moderate spectral radius (0.85). States blend past memory with current inputs smoothly without exploding.',
    weights: {
      Wxh: [
        [0.8, -0.4],
        [0.3, 0.9],
      ],
      Whh: [
        [0.75, -0.2],
        [0.2, 0.75],
      ],
      Why: [[0.7, -0.6]],
      bh: [0.0, 0.1],
      by: [0.0],
      h0: [0.0, 0.0],
    },
    sequence: [
      { id: '1', label: 'x₁ (Start)', x: [0.9, 0.1], target: [0.5] },
      { id: '2', label: 'x₂ (Pulse)', x: [0.1, 0.8], target: [0.2] },
      { id: '3', label: 'x₃ (Invert)', x: [-0.7, 0.4], target: [-0.6] },
      { id: '4', label: 'x₄ (Steady)', x: [0.2, 0.2], target: [-0.3] },
      { id: '5', label: 'x₅ (End)', x: [-0.5, -0.5], target: [0.1] },
    ],
    activation: 'tanh',
  },
  vanishing_gradient: {
    name: 'Vanishing Gradient Trap',
    description:
      'Whh weights are small (spectral radius = 0.28). Observe how backward gradients exponentially shrink to zero by time step 1!',
    weights: {
      Wxh: [
        [0.5, 0.3],
        [-0.4, 0.6],
      ],
      Whh: [
        [0.25, 0.05],
        [-0.05, 0.25],
      ],
      Why: [[0.8, 0.5]],
      bh: [0.0, 0.0],
      by: [0.0],
      h0: [0.0, 0.0],
    },
    sequence: [
      { id: '1', label: 't=1 (Long Ago)', x: [1.0, 0.0], target: [0.0] },
      { id: '2', label: 't=2', x: [0.5, 0.5], target: [0.0] },
      { id: '3', label: 't=3', x: [0.0, 1.0], target: [0.0] },
      { id: '4', label: 't=4', x: [-0.5, 0.5], target: [0.0] },
      { id: '5', label: 't=5 (Target Error)', x: [0.2, -0.8], target: [0.95] },
    ],
    activation: 'tanh',
  },
  exploding_gradient: {
    name: 'Exploding Gradient Risk',
    description:
      'Whh spectral radius > 1.45. Observe how backward gradients compound exponentially and hidden states rapidly saturate.',
    weights: {
      Wxh: [
        [0.5, -0.3],
        [0.2, 0.4],
      ],
      Whh: [
        [1.35, 0.3],
        [0.25, 1.25],
      ],
      Why: [[0.9, -0.7]],
      bh: [0.05, -0.05],
      by: [0.0],
      h0: [0.1, 0.1],
    },
    sequence: [
      { id: '1', label: 't=1', x: [0.4, 0.2], target: [0.1] },
      { id: '2', label: 't=2', x: [0.6, -0.3], target: [0.3] },
      { id: '3', label: 't=3', x: [0.2, 0.5], target: [0.6] },
      { id: '4', label: 't=4', x: [0.8, 0.1], target: [0.8] },
      { id: '5', label: 't=5 (Huge Error)', x: [-0.4, 0.7], target: [-0.9] },
    ],
    activation: 'tanh',
  },
  memory_latch: {
    name: 'Memory Latch (Identity Whh ≈ I)',
    description:
      'Recurrent weights close to identity (1.0). The hidden state acts as an accumulator latch, holding memories across long horizons.',
    weights: {
      Wxh: [
        [0.4, 0.0],
        [0.0, 0.4],
      ],
      Whh: [
        [0.98, 0.0],
        [0.0, 0.98],
      ],
      Why: [[0.6, 0.6]],
      bh: [0.0, 0.0],
      by: [0.0],
      h0: [0.0, 0.0],
    },
    sequence: [
      { id: '1', label: 'Impulse Input', x: [1.0, 0.0], target: [0.5] },
      { id: '2', label: 'Silence', x: [0.0, 0.0], target: [0.5] },
      { id: '3', label: 'Silence', x: [0.0, 0.0], target: [0.5] },
      { id: '4', label: 'Silence', x: [0.0, 0.0], target: [0.5] },
      { id: '5', label: 'Recall Check', x: [0.0, 0.0], target: [0.5] },
    ],
    activation: 'tanh',
  },
  oscillator: {
    name: 'State Space Oscillator',
    description:
      'Whh forms a 2D rotation matrix with negative off-diagonals. Hidden states rotate in a continuous cycle in phase space.',
    weights: {
      Wxh: [
        [0.4, 0.0],
        [0.0, 0.4],
      ],
      Whh: [
        [0.6, -0.75],
        [0.75, 0.6],
      ],
      Why: [[0.8, -0.4]],
      bh: [0.0, 0.0],
      by: [0.0],
      h0: [0.8, 0.0],
    },
    sequence: [
      { id: '1', label: 'Tick 1', x: [0.1, 0.0], target: [0.6] },
      { id: '2', label: 'Tick 2', x: [0.0, 0.1], target: [-0.3] },
      { id: '3', label: 'Tick 3', x: [-0.1, 0.0], target: [-0.7] },
      { id: '4', label: 'Tick 4', x: [0.0, -0.1], target: [0.4] },
      { id: '5', label: 'Tick 5', x: [0.1, 0.0], target: [0.8] },
    ],
    activation: 'tanh',
  },
  nlp_sentiment: {
    name: 'NLP Sentiment Stream',
    description:
      'Natural language tokens with 2D word embeddings: "Movie", "was", "not", "great", "overall". Notice how "not" flips the state vector!',
    weights: {
      Wxh: [
        [0.85, -0.6],
        [-0.4, 0.9],
      ],
      Whh: [
        [0.7, -0.2],
        [0.1, 0.75],
      ],
      Why: [[0.9, -0.8]],
      bh: [0.0, 0.0],
      by: [0.0],
      h0: [0.0, 0.0],
    },
    sequence: [
      { id: '1', label: '"Movie"', x: [0.2, 0.3], target: [0.1] },
      { id: '2', label: '"was"', x: [0.1, 0.1], target: [0.1] },
      { id: '3', label: '"not"', x: [-0.9, 0.7], target: [-0.7] },
      { id: '4', label: '"great"', x: [0.8, 0.2], target: [-0.5] },
      { id: '5', label: '"overall"', x: [0.1, 0.2], target: [-0.6] },
    ],
    activation: 'tanh',
  },
  sine_wave: {
    name: 'Sine Wave Forecaster',
    description:
      'Sequential continuous signal tracking. RNN hidden states encode frequency and phase information to predict the next value.',
    weights: {
      Wxh: [
        [0.9, 0.2],
        [-0.3, 0.8],
      ],
      Whh: [
        [0.7, -0.4],
        [0.4, 0.7],
      ],
      Why: [[0.8, 0.3]],
      bh: [0.0, 0.0],
      by: [0.0],
      h0: [0.0, 0.0],
    },
    sequence: [
      { id: '1', label: 'sin(0°)=0.0', x: [0.0, 1.0], target: [0.59] },
      { id: '2', label: 'sin(36°)=0.59', x: [0.59, 0.81], target: [0.95] },
      { id: '3', label: 'sin(72°)=0.95', x: [0.95, 0.31], target: [0.95] },
      { id: '4', label: 'sin(108°)=0.95', x: [0.95, -0.31], target: [0.59] },
      { id: '5', label: 'sin(144°)=0.59', x: [0.59, -0.81], target: [0.0] },
    ],
    activation: 'tanh',
  },
  binary_parity: {
    name: 'Binary Bit Parity Counter',
    description:
      'Calculates running parity (even/odd 1s). The hidden state toggles back and forth between two quadrants in phase space.',
    weights: {
      Wxh: [
        [1.2, 0.0],
        [0.0, -1.2],
      ],
      Whh: [
        [-0.85, 0.1],
        [0.1, -0.85],
      ],
      Why: [[0.9, -0.9]],
      bh: [0.0, 0.0],
      by: [0.0],
      h0: [0.0, 0.0],
    },
    sequence: [
      { id: '1', label: 'Bit 1: "1"', x: [1.0, 0.0], target: [1.0] },
      { id: '2', label: 'Bit 2: "1"', x: [1.0, 0.0], target: [-1.0] },
      { id: '3', label: 'Bit 3: "0"', x: [0.0, 0.0], target: [-1.0] },
      { id: '4', label: 'Bit 4: "1"', x: [1.0, 0.0], target: [1.0] },
      { id: '5', label: 'Bit 5: "0"', x: [0.0, 0.0], target: [1.0] },
    ],
    activation: 'tanh',
  },
};
