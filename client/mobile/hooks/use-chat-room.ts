import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { chatApi, type Message } from '@/lib/chat-api';
import { supabase } from '@/lib/supabase-client';
import { useChatStore } from '@/store/chat-store';

/**
 * Database row shape from supabase_realtime.postgres_changes — snake_case.
 * We map it to our camelCase `Message` shape before pushing into the store.
 */
type MessageRow = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string | null;
  attachment_urls: string[] | null;
  is_read: boolean;
  sent_at: string;
};

function rowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    content: row.content,
    attachmentUrls: row.attachment_urls ?? [],
    isRead: row.is_read,
    sentAt: row.sent_at,
  };
}

/**
 * Loads the initial message history for a chat (via GraphQL) and subscribes
 * to a Supabase Realtime channel for postgres_changes filtered by chat_id.
 * INSERTs prepend (newest first); UPDATEs patch (e.g. is_read flip).
 *
 * Consumer reads from useChatStore.byChat[chatId] — that's the rendered source.
 */
export function useChatRoom(chatId: string | undefined) {
  const qc = useQueryClient();
  const setMessages = useChatStore((s) => s.setMessages);
  const prependMessage = useChatStore((s) => s.prependMessage);
  const patchMessage = useChatStore((s) => s.patchMessage);

  const query = useQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: () => chatApi.messages(chatId!, 50, 0),
    enabled: !!chatId,
    staleTime: 1000 * 30,
  });

  // Push initial result into the store
  useEffect(() => {
    if (chatId && query.data) {
      setMessages(chatId, query.data);
    }
  }, [chatId, query.data, setMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const msg = rowToMessage(payload.new as MessageRow);
          prependMessage(chatId, msg);
          // Bump the chat list cache so unread/last message refresh next visit
          qc.invalidateQueries({ queryKey: ['my-chats'] });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const msg = rowToMessage(payload.new as MessageRow);
          patchMessage(chatId, msg.id, msg);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, prependMessage, patchMessage, qc]);

  return query;
}
