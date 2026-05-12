import { create } from 'zustand';

type State = {
  skillLevel: string | null;
  country: string | null;
  minRating: number | null;

  setSkillLevel: (l: string | null) => void;
  setCountry: (c: string | null) => void;
  setMinRating: (r: number | null) => void;
  reset: () => void;
};

const INITIAL: Pick<State, 'skillLevel' | 'country' | 'minRating'> = {
  skillLevel: null,
  country: null,
  minRating: null,
};

export const useTalentFiltersStore = create<State>((set) => ({
  ...INITIAL,
  setSkillLevel: (skillLevel) => set({ skillLevel }),
  setCountry: (country) => set({ country }),
  setMinRating: (minRating) => set({ minRating }),
  reset: () => set(INITIAL),
}));
