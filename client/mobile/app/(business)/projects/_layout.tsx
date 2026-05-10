import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';

import { HeaderComposeButton } from '@/components/navigation/header-compose-button';
import { HeaderSettingsButton } from '@/components/navigation/header-settings-button';
import { NotificationBell } from '@/components/navigation/notification-bell';

export default function BusinessProjectsLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLeft: () => <HeaderSettingsButton />,
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <HeaderComposeButton
              onPress={() => router.push('/(business)/projects/create')}
            />
            <NotificationBell />
          </View>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Projects' }} />
    </Stack>
  );
}
