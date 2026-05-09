import { ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

export default function StudentProjects() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm }}
      style={{ flex: 1, backgroundColor: colors.canvas }}
    >
      <ThemedText font={fonts.bold} size="title3" color="ink">
        Browse open projects
      </ThemedText>
      <ThemedText font={fonts.regular} size="body" color="inkMuted48">
        The student marketplace lands in feature 04. You’ll see open projects, filters, and an apply
        flow here.
      </ThemedText>
    </ScrollView>
  );
}
