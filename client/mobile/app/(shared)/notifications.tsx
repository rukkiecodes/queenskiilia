import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useNotificationStore } from '@/store/notification-store';

export default function Notifications() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const increment = useNotificationStore((s) => s.increment);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerRight: () =>
            unreadCount > 0 ? (
              <Button
                label="Mark all read"
                variant="ghost"
                onPress={markAllRead}
              />
            ) : null,
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: spacing.xl,
          gap: spacing.lg,
          flexGrow: 1,
        }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
      >
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.base,
            paddingVertical: spacing.huge,
          }}
        >
          <Image
            source="sf:bell"
            tintColor={colors.inkMuted48}
            style={{ width: 48, height: 48 }}
          />
          <ThemedText font={fonts.semiBold} size="title3" color="ink">
            You’re all caught up
          </ThemedText>
          <ThemedText
            font={fonts.regular}
            size="body"
            color="inkMuted48"
            style={{ textAlign: 'center', maxWidth: 280 }}
          >
            Project updates, messages, and approvals will land here once feature 13 is wired up.
          </ThemedText>
        </View>

        <View style={{ gap: spacing.sm }}>
          <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
            Dev: simulate notifications
          </ThemedText>
          <Button
            label="Add a test notification"
            variant="outline"
            onPress={() => increment(1)}
            fullWidth
          />
        </View>
      </ScrollView>
    </>
  );
}
