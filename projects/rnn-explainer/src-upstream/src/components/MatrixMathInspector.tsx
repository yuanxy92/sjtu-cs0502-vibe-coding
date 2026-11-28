import React, { useState } from 'react';
import { StepMathDetails, RNNWeights, ActivationType } from '../types/rnn';
import { Calculator, ArrowRight, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

interface MatrixMathInspectorProps {
  step: StepMathDetails;
  weights: RNNWeights;
  activation: ActivationType;
}

export const MatrixMathInspector: React.FC<MatrixMathInspectorProps> = ({
  step,
  weights,
  activation,
}) => {
  const [highlightRow, setHighlightRow] = useState<number | null>(null);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Calculator className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide">
              Vector & Matrix Transformations at Step t = {step.t} ({step.label})
            </h2>
            <p className="text-xs text-slate-400">
              Interactive algebraic walkthrough of the linear transformations, bias addition, squashing, and output projection.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Hover a row to trace dot products:</span>
          <div className="flex gap-1.5">
            <button
              onMouseEnter={() => setHighlightRow(0)}
              onMouseLeave={() => setHighlightRow(null)}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                highlightRow === 0
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              Row 1
            </button>
            <button
              onMouseEnter={() => setHighlightRow(1)}
              onMouseLeave={() => setHighlightRow(null)}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                highlightRow === 1
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              Row 2
            </button>
          </div>
        </div>
      </div>

      {/* Main Formula Banner */}
      <div className="bg-slate-950/80 border border-indigo-900/40 rounded-xl p-4 text-center font-mono text-sm sm:text-base text-slate-200">
        <span className="text-cyan-400 font-bold">h<sub>{step.t}</sub></span>
        <span className="text-slate-400"> = </span>
        <span className="text-indigo-400 font-bold">{activation}</span>
        <span className="text-slate-400">( </span>
        <span className="text-sky-400 font-semibold">W<sub>xh</sub></span>
        <span className="text-slate-400"> · </span>
        <span className="text-sky-300">x<sub>{step.t}</sub></span>
        <span className="text-slate-400"> + </span>
        <span className="text-indigo-400 font-semibold">W<sub>hh</sub></span>
        <span className="text-slate-400"> · </span>
        <span className="text-indigo-300">h<sub>{step.t - 1}</sub></span>
        <span className="text-slate-400"> + </span>
        <span className="text-emerald-400 font-semibold">b<sub>h</sub></span>
        <span className="text-slate-400"> )</span>
      </div>

      {/* Grid of the 2 parallel matrix-vector products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Component 1: W_xh * x_t */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-400 font-mono">
              [Part 1] Input Projection: W<sub>xh</sub> · x<sub>{step.t}</sub>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">[2×2] · [2×1] → [2×1]</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-slate-900/40 rounded-lg text-xs font-mono">
            {/* Wxh Matrix */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-sky-400 mb-1">W<sub>xh</sub></span>
              <div className="border-l-2 border-r-2 border-sky-500/60 px-2 py-1 flex flex-col gap-1 rounded">
                <div
                  className={`flex gap-2 p-0.5 rounded ${
                    highlightRow === 0 ? 'bg-sky-500/20 text-sky-200' : 'text-slate-300'
                  }`}
                >
                  <span className="w-10 text-right">{weights.Wxh[0][0].toFixed(2)}</span>
                  <span className="w-10 text-right">{weights.Wxh[0][1].toFixed(2)}</span>
                </div>
                <div
                  className={`flex gap-2 p-0.5 rounded ${
                    highlightRow === 1 ? 'bg-sky-500/20 text-sky-200' : 'text-slate-300'
                  }`}
                >
                  <span className="w-10 text-right">{weights.Wxh[1][0].toFixed(2)}</span>
                  <span className="w-10 text-right">{weights.Wxh[1][1].toFixed(2)}</span>
                </div>
              </div>
            </div>

            <span className="text-slate-500 font-bold">·</span>

            {/* x_t Vector */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-sky-300 mb-1">x<sub>{step.t}</sub></span>
              <div className="border-l-2 border-r-2 border-sky-400/60 px-2 py-1 flex flex-col gap-1 rounded">
                <span className="w-10 text-center">{step.x[0].toFixed(2)}</span>
                <span className="w-10 text-center">{step.x[1].toFixed(2)}</span>
              </div>
            </div>

            <span className="text-slate-500 font-bold">=</span>

            {/* Result Vector */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-sky-400 mb-1">W<sub>xh</sub> · x</span>
              <div className="border-l-2 border-r-2 border-sky-300 px-2 py-1 flex flex-col gap-1 rounded bg-sky-950/30">
                <span className="w-12 text-center font-bold text-sky-200">
                  {step.wxh_x[0].toFixed(2)}
                </span>
                <span className="w-12 text-center font-bold text-sky-200">
                  {step.wxh_x[1].toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
            <p>
              Row 1: ({weights.Wxh[0][0].toFixed(2)} × {step.x[0].toFixed(2)}) + ({weights.Wxh[0][1].toFixed(2)} × {step.x[1].toFixed(2)}) = {step.wxh_x[0].toFixed(3)}
            </p>
            <p>
              Row 2: ({weights.Wxh[1][0].toFixed(2)} × {step.x[0].toFixed(2)}) + ({weights.Wxh[1][1].toFixed(2)} × {step.x[1].toFixed(2)}) = {step.wxh_x[1].toFixed(3)}
            </p>
          </div>
        </div>

        {/* Component 2: W_hh * h_{t-1} */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-400 font-mono">
              [Part 2] Recurrent Memory: W<sub>hh</sub> · h<sub>{step.t - 1}</sub>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">[2×2] · [2×1] → [2×1]</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-slate-900/40 rounded-lg text-xs font-mono">
            {/* Whh Matrix */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-indigo-400 mb-1">W<sub>hh</sub></span>
              <div className="border-l-2 border-r-2 border-indigo-500/60 px-2 py-1 flex flex-col gap-1 rounded">
                <div
                  className={`flex gap-2 p-0.5 rounded ${
                    highlightRow === 0 ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-300'
                  }`}
                >
                  <span className="w-10 text-right">{weights.Whh[0][0].toFixed(2)}</span>
                  <span className="w-10 text-right">{weights.Whh[0][1].toFixed(2)}</span>
                </div>
                <div
                  className={`flex gap-2 p-0.5 rounded ${
                    highlightRow === 1 ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-300'
                  }`}
                >
                  <span className="w-10 text-right">{weights.Whh[1][0].toFixed(2)}</span>
                  <span className="w-10 text-right">{weights.Whh[1][1].toFixed(2)}</span>
                </div>
              </div>
            </div>

            <span className="text-slate-500 font-bold">·</span>

            {/* h_{t-1} Vector */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-indigo-300 mb-1">h<sub>{step.t - 1}</sub></span>
              <div className="border-l-2 border-r-2 border-indigo-400/60 px-2 py-1 flex flex-col gap-1 rounded">
                <span className="w-10 text-center">{step.hPrev[0].toFixed(2)}</span>
                <span className="w-10 text-center">{step.hPrev[1].toFixed(2)}</span>
              </div>
            </div>

            <span className="text-slate-500 font-bold">=</span>

            {/* Result Vector */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-indigo-400 mb-1">W<sub>hh</sub> · h<sub>prev</sub></span>
              <div className="border-l-2 border-r-2 border-indigo-300 px-2 py-1 flex flex-col gap-1 rounded bg-indigo-950/30">
                <span className="w-12 text-center font-bold text-indigo-200">
                  {step.whh_hPrev[0].toFixed(2)}
                </span>
                <span className="w-12 text-center font-bold text-indigo-200">
                  {step.whh_hPrev[1].toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
            <p>
              Row 1: ({weights.Whh[0][0].toFixed(2)} × {step.hPrev[0].toFixed(2)}) + ({weights.Whh[0][1].toFixed(2)} × {step.hPrev[1].toFixed(2)}) = {step.whh_hPrev[0].toFixed(3)}
            </p>
            <p>
              Row 2: ({weights.Whh[1][0].toFixed(2)} × {step.hPrev[0].toFixed(2)}) + ({weights.Whh[1][1].toFixed(2)} × {step.hPrev[1].toFixed(2)}) = {step.whh_hPrev[1].toFixed(3)}
            </p>
          </div>
        </div>
      </div>

      {/* Step 3: Summation with bias and non-linear squashing */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
        <span className="text-xs font-semibold text-emerald-400 font-mono">
          [Part 3 & 4] Pre-Activation Summation & Non-Linear Squashing: a<sub>t</sub> → h<sub>t</sub>
        </span>

        <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
          {/* wxh_x */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-sky-400 mb-1">W<sub>xh</sub>·x</span>
            <div className="border-l-2 border-r-2 border-sky-400/60 px-2 py-1 flex flex-col gap-1">
              <span>{step.wxh_x[0].toFixed(2)}</span>
              <span>{step.wxh_x[1].toFixed(2)}</span>
            </div>
          </div>

          <span className="text-slate-500 font-bold">+</span>

          {/* whh_hPrev */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-indigo-400 mb-1">W<sub>hh</sub>·h<sub>prev</sub></span>
            <div className="border-l-2 border-r-2 border-indigo-400/60 px-2 py-1 flex flex-col gap-1">
              <span>{step.whh_hPrev[0].toFixed(2)}</span>
              <span>{step.whh_hPrev[1].toFixed(2)}</span>
            </div>
          </div>

          <span className="text-slate-500 font-bold">+</span>

          {/* bh */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-emerald-400 mb-1">b<sub>h</sub> (Bias)</span>
            <div className="border-l-2 border-r-2 border-emerald-400/60 px-2 py-1 flex flex-col gap-1">
              <span>{weights.bh[0].toFixed(2)}</span>
              <span>{weights.bh[1].toFixed(2)}</span>
            </div>
          </div>

          <span className="text-slate-500 font-bold">=</span>

          {/* preAct (a_t) */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-amber-300 mb-1">a<sub>t</sub> (Pre-Act)</span>
            <div className="border-l-2 border-r-2 border-amber-400 px-2 py-1 flex flex-col gap-1 bg-amber-950/20">
              <span className="text-amber-200">{step.preAct[0].toFixed(2)}</span>
              <span className="text-amber-200">{step.preAct[1].toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <ArrowRight className="w-4 h-4" />
            <span className="text-indigo-400 font-bold">{activation}( · )</span>
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* h_t (Final Hidden State) */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-cyan-300 font-bold mb-1">h<sub>{step.t}</sub> (Hidden State)</span>
            <div className="border-l-2 border-r-2 border-cyan-400 px-3 py-1 flex flex-col gap-1 bg-cyan-950/40 rounded shadow-md">
              <span className="text-cyan-200 font-bold">{step.h[0].toFixed(3)}</span>
              <span className="text-cyan-200 font-bold">{step.h[1].toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Part 5: Output Projection & Loss */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
        <span className="text-xs font-semibold text-amber-400 font-mono block mb-3">
          [Part 5] Output Projection & Loss: W<sub>hy</sub> · h<sub>{step.t}</sub> + b<sub>y</sub> → ŷ<sub>{step.t}</sub>
        </span>

        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400">W<sub>hy</sub> = [{weights.Why[0][0].toFixed(2)}, {weights.Why[0][1].toFixed(2)}]</span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-300">h = [{step.h[0].toFixed(2)}, {step.h[1].toFixed(2)}]</span>
            <span className="text-slate-600">+</span>
            <span className="text-slate-400">b<sub>y</sub> = [{weights.by[0].toFixed(2)}]</span>
            <span className="text-slate-600">→</span>
            <span className="text-amber-300 font-bold">ŷ<sub>{step.t}</sub> = {(step.yHat[0] ?? 0).toFixed(3)}</span>
          </div>

          {step.target && (
            <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Target y* = {(step.target[0] ?? 0).toFixed(2)}</span>
              <span className="text-rose-400 font-bold">
                Loss L = {step.loss !== undefined ? step.loss.toFixed(4) : 'N/A'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
