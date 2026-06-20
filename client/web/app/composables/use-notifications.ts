import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { notificationsApi } from '~/lib/notifications-api'
import { useNotificationsStore } from '~/stores/notifications'
import type { Notification, NotificationCategory } from '~/types/notification'

const PAGE_SIZE = 30

export function useNotifications() {
  const query = useInfiniteQuery({
    queryKey: ['myNotifications'],
    queryFn: ({ pageParam }) => notificationsApi.list({ limit: PAGE_SIZE, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: Notification[], allPages: Notification[][]) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
  })
  const notifications = computed<Notification[]>(() => query.data.value?.pages.flat() ?? [])
  return { query, notifications }
}

export function useMarkAsRead() {
  const qc = useQueryClient()
  const store = useNotificationsStore()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      store.decrement()
      qc.invalidateQueries({ queryKey: ['myNotifications'] })
    },
  })
}

export function useMarkAllAsRead() {
  const qc = useQueryClient()
  const store = useNotificationsStore()
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      store.reset()
      qc.invalidateQueries({ queryKey: ['myNotifications'] })
    },
  })
}

/* ── Preferences ───────────────────────────────────────── */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: () => notificationsApi.getPreferences(),
  })
}

export function useUpdatePreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<Record<NotificationCategory, boolean>>) =>
      notificationsApi.updatePreferences(input),
    onSuccess: (prefs) => qc.setQueryData(['notificationPreferences'], prefs),
  })
}
