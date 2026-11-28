import React from 'react';
import { ActiveTab, PresetKey } from '../types/rnn';
import { PRESETS } from '../utils/rnnMath';
import { RotateCcw, Sparkles, Gauge } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentPreset: PresetKey;
  onSelectPreset: (preset: PresetKey) => void;
  onResetToPreset: () => void;
  onOpenSpectralExplainer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  currentPreset,
  onSelectPreset,
  onResetToPreset,
  onOpenSpectralExplainer,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-mono font-bold text-sm">
          RNN
        </div>
        <span className="text-base font-semibold tracking-tight text-white whitespace-nowrap">
          RNN Dynamics Visualizer
        </span>
      </div>

      {/* Zone 2: Concise single-line navigation tabs */}
      <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => onTabChange('unrolled')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'unrolled'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Unrolled Sequence
        </button>
        <button
          onClick={() => onTabChange('bptt')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'bptt'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          BPTT & Gradients
        </button>
        <button
          onClick={() => onTabChange('folded')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'folded'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Folded Architecture
        </button>
        <button
          onClick={() => onTabChange('phasespace')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'phasespace'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Phase Space Trajectory
        </button>
        <button
          onClick={() => onTabChange('math')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'math'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Matrix Math Deep Dive
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative">
          <select
            value={currentPreset}
            aria-label="Preset Scenario"
            onChange={(e) => onSelectPreset(e.target.value as PresetKey)}
            className="bg-slate-900 text-xs text-slate-200 font-medium px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer pr-7 appearance-none"
          >
            {Object.entries(PRESETS).map(([key, item]) => (
              <option key={key} value={key} className="bg-slate-900 text-slate-200">
                Preset: {item.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {onOpenSpectralExplainer && (
          <button
            onClick={onOpenSpectralExplainer}
            title="Understand Spectral Radius ρ and stability in RNNs"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 rounded-lg border border-cyan-800/60 transition-colors whitespace-nowrap shrink-0"
          >
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Explain ρ</span>
          </button>
        )}

        <button
          onClick={onResetToPreset}
          title="Reset current preset weights"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
};
