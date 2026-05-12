import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { HeaderSettingsButton } from '@/components/navigation/header-settings-button';
import { NotificationBell } from '@/components/navigation/notification-bell';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useTalentFiltersStore } from '@/store/talent-filters-store';

export default function BusinessTalentLayout() {
  const router = useRouter();
  const hasFilters = useTalentFiltersStore(
    (s) => s.skillLevel != null || s.country != null || s.minRating != null,
  );

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLeft: () => <HeaderSettingsButton />,
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              onPress={() => router.push('/(business)/talent/filter')}
              hitSlop={8}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.sm,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Image
                source={hasFilters ? 'sf:line.3.horizontal.decrease.circle.fill' : 'sf:line.3.horizontal.decrease.circle'}
                tintColor={colors.primary}
                style={{ width: 22, height: 22 }}
              />
            </Pressable>
            <NotificationBell />
          </View>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Talent' }} />
    </Stack>
  );
}
