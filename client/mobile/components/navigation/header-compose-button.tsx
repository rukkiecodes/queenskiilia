import { Image } from 'expo-image';
import { Pressable } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

type Props = {
  onPress: () => void;
};

/**
 * Apple-Mail-style compose button rendered next to the bell on header right.
 * The icon is `square.and.pencil`; press opens the create flow.
 */
export function HeaderComposeButton({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.sm,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Image
        source="sf:square.and.pencil"
        tintColor={colors.primary}
        style={{ width: 22, height: 22 }}
      />
    </Pressable>
  );
}
