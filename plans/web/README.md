# QueenSkiilia Web — Feature Build Plan

Project: `client/web/` · Stack: **Nuxt 4 + Vue 3** (Composition API / `<script setup>`, TypeScript) · **Fusion UI** design system · `@tanstack/vue-query` + Pinia · OTP auth (HttpOnly-cookie refresh) · Socket.IO real-time · **Responsive** (desktop-first, collapses to mobile-web).

This folder breaks the web app into **16 features**, ordered by dependency — a deliberate mirror of `plans/mobile/` so the two clients stay conceptually in lockstep while consuming the **same federated GraphQL backend**. Each feature file lists its **batches** — small, shippable units (~1–3 hours of work each). A batch closes when its acceptance criteria pass in the browser against the live Vercel backend.

> **Why Vue, not React:** Fusion UI is a **Vue 3-only** design system (`@rukkiecodes/vue`, components prefixed `F*`, e.g. `<f-btn>`). The mobile app is React Native; the web app is Vue. They share **zero UI code** but **100% of the backend** (GraphQL gateway, Socket.IO, Supabase, Paystack, Cloudinary). Treat the GraphQL operations and the data model as the contract between them.

> **Visual source of truth:** Fusion UI tokens (`@rukkiecodes/tokens`) skinned with the QueenSkiilia brand — see [`00-foundation.md`](00-foundation.md) §Design tokens. Where Fusion UI's defaults and the mobile `DESIGN.md` (Apple language, Action Blue `#0066cc`) disagree, **we re-skin Fusion UI to match the brand** (Action Blue primary, Poppins type, pill CTAs) rather than fork the component library.

---

## What we're building against (backend recap)

The backend already exists and is deployed. The web app is a **new client**, not new services.

| Concern | Endpoint / mechanism |
|---|---|
| GraphQL gateway | `POST https://queenskilla-mainserver.vercel.app/graphql` (Apollo Federation over 11 subgraphs) |
| Auth (REST) | `POST /auth/request-otp`, `/auth/verify-otp`, `/auth/refresh`, `/auth/logout` |
| Auth tokens | Access JWT (7d) in `Authorization: Bearer`; refresh JWT (30d). **Web uses the HttpOnly cookie transport** the backend already supports at the `/auth` path. |
| Real-time | Socket.IO at the main-server origin; JWT in handshake; rooms `user:{id}`, `project:{id}`, `chat:{id}`; events `notification:new`, `message:new`, `chat:typing`, `project:update` |
| Images / files | Cloudinary unsigned upload (browser → Cloudinary) + `uploadAvatar(base64,mimeType)` mutation |
| Payments | Paystack — `initializePayment` returns `authorizationUrl` (redirect/popup), `verifyPayment(reference)`, escrow mutations on payment-service |
| DB | Supabase Postgres (clients never touch it directly; everything goes through the gateway) |

Full subgraph schemas are catalogued in [`plans/02-microservices.md`](../02-microservices.md) and the per-feature **Backend** sections below.

---

## Phase 0 — Foundation (prerequisite, not a feature)

Must be complete before Feature 01 starts. Fully specified in **[`00-foundation.md`](00-foundation.md)**. In brief:

- Scaffold Nuxt 4 + Vue 3 + TS in `client/web/`
- Install & register Fusion UI (`@rukkiecodes/vue`, `@rukkiecodes/icons`, `@rukkiecodes/tokens`) as a Nuxt plugin
- Brand re-skin: override Fusion UI tokens (Action Blue primary, Poppins font, pill radius) + light/dark themes
- GraphQL client (`gqlFetch`) + `@tanstack/vue-query` with SSR hydration
- Auth transport: Nuxt server routes (BFF) that proxy `/auth/*` and store tokens in **HttpOnly cookies**; access token attached to every GraphQL call server- and client-side
- Pinia stores skeleton (auth, ui, chat, filters, notifications)
- Socket.IO client composable (client-only)
- Responsive app-shell skeleton (sidebar + topbar) + role-based middleware
- Env config + deploy target (Vercel)

