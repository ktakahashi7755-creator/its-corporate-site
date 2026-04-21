import { Stack } from 'expo-router';

export default function PrintScanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
