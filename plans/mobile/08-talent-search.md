# 08 — Talent Search (Business)

**Goal:** Business can search and filter the student talent pool to discover candidates outside of project applications.

**Depends on:** 01, 02, 03, 07 (portfolio view is the destination of a tap on a talent card).

**Backend GQL:** `users` (filtered query), `studentPortfolio`.

---

## User stories
- Business types a name or skill, sees ranked student matches.
- Business filters by skill level, category, country, minimum rating.
- Business taps a student → views their public portfolio.

---

## Batches

### Batch 8.1 — Talent list + search (2h)
- [ ] `components/cards/user-card.tsx` — avatar, name, top skills, level badge, rating, verified badge
- [ ] `app/(business)/talent.tsx` — search bar via `headerSearchBarOptions`, debounced search query
- [ ] Infinite-paginated FlatList of student UserCards
- **Done when:** typing returns relevant results from backend.

### Batch 8.2 — Filters formSheet (1–2h)
- [ ] Filter button in header opens formSheet
- [ ] Filters: skill level, category, country, minimum rating (slider)
- [ ] Apply button merges filters into query and refetches
- [ ] Clear All resets to defaults
- **Done when:** every filter field correctly narrows results.

### Batch 8.3 — Wire student profile view (30min)
- [ ] Tap UserCard → push the public portfolio screen built in feature 7
- **Done when:** tap routes to portfolio with correct studentId.

---

## Acceptance criteria
- [ ] Search debounces (no flood of requests)
- [ ] Filters compose correctly
- [ ] Tapping a card opens portfolio
- [ ] Memory bank: no changes
