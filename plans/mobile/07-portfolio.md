# 07 — Portfolio

**Goal:** Each completed project auto-generates a portfolio entry. Students can toggle items public/private and share their portfolio link.

**Depends on:** 01, 02, 03. Backend portfolio-service. (Items are populated by completed projects — feature 11.)

**Backend GQL:** `myPortfolio`, `studentPortfolio`, `updatePortfolioItemVisibility`.

---

## User stories
- Student sees grid/list of all completed projects with client rating shown.
- Student can hide an item from public view.
- Anyone can view a student's public portfolio (deep link).

---

## Batches

### Batch 7.1 — Portfolio item card + grid view (1–2h)
- [ ] `components/cards/portfolio-item-card.tsx` — project title, business name, skills, rating, completion date, public/private toggle
- [ ] `app/(student)/portfolio.tsx` — grid/list view toggle, FlatList of cards
- [ ] EmptyState when no items: "Complete your first project to start your portfolio"
- **Done when:** real completed projects render correctly.

### Batch 7.2 — Item detail + visibility toggle (1h)
- [ ] Tap card → push `app/(shared)/portfolio/[id].tsx` with full description, file URLs, client review
- [ ] Public/private toggle calls `useUpdatePortfolioItemVisibility`
- [ ] Optimistic update (toggle UI before mutation completes)
- **Done when:** toggle persists across cold start.

### Batch 7.3 — Public portfolio view + share (1h)
- [ ] `app/(shared)/portfolio/student/[studentId].tsx` — read-only public view via `studentPortfolio` query (filters to `isPublic`)
- [ ] Share button → `expo-sharing` to copy/share deep link `queenskillamobile://portfolio/student/<id>`
- [ ] Used by businesses tapping "View Portfolio" from talent search and applicant review
- **Done when:** share link opens the public view in a fresh app install (test via cold link).

---

## Acceptance criteria
- [ ] Public/private state mirrors backend
- [ ] Hidden items don't show in `studentPortfolio` query (verify in business view)
- [ ] Share deep link works from cold start
- [ ] Memory bank: no changes
