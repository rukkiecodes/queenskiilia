import { create } from 'zustand';

type State = {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  increment: (by?: number) => void;
  markAllRead: () => void;
};

/**
 * Tracks unread notifications across the app. Feature 13 will populate this
 * from push notifications + a server-side query; for now the store is local
 * and the count is set manually for testing the bell badge.
 */
export const useNotificationStore = create<State>((set) => ({
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: Math.max(0, n) }),
  increment: (by = 1) => set((s) => ({ unreadCount: s.unreadCount + by })),
  markAllRead: () => set({ unreadCount: 0 }),
}));
