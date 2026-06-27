# Skill Certification Exams — Build Plan

> AI-assisted (Gemini) exam authoring + a Udemy-grade skill-certification system.
> Admins generate, review and publish leveled exams per skill; talents sit the
> exam and, on passing, receive a verifiable certificate (name, skill, level,
> grade/performance, QueenSkiilia logo).

Status: **PLAN** (not yet built). Author: 2026-06-27.

### Locked decisions (2026-06-27)
- **D1 — Canonical `skills_catalog`** (admin-managed); exams + certs reference it.
- **D7 — Include AI-graded `short_answer` + `code` questions in v1** (alongside
  objective types). Free-text/code answers are graded by **Gemini** against a
  server-only model answer + rubric. → grading is part-instant (objective),
  part-async (AI); adds token cost + a grading prompt (§5a).
- **D6 — Server-side PDF/PNG certificate** generated on issue (downloadable),
  in addition to the public web/verification page.
- D2–D5, D8 still open (see §13).

---

## 1. Goals

1. **Admin authoring** — an admin picks a **skill** + **difficulty level**, asks
   **Gemini** to generate a set of questions, **reviews/edits** them (add/remove,
   fix answers, attach **diagrams/images**), then **publishes** the exam.
2. **Professional question editor** — rich prompts, multiple question types,
   per-question images/diagrams, code snippets, explanations, points.
3. **Leveled difficulty** — Beginner → Intermediate → Advanced (extensible),
   with a difficulty rubric the AI follows.
4. **Talent exam-taking** — browse published exams by skill/level, sit a **timed**
   exam, auto-graded on submit, see the result + breakdown.
5. **Certificate** — on pass, issue a Udemy-style certificate: talent name, skill,
   level, **grade + score/performance**, date, **QueenSkiilia logo**, a unique
   certificate ID, and a **public verification page**.

## 2. What already exists (reuse / reconcile)

- **`skills-service`** (federated subgraph: `index.ts`, `schema.ts`,
  `resolvers/skills.ts`) — the natural **home** for this feature. We extend it
  rather than spin up a new service.
- Legacy tables `skill_assessments` (UNIQUE(student_id, category)) and
  `assessment_sessions` (category, `questions` JSONB, `answers` JSONB, expiry).
  These are a **simpler, category-based, auto-generated** assessment mechanism.
  **Decision:** keep them untouched for now; the new exam system uses its own
  tables (below). A later migration can fold the legacy assessment into exams.
- **Cloudinary** is already wired for uploads (avatars, portfolio, thumbnails) —
  reuse its signed-upload flow for **question diagrams/images** (see `cloudinary.md`).
- Skills are **free-text `TEXT[]`** today (student_profiles.skills, etc.). There
  is **no canonical skills catalog** — see Decision D1.
- Frontend `/skill-tests` is a "Coming soon" placeholder + the admin panel
  (`/admin`) is live with dedicated admin auth and `ctx.isAdmin` gating.

## 3. Domain model (new tables)

All in the shared Postgres (owned conceptually by `skills-service`).

