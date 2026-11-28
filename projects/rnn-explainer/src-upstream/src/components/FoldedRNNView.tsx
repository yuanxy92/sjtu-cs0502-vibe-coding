import React from 'react';
import { StepMathDetails, RNNWeights, ActivationType } from '../types/rnn';
import { RefreshCw, ArrowRight, Zap, Database, Layers } from 'lucide-react';

interface FoldedRNNViewProps {
  currentStep: StepMathDetails;
  weights: RNNWeights;
  activation: ActivationType;
  currentStepIndex: number;
  totalSteps: number;
}

export const FoldedRNNView: React.FC<FoldedRNNViewProps> = ({
  currentStep,
  weights,
  activation,
  currentStepIndex,
  totalSteps,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
      {/* Left: Folded Animated Diagram (7 cols) */}
      <div className="lg:col-span-7 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white tracking-wide">
                Folded (Recurrent Loop) Representation
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Active Step: t = {currentStep.t} / {totalSteps}
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            In compact notation, an RNN is a single network unit that feeds its output vector{' '}
            <span className="text-cyan-300 font-mono">h_t</span> back into itself through a 1-step
            time delay (<span className="text-indigo-300 font-mono">z⁻¹</span>).
          </p>
        </div>

        {/* SVG Diagram of the Folded Unit */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-center">
          <svg viewBox="0 0 540 380" className="w-full max-w-[500px] h-auto select-none">
            <defs>
              <marker
                id="f-arrow"
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
                id="f-arrow-rec"
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
                id="f-arrow-out"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
              </marker>
            </defs>

            {/* Input Node x_t (bottom) */}
            <g transform="translate(190, 290)">
              <rect
                width="120"
                height="54"
                rx="10"
                fill="#0f172a"
                stroke="#818cf8"
                strokeWidth="1.5"
              />
              <text
                x="60"
                y="22"
                textAnchor="middle"
                className="fill-indigo-300 font-sans text-xs font-semibold"
              >
                x_t ({currentStep.label})
              </text>
              <text
                x="60"
                y="38"
                textAnchor="middle"
                className="fill-slate-300 font-mono text-[10px]"
              >
                [{currentStep.x[0].toFixed(2)}, {currentStep.x[1].toFixed(2)}]
              </text>
            </g>

            {/* Arrow from x_t to Hidden Cell */}
            <path
              d="M 250 290 L 250 216"
              stroke="#38bdf8"
              strokeWidth="2.5"
              markerEnd="url(#f-arrow)"
            />
            <text x="260" y="255" className="fill-slate-300 font-mono text-xs font-medium">
              W_xh
            </text>

            {/* Central Recurrent Cell (h_t) */}
            <g transform="translate(170, 110)">
              <rect
                width="160"
                height="100"
                rx="14"
                fill="#172554"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
              <text
                x="80"
                y="26"
                textAnchor="middle"
                className="fill-cyan-300 font-mono text-sm font-bold"
              >
                Hidden State (h_t)
              </text>

              {/* Function inside cell */}
              <text
                x="80"
                y="46"
                textAnchor="middle"
                className="fill-slate-300 font-mono text-[11px]"
              >
                {activation}(W_xh·x_t + W_hh·h_t-1 + b)
              </text>

              {/* Current live values */}
              <rect x="25" y="60" width="110" height="26" rx="6" fill="#0f172a" />
              <text
                x="80"
                y="77"
                textAnchor="middle"
                className="fill-cyan-300 font-mono text-[11px] font-bold"
              >
                [{currentStep.h[0].toFixed(2)}, {currentStep.h[1].toFixed(2)}]
              </text>
            </g>

            {/* Recurrent Loop: From h_t right side, loops down through delay z^-1 and back to left */}
            {/* Start at right of cell (330, 160) -> loop out right, around and back into left (170, 160) */}
            <path
              d="M 330 160 C 430 160, 430 40, 250 40 C 120 40, 120 160, 164 160"
              fill="none"
              stroke="#818cf8"
              strokeWidth="2.5"
              markerEnd="url(#f-arrow-rec)"
            />

            {/* Delay Element Box z^-1 on top of loop */}
            <g transform="translate(225, 20)">
              <rect
                width="50"
                height="40"
                rx="6"
                fill="#1e1b4b"
                stroke="#818cf8"
                strokeWidth="1.5"
              />
              <text
                x="25"
                y="24"
                textAnchor="middle"
                className="fill-indigo-300 font-mono text-xs font-bold"
              >
                z⁻¹
              </text>
            </g>
            <text x="360" y="90" className="fill-indigo-300 font-mono text-xs font-semibold">
              W_hh · h_(t-1)
            </text>

            {/* Output Node yHat_t (top-right projection) */}
            <path
              d="M 300 110 L 350 40"
              stroke="#fbbf24"
              strokeWidth="2.5"
              markerEnd="url(#f-arrow-out)"
            />
            <text x="340" y="85" className="fill-amber-300 font-mono text-xs font-medium">
              W_hy
            </text>

            <g transform="translate(360, 10)">
              <rect
                width="110"
                height="48"
                rx="8"
                fill="#0f172a"
                stroke="#fbbf24"
                strokeWidth="1.5"
              />
              <text
                x="55"
                y="20"
                textAnchor="middle"
                className="fill-amber-300 font-mono text-xs font-semibold"
              >
                Output ŷ_t
              </text>
              <text
                x="55"
                y="36"
                textAnchor="middle"
                className="fill-slate-300 font-mono text-[10px]"
              >
                {(currentStep.yHat[0] ?? 0).toFixed(2)}
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Right: Key Concepts & Structural Comparison (5 cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Folded vs. Unrolled Principles
          </h3>

          <div className="space-y-3">
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
              <h4 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                1. Universal Parameter Sharing
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Unlike a deep multi-layer perceptron where each layer has distinct weights, an RNN uses
                the exact same weight matrices (<span className="text-slate-200 font-mono">W_xh, W_hh, W_hy</span>)
                across all time steps. This keeps parameter count invariant to sequence length.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
              <h4 className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                2. Hidden State as Latent Memory
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                The hidden state vector <span className="text-slate-200 font-mono">h_t</span> functions
                as an internal memory latch. It compresses past history x₁...x_t into a compact
                vector that conditions both the present prediction ŷ_t and future states h_{'{'}t+1{'}'}.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
              <h4 className="text-xs font-semibold text-rose-300 flex items-center gap-1.5 mb-1">
                <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                3. Why We Must "Unroll" in Time
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                To train the network with gradient descent, the cyclic graph is unrolled into a
                directed acyclic graph (DAG) across T steps. Gradients can then flow backward
                along the timeline via <em>Backpropagation Through Time (BPTT)</em>.
              </p>
            </div>
          </div>
        </div>

        {/* Live Vector Summary Box */}
        <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-3 text-xs">
          <div className="text-indigo-200 font-semibold mb-1 flex items-center justify-between">
            <span>Current Hidden Vector h<sub>{currentStep.t}</sub>:</span>
            <span className="font-mono text-cyan-300">
              [{currentStep.h[0].toFixed(3)}, {currentStep.h[1].toFixed(3)}]
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Updated via: tanh( [{currentStep.wxh_x.map((v) => v.toFixed(2)).join(', ')}] + [
            {currentStep.whh_hPrev.map((v) => v.toFixed(2)).join(', ')}] + [{weights.bh.map((v) => v.toFixed(2)).join(', ')}] )
          </p>
        </div>
      </div>
    </div>
  );
};
