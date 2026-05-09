# 04 — Student Marketplace (Browse + Apply)

**Goal:** Student can browse open projects, filter by skills/budget/deadline, view detail, and apply with a cover note.

**Depends on:** 01, 02, 03. Backend project-service.

**Backend GQL:** `projects` (paginated), `project`, `applyToProject`, `myApplications`, `withdrawApplication`.

---

## User stories
- Student sees a scrollable list of open projects, default-sorted by latest.
- Student can filter by their skill level and search by keyword.
- Student taps a project → detail screen → "Apply" → cover note → submit.
- Student can see all their applications and withdraw any pending one.

---

## Batches

### Batch 4.1 — Project card + list (2h)
- [ ] `components/cards/project-card.tsx` — title, business name+avatar, skill chips (first 3 + "+N"), budget, deadline countdown
- [ ] `app/(student)/projects/index.tsx` — `useInfiniteQuery` with `useProjects` hook, FlatList with `contentInsetAdjustmentBehavior="automatic"`
- [ ] Pull-to-refresh, infinite scroll, EmptyState component when no results
- **Done when:** marketplace shows real backend data with smooth pagination.

### Batch 4.2 — Search + filters (2h)
- [ ] `headerSearchBarOptions` in Stack.Screen for native search bar
- [ ] Debounced search (`use-debounce` hook) → re-runs query with `search` param
- [ ] Filter chips row: All / My Skill Level / Budget Range / Deadline (opens formSheet for ranges)
- [ ] Sort dropdown: Latest / Budget high-low / Deadline soonest
- **Done when:** all filters compose correctly and update the list.

### Batch 4.3 — Project detail screen (2h)
- [ ] `app/(student)/projects/[id].tsx` — `useProject(id)` query
- [ ] Header: business avatar + name + verified badge
- [ ] Body: title, description, skills, budget, deadline countdown, "Apply" button
- [ ] If already applied: show "Application Pending" chip + "Withdraw" link
- [ ] If selected: show "View Project Workspace" → routes to active-project view (built in feature 11)
- **Done when:** detail data loads and "Apply" routes to apply screen.

### Batch 4.4 — Apply screen (formSheet) + my applications (1–2h)
- [ ] `app/(student)/projects/apply.tsx` — `presentation: 'formSheet'`, project summary card + cover note textarea + submit
- [ ] `useApplyToProject` mutation; on success invalidate `projects` and `my-applications`
- [ ] `app/(student)/applications.tsx` — list of `myApplications`, swipe-to-withdraw on pending
- **Done when:** applying creates a backend record and appears in my-applications.

---

## Acceptance criteria
- [ ] Marketplace loads real projects, paginates smoothly to 100+
- [ ] Search returns relevant results with no flicker (debounced)
- [ ] Filters compose (skill level + budget + sort all together)
- [ ] Apply flow round-trips against live backend
- [ ] Withdraw removes the application from list
- [ ] Memory bank: no changes
