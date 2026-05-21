import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { parseDate } from '@/lib/format-deadline';
import { notificationIcon, type Notification } from '@/lib/notifications-api';

type Props = {
  notification: Notification;
  onPress: () => void;
};

export function NotificationCard({ notification, onPress }: Props) {
  const unread = !notification.isRead;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: spacing.base,
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.canvas,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.canvasParchment,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={`sf:${notificationIcon(notification.type)}`}
          tintColor={colors.primary}
          style={{ width: 20, height: 20 }}
        />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          <ThemedText
            font={fonts.semiBold}
            size="callout"
            color="ink"
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {notification.title}
          </ThemedText>
          <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
            {formatRelative(notification.createdAt)}
          </ThemedText>
        </View>
        <ThemedText
          font={fonts.regular}
          size="caption"
          color="inkMuted48"
          numberOfLines={2}
        >
          {notification.body}
        </ThemedText>
      </View>

      {unread ? (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.primary,
          }}
        />
      ) : null}
    </Pressable>
  );
}

function formatRelative(value: string): string {
  const then = parseDate(value).getTime();
  if (Number.isNaN(then)) return '';

  const ms = Date.now() - then;
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;

  if (ms < min) return 'now';
  if (ms < hr) return `${Math.floor(ms / min)}m`;
  if (ms < day) return `${Math.floor(ms / hr)}h`;
  if (ms < 7 * day) return `${Math.floor(ms / day)}d`;
  return parseDate(value).toLocaleDateString();
}
