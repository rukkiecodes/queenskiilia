import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

type Props = {
  label: string;
  value: string;
};

/** Compact metric tile for dashboard stats rows. */
export function StatTile({ label, value }: Props) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.canvasParchment,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        padding: spacing.base,
        gap: spacing.xxs,
      }}
    >
      <ThemedText
        font={fonts.semiBold}
        size="headline"
        color="ink"
        numberOfLines={1}
      >
        {value}
      </ThemedText>
      <ThemedText
        font={fonts.regular}
        size="caption"
        color="inkMuted48"
        numberOfLines={1}
      >
        {label}
      </ThemedText>
    </View>
  );
}