---

## Feature Order (build sequentially — later features depend on earlier ones)

| # | Feature | Why this order |
|---|---|---|
| 01 | [Authentication](01-authentication.md) | Nothing else works without a session |
| 02 | [Profile & verification](02-profile-and-verification.md) | Required to enter the app shell |
| 03 | [App shell & navigation](03-app-shell-navigation.md) | Responsive sidebar/topbar + role routing unlock all screens |
| 04 | [Student marketplace](04-student-marketplace.md) | Core student loop entry point |
| 05 | [Business projects](05-business-projects.md) | Core business loop — students apply to these |
| 06 | [Skill assessments](06-skill-assessments.md) | Gates student access to higher-tier projects |
| 07 | [Portfolio](07-portfolio.md) | Output of completed projects; **public SSR pages** |
| 08 | [Talent search](08-talent-search.md) | Business-side discovery of students |
| 09 | [Chat (real-time)](09-chat-realtime.md) | Required for active project collaboration |
| 10 | [Payments & escrow](10-payments-escrow.md) | Required before work can begin |
| 11 | [Work submissions & review](11-work-submissions.md) | Closes the project lifecycle |
| 12 | [Ratings, disputes & reports](12-ratings-disputes-reports.md) | Post-completion + moderation flows |
| 13 | [Notifications](13-notifications.md) | Cross-cutting — best added once core flows exist |
| 14 | [Dashboards (leaderboard, earnings)](14-dashboards.md) | Read-only summaries of prior data |
| 15 | [Settings & account](15-settings-and-account.md) | Polish + Delete Account compliance |
| 16 | [Launch, SEO & deploy](16-launch-seo-deploy.md) | SSR/SEO, Vercel deploy, compliance, perf budget |

---

## Conventions for every feature

### Framework
- **Nuxt 4**, Vue 3 **Composition API with `<script setup>` only** (Fusion UI does not support Options API). TypeScript everywhere.
- **Pages** live in `app/pages/` (file-based routing). **Layouts** in `app/layouts/`. **Route middleware** for auth/role gates in `app/middleware/`.
- **SSR by default.** Mark client-only islands (`<ClientOnly>`) for socket-driven UI (chat, live badges) and anything touching `window`. Fusion UI is SSR-safe at import time.
- **Public, shareable pages render server-side for SEO:** talent profiles (`/talent/[id]`), portfolios (`/portfolio/[studentId]`), open project listings (`/projects`). Authenticated app pages can be client-rendered.

### Visual (Fusion UI, brand-skinned)
- **Components:** use `F*` components (`<f-btn>`, `<f-input>`, `<f-card>`, `<f-dialog>`, `<f-table>`, `<f-sidebar>`, `<f-navbar>`, `<f-tabs>`, `<f-avatar>`, `<f-chip>`, `<f-badge>`, `<f-alert>`, `<f-select>`, `<f-otp>`, `<f-upload>`, `<f-progress>`, `<f-line-chart>` …). Don't hand-roll a button/input that Fusion UI already ships.
- **Interactive color:** brand **Action Blue `#0066cc`** mapped onto `--fui-theme-primary`. It is the only interactive color — CTAs, active nav, focus rings, links. No gold, no secondary accents (carries the mobile rule forward).
- **Type:** Poppins, mapped onto `--fui-font-family` (mobile parity). Use Fusion UI size/weight tokens; never hard-code `px`/`font-family` in component styles.
- **Spacing / radius:** Fusion UI tokens (`--fui-spacer`, `--fui-radius-*`). CTAs are **pill** (`--fui-radius-pill`). Soft Vuesax elevation only on cards/overlays; chrome stays flat.
- **Dark mode:** ship both themes from day one via the Fusion UI theme engine (`useTheme()`); persist choice in a cookie so SSR renders the right theme.
- **Effects:** Fusion UI's GPU layer (`<f-glass>`, shaders) is **optional progressive enhancement** — use sparingly for hero/marketing surfaces, never required for function, always behind `prefers-reduced-motion`.

