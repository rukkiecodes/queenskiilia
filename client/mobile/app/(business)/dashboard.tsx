import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';

export default function BusinessDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
      style={{ flex: 1, backgroundColor: colors.canvas }}
    >
      <ThemedText font={fonts.bold} size="title2" color="ink">
        Business dashboard
      </ThemedText>
      <ThemedText font={fonts.regular} size="body" color="inkMuted48" selectable>
        Signed in as {user?.email}
      </ThemedText>
      <View style={{ marginTop: spacing.xxl }}>
        <Button
          label="Settings"
          variant="ghost"
          onPress={() => router.push('/(business)/settings')}
          fullWidth
        />
      </View>
    </ScrollView>
  );
}
