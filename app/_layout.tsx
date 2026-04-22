import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useAuth } from '../src/hooks/useAuth';
import { Colors } from '../src/constants/colors';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';

    if (!session && !inAuth) {
      router.replace('/(auth)/login');
    } else if (session && inAuth) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="print-scan"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: true,
            title: '通知',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
          }}
        />
        <Stack.Screen
          name="child/[id]"
          options={{
            headerShown: true,
            title: '子ども詳細',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
          }}
        />
        <Stack.Screen
          name="health/[childId]"
          options={{
            headerShown: true,
            title: '体調記録',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
          }}
        />
        <Stack.Screen
          name="preparation/index"
          options={{
            headerShown: true,
            title: '明日の準備',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