```
skills_catalog            -- canonical skills (Decision D1)
  id, name, slug (unique), category, description, icon, is_active, created_at

skill_exams               -- an exam definition (one per skill+level, versioned)
  id, skill_id -> skills_catalog, skill_name (denormalized snapshot),
  level ('beginner'|'intermediate'|'advanced'),
  title, description,
  pass_threshold (int %, default 70),
  duration_minutes (int, default 30),
  max_attempts (int, default 3), retake_cooldown_hours (int, default 24),
  question_count (int, denormalized),
  total_points (int, denormalized),
  status ('draft'|'published'|'archived'),
  version (int), created_by (admin id), created_at, published_at

exam_questions
  id, exam_id -> skill_exams,
  type ('single'|'multiple'|'boolean'|'short_answer'|'code'),
  prompt (text, supports markdown/code),
  image_url (nullable, Cloudinary),        -- diagram/figure
  code_snippet (nullable, + code_language),
  options JSONB,                           -- objective: [{ id, text, image_url? }]
  correct_option_ids JSONB,                -- objective: server-only correct ids
  -- AI-graded (short_answer/code) — all server-only, never sent to talents:
  model_answer (text, nullable),           -- the reference answer
  grading_rubric (text, nullable),         -- how to award partial credit
  expected_language (text, nullable),      -- for code questions
  explanation (text, shown after grading),
  points (int, default 1),
  position (int),
  ai_generated (bool), created_at

exam_attempts
  id, exam_id, talent_id -> users,
  status ('in_progress'|'submitted'|'graded'|'expired'),
  started_at, expires_at (= started_at + duration), submitted_at,
  score_points (int), total_points (int), score_pct (numeric),
  passed (bool), grade (text),             -- 'distinction'|'merit'|'pass'|'fail'
  question_order JSONB,                     -- per-attempt shuffle
  attempt_number (int)

exam_answers
  id, attempt_id -> exam_attempts, question_id -> exam_questions,
  selected_option_ids JSONB,               -- objective answer
  text_answer (text, nullable),            -- short_answer/code answer
  is_correct (bool, nullable),             -- null until AI-graded
  awarded_points (int), ai_feedback (text, nullable),
  grading_status ('auto'|'pending_ai'|'ai_graded')

certificates
  id, certificate_code (unique, e.g. 'QS-7F3K-9A2D'),
  attempt_id -> exam_attempts, talent_id -> users,
  exam_id, skill_name, level, score_pct, grade,
  talent_name (snapshot), issued_at,
  is_revoked (bool, default false)
```

Indices: `exam_questions(exam_id, position)`, `exam_attempts(talent_id, exam_id)`,
`certificates(certificate_code)`, `skill_exams(skill_id, level, status)`.

## 4. Architecture

```
Admin UI (/admin/exams)  ──┐                          ┌─► Postgres (tables §3)
Talent UI (/skill-tests) ──┤  gateway ─► skills-service┤─► Cloudinary (diagrams)
Certificate page         ──┘   (GraphQL)      │        └─► ai-service (internal HTTP)
                                              └──server-to-server──►  │
                                                          ai-service ─► Gemini API
```

- **`ai-service` (NEW — internal HTTP service).** Owns the **Gemini** integration:
  the API key, the prompt engineering, and structured-output parsing. Exposes
  `POST /exam/generate-questions` and `POST /exam/grade-answer`, protected by an
  internal shared secret (`INTERNAL_API_KEY`, `x-internal-key` header) — **not**
  a federated subgraph, not publicly callable. Deliberately generic so future AI
  activities (document verification, content moderation, summaries…) live here too.
  Model: **`gemini-2.5-pro`** (configurable via `GEMINI_MODEL`).
- **`skills-service` (extended).** The exam **domain**: schema + resolvers
  (`resolvers/exam-admin.ts`, `resolvers/exam-taking.ts`, `resolvers/certificates.ts`),
  CRUD, attempts, and **grading orchestration**. Calls the ai-service
  server-to-server via `internal/aiClient.ts`. Reads `ctx.isAdmin` from the
  `x-user-admin` header (propagation already exists from the admin panel).
- **Gemini is server-side only, isolated in the ai-service.** The browser never
  sees the API key, the prompts, the model answers, or the correct answers.
- **Gateway re-compose** required when the skills-service schema changes (deploy
  subgraph → deploy main-server). The ai-service is **not** in the gateway.

## 5. AI question generation (Gemini)

- **Where:** the **ai-service** (§4), via a **direct REST call** to
  `generativelanguage.googleapis.com` (no SDK dependency — axios/fetch). Key from
  env `GEMINI_API_KEY` (Google AI Studio). Model **`gemini-2.5-pro`** (configurable
  via `GEMINI_MODEL`). skills-service calls `POST /exam/generate-questions`.
