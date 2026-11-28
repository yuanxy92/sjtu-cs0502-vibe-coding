import React from 'react';
import { EigenAnalysis, Matrix } from '../types/rnn';
import { X, Gauge, Zap, TrendingDown, Flame, CheckCircle2, Info, ArrowRight } from 'lucide-react';

interface SpectralRadiusExplainerProps {
  isOpen: boolean;
  onClose: () => void;
  eigenAnalysis: EigenAnalysis;
  Whh: Matrix;
}

export const SpectralRadiusExplainer: React.FC<SpectralRadiusExplainerProps> = ({
  isOpen,
  onClose,
  eigenAnalysis,
  Whh,
}) => {
  if (!isOpen) return null;

  // Geometry for the Complex Plane (Argand Diagram)
  const size = 300;
  const scale = 80; // pixels per unit (so radius 1 is 80px)
  const center = size / 2;

  const toComplexSvgX = (re: number) => center + re * scale;
  const toComplexSvgY = (im: number) => center - im * scale; // invert Y for SVG

  const rho = eigenAnalysis.spectralRadius;
  const rhoRadiusPx = rho * scale;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-750 max-w-3xl w-full rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-700/80">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide">
                Understanding Spectral Radius in Recurrent Neural Networks
              </h2>
              <p className="text-xs text-slate-400">
                The mathematical key governing memory retention, vanishing gradients, and stability.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Section 1: Plain English Definition */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              What is Spectral Radius? (Plain English)
            </h3>
            <p className="leading-relaxed text-xs text-slate-300">
              The <strong className="text-white">Spectral Radius</strong>, written as{' '}
              <span className="font-mono text-cyan-300 font-semibold">ρ(W)</span> (pronounced{' '}
              <em>rho</em>), is the magnitude of the <strong>largest eigenvalue</strong> of a matrix.
            </p>
            <p className="leading-relaxed text-xs text-slate-400">
              Think of the recurrent matrix <span className="font-mono text-indigo-300">W<sub>hh</sub></span> as a repeating amplifier or lens. Every time step, the network multiplies previous memory by <span className="font-mono text-indigo-300">W<sub>hh</sub></span>. The spectral radius tells you the <strong>maximum rate at which signals grow or shrink</strong> under this repeated multiplication over time.
            </p>
          </div>

          {/* Section 2: Live Complex Plane & Current Matrix Eigenvalues */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-950/80 p-5 rounded-xl border border-slate-800">
            {/* SVG Complex Plane (5 cols) */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <span className="text-xs font-mono text-slate-400 mb-2">
                Complex Eigenvalue Plane (λ)
              </span>

              <div className="border border-slate-800 rounded-lg p-1 bg-slate-950">
                <svg viewBox={`0 0 ${size} ${size}`} className="w-60 h-60 select-none">
                  <defs>
                    <marker
                      id="axis-arrow"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="4"
                      markerHeight="4"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 2 L 6 5 L 0 8 z" fill="#475569" />
                    </marker>
                  </defs>

                  {/* Axes: Real and Imaginary */}
                  <line
                    x1="10"
                    y1={center}
                    x2={size - 10}
                    y2={center}
                    stroke="#475569"
                    strokeWidth="1.5"
                    markerEnd="url(#axis-arrow)"
                  />
                  <line
                    x1={center}
                    y1={size - 10}
                    x2={center}
                    y2="10"
                    stroke="#475569"
                    strokeWidth="1.5"
                    markerEnd="url(#axis-arrow)"
                  />
                  <text x={size - 14} y={center - 6} className="fill-slate-500 font-mono text-[9px]">
                    Re
                  </text>
                  <text x={center + 6} y="14" className="fill-slate-500 font-mono text-[9px]">
                    Im
                  </text>

                  {/* Unit Circle |z| = 1 */}
                  <circle
                    cx={center}
                    cy={center}
                    r={scale}
                    fill="none"
                    stroke="#334155"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={center + scale + 4}
                    y={center + 12}
                    className="fill-slate-500 font-mono text-[8px]"
                  >
                    1.0
                  </text>

                  {/* Spectral Radius boundary circle */}
                  <circle
                    cx={center}
                    cy={center}
                    r={Math.min(140, Math.max(10, rhoRadiusPx))}
                    fill={rho <= 1 ? 'rgba(56, 189, 248, 0.04)' : 'rgba(244, 63, 94, 0.05)'}
                    stroke={
                      rho < 0.95
                        ? '#38bdf8'
                        : rho > 1.05
                        ? '#f43f5e'
                        : '#34d399'
                    }
                    strokeWidth="2"
                  />

                  {/* Eigenvalues Points */}
                  {eigenAnalysis.eigenvalues.map((ev, idx) => {
                    const cx = toComplexSvgX(ev.re);
                    const cy = toComplexSvgY(ev.im);
                    return (
                      <g key={`ev-${idx}`}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r="6"
                          fill="#818cf8"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <text
                          x={cx + 8}
                          y={cy - 6}
                          className="fill-indigo-300 font-mono text-[10px] font-bold"
                        >
                          λ_{idx + 1}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full border border-dashed border-slate-500 inline-block"></span>
                  Unit Circle (|z| = 1)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block"></span>
                  Eigenvalues
                </span>
              </div>
            </div>

            {/* Calculations & Current Values (7 cols) */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-white mb-2">
                  Live Matrix Analysis: W<sub>hh</sub>
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-400">Current W<sub>hh</sub>:</span>
                    <div className="text-slate-200 mt-1">
                      [{Whh[0][0].toFixed(2)}, {Whh[0][1].toFixed(2)}]<br />
                      [{Whh[1][0].toFixed(2)}, {Whh[1][1].toFixed(2)}]
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Eigenvalues (λ):</span>
                    <div className="text-indigo-300 mt-1">
                      {eigenAnalysis.eigenvalues.map((ev, i) => (
                        <div key={i}>
                          λ<sub>{i + 1}</sub> = {ev.re.toFixed(2)}
                          {Math.abs(ev.im) > 0.001
                            ? ` ${ev.im >= 0 ? '+' : '-'} ${Math.abs(ev.im).toFixed(2)}i`
                            : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-950/40 border border-indigo-900/60 font-mono text-xs">
                  <span className="text-indigo-200 font-semibold">Spectral Radius ρ(W<sub>hh</sub>):</span>
                  <span className="text-cyan-300 font-bold text-sm">
                    {rho.toFixed(3)}
                  </span>
                </div>
              </div>

              <div
                className={`p-3 rounded-lg border text-xs leading-relaxed ${
                  eigenAnalysis.stability === 'stable'
                    ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                    : eigenAnalysis.stability === 'marginally-stable'
                    ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                    : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                }`}
              >
                <strong>Current State:</strong> {eigenAnalysis.description}
              </div>
            </div>
          </div>

          {/* Section 3: The 3 Critical Regimes */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              The 3 Dynamical Regimes of Recurrent Networks
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Regime 1 */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <TrendingDown className="w-4 h-4 shrink-0" />
                  <span>1. ρ &lt; 1.0 (Contraction)</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Inside the unit circle. Every time step, past memory decays like <span className="font-mono text-slate-300">ρ<sup>t</sup></span> (e.g., 0.8<sup>10</sup> ≈ 0.10).
                </p>
                <div className="text-[11px] text-amber-300/90 font-medium">
                  Result: Rapid forgetting & Vanishing Gradients.
                </div>
              </div>

              {/* Regime 2 */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>2. ρ ≈ 1.0 (Critical / Latch)</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  On the unit circle boundary. Memory magnitude is preserved like <span className="font-mono text-slate-300">1.0<sup>t</sup> = 1.0</span> across long sequences.
                </p>
                <div className="text-[11px] text-emerald-300 font-medium">
                  Result: Stable working memory & healthy gradients.
                </div>
              </div>

              {/* Regime 3 */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <Flame className="w-4 h-4 shrink-0" />
                  <span>3. ρ &gt; 1.0 (Expansion)</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Outside the unit circle. Unchecked amplification like <span className="font-mono text-slate-300">1.3<sup>10</sup> ≈ 13.8</span>.
                </p>
                <div className="text-[11px] text-rose-300/90 font-medium">
                  Result: Hidden states saturate tanh bounds & Exploding Gradients.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Tip: Try selecting the "Vanishing Gradient" or "Exploding Gradient" preset to see how ρ shifts!
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
