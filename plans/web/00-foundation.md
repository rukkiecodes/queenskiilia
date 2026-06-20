# 00 — Foundation (Phase 0)

**Goal:** Stand up an empty-but-wired Nuxt 4 + Fusion UI app in `client/web/` that boots, renders a brand-skinned shell, talks to the GraphQL gateway with cookie-based auth, and hydrates server state — so Feature 01 has solid ground.

**Depends on:** the live backend at `https://queenskilla-mainserver.vercel.app`.

**Backend:** none built here — we only configure clients for the existing gateway, Socket.IO hub, Cloudinary, and Paystack.

---

## Batches

### Batch 0.1 — Scaffold Nuxt 4 (1h)
- [ ] `npx nuxi@latest init client/web` (Nuxt 4, TypeScript, `app/` dir structure)
- [ ] Add deps: `@tanstack/vue-query`, `pinia` + `@pinia/nuxt`, `socket.io-client`, `zod`, `@vueuse/core`, `date-fns`
- [ ] Add Fusion UI: `@rukkiecodes/vue @rukkiecodes/icons @rukkiecodes/tokens` (peer: `vue ^3.5`)
- [ ] `nuxt.config.ts`: register `@pinia/nuxt`; set `ssr: true`; add runtime config (`public.apiUrl`, `public.cloudinaryCloudName`, `public.cloudinaryUploadPreset`, private `internalSecret` if any BFF needs it)
- [ ] `.env` + `.env.example`: `NUXT_PUBLIC_API_URL=https://queenskilla-mainserver.vercel.app`, Cloudinary vars, `NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- **Done when:** `npm run dev` serves a blank Nuxt page with no errors; runtime config reads the API URL.

### Batch 0.2 — Register & brand-skin Fusion UI (2h)
- [ ] `app/plugins/fusionui.ts` (client+server safe): `createFusionUI({ theme: { defaultTheme }, icons: { defaultSet: 'fusion', sets: { fusion: fusionSet }, aliases: fusionAliases } })`, `nuxtApp.vueApp.use(fusionui)`; import `@rukkiecodes/vue/styles`
- [ ] `app/assets/css/brand.css` — override Fusion UI tokens to the QueenSkiilia brand:
  ```css
  :root {
    --fui-theme-primary: 0,102,204;        /* Action Blue #0066cc */
    --fui-theme-on-primary: 255,255,255;
    --fui-font-family: 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    --fui-radius-md: 12px;                  /* inputs/cards */
    --fui-letter-spacing: -0.01em;
  }
  /* dark theme overrides applied by the Fusion UI theme engine via dark.json;
     add brand-specific dark tweaks here under the engine's dark selector */
  ```
- [ ] Load **Poppins** (Nuxt `@nuxt/fonts` or `<link>` to the same weights the mobile app uses) to keep cross-client type parity
- [ ] Theme persistence: read a `qs.theme` cookie in a server plugin so SSR renders the correct light/dark theme (no flash); `useTheme()` writes the cookie on toggle
- **Done when:** a test page shows `<f-btn color="primary">` in Action Blue, Poppins type, pill radius; toggling dark mode persists across reload with no FOUC.

### Batch 0.3 — GraphQL client + Vue Query (2h)
- [ ] `app/lib/graphql-client.ts` — `gqlFetch<T>(query, variables, { signal })`:
  - POST to `runtimeConfig.public.apiUrl + '/graphql'`
  - attach `Authorization: Bearer <accessToken>` (token resolved from the auth store; on the server, from the request cookie via `useRequestHeaders`)
  - on `UNAUTHENTICATED` GraphQL error → call the refresh server route once, retry; on second failure → clear session
  - throw a typed error carrying the first GraphQL error message
- [ ] `app/plugins/vue-query.ts` — install `VueQueryPlugin` with an SSR-friendly `QueryClient`; wire `dehydrate`/`hydrate` so server-fetched queries hydrate on the client (no double fetch)
- [ ] Sensible query defaults (staleTime ~30s, retry off for 4xx)
- **Done when:** a server-rendered test query (e.g. `skillCategories`) appears in the initial HTML and hydrates without a refetch flash.

### Batch 0.4 — Auth transport (BFF) + cookies (2–3h)
- [ ] Nuxt server routes under `server/api/auth/`:
  - `request-otp.post.ts` → proxies `/auth/request-otp`
  - `verify-otp.post.ts` → proxies `/auth/verify-otp`; on success sets **HttpOnly** `qs.accessToken` + `qs.refreshToken` cookies (`secure`, `sameSite=lax`, path `/`), returns the `user` payload only
  - `refresh.post.ts` → reads refresh cookie, proxies `/auth/refresh`, rotates both cookies
  - `logout.post.ts` → proxies `/auth/logout`, clears both cookies
  - `me-token.get.ts` (optional) → server util that returns the current access token for SSR GraphQL calls
- [ ] `server/utils/auth-cookies.ts` — set/clear helpers, single source of cookie options
- [ ] Browser **never** sees raw tokens; the access token is read from the cookie server-side for SSR and forwarded to GraphQL; client-side GraphQL calls go through the same-origin proxy OR attach the access token fetched once per session into memory (Pinia, non-persisted)
- **Done when:** posting a valid OTP sets HttpOnly cookies; refreshing the page keeps the session (cookie-driven), and DevTools shows no token in JS-readable storage.

### Batch 0.5 — Pinia stores skeleton (1h)
- [ ] `app/stores/auth.ts` — `user`, `isAuthenticated`, `accessToken` (memory only), actions `hydrateFromServer()`, `setUser()`, `refresh()`, `logout()`
- [ ] `app/stores/ui.ts` — toast/alert queue (bridge to `$fui.notify`), global loading
- [ ] `app/stores/chat.ts` — in-flight messages keyed by `chatId` (optimistic send)
- [ ] Filters → **URL-backed composables** `app/composables/use-project-filters.ts` + `use-talent-filters.ts` (search/skillLevel/budget/sort) — NOT Pinia stores. Per the `vue-pinia-best-practices` skill, ephemeral filter/search/sort state belongs in the URL query so it is shareable, bookmarkable, refresh-safe, and back-button-correct. They expose v-model-friendly writable computed refs + a `queryArgs` for the data layer.
- [ ] `app/stores/notifications.ts` — unread count
- [ ] `app/stores/auth-flow.ts` — transient email + accountType during signup
- **Done when:** stores are typed, importable, and SSR-safe (no `window` at setup).

### Batch 0.6 — Socket.IO composable (1h)
- [ ] `app/composables/use-socket.ts` (client-only): lazily connect `io(apiUrl, { auth: { token } })` after auth; expose `joinChat/leaveChat/joinProject/leaveProject`, `on(event, cb)`, typing relay; auto-reconnect; disconnect on logout
- [ ] Guard all usage behind `<ClientOnly>` / `import.meta.client`
- **Done when:** after login the socket connects (handshake authorised) and logs `notification:new`/`message:new` events; reconnects after a forced disconnect.

### Batch 0.7 — App-shell skeleton + middleware (2h)
- [ ] `app/layouts/app.vue` — responsive shell: `<f-sidebar>` (collapses to a drawer < 768px) + `<f-navbar>` (logo, notification bell, avatar menu); main content slot; respects safe spacing tokens
- [ ] `app/layouts/auth.vue` — centered, chrome-light layout for onboarding/login
- [ ] `app/layouts/public.vue` — for SSR public pages (portfolio/talent/projects) with marketing-grade header/footer
- [ ] `app/middleware/auth.global.ts` — redirect unauthenticated users off app routes to `/login`; redirect incomplete profiles to `/onboarding/profile`; route authed users into the role-appropriate home
- [ ] `app/middleware/role.ts` — guard student-only vs business-only routes
- **Done when:** an unauthenticated visit to an app route redirects to login; the shell renders sidebar+topbar at desktop and a drawer on mobile-web.

---

## Acceptance criteria
- [ ] `client/web/` boots under Nuxt 4 with SSR, no console errors or hydration warnings
- [ ] Fusion UI is registered; `<f-btn color="primary">` renders in Action Blue + Poppins + pill radius; dark mode persists via cookie with no FOUC
- [ ] `gqlFetch` runs server-side and client-side; a sample query hydrates without refetch
- [ ] OTP login (smoke test) sets HttpOnly cookies; no tokens in `localStorage`/JS
- [ ] Socket connects post-auth and receives a test event
- [ ] Responsive shell + auth/role middleware work at 1440 / 768 / 390 px
- [ ] Memory bank: add a `project_queenskilla_web_stack` note (Nuxt 4 + Fusion UI, cookie auth BFF, Vue Query + Pinia, shared GraphQL ops with mobile)
