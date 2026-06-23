# 12 — Ratings, Disputes & Reports

**Goal:** After completion, both parties rate each other across the 7-dimension rubric; either party can raise a dispute (freezing escrow) and track its resolution; any user can report users/projects/messages (content moderation).

**Depends on:** 11 (completion), 10 (escrow for disputes), 03 (shell).

**Backend:**
- rating-service: `userRatings`, `projectRatings`, `myRatings`; `submitRating(input)` (quality, communication, speed, professionalism, paymentFairness, clarity, respect — 1–5 each + comment)
- dispute-service: `projectDispute`, `myDisputes`, `dispute(id)`; `raiseDispute(input)`; `myReports`, `submitReport(input)` (targetType user|project|message; reason spam|harassment|inappropriate|scam|other)

---

## User stories
- As either party, I rate the other on 7 dimensions with an optional comment after completion.
- As either party, I raise a dispute with evidence; escrow freezes until an admin resolves it.
- As any user, I report a user, project, or message.
- I can see ratings on profiles and the status of my disputes/reports.

---

## Batches

### Batch 12.1 — Bilateral ratings (2h)
- [ ] `app/composables/use-ratings.ts` — `submitRating`, `userRatings`, `projectRatings`, `myRatings`
- [ ] `app/components/ratings/rating-stars.vue` (input + display) + `rating-form.vue` (7 dimensions)
- [ ] `app/pages/projects/[id]/rate.vue` — `<f-dialog>`/page; post-completion prompt
- [ ] Show aggregated ratings on profile (F02/F08); average recalculates
- **Done when:** both sides can rate; averages update on profiles.

### Batch 12.2 — Disputes (2h)
- [ ] `app/composables/use-disputes.ts` — `raiseDispute`, `projectDispute`, `myDisputes`
- [ ] `app/pages/projects/[id]/dispute.vue` — reason + evidence upload (Cloudinary) → `raiseDispute`; escrow status reflects `disputed`/frozen
- [ ] `app/pages/disputes/index.vue` — my disputes with status (open / under_review / resolved) + resolution
- **Done when:** raising a dispute freezes escrow; status + admin resolution are visible.

### Batch 12.3 — Reports (moderation) (1h)
- [ ] `app/composables/use-reports.ts` — `submitReport`, `myReports`
- [ ] `app/components/report-button.vue` + `app/components/report-dialog.vue` — reusable on user/project/message; reason select + details
- **Done when:** reports submit for all three target types and appear in My Reports.

---

## Acceptance criteria
- [ ] Ratings post bidirectionally; profile averages recalculate
- [ ] Dispute freezes escrow; status + resolution visible
- [ ] Reports submit for user/project/message; listed in My Reports
- [ ] Works at 1440 / 768 / 390 px
- [ ] Memory bank: no changes expected
