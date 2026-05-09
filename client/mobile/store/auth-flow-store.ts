import { create } from 'zustand';

import type { AccountType } from '@/lib/auth-api';

type AuthFlowState = {
  accountType: AccountType | null;
  email: string | null;
  setAccountType: (t: AccountType) => void;
  setEmail: (e: string) => void;
  reset: () => void;
};

export const useAuthFlowStore = create<AuthFlowState>((set) => ({
  accountType: null,
  email: null,
  setAccountType: (accountType) => set({ accountType }),
  setEmail: (email) => set({ email }),
  reset: () => set({ accountType: null, email: null }),
}));
