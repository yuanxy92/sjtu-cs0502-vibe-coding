import React from 'react';
import {
  StepMathDetails,
  StepGradientDetails,
  RNNWeights,
  ActivationType,
} from '../types/rnn';
import { ArrowUp, ArrowRight, ArrowLeft, Info, Activity } from 'lucide-react';

interface UnrolledRNNCanvasProps {
  steps: StepMathDetails[];
  gradients: StepGradientDetails[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  weights: RNNWeights;
  activation: ActivationType;
  mode: 'forward' | 'backward';
  spectralRadius: number;
}

export const UnrolledRNNCanvas: React.FC<UnrolledRNNCanvasProps> = ({
  steps,
  gradients,
  currentStepIndex,
  onSelectStep,
  weights,
  activation,
  mode,
  spectralRadius,
}) => {
  const stepWidth = 190;
  const startX = 90;
  const totalWidth = Math.max(980, startX + steps.length * stepWidth + 60);
  const height = 480;

  // Y-coordinates of layers
  const yOutput = 95;
  const yHidden = 230;
  const yInput = 370;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-hidden flex flex-col">
      {/* Top Header of the Canvas */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 px-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Unrolled Computation Graph (T = {steps.length} Steps)
          </h2>
          <span className="text-xs text-slate-400 hidden sm:inline">
            · Shared parameters: <span className="font-mono text-indigo-300">W_xh</span>, <span className="font-mono text-cyan-300">W_hh</span>, <span className="font-mono text-amber-300">W_hy</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
            <span className="text-slate-300 font-medium">Forward Hidden State h<sub>t</sub></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span className="text-slate-300 font-medium">BPTT Gradient ∂L / ∂h<sub>t</sub></span>
          </div>
          <div className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-300">
            Activation: <span className="text-indigo-300 font-semibold">{activation}</span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Diagram */}
      <div className="relative overflow-x-auto overflow-y-hidden border border-slate-800/80 rounded-xl bg-slate-950/70 p-2">
        <svg
          viewBox={`0 0 ${totalWidth} ${height}`}
          className="w-full min-w-[960px] h-auto select-none"
          style={{ maxHeight: '520px' }}
        >
          <defs>
            {/* Arrowhead markers */}
            <marker
              id="arrow-forward"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>

            <marker
              id="arrow-recurrent"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#818cf8" />
            </marker>

            <marker
              id="arrow-output"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
            </marker>

            <marker
              id="arrow-gradient"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
            </marker>

            {/* Glowing filters */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Initial hidden state h0 node on far left */}
          <g transform={`translate(28, ${yHidden - 28})`}>
            <rect
              width="44"
              height="56"
              rx="8"
              fill="#0f172a"
              stroke="#475569"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <text
              x="22"
              y="22"
              textAnchor="middle"
              className="fill-slate-400 font-mono text-[11px] font-semibold"
            >
              h₀
            </text>
            <text
              x="22"
              y="40"
              textAnchor="middle"
              className="fill-slate-500 font-mono text-[9px]"
            >
              [{weights.h0[0].toFixed(1)}, {weights.h0[1].toFixed(1)}]
            </text>
          </g>

          {/* Recurrent arrow from h0 to h1 */}
          <path
            d={`M 72 ${yHidden} L ${startX - 2} ${yHidden}`}
            stroke="#818cf8"
            strokeWidth="2"
            strokeDasharray="2 2"
            markerEnd="url(#arrow-recurrent)"
          />

          {/* Grid lines and background indicators */}
          {steps.map((step, idx) => {
            const cx = startX + idx * stepWidth;
            const isSelected = idx === currentStepIndex;

            return (
              <g key={`col-bg-${step.t}`}>
                {/* Active Column Highlight */}
                {isSelected && (
                  <rect
                    x={cx - 52}
                    y={25}
                    width="104"
                    height={height - 50}
                    rx="14"
                    fill="rgba(99, 102, 241, 0.07)"
                    stroke="rgba(99, 102, 241, 0.3)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Vertical time marker header */}
                <text
                  x={cx}
                  y="45"
                  textAnchor="middle"
                  className={`font-mono text-xs font-semibold ${
                    isSelected ? 'fill-indigo-300' : 'fill-slate-500'
                  }`}
                >
                  Step t = {step.t}
                </text>
              </g>
            );
          })}

          {/* CONNECTIONS (Rendered behind nodes) */}
          {steps.map((step, idx) => {
            const cx = startX + idx * stepWidth;
            const nextCx = startX + (idx + 1) * stepWidth;
            const isSelected = idx === currentStepIndex;

            return (
              <g key={`conn-${step.t}`}>
                {/* 1. Input to Hidden Connection: x_t -> h_t */}
                <path
                  d={`M ${cx} ${yInput - 30} L ${cx} ${yHidden + 34}`}
                  stroke={isSelected ? '#38bdf8' : '#334155'}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  markerEnd="url(#arrow-forward)"
                />
                <text
                  x={cx + 10}
                  y={(yInput + yHidden) / 2}
                  className="fill-slate-400 font-mono text-[10px]"
                >
                  W_xh
                </text>

                {/* 2. Hidden to Output Connection: h_t -> yHat_t */}
                <path
                  d={`M ${cx} ${yHidden - 34} L ${cx} ${yOutput + 32}`}
                  stroke={isSelected ? '#fbbf24' : '#334155'}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  markerEnd="url(#arrow-output)"
                />
                <text
                  x={cx + 10}
                  y={(yHidden + yOutput) / 2}
                  className="fill-slate-400 font-mono text-[10px]"
                >
                  W_hy
                </text>

                {/* 3. Recurrent Connection: h_t -> h_{t+1} (Forward) */}
                {idx < steps.length - 1 && (
                  <g>
                    <path
                      d={`M ${cx + 42} ${yHidden} L ${nextCx - 42} ${yHidden}`}
                      stroke={
                        currentStepIndex === idx || currentStepIndex === idx + 1
                          ? '#818cf8'
                          : '#334155'
                      }
                      strokeWidth={
                        currentStepIndex === idx || currentStepIndex === idx + 1
                          ? '2.5'
                          : '1.5'
                      }
                      markerEnd="url(#arrow-recurrent)"
                    />
                    <text
                      x={(cx + nextCx) / 2}
                      y={yHidden - 10}
                      textAnchor="middle"
                      className="fill-indigo-300 font-mono text-[10px] font-semibold"
                    >
                      W_hh
                    </text>

                    {/* Animated forward pulse dot when playing */}
                    {mode === 'forward' && currentStepIndex === idx && (
                      <circle cx={(cx + nextCx) / 2} cy={yHidden} r="4" fill="#38bdf8">
                        <animate
                          attributeName="cx"
                          from={cx + 42}
                          to={nextCx - 42}
                          dur="0.8s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                )}

                {/* 4. BACKPROPAGATION THROUGH TIME (BPTT) GRADIENT FLOW */}
                {mode === 'backward' && idx > 0 && (
                  <g>
                    {/* Reverse Gradient Arrow h_t <- h_{t+1} */}
                    {(() => {
                      const grad = gradients[idx];
                      const gNorm = grad?.gradientNorm ?? 1.0;
                      // Dynamic thickness & opacity based on gradient norm
                      const strokeWidth = Math.min(6, Math.max(1.5, gNorm * 2.2));
                      const isVanished = gNorm < 0.05;
                      const isExploded = gNorm > 2.5;

                      let strokeColor = '#f43f5e';
                      if (isVanished) strokeColor = '#64748b';
                      if (isExploded) strokeColor = '#f97316';

                      return (
                        <g>
                          <path
                            d={`M ${nextCx - 42} ${yHidden + 18} L ${cx + 46} ${yHidden + 18}`}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={isVanished ? '4 3' : 'none'}
                            markerEnd="url(#arrow-gradient)"
                          />
                          <text
                            x={(cx + nextCx) / 2}
                            y={yHidden + 32}
                            textAnchor="middle"
                            className="fill-rose-400 font-mono text-[9px] font-semibold"
                          >
                            ∂L/∂h
                          </text>

                          {/* Reverse animated particle */}
                          {currentStepIndex === idx && (
                            <circle cx={(cx + nextCx) / 2} cy={yHidden + 18} r="4" fill="#f43f5e">
                              <animate
                                attributeName="cx"
                                from={nextCx - 42}
                                to={cx + 46}
                                dur="0.8s"
                                repeatCount="indefinite"
                              />
                            </circle>
                          )}
                        </g>
                      );
                    })()}
                  </g>
                )}
              </g>
            );
          })}

          {/* NODES LAYER */}
          {steps.map((step, idx) => {
            const cx = startX + idx * stepWidth;
            const isSelected = idx === currentStepIndex;
            const grad = gradients[idx];

            // Hidden values normalized to bar height
            const h1 = step.h[0] ?? 0;
            const h2 = step.h[1] ?? 0;
            const barMaxH = 20;

            return (
              <g
                key={`node-col-${step.t}`}
                className="cursor-pointer"
                onClick={() => onSelectStep(idx)}
              >
                {/* ======================================================== */}
                {/* 1. OUTPUT NODE yHat_t */}
                {/* ======================================================== */}
                <g transform={`translate(${cx - 40}, ${yOutput - 26})`}>
                  <rect
                    width="80"
                    height="54"
                    rx="10"
                    fill={isSelected ? '#1e1b4b' : '#0f172a'}
                    stroke={isSelected ? '#fbbf24' : '#334155'}
                    strokeWidth={isSelected ? '2' : '1'}
                    className="transition-colors"
                  />
                  <text
                    x="40"
                    y="18"
                    textAnchor="middle"
                    className="fill-amber-300 font-mono text-[11px] font-semibold"
                  >
                    ŷ_{step.t} = {(step.yHat[0] ?? 0).toFixed(2)}
                  </text>

                  {step.target && (
                    <text
                      x="40"
                      y="34"
                      textAnchor="middle"
                      className="fill-slate-400 font-mono text-[9px]"
                    >
                      Target: {(step.target[0] ?? 0).toFixed(2)}
                    </text>
                  )}

                  {step.loss !== undefined && (
                    <text
                      x="40"
                      y="46"
                      textAnchor="middle"
                      className="fill-rose-400 font-mono text-[9px] font-bold"
                    >
                      Loss: {step.loss.toFixed(3)}
                    </text>
                  )}
                </g>

                {/* ======================================================== */}
                {/* 2. HIDDEN STATE NODE h_t (THE CORE RECURRENT UNIT) */}
                {/* ======================================================== */}
                <g transform={`translate(${cx - 44}, ${yHidden - 34})`}>
                  <rect
                    width="88"
                    height="68"
                    rx="12"
                    fill={isSelected ? '#172554' : '#0f172a'}
                    stroke={
                      mode === 'backward' && isSelected
                        ? '#f43f5e'
                        : isSelected
                        ? '#38bdf8'
                        : '#334155'
                    }
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    filter={isSelected ? 'url(#glow-cyan)' : undefined}
                    className="transition-colors"
                  />

                  {/* Header Title: h_t */}
                  <text
                    x="44"
                    y="16"
                    textAnchor="middle"
                    className="fill-cyan-300 font-mono text-[12px] font-bold"
                  >
                    h_{step.t}
                  </text>

                  {/* Visual dual dimension bar indicators */}
                  {/* Dimension 1 */}
                  <g transform="translate(14, 22)">
                    <rect x="0" y="0" width="28" height="6" rx="2" fill="#1e293b" />
                    <rect
                      x="0"
                      y="0"
                      width={Math.max(2, Math.abs(h1) * 28)}
                      height="6"
                      rx="2"
                      fill={h1 >= 0 ? '#38bdf8' : '#f87171'}
                    />
                    <text x="32" y="6" className="fill-slate-300 font-mono text-[8px]">
                      {h1.toFixed(2)}
                    </text>
                  </g>

                  {/* Dimension 2 */}
                  <g transform="translate(14, 34)">
                    <rect x="0" y="0" width="28" height="6" rx="2" fill="#1e293b" />
                    <rect
                      x="0"
                      y="0"
                      width={Math.max(2, Math.abs(h2) * 28)}
                      height="6"
                      rx="2"
                      fill={h2 >= 0 ? '#34d399' : '#f87171'}
                    />
                    <text x="32" y="6" className="fill-slate-300 font-mono text-[8px]">
                      {h2.toFixed(2)}
                    </text>
                  </g>

                  {/* Gradient Norm Indicator in BPTT Mode */}
                  {grad && (
                    <text
                      x="44"
                      y="58"
                      textAnchor="middle"
                      className={`font-mono text-[8px] font-semibold ${
                        grad.vanishedOrExploded === 'vanished'
                          ? 'fill-slate-500'
                          : grad.vanishedOrExploded === 'exploding'
                          ? 'fill-rose-400 font-bold'
                          : 'fill-emerald-400'
                      }`}
                    >
                      ‖∇h‖ = {grad.gradientNorm.toFixed(2)}
                      {grad.vanishedOrExploded === 'vanished' && ' (V)'}
                      {grad.vanishedOrExploded === 'exploding' && ' (E)'}
                    </text>
                  )}
                </g>

                {/* ======================================================== */}
                {/* 3. INPUT NODE x_t */}
                {/* ======================================================== */}
                <g transform={`translate(${cx - 40}, ${yInput - 26})`}>
                  <rect
                    width="80"
                    height="54"
                    rx="10"
                    fill={isSelected ? '#1e1b4b' : '#0f172a'}
                    stroke={isSelected ? '#818cf8' : '#334155'}
                    strokeWidth={isSelected ? '2' : '1'}
                    className="transition-colors"
                  />
                  {/* Token Label */}
                  <text
                    x="40"
                    y="18"
                    textAnchor="middle"
                    className="fill-indigo-300 font-sans text-[11px] font-semibold truncate"
                  >
                    {step.label}
                  </text>
                  {/* Numerical input vector values */}
                  <text
                    x="40"
                    y="34"
                    textAnchor="middle"
                    className="fill-slate-300 font-mono text-[9px]"
                  >
                    x=[{(step.x[0] ?? 0).toFixed(2)}, {(step.x[1] ?? 0).toFixed(2)}]
                  </text>
                  <text
                    x="40"
                    y="46"
                    textAnchor="middle"
                    className="fill-slate-500 font-mono text-[8px]"
                  >
                    Input dim = 2
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Context Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 px-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>
            Click any cell above to inspect its exact matrix transformations in the math inspector.
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>
            Whh Spectral Radius: <span className="text-white font-semibold">{spectralRadius.toFixed(2)}</span>
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>
            Sequence Length: <span className="text-white font-semibold">{steps.length}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
