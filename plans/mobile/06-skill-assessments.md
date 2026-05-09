# 06 — Skill Assessments

**Goal:** Students can take timed skill tests per category to earn skill-level badges (beginner → expert), which unlock higher-tier projects.

**Depends on:** 01, 02, 03. Backend skills-service.

**Backend GQL:** `skillCategories`, `myAssessments`, `activeAssessmentSession`, `startAssessment`, `submitAssessment`.

---

## User stories
- Student picks a category and level → gets a 10-question timed test (1 hour total).
- Student cannot go back once an answer is submitted.
- Score determines awarded skill level.
- Student sees their assessment history with badges earned.

---

## Batches

### Batch 6.1 — Skill test index + history (1–2h)
- [ ] `app/(student)/skill-test/index.tsx`
- [ ] List of `myAssessments` (category, level achieved, score, date)
- [ ] "Start New Assessment" → opens category picker formSheet
- [ ] Category grid + level selector (Beginner / Intermediate / Advanced / Expert)
- **Done when:** picking category + level routes to session screen with backend session created.

### Batch 6.2 — Active session screen (2–3h)
- [ ] `app/(student)/skill-test/session.tsx`
- [ ] Header: question index ("3 of 10") + ProgressBar + CountdownTimer (1 hour)
- [ ] Question text + 4 radio options
- [ ] "Next" advances; cannot go back
- [ ] On final question: "Submit" → `useSubmitAssessment` mutation
- [ ] Resume support: if `activeAssessmentSession` exists, resume from current index
- **Done when:** can complete a full assessment with timer enforcement.

### Batch 6.3 — Results + badge animation (1h)
- [ ] Results modal after submit: score, level awarded, animated badge reveal (Reanimated 4 scale + opacity)
- [ ] On dismiss: routes back to skill-test/index with new entry visible
- [ ] Invalidate `me` query (skill level may have changed → marketplace filtering updates)
- **Done when:** new badge appears on student profile and student dashboard.

---

## Acceptance criteria
- [ ] Cannot start two simultaneous sessions
- [ ] Timer expiry auto-submits with current answers
- [ ] Skill level on profile updates after passing
- [ ] Marketplace filter "My Skill Level" reflects new level
- [ ] Memory bank: no changes
