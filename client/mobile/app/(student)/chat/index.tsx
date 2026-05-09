import { ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

export default function StudentChat() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm }}
      style={{ flex: 1, backgroundColor: colors.canvas }}
    >
      <ThemedText font={fonts.bold} size="title3" color="ink">
        Conversations
      </ThemedText>
      <ThemedText font={fonts.regular} size="body" color="inkMuted48">
        Real-time chat with businesses you’re working with. Coming in feature 09.
      </ThemedText>
    </ScrollView>
  );
}
