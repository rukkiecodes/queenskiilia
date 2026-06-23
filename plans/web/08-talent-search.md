# 08 — Talent Search

**Goal:** Businesses discover students via a searchable, filterable directory and open a student's public profile + portfolio. Public talent profiles are SSR for SEO/sharing.

**Depends on:** 03 (shell), 07 (portfolio view reused on the profile).

**Backend (user-service):**
- Query `users(accountType: student, search, skillLevel, country, minRating, limit, offset)`, `user(id)`

---

## User stories
- As a business, I search the talent pool and filter by skill level, country, and minimum rating.
- As a business, I open a student's profile and portfolio before inviting/selecting them.
- The student profile page is shareable and server-rendered.

---

## Batches

### Batch 8.1 — Talent directory (2h)
- [ ] `app/composables/use-talent-search.ts` — `users` query with filters; debounced search; offset paging
- [ ] `app/components/cards/user-card.vue` — avatar, name, skill level, rating, top skills, verified badge
- [ ] `app/pages/talent/index.vue` — grid/table toggle (`<f-table>` for dense view, card grid for visual); SSR first page
- **Done when:** the directory lists students with live data; view toggle works.

### Batch 8.2 — Filter rail (1–2h)
- [ ] `app/components/talent/filter-rail.vue` — skill level, country (`country-field`), min rating `<f-slider>`; bound to `talent-filters` store + URL sync; drawer on mobile-web
- **Done when:** filters compose and persist in the URL; refresh restores them.

### Batch 8.3 — Public student profile (1–2h)
- [ ] `app/pages/talent/[id].vue` — `user(id)` profile (bio, skills, ratings summary) + embedded public portfolio (F07); SSR + `useSeoMeta`
- [ ] Reused by the applicant table in F05 (row → this page)
- **Done when:** profile renders server-side with portfolio; reachable from applicant review.

---

## Acceptance criteria
- [ ] Search debounces; filters compose and live in the URL
- [ ] Directory paginates; card/table toggle works
- [ ] Student profile server-renders with portfolio + meta tags
- [ ] Works at 1440 / 768 / 390 px
- [ ] Memory bank: no changes expected
