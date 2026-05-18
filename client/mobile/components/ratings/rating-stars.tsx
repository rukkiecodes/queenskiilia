import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

type Props = {
  /** Selected score, 1..5. 0 / undefined means not yet picked. */
  value: number | null;
  onChange?: (n: number) => void;
  /** Tap-and-rate when set; otherwise read-only. */
  size?: 'sm' | 'md' | 'lg';
};

const SIZE = { sm: 14, md: 20, lg: 28 } as const;

export function RatingStars({ value, onChange, size = 'md' }: Props) {
  const px = SIZE[size];
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = value != null && n <= value;
        const star = (
          <Image
            source={filled ? 'sf:star.fill' : 'sf:star'}
            tintColor={filled ? colors.primary : colors.inkMuted48}
            style={{ width: px, height: px }}
          />
        );
        if (!onChange) return <View key={n}>{star}</View>;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            hitSlop={8}
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.85 : 1 }],
            })}
          >
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}
