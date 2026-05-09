# 01 — Authentication

**Goal:** OTP-based passwordless email login. User opens app → onboarding → picks role → enters email → verifies OTP → lands authenticated.

**Depends on:** Phase 0 (foundation must be done — auth-store, lib/auth-api, lib/token-storage, root layout with auth gate).

**Backend:** REST endpoints `/auth/request-otp`, `/auth/verify-otp`, `/auth/refresh`, `/auth/logout` on `https://queenskilla-mainserver.vercel.app`.

---

## User stories
- As a new user, I see onboarding once, choose Student or Business, and sign up with just my email.
- As a returning user, I open the app and land directly in my dashboard (token still valid).
- As a returning user with an expired token, the refresh happens silently in the background.

---

## Batches

### Batch 1.1 — UI primitives needed for auth (1–2h)
- [ ] `components/ui/button.tsx` — variants primary/outline/ghost/danger (per DESIGN.md, primary = Action Blue, no gold variant), loading state, haptic on iOS
- [ ] `components/ui/input.tsx` — label, error, hint, optional left/right SF Symbol icons
- [ ] `components/ui/otp-input.tsx` — 6 boxes, auto-advance, paste detection, Reanimated 4 shake on error
- **Done when:** all three render in an isolated test screen with the design tokens from `constants/colors.ts`.

### Batch 1.2 — Splash + onboarding (1h)
- [ ] `app/(auth)/_layout.tsx` — Stack from `expo-router/stack`, no header
- [ ] `app/(auth)/index.tsx` — Splash, monochrome logo on `colors.canvas`, subtle 2s fade then redirect (no glow — chrome has no shadows in DESIGN.md)
- [ ] `app/(auth)/onboarding.tsx` — 3-slide horizontal carousel with paginated dots, "Get Started" + "Skip"
- **Done when:** swiping through slides advances dots; "Get Started" routes to `/account-type`.

### Batch 1.3 — Account type + email entry (1h)
- [ ] `app/(auth)/account-type.tsx` — Student card + Business card; `colors.primary` (Action Blue) border on selection; "Continue" disabled until pick
- [ ] `app/(auth)/email.tsx` — email input with Zod validation, "Send OTP" button calls `useRequestOtp` mutation
- **Done when:** entering a valid email + tapping Send OTP triggers a real request and routes to `/otp` on success.

### Batch 1.4 — OTP verification + token persistence (1–2h)
- [ ] `app/(auth)/otp.tsx` — OTPInput, 10-min countdown, resend after 60s, `useVerifyOtp` mutation
- [ ] On success: `authStore.setAuth(user, accessToken, refreshToken)` writes to SecureStore
- [ ] On error: shake animation + toast
- **Done when:** correct OTP logs in and root layout redirects to `(student)/dashboard` or `(business)/dashboard` (placeholder screens for now).

### Batch 1.5 — Token refresh + logout (1h)
- [ ] Verify `gqlFetch` triggers `authStore.refreshAccessToken()` on `UNAUTHENTICATED` and retries the request once
- [ ] Logout flow in a temp settings screen: clears SecureStore, redirects to `(auth)/onboarding`
- **Done when:** manually expiring the access token causes a silent refresh on the next GraphQL call; logout clears state and redirects.

---

## Acceptance criteria
- [ ] Cold start with no token → onboarding
- [ ] Cold start with valid token → dashboard
- [ ] Cold start with expired token + valid refresh → silent refresh → dashboard
- [ ] Cold start with both expired → onboarding
- [ ] OTP flow works end-to-end against live backend
- [ ] Memory bank: no changes needed (auth flow already documented in `mobile development plan/02-auth-flow.md`)
