import { Stack } from 'expo-router';
import { ActivityIndicator, ScrollView, Switch, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/use-notification-preferences';
import { GraphQLError } from '@/lib/graphql-client';
import type { NotificationCategory } from '@/lib/notifications-api';

type Row = {
  key: NotificationCategory;
  label: string;
  description: string;
};

const ROWS: Row[] = [
  {
    key: 'projectUpdates',
    label: 'Project updates',
    description: 'Applications, selections, deadlines, and submissions.',
  },
  {
    key: 'messages',
    label: 'Messages',
    description: 'New chat messages and replies on existing threads.',
  },
  {
    key: 'payments',
    label: 'Payments',
    description: 'Escrow holds, releases, refunds, and earnings deposits.',
  },
  {
    key: 'system',
    label: 'System',
    description: 'Verification status, disputes, ratings, and app notices.',
  },
];

export default function NotificationsPreferences() {
  const { data, isLoading, error } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Notifications' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.lg,
          gap: spacing.lg,
          flexGrow: 1,
        }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
      >
        <ThemedText font={fonts.regular} size="body" color="inkMuted80">
          Choose which categories deliver notifications. Muting a category
          silences both in-app and push delivery.
        </ThemedText>

        {isLoading ? (
          <View style={{ paddingVertical: spacing.huge, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <EmptyState
            icon="exclamationmark.triangle"
            title="Couldn’t load preferences"
            body={
              error instanceof GraphQLError
                ? error.message
                : 'Pull down to retry.'
            }
          />
        ) : data ? (
          <View
            style={{
              borderRadius: radius.lg,
              borderCurve: 'continuous',
              backgroundColor: colors.surfacePearl,
              overflow: 'hidden',
            }}
          >
            {ROWS.map((row, idx) => (
              <View
                key={row.key}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.base,
                  paddingVertical: spacing.base,
                  paddingHorizontal: spacing.base,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: colors.dividerSoft,
                }}
              >
                <View style={{ flex: 1, gap: spacing.xxs }}>
                  <ThemedText font={fonts.semiBold} size="body" color="ink">
                    {row.label}
                  </ThemedText>
                  <ThemedText
                    font={fonts.regular}
                    size="caption"
                    color="inkMuted48"
                  >
                    {row.description}
                  </ThemedText>
                </View>
                <Switch
                  value={data[row.key]}
                  onValueChange={(value) =>
                    update.mutate({ [row.key]: value } as Partial<
                      Record<NotificationCategory, boolean>
                    >)
                  }
                  trackColor={{ false: colors.hairline, true: colors.primary }}
                  ios_backgroundColor={colors.hairline}
                />
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}
