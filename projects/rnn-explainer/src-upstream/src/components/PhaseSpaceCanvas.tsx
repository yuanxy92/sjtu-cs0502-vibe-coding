import React, { useRef, useState } from 'react';
import { StepMathDetails, RNNWeights } from '../types/rnn';
import { Compass, MousePointerClick, RefreshCw } from 'lucide-react';

interface PhaseSpaceCanvasProps {
  steps: StepMathDetails[];
  weights: RNNWeights;
  currentStepIndex: number;
  onSelectStep: (idx: number) => void;
  onSetInitialState: (h0: [number, number]) => void;
}

export const PhaseSpaceCanvas: React.FC<PhaseSpaceCanvasProps> = ({
  steps,
  weights,
  currentStepIndex,
  onSelectStep,
  onSetInitialState,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  // Phase plane coordinates: [-1.4, 1.4] mapped to [0, 400]
  const size = 420;
  const range = 1.35;

  const toSvgX = (h1: number) => ((h1 + range) / (2 * range)) * size;
  const toSvgY = (h2: number) => ((range - h2) / (2 * range)) * size; // Invert Y axis

  const fromSvgX = (px: number) => (px / size) * (2 * range) - range;
  const fromSvgY = (py: number) => range - (py / size) * (2 * range);

  // Generate vector field arrows on a 7x7 grid
  const fieldGrid: { x: number; y: number; dx: number; dy: number }[] = [];
  const gridSteps = 7;
  for (let i = 0; i < gridSteps; i++) {
    for (let j = 0; j < gridSteps; j++) {
      const h1 = -1.0 + (2.0 * i) / (gridSteps - 1);
      const h2 = -1.0 + (2.0 * j) / (gridSteps - 1);

      // Autonomous recurrence drift: tanh(Whh * h) - h
      const nextH1 = Math.tanh(weights.Whh[0][0] * h1 + weights.Whh[0][1] * h2);
      const nextH2 = Math.tanh(weights.Whh[1][0] * h1 + weights.Whh[1][1] * h2);

      const delta1 = nextH1 - h1;
      const delta2 = nextH2 - h2;
      const mag = Math.sqrt(delta1 * delta1 + delta2 * delta2);
      const scale = mag > 0 ? Math.min(18, 8 + mag * 14) : 0;
      const dirX = mag > 0 ? (delta1 / mag) * scale : 0;
      const dirY = mag > 0 ? -(delta2 / mag) * scale : 0; // Inverted SVG Y

      fieldGrid.push({
        x: toSvgX(h1),
        y: toSvgY(h2),
        dx: dirX,
        dy: dirY,
      });
    }
  }

  // Trajectory points: h0 followed by h1, h2, ..., hT
  const trajectory = [
    { label: 'h₀', x: weights.h0[0], y: weights.h0[1], stepIdx: -1 },
    ...steps.map((s, idx) => ({
      label: `h_${s.t}`,
      x: s.h[0],
      y: s.h[1],
      stepIdx: idx,
    })),
  ];

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * size;
    const py = ((e.clientY - rect.top) / rect.height) * size;

    const h1 = Math.max(-1, Math.min(1, fromSvgX(px)));
    const h2 = Math.max(-1, Math.min(1, fromSvgY(py)));
    onSetInitialState([parseFloat(h1.toFixed(2)), parseFloat(h2.toFixed(2))]);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * size;
    const py = ((e.clientY - rect.top) / rect.height) * size;
    setHoverCoord({ x: fromSvgX(px), y: fromSvgY(py) });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
      {/* 2D Canvas View (7 cols) */}
      <div className="lg:col-span-7 flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white tracking-wide">
              2D State Space Phase Portrait [h⁽¹⁾ vs. h⁽²⁾]
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {hoverCoord
              ? `Cursor: [${hoverCoord.x.toFixed(2)}, ${hoverCoord.y.toFixed(2)}]`
              : 'Click canvas to set h₀'}
          </span>
        </div>

        <div className="relative border border-slate-800 bg-slate-950 rounded-xl p-2 select-none shadow-inner">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${size} ${size}`}
            className="w-full max-w-[420px] h-auto cursor-crosshair"
            onClick={handleSvgClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverCoord(null)}
          >
            <defs>
              <marker
                id="traj-arrow"
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
                id="field-arrow"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto-start-reverse"
              >
                <path d="M 0 2 L 6 5 L 0 8 z" fill="#334155" />
              </marker>
            </defs>

            {/* Coordinate grid lines */}
            <line
              x1="0"
              y1={toSvgY(0)}
              x2={size}
              y2={toSvgY(0)}
              stroke="#334155"
              strokeWidth="1.5"
            />
            <line
              x1={toSvgX(0)}
              y1="0"
              x2={toSvgX(0)}
              y2={size}
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* [-1, 1] Hypercube boundary (tanh saturation zone) */}
            <rect
              x={toSvgX(-1)}
              y={toSvgY(1)}
              width={toSvgX(1) - toSvgX(-1)}
              height={toSvgY(-1) - toSvgY(1)}
              fill="rgba(56, 189, 248, 0.02)"
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={toSvgX(1) - 4}
              y={toSvgY(1) + 12}
              textAnchor="end"
              className="fill-slate-500 font-mono text-[9px]"
            >
              tanh saturation box [-1, 1]²
            </text>

            {/* Vector field arrows */}
            {fieldGrid.map((f, i) => (
              <line
                key={`field-${i}`}
                x1={f.x}
                y1={f.y}
                x2={f.x + f.dx}
                y2={f.y + f.dy}
                stroke="#334155"
                strokeWidth="1"
                markerEnd="url(#field-arrow)"
              />
            ))}

            {/* Trajectory Polyline */}
            {trajectory.map((pt, i) => {
              if (i === 0) return null;
              const prev = trajectory[i - 1];
              return (
                <line
                  key={`traj-line-${i}`}
                  x1={toSvgX(prev.x)}
                  y1={toSvgY(prev.y)}
                  x2={toSvgX(pt.x)}
                  y2={toSvgY(pt.y)}
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  markerEnd="url(#traj-arrow)"
                />
              );
            })}

            {/* Trajectory Point Circles */}
            {trajectory.map((pt, i) => {
              const cx = toSvgX(pt.x);
              const cy = toSvgY(pt.y);
              const isSelected =
                (pt.stepIdx === -1 && currentStepIndex === 0) ||
                pt.stepIdx === currentStepIndex;

              return (
                <g
                  key={`traj-pt-${i}`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (pt.stepIdx >= 0) onSelectStep(pt.stepIdx);
                  }}
                >
                  {/* Outer glow ring if active */}
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="14"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from={`0 ${cx} ${cy}`}
                        to={`360 ${cx} ${cy}`}
                        dur="6s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Point core */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? '7' : '5'}
                    fill={i === 0 ? '#818cf8' : isSelected ? '#38bdf8' : '#0f172a'}
                    stroke={i === 0 ? '#c7d2fe' : isSelected ? '#ffffff' : '#38bdf8'}
                    strokeWidth="2"
                  />

                  {/* Label */}
                  <text
                    x={cx + 10}
                    y={cy - 8}
                    className={`font-mono text-[10px] font-bold ${
                      isSelected ? 'fill-white' : 'fill-cyan-300'
                    }`}
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Explanatory Context (5 cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide mb-3 flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-cyan-400" />
            Phase Space Dynamics & Geometry
          </h3>

          <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-cyan-300 font-semibold block mb-1">
                Geometric View of Sequential Memory
              </span>
              <p>
                Each hidden state vector h_t = [h⁽¹⁾, h⁽²⁾] is a point in a 2-dimensional
                feature space. As sequential tokens arrive, the network trajectory jumps between
                basins of attraction shaped by W_hh.
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-indigo-300 font-semibold block mb-1">
                Background Vector Field
              </span>
              <p>
                The grey vector arrows show the autonomous attractor field: where an unforced
                hidden state naturally drifts via h ↦ tanh(W_hh · h). Notice whether the
                arrows converge to the origin (0, 0) (stable decay) or form a circular whirlpool (oscillator).
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-emerald-300 font-semibold block mb-1">
                Interactive State Injection
              </span>
              <p>
                Click anywhere inside the coordinate plane to instantly set a custom initial state $h_0$
                and see the new trajectory evolve through the sequence in real time!
              </p>
            </div>
          </div>
        </div>

        {/* Selected Point Coordinates */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono">
          <div className="flex justify-between items-center text-slate-300">
            <span>Selected State:</span>
            <span className="text-cyan-300 font-bold">
              h<sub>{steps[currentStepIndex]?.t}</sub> = [
              {steps[currentStepIndex]?.h[0].toFixed(3)},{' '}
              {steps[currentStepIndex]?.h[1].toFixed(3)}]
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
