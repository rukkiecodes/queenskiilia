import { create } from 'zustand';

type State = {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
};

/**
 * Holds the unread-notification count for the tab-header bell badge. Kept in
 * sync with the server by `useUnreadCount`, which polls and writes here; the
 * bell only reads.
 */
export const useNotificationStore = create<State>((set) => ({
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: Math.max(0, n) }),
}));
