# 09 — Chat (Real-time)

**Goal:** Project-scoped real-time messaging between the student and business via Socket.IO, with attachments, read receipts, typing indicators, and reliable reconnection on tab focus/visibility changes.

**Depends on:** 03 (shell), Phase 0 socket composable, 05/04 (a project + selected student create a chat).

**Backend:**
- chat-service GraphQL: `myChats`, `chat(projectId)`, `chatMessages(chatId, limit, offset)`, `sendMessage(input)`, `markMessagesRead(chatId)`
- Socket.IO (main-server hub): join `chat:{chatId}`; events `message:new`, `chat:typing`

---

## User stories
- As a participant, I see my conversations and unread counts.
- As a participant, I send/receive messages in real time (< 2s).
- As a participant, I send attachments and see read receipts + typing indicators.
- If my connection drops (tab backgrounded), it reconnects and I miss nothing.

---

## Batches

### Batch 9.1 — Chat list (1–2h)
- [ ] `app/composables/use-my-chats.ts` — `myChats` (last message, unread count, participant)
- [ ] `app/components/cards/chat-preview-card.vue`
- [ ] `app/pages/chat/index.vue` — conversation list (master pane on desktop, full screen on mobile-web)
- **Done when:** conversations list with last message + unread badges.

### Batch 9.2 — Chat room (2h)
- [ ] `app/composables/use-chat-room.ts` — `chatMessages` paged history + live `message:new` via socket; de-dupe optimistic vs server message; `markMessagesRead` on view
- [ ] `app/components/chat/chat-bubble.vue`, `chat-input.vue`, `message-list.vue` (`<ClientOnly>`)
- [ ] `app/pages/chat/[chatId].vue` — desktop two-pane (list + thread), mobile single pane
- [ ] Optimistic send via `chat` Pinia store (temp id → server id replace; remove on error)
- **Done when:** messages send/receive live; history paginates; read state updates.

### Batch 9.3 — Attachments + typing + reconnect (1–2h)
- [ ] Attachment upload (Cloudinary) → `attachmentUrls` on `sendMessage`; in-thread preview/download
- [ ] Typing indicator relay (`chat:typing`), debounced
- [ ] Reconnect strategy: on `visibilitychange`/focus, re-join room + refetch tail to fill gaps
- **Done when:** attachments persist and preview; typing shows; backgrounding >30s then returning recovers missed messages.

---

## Acceptance criteria
- [ ] Real-time delivery < 2s both directions
- [ ] History paginates; optimistic send reconciles with server message (no dupes)
- [ ] Attachments upload, persist, preview/download
- [ ] Read receipts + typing accurate
- [ ] Reconnect after background/visibility change recovers missed messages
- [ ] Works at 1440 / 768 / 390 px
- [ ] Memory bank: no changes expected