- **Structured output:** request `responseMimeType: application/json` with a
  `responseSchema` matching the question shape, so the model returns a validated
  array of questions (no brittle parsing):
  ```json
  { "questions": [ { "type": "single", "prompt": "...", "options": ["..."],
    "correctIndexes": [2], "explanation": "...", "points": 1,
    "diagramSuggestion": "optional text describing a figure to add" } ] }
  ```
- **Prompt design:** a system instruction that includes the **skill**, the
  **level rubric** (what beginner vs advanced means), the desired **count** and
  **mix of types**, a rule to write a clear single correct answer (or defined
  multi-answers), an `explanation` per question, and the JSON schema. Ask it to
  flag where a **diagram** would help (`diagramSuggestion`) — the admin then
  uploads an image for that question.
- **Generation is a draft, not a publish.** Output is saved as `ai_generated`
  draft questions the admin **must** review. The admin can re-generate, generate
  more, edit text/answers, reorder, delete, and attach images.
- **Validation:** server validates each question (≥2 options, ≥1 correct,
  correct indexes in range) before saving; reject/repair malformed AI output.
- **Cost guardrails:** rate-limit generation per admin; cap questions per call
  (e.g. 1–20); log token usage. (Decision D5.)
- **Diagrams via AI:** text models can't emit images. v1 = admin uploads the
  figure (Cloudinary) guided by `diagramSuggestion`. Future: Imagen/`gemini-2.5
  -flash-image` to auto-generate figures (out of scope for v1).

## 5a. AI grading (short-answer & code) — D7

- On `submitAttempt`, objective questions grade instantly; each `short_answer`/
  `code` answer is graded by **Gemini**: a grading prompt sends the **question
  prompt**, the **model answer + rubric** (and `expected_language` for code), and
  the **talent's answer**, requesting a structured verdict
  `{ awardedPoints (0..max), isCorrect, feedback }`. Server clamps to `[0, points]`.
- **Two-pass grading:** instant objective score first; free-text answers go
  `grading_status='pending_ai'`, then a grading pass (inline on submit, or a short
  background job) fills them in. Only when all answers are graded is the attempt
  finalized (`graded`), the total recomputed, pass/grade decided, and the
  certificate issued. The result screen shows "grading…" for AI items if async.
- **Integrity:** model answers + rubrics are **server-only**; re-grade is
  admin-only. Cap free-text questions per exam; rate-limit; log tokens. Same
  `GEMINI_API_KEY`/model as authoring.

## 6. Admin exam-builder flow

1. **Exams list** (`/admin/exams`) — all exams grouped by skill, with status
   chips (draft/published/archived), question counts, attempt/pass stats.
2. **Create exam** — pick **skill** (from catalog), **level**, title,
   pass threshold, duration, attempt limits.
3. **Generate with AI** — "Generate N questions" → calls Gemini → draft questions
   appear in the editor. Can generate again / generate more.
4. **Question editor** — per question: edit prompt (markdown), type, options +
   correct answer(s), explanation, points; attach an **image/diagram**
   (Cloudinary upload); add code snippet; reorder (drag); delete; add manual
   question. Live "total points / count" summary.
5. **Preview** — see the exam exactly as a talent will (answers hidden styling).
6. **Publish** — validation gate (≥N questions, every question has a correct
   answer, total points > 0) → status `published`, stamp `published_at`.
   Publishing a new **version** supersedes the prior one for new attempts;
   in-flight attempts keep their snapshot.
7. **Archive / unpublish** — hide from talents without deleting history.

## 7. Talent exam-taking flow

1. **Browse** (`/skill-tests`) — published exams by skill + level, with duration,
   question count, pass mark, and the talent's prior result/certificate if any.
2. **Start attempt** — server creates `exam_attempts` (sets `expires_at`,
   `question_order` shuffle, `attempt_number`); enforces `max_attempts` +
   cooldown; only one active attempt at a time.
