# 02 — Profile & Verification

**Goal:** After first login, the user completes a role-specific profile (gate to the app), can edit it later, and can submit identity verification (ID document + face capture) to earn the verified badge.

**Depends on:** 01 (authenticated session). Phase 0 Cloudinary config.

**Backend (user-service):**
- Query `me`, `user(id)`
- Mutations `updateProfile`, `updateStudentProfile`, `updateBusinessProfile`, `uploadAvatar(base64, mimeType)`, `submitVerification(input)`
- Types `User { studentProfile, businessProfile, verifications }`, `UserVerification { type, status, documentUrl, ... }`

---

## User stories
- As a new student, I add my bio, university, skills, and skill level before I can browse projects.
- As a new business, I add company name, industry, and website before I can post projects.
- As any user, I edit my profile and avatar later.
- As any user, I submit ID + a face capture and see verification status (pending → approved/rejected) and a verified badge when approved.

---

## Batches

### Batch 2.1 — Cloudinary upload util + avatar picker (1–2h)
- [ ] `app/lib/cloudinary.ts` — unsigned browser upload (`fetch` multipart to Cloudinary), returns secure URL; image compression/size guard
- [ ] `app/components/forms/avatar-picker.vue` — `<f-upload>` / file input + crop preview; small avatars via `uploadAvatar(base64,mimeType)` mutation, larger media via Cloudinary URL
- **Done when:** selecting an image uploads and returns a URL; avatar persists via mutation.

### Batch 2.2 — Profile setup gate (2h)
- [ ] `app/pages/onboarding/profile.vue` — role-branched form (`<f-form>` + `<f-field>` + `<f-input>`/`<f-select>`):
  - Student: bio, university, graduationYear, skills (`skill-selector`), skillLevel, country
  - Business: companyName, website, industry, country, description
- [ ] `app/composables/use-profile-mutations.ts` — `updateProfile` + `updateStudentProfile`/`updateBusinessProfile`
- [ ] On save, re-check completeness (`profileComplete(me)`); route to role home
- **Done when:** an incomplete profile cannot reach the dashboard; saving unlocks it.

### Batch 2.3 — Profile view + edit (1–2h)
- [ ] `app/components/forms/skill-selector.vue`, `country-field.vue` (shared form atoms)
- [ ] `app/pages/profile/index.vue` — current user's profile (avatar, bio, skills, rating, verified badge)
- [ ] `app/pages/profile/edit.vue` — full editor reusing the setup form
- **Done when:** edits persist and reflect immediately (Vue Query cache update).

### Batch 2.4 — Verification stepper (2–3h)
- [ ] `app/composables/use-verification.ts` — `submitVerification`, read `me.verifications`
- [ ] `app/pages/verification/index.vue` — status overview per type (ID, face) with `<f-progress>`/status chips
- [ ] `app/components/verification/id-upload-form.vue` — document upload (file input/drag-drop → Cloudinary)
- [ ] `app/components/verification/face-capture.vue` — webcam capture via `navigator.mediaDevices.getUserMedia` (client-only), snapshot → Cloudinary; graceful fallback to file upload if no camera/permission
- **Done when:** submitting ID + face creates verification records; statuses render accurately; verified badge appears after admin approval.

---

## Acceptance criteria
- [ ] New user is forced through profile setup before any app route
- [ ] Student vs business forms branch correctly and persist to the right mutation
- [ ] Avatar upload works and shows immediately
- [ ] Verification submit succeeds; status reflects backend (pending/approved/rejected); badge shows when approved
- [ ] Webcam capture works in Chrome + Safari, with a file-upload fallback
- [ ] Works at 1440 / 768 / 390 px
- [ ] Memory bank: no changes expected
