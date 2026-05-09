import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { colors, type ColorToken } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
};

type Style = {
  bg: ColorToken;
  fg: ColorToken;
  border?: ColorToken;
};

const styles: Record<Variant, Style> = {
  primary: { bg: 'primary', fg: 'onPrimary' },
  outline: { bg: 'canvas', fg: 'primary', border: 'primary' },
  ghost:   { bg: 'canvas', fg: 'primary' },
  danger:  { bg: 'danger', fg: 'onPrimary' },
};

const SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

export function Button({
  label,
  variant = 'primary',
  loading,
  disabled,
  fullWidth,
  leftIcon,
  onPress,
  ...rest
}: Props) {
  const s = styles[variant];
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ alignSelf: fullWidth ? 'stretch' : 'auto' }, animatedStyle]}>
      <Pressable
        {...rest}
        disabled={isDisabled}
        onPressIn={() => {
          if (!isDisabled) scale.value = withSpring(0.95, SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING);
        }}
        onPress={(e) => {
          if (process.env.EXPO_OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
          onPress?.(e);
        }}
        style={{
          backgroundColor: colors[s.bg],
          borderColor: s.border ? colors[s.border] : 'transparent',
          borderWidth: s.border ? 1 : 0,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          borderRadius: radius.pill,
          borderCurve: 'continuous',
          opacity: isDisabled ? 0.5 : 1,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: spacing.sm,
        }}
      >
        {loading ? (
          <ActivityIndicator color={colors[s.fg]} />
        ) : (
          <>
            {leftIcon ? <View>{leftIcon}</View> : null}
            <ThemedText font={fonts.regular} size="body" color={s.fg}>
              {label}
            </ThemedText>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
