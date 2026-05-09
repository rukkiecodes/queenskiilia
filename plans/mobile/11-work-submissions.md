# 11 — Work Submissions & Review

**Goal:** Once funded, the student submits work files. Business reviews and either approves (releases funds + creates portfolio item) or requests revision.

**Depends on:** 01, 02, 03, 05, 09 (chat available for back-and-forth), 10 (must be funded).

**Backend GQL:** `submitWork`, `reviewSubmission`.

---

## User stories
- Student sees "Submit Work" CTA on the active project screen once it's funded.
- Student uploads files + notes → submission status = pending.
- Business sees submission → can approve (releases funds, ends project) or request revision (back to in_progress).
- All submission events also post a system message to the project chat.

---

## Batches

### Batch 11.1 — Active project workspace (student view) (2h)
- [ ] `app/(student)/projects/active/[id].tsx` — pushed from project detail when student is selected and project is in_progress
- [ ] Sections: Project brief recap, Submission status, "Submit Work" button, Chat shortcut
- [ ] Deadline countdown — turns red below 24h
- **Done when:** workspace renders only for selected student on funded project.

### Batch 11.2 — Submit work form (1–2h)
- [ ] `app/(student)/projects/submit/[id].tsx` — formSheet
- [ ] FilePicker (multi-file: images, PDF, ZIP, max 5MB each)
- [ ] Notes textarea
- [ ] Submit → `useSubmitWork` mutation, status flips to `pending`
- **Done when:** business sees the new submission immediately.

### Batch 11.3 — Business review screen (2h)
- [ ] `app/(business)/projects/review/[id].tsx` — pushed from My Projects when status is `pending_review`
- [ ] Render submitted files (preview images inline, file chips for non-images), notes
- [ ] Two buttons: "Approve & Release Funds" (calls `reviewSubmission(approve: true)` → triggers `releaseFunds` server-side) and "Request Revision" (opens feedback sheet, calls `reviewSubmission(approve: false, feedback)`)
- **Done when:** approval transitions project to `completed` and creates a portfolio entry; revision returns project to `in_progress` with feedback visible to student.

### Batch 11.4 — Status banners + ratings handoff (1h)
- [ ] On project status change to `completed`: show banner + "Rate Your Experience" CTA (routes to feature 12 ratings screen)
- [ ] Same banner for both roles, customised wording
- **Done when:** completion banner appears for both sides and rate flow accessible.

---

## Acceptance criteria
- [ ] Files upload reliably under 5MB
- [ ] Approval triggers fund release
- [ ] Revision request returns project to in_progress and notifies student
- [ ] Portfolio entry auto-created on completion
- [ ] Memory bank: no changes
