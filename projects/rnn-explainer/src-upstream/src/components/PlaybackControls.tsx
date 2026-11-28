import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentStepIndex: number;
  totalSteps: number;
  onStepChange: (index: number) => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  mode: 'forward' | 'backward';
  onModeChange: (mode: 'forward' | 'backward') => void;
  stepLabel?: string;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onTogglePlay,
  currentStepIndex,
  totalSteps,
  onStepChange,
  onStepForward,
  onStepBackward,
  onReset,
  speed,
  onSpeedChange,
  mode,
  onModeChange,
  stepLabel,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Play/Pause and Step buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            title="Restart from beginning"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onStepBackward}
            disabled={currentStepIndex <= 0}
            title="Step backward (Left Arrow)"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play simulation (Space)'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-colors"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play Animation</span>
              </>
            )}
          </button>

          <button
            onClick={onStepForward}
            disabled={currentStepIndex >= totalSteps - 1}
            title="Step forward (Right Arrow)"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Timeline Scrubber with Step Tracker */}
        <div className="flex-1 min-w-[200px] max-w-md flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">
              Time Step {currentStepIndex + 1} of {totalSteps}
            </span>
            <span className="text-slate-300 font-medium truncate max-w-[180px]">
              {stepLabel || `Step t = ${currentStepIndex + 1}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={Math.max(0, totalSteps - 1)}
              value={currentStepIndex}
              onChange={(e) => onStepChange(Number(e.target.value))}
              aria-label="Time step slider"
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        {/* Right: Flow Mode (Forward vs BPTT) & Speed selector */}
        <div className="flex items-center gap-3">
          {/* Simulation Direction / Mode Toggle */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={() => onModeChange('forward')}
              title="Visualize forward inference flow"
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                mode === 'forward'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowRight className="w-3 h-3" />
              <span>Forward</span>
            </button>
            <button
              onClick={() => onModeChange('backward')}
              title="Visualize BPTT gradient backpropagation flow"
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                mode === 'backward'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowLeft className="w-3 h-3" />
              <span>BPTT Gradients</span>
            </button>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs text-slate-300">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-0.5 rounded text-xs font-mono font-medium transition-colors ${
                  speed === s
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
