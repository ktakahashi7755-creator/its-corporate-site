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

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!displayName.trim()) e.displayName = 'お名前を入力してください';
    if (!email.trim()) e.email = 'メールアドレスを入力してください';
    if (!password) e.password = 'パスワードを入力してください';
    if (password.length < 8) e.password = 'パスワードは8文字以上で入力してください';
    if (password !== confirmPassword) e.confirmPassword = 'パスワードが一致しません';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('登録エラー', error.message);
    } else {
      Alert.alert(
        '登録完了',
        `確認メールを ${email} に送信しました。\nメール内のリンクをタップしてアカウントを有効化してください。`,
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <Text style={styles.heading}>新規登録</Text>
          <Text style={styles.subheading}>ふぁみりんくへようこそ！</Text>

          <Input
            label="お名前（ニックネーム可）"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="例：ひろみ"
            leftIcon="person-outline"
            error={errors.displayName}
          />
          <Input
            label="メールアドレス"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="example@mail.com"
            leftIcon="mail-outline"
            error={errors.email}
          />
          <Input
            label="パスワード（8文字以上）"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="パスワード"
            leftIcon="lock-closed-outline"
            error={errors.password}
          />
          <Input
            label="パスワード（確認）"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="パスワード（もう一度）"
            leftIcon="lock-closed-outline"
            error={errors.confirmPassword}
          />

          <Text style={styles.note}>
            登録することで、
            <Text style={styles.noteLink}>利用規約</Text>
            および
            <Text style={styles.noteLink}>プライバシーポリシー</Text>
            に同意したことになります。
          </Text>

          <Button
            label="アカウントを作成"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            size="lg"
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>すでにアカウントをお持ちの方 </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginLink}>ログイン</Text>
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
  backBtn: { marginBottom: Spacing.md, width: 40 },
  heading: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subheading: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  note: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginVertical: Spacing.md,
    lineHeight: 18,
  },
  noteLink: { color: Colors.primary, textDecorationLine: 'underline' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  loginText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  loginLink: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
});
