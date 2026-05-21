import { useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationsApi } from '@/lib/notifications-api';

export const useMarkAllAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
