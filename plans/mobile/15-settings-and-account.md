# 15 — Settings & Account

**Goal:** Centralized settings hub including notifications preferences, language, appearance, help, about, terms/privacy, logout, and **Delete Account** (mandatory for Google Play 2024+ compliance).

**Depends on:** 01, 02, 03.

---

## User stories
- User can mute notification categories.
- User can review terms, privacy, and licenses.
- User can permanently delete their account from inside the app.
- User can log out.

---

## Batches

### Batch 15.1 — Settings home screen (1h)
- [x] `app/(shared)/settings.tsx`
- [x] Profile section preview (avatar, name, email — non-editable, tap to edit)
- [~] Section list: Notifications, Security, Language, Appearance, Help, About (shipped Notifications, Help, About, Terms, Privacy, Delete — Security/Language/Appearance deferred until those features exist)
- [x] Logout button at bottom (red destructive)
- [x] App version footer (from `expo-constants`)
- **Done when:** all rows navigate; logout clears state.

### Batch 15.2 — Notification preferences (1h)
- [x] `app/(shared)/settings/notifications.tsx`
- [x] Toggle per category: Project updates, Messages, Payments, System
- [x] Persist via `updateNotificationPreferences` mutation
- **Done when:** ~~toggling silences the relevant push category (manual test).~~ Toggles persist; *silencing* requires emission to consult `notification_preferences` and native push delivery (Feature 13.3+13.4 + emission gap). Deferred with Feature 13 push work.

### Batch 15.3 — Help, About, Terms, Privacy (1h)
- [x] About screen: app version, build number, "Made by..."
- [x] Help screen: FAQ list + contact support link (mailto)
- [x] Terms of Service + Privacy Policy: rendered from hosted URLs in WebView (so updates don't need new app builds)
- **Done when:** all four screens render correctly.

### Batch 15.4 — Delete Account (Google Play required) (1–2h)
- [x] `app/(shared)/settings/delete-account.tsx`
- [x] Warning copy explaining what gets deleted (data, portfolio, ratings, payment history) and what's retained for legal reasons (transaction records as required by law)
- [x] Type "DELETE" to confirm input
- [x] `deleteAccount` mutation → on success: clear SecureStore + redirect to onboarding
- [~] Server-side: soft-delete with 30-day reversibility window (handled by backend) — soft-delete + `deletion_requested_at` stamp + refresh-token revocation done; 30-day cleanup job (tombstone email, hard-delete row) is a separate follow-up.
- **Done when:** account deletion completes and user is logged out.

---

## Acceptance criteria
- [x] Logout works from any state
- [x] Delete account routes through confirmation and removes user from app
- [~] Notification preferences honored — persisted, but emission doesn't consult them yet (paired with Feature 13 emission gap).
- [x] Privacy Policy + Terms accessible from settings (Google Play requirement)
- [ ] Memory bank: add a `project_queenskilla_legal_assets.md` reference once Privacy Policy URL and Terms URL are finalized (URLs are placeholders in `constants/legal.ts` until launch prep).
