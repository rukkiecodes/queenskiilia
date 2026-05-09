# 02 — Profile & Verification

**Goal:** New users complete their profile after signup. All users can later edit it. Both roles can submit identity verification (ID document + face match for students; business documents for businesses).

**Depends on:** 01 (authenticated user exists). Cloudinary credentials in env.

**Backend GQL:** `me`, `updateProfile`, `updateStudentProfile`, `updateBusinessProfile`, `submitVerification`, `uploadAvatar`.

---

## User stories
- After OTP verification, a first-time user is routed to `profile-setup` and cannot reach the dashboard until required fields are filled.
- A user can edit their profile from settings.
- Students can upload a government ID + face photo for verification.
- Businesses can upload registration documents for verification.

---

## Batches

### Batch 2.1 — Cloudinary upload util + form components (1–2h)
- [ ] `utils/cloudinary.ts` — `uploadToCloudinary(uri, folder)` using fetch + FormData
- [ ] `components/forms/file-picker.tsx` — wraps `expo-image-picker` + `expo-document-picker`, uploads to Cloudinary with progress
- [ ] `components/forms/country-picker.tsx` — searchable formSheet with flag emojis
- **Done when:** picking an image uploads to Cloudinary and returns `secure_url`.

### Batch 2.2 — Profile setup screen (first-time user) (2h)
- [ ] `app/(auth)/profile-setup.tsx` — full name, avatar picker, country picker
- [ ] Conditional fields: student → bio, university, graduation year; business → company name, website, industry
- [ ] React Hook Form + Zod validation
- [ ] Submit calls `updateProfile` mutation, then routes to role dashboard
- **Done when:** completing profile-setup persists to backend and lands on dashboard.

### Batch 2.3 — Profile view + edit screen (1–2h)
- [ ] `app/(shared)/profile/index.tsx` — read-only view of `me` query data
- [ ] `app/(shared)/profile/edit.tsx` (formSheet) — edit form with same fields as setup
- [ ] Pull-to-refresh re-runs `me` query
- **Done when:** editing any field persists and `me` cache is invalidated.

### Batch 2.4 — Verification stepper screen (2h)
- [ ] `app/(shared)/verification.tsx` — progress stepper showing each step's status (pending / approved / rejected with admin note)
- [ ] Step list driven by `me.verifications` from GQL
- [ ] Tap step → opens upload sheet
- **Done when:** stepper accurately reflects current verification state from backend.

### Batch 2.5 — Verification document uploads (2h)
- [ ] ID document upload (camera + gallery) via `expo-camera` + `expo-image-picker`
- [ ] Student face capture (front camera, oval guide overlay)
- [ ] Business document upload (PDF via `expo-document-picker`)
- [ ] Each upload calls `submitVerification` mutation with Cloudinary URL
- **Done when:** uploaded documents appear under the respective step with `pending` status; admin can approve in super-admin dashboard.

---

## Acceptance criteria
- [ ] First-time user cannot reach dashboard with empty profile
- [ ] All edits persist and reflect on next cold start
- [ ] Verification screen shows accurate per-step status
- [ ] Verified badge appears in avatar after admin approves (manual end-to-end test)
- [ ] Memory bank: no changes (Cloudinary + verification flow are in existing specs)
