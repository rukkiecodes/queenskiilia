import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'qs.accessToken';
const REFRESH_KEY = 'qs.refreshToken';
const USER_KEY = 'qs.user';

export const tokenStorage = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_KEY),
  setAccessToken: (token: string) => SecureStore.setItemAsync(ACCESS_KEY, token),
  clearAccessToken: () => SecureStore.deleteItemAsync(ACCESS_KEY),

  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_KEY),
  setRefreshToken: (token: string) => SecureStore.setItemAsync(REFRESH_KEY, token),
  clearRefreshToken: () => SecureStore.deleteItemAsync(REFRESH_KEY),

  getUser: async <T = unknown>(): Promise<T | null> => {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  setUser: (user: unknown) => SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  clearUser: () => SecureStore.deleteItemAsync(USER_KEY),

  clearAll: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  },
};
