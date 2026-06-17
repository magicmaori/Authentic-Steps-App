import { Stack } from 'expo-router';

export default function RitualLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="gratitude" />
      <Stack.Screen name="intention" />
      <Stack.Screen name="iamstatement" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
