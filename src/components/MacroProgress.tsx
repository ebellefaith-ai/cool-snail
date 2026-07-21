import type { Macros } from '../types';

interface Props {
  totals: Macros;
  goals: Macros;
}

const BARS: { key: keyof Macros; label: string; unit: string; color: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal', color: 'bg-emerald-500' },
  { key: 'protein', label: 'Protein', unit: 'g', color: 'bg-sky-500' },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: 'bg-amber-500' },
  { key: 'fat', label: 'Fat', unit: 'g', color: 'bg-rose-500' },
];

export default function MacroProgress({ totals, goals }: Props) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col gap-4">
      {BARS.map(({ key, label, unit, color }) => {
        const value = totals[key];
        const goal = goals[key] || 1;
        const pct = Math.min(100, (value / goal) * 100);
        const over = value > goal;
        return (
          <div key={key}>
            <div className="flex items-baseline justify-between text-sm mb-1">
              <span className="font-medium text-slate-200">{label}</span>
              <span className={over ? 'text-red-400' : 'text-slate-400'}>
                {Math.round(value)} / {goal} {unit}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
