import { useMutation, useQueryClient } from '@tanstack/react-query';

import { chatApi, type Message, type SendMessageInput } from '@/lib/chat-api';
import { useAuthStore } from '@/store/auth-store';
import { useChatStore } from '@/store/chat-store';

/**
 * Optimistic send: prepend a `temp-` id message to the store immediately, then
 * replace it with the server response (or remove it on error). The Realtime
 * subscription will de-dupe in case it fires before the mutation resolves.
 */
export const useSendMessage = () => {
  const userId = useAuthStore((s) => s.user?.id);
  const prependMessage = useChatStore((s) => s.prependMessage);
  const replaceMessage = useChatStore((s) => s.replaceMessage);
  const removeMessage = useChatStore((s) => s.removeMessage);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMessageInput) => chatApi.send(input),

    onMutate: (input) => {
      if (!userId) return { tempId: null as string | null };
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimistic: Message = {
        id: tempId,
        chatId: input.chatId,
        senderId: userId,
        content: input.content ?? null,
        attachmentUrls: input.attachmentUrls ?? [],
        isRead: false,
        sentAt: new Date().toISOString(),
      };
      prependMessage(input.chatId, optimistic);
      return { tempId };
    },

    onSuccess: (real, vars, ctx) => {
      if (ctx?.tempId) replaceMessage(vars.chatId, ctx.tempId, real);
      qc.invalidateQueries({ queryKey: ['my-chats'] });
    },

    onError: (_err, vars, ctx) => {
      if (ctx?.tempId) removeMessage(vars.chatId, ctx.tempId);
    },
  });
};

export const useMarkChatRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatApi.markRead(chatId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-chats'] });
    },
  });
};
