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

### Batch 13.1 — In-app notification list (1–2h)
- [ ] `app/(shared)/notifications.tsx` — list of `myNotifications`, newest first
- [ ] `components/cards/notification-card.tsx` — left SF Symbol icon by type, `colors.primary` (Action Blue) dot if unread, relative timestamp
- [ ] Tap → mark read → route to relevant screen by `notification.metadata`
- [ ] "Mark all read" button in header
- [ ] Pull-to-refresh
- **Done when:** notifications render and tap-routing works for all known types.

### Batch 13.2 — Real-time notification arrival (already wired in 09 — verify) (30min)
- [ ] Confirm `notification:new` socket event pushes into `notification-store.addNotification`
- [ ] Bell badge in tab headers updates in real time
- **Done when:** sending a backend notification appears in the badge within ~1s without refresh.

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
