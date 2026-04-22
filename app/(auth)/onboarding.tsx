import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useFamily } from '../../src/hooks/useFamily';
import { supabase } from '../../src/lib/supabase';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/constants/colors';
import { CHILD_COLORS } from '../../src/types';

type Step = 'family' | 'child';

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>('family');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [childName, setChildName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CHILD_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { createFamily, joinFamily, addChild } = useFamily(user?.id);
  const router = useRouter();

  const handleFamily = async () => {
    setLoading(true);
    try {
      if (mode === 'create') {
        if (!familyName.trim()) {
          Alert.alert('入力エラー', '家族名を入力してください');
          return;
        }
        await createFamily(familyName.trim());
      } else {
        if (!inviteCode.trim()) {
          Alert.alert('入力エラー', '招待コードを入力してください');
          return;
        }
        await joinFamily(inviteCode.trim());
      }
      setStep('child');
    } catch (e: any) {
      Alert.alert('エラー', e.message ?? 'もう一度お試しください');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!childName.trim()) {
      Alert.alert('入力エラー', 'お子さんの名前を入力してください');
      return;
    }
    setLoading(true);
    try {
      const child = await addChild({ name: childName.trim(), color: selectedColor });
      if (child && institutionName.trim()) {
        await supabase.from('institutions').insert({
          child_id: child.id,
          name: institutionName.trim(),
          type: 'nursery',
        });
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('エラー', e.message ?? 'もう一度お試しください');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipChild = () => router.replace('/(tabs)');

  if (step === 'family') {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.emoji}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.title}>家族をセットアップ</Text>
            <Text style={styles.desc}>あなたの家族グループを作るか、招待コードで参加しましょう</Text>

            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, mode === 'create' && styles.tabActive]}
                onPress={() => setMode('create')}
              >
                <Text style={[styles.tabText, mode === 'create' && styles.tabTextActive]}>新しく作る</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, mode === 'join' && styles.tabActive]}
                onPress={() => setMode('join')}
              >
                <Text style={[styles.tabText, mode === 'join' && styles.tabTextActive]}>招待コードで参加</Text>
              </TouchableOpacity>
            </View>

            {mode === 'create' ? (
              <View style={styles.field}>
                <Text style={styles.label}>家族名</Text>
                <TextInput
                  style={styles.input}
                  placeholder="田中家"
                  value={familyName}
                  onChangeText={setFamilyName}
                />
              </View>
            ) : (
              <View style={styles.field}>
                <Text style={styles.label}>招待コード（6桁）</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="ABC123"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                  maxLength={6}
                />
              </View>
            )}

            <Button title="次へ →" onPress={handleFamily} loading={loading} style={styles.button} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.emoji}>👶</Text>
          <Text style={styles.title}>お子さんを追加</Text>
          <Text style={styles.desc}>最初のお子さんを登録しましょう（後から追加もできます）</Text>

          <View style={styles.field}>
            <Text style={styles.label}>お子さんの名前</Text>
            <TextInput
              style={styles.input}
              placeholder="さくら"
              value={childName}
              onChangeText={setChildName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>施設名（任意）</Text>
            <TextInput
              style={styles.input}
              placeholder="○○保育園"
              value={institutionName}
              onChangeText={setInstitutionName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>カラー</Text>
            <View style={styles.colors}>
              {CHILD_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>

          <Button title="登録してはじめる 🎉" onPress={handleAddChild} loading={loading} style={styles.button} />
          <TouchableOpacity onPress={handleSkipChild} style={styles.skip}>
            <Text style={styles.skipText}>後で登録する</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  emoji: { fontSize: 56, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  desc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.border, borderRadius: 12, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: Colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '600' },
  field: { marginBottom: 20 },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  input: { height: 48, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  codeInput: { textAlign: 'center', letterSpacing: 4, fontSize: 20, fontWeight: '700' },
  button: { marginTop: 8 },
  skip: { marginTop: 16, alignItems: 'center' },
  skipText: { color: Colors.textSecondary, fontSize: 14 },
  colors: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  colorDot: { width: 40, height: 40, borderRadius: 20 },
  colorSelected: { borderWidth: 3, borderColor: Colors.textPrimary },
});
