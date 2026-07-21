import { useState } from 'react';
import type { Goals } from '../types';

interface Props {
  goals: Goals;
  onSave: (goals: Goals) => void;
  onClose: () => void;
}

export default function GoalsEditor({ goals, onSave, onClose }: Props) {
  const [form, setForm] = useState(goals);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  const field = (key: keyof Goals, label: string, unit: string) => (
    <label className="flex flex-col gap-1 text-sm text-slate-300">
      {label} <span className="text-slate-500">({unit})</span>
      <input
        type="number"
        min={0}
        required
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
        className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Daily Goals</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {field('calories', 'Calories', 'kcal')}
          {field('protein', 'Protein', 'g')}
          {field('carbs', 'Carbs', 'g')}
          {field('fat', 'Fat', 'g')}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-700 py-2 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-emerald-500 py-2 font-medium text-slate-950 hover:bg-emerald-400"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
