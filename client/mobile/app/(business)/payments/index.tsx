import { ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

export default function BusinessPayments() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm }}
      style={{ flex: 1, backgroundColor: colors.canvas }}
    >
      <ThemedText font={fonts.bold} size="title3" color="ink">
        Escrow & payments
      </ThemedText>
      <ThemedText font={fonts.regular} size="body" color="inkMuted48">
        Fund escrow, release milestone payments, view receipts. Coming in feature 10.
      </ThemedText>
    </ScrollView>
  );
}
