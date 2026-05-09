# 05 — Business Projects (Create, Manage, Review Applicants)

**Goal:** Business can post new projects, manage their open/in-progress/completed projects, and review + select applicants.

**Depends on:** 01, 02, 03, 04 (student applications must exist for business to review). Backend project-service.

**Backend GQL:** `createProject`, `myProjects`, `projectApplications`, `selectStudent`, `cancelProject`.

---

## User stories
- Business taps "Post a Project" → fills wizard → publishes.
- Business sees their projects organized by tab: All / Open / In Progress / Completed.
- Business opens a project → sees applicants → reviews each profile → selects one (triggers escrow prompt — handled in feature 10).

---

## Batches

### Batch 5.1 — SkillSelector + form helpers (2h)
- [ ] `components/forms/skill-selector.tsx` — searchable formSheet, multi-select with removable Tag chips
- [ ] `components/forms/currency-picker.tsx` — segmented control: USD/GBP/EUR/NGN
- [ ] `components/forms/date-picker.tsx` — wraps `@react-native-community/datetimepicker`, min=tomorrow
- **Done when:** all three usable in a test form.

### Batch 5.2 — Create project flow (2–3h)
- [ ] `app/(business)/projects/create.tsx` — `presentation: 'formSheet'`, multi-step wizard or single scrollable form
- [ ] Fields: title, description, skills, skill level, budget+currency, deadline
- [ ] Zod validation, Preview screen → Confirm → `useCreateProject` mutation
- [ ] On success: invalidate `my-projects`, navigate to the new project's detail
- **Done when:** new project appears in marketplace and in business's My Projects.

### Batch 5.3 — My Projects list (1–2h)
- [ ] `app/(business)/projects/index.tsx` — segmented filter tabs (All / Open / In Progress / Completed)
- [ ] Business-variant ProjectCard showing applicant count
- [ ] Swipe-to-cancel on Open projects → `useCancelProject` confirm sheet
- **Done when:** filtering works, swipe gesture cancels with confirmation.

### Batch 5.4 — Applicants review (2h)
- [ ] `app/(business)/applicants/[id].tsx` — list of `projectApplications`
- [ ] Each row: avatar, name, skill level badge, rating, cover note preview
- [ ] Tap row → push student profile (read-only view of their portfolio)
- [ ] "Select" button → confirm sheet → `useSelectStudent` mutation
- [ ] On select: stub-out escrow prompt (real flow comes in feature 10)
- **Done when:** selecting a student updates project status to `pending_payment` (or current backend state).

---

## Acceptance criteria
- [ ] Business can publish a project that students see in marketplace
- [ ] Validation prevents bad data (empty title, past deadline, etc.)
- [ ] Cancel flow is reversible up until selection
- [ ] Applicant profiles open from review screen
- [ ] Selecting a student blocks further applications
- [ ] Memory bank: no changes
