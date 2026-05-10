import { create } from 'zustand';

import type { SkillLevel, SortBy } from '@/lib/projects-api';

type State = {
  search: string;
  skillLevel: SkillLevel | null;
  budgetMin: number | null;
  budgetMax: number | null;
  sortBy: SortBy;

  setSearch: (s: string) => void;
  setSkillLevel: (l: SkillLevel | null) => void;
  setBudget: (min: number | null, max: number | null) => void;
  setSortBy: (s: SortBy) => void;
  reset: () => void;
};

const INITIAL: Pick<State, 'search' | 'skillLevel' | 'budgetMin' | 'budgetMax' | 'sortBy'> = {
  search: '',
  skillLevel: null,
  budgetMin: null,
  budgetMax: null,
  sortBy: 'latest',
};

export const useProjectFiltersStore = create<State>((set) => ({
  ...INITIAL,
  setSearch: (search) => set({ search }),
  setSkillLevel: (skillLevel) => set({ skillLevel }),
  setBudget: (budgetMin, budgetMax) => set({ budgetMin, budgetMax }),
  setSortBy: (sortBy) => set({ sortBy }),
  reset: () => set(INITIAL),
}));
