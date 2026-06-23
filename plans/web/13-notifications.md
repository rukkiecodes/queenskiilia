# 13 — Notifications

**Goal:** A real-time notification center (socket-driven), a live unread bell badge, per-category preferences, and deep links to the relevant screen. Optional Web Push via Service Worker for re-engagement when the tab is closed.

**Depends on:** 03 (bell in navbar), Phase 0 socket, most feature screens (deep-link targets).

**Backend (notification-service):**
- Query `myNotifications(unreadOnly, limit, offset)`, `unreadCount`, `myNotificationPreferences`
- Mutations `markAsRead(id)`, `markAllAsRead`, `deleteNotification(id)`, `updateNotificationPreferences(input)`
- Real-time: `notification:new` via Socket.IO `user:{id}` room

---

## User stories
- As a user, I see a live unread count and a notification center.
- As a user, tapping a notification deep-links to the relevant screen (project, chat, payment, etc.).
- As a user, I manage which categories notify me.
- (Optional) As a user, I opt into browser push to hear about activity when the tab is closed.

---

## Batches

### Batch 13.1 — Notification center + live bell (2h)
- [ ] `app/composables/use-notifications.ts` — `myNotifications` (infinite), `unreadCount`, mark read/all, delete
- [ ] `app/components/cards/notification-card.vue`
- [ ] `app/pages/notifications/index.vue` — list with read/unread states, mark-all, per-item delete
- [ ] Live: subscribe to `notification:new` (socket) → increment `notifications` store + toast (`$fui.notify`); bell badge reflects it
- **Done when:** new notifications appear live; bell count updates; mark-as-read works.

### Batch 13.2 — Deep linking (1h)
- [ ] Map `notification.metadata` → route (project/chat/payment/submission/rating/dispute/verification); navigate on click and mark read
- **Done when:** each notification type routes to the correct screen and clears its unread state.

### Batch 13.3 — Preferences (1h)
- [ ] `app/pages/settings/notifications.vue` — toggles for projectUpdates, messages, payments, system → `updateNotificationPreferences`
- **Done when:** preference changes persist and are respected by emission.

### Batch 13.4 — Web Push (optional, 2h)
- [ ] Service Worker + `PushManager` subscription (VAPID) — **only if backend exposes a web-push registration endpoint**; otherwise document as a follow-up and keep in-app + socket as the delivery path
- [ ] Permission prompt UX (request on intent, not on load)
- **Done when:** (if backend-supported) a push arrives with the tab closed; otherwise clearly deferred with a noted backend dependency.

---

## Acceptance criteria
- [ ] Live unread count + center update in real time via socket
- [ ] Deep links route correctly and mark read
- [ ] Preferences persist and gate emission
- [ ] Web Push works OR is explicitly deferred with the backend gap documented (no silent omission)
- [ ] Works at 1440 / 768 / 390 px
- [ ] Memory bank: note the mobile push-emission gap (`session_queenskilla_mobile_development`) applies here too if backend emission is incomplete
