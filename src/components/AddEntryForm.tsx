import { useState } from 'react';
import type { Macros, SavedFood } from '../types';

interface Props {
  savedFoods: SavedFood[];
  onAdd: (entry: { name: string } & Macros) => void;
  onSaveFood: (food: { name: string } & Macros) => void;
  onDeleteSavedFood: (id: string) => void;
}

const empty = { name: '', calories: '', protein: '', carbs: '', fat: '' };

export default function AddEntryForm({ savedFoods, onAdd, onSaveFood, onDeleteSavedFood }: Props) {
  const [form, setForm] = useState(empty);
  const [remember, setRemember] = useState(false);

  const reset = () => {
    setForm(empty);
    setRemember(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const entry = {
      name: form.name.trim(),
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
    };
    onAdd(entry);
    if (remember) onSaveFood(entry);
    reset();
  };

  const quickAdd = (food: SavedFood) => {
    onAdd({ name: food.name, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat });
  };

  const num = (key: keyof typeof empty, label: string) => (
    <label className="flex flex-col gap-1 text-xs text-slate-400">
      {label}
      <input
        type="number"
        min={0}
        step="any"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder="0"
        className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </label>
  );

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
      <h2 className="text-base font-semibold text-slate-100 mb-3">Log food</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Food name
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Grilled chicken breast"
            className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>
        <div className="grid grid-cols-4 gap-2">
          {num('calories', 'Calories')}
          {num('protein', 'Protein (g)')}
          {num('carbs', 'Carbs (g)')}
          {num('fat', 'Fat (g)')}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="rounded border-slate-600 bg-slate-800"
          />
          Save to quick-add list
        </label>
        <button
          type="submit"
          className="rounded-lg bg-emerald-500 py-2 font-medium text-slate-950 hover:bg-emerald-400"
        >
          Add entry
        </button>
      </form>

      {savedFoods.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">Quick add</h3>
          <div className="flex flex-wrap gap-2">
            {savedFoods.map((food) => (
              <div
                key={food.id}
                className="group flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 pl-3 pr-1 py-1 text-sm text-slate-200"
              >
                <button
                  type="button"
                  onClick={() => quickAdd(food)}
                  className="hover:text-emerald-400"
                  title={`${food.calories} kcal · P${food.protein} C${food.carbs} F${food.fat}`}
                >
                  {food.name}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSavedFood(food.id)}
                  className="ml-1 rounded-full px-1.5 text-slate-500 hover:bg-slate-700 hover:text-red-400"
                  aria-label={`Remove ${food.name} from quick add`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
