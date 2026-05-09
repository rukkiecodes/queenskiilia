import { create } from 'zustand';

type Toast = {
  id: string;
  message: string;
  variant: 'info' | 'error' | 'success';
};

type UiState = {
  toasts: Toast[];
  showToast: (message: string, variant?: Toast['variant']) => void;
  dismissToast: (id: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  showToast: (message, variant = 'info') =>
    set((s) => ({
      toasts: [...s.toasts, { id: `${Date.now()}-${Math.random()}`, message, variant }],
    })),
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
