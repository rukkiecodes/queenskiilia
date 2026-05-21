import { useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationsApi } from '@/lib/notifications-api';

export const useMarkAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
