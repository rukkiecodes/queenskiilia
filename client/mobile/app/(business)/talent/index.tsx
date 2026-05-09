import { ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

export default function BusinessTalent() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm }}
      style={{ flex: 1, backgroundColor: colors.canvas }}
    >
      <ThemedText font={fonts.bold} size="title3" color="ink">
        Find talent
      </ThemedText>
      <ThemedText font={fonts.regular} size="body" color="inkMuted48">
        Search students by skill, rating, and university. Coming in feature 08.
      </ThemedText>
    </ScrollView>
  );
}
