export type Vector = number[];
export type Matrix = number[][];

export interface SequenceItem {
  id: string;
  label: string;
  x: Vector;       // [d_in] (usually length 2)
  target?: Vector; // [d_out] (usually length 1)
}

export interface StepMathDetails {
  t: number;
  label: string;
  x: Vector;
  hPrev: Vector;
  wxh_x: Vector;    // Wxh * x
  whh_hPrev: Vector;// Whh * hPrev
  bh: Vector;       // bh
  preAct: Vector;   // wxh_x + whh_hPrev + bh
  h: Vector;        // act(preAct)
  why_h: Vector;    // Why * h
  by: Vector;       // by
  preActY: Vector;  // Why * h + by
  yHat: Vector;     // actY(preActY)
  target?: Vector;  // ground truth
  loss?: number;    // scalar 0.5 * (yHat - target)^2
}

export interface StepGradientDetails {
  t: number;
  dL_dyHat: Vector;         // dL/dyHat
  dL_dh_direct: Vector;     // from output at step t: Why^T * dL_dyHat
  dL_dh_recurrent: Vector;  // from step t+1: Whh^T * diag(1-h_{t+1}^2) * dL_dh_{t+1}
  dL_dh_total: Vector;      // sum of direct + recurrent
  gradientNorm: number;     // ||dL_dh_total||
  deltaH: Vector;           // dL_da = dL_dh_total * (1 - h_t^2)
  dW_hh_step: Matrix;       // deltaH * hPrev^T
  dW_xh_step: Matrix;       // deltaH * x^T
  dB_h_step: Vector;        // deltaH
  vanishedOrExploded: 'vanished' | 'exploding' | 'healthy';
}

export interface RNNWeights {
  Wxh: Matrix; // [d_h x d_in] e.g. 2 x 2
  Whh: Matrix; // [d_h x d_h] e.g. 2 x 2
  Why: Matrix; // [d_y x d_h] e.g. 1 x 2
  bh: Vector;  // [d_h] e.g. 2
  by: Vector;  // [d_y] e.g. 1
  h0: Vector;  // Initial hidden state [d_h]
}

export type ActivationType = 'tanh' | 'relu' | 'sigmoid';

export interface EigenAnalysis {
  eigenvalues: { re: number; im: number }[];
  spectralRadius: number;
  stability: 'stable' | 'marginally-stable' | 'unstable';
  description: string;
}

export type PresetKey =
  | 'balanced'
  | 'vanishing_gradient'
  | 'exploding_gradient'
  | 'memory_latch'
  | 'oscillator'
  | 'nlp_sentiment'
  | 'sine_wave'
  | 'binary_parity';

export type ActiveTab = 'unrolled' | 'folded' | 'bptt' | 'phasespace' | 'math';
