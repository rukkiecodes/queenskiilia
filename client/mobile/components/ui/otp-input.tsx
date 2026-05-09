import { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts, fontSize } from '@/constants/typography';

type Props = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  autoFocus?: boolean;
};

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  autoFocus = true,
}: Props) {
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (error) {
      shake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [error, shake]);

  useEffect(() => {
    if (value.length === length) onComplete?.(value);
  }, [value, length, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const digits = Array.from({ length }).map((_, i) => value[i] ?? '');

  return (
    <View>
      <Animated.View style={[{ flexDirection: 'row', gap: spacing.sm }, animatedStyle]}>
        {digits.map((d, i) => {
          const isActive = focused && value.length === i;
          const borderColor = error
            ? colors.danger
            : isActive
              ? colors.primary
              : colors.hairline;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                aspectRatio: 1,
                borderWidth: 1,
                borderColor,
                borderRadius: radius.md,
                borderCurve: 'continuous',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.canvas,
              }}
            >
              <Animated.Text
                style={{
                  fontFamily: fonts.semiBold,
                  fontSize: fontSize.title3,
                  color: colors.ink,
                }}
              >
                {d}
              </Animated.Text>
            </View>
          );
        })}
      </Animated.View>

      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus={autoFocus}
        maxLength={length}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0,
        }}
      />
    </View>
  );
}
