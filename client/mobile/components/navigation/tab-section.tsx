import { Stack } from 'expo-router/stack';

import { HeaderSettingsButton } from './header-settings-button';
import { NotificationBell } from './notification-bell';

type Props = {
  /** Title for the index screen of this tab. */
  title: string;
};

/**
 * Default Stack layout for a single NativeTabs tab. Renders a header on the
 * index screen with settings on the left and a notification bell on the right.
 * Sub-routes inherit the Stack but can override their own header via
 * `<Stack.Screen options={...}>`.
 */
export function TabSection({ title }: Props) {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLeft: () => <HeaderSettingsButton />,
        headerRight: () => <NotificationBell />,
      }}
    >
      <Stack.Screen name="index" options={{ title }} />
    </Stack>
  );
}
