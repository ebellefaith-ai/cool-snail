import { useCallback, useEffect, useState } from 'react';
import type { Goals, LogEntry, SavedFood } from './types';
import { DEFAULT_GOALS } from './types';

const KEYS = {
  entries: 'macro-tracker:entries',
  goals: 'macro-tracker:goals',
  savedFoods: 'macro-tracker:savedFoods',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useEntries() {
  const [entries, setEntries] = useState<LogEntry[]>(() => load(KEYS.entries, []));

  useEffect(() => {
    save(KEYS.entries, entries);
  }, [entries]);

  const addEntry = useCallback((entry: Omit<LogEntry, 'id' | 'createdAt'>) => {
    setEntries((prev) => [
      ...prev,
      { ...entry, id: crypto.randomUUID(), createdAt: Date.now() },
    ]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, addEntry, removeEntry };
}

export function useGoals() {
  const [goals, setGoals] = useState<Goals>(() => load(KEYS.goals, DEFAULT_GOALS));

  useEffect(() => {
    save(KEYS.goals, goals);
  }, [goals]);

  return { goals, setGoals };
}

export function useSavedFoods() {
  const [savedFoods, setSavedFoods] = useState<SavedFood[]>(() => load(KEYS.savedFoods, []));

  useEffect(() => {
    save(KEYS.savedFoods, savedFoods);
  }, [savedFoods]);

  const addSavedFood = useCallback((food: Omit<SavedFood, 'id'>) => {
    setSavedFoods((prev) => [...prev, { ...food, id: crypto.randomUUID() }]);
  }, []);

  const removeSavedFood = useCallback((id: string) => {
    setSavedFoods((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { savedFoods, addSavedFood, removeSavedFood };
}