### Data
- **GraphQL via `gqlFetch`** (native fetch wrapper, no Apollo — mirrors mobile's deliberate choice and keeps SSR simple).
- **Server state:** `@tanstack/vue-query` (`useQuery`/`useMutation`/`useInfiniteQuery`) with SSR hydration. The **GraphQL operation strings are shared verbatim with mobile** wherever the shape matches — copy them, don't re-derive.
- **Client state:** Pinia stores (the Vue equivalent of the mobile Zustand stores — same names, same responsibilities).
- **Auth:** access/refresh tokens live in **HttpOnly cookies** managed by Nuxt server routes; never in `localStorage`. The browser never sees the refresh token.

### Code structure
- **Filenames:** kebab-case (`auth-store.ts`, `project-card.vue`).
- **Components:** `app/components/<domain>/<name>.vue`, grouped by domain (`cards/`, `chat/`, `forms/`, `dashboard/`) — mirror the mobile `components/` layout.
- **Composables:** `app/composables/use-*.ts` (the Vue analogue of mobile `hooks/`). Same names where behaviour matches (`use-projects`, `use-me`, `use-chat-room`, …).
- **API clients:** `app/lib/*-api.ts` — the GraphQL operation modules, ported 1:1 from `client/mobile/lib/*-api.ts`.
- **Skill invocation:** before scaffolding web code, invoke **`vue-best-practices`** and **`nuxt-ui`/`frontend-design`** skills; for Fusion UI specifics, read its docs (`apps/docs/`) — every component page exports `.md`/`.json` for reference.

### Definition of Done per batch
- Code merged
- Verified in the browser (Chrome + one of Safari/Firefox) against the live Vercel backend
- Responsive: usable at 1440px, 768px, and 390px widths
- No SSR hydration warnings in console; no unhandled promise rejections
- All UI uses Fusion UI components + brand tokens (no raw hex, no raw px, no ad-hoc buttons)
- Basic a11y: keyboard-reachable, visible focus, labelled inputs
- Memory bank updated if a durable decision changed

---

## Parity map: mobile feature → web feature

| Mobile (`plans/mobile/`) | Web (`plans/web/`) | Key web-specific change |
|---|---|---|
| 01 Authentication | 01 Authentication | HttpOnly-cookie refresh via Nuxt BFF (not SecureStore) |
| 02 Profile & verification | 02 Profile & verification | HTML file inputs + webcam (getUserMedia) for face/ID capture |
| 03 Navigation shells (NativeTabs) | 03 App shell & navigation | Responsive `<f-sidebar>` + `<f-navbar>`, drawer on mobile-web |
| 04 Student marketplace | 04 Student marketplace | Multi-column grid + filter rail; URL-synced filters |
| 05 Business projects | 05 Business projects | Wider create form; applicant table |
| 06 Skill assessments | 06 Skill assessments | Browser timer; tab-blur/visibility guards |
| 07 Portfolio | 07 Portfolio | **Public SSR pages** for SEO + share links |
| 08 Talent search | 08 Talent search | Table/grid toggle; filter rail |
| 09 Chat (real-time) | 09 Chat (real-time) | Browser WebSocket; reconnect on focus/visibility |
| 10 Payments & escrow | 10 Payments & escrow | Paystack redirect/popup + `verifyPayment` on return URL |
| 11 Work submissions | 11 Work submissions | Drag-drop upload; in-browser file preview |
| 12 Ratings & disputes | 12 Ratings, disputes & reports | Dialog-based forms |
| 13 Notifications & push | 13 Notifications | Socket-driven center + optional Web Push (Service Worker) |
| 14 Dashboards/leaderboard/earnings | 14 Dashboards | Desktop multi-column + `<f-line-chart>` + `<f-table>` |
| 15 Settings & account | 15 Settings & account | Delete-account confirmation flow |
| 16 Launch & compliance | 16 Launch, SEO & deploy | Nuxt SSR, meta/OG tags, Vercel, Lighthouse budget |
