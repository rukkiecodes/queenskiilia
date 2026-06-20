# 05 — Business Projects

**Goal:** Businesses create and manage projects, review applicants in a table, and select a student — which then gates the project into the escrow/active flow.

**Depends on:** 03 (shell), 04 (the project shape students apply to).

**Backend (project-service):**
- Query `myProjects`, `project(id)`, `projectApplications(projectId)`
- Mutations `createProject(input)`, `updateProject(id, input)`, `cancelProject(id)`, `selectStudent(projectId, studentId)`

---

## User stories
- As a business, I post a project (title, description, required skills, budget, currency, deadline, skill level).
- As a business, I see my projects filtered by status and can cancel an open one.
- As a business, I review applicants (profiles, cover notes, ratings) and select one.
- Selecting a student moves the project toward escrow funding.

---

## Batches

### Batch 5.1 — Create project form (2h)
- [ ] `app/components/forms/currency-picker.vue`, `date-field.vue` (reuse `skill-selector`)
- [ ] `app/pages/projects/create.vue` — `<f-form>`: title, description (`<f-textarea>`), requiredSkills, skillLevel `<f-select>`, budget `<f-input-number>`, currency, deadline; Zod validation
- [ ] `app/composables/use-project-mutations.ts` — `createProject`
- **Done when:** a published project appears in the student marketplace (F04) and in My Projects.

### Batch 5.2 — My projects list (1–2h)
- [ ] `app/composables/use-my-projects.ts`
- [ ] `app/pages/projects/manage.vue` — status-tabbed (`<f-tabs>`: open / in_progress / under_review / completed / disputed / cancelled) cards; cancel action on open projects
- **Done when:** projects group by status; cancel reverts an open project.

### Batch 5.3 — Applicant review + selection (2h)
- [ ] `app/composables/use-project-applications.ts`
- [ ] `app/pages/projects/[id]/applicants.vue` — `<f-table>` of applicants (avatar, name, skill level, rating, cover note); row → applicant profile (`/talent/[id]` view, F08); "Select" → `selectStudent`
- [ ] After selection: lock further applications; surface "Fund escrow" CTA (links to F10)
- **Done when:** selecting a student blocks further applications and prompts escrow funding.

---

## Acceptance criteria
- [ ] Create publishes a project visible to students within the marketplace query
- [ ] My Projects groups by status; cancel works on open projects
- [ ] Applicant table renders real applicants; profiles open; selection persists
- [ ] Post-selection, applications are closed and escrow CTA appears
- [ ] Works at 1440 / 768 / 390 px
- [ ] Memory bank: no changes expected
