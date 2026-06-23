# 01 — Authentication

**Goal:** OTP-based passwordless email login on the web. Visitor lands on marketing/login → picks role → enters email → verifies OTP → session established via HttpOnly cookies → routed to their role home.

**Depends on:** Phase 0 (Fusion UI registered, GraphQL client, auth BFF server routes, auth store, app/auth layouts, global middleware).

**Backend:** REST `/auth/request-otp`, `/auth/verify-otp`, `/auth/refresh`, `/auth/logout` — proxied through the Nuxt `server/api/auth/*` routes built in Phase 0.

---

## User stories
- As a new visitor, I choose Student or Business and sign up with just my email.
- As a returning user, I open the site and land directly in my dashboard (cookie session still valid, refreshed server-side).
- As a returning user with an expired access token, the refresh happens silently before the page renders (SSR reads the refresh cookie).

---

## Batches

### Batch 1.1 — Auth layout + onboarding pages (1–2h)
- [ ] `app/layouts/auth.vue` polish — centered card on `canvas`, brand mark, no chrome shadow
- [ ] `app/pages/index.vue` — public landing entry for the app (CTA → `/login`); keep distinct from the existing marketing `landing/` Next.js site
- [ ] `app/pages/onboarding/index.vue` — 3-panel value carousel (`<f-card>` + paginated dots), "Get started" → `/onboarding/account-type`
- **Done when:** carousel advances with keyboard + click; "Get started" routes onward.

### Batch 1.2 — Account type + email entry (1h)
- [ ] `app/pages/onboarding/account-type.vue` — two selectable `<f-card>`s (Student / Business); Action Blue selected border; "Continue" disabled until chosen; persist choice in `auth-flow` store
- [ ] `app/pages/login.vue` — `<f-input>` email with Zod validation; "Send code" calls `useRequestOtp()` (POST `server/api/auth/request-otp`)
- **Done when:** valid email + Send triggers a real OTP request and routes to `/verify`.

### Batch 1.3 — OTP verification + session (1–2h)
- [ ] `app/pages/verify.vue` — `<f-otp>` 6-digit input, 10-min countdown, resend after 60s, paste support, shake/`<f-alert>` on error
- [ ] `useVerifyOtp()` → POST `server/api/auth/verify-otp`; on success the server sets HttpOnly cookies and returns `user`; store `user` in the auth store (Pinia, memory)
- [ ] Redirect: incomplete profile → `/onboarding/profile` (Feature 02); else role home
- **Done when:** correct OTP logs in and routes correctly; cookies are HttpOnly; no token in JS storage.

### Batch 1.4 — Session bootstrap on SSR + refresh (1h)
- [ ] `app/plugins/auth-bootstrap.server.ts` — on each SSR request, if an access cookie exists, hydrate `user` (call `me` GraphQL or decode); if access is expired but refresh valid, hit the refresh route and rotate cookies before render
- [ ] `gqlFetch` 401 path retries once via the refresh route (wired in Phase 0) — confirm end-to-end
- **Done when:** reloading an authed page never flashes the login screen; an expired access token refreshes silently server-side.

### Batch 1.5 — Logout (0.5h)
- [ ] Avatar menu "Sign out" → POST `server/api/auth/logout`; clears cookies, resets auth store, disconnects socket, redirects to `/login`
- **Done when:** logout clears the session everywhere; the back button does not restore an authed view.

---

## Acceptance criteria
- [ ] No-cookie visit to an app route → `/login`
- [ ] Valid-cookie visit → role dashboard, server-rendered (no login flash)
- [ ] Expired access + valid refresh → silent server-side refresh → dashboard
- [ ] Both expired → `/login`
- [ ] OTP flow works end-to-end against the live backend
- [ ] Tokens are HttpOnly cookies only; nothing token-shaped in `localStorage`/`sessionStorage`
- [ ] Works at 1440 / 768 / 390 px
- [ ] Memory bank: confirm web auth transport is cookie-based (cross-reference `project_queenskilla_auth_refresh_transport` — mobile uses body tokens, web uses cookies)
