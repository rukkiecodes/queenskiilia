# 03 — App Shell & Navigation

**Goal:** A responsive, role-aware application shell that replaces the mobile NativeTabs: a left `<f-sidebar>` + top `<f-navbar>` on desktop that collapse to a drawer + bottom/condensed nav on mobile-web. Each role sees its own primary destinations.

**Depends on:** 01 (auth), 02 (profile gate). Phase 0 app layout skeleton + role middleware.

**Backend:** none new — consumes `me`, `unreadCount` for the bell.

---

## Navigation model
- **Student primary nav:** Dashboard · Projects · Skill Tests · Portfolio · Chat
- **Business primary nav:** Dashboard · Projects · Talent · Payments · Chat
- **Shared (top-right / overflow):** Notifications (bell), Profile, Settings, Sign out

---

## User stories
- As a student, I see student destinations and can deep-link to any of them.
- As a business, I see business destinations.
- On a phone-width browser, navigation collapses into a drawer; the layout stays usable.
- The active destination, unread badges, and my avatar are always visible.

---

## Batches

### Batch 3.1 — Sidebar + navbar (desktop) (2h)
- [ ] `app/components/navigation/app-sidebar.vue` — `<f-sidebar>` + `<f-sidebar-item icon label active>`; items computed from `me.accountType`
- [ ] `app/components/navigation/app-navbar.vue` — `<f-navbar>` with logo, search slot, notification bell, avatar `<f-menu>`
- [ ] Wire into `app/layouts/app.vue`; active state from current route
- **Done when:** both roles render correct destinations; active item highlights in Action Blue.

### Batch 3.2 — Responsive collapse (2h)
- [ ] Below 768px: sidebar becomes a toggleable drawer (`<f-overlay>`/off-canvas); navbar shows a hamburger
- [ ] Optional condensed bottom nav for primary destinations on mobile-web (mirrors mobile tabs)
- [ ] Use `@vueuse/core` `useBreakpoints`
- **Done when:** at 390px the drawer opens/closes and content is not clipped; at 1440px the persistent sidebar shows.

### Batch 3.3 — Notification bell + avatar menu (1h)
- [ ] `app/components/navigation/notification-bell.vue` — `<f-badge>` unread count from `notifications` store (live via socket later in F13); links to `/notifications`
- [ ] Avatar `<f-menu>`: Profile, Settings, theme toggle, Sign out
- **Done when:** bell shows a count and routes; menu actions work; theme toggle persists.

### Batch 3.4 — Route scaffolding for all destinations (1h)
- [ ] Create placeholder pages for every primary destination per role so links resolve (`/dashboard`, `/projects`, `/skill-tests`, `/portfolio`, `/chat`, `/talent`, `/payments`, `/notifications`, `/settings`)
- [ ] `app/middleware/role.ts` applied so students can't open `/talent`/`/payments` and businesses can't open `/skill-tests`/`/portfolio` (own)
- **Done when:** every nav link resolves to a (placeholder) page; cross-role routes are guarded.

---

## Acceptance criteria
- [ ] Correct destinations per role; deep links work and survive refresh (SSR)
- [ ] Responsive: persistent sidebar ≥768px, drawer <768px
- [ ] Active destination, unread bell, avatar menu always visible
- [ ] Role middleware blocks the wrong role's routes
- [ ] Works at 1440 / 768 / 390 px
- [ ] Memory bank: no changes expected
