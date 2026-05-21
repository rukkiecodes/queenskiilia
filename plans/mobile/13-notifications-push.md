# 13 — Notifications & Push

**Goal:** In-app notification center + native push notifications for project updates, messages, payments, and system events. Tapping a notification deep-links into the relevant screen.

**Depends on:** 01, 02, 03, plus enough core flows to generate events worth notifying (so build after 09–12). Backend notification-service.

**Backend GQL:** `myNotifications`, `unreadCount`, `markAsRead`, `markAllAsRead`. Backend mutation to register push token (in user-service).

---

## User stories
- User sees a bell icon with unread badge in every tab header.
- Tapping bell → notification list, newest first.
- Tap a notification → navigate to the relevant screen (project / chat / payment).
- App receives push notifications when backgrounded; tapping push opens correct screen.

---

## Batches

### Batch 13.1 — In-app notification list (1–2h) ✅
- [x] `app/(shared)/notifications.tsx` — list of `myNotifications`, newest first
- [x] `components/cards/notification-card.tsx` — left SF Symbol icon by type, `colors.primary` (Action Blue) dot if unread, relative timestamp
- [x] Tap → mark read → route via `metadata.deepLink` (contract; emission still TODO)
- [x] "Mark all read" button in header
- [x] Pull-to-refresh
- **Done:** notifications render; tap marks read + routes when metadata carries `deepLink`.

### Batch 13.2 — Live bell badge (30min) ✅
- [x] Socket.IO `notification:new` premise is moot — Socket.IO is dead (see Feature 09); `notifications` table isn't in the `supabase_realtime` publication either, so Realtime push needs a DB change (out of the no-infra scope).
- [x] Substitute: `useUnreadCount` polls `unreadCount` every 30s + refetches on mark-read invalidation, mirrors into `notification-store`. Mounted in both role layouts.
- **Done:** bell badge tracks the server count within ~30s, instantly after mark-read/mark-all.

> **Backend gap (follow-up):** no service emits notifications — `notification-service` is read-only and nothing does `INSERT INTO notifications`. The list/badge stay empty in production until service-side emission lands (a `createNotification` mutation + cross-service inserts from project/chat/payment/dispute services).

### Batch 13.3 — Push notification setup (2h)
- [ ] Configure `expo-notifications` permissions request flow
- [ ] On login: `getExpoPushTokenAsync()` → POST to backend (`updatePushToken` mutation)
- [ ] On logout: clear token on backend
- [ ] Foreground handler: show in-app toast + add to store (no native banner)
- [ ] Background handler: native banner + sound
- **Done when:** test push from Expo push tool reaches the device.

### Batch 13.4 — Push deep linking (1–2h)
- [ ] Notification response handler reads `notification.data.deepLink`
- [ ] Navigate to correct route on tap (project, chat, payment, dispute)
- [ ] Cold start handling: if app launched from a notification, route after auth gate hydration
- **Done when:** tapping a backgrounded push opens the correct screen; same on cold start.

---

## Acceptance criteria
- [ ] Bell badge accurate and live
- [ ] Push delivery works on real device (Android + iOS)
- [ ] Deep link routing works in foreground, background, and cold start
- [ ] Memory bank: no changes
