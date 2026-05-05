# Auth Flow — Screens, Logic, Token Strategy

## Overview

QueenSkiilia uses **OTP-based passwordless auth** (email OTP).
No passwords — user enters email, receives 6-digit code, verifies, gets JWT.

All HTTP calls use the native **fetch API** (no axios).
Token storage uses **expo-secure-store**.

---

## Backend Endpoints (REST — main-server)

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/auth/request-otp` | `{ email, accountType }` | `{ message }` |
| POST | `/auth/verify-otp` | `{ email, otp }` | `{ accessToken, user }` + refreshToken cookie |
| POST | `/auth/refresh` | `{ refreshToken }` | `{ accessToken }` |
| POST | `/auth/logout` | _(bearer token)_ | `{ message }` |

**Note:** Backend issues refresh token as HttpOnly cookie (web only).
On mobile: extract `refreshToken` from response body or `Set-Cookie` header → store in SecureStore.

---

## Auth Flow Step-by-Step

```
1. App Launch
   └── Root _layout.tsx calls authStore.hydrate()
       ├── Token exists + not expired?
       │   └── Decode → get accountType → route to dashboard
       ├── Token expired?
       │   └── POST /auth/refresh with stored refreshToken
       │       ├── Success → store new accessToken → route to dashboard
       │       └── Fail → clear all tokens → /(auth)/onboarding
       └── No token → /(auth)/onboarding

2. Onboarding
   └── 3-slide carousel
       └── "Get Started" → /(auth)/account-type

3. Account Type Selection
   └── Choose "Student" or "Business"
       └── Store in local state → /(auth)/email

4. Email Screen
   └── Enter email
       └── POST /auth/request-otp { email, accountType }
           ├── Success → /(auth)/otp (pass email as param)
           └── Error → inline error toast

5. OTP Screen
   └── 6-digit input (auto-advance)
       ├── 10-min countdown timer
       ├── Resend OTP (active after 60s)
       └── POST /auth/verify-otp { email, otp }
           ├── Success →
           │   ├── authStore.setAuth(user, accessToken, refreshToken)
           │   ├── Profile complete? → dashboard
           │   └── Profile incomplete? → /(auth)/profile-setup
           └── Error → Reanimated shake + error toast

6. Profile Setup (first login only)
   └── Full name, avatar (optional), country
       ├── Student: bio, university, graduation year
       ├── Business: company name, website, industry
       └── GQL mutation updateProfile → dashboard
```

---

## Token Storage

```typescript
// lib/token-storage.ts

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
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(KEYS.USER),
    ]);
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

## Auth API (fetch — no axios)

```typescript
// lib/auth-api.ts

const BASE = `${process.env.EXPO_PUBLIC_API_URL}/auth`;

export const authApi = {
  async requestOtp(email: string, accountType: 'student' | 'business') {
    const res = await fetch(`${BASE}/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, accountType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to send OTP');
    }
    return res.json();
  },

  async verifyOtp(email: string, otp: string) {
    const res = await fetch(`${BASE}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Invalid OTP');
    }
    return res.json() as Promise<{ accessToken: string; refreshToken: string; user: User }>;
  },

  async refresh(refreshToken: string) {
    const res = await fetch(`${BASE}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('Token refresh failed');
    return res.json() as Promise<{ accessToken: string }>;
  },

  async logout(accessToken: string) {
    await fetch(`${BASE}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },
};
```

---

## Auth Store (Zustand)

```typescript
// store/auth-store.ts

import { create } from 'zustand';
import { TokenStorage } from '../lib/token-storage';
import { authApi } from '../lib/auth-api';

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
      const { accessToken } = await authApi.refresh(refreshToken);
      await TokenStorage.saveTokens(accessToken, refreshToken);
      set({ accessToken });
      return true;
    } catch {
      await get().logout();
      return false;
    }
  },

  logout: async () => {
    const token = get().accessToken;
    if (token) await authApi.logout(token).catch(() => {});
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
import { Stack } from 'expo-router/stack';
import { useRouter, useSegments, Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth-store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 2 },
  },
});

function AuthGate() {
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
      router.replace(
        user?.accountType === 'student'
          ? '/(student)/dashboard'
          : '/(business)/dashboard'
      );
    }
  }, [isAuthenticated, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
    </QueryClientProvider>
  );
}
```

---

## OTP Input Component Spec

- 6 individual `TextInput` boxes, `keyboardType="number-pad"`
- Auto-focus next box on digit entry
- On backspace in empty box → focus previous
- Paste detection: if 6-digit string pasted → fill all boxes
- **Shake animation:** Reanimated 4 `withSequence(withTiming(-8), withTiming(8), ...)` on error
- **Countdown timer:** `10:00` → `0:00`, red at < 2 min
- **Resend button:** disabled 60s with live countdown, then active

---

## TanStack Query Auth Mutations

```typescript
// hooks/use-auth.ts

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { authApi } from '../lib/auth-api';
import { useAuthStore } from '../store/auth-store';

export function useRequestOtp() {
  return useMutation({
    mutationFn: ({ email, accountType }: { email: string; accountType: 'student' | 'business' }) =>
      authApi.requestOtp(email, accountType),
  });
}

export function useVerifyOtp() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      authApi.verifyOtp(email, otp),
    onSuccess: async (data) => {
      await setAuth(data.user, data.accessToken, data.refreshToken);
      const hasProfile = !!data.user.fullName;
      router.replace(
        hasProfile
          ? data.user.accountType === 'student' ? '/(student)/dashboard' : '/(business)/dashboard'
          : '/(auth)/profile-setup'
      );
    },
  });
}
```
