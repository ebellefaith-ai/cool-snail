export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface SavedFood extends Macros {
  id: string;
  name: string;
}

export interface LogEntry extends Macros {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export interface Goals extends Macros {}

export const DEFAULT_GOALS: Goals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};
