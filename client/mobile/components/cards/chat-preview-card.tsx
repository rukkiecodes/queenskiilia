import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useUser } from '@/hooks/use-user';
import { useAuthStore } from '@/store/auth-store';
import type { Chat } from '@/lib/chat-api';

type Props = {
  chat: Chat;
  onPress: () => void;
};

export function ChatPreviewCard({ chat, onPress }: Props) {
  const myId = useAuthStore((s) => s.user?.id);
  const otherId = myId === chat.studentId ? chat.businessId : chat.studentId;
  const other = useUser(otherId);

  const otherName =
    other.data?.businessProfile?.companyName ??
    other.data?.fullName ??
    'Conversation';

  const last = chat.lastMessage;
  const preview = last?.content ?? (last?.attachmentUrls.length ? '📎 Attachment' : 'No messages yet');
  const timestamp = last?.sentAt ?? chat.createdAt;

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
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: colors.canvasParchment,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {other.data?.avatarUrl ? (
          <Image
            source={{ uri: other.data.avatarUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <ThemedText font={fonts.semiBold} size="body" color="inkMuted48">
            {otherName.slice(0, 1).toUpperCase()}
          </ThemedText>
        )}
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
            size="body"
            color="ink"
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {other.isLoading ? 'Loading…' : otherName}
          </ThemedText>
          <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
            {formatRelative(timestamp)}
          </ThemedText>
        </View>
        <ThemedText
          font={fonts.regular}
          size="callout"
          color={chat.unreadCount > 0 ? 'ink' : 'inkMuted48'}
          numberOfLines={1}
        >
          {preview}
        </ThemedText>
      </View>

      {chat.unreadCount > 0 ? (
        <View
          style={{
            minWidth: 22,
            height: 22,
            paddingHorizontal: spacing.xs,
            borderRadius: radius.pill,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ThemedText font={fonts.semiBold} size="caption" color="onPrimary">
            {chat.unreadCount > 99 ? '99+' : String(chat.unreadCount)}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;

  if (ms < min) return 'now';
  if (ms < hr) return `${Math.floor(ms / min)}m`;
  if (ms < day) return `${Math.floor(ms / hr)}h`;
  if (ms < 7 * day) return `${Math.floor(ms / day)}d`;
  return new Date(iso).toLocaleDateString();
}
