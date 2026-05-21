import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { notificationsApi } from '@/lib/notifications-api';
import { useNotificationStore } from '@/store/notification-store';

/**
 * Polls the server unread count and mirrors it into the notification store so
 * the tab-header bell badge stays current. Polling stands in for a Realtime
 * subscription — the `notifications` table isn't in the supabase_realtime
 * publication, so push-style delivery isn't available without a DB change.
 *
 * Mount once per authed role layout. The badge itself reads the store.
 */
export const useUnreadCount = () => {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const query = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.unreadCount(),
    staleTime: 1000 * 20,
    refetchInterval: 1000 * 30,
  });

  useEffect(() => {
    if (typeof query.data === 'number') setUnreadCount(query.data);
  }, [query.data, setUnreadCount]);

  return query;
};
