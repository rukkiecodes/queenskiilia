import { create } from 'zustand';

type State = {
  /** sessionId currently being attempted; null if no in-progress UI state. */
  sessionId: string | null;
  /** zero-based index of the question on screen. */
  currentIndex: number;
  /** map of questionIndex → selectedOption (0..N). */
  answers: Record<number, number>;

  bind: (sessionId: string) => void;
  setAnswer: (questionIndex: number, selectedOption: number) => void;
  advance: () => void;
  reset: () => void;
};

const INITIAL: Pick<State, 'sessionId' | 'currentIndex' | 'answers'> = {
  sessionId: null,
  currentIndex: 0,
  answers: {},
};

/**
 * In-memory state for the in-flight assessment session. Closing the app
 * resets this; the active session itself still lives on the server but the
 * student would re-answer from question 1. Acceptable MVP trade-off — see
 * Feature 06 notes.
 */
export const useAssessmentStore = create<State>((set) => ({
  ...INITIAL,
  bind: (sessionId) =>
    set((s) =>
      s.sessionId === sessionId ? s : { sessionId, currentIndex: 0, answers: {} },
    ),
  setAnswer: (questionIndex, selectedOption) =>
    set((s) => ({ answers: { ...s.answers, [questionIndex]: selectedOption } })),
  advance: () => set((s) => ({ currentIndex: s.currentIndex + 1 })),
  reset: () => set(INITIAL),
}));
