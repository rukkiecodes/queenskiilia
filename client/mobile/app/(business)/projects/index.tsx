import { ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

export default function BusinessProjects() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm }}
      style={{ flex: 1, backgroundColor: colors.canvas }}
    >
      <ThemedText font={fonts.bold} size="title3" color="ink">
        Your projects
      </ThemedText>
      <ThemedText font={fonts.regular} size="body" color="inkMuted48">
        Post a project, review applications, and track progress. Coming in feature 05.
      </ThemedText>
    </ScrollView>
  );
}
