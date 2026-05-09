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

### Batch 14.1 — Student dashboard (2h)
- [ ] `app/(student)/dashboard.tsx`
- [ ] Header: avatar + name + verified badge + bell
- [ ] Stats row: skill level badge, active projects count, total earnings, avg rating
- [ ] Conditional banners (profile incomplete, no skill assessment)
- [ ] Section: Available projects (5 best-match cards)
- [ ] Section: Active projects (max 3)
- [ ] Section: Notifications preview (top 3 unread)
- **Done when:** dashboard renders with real data, all sections deep-link correctly.

### Batch 14.2 — Business dashboard (1–2h)
- [ ] `app/(business)/dashboard.tsx`
- [ ] Header: company name + verified badge + bell
- [ ] Stats: posted projects, active projects, total spent, top-rated talent collaborated with
- [ ] "Post a Project" primary CTA (`colors.primary` background, `colors.onPrimary` label) → opens create flow
- [ ] Section: Active projects with applicant counts
- [ ] Section: Talent suggestions (from talent search ranked by relevance to past projects)
- **Done when:** dashboard renders with real data.

### Batch 14.3 — Leaderboard (2h)
- [ ] `app/(student)/leaderboard.tsx`
- [ ] Sortable list of top students (default by rating × volume)
- [ ] Filter chips: category, country
- [ ] Top 3 rows: rank badge only — restrained metallic-tone glyph (per DESIGN.md, no decorative gradients on chrome). Use a tiny SF Symbol medal/seal in `colors.primary` for #1, `colors.inkMuted80` for #2, `colors.inkMuted48` for #3
- [ ] "Your rank: #N" sticky banner at bottom if user not in visible top
- **Done when:** ranking matches backend, my-rank is correct.

### Batch 14.4 — Earnings (1–2h)
- [ ] `app/(student)/earnings.tsx`
- [ ] Hero: total earned — `fontSize.title1`, `fonts.semiBold`, `colors.ink` (per DESIGN.md, money is information not decoration; weight + size carry the emphasis, not a special color)
- [ ] Sub-stat: held in escrow
- [ ] Transaction history list (date, project, amount, status)
- [ ] Currency display per transaction (per project's currency)
- [ ] Withdrawal placeholder section (future feature)
- **Done when:** numbers match `myEscrows` released amounts.

---

## Acceptance criteria
- [ ] Dashboards reflect current state on every focus (use `useRefreshOnFocus`)
- [ ] Leaderboard rank stable and correct
- [ ] Earnings totals match released escrows exactly
- [ ] Memory bank: no changes
