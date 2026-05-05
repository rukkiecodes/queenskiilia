# QueenSkiilia Mobile App — Overview & Tech Stack

## App Identity
- **Name:** QueenSkiilia
- **Tagline:** From Skill to Real Experience
- **Platform:** iOS + Android (via Expo)
- **Type:** Marketplace — Skills, Projects, Escrow, Portfolio
- **Account Types:** Student | Business

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Expo SDK | ^55.0.19 |
| Routing | Expo Router | ~55.0.13 |
| React | React 19 + React Compiler (stable) | 19.2.0 |
| React Native | React Native New Architecture (default) | 0.83.6 |
| Language | TypeScript (strict) | ~5.9.2 |
| Data Fetching | TanStack React Query | ^5.x |
| State Management | Zustand | ^5.x |
| Token Storage | expo-secure-store | ~55.0.13 |
| Animations | React Native Reanimated | 4.2.1 |
| Worklets | react-native-worklets (separate from Reanimated 4) | 0.7.4 |
| Gestures | React Native Gesture Handler | ~2.30.0 |
| Image Component | expo-image (including SF Symbols via `sf:` source) | ~55.0.9 |
| Image Picker | expo-image-picker | ~55.0.19 |
| Camera | expo-camera | ~55.0.16 |
| File Picker | expo-document-picker | ~55.0.13 |
| Forms | React Hook Form + Zod | latest |
| Notifications | expo-notifications | ~55.0.22 |
| Haptics | expo-haptics | ~55.0.14 |
| WebSocket | socket.io-client (real-time chat/notifications) | ^4.8.3 |
| HTTP | fetch API (native, no axios) | native |
| Payments WebView | react-native-webview | 13.16.0 |
| Dates | date-fns | ^4.1.0 |
| Navigation (Tabs) | NativeTabs from expo-router/unstable-native-tabs | built-in |
| Navigation (Stack) | Stack from expo-router/stack | built-in |

### Key Platform Flags (SDK 55 defaults — no longer needed in app.json)
- **New Architecture:** default in SDK 55+ (no `newArchEnabled` flag needed)
- **Edge-to-edge Android:** default in SDK 55+ (no `edgeToEdgeEnabled` flag needed)
- **React Compiler enabled:** `experiments.reactCompiler: true` (stable since SDK 54)
- **Typed Routes enabled:** `experiments.typedRoutes: true`
- **Predictive Back disabled:** `predictiveBackGestureEnabled: false`

### SDK 55 Notes
- **NativeTabs API change:** `Icon`, `Label`, `Badge` now accessed via `NativeTabs.Trigger.Icon` / `.Label` / `.Badge` (not standalone imports)
- **Hermes v1 (opt-in):** add `useHermesV1: true` to `expo-build-properties` plugin for perf gains (not yet enabled here)

### What We Do NOT Use
- ~~Apollo Client~~ → TanStack Query + fetch (GraphQL over plain fetch)
- ~~axios~~ → native fetch API
- ~~@gorhom/bottom-sheet~~ → `formSheet` presentation in Expo Router
- ~~@expo/vector-icons~~ → `expo-image` with `source="sf:name"` for SF Symbols
- ~~StyleSheet.create~~ → inline styles
- ~~NativeWind / Tailwind~~ → inline styles (CSS not supported in RN)
- ~~Platform.OS~~ → `process.env.EXPO_OS`
- ~~useContext~~ → `React.use()`
- ~~MMKV~~ → Zustand persist + SecureStore is sufficient
- ~~GraphQL Code Generator~~ → manual typed fetch functions

---

## Environment Variables

All client-side env vars must use `EXPO_PUBLIC_` prefix (inlined at build time):

```
# .env
EXPO_PUBLIC_API_URL=https://queenskiilia-main-server.vercel.app
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=rukkiecodes
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=queenskiilia_uploads
```

TypeScript types in `types/env.d.ts`:
```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL: string;
      EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME: string;
      EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET: string;
    }
  }
}
export {};
```

---

## Folder Structure

