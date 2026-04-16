# QueenSkiilia Mobile App — Overview & Tech Stack

## App Identity
- **Name:** QueenSkiilia
- **Tagline:** From Skill to Real Experience
- **Platform:** iOS + Android (via Expo)
- **Type:** Marketplace — Skills, Projects, Escrow, Portfolio
- **Account Types:** Student | Business

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 52+ (React Native) |
| Routing | Expo Router v4 (file-based) |
| Language | TypeScript (strict) |
| GraphQL Client | Apollo Client 4 |
| State Management | Zustand |
| Token Storage | Expo SecureStore |
| Fast Local Storage | MMKV (via react-native-mmkv) |
| Animations | React Native Reanimated 3 |
| Gestures | React Native Gesture Handler |
| Image Handling | Expo Image Picker + Cloudinary upload |
| Icons | @expo/vector-icons (Ionicons) |
| Forms | React Hook Form + Zod validation |
| Notifications | Expo Notifications |
| Haptics | Expo Haptics |
| WebSocket | Socket.IO Client (real-time chat/notifications) |
| HTTP | Axios (for auth REST endpoints) |
| Code Generation | GraphQL Code Generator |

---

## Folder Structure

```
queenskiilia-mobile/
├── app/                          # Expo Router — all screens
│   ├── (auth)/                   # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Splash / onboarding redirect
│   │   ├── onboarding.tsx
│   │   ├── account-type.tsx
│   │   ├── email.tsx
│   │   └── otp.tsx
│   ├── (student)/                # Student tab group
│   │   ├── _layout.tsx           # Bottom tab navigator
│   │   ├── dashboard.tsx
│   │   ├── projects/
│   │   │   ├── index.tsx         # Marketplace
│   │   │   ├── [id].tsx          # Project detail
│   │   │   └── apply.tsx
│   │   ├── skill-test/
│   │   │   ├── index.tsx
│   │   │   └── session.tsx
│   │   ├── portfolio.tsx
│   │   ├── leaderboard.tsx
│   │   ├── earnings.tsx
│   │   └── profile.tsx
│   ├── (business)/               # Business tab group
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   ├── projects/
│   │   │   ├── index.tsx         # My projects
│   │   │   ├── create.tsx
│   │   │   ├── [id].tsx
│   │   │   └── applicants/[id].tsx
│   │   ├── talent.tsx
│   │   ├── payments.tsx
│   │   └── profile.tsx
│   ├── (shared)/                 # Screens shared between roles
│   │   ├── chat/
│   │   │   ├── index.tsx         # Conversation list
│   │   │   └── [id].tsx          # Chat room
│   │   ├── notifications.tsx
│   │   ├── settings.tsx
│   │   ├── verification.tsx
│   │   ├── ratings/[projectId].tsx
│   │   └── dispute/[projectId].tsx
│   └── _layout.tsx               # Root layout — auth gate
├── components/                   # Reusable UI
│   ├── ui/                       # Primitives
│   ├── forms/                    # Form components
│   ├── cards/                    # Card variants
│   └── layouts/                  # Screen layouts
├── store/                        # Zustand stores
├── hooks/                        # Custom React hooks
├── lib/                          # Apollo, Axios clients
├── graphql/                      # Queries, mutations, fragments
├── utils/                        # Pure utility functions
├── constants/                    # Colors, sizes, routes
├── types/                        # TypeScript interfaces
└── assets/                       # Fonts, images, icons
```

---

## App Flow Summary

```
App Launch
    │
    ├── Has valid token? ──YES──► Route by accountType
    │                              ├── student → /(student)/dashboard
    │                              └── business → /(business)/dashboard
    │
    └── NO ──► /(auth)/onboarding
                    │
                    ├── Select account type
                    ├── Enter email → POST /auth/request-otp
                    ├── Enter OTP  → POST /auth/verify-otp
                    └── Complete profile → (student|business)/dashboard
```
