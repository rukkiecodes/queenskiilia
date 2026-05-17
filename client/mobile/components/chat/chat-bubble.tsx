import { Image } from 'expo-image';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import type { Message } from '@/lib/chat-api';

type Props = {
  message: Message;
  isMine: boolean;
  /** If true, render the "Seen" label below this bubble (used on the last own read message). */
  showSeen?: boolean;
};

const isOptimistic = (id: string) => id.startsWith('temp-');

export function ChatBubble({ message, isMine, showSeen }: Props) {
  const failed = false; // wired later in 9.4 if we add a failure marker

  return (
    <View
      style={{
        alignSelf: isMine ? 'flex-end' : 'flex-start',
        maxWidth: '82%',
        marginVertical: spacing.xxs,
      }}
    >
      <View
        style={{
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.sm,
          borderRadius: radius.lg,
          borderCurve: 'continuous',
          backgroundColor: isMine ? colors.primary : colors.canvasParchment,
        }}
      >
        {message.attachmentUrls.map((url) => (
          <Image
            key={url}
            source={{ uri: url }}
            style={{
              width: 200,
              aspectRatio: 4 / 3,
              borderRadius: radius.md,
              marginBottom: message.content ? spacing.xs : 0,
            }}
            contentFit="cover"
          />
        ))}
        {message.content ? (
          <ThemedText
            font={fonts.regular}
            size="body"
            color={isMine ? 'onPrimary' : 'ink'}
            selectable
          >
            {message.content}
          </ThemedText>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.xs,
          alignSelf: isMine ? 'flex-end' : 'flex-start',
          marginTop: 2,
        }}
      >
        <ThemedText font={fonts.regular} size="micro" color="inkMuted48">
          {formatTime(message.sentAt)}
        </ThemedText>
        {isMine && isOptimistic(message.id) && !failed ? (
          <ThemedText font={fonts.regular} size="micro" color="inkMuted48">
            · Sending…
          </ThemedText>
        ) : null}
        {isMine && showSeen ? (
          <ThemedText font={fonts.regular} size="micro" color="primary">
            · Seen
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
