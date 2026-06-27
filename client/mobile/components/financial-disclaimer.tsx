import { Image } from 'expo-image';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

/**
 * Footer note shown on payment-related screens to satisfy Google Play §3
 * (Financial Services Policy). Sets the user-facing expectation that
 * QueenSkiilia is a marketplace, not a regulated financial institution.
 */
export function FinancialDisclaimer() {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        padding: spacing.base,
        borderRadius: radius.lg,
        borderCurve: 'continuous',
        backgroundColor: colors.canvasParchment,
      }}
    >
      <Image
        source="sf:info.circle"
        tintColor={colors.inkMuted48}
        style={{ width: 16, height: 16, marginTop: 2 }}
      />
      <ThemedText
        font={fonts.regular}
        size="caption"
        color="inkMuted80"
        style={{ flex: 1 }}
      >
        QueenSkiilia is not a bank. Escrow is facilitated by Paystack and the
        platform takes a 10–15% commission on each project. See the Terms for
        refund and dispute policy.
      </ThemedText>
    </View>
  );
}
