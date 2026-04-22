import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/constants/colors';

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('入力エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }
    if (isSignUp && !name) {
      Alert.alert('入力エラー', 'お名前を入力してください');
      return;
    }
    if (password.length < 6) {
      Alert.alert('入力エラー', 'パスワードは6文字以上にしてください');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
        router.replace('/(auth)/onboarding');
      } else {
        await signInWithEmail(email, password);
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      Alert.alert('エラー', e.message ?? 'もう一度お試しください');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>🏠 ふぁみりんく</Text>
            <Text style={styles.tagline}>子どものことを、ひとりで覚えなくていい。</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>{isSignUp ? '新しくはじめる' : 'ログイン'}</Text>

            {isSignUp && (
              <View style={styles.field}>
                <Text style={styles.label}>お名前</Text>
                <TextInput
                  style={styles.input}
                  placeholder="さおり"
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>メールアドレス</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>パスワード（6文字以上）</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
            </View>

            <Button
              title={isSignUp ? '無料で始める' : 'ログイン'}
              onPress={handleSubmit}
              loading={loading}
              style={styles.button}
            />

            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggle}>
              <Text style={styles.toggleText}>
                {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : 'アカウントをお持ちでない方はこちら'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 28, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  tagline: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  input: {
    height: 48,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: { marginTop: 8 },
  toggle: { marginTop: 16, alignItems: 'center' },
  toggleText: { color: Colors.primary, fontSize: 14 },
});
