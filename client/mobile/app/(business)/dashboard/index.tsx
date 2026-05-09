import { ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';

export default function BusinessDashboard() {
  const user = useAuthStore((s) => s.user);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
      style={{ flex: 1, backgroundColor: colors.canvas }}
    >
      <ThemedText font={fonts.bold} size="title2" color="ink">
        Welcome back
      </ThemedText>
      <ThemedText font={fonts.regular} size="body" color="inkMuted48" selectable>
        Signed in as {user?.email}
      </ThemedText>
      <ThemedText font={fonts.regular} size="callout" color="inkMuted48">
        Active projects, talent matches, and spend at a glance will appear here.
      </ThemedText>
    </ScrollView>
  );
}
