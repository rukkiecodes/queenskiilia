import { Stack } from 'expo-router/stack';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: true, title: 'Profile' }} />
      <Stack.Screen
        name="edit"
        options={{
          headerShown: true,
          title: 'Edit profile',
          presentation: 'formSheet',
          sheetGrabberVisible: true,
        }}
      />
    </Stack>
  );
}
