import { useQuery } from '@tanstack/react-query';

import { notificationsApi } from '@/lib/notifications-api';

export const useMyNotifications = () =>
  useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsApi.list(),
    staleTime: 1000 * 15,
  });
