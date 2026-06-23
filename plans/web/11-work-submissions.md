# 11 — Work Submissions & Review

**Goal:** The student submits deliverables on an active project; the business approves (→ release funds + auto-portfolio) or requests revision (→ back to in_progress with feedback). This closes the project lifecycle.

**Depends on:** 05 (selected student), 10 (escrow held), 09 (collaboration), 03 (shell).

**Backend (project-service):**
- Query `submission(projectId)`
- Mutations `submitWork(input)`, `reviewSubmission(projectId, approve, feedback)`

---

## User stories
- As a student, I work in an active-project workspace and submit files + notes.
- As a business, I review the submission and approve or request a revision with feedback.
- On approval, escrow releases and a portfolio item is created.
- On revision, the project returns to in_progress with the feedback shown.

---

## Batches

### Batch 11.1 — Active project workspace (1–2h)
- [ ] `app/pages/projects/[id]/workspace.vue` — status banner, deadline, embedded chat (F09), submission area; role-aware (student submits, business reviews)
- **Done when:** the workspace shows current status, deadline, and chat for both roles.

### Batch 11.2 — Submit work (student) (2h)
- [ ] `app/components/forms/file-upload.vue` — drag-drop multi-file → Cloudinary (size guard, e.g. ≤ a few MB each), progress
- [ ] `app/composables/use-submissions.ts` — `submitWork`, `reviewSubmission`, read `submission`
- [ ] `app/pages/projects/[id]/submit.vue` — files + notes → `submitWork`; project → under_review
- **Done when:** files upload with progress; submission moves the project to under_review.

### Batch 11.3 — Review (business) (1–2h)
- [ ] `app/components/projects/review-panel.vue` — file preview/download, notes; Approve / Request revision (`<f-textarea>` feedback) → `reviewSubmission`
- [ ] Approve → trigger `releaseFunds` (F10) + project completed + portfolio item (F07); Revision → back to in_progress with feedback banner
- **Done when:** approval completes the project and releases funds; revision returns it with visible feedback.

---

## Acceptance criteria
- [ ] Files upload (within size limit) and preview/download in-browser
- [ ] Submit → under_review; approve → completed + funds released + portfolio item created
- [ ] Revision → in_progress with feedback shown to the student
- [ ] Works at 1440 / 768 / 390 px
- [ ] Memory bank: no changes expected
