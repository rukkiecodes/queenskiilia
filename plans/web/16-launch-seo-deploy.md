# 16 — Launch, SEO & Deploy

**Goal:** Ship the web app to production: SSR/SEO polish on public pages, meta/OG tags, sitemap/robots, error/loading states, a performance budget, accessibility pass, and Vercel deployment alongside the existing services.

**Depends on:** all prior features (this hardens and ships them).

**Backend:** none new — production CORS must allow the web origin (coordinate with main-server `CORS_ORIGINS`).

---

## User stories
- As a visitor, public pages (talent, portfolio, open projects) load fast, server-rendered, with correct social previews.
- As a user, errors and slow loads show graceful states, not blank screens.
- As the team, the app deploys to Vercel on push and meets a Lighthouse budget.

---

## Batches

### Batch 16.1 — SEO + meta (2h)
- [ ] `useSeoMeta`/`useHead` on public routes (`/projects`, `/talent/[id]`, `/u/[studentId]`): title, description, canonical, OG/Twitter image
- [ ] `@nuxtjs/sitemap` + `robots.txt`; mark auth-only routes `noindex`
- [ ] Structured data (JSON-LD) for talent/portfolio profiles (optional)
- **Done when:** public pages have valid OG/meta; sitemap + robots serve correctly.

### Batch 16.2 — Error, loading & empty states (1–2h)
- [ ] `app/error.vue` (Nuxt error page), per-route loading skeletons (`<f-progress>`/skeleton cards), `app/components/empty-state.vue`
- [ ] Global GraphQL/network error toast via `ui` store + `$fui.notify`; offline banner (`useNetwork`)
- **Done when:** failure and loading paths show branded states everywhere.

### Batch 16.3 — Accessibility + responsive QA (1–2h)
- [ ] Keyboard nav, focus traps in dialogs (Fusion UI provides; verify), labelled inputs, color-contrast check (Action Blue on white/dark)
- [ ] Full responsive QA pass at 1440 / 1024 / 768 / 390 px across every feature
- **Done when:** axe shows no critical issues; all flows usable by keyboard at every breakpoint.

### Batch 16.4 — Performance budget (1–2h)
- [ ] Code-split heavy routes (chat, charts, shaders); lazy-load Fusion UI GPU layer; image optimization (`<nuxt-img>`/Cloudinary transforms)
- [ ] Lighthouse budget: Performance ≥ 90 on public pages, no CLS from font/theme load (preload Poppins, cookie-driven theme set before paint)
- **Done when:** public pages meet the Lighthouse budget; no token/theme FOUC.

### Batch 16.5 — Deploy to Vercel (1–2h)
- [ ] Vercel project for `client/web/` (Nuxt preset); set runtime env (`NUXT_PUBLIC_API_URL`, Cloudinary, Paystack public key)
- [ ] Add the production web origin to main-server `CORS_ORIGINS` and Socket.IO allowed origins
- [ ] Verify cookies work cross-environment (`secure`, `sameSite`, domain); smoke-test full lifecycle (signup → project → escrow → submit → approve → rate) on the deployed URL
- **Done when:** the app is live on a Vercel URL (e.g. `queenskilla-web.vercel.app`), auth cookies + sockets + Paystack all work in production.

---

## Acceptance criteria
- [ ] Public pages server-render with valid SEO/OG; sitemap + robots present; auth routes noindex
- [ ] Branded error/loading/empty/offline states everywhere
- [ ] axe: no critical a11y issues; full keyboard support; responsive at all target widths
- [ ] Lighthouse Performance ≥ 90 on public pages; no theme/font FOUC
- [ ] Deployed to Vercel; CORS + Socket.IO origins updated; full lifecycle smoke test passes in production
- [ ] Memory bank: add deployed web URL to `reference_deployed_services`; record final web stack decisions