```
queenskilla-mobile/
├── app/                          # Expo Router — all screens (kebab-case filenames)
│   ├── _layout.tsx               # Root layout — TanStack QueryClientProvider + auth gate
│   ├── (auth)/
│   │   ├── _layout.tsx           # Stack, no header
│   │   ├── index.tsx             # Splash screen (auto-redirect)
│   │   ├── onboarding.tsx
│   │   ├── account-type.tsx
│   │   ├── email.tsx
│   │   ├── otp.tsx
│   │   └── profile-setup.tsx
│   ├── (student)/                # Student tab group
│   │   ├── _layout.tsx           # NativeTabs
│   │   ├── dashboard.tsx
│   │   ├── projects/
│   │   │   ├── index.tsx         # Marketplace
│   │   │   ├── [id].tsx          # Project detail
│   │   │   └── apply.tsx         # Presented as formSheet
│   │   ├── skill-test/
│   │   │   ├── index.tsx
│   │   │   └── session.tsx
│   │   ├── portfolio.tsx
│   │   ├── leaderboard.tsx
│   │   └── earnings.tsx
│   ├── (business)/               # Business tab group
│   │   ├── _layout.tsx           # NativeTabs
│   │   ├── dashboard.tsx
│   │   ├── projects/
│   │   │   ├── index.tsx         # My projects
│   │   │   ├── create.tsx        # Presented as formSheet
│   │   │   └── [id].tsx
│   │   ├── applicants/[id].tsx
│   │   ├── talent.tsx
│   │   └── payments.tsx
│   └── (shared)/                 # Modals + shared screens (both roles push to here)
│       ├── chat/
│       │   ├── index.tsx         # Chat list
│       │   └── [id].tsx          # Chat room
│       ├── notifications.tsx
│       ├── settings.tsx
│       ├── verification.tsx
│       ├── ratings/[project-id].tsx
│       └── dispute/[project-id].tsx
├── components/
│   ├── ui/                       # Primitives (Button, Input, OTPInput, Avatar, etc.)
│   ├── forms/                    # SkillSelector, CountryPicker, FilePicker, DatePicker
│   ├── cards/                    # ProjectCard, UserCard, NotificationCard, etc.
│   └── layouts/                  # Screen wrappers
├── store/                        # Zustand stores (auth, project, notification, chat, ui)
├── hooks/                        # Custom React hooks
├── lib/                          # graphqlClient.ts, socketClient.ts, tokenStorage.ts
├── graphql/                      # Typed GQL queries/mutations as plain strings
├── utils/                        # format.ts, color.ts, validation.ts, cloudinary.ts
├── constants/                    # colors.ts, typography.ts, spacing.ts
├── types/                        # TypeScript interfaces (User, Project, Message, etc.)
│   └── env.d.ts
└── assets/
    ├── fonts/
    └── images/
```

---

## App Flow Summary

```
App Launch
    │
    ├── Root _layout.tsx: hydrate authStore (SecureStore)
    │
    ├── Has valid accessToken?
    │   ├── YES → route by accountType
    │   │         ├── student  → /(student)/dashboard
    │   │         └── business → /(business)/dashboard
    │   ├── Token expired → POST /auth/refresh
    │   │   ├── OK → store new token → route to dashboard
    │   │   └── FAIL → clear → /(auth)/onboarding
    │   └── NO token → /(auth)/onboarding
    │
    └── Auth flow:
        ├── /onboarding (3-slide carousel)
        ├── /account-type (Student | Business)
        ├── /email (POST /auth/request-otp)
        ├── /otp (POST /auth/verify-otp)
        └── /profile-setup → dashboard
```

---

## GraphQL Strategy

Backend uses Apollo Gateway (Federation) at `{EXPO_PUBLIC_API_URL}/graphql`.

On mobile we use **TanStack Query + fetch** — no Apollo Client:

```typescript
// lib/graphql-client.ts

import * as SecureStore from 'expo-secure-store';

const GQL_URL = `${process.env.EXPO_PUBLIC_API_URL}/graphql`;

export async function gqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = await SecureStore.getItemAsync('qs_access_token');
  const response = await fetch(GQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}
```

TanStack Query wraps every GQL call for caching, loading states, and refetch.

---

## Styling Rules (from expo skills)

- **Inline styles only** — no `StyleSheet.create`, no Tailwind, no CSS
- **Shadows:** use CSS `boxShadow` style prop — never `elevation` or legacy shadow props
- **Rounded corners:** `{ borderCurve: 'continuous' }` for all rounded corners
- **Safe area:** `<ScrollView contentInsetAdjustmentBehavior="automatic" />` — no SafeAreaView
- **Screen root:** first child of every route should be a ScrollView with `contentInsetAdjustmentBehavior="automatic"`
- **Dimensions:** `useWindowDimensions()` — never `Dimensions.get()`
- **Platform check:** `process.env.EXPO_OS` — never `Platform.OS`
- **Context:** `React.use(Context)` — never `useContext`
- **Images/Icons:** `expo-image` with `source="sf:icon-name"` for SF Symbols

---

## Navigation Patterns

- **Tabs:** `NativeTabs` from `expo-router/unstable-native-tabs`
- **Stack:** `Stack` from `expo-router/stack`
- **Modals:** `presentation: 'modal'` in Stack.Screen
- **Sheets:** `presentation: 'formSheet'` with `sheetAllowedDetents` + `sheetGrabberVisible`
- **Links:** `<Link href="...">` with `<Link.Preview />` for iOS conventions
- **Context menus:** `<Link.Menu>` with `<Link.MenuAction>` on long press

---

## Running the App

```bash
# Development (Expo Go — try this first)
npx expo start

# Android device/emulator
npx expo start --android

# iOS simulator
npx expo start --ios
```

> Most features work in Expo Go. Only need custom build for:
> - expo-camera (ID verification)
> - expo-notifications (push tokens)
> - react-native-webview (Paystack)
