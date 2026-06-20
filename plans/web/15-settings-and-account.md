# 15 — Settings & Account

**Goal:** A settings hub (profile, notifications, theme, legal) and account management including the soft-delete "Delete Account" flow with its 30-day grace window.

**Depends on:** 01 (auth), 02 (profile), 13 (notification prefs), 03 (shell).

**Backend (user-service):** `deleteAccount(confirmation)` (soft-delete, 30-day grace); notification prefs from F13; legal docs static/hosted.

---

## User stories
- As a user, I reach all my settings from one hub.
- As a user, I toggle theme (light/dark), edit my profile, and manage notification preferences.
- As a user, I read Terms and Privacy.
- As a user, I can delete my account through an explicit confirmation, understanding the 30-day grace period.

---

## Batches

### Batch 15.1 — Settings hub (1h)
- [ ] `app/pages/settings/index.vue` — `<f-list>` sections: Account, Notifications, Appearance (theme toggle), Help, About, Legal, Danger zone
- **Done when:** the hub links to each settings page; theme toggle persists (cookie).

### Batch 15.2 — Legal + help/about (1h)
- [ ] `app/pages/settings/terms.vue`, `privacy.vue` — render hosted/static legal content (reuse `legal/` assets if present); `about.vue`, `help.vue` (FAQ/support)
- **Done when:** Terms, Privacy, About, Help render and are linkable from the footer too.

### Batch 15.3 — Delete account (1–2h)
- [ ] `app/pages/settings/delete-account.vue` — explicit confirmation (type-to-confirm), clear 30-day grace explanation → `deleteAccount(confirmation)`; on success, log out + clear cookies
- **Done when:** deletion requires explicit confirmation, calls the soft-delete mutation, and ends the session.

---

## Acceptance criteria
- [ ] Settings hub links to every sub-page; theme persists
- [ ] Terms/Privacy/About/Help accessible (also from footer)
- [ ] Delete account routes through confirmation, calls `deleteAccount`, logs out
- [ ] Notification preferences page (F13) reachable from here
- [ ] Works at 1440 / 768 / 390 px
- [ ] Memory bank: no changes expected
