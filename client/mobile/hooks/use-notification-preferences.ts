import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  notificationsApi,
  type NotificationCategory,
  type NotificationPreferences,
} from '@/lib/notifications-api';

const KEY = ['notifications', 'preferences'] as const;

export const useNotificationPreferences = () =>
  useQuery({
    queryKey: KEY,
    queryFn: () => notificationsApi.getPreferences(),
    // Preferences rarely change; stay fresh for the length of a typical
    // settings visit so toggles don't refetch each interaction.
    staleTime: 1000 * 60 * 5,
  });

export const useUpdateNotificationPreferences = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Pick<NotificationPreferences, NotificationCategory>>) =>
      notificationsApi.updatePreferences(input),
    // Optimistic toggle — flip the cached value the instant the user taps the
    // switch. The mutation returns the canonical row, which then replaces the
    // optimistic snapshot on settle.
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<NotificationPreferences>(KEY);
      if (previous) {
        qc.setQueryData<NotificationPreferences>(KEY, { ...previous, ...input });
      }
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
    },
    onSuccess: (next) => {
      qc.setQueryData(KEY, next);
    },
  });
};
