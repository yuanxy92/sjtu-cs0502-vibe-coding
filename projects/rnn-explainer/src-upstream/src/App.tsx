/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SequenceItem,
  RNNWeights,
  ActivationType,
  PresetKey,
  ActiveTab,
} from './types/rnn';
import {
  PRESETS,
  runForwardPass,
  runBPTT,
  analyzeEigenvalues,
} from './utils/rnnMath';
import { Header } from './components/Header';
import { PlaybackControls } from './components/PlaybackControls';
import { UnrolledRNNCanvas } from './components/UnrolledRNNCanvas';
import { FoldedRNNView } from './components/FoldedRNNView';
import { MatrixMathInspector } from './components/MatrixMathInspector';
import { ParameterControls } from './components/ParameterControls';
import { BPTTPanel } from './components/BPTTPanel';
import { PhaseSpaceCanvas } from './components/PhaseSpaceCanvas';
import { SequenceEditor } from './components/SequenceEditor';
import { SpectralRadiusExplainer } from './components/SpectralRadiusExplainer';
import {
  BookOpen,
  Activity,
  Layers,
  Sparkles,
  GitPullRequest,
  Sliders,
  AlignLeft,
} from 'lucide-react';

export default function App() {
  // Preset & Configuration State
  const [currentPreset, setCurrentPreset] = useState<PresetKey>('balanced');
  const [weights, setWeights] = useState<RNNWeights>(PRESETS.balanced.weights);
  const [sequence, setSequence] = useState<SequenceItem[]>(PRESETS.balanced.sequence);
  const [activation, setActivation] = useState<ActivationType>(PRESETS.balanced.activation);
  const [isSpectralExplainerOpen, setIsSpectralExplainerOpen] = useState<boolean>(false);

  // Playback & Interaction State
  const [activeTab, setActiveTab] = useState<ActiveTab>('unrolled');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [mode, setMode] = useState<'forward' | 'backward'>('forward');

  // Load Preset handler
  const handleSelectPreset = useCallback((key: PresetKey) => {
    const preset = PRESETS[key];
    if (!preset) return;
    setCurrentPreset(key);
    // Deep clone to prevent mutations
    setWeights(JSON.parse(JSON.stringify(preset.weights)));
    setSequence(JSON.parse(JSON.stringify(preset.sequence)));
    setActivation(preset.activation);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, []);

  const handleResetToPreset = useCallback(() => {
    handleSelectPreset(currentPreset);
  }, [currentPreset, handleSelectPreset]);

  // Compute forward pass and BPTT gradients in real-time
  const steps = useMemo(() => {
    return runForwardPass(sequence, weights, activation);
  }, [sequence, weights, activation]);

  const gradients = useMemo(() => {
    return runBPTT(steps, weights, activation);
  }, [steps, weights, activation]);

  const eigenAnalysis = useMemo(() => {
    return analyzeEigenvalues(weights.Whh);
  }, [weights.Whh]);

  // Step Forward & Backward
  const handleStepForward = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
  }, [steps.length]);

  const handleStepBackward = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStepIndex(mode === 'forward' ? 0 : steps.length - 1);
    setIsPlaying(false);
  }, [mode, steps.length]);

  // Animation Loop Timer
  useEffect(() => {
    if (!isPlaying) return;

    const baseInterval = 1200 / speed;
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (mode === 'forward') {
          if (prev >= steps.length - 1) {
            return 0; // Loop or stop
          }
          return prev + 1;
        } else {
          // BPTT backward
          if (prev <= 0) {
            return steps.length - 1;
          }
          return prev - 1;
        }
      });
    }, baseInterval);

    return () => clearInterval(timer);
  }, [isPlaying, speed, mode, steps.length]);

  // Keyboard Navigation: Space to Play/Pause, Arrow Keys to Step
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return; // Avoid intercepting inputs
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleStepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleStepBackward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleStepForward, handleStepBackward]);

  // Safe current step references
  const safeCurrentStepIndex = Math.min(
    Math.max(0, currentStepIndex),
    steps.length - 1
  );
  const activeStep = steps[safeCurrentStepIndex] ?? steps[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* 1. Header (Adhering to Top Bar Contract) */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentPreset={currentPreset}
        onSelectPreset={handleSelectPreset}
        onResetToPreset={handleResetToPreset}
        onOpenSpectralExplainer={() => setIsSpectralExplainerOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Preset Description & Concept Kick-off Banner */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-white font-medium">
              Scenario: {PRESETS[currentPreset]?.name}
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="text-slate-400">
              {PRESETS[currentPreset]?.description}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Shortcut: Space (Play)</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>←/→ (Step)</span>
          </div>
        </div>

        {/* 2. Unified Playback & Scrubbing Controller */}
        <PlaybackControls
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          currentStepIndex={safeCurrentStepIndex}
          totalSteps={steps.length}
          onStepChange={setCurrentStepIndex}
          onStepForward={handleStepForward}
          onStepBackward={handleStepBackward}
          onReset={handleReset}
          speed={speed}
          onSpeedChange={setSpeed}
          mode={mode}
          onModeChange={setMode}
          stepLabel={`Step t=${activeStep.t}: "${activeStep.label}"`}
        />

        {/* 3. Primary Interactive Visualizer Canvas (Tab Switched) */}
        {activeTab === 'unrolled' && (
          <UnrolledRNNCanvas
            steps={steps}
            gradients={gradients}
            currentStepIndex={safeCurrentStepIndex}
            onSelectStep={setCurrentStepIndex}
            weights={weights}
            activation={activation}
            mode={mode}
            spectralRadius={eigenAnalysis.spectralRadius}
          />
        )}

        {activeTab === 'bptt' && (
          <BPTTPanel
            steps={steps}
            gradients={gradients}
            currentStepIndex={safeCurrentStepIndex}
            weights={weights}
            activation={activation}
            spectralRadius={eigenAnalysis.spectralRadius}
            onSelectStep={setCurrentStepIndex}
          />
        )}

        {activeTab === 'folded' && (
          <FoldedRNNView
            currentStep={activeStep}
            weights={weights}
            activation={activation}
            currentStepIndex={safeCurrentStepIndex}
            totalSteps={steps.length}
          />
        )}

        {activeTab === 'phasespace' && (
          <PhaseSpaceCanvas
            steps={steps}
            weights={weights}
            currentStepIndex={safeCurrentStepIndex}
            onSelectStep={setCurrentStepIndex}
            onSetInitialState={(newH0) =>
              setWeights({ ...weights, h0: newH0 })
            }
          />
        )}

        {activeTab === 'math' && (
          <MatrixMathInspector
            step={activeStep}
            weights={weights}
            activation={activation}
          />
        )}

        {/* 4. Interactive Weight Sliders & Live Parameter Deck */}
        <ParameterControls
          weights={weights}
          onWeightsChange={setWeights}
          activation={activation}
          onActivationChange={setActivation}
          eigenAnalysis={eigenAnalysis}
          currentPreset={currentPreset}
          onSelectPreset={handleSelectPreset}
          onOpenSpectralExplainer={() => setIsSpectralExplainerOpen(true)}
        />

        {/* 5. Sequence Data Stream Editor */}
        <SequenceEditor
          sequence={sequence}
          onSequenceChange={setSequence}
          currentPreset={currentPreset}
          onSelectPreset={handleSelectPreset}
        />
      </main>

      {/* Spectral Radius Explainer Modal */}
      <SpectralRadiusExplainer
        isOpen={isSpectralExplainerOpen}
        onClose={() => setIsSpectralExplainerOpen(false)}
        eigenAnalysis={eigenAnalysis}
        Whh={weights.Whh}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <p>
            Recurrent Neural Network Mathematical Dynamics & BPTT Simulator · Interactive Linear Algebra & Computation Graph Engine
          </p>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>tanh(W<sub>xh</sub>·x + W<sub>hh</sub>·h + b)</span>
            <span>·</span>
            <span>∂L / ∂h<sub>t</sub> = ∂L<sub>t</sub> / ∂h<sub>t</sub> + W<sub>hh</sub><sup>T</sup>·δ<sub>t+1</sub></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
