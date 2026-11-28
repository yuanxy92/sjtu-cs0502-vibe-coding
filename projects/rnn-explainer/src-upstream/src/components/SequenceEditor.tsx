import React from 'react';
import { SequenceItem, PresetKey } from '../types/rnn';
import { Plus, Trash2, Edit3, AlignLeft, Sparkles } from 'lucide-react';

interface SequenceEditorProps {
  sequence: SequenceItem[];
  onSequenceChange: (seq: SequenceItem[]) => void;
  currentPreset: PresetKey;
  onSelectPreset: (preset: PresetKey) => void;
}

export const SequenceEditor: React.FC<SequenceEditorProps> = ({
  sequence,
  onSequenceChange,
  currentPreset,
  onSelectPreset,
}) => {
  const handleUpdateItem = (
    index: number,
    field: 'label' | 'x0' | 'x1' | 'target',
    value: string | number
  ) => {
    const updated = sequence.map((item, i) => {
      if (i !== index) return item;
      if (field === 'label') {
        return { ...item, label: String(value) };
      }
      if (field === 'x0') {
        return { ...item, x: [Number(value), item.x[1]] };
      }
      if (field === 'x1') {
        return { ...item, x: [item.x[0], Number(value)] };
      }
      if (field === 'target') {
        return { ...item, target: [Number(value)] };
      }
      return item;
    });
    onSequenceChange(updated);
  };

  const handleAddItem = () => {
    if (sequence.length >= 7) return;
    const nextIdx = sequence.length + 1;
    const newItem: SequenceItem = {
      id: String(Date.now()),
      label: `x_${nextIdx}`,
      x: [0.5, -0.5],
      target: [0.0],
    };
    onSequenceChange([...sequence, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (sequence.length <= 2) return;
    const filtered = sequence.filter((_, i) => i !== index);
    onSequenceChange(filtered);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <AlignLeft className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide">
              Sequential Data Stream Editor
            </h2>
            <p className="text-xs text-slate-400">
              Customize sequential tokens, 2D input feature vectors $[x^{(1)}, x^{(2)}]$, and ground-truth target outputs $y^*$.
            </p>
          </div>
        </div>

        <button
          onClick={handleAddItem}
          disabled={sequence.length >= 7}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Time Step</span>
        </button>
      </div>

      {/* Sequence items table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono">
              <th className="py-2 px-3">Step</th>
              <th className="py-2 px-3">Token / Label</th>
              <th className="py-2 px-3">Input x⁽¹⁾</th>
              <th className="py-2 px-3">Input x⁽²⁾</th>
              <th className="py-2 px-3">Target Output y*</th>
              <th className="py-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sequence.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-mono text-indigo-300 font-semibold">
                  t = {idx + 1}
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleUpdateItem(idx, 'label', e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 w-32 focus:outline-none focus:border-indigo-500"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    step="0.1"
                    min="-2"
                    max="2"
                    value={item.x[0]}
                    onChange={(e) =>
                      handleUpdateItem(idx, 'x0', parseFloat(e.target.value) || 0)
                    }
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-sky-300 w-20 text-center focus:outline-none focus:border-sky-500"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    step="0.1"
                    min="-2"
                    max="2"
                    value={item.x[1]}
                    onChange={(e) =>
                      handleUpdateItem(idx, 'x1', parseFloat(e.target.value) || 0)
                    }
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-sky-300 w-20 text-center focus:outline-none focus:border-sky-500"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    step="0.1"
                    min="-2"
                    max="2"
                    value={item.target ? item.target[0] : 0}
                    onChange={(e) =>
                      handleUpdateItem(idx, 'target', parseFloat(e.target.value) || 0)
                    }
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-amber-300 w-20 text-center focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    disabled={sequence.length <= 2}
                    title="Delete step"
                    className="p-1 rounded text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
