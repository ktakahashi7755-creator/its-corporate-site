import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('ログインエラー', error.message === 'Invalid login credentials'
        ? 'メールアドレスまたはパスワードが正しくありません'
        : error.message);
    }
    // Auth state change will trigger redirect via _layout
  };

  const handleGoogleLogin = async () => {
    Alert.alert('Googleログイン', 'EAS Build後に有効になります。\nまずはメールアドレスでご登録ください。');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Ionicons name="heart-circle" size={56} color={Colors.primary} />
            </View>
            <Text style={styles.appName}>ふぁみりんく</Text>
            <Text style={styles.tagline}>家族みんなで子育てを</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.heading}>ログイン</Text>

            <Input
              label="メールアドレス"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              placeholder="example@mail.com"
            />
            <Input
              label="パスワード"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              leftIcon="lock-closed-outline"
              placeholder="パスワード"
            />

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>パスワードを忘れた方はこちら</Text>
            </TouchableOpacity>

            <Button label="ログイン" onPress={handleLogin} loading={loading} fullWidth size="lg" />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>または</Text>
              <View style={styles.divider} />
            </View>

            {/* Google Login */}
            <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin}>
              <Ionicons name="logo-google" size={20} color={Colors.text} />
              <Text style={styles.socialBtnText}>Googleでログイン</Text>
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>アカウントをお持ちでない方 </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>新規登録</Text>
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
  container: { flexGrow: 1, padding: Spacing.xl },
  logoArea: { alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.xl },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
  },
  tagline: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4 },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: Spacing.lg,
  },
  heading: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: Spacing.md, marginTop: -Spacing.sm },
  forgotText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: Spacing.sm, fontSize: FontSize.sm, color: Colors.textLight },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  socialBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.text },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  registerLink: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
});
