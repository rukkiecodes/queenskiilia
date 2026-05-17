import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts, fontSize } from '@/constants/typography';

type Props = {
  onSend: (text: string) => void;
  /** Render an attachment trigger on the left (no-op if undefined). */
  onAttach?: () => void;
  /** When true, send button is disabled (during upload, etc). */
  busy?: boolean;
  placeholder?: string;
};

export function ChatInput({ onSend, onAttach, busy, placeholder = 'Message' }: Props) {
  const [value, setValue] = useState('');

  const send = () => {
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    onSend(trimmed);
    setValue('');
  };

  const canSend = value.trim().length > 0 && !busy;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.sm,
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.hairline,
        backgroundColor: colors.canvas,
      }}
    >
      {onAttach ? (
        <Pressable
          onPress={onAttach}
          disabled={busy}
          hitSlop={6}
          style={({ pressed }) => ({
            padding: spacing.xs,
            opacity: pressed ? 0.6 : busy ? 0.4 : 1,
          })}
        >
          <Image
            source="sf:paperclip"
            tintColor={colors.primary}
            style={{ width: 22, height: 22 }}
          />
        </Pressable>
      ) : null}

      <View
        style={{
          flex: 1,
          borderRadius: radius.lg,
          borderCurve: 'continuous',
          backgroundColor: colors.canvasParchment,
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.xs,
          minHeight: 40,
          maxHeight: 120,
          justifyContent: 'center',
        }}
      >
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor={colors.inkMuted48}
          multiline
          style={{
            fontFamily: fonts.regular,
            fontSize: fontSize.body,
            color: colors.ink,
            maxHeight: 100,
          }}
        />
      </View>

      <Pressable
        onPress={send}
        disabled={!canSend}
        hitSlop={6}
        style={({ pressed }) => ({
          width: 36,
          height: 36,
          borderRadius: radius.pill,
          backgroundColor: canSend ? colors.primary : colors.hairline,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Image
          source="sf:arrow.up"
          tintColor={canSend ? colors.onPrimary : colors.inkMuted48}
          style={{ width: 18, height: 18 }}
        />
      </Pressable>
    </View>
  );
}
