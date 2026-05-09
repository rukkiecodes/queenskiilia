import { Image } from 'expo-image';
import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts, fontSize } from '@/constants/typography';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
};

export function Input({ label, error, hint, leftIcon, rightIcon, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? colors.danger
    : focused
      ? colors.primary
      : colors.hairline;

  return (
    <View style={{ gap: spacing.xs, alignSelf: 'stretch' }}>
      {label ? (
        <ThemedText font={fonts.semiBold} size="callout" color="ink">
          {label}
        </ThemedText>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor,
          borderRadius: radius.md,
          borderCurve: 'continuous',
          paddingHorizontal: spacing.base,
          backgroundColor: colors.canvas,
          gap: spacing.sm,
        }}
      >
        {leftIcon ? (
          <Image
            source={`sf:${leftIcon}`}
            tintColor={colors.inkMuted48}
            style={{ width: 18, height: 18 }}
          />
        ) : null}
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.inkMuted48}
          style={[
            {
              flex: 1,
              paddingVertical: spacing.md,
              fontFamily: fonts.regular,
              fontSize: fontSize.body,
              color: colors.ink,
            },
            style,
          ]}
        />
        {rightIcon ? (
          <Image
            source={`sf:${rightIcon}`}
            tintColor={colors.inkMuted48}
            style={{ width: 18, height: 18 }}
          />
        ) : null}
      </View>

      {error ? (
        <ThemedText font={fonts.regular} size="caption" color="danger" selectable>
          {error}
        </ThemedText>
      ) : hint ? (
        <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}
