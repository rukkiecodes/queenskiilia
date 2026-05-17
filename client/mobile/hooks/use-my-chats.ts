import { useQuery } from '@tanstack/react-query';

import { chatApi } from '@/lib/chat-api';

export const useMyChats = () =>
  useQuery({
    queryKey: ['my-chats'],
    queryFn: () => chatApi.myChats(),
    staleTime: 1000 * 15,
  });
