import { Stack, useRouter, type Href } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

import { NotificationCard } from '@/components/cards/notification-card';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useMarkAllAsRead } from '@/hooks/use-mark-all-as-read';
import { useMarkAsRead } from '@/hooks/use-mark-as-read';
import { useMyNotifications } from '@/hooks/use-my-notifications';
import { GraphQLError } from '@/lib/graphql-client';
import { notificationRoute, type Notification } from '@/lib/notifications-api';
import { useNotificationStore } from '@/store/notification-store';

export default function Notifications() {
  const router = useRouter();
  const { data, isLoading, isFetching, error, refetch } = useMyNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const notifications = data ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  const onMarkAll = () => {
    setUnreadCount(0);
    markAllAsRead.mutate();
  };

  const onTap = (n: Notification) => {
    if (!n.isRead) markAsRead.mutate(n.id);
    const route = notificationRoute(n);
    if (route) router.push(route as Href);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerRight: () =>
            hasUnread ? (
              <Button
                label="Mark all read"
                variant="ghost"
                onPress={onMarkAll}
              />
            ) : null,
        }}
      />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{
          paddingVertical: spacing.sm,
          flexGrow: 1,
        }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
        renderItem={({ item }) => (
          <NotificationCard notification={item} onPress={() => onTap(item)} />
        )}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 1,
              backgroundColor: colors.dividerSoft,
              marginLeft: spacing.lg + 40 + spacing.base,
            }}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View
              style={{ paddingVertical: spacing.huge, alignItems: 'center' }}
            >
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <EmptyState
              icon="exclamationmark.triangle"
              title="Couldn’t load notifications"
              body={
                error instanceof GraphQLError
                  ? error.message
                  : 'Pull down to retry.'
              }
            />
          ) : (
            <EmptyState
              icon="bell"
              title="You’re all caught up"
              body="Project updates, messages, and approvals will land here."
            />
          )
        }
      />
    </>
  );
}
