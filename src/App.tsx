import { useMemo, useState } from 'react';
import DateNav from './components/DateNav';
import MacroProgress from './components/MacroProgress';
import AddEntryForm from './components/AddEntryForm';
import EntryList from './components/EntryList';
import GoalsEditor from './components/GoalsEditor';
import { todayStr, useEntries, useGoals, useSavedFoods } from './storage';
import type { Macros } from './types';

function App() {
  const { entries, addEntry, removeEntry } = useEntries();
  const { goals, setGoals } = useGoals();
  const { savedFoods, addSavedFood, removeSavedFood } = useSavedFoods();
  const [date, setDate] = useState(todayStr());
  const [editingGoals, setEditingGoals] = useState(false);

  const dayEntries = useMemo(() => entries.filter((e) => e.date === date), [entries, date]);

  const totals = useMemo<Macros>(
    () =>
      dayEntries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein,
          carbs: acc.carbs + e.carbs,
          fat: acc.fat + e.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [dayEntries],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Macro Tracker</h1>
          <button
            type="button"
            onClick={() => setEditingGoals(true)}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
          >
            Edit goals
          </button>
        </header>

        <DateNav date={date} onChange={setDate} />
        <MacroProgress totals={totals} goals={goals} />
        <AddEntryForm
          savedFoods={savedFoods}
          onAdd={(entry) => addEntry({ ...entry, date })}
          onSaveFood={addSavedFood}
          onDeleteSavedFood={removeSavedFood}
        />

        <div>
          <h2 className="text-base font-semibold text-slate-100 mb-3">Today's log</h2>
          <EntryList entries={dayEntries} onRemove={removeEntry} />
        </div>
      </div>

      {editingGoals && (
        <GoalsEditor goals={goals} onSave={setGoals} onClose={() => setEditingGoals(false)} />
      )}
    </div>
  );
}

export default App;
