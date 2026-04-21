import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useFamilyStore } from '../store/familyStore';
import { Colors } from '../constants/colors';

export default function Index() {
  const { session, loading } = useAuthStore();
  const family = useFamilyStore((s) => s.family);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  if (!family) {
    return <Redirect href="/setup/family" />;
  }

  return <Redirect href="/(main)" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
});
