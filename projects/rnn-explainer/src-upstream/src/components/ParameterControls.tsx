import React from 'react';
import {
  RNNWeights,
  ActivationType,
  EigenAnalysis,
  PresetKey,
} from '../types/rnn';
import { Sliders, Sparkles, AlertTriangle, ShieldCheck, Gauge } from 'lucide-react';

interface ParameterControlsProps {
  weights: RNNWeights;
  onWeightsChange: (newWeights: RNNWeights) => void;
  activation: ActivationType;
  onActivationChange: (act: ActivationType) => void;
  eigenAnalysis: EigenAnalysis;
  currentPreset: PresetKey;
  onSelectPreset: (preset: PresetKey) => void;
  onOpenSpectralExplainer?: () => void;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  weights,
  onWeightsChange,
  activation,
  onActivationChange,
  eigenAnalysis,
  currentPreset,
  onSelectPreset,
  onOpenSpectralExplainer,
}) => {
  // Helpers to update individual matrix cells
  const updateWxh = (r: number, c: number, val: number) => {
    const newW = weights.Wxh.map((row, ri) =>
      row.map((cell, ci) => (ri === r && ci === c ? val : cell))
    );
    onWeightsChange({ ...weights, Wxh: newW });
  };

  const updateWhh = (r: number, c: number, val: number) => {
    const newW = weights.Whh.map((row, ri) =>
      row.map((cell, ci) => (ri === r && ci === c ? val : cell))
    );
    onWeightsChange({ ...weights, Whh: newW });
  };

  const updateWhy = (c: number, val: number) => {
    const newW = weights.Why.map((row) =>
      row.map((cell, ci) => (ci === c ? val : cell))
    );
    onWeightsChange({ ...weights, Why: newW });
  };

  const updateBh = (idx: number, val: number) => {
    const newB = [...weights.bh];
    newB[idx] = val;
    onWeightsChange({ ...weights, bh: newB });
  };

  const updateBy = (val: number) => {
    onWeightsChange({ ...weights, by: [val] });
  };

  const updateH0 = (idx: number, val: number) => {
    const newH0 = [...weights.h0];
    newH0[idx] = val;
    onWeightsChange({ ...weights, h0: newH0 });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Top Header & Stability Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide">
              Interactive Weight Matrices & Parameters
            </h2>
            <p className="text-xs text-slate-400">
              Drag any slider to witness real-time vector transformations and gradient propagation across time steps.
            </p>
          </div>
        </div>

        {/* Dynamic Spectral Radius & Stability Card */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <Gauge className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-400">Spectral Radius:</span>
            <span className="text-white font-bold">
              ρ(W<sub>hh</sub>) = {eigenAnalysis.spectralRadius.toFixed(2)}
            </span>
          </div>

          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
              eigenAnalysis.stability === 'stable'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                : eigenAnalysis.stability === 'marginally-stable'
                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
            }`}
          >
            {eigenAnalysis.stability === 'unstable' ? (
              <AlertTriangle className="w-3 h-3 text-rose-400" />
            ) : (
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
            )}
            <span>
              {eigenAnalysis.stability === 'stable'
                ? 'Contraction (Decay)'
                : eigenAnalysis.stability === 'marginally-stable'
                ? 'Marginal (Latch)'
                : 'Expansion (Exploding)'}
            </span>
          </div>

          {onOpenSpectralExplainer && (
            <button
              onClick={onOpenSpectralExplainer}
              className="text-[11px] text-cyan-300 hover:text-cyan-200 underline underline-offset-2 font-medium cursor-pointer ml-1"
            >
              What is this?
            </button>
          )}
        </div>
      </div>

      {/* Grid of Matrix Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recurrent Weight Matrix Whh (Crucial for temporal dynamics!) */}
        <div className="bg-slate-950/80 border border-indigo-900/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <h3 className="text-xs font-semibold text-indigo-200 font-mono">
                W<sub>hh</sub> (Recurrent Hidden-to-Hidden)
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">[2 × 2]</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-tight">
            Controls memory persistence, oscillation, and gradient attenuation across steps.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* w11 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">w₁₁</span>
                <span className="text-indigo-300 font-bold">{weights.Whh[0][0].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="2.0"
                step="0.05"
                value={weights.Whh[0][0]}
                onChange={(e) => updateWhh(0, 0, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* w12 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">w₁₂</span>
                <span className="text-indigo-300 font-bold">{weights.Whh[0][1].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="2.0"
                step="0.05"
                value={weights.Whh[0][1]}
                onChange={(e) => updateWhh(0, 1, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* w21 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">w₂₁</span>
                <span className="text-indigo-300 font-bold">{weights.Whh[1][0].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="2.0"
                step="0.05"
                value={weights.Whh[1][0]}
                onChange={(e) => updateWhh(1, 0, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* w22 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">w₂₂</span>
                <span className="text-indigo-300 font-bold">{weights.Whh[1][1].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="2.0"
                step="0.05"
                value={weights.Whh[1][1]}
                onChange={(e) => updateWhh(1, 1, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Input-to-Hidden Matrix Wxh */}
        <div className="bg-slate-950/80 border border-sky-900/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <h3 className="text-xs font-semibold text-sky-200 font-mono">
                W<sub>xh</sub> (Input-to-Hidden)
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">[2 × 2]</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-tight">
            Determines how strongly new input features project into hidden state dimensions.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* w11 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">w₁₁</span>
                <span className="text-sky-300 font-bold">{weights.Wxh[0][0].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="2.0"
                step="0.05"
                value={weights.Wxh[0][0]}
                onChange={(e) => updateWxh(0, 0, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* w12 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">w₁₂</span>
                <span className="text-sky-300 font-bold">{weights.Wxh[0][1].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="2.0"
                step="0.05"
                value={weights.Wxh[0][1]}
                onChange={(e) => updateWxh(0, 1, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* w21 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">w₂₁</span>
                <span className="text-sky-300 font-bold">{weights.Wxh[1][0].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="2.0"
                step="0.05"
                value={weights.Wxh[1][0]}
                onChange={(e) => updateWxh(1, 0, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* w22 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">w₂₂</span>
                <span className="text-sky-300 font-bold">{weights.Wxh[1][1].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="2.0"
                step="0.05"
                value={weights.Wxh[1][1]}
                onChange={(e) => updateWxh(1, 1, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Output Matrix Why & Biases */}
        <div className="bg-slate-950/80 border border-amber-900/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h3 className="text-xs font-semibold text-amber-200 font-mono">
                W<sub>hy</sub> & Biases
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">[1 × 2] & [2]</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Why w1 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">W<sub>hy</sub> (col 1)</span>
                <span className="text-amber-300 font-bold">{weights.Why[0][0].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="2.0"
                step="0.05"
                value={weights.Why[0][0]}
                onChange={(e) => updateWhy(0, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Why w2 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">W<sub>hy</sub> (col 2)</span>
                <span className="text-amber-300 font-bold">{weights.Why[0][1].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="2.0"
                step="0.05"
                value={weights.Why[0][1]}
                onChange={(e) => updateWhy(1, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* bh 1 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">b<sub>h₁</sub> (Bias)</span>
                <span className="text-emerald-300 font-bold">{weights.bh[0].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-1.5"
                max="1.5"
                step="0.05"
                value={weights.bh[0]}
                onChange={(e) => updateBh(0, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* bh 2 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">b<sub>h₂</sub> (Bias)</span>
                <span className="text-emerald-300 font-bold">{weights.bh[1].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-1.5"
                max="1.5"
                step="0.05"
                value={weights.bh[1]}
                onChange={(e) => updateBh(1, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Activation Function & Initial State h0 Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs">
        {/* Activation picker */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Non-Linear Activation:</span>
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['tanh', 'relu', 'sigmoid'] as ActivationType[]).map((act) => (
              <button
                key={act}
                onClick={() => onActivationChange(act)}
                className={`px-3 py-1 rounded font-mono transition-colors ${
                  activation === act
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>

        {/* Initial state h0 */}
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium">Initial Memory h₀:</span>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-500">h₀(1):</span>
            <input
              type="number"
              step="0.1"
              min="-1"
              max="1"
              value={weights.h0[0]}
              onChange={(e) => updateH0(0, parseFloat(e.target.value) || 0)}
              className="w-14 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-center text-cyan-300"
            />
            <span className="text-slate-500">h₀(2):</span>
            <input
              type="number"
              step="0.1"
              min="-1"
              max="1"
              value={weights.h0[1]}
              onChange={(e) => updateH0(1, parseFloat(e.target.value) || 0)}
              className="w-14 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-center text-cyan-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
