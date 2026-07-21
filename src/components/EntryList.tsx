import type { LogEntry } from '../types';

interface Props {
  entries: LogEntry[];
  onRemove: (id: string) => void;
}

export default function EntryList({ entries, onRemove }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
        No food logged for this day yet.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries
        .slice()
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-100">{entry.name}</p>
              <p className="text-xs text-slate-500">
                {entry.calories} kcal · P{entry.protein}g · C{entry.carbs}g · F{entry.fat}g
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(entry.id)}
              className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-800 hover:text-red-400"
              aria-label={`Delete ${entry.name}`}
            >
              Delete
            </button>
          </li>
        ))}
    </ul>
  );
}
