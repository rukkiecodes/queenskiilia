# 03 — Navigation Shells (Role Tab Bars)

**Goal:** Both roles have a NativeTabs shell with placeholder screens so subsequent features have a real home to land on.

**Depends on:** 01, 02 (need authenticated user with role).

---

## User stories
- A logged-in student sees 5 native bottom tabs: Dashboard, Projects, Skill Test, Portfolio, Chat.
- A logged-in business sees 5 native bottom tabs: Dashboard, Projects, Talent, Payments, Chat.
- Tab icons use SF Symbols (rendered consistently on iOS and Android via expo-image).

---

## Batches

### Batch 3.1 — Student tab shell (1h)
- [ ] `app/(student)/_layout.tsx` — NativeTabs with 5 triggers
- [ ] Use `NativeTabs.Trigger.Icon` (SF Symbols), `NativeTabs.Trigger.Label`
- [ ] Symbols: `house`, `briefcase`, `star.circle`, `folder`, `message`
- [ ] Each route file (`dashboard.tsx`, `projects/index.tsx`, `skill-test/index.tsx`, `portfolio.tsx`, `chat.tsx`) renders a placeholder
- **Done when:** all 5 tabs visible and switchable.

### Batch 3.2 — Business tab shell (1h)
- [ ] `app/(business)/_layout.tsx` — NativeTabs with 5 triggers
- [ ] Symbols: `house`, `briefcase`, `person.2`, `creditcard`, `message`
- [ ] Placeholder route files for `dashboard`, `projects/index`, `talent`, `payments`, `chat`
- **Done when:** all 5 tabs visible and switchable.

### Batch 3.3 — Shared screens stack (1h)
- [ ] `app/(shared)/_layout.tsx` — Stack
- [ ] Placeholder `notifications.tsx`, `settings.tsx`, `verification.tsx`
- [ ] These are pushed *into* either tab stack (no own tab — opened via header buttons or deep links)
- **Done when:** can navigate from a tab to a shared screen and back.

### Batch 3.4 — Notification bell + unread badge in tab headers (1h)
- [ ] Stack header on each tab includes a bell icon (`<Image source="sf:bell" />`) with `NativeTabs.Trigger.Badge` showing `unreadCount` from notification-store
- [ ] Tap bell → push `(shared)/notifications`
- **Done when:** badge updates as notifications arrive (manual test — set unread count via store action).

---

## Acceptance criteria
- [ ] Student sees 5 tabs after profile complete
- [ ] Business sees 5 tabs after profile complete
- [ ] Logout from any tab clears auth state and returns to onboarding
- [ ] Memory bank: no changes (NativeTabs API already noted in `project_queenskilla_mobile_stack.md`)
