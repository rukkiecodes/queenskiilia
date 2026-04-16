# Auth Flow — Screens, Logic, Token Strategy

## Overview

QueenSkiilia uses **OTP-based passwordless auth** (email OTP).
No passwords — user enters email, receives 6-digit code, verifies, gets JWT.

---

## Backend Endpoints (REST — main-server)

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/auth/request-otp` | `{ email, accountType }` | `{ message }` |
| POST | `/auth/verify-otp` | `{ email, otp }` | `{ accessToken, user }` + refreshToken cookie |
| POST | `/auth/refresh` | _(cookie)_ | `{ accessToken }` |
| POST | `/auth/logout` | _(cookie)_ | `{ message }` |

**Note:** The backend issues the refresh token as an HttpOnly cookie.
On mobile we must handle this by extracting and storing it manually via cookie headers.
Store **accessToken** in `Expo SecureStore`. Store **refreshToken** in `Expo SecureStore`.

---

## Auth Flow Step-by-Step

```
1. App Launch
   └── Check SecureStore for accessToken
       ├── Token exists + not expired?
       │   └── Decode → get accountType → route to dashboard
       ├── Token expired?
       │   └── Call /auth/refresh with stored refreshToken
       │       ├── Success → store new accessToken → route to dashboard
       │       └── Fail → clear all tokens → route to /auth/onboarding
       └── No token → route to /auth/onboarding

2. Onboarding
   └── 3-slide carousel (what is QueenSkiilia)
       └── "Get Started" → /auth/account-type

3. Account Type Selection
   └── Choose "Student" or "Business" → store locally → /auth/email

4. Email Screen
   └── Enter email address
       └── Validate format
           └── POST /auth/request-otp { email, accountType }
               ├── Success → navigate to /auth/otp (pass email as param)
               └── Error  → show inline error toast

5. OTP Screen
   └── 6-digit code input (auto-advance between fields)
       ├── 10-min countdown timer
       ├── "Resend OTP" button (active after 60s)
       └── POST /auth/verify-otp { email, otp }
           ├── Success →
           │   ├── Store accessToken in SecureStore
           │   ├── Store refreshToken in SecureStore
           │   ├── Store user object in Zustand + MMKV
           │   ├── Is profile complete?
           │   │   ├── YES → route to dashboard
           │   │   └── NO  → route to /auth/profile-setup
           └── Error → shake animation + error message

6. Profile Setup (first login only)
   └── Full name, avatar (optional), country
       ├── Student: bio, university, graduation year
       ├── Business: company name, website, industry
       └── Submit → updateProfile mutation
           └── Route to dashboard
```

---

## Token Storage Strategy

```typescript
// lib/tokenStorage.ts

import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN:  'qs_access_token',
  REFRESH_TOKEN: 'qs_refresh_token',
  USER:          'qs_user',
} as const;

export const TokenStorage = {
  async saveTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
  },

  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },

  async clearAll() {
    await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.USER);
  },

  async saveUser(user: object) {
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
  },

  async getUser() {
    const raw = await SecureStore.getItemAsync(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },
};
```

---

## Auth Store (Zustand)

```typescript
// store/authStore.ts

import { create } from 'zustand';
import { TokenStorage } from '../lib/tokenStorage';

interface User {
  id: string;
  email: string;
  accountType: 'student' | 'business';
  fullName?: string;
  avatarUrl?: string;
  isVerified: boolean;
  verifiedBadge?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await TokenStorage.saveTokens(accessToken, refreshToken);
    await TokenStorage.saveUser(user);
    set({ user, accessToken, isAuthenticated: true });
  },

  refreshAccessToken: async () => {
    try {
      const refreshToken = await TokenStorage.getRefreshToken();
      if (!refreshToken) return false;
      const response = await authApi.refresh(refreshToken);
      await TokenStorage.saveTokens(response.accessToken, refreshToken);
      set({ accessToken: response.accessToken });
      return true;
    } catch {
      await get().logout();
      return false;
    }
  },

  logout: async () => {
    await TokenStorage.clearAll();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  hydrate: async () => {
    set({ isLoading: true });
    const [token, user] = await Promise.all([
      TokenStorage.getAccessToken(),
      TokenStorage.getUser(),
    ]);
    if (token && user) {
      set({ accessToken: token, user, isAuthenticated: true });
    }
    set({ isLoading: false });
  },
}));
```

---

## Auth Guard (Root Layout)

```typescript
// app/_layout.tsx

import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const { isAuthenticated, isLoading, user, hydrate } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/onboarding');
    } else if (isAuthenticated && inAuthGroup) {
      const dest = user?.accountType === 'student'
        ? '/(student)/dashboard'
        : '/(business)/dashboard';
      router.replace(dest);
    }
  }, [isAuthenticated, isLoading, segments]);

  return <Slot />;
}
```

---

## OTP Input Component Spec

- 6 individual `TextInput` boxes
- Auto-focus next input on digit entry
- Auto-focus previous on backspace (if empty)
- Paste support — detect 6 digits pasted → fill all boxes
- Shake animation on wrong OTP via Reanimated
- Countdown timer: `10:00` → `0:00` format
- Resend button: disabled for first 60s with live countdown

---

## Axios Auth Client

```typescript
// lib/authApi.ts

import axios from 'axios';
import { MAIN_SERVER_URL } from '../constants/env';
import { TokenStorage } from './tokenStorage';

const authApi = axios.create({ baseURL: `${MAIN_SERVER_URL}/auth` });

// Attach access token to every request
authApi.interceptors.request.use(async (config) => {
  const token = await TokenStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 → attempt refresh → retry once
authApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshed = await useAuthStore.getState().refreshAccessToken();
      if (refreshed) return authApi(error.config);
    }
    return Promise.reject(error);
  }
);

export { authApi };
```
