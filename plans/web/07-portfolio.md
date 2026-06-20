# 07 — Portfolio

**Goal:** Each completed project auto-generates a portfolio item. Students manage visibility (public/private). Public portfolios are **server-rendered, SEO-indexed, shareable pages** — a key web-only advantage over the mobile app.

**Depends on:** 03 (shell), 11 (submissions/completion produce items) — but the views can be built against existing data first.

**Backend (portfolio-service):**
- Query `myPortfolio`, `studentPortfolio(studentId)`, `portfolioItem(id)`
- Mutation `updatePortfolioItemVisibility(id, isPublic)`

---

## User stories
- As a student, I see my portfolio of completed projects with client ratings/reviews.
- As a student, I toggle items public/private.
- As anyone (no login), I can open a student's public portfolio via a shareable link that renders server-side.

---

## Batches

### Batch 7.1 — Portfolio grid (mine) (1–2h)
- [ ] `app/composables/use-portfolio.ts` — `myPortfolio`, `studentPortfolio`, `portfolioItem`, visibility mutation
- [ ] `app/components/cards/portfolio-item-card.vue` — `<f-card>` with project title, business name, skills, media thumbnail, client rating `<f-rating>`/stars
- [ ] `app/pages/portfolio/index.vue` — responsive grid + per-item public/private `<f-switch>`
- **Done when:** completed-project items render; visibility toggle persists.

### Batch 7.2 — Item detail (1h)
- [ ] `app/pages/portfolio/[itemId].vue` — full showcase: description, file gallery, client rating + review
- **Done when:** item detail renders media + review.

### Batch 7.3 — Public SSR portfolio (1–2h)
- [ ] `app/pages/u/[studentId].vue` (public layout) — server-rendered `studentPortfolio` filtered to public items only; `useSeoMeta` (title, description, OG image from first media)
- [ ] Hidden items are omitted from the public query/render
- [ ] Share button (copy link / Web Share API where available)
- **Done when:** an unauthenticated browser loads the public portfolio with correct OG tags; private items never appear in HTML source.

---

## Acceptance criteria
- [ ] Public/private state mirrors backend; private items absent from public SSR HTML
- [ ] Public portfolio page server-renders with OG/meta tags and is shareable
- [ ] Item detail shows media + client review
- [ ] Works at 1440 / 768 / 390 px
- [ ] Memory bank: no changes expected
