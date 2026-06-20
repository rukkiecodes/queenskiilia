# 04 — Student Marketplace

**Goal:** Students browse, search, and filter open projects in a responsive grid, view full detail, and apply with a cover note. Filters are URL-synced and shareable.

**Depends on:** 03 (shell). 02 (skill level affects eligibility).

**Backend (project-service):**
- Query `projects(status, search, skillLevel, budgetMin, budgetMax, sortBy, limit, offset)`, `project(id)`, `myApplications`
- Mutations `applyToProject(input)`, `withdrawApplication(applicationId)`

---

## User stories
- As a student, I browse open projects in a grid and load more as I scroll/paginate.
- As a student, I search and filter (skill level, budget range, sort) and can share the filtered URL.
- As a student, I open a project, read full detail, and apply with a cover note.
- As a student, I see and withdraw my applications.

---

## Batches

### Batch 4.1 — Project card + list (2h)
- [ ] `app/components/cards/project-card.vue` — `<f-card>` with title, budget+currency, deadline (`date-fns`), skill-level `<f-chip>`, required skills, status
- [ ] `app/composables/use-projects.ts` — `useInfiniteQuery` over `projects` (pageSize 20, offset paging) OR `<f-pagination>` for page-based; SSR the first page for the public `/projects` route
- [ ] `app/pages/projects/index.vue` — responsive grid (3-col desktop → 1-col mobile)
- **Done when:** real open projects render; more pages load; first page is server-rendered.

### Batch 4.2 — Search + filter rail (2h)
- [ ] `app/components/projects/filter-rail.vue` — search (`<f-input>` debounced via `useDebounce`), skill level `<f-select>`, budget min/max (`<f-slider>`/`<f-input-number>`), sort `<f-select>`
- [ ] Bind to `project-filters` Pinia store; **sync store ↔ URL query** (`useRouter().replace`) so filters are shareable and back-safe
- [ ] On mobile-web the rail is a `<f-dialog>`/drawer
- **Done when:** filters compose, debounce works, URL reflects state, refresh restores filters.

### Batch 4.3 — Project detail (1–2h)
- [ ] `app/pages/projects/[id].vue` — full description, skills, budget, deadline, business summary, apply CTA; SSR for shareable/eligible-to-index detail
- [ ] Eligibility note if student skill level < project requirement
- **Done when:** detail loads server-side by id; apply CTA visible when eligible.

### Batch 4.4 — Apply + my applications (1–2h)
- [ ] `app/components/projects/apply-dialog.vue` — `<f-dialog>` with optional cover note → `applyToProject`
- [ ] Optimistic UI; disable re-apply if already applied
- [ ] `app/pages/projects/applications.vue` — `myApplications` list with status chips + `withdrawApplication`
- **Done when:** applying round-trips and reflects in My Applications; withdraw works.

---

## Acceptance criteria
- [ ] Marketplace loads live open projects; pagination/infinite scroll works
- [ ] Search debounces; filters compose; filter state lives in the URL
- [ ] Detail page server-renders by id and is shareable
- [ ] Apply + withdraw round-trip; duplicate application is prevented
- [ ] Works at 1440 / 768 / 390 px
- [ ] Memory bank: no changes expected