3. **Take exam** — questions served **without** correct answers; one-per-screen
   or paginated; a **server-authoritative countdown** (client shows it, server
   enforces `expires_at`); autosave answers as they go (resume-safe).
4. **Submit** (or auto-submit on expiry) — server grades objective questions
   instantly and grades `short_answer`/`code` via Gemini (§5a, may be async);
   once every answer is graded, computes `score_pct`, `passed`, `grade` band,
   persists `exam_answers`, and issues the certificate on pass.
5. **Result** — score, pass/fail, per-question correctness + **explanations**,
   and — if passed — a link to the **certificate**.

**Grade bands (default):** Fail < pass_threshold; Pass = threshold–74%;
Merit = 75–89%; Distinction ≥ 90%. (Configurable — Decision D4.)

## 8. Certificate

- **Issued** automatically on a passing graded attempt (idempotent: one cert per
  passed attempt). Unique human-readable `certificate_code`.
- **Fields:** QueenSkiilia logo, "Certificate of Skill Proficiency", talent name,
  **skill + level**, **score % + grade**, issue date, certificate code, and a
  short verification URL.
- **Rendering:** a dedicated **public, no-auth** Nuxt page
  `/certificates/[code]` styled like a real certificate (print-optimized CSS).
  Doubles as the **verification page** (shows "Verified ✓" + the record, or
  "Not found / revoked"). Talent profile + the result screen link to it.
- **PDF/Share (D6):** the server generates a downloadable **PDF + PNG** on issue
  — **pdf-lib** (pure-JS, serverless-safe) draws the background, embeds the
  QueenSkiilia logo + certificate text from a fixed template; a PNG is rendered
  from the same template for OG/social. Files stored on **Cloudinary**; the cert
  page offers one-click **Download PDF** + share links. The public page stays the
  canonical verification record.
- **Profile integration:** passed certifications appear on the talent's public
  profile (a "Verified skills" section) — a trust signal for employers, tying
  back to the "verified talent ecosystem" brand.

## 9. GraphQL surface (sketch)

**Admin (isAdmin-gated):**
```
# skills catalog
adminSkills: [Skill!]!                       createSkill(input): Skill!
# exams
adminExams(skillId, level, status): [Exam!]! adminExam(id): Exam!
createExam(input): Exam!                      updateExam(id, input): Exam!
generateExamQuestions(examId, count, types): [Question!]!   # calls Gemini
addQuestion(examId, input): Question!         updateQuestion(id, input): Question!
deleteQuestion(id): Boolean!                  reorderQuestions(examId, ids): Boolean!
publishExam(id): Exam!                        archiveExam(id): Exam!
examStats(id): ExamStats!                     # attempts, pass rate, avg score
```

**Talent (auth, no admin):**
```
publishedExams(skillId, level): [ExamSummary!]!   # no answers
exam(id): ExamForTaking!                            # questions WITHOUT correct answers
startAttempt(examId): Attempt!
saveAnswer(attemptId, questionId, optionIds): Boolean!
submitAttempt(attemptId): AttemptResult!            # triggers grading + cert
myAttempts(examId): [Attempt!]!
myCertificates: [Certificate!]!
```

**Public:**
```
certificate(code): Certificate          # verification (no auth)
```

> **Answer secrecy is a hard rule:** `ExamForTaking.questions` and the
> take-exam payload must NEVER include `correct_option_ids`. Grading is
> server-side only. This is the #1 integrity requirement.

## 10. Frontend

**Admin (`client/web/app/pages/admin/exams/`):**
- `index.vue` — exams list (+ skills catalog management entry)
- `[id].vue` — the builder: details, "Generate with AI", question editor
  (image upload, drag-reorder), preview, publish. Add **Exams** to the admin
  sidebar (`layouts/admin.vue`).

**Talent (`client/web/app/pages/skill-tests/`):** replace the "Coming soon"
placeholder.
- `index.vue` — browse exams by skill/level + my results
- `session.vue` — the timed exam runner (already a route stub exists)
- `results/[attemptId].vue` — score + breakdown + cert link

