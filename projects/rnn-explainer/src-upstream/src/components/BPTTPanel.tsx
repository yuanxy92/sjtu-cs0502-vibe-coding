import React from 'react';
import {
  StepMathDetails,
  StepGradientDetails,
  RNNWeights,
  ActivationType,
} from '../types/rnn';
import {
  GitPullRequest,
  ArrowLeft,
  AlertTriangle,
  Flame,
  CheckCircle2,
  TrendingDown,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface BPTTPanelProps {
  steps: StepMathDetails[];
  gradients: StepGradientDetails[];
  currentStepIndex: number;
  weights: RNNWeights;
  activation: ActivationType;
  spectralRadius: number;
  onSelectStep: (idx: number) => void;
}

export const BPTTPanel: React.FC<BPTTPanelProps> = ({
  steps,
  gradients,
  currentStepIndex,
  weights,
  activation,
  spectralRadius,
  onSelectStep,
}) => {
  const currentStep = steps[currentStepIndex];
  const currentGrad = gradients[currentStepIndex];

  // Calculate cumulative weight gradients across all time steps
  const totalSteps = steps.length;
  const dW_hh_total = [
    [0, 0],
    [0, 0],
  ];
  const dW_xh_total = [
    [0, 0],
    [0, 0],
  ];

  gradients.forEach((g) => {
    if (!g) return;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        dW_hh_total[r][c] += g.dW_hh_step[r]?.[c] ?? 0;
        dW_xh_total[r][c] += g.dW_xh_step[r]?.[c] ?? 0;
      }
    }
  });

  // Calculate maximum gradient norm for relative scaling
  const maxNorm = Math.max(0.1, ...gradients.map((g) => g?.gradientNorm ?? 0));

  // Determine global gradient health status
  const firstGradNorm = gradients[0]?.gradientNorm ?? 0;
  const lastGradNorm = gradients[totalSteps - 1]?.gradientNorm ?? 0;
  const ratio = lastGradNorm > 0.001 ? firstGradNorm / lastGradNorm : 1;

  let gradientStatus: 'vanishing' | 'healthy' | 'exploding' = 'healthy';
  if (firstGradNorm < 0.03 && lastGradNorm > 0.15) {
    gradientStatus = 'vanishing';
  } else if (firstGradNorm > 3.0 || maxNorm > 4.0) {
    gradientStatus = 'exploding';
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <GitPullRequest className="w-5 h-5 text-rose-400 rotate-180" />
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide">
              Backpropagation Through Time (BPTT) Deep Dive
            </h2>
            <p className="text-xs text-slate-400">
              Tracing error gradient flow backward through temporal recurrence: Step t = {totalSteps} → Step t = 1.
            </p>
          </div>
        </div>

        {/* Global Gradient Status Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-semibold ${
            gradientStatus === 'vanishing'
              ? 'bg-amber-950/70 border border-amber-800/80 text-amber-300'
              : gradientStatus === 'exploding'
              ? 'bg-rose-950/70 border border-rose-800/80 text-rose-300'
              : 'bg-emerald-950/70 border border-emerald-800/80 text-emerald-300'
          }`}
        >
          {gradientStatus === 'vanishing' && (
            <>
              <TrendingDown className="w-4 h-4 text-amber-400" />
              <span>Vanishing Gradient (Gradient decayed to ~0 by Step t = 1)</span>
            </>
          )}
          {gradientStatus === 'exploding' && (
            <>
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Exploding Gradient (Gradient Norm &gt; 3.0)</span>
            </>
          )}
          {gradientStatus === 'healthy' && (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Healthy Gradient Flow Across Steps</span>
            </>
          )}
        </div>
      </div>

      {/* 1. Interactive Gradient Magnitude Profile Across Time Steps */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">
            Temporal Gradient Norm Profile: ‖∂L / ∂h_t‖ (Backprop from right to left)
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Max Norm: {maxNorm.toFixed(2)}
          </span>
        </div>

        {/* Bars Container */}
        <div className="grid grid-cols-5 gap-3 pt-2">
          {gradients.map((g, idx) => {
            const isSelected = idx === currentStepIndex;
            const norm = g?.gradientNorm ?? 0;
            const barHeightPct = Math.min(100, Math.max(8, (norm / maxNorm) * 100));

            return (
              <div
                key={`bptt-bar-${idx}`}
                onClick={() => onSelectStep(idx)}
                className={`cursor-pointer p-2.5 rounded-lg border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                  <span className={isSelected ? 'text-rose-300 font-bold' : 'text-slate-400'}>
                    Step t = {idx + 1}
                  </span>
                  <span
                    className={`font-bold ${
                      g.vanishedOrExploded === 'vanished'
                        ? 'text-slate-500'
                        : g.vanishedOrExploded === 'exploding'
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {norm.toFixed(2)}
                  </span>
                </div>

                {/* Vertical Bar Gauge */}
                <div className="w-full h-16 bg-slate-950 rounded flex items-end p-1 border border-slate-800/80">
                  <div
                    style={{ height: `${barHeightPct}%` }}
                    className={`w-full rounded transition-all duration-300 ${
                      g.vanishedOrExploded === 'vanished'
                        ? 'bg-slate-600'
                        : g.vanishedOrExploded === 'exploding'
                        ? 'bg-rose-500 shadow-sm shadow-rose-500'
                        : 'bg-rose-400'
                    }`}
                  ></div>
                </div>

                <div className="mt-2 text-center text-[10px] text-slate-400 font-sans truncate">
                  {steps[idx]?.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Step-by-Step Chain Rule Math for Currently Selected Step */}
      {currentGrad && currentStep && (
        <div className="bg-slate-950/80 border border-rose-900/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-rose-300 font-mono flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4 text-rose-400" />
              Chain Rule Breakdown for Step t = {currentStep.t} ({currentStep.label})
            </h3>
            <span className="text-xs font-mono text-slate-400">
              ‖∇h<sub>{currentStep.t}</sub>‖ = {currentGrad.gradientNorm.toFixed(3)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            {/* Direct Gradient from Output */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1.5">
              <span className="text-[11px] text-amber-300 font-semibold block">
                1. Direct Output Error (∂L<sub>{currentStep.t}</sub> / ∂h<sub>{currentStep.t}</sub>)
              </span>
              <p className="text-[10px] text-slate-400">
                W<sub>hy</sub><sup>T</sup> · (ŷ<sub>{currentStep.t}</sub> − y*<sub>{currentStep.t}</sub>)
              </p>
              <div className="text-slate-200 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                [{currentGrad.dL_dh_direct[0].toFixed(3)}, {currentGrad.dL_dh_direct[1].toFixed(3)}]
              </div>
            </div>

            {/* Recurrent Gradient from Step t+1 */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1.5">
              <span className="text-[11px] text-indigo-300 font-semibold block">
                2. Recurrent Future Error (∂L<sub>{currentStep.t + 1}</sub> / ∂h<sub>{currentStep.t}</sub>)
              </span>
              <p className="text-[10px] text-slate-400">
                W<sub>hh</sub><sup>T</sup> · diag(1 − h<sub>{currentStep.t + 1}</sub><sup>2</sup>) · (∂L / ∂h<sub>{currentStep.t + 1}</sub>)
              </p>
              <div className="text-slate-200 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                [{currentGrad.dL_dh_recurrent[0].toFixed(3)}, {currentGrad.dL_dh_recurrent[1].toFixed(3)}]
              </div>
            </div>

            {/* Total Gradient at h_t */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-rose-900/50 space-y-1.5">
              <span className="text-[11px] text-rose-300 font-semibold block">
                3. Total Hidden Gradient (∂L / ∂h<sub>{currentStep.t}</sub>)
              </span>
              <p className="text-[10px] text-slate-400">
                Direct Error + Recurrent Future Error
              </p>
              <div className="text-rose-200 font-bold bg-rose-950/40 px-2 py-1 rounded border border-rose-800/60">
                [{currentGrad.dL_dh_total[0].toFixed(3)}, {currentGrad.dL_dh_total[1].toFixed(3)}]
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Cumulative Parameter Gradients (dL/dWhh and dL/dWxh) */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-slate-200 font-mono">
          Accumulated Parameter Gradients Across Sequence: ∑ (δ<sub>t</sub> · h<sub>t-1</sub><sup>T</sup>)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Total dL/dWhh */}
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-indigo-300 font-semibold">∂L / ∂W<sub>hh</sub> =</span>
            <div className="border-l-2 border-r-2 border-indigo-400/60 px-2 py-1 flex flex-col gap-1 bg-slate-950 rounded">
              <div className="flex gap-3">
                <span className="w-12 text-right">{dW_hh_total[0][0].toFixed(3)}</span>
                <span className="w-12 text-right">{dW_hh_total[0][1].toFixed(3)}</span>
              </div>
              <div className="flex gap-3">
                <span className="w-12 text-right">{dW_hh_total[1][0].toFixed(3)}</span>
                <span className="w-12 text-right">{dW_hh_total[1][1].toFixed(3)}</span>
              </div>
            </div>
          </div>

          {/* Total dL/dWxh */}
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-sky-300 font-semibold">∂L / ∂W<sub>xh</sub> =</span>
            <div className="border-l-2 border-r-2 border-sky-400/60 px-2 py-1 flex flex-col gap-1 bg-slate-950 rounded">
              <div className="flex gap-3">
                <span className="w-12 text-right">{dW_xh_total[0][0].toFixed(3)}</span>
                <span className="w-12 text-right">{dW_xh_total[0][1].toFixed(3)}</span>
              </div>
              <div className="flex gap-3">
                <span className="w-12 text-right">{dW_xh_total[1][0].toFixed(3)}</span>
                <span className="w-12 text-right">{dW_xh_total[1][1].toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Why Vanishing / Exploding Gradients Occur (Pedagogical Explanation Card) */}
      <div className="bg-gradient-to-r from-slate-950 to-indigo-950/40 border border-slate-800 rounded-xl p-5 space-y-3">
        <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          The Fundamental Theorem of RNN Gradients: Why LSTMs and Transformers Were Born
        </h4>

        <p className="text-xs text-slate-300 leading-relaxed">
          When backpropagating from the final step T down to an earlier step t, the chain rule multiplies across every intervening recurrent link:
        </p>

        <div className="bg-slate-950/90 py-3 px-4 rounded-lg border border-slate-800 text-center font-mono text-xs text-slate-200 overflow-x-auto">
          <span className="text-cyan-300">∂h<sub>T</sub> / ∂h<sub>t</sub></span>
          <span className="text-slate-400"> = </span>
          <span className="text-indigo-300">(W<sub>hh</sub><sup>T</sup> · diag(1 − h<sub>t+1</sub><sup>2</sup>))</span>
          <span className="text-slate-500"> · </span>
          <span className="text-indigo-300">(W<sub>hh</sub><sup>T</sup> · diag(1 − h<sub>t+2</sub><sup>2</sup>))</span>
          <span className="text-slate-500"> · · · </span>
          <span className="text-indigo-300">(W<sub>hh</sub><sup>T</sup> · diag(1 − h<sub>T</sub><sup>2</sup>))</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400 pt-1">
          <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
            <span className="text-amber-300 font-semibold block mb-1">
              Case A: Spectral Radius ρ(W<sub>hh</sub>) &lt; 1.0 (Vanishing Gradient)
            </span>
            <p className="leading-relaxed">
              Multiplying by W<sub>hh</sub><sup>T</sup> repeatedly contracts the gradient magnitude like (0.7)<sup>T−t</sup> → 0. In addition, tanh′(x) ≤ 1.0 squashes values further. The network becomes unable to learn dependencies from tokens that occurred early in the sequence.
            </p>
          </div>

          <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
            <span className="text-rose-300 font-semibold block mb-1">
              Case B: Spectral Radius ρ(W<sub>hh</sub>) &gt; 1.0 (Exploding Gradient)
            </span>
            <p className="leading-relaxed">
              If the largest eigenvalue exceeds 1.0, the repeated matrix product (W<sub>hh</sub><sup>T</sup>)<sup>T−t</sup> compounds exponentially (e.g. 1.4<sup>10</sup> ≈ 28.9). This blows up gradient magnitudes, causing weight updates to destabilize or produce NaNs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
