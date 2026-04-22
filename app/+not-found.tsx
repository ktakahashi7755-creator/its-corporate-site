import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../src/constants/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'ページが見つかりません' }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🔍</Text>
        <Text style={styles.title}>ページが見つかりません</Text>
        <Link href="/(tabs)" style={styles.link}>
          <Text style={styles.linkText}>ホームに戻る</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 18, color: Colors.textPrimary, marginBottom: 24 },
  link: {},
  linkText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
});
