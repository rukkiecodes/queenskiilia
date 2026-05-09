import { ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

export default function SkillTestIndex() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm }}
      style={{ flex: 1, backgroundColor: colors.canvas }}
    >
      <ThemedText font={fonts.bold} size="title3" color="ink">
        Skill assessments
      </ThemedText>
      <ThemedText font={fonts.regular} size="body" color="inkMuted48">
        Take a short test to unlock higher-tier projects. Coming in feature 06.
      </ThemedText>
    </ScrollView>
  );
}