**Certificate:** `client/web/app/pages/certificates/[code].vue` (public layout).

**Mobile (later):** the talent take-exam + certificate view mirror the web
(shared GraphQL ops), per the mobile stack conventions.

## 11. Security & integrity

- **Answer secrecy** (above) — separate "for-taking" vs "for-admin" question types.
- **Server-enforced time** — `expires_at`; reject `saveAnswer`/`submitAttempt`
  after expiry (auto-submit what exists).
- **Attempt limits + cooldown** — enforced server-side.
- **Per-attempt shuffle** of question + option order.
- **Rate-limit** AI generation and attempt starts.
- **Admin-only** authoring mutations (`requireAdmin`); talent mutations check the
  attempt belongs to `ctx.userId`.
- **Certificate integrity** — random unguessable code; verification page is the
  source of truth; `is_revoked` supported.
- (Future) anti-cheat: tab-blur logging, question pools/randomized subsets,
  proctoring hooks.

## 12. Phased build plan

- **Phase 0 — Foundations & decisions.** Resolve D1–D6. Add `GEMINI_API_KEY`.
  DB migration `migrate-skill-exams.ts` (tables §3, idempotent). Seed a small
  skills catalog.
- **Phase 1 — Authoring backend.** skills-service: schema + admin resolvers for
  exams/questions CRUD + `gemini.ts` + `generateExamQuestions` + `publishExam`.
  Deploy subgraph + gateway re-compose. Verify via API.
- **Phase 2 — Admin builder UI.** `/admin/exams` list + builder with AI generate,
  question editor, image upload, preview, publish. Sidebar entry.
- **Phase 3 — Talent taking backend.** publishedExams / startAttempt / saveAnswer
  / submitAttempt (+ grading) / myAttempts — answer-secret, time-enforced.
- **Phase 4 — Talent taking UI.** Browse + timed runner + results. Replace the
  "Coming soon" page.
- **Phase 5 — Certificates.** Issuance on pass, `/certificates/[code]` public
  page (print CSS), profile "Verified skills" section, verification.
- **Phase 6 — Polish.** Exam analytics (pass rates), versioning, retake cooldown
  UX, optional server-side PDF, mobile.

Each phase: build → typecheck/build → deploy (subgraph → gateway → web) →
verify, consistent with the admin-panel cadence.

## 13. Decisions (D1, D6, D7 LOCKED — see banner at top; rest open for Phase 0)

- **D1 — Skills catalog. ✅ LOCKED:** canonical `skills_catalog`, admin-managed.
- **D2 — Gemini model + key.** Confirm `GEMINI_API_KEY` (Google AI Studio) and
  default model (`gemini-2.5-flash`). Who owns billing/quota?
- **D3 — Attempt limits.** Default max attempts (3) + cooldown (24h)? One cert per
  skill+level (highest grade) or per attempt?
- **D4 — Grade bands + pass mark.** Confirm thresholds (pass 70 / merit 75 /
  distinction 90) — per-exam overridable.
- **D5 — AI cost guardrails.** Per-admin generation rate limit + max questions
  per call.
- **D6 — Certificate format. ✅ LOCKED:** server-side PDF/PNG on issue (pdf-lib).
- **D7 — Question types. ✅ LOCKED:** objective + AI-graded `short_answer`/`code`
  in v1 (§5a).
- **D8 — Reconcile legacy** `assessment_sessions` — leave, migrate, or retire?

## 14. Config / env

- `ai-service` (NEW, `queenskilla-ai-service`): `GEMINI_API_KEY`,
  `GEMINI_MODEL` (default `gemini-2.5-pro`), `INTERNAL_API_KEY` (shared secret).
  No DB.
- `skills-service`: `AI_SERVICE_URL`, `INTERNAL_API_KEY`, Cloudinary creds (reuse),
  Postgres (existing).
- One new service to provision (the ai-service); one gateway re-compose per
  skills-service schema change.
