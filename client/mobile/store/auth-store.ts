import { create } from 'zustand';

import { authApi, type AuthUser } from '@/lib/auth-api';
import { tokenStorage } from '@/lib/token-storage';

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  logout: () => Promise<void>;
};

let refreshInflight: Promise<string | null> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,

  hydrate: async () => {
    const [accessToken, refreshToken, user] = await Promise.all([
      tokenStorage.getAccessToken(),
      tokenStorage.getRefreshToken(),
      tokenStorage.getUser<AuthUser>(),
    ]);
    set({ accessToken, refreshToken, user });

    // Eager refresh: if we have a refresh token, rotate the access token before the AuthGate
    // makes its routing decision. This avoids the dashboard flicker when the stored access
    // token is expired but the refresh is still valid.
    if (refreshToken && user) {
      try {
        const next = await authApi.refresh(refreshToken);
        await Promise.all([
          tokenStorage.setAccessToken(next.accessToken),
          tokenStorage.setRefreshToken(next.refreshToken),
        ]);
        set({ accessToken: next.accessToken, refreshToken: next.refreshToken });
      } catch {
        await tokenStorage.clearAll();
        set({ user: null, accessToken: null, refreshToken: null });
      }
    }

    set({ hydrated: true });
  },

  setAuth: async (user, accessToken, refreshToken) => {
    await Promise.all([
      tokenStorage.setAccessToken(accessToken),
      tokenStorage.setRefreshToken(refreshToken),
      tokenStorage.setUser(user),
    ]);
    set({ user, accessToken, refreshToken });
  },

  refreshAccessToken: async () => {
    if (refreshInflight) return refreshInflight;

    const current = get().refreshToken;
    if (!current) {
      await get().logout();
      return null;
    }

    refreshInflight = (async () => {
      try {
        const next = await authApi.refresh(current);
        await Promise.all([
          tokenStorage.setAccessToken(next.accessToken),
          tokenStorage.setRefreshToken(next.refreshToken),
        ]);
        set({ accessToken: next.accessToken, refreshToken: next.refreshToken });
        return next.accessToken;
      } catch {
        await get().logout();
        return null;
      } finally {
        refreshInflight = null;
      }
    })();

    return refreshInflight;
  },

  logout: async () => {
    const current = get().refreshToken;
    try {
      await authApi.logout(current);
    } catch {
      // ignore — clear local regardless
    }
    await tokenStorage.clearAll();
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
