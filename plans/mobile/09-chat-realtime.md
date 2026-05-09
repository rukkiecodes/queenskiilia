# 09 — Chat (Real-Time)

**Goal:** Once a student is selected for a project, both parties get a project-scoped chat room with real-time messages, attachments, and read receipts.

**Depends on:** 01, 02, 03, 05 (selection creates the chat). Backend chat-service + Socket.IO on main-server.

**Backend GQL:** `chat`, `chatMessages`, `sendMessage`, `markMessagesRead`. Socket events: `notification:new`, `message:new`, `typing:start/stop`.

---

## User stories
- Both parties see a list of all their active project chats with unread counts.
- Inside a chat: bubble messages, attachment uploads, read receipts, typing indicator.
- Messages arrive in real time without refresh.
- Chat works in background (Socket reconnects on app foreground).

---

## Batches

### Batch 9.1 — Socket.IO connect/disconnect plumbing (1–2h)
- [ ] `lib/socket-client.ts` already exists from foundation — wire up:
- [ ] Call `connectSocket()` in `authStore.setAuth()` and on app foreground (`AppState`)
- [ ] Call `disconnectSocket()` in `authStore.logout()` and on app background
- [ ] Verify `useChatStore.connected` reflects socket state
- **Done when:** dev console shows connect/disconnect events match auth + app state changes.

### Batch 9.2 — Chat list (1–2h)
- [ ] `components/cards/chat-preview-card.tsx` — avatar of other party, project name, last message preview, timestamp, unread badge
- [ ] `app/(student)/chat.tsx` and `app/(business)/chat.tsx` — same screen, just different tab home
- [ ] List sorted by latest message timestamp
- **Done when:** all active project chats appear with accurate unread counts.

### Batch 9.3 — Chat room screen (3h)
- [ ] `app/(shared)/chat/[id].tsx` — Stack.Screen with project name in header
- [ ] Inverted FlatList of message bubbles (sent right, received left)
- [ ] Subscribe: on mount call `joinRoom(chatId)`, on unmount nothing (keep connected)
- [ ] `useChatStore.messages[chatId]` is the rendered source — Socket pushes append automatically
- [ ] Initial load via `chatMessages` query merges into store
- [ ] Keyboard avoidance via `useKeyboardAvoid` hook (Reanimated)
- **Done when:** sending a message from one device appears on the other within ~1s.

### Batch 9.4 — Attachments + read receipts + typing (2h)
- [ ] Attachment picker button → FilePicker → upload → call `sendMessage` with `attachmentUrls`
- [ ] Render attachments inline (image preview / file chip with download icon)
- [ ] On screen focus: call `markMessagesRead(chatId)` mutation + emit socket event
- [ ] Show "Seen" indicator on last own message that was read
- [ ] Typing indicator: emit `typing:start` on input change (debounced) + `typing:stop` after 3s idle
- **Done when:** attachments upload and render; read receipts and typing indicators visible across both sides.

---

## Acceptance criteria
- [ ] Real-time message delivery < 2s typical
- [ ] Attachments persist and download correctly
- [ ] Read receipts accurate
- [ ] Reconnect works after app backgrounded > 30s
- [ ] Memory bank: no changes
