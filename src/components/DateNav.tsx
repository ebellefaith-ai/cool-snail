interface Props {
  date: string;
  onChange: (date: string) => void;
}

function shiftDate(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplay(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function DateNav({ date, onChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => onChange(shiftDate(date, -1))}
        className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
        aria-label="Previous day"
      >
        ←
      </button>
      <div className="flex flex-col items-center">
        <span className="text-sm font-medium text-slate-100">{formatDisplay(date)}</span>
        <input
          type="date"
          value={date}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 bg-transparent text-xs text-slate-500 [color-scheme:dark]"
        />
      </div>
      <button
        type="button"
        onClick={() => onChange(shiftDate(date, 1))}
        className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
        aria-label="Next day"
      >
        →
      </button>
    </div>
  );
}
