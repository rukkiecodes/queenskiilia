import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

export default function RateStub() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  return (
    <>
      <Stack.Screen options={{ presentation: 'formSheet', title: 'Rate' }} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
      >
        <ThemedText font={fonts.semiBold} size="title3" color="ink">
          Rate your experience
        </ThemedText>
        <ThemedText font={fonts.regular} size="body" color="inkMuted48">
          Rating + comment form lands in feature 12.
        </ThemedText>
        <ThemedText font={fonts.regular} size="caption" color="inkMuted48">
          Project: {projectId}
        </ThemedText>
      </ScrollView>
    </>
  );
}
