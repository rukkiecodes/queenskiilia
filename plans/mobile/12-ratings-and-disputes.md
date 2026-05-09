# 12 — Ratings & Disputes

**Goal:** After a project completes, both parties rate each other. If something goes wrong, either party can raise a dispute for admin resolution.

**Depends on:** 01, 02, 03, 11. Backend rating-service + dispute-service.

**Backend GQL:** `userRatings`, `submitRating`, `projectDispute`, `raiseDispute`.

---

## User stories
- After completion, student rates business on Payment Fairness, Clarity, Communication, Respect.
- After completion, business rates student on Quality, Communication, Speed, Professionalism.
- If a project is disputed (revision rejected, work unsatisfactory), either party can raise a formal dispute with evidence.
- Both parties see the dispute status and admin's resolution.

---

## Batches

### Batch 12.1 — Bilateral rating screen (2h)
- [ ] `app/(shared)/ratings/[projectId].tsx` — formSheet
- [ ] Render different rating dimensions based on `useAuth().isStudent` vs `isBusiness`
- [ ] 4 RatingStars (interactive) + comment textarea + Submit
- [ ] On submit: `useSubmitRating` mutation, return to dashboard with toast
- **Done when:** both roles can submit ratings; ratings appear on the other party's profile.

### Batch 12.2 — Rating display on profiles (1h)
- [ ] User profile shows average rating + recent reviews
- [ ] Sort reviews by newest, expandable comment text
- **Done when:** ratings visible on student portfolios and business profiles.

### Batch 12.3 — Dispute raising flow (2h)
- [ ] Entry point: "Report an Issue" link on active project workspace and review screen
- [ ] `app/(shared)/dispute/[projectId].tsx` — formSheet
- [ ] Reason textarea (required), evidence FilePicker (multi-file)
- [ ] `useRaiseDispute` mutation; freezes escrow on backend
- [ ] If dispute already exists: show existing status instead of form
- **Done when:** raising dispute appears in admin super-admin dashboard.

### Batch 12.4 — Dispute status display (1h)
- [ ] Same dispute screen renders the timeline if dispute exists: raised → admin reviewing → resolved (with resolution + admin note)
- [ ] Pull-to-refresh re-runs `projectDispute` query
- **Done when:** admin's resolution becomes visible to both parties on next refresh.

---

## Acceptance criteria
- [ ] Ratings post bidirectionally
- [ ] Average rating recalculates on user profile
- [ ] Dispute freezes escrow until resolved
- [ ] Admin resolution (refund / release / partial) visible to both parties
- [ ] Memory bank: no changes
