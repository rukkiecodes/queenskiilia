import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

/**
 * Gear button rendered in tab Stack headers. Pushes to the shared settings
 * screen. Until Batch 3.4 lands a bell + notifications, this is the user's
 * primary path off the tabs (sign-out, profile, verification all live in
 * settings).
 */
export function HeaderSettingsButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/(shared)/settings')}
      hitSlop={8}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.sm,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Image
        source="sf:gearshape"
        tintColor={colors.primary}
        style={{ width: 22, height: 22 }}
      />
    </Pressable>
  );
}
