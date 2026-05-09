import { Stack, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';

export default function Settings() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Settings' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
        style={{ flex: 1, backgroundColor: colors.canvas }}
      >
        <ThemedText font={fonts.regular} size="body" color="inkMuted48" selectable>
          Signed in as {user?.email}
        </ThemedText>

        <Button
          label="View profile"
          variant="ghost"
          onPress={() => router.push('/(shared)/profile/index')}
          fullWidth
        />
        <Button
          label="Verification"
          variant="ghost"
          onPress={() => router.push('/(shared)/verification/index')}
          fullWidth
        />

        <View style={{ marginTop: spacing.xxl }}>
          <Button label="Sign out" variant="outline" onPress={logout} fullWidth />
        </View>
      </ScrollView>
    </>
  );
}
