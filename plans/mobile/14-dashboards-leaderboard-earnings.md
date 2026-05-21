# 14 — Dashboards (Student/Business + Leaderboard + Earnings)

**Goal:** Polished home dashboards for both roles + the leaderboard (student rankings) + the earnings screen (student transaction history).

**Depends on:** 01–13 (read-only summaries of data created by prior features).

**Backend GQL:** `me`, `projects` (filtered), `myProjects`, `myEscrows`, `users` (leaderboard query — sorted), `myEarnings` (or derived from escrows).

---

## User stories
- Student dashboard: stats row, "Complete Profile" / "Take Skill Test" banners (conditional), available projects preview, active projects, notification preview.
- Business dashboard: stats row, "Post a Project" CTA, active projects with applicant counts, talent suggestions.
- Leaderboard: top students globally, filterable by category and country, "my rank" sticky.
- Earnings: total earnings, held-in-escrow amount, transaction history.

---

## Batches

### Batch 14.1 — Student dashboard (2h) ✅
- [x] `app/(student)/dashboard/index.tsx` (folder route — `dashboard.tsx` in the plan)
- [x] Header: avatar + name + verified badge (bell is already in the tab header)
- [x] Stats row: skill level, active projects count, total earnings, avg rating
- [x] Conditional banners (profile incomplete, no skill assessment)
- [x] Section: Available projects (5 `open` projects)
- [x] Section: Active projects (max 3)
- [x] Section: Notifications preview (top 3 unread)
- [x] Nav rows to Earnings + Leaderboard
- **Done:** dashboard renders real data; sections deep-link to project/notifications/leaderboard/earnings.

### Batch 14.2 — Business dashboard (1–2h) ✅
- [x] `app/(business)/dashboard/index.tsx`
- [x] Header: company name + verified badge
- [x] Stats: posted projects, active projects, total spent (released escrows), avg rating
- [x] "Post a Project" primary CTA → create flow
- [x] Section: Active projects with pending-applicant counts (per-project `projectApplications`)
- [x] Section: Talent suggestions (top of `users` query)
- **Done:** dashboard renders real data.

### Batch 14.3 — Leaderboard (2h) ✅
- [x] `app/(student)/dashboard/leaderboard.tsx`
- [x] List of top students — `users` query is already sorted `average_rating DESC`
- [x] Filter chips: skill level (the "category" dimension the backend supports) + country (via country picker)
- [x] Top 3 rows: `sf:medal.fill` glyph — `colors.primary` / `inkMuted80` / `inkMuted48` for #1/#2/#3
- [x] "Your rank: #N" sticky bottom banner (falls back to "outside the top N")
- **Done:** ranking follows backend order; my-rank computed from list position.

### Batch 14.4 — Earnings (1–2h) ✅
- [x] `app/(student)/dashboard/earnings.tsx`
- [x] Hero: total earned — `title1`, `fonts.semiBold`, `colors.ink`
- [x] Sub-stat: held in escrow
- [x] Transaction history list (date, project title, amount, status) — derived from `myEscrows`
- [x] Currency display per transaction (each escrow's currency)
- [x] Withdrawal placeholder section
- **Done:** totals derived from `myEscrows` — hero = Σ released net amounts.

---

## Acceptance criteria
- [x] Dashboards reflect current state on every focus (`useRefreshOnFocus` — new hook)
- [x] Leaderboard rank stable and correct (position in rating-sorted list)
- [x] Earnings totals match released escrows exactly (hero = Σ released `amount − platformFee`)
- [x] Memory bank: no changes

> Not UI-tested — tsc + eslint pass, but screens were not run in a simulator this session.
