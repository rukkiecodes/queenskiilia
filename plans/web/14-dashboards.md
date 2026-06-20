# 14 — Dashboards (Leaderboard & Earnings)

**Goal:** Polished, desktop-optimized role dashboards: students see stats, active projects, earnings, and a skill leaderboard; businesses see active projects, recent applicants, and escrow status. Read-only summaries over data the prior features produced.

**Depends on:** 04–12 (the data these summarize), 03 (shell).

**Backend:** aggregates existing queries — `myProjects`/`myApplications`, `myEscrows`/`transactions`, `myPortfolio`, `userRatings`, `users` (leaderboard by rating/earnings). No new schema.

---

## User stories
- As a student, my dashboard shows earnings, active projects, recent notifications, and my leaderboard rank.
- As a business, my dashboard shows active projects, recent applicants, and escrow status.
- As a student, I view a leaderboard and an earnings history with a chart.

---

## Batches

### Batch 14.1 — Dashboard primitives (1h)
- [ ] `app/components/dashboard/stat-tile.vue`, `section-header.vue`
- [ ] Responsive dashboard grid (multi-column desktop → stacked mobile)
- **Done when:** reusable tiles + section headers render on the grid.

### Batch 14.2 — Student dashboard (2h)
- [ ] `app/pages/dashboard/index.vue` (student) — stat tiles (earnings Σ released escrows, active projects, avg rating), recent projects, recent notifications
- **Done when:** real student data renders; numbers reconcile with source queries.

### Batch 14.3 — Business dashboard (1–2h)
- [ ] `app/pages/dashboard/index.vue` (business branch) — active projects, recent applicants, escrow summary, spend
- **Done when:** real business data renders.

### Batch 14.4 — Leaderboard + earnings (2h)
- [ ] `app/pages/dashboard/leaderboard.vue` — ranked students (`<f-table>`), stable ordering, current-user highlight
- [ ] `app/pages/dashboard/earnings.vue` — `<f-line-chart>` of earnings over time + transaction list; total = Σ released escrows
- **Done when:** leaderboard ranks stably; earnings chart + totals match released escrows.

---

## Acceptance criteria
- [ ] Student + business dashboards render live data correctly
- [ ] Leaderboard rank stable; current user highlighted
- [ ] Earnings total = Σ released escrows; chart renders
- [ ] Works at 1440 / 768 / 390 px (chart + table degrade gracefully)
- [ ] Memory bank: no changes expected
