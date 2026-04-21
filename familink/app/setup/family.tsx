import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useFamilyStore } from '../../store/familyStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { generateInviteCode } from '../../lib/utils';

export default function FamilySetupScreen() {
  const user = useAuthStore((s) => s.user);
  const fetchFamily = useFamilyStore((s) => s.fetchFamily);
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const displayName = user?.user_metadata?.display_name ?? 'ユーザー';

  const handleCreate = async () => {
    if (!familyName.trim()) {
      Alert.alert('エラー', '家族の名前を入力してください');
      return;
    }
    if (!user) return;
    setLoading(true);

    const { data: family, error: familyErr } = await supabase
      .from('families')
      .insert({ name: familyName, invite_code: generateInviteCode(), owner_id: user.id })
      .select()
      .single();

    if (familyErr || !family) {
      Alert.alert('エラー', familyErr?.message ?? '家族の作成に失敗しました');
      setLoading(false);
      return;
    }

    await supabase.from('family_members').insert({
      family_id: family.id,
      user_id: user.id,
      role: 'owner',
      display_name: displayName,
    });

    await fetchFamily(user.id);
    setLoading(false);
    router.replace('/setup/children');
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('エラー', '招待コードを入力してください');
      return;
    }
    if (!user) return;
    setLoading(true);

    const { data: family, error } = await supabase
      .from('families')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (error || !family) {
      Alert.alert('エラー', '招待コードが正しくありません');
      setLoading(false);
      return;
    }

    const { error: joinErr } = await supabase.from('family_members').insert({
      family_id: family.id,
      user_id: user.id,
      role: 'member',
      display_name: displayName,
    });

    if (joinErr) {
      Alert.alert('エラー', '参加に失敗しました。すでに参加済みかもしれません。');
      setLoading(false);
      return;
    }

    await fetchFamily(user.id);
    setLoading(false);
    router.replace('/(main)');
  };

  if (mode === 'choice') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.iconArea}>
            <Ionicons name="home-outline" size={64} color={Colors.primary} />
          </View>
          <Text style={styles.title}>家族を設定しよう</Text>
          <Text style={styles.subtitle}>
            {displayName}さん、ようこそ！{'\n'}
            まず家族グループを作成するか、{'\n'}
            招待コードで既存の家族に参加してください。
          </Text>

          <View style={styles.choiceArea}>
            <Card style={styles.choiceCard}>
              <TouchableChoice
                icon="add-circle-outline"
                label="家族グループを作成する"
                description="はじめての方はこちら"
                onPress={() => setMode('create')}
                color={Colors.primary}
              />
            </Card>
            <Card style={styles.choiceCard}>
              <TouchableChoice
                icon="enter-outline"
                label="招待コードで参加する"
                description="家族から招待された方はこちら"
                onPress={() => setMode('join')}
                color={Colors.secondary}
              />
            </Card>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'create') {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.iconArea}>
              <Ionicons name="home-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.title}>家族グループを作成</Text>
            <Text style={styles.subtitle}>家族の名前を決めましょう</Text>

            <Input
              label="家族の名前"
              value={familyName}
              onChangeText={setFamilyName}
              placeholder="例：山田家、ひろみファミリー"
              leftIcon="home-outline"
            />

            <Button label="作成する" onPress={handleCreate} loading={loading} fullWidth size="lg" />
            <Button label="もどる" onPress={() => setMode('choice')} variant="ghost" fullWidth />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.iconArea}>
            <Ionicons name="enter-outline" size={48} color={Colors.secondary} />
          </View>
          <Text style={styles.title}>招待コードで参加</Text>
          <Text style={styles.subtitle}>家族から受け取った招待コードを入力してください</Text>

          <Input
            label="招待コード"
            value={inviteCode}
            onChangeText={(t) => setInviteCode(t.toUpperCase())}
            placeholder="例：ABC123"
            autoCapitalize="characters"
            leftIcon="key-outline"
          />

          <Button label="参加する" onPress={handleJoin} loading={loading} fullWidth size="lg" />
          <Button label="もどる" onPress={() => setMode('choice')} variant="ghost" fullWidth />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import { TouchableOpacity } from 'react-native';

function TouchableChoice({ icon, label, description, onPress, color }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.choiceRow} activeOpacity={0.8}>
      <View style={[styles.choiceIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={styles.choiceText}>
        <Text style={styles.choiceLabel}>{label}</Text>
        <Text style={styles.choiceDesc}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  iconArea: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  choiceArea: { width: '100%', gap: Spacing.sm },
  choiceCard: { padding: Spacing.sm },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.sm },
  choiceIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: { flex: 1 },
  choiceLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  choiceDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
});
