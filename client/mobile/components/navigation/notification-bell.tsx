import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useNotificationStore } from '@/store/notification-store';

/**
 * Bell button rendered on the right of every tab Stack header. Pushes to the
 * shared notifications screen. Shows a dot badge with unread count when
 * `notificationStore.unreadCount > 0`.
 */
export function NotificationBell() {
  const router = useRouter();
  const count = useNotificationStore((s) => s.unreadCount);
  const display = count > 99 ? '99+' : String(count);

  return (
    <Pressable
      onPress={() => router.push('/(shared)/notifications')}
      hitSlop={8}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.sm,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View>
        <Image
          source="sf:bell"
          tintColor={colors.primary}
          style={{ width: 22, height: 22 }}
        />
        {count > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -8,
              minWidth: 16,
              height: 16,
              paddingHorizontal: spacing.xxs,
              borderRadius: radius.pill,
              backgroundColor: colors.danger,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ThemedText
              font={fonts.semiBold}
              size="micro"
              color="onPrimary"
              style={{ lineHeight: 16 }}
            >
              {display}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
