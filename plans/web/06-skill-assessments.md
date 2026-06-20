# 06 — Skill Assessments

**Goal:** Students take timed multiple-choice assessments per skill category. Passing raises their skill level, which gates access to higher-tier projects. One active session at a time; the timer is enforced.

**Depends on:** 03 (shell), 02 (skill level on profile).

**Backend (skills-service):**
- Query `skillCategories`, `myAssessments`, `assessment(id)`, `activeAssessmentSession`
- Mutations `startAssessment(category, level)`, `submitAssessment(sessionId, answers)`

---

## User stories
- As a student, I pick a category + level and start a timed assessment.
- As a student, I answer MCQs; the session expires when time runs out.
- As a student, I see my score, a result badge, and my updated skill level.
- I cannot run two sessions at once.

---

## Batches

### Batch 6.1 — Assessment index (1–2h)
- [ ] `app/composables/use-assessments.ts` — categories, my past assessments, active session check
- [ ] `app/pages/skill-tests/index.vue` — category cards (`skillCategories`, parent/child grouping), past results, "Resume" if `activeAssessmentSession` exists
- **Done when:** categories + past results render; an active session surfaces a Resume CTA.

### Batch 6.2 — Session screen (2h)
- [ ] `app/pages/skill-tests/session.vue` (client-only) — question stepper, option selection, `<f-progress-linear>` for progress, countdown bound to `expiresAt`
- [ ] `app/composables/use-countdown.ts`; **guard against simultaneous sessions** (block start if `activeAssessmentSession`)
- [ ] Visibility/tab-blur handling: keep the timer authoritative from `expiresAt` (don't trust setInterval alone); warn on navigate-away
- [ ] `submitAssessment` on finish or expiry
- **Done when:** the timer enforces expiry server-truthfully; submit records answers.

### Batch 6.3 — Results + badge (1h)
- [ ] `app/pages/skill-tests/results/[id].vue` — score, skill-level badge (subtle reveal animation, reduced-motion safe), retake CTA
- [ ] Confirm the new skill level reflects in profile + unlocks higher-tier marketplace filters (F04)
- **Done when:** results show the score + badge; profile skill level updates; marketplace eligibility reflects it.

---

## Acceptance criteria
- [ ] Cannot start two sessions simultaneously
- [ ] Timer enforces expiry even across tab blur / reload (driven by `expiresAt`)
- [ ] Score + badge render; skill level updates on profile
- [ ] Higher-tier projects become eligible after a passing level
- [ ] Works at 1440 / 768 / 390 px
- [ ] Memory bank: no changes expected
