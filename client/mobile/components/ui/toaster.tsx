import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { colors, type ColorToken } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useUiStore } from '@/store/ui-store';

const VARIANT_BG: Record<'info' | 'error' | 'success', ColorToken> = {
  info: 'surfaceTile1',
  error: 'danger',
  success: 'primary',
};

const DISMISS_MS = 3500;

type ToastShape = {
  id: string;
  message: string;
  variant: 'info' | 'error' | 'success';
};

function Toast({ toast, onDismiss }: { toast: ToastShape; onDismiss: (id: string) => void }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-12);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });

    const t = setTimeout(() => onDismiss(toast.id), DISMISS_MS);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          alignSelf: 'center',
          maxWidth: '92%',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.lg,
          borderCurve: 'continuous',
          backgroundColor: colors[VARIANT_BG[toast.variant]],
          marginTop: spacing.sm,
        },
        animatedStyle,
      ]}
    >
      <Pressable onPress={() => onDismiss(toast.id)} hitSlop={8}>
        <ThemedText font={fonts.regular} size="callout" color="onPrimary">
          {toast.message}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export function Toaster() {
  const insets = useSafeAreaInsets();
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top + spacing.sm,
        left: 0,
        right: 0,
      }}
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </View>
  );
}
