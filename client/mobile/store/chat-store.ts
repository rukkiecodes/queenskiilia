import { create } from 'zustand';

import type { Message } from '@/lib/chat-api';

type State = {
  /**
   * Messages indexed by chatId, in DESC order by sentAt (newest first — matches
   * the inverted FlatList convention used in the chat room screen).
   */
  byChat: Record<string, Message[]>;

  setMessages: (chatId: string, messages: Message[]) => void;
  prependMessage: (chatId: string, message: Message) => void;
  /** Replace an optimistic message (matched by id) with the server's response. */
  replaceMessage: (chatId: string, tempId: string, real: Message) => void;
  /** Drop an optimistic message that failed to send. */
  removeMessage: (chatId: string, id: string) => void;
  /** Merge an UPDATE (e.g. is_read flipped). */
  patchMessage: (
    chatId: string,
    id: string,
    patch: Partial<Message>,
  ) => void;
  clear: (chatId: string) => void;
};

export const useChatStore = create<State>((set) => ({
  byChat: {},

  setMessages: (chatId, messages) =>
    set((s) => ({ byChat: { ...s.byChat, [chatId]: messages } })),

  prependMessage: (chatId, message) =>
    set((s) => {
      const existing = s.byChat[chatId] ?? [];
      // De-dupe by id — Realtime can echo a message we already inserted optimistically.
      if (existing.some((m) => m.id === message.id)) return s;
      return { byChat: { ...s.byChat, [chatId]: [message, ...existing] } };
    }),

  replaceMessage: (chatId, tempId, real) =>
    set((s) => {
      const existing = s.byChat[chatId] ?? [];
      if (existing.some((m) => m.id === real.id)) {
        // Real already arrived via Realtime; drop the temp.
        return {
          byChat: {
            ...s.byChat,
            [chatId]: existing.filter((m) => m.id !== tempId),
          },
        };
      }
      return {
        byChat: {
          ...s.byChat,
          [chatId]: existing.map((m) => (m.id === tempId ? real : m)),
        },
      };
    }),

  removeMessage: (chatId, id) =>
    set((s) => ({
      byChat: {
        ...s.byChat,
        [chatId]: (s.byChat[chatId] ?? []).filter((m) => m.id !== id),
      },
    })),

  patchMessage: (chatId, id, patch) =>
    set((s) => ({
      byChat: {
        ...s.byChat,
        [chatId]: (s.byChat[chatId] ?? []).map((m) =>
          m.id === id ? { ...m, ...patch } : m,
        ),
      },
    })),

  clear: (chatId) =>
    set((s) => {
      const { [chatId]: _drop, ...rest } = s.byChat;
      return { byChat: rest };
    }),
}));
