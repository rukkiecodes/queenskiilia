import { Stack } from 'expo-router/stack';

export default function SharedLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
