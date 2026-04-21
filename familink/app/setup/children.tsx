import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFamilyStore } from '../../store/familyStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { ChildColorPicker } from '../../components/ui/ChildColorPicker';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import type { ChildColor } from '../../types';

export default function ChildrenSetupScreen() {
  const { family, addChild, children } = useFamilyStore();
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [color, setColor] = useState<ChildColor>('#FF6B9D');
  const [school, setSchool] = useState('');
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'お子さんの名前を入力してください';
    if (!birthDate.trim()) e.birthDate = '生年月日を入力してください';
    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      e.birthDate = 'YYYY-MM-DD形式で入力してください（例：2020-04-01）';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate() || !family) return;
    setLoading(true);
    await addChild({
      family_id: family.id,
      name,
      birth_date: birthDate,
      color,
      school_name: school || undefined,
      class_name: className || undefined,
    });
    setLoading(false);
    setName('');
    setBirthDate('');
    setColor('#FF6B9D');
    setSchool('');
    setClassName('');
    Alert.alert('追加しました！', `${name}ちゃんを登録しました。`);
  };

  const handleDone = () => {
    router.replace('/(main)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>お子さんを登録</Text>
          <Text style={styles.subtitle}>
            複数のお子さんを登録できます。{'\n'}後から追加・変更も可能です。
          </Text>

          {/* Existing children */}
          {children.length > 0 && (
            <View style={styles.existingArea}>
              <Text style={styles.existingLabel}>登録済み</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {children.map((child) => (
                  <View key={child.id} style={[styles.existingChip, { borderColor: child.color }]}>
                    <Avatar name={child.name} color={child.color} size={28} />
                    <Text style={styles.existingName}>{child.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Avatar preview */}
          <View style={styles.previewArea}>
            <Avatar name={name || '?'} color={color} size={72} />
            <Text style={styles.previewName}>{name || 'お子さんの名前'}</Text>
          </View>

          <Input
            label="お子さんの名前"
            value={name}
            onChangeText={setName}
            placeholder="例：はなこ"
            leftIcon="person-outline"
            error={errors.name}
          />
          <Input
            label="生年月日"
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="例：2020-04-01"
            keyboardType="numeric"
            leftIcon="calendar-outline"
            error={errors.birthDate}
          />
          <Input
            label="保育園・幼稚園・学校名（任意）"
            value={school}
            onChangeText={setSchool}
            placeholder="例：さくら保育園"
            leftIcon="school-outline"
          />
          <Input
            label="クラス名（任意）"
            value={className}
            onChangeText={setClassName}
            placeholder="例：ゆり組、1年2組"
            leftIcon="people-outline"
          />

          <Text style={styles.colorLabel}>カラー</Text>
          <ChildColorPicker selected={color} onSelect={setColor} />

          <View style={styles.btnArea}>
            <Button
              label="このお子さんを追加する"
              onPress={handleAdd}
              loading={loading}
              fullWidth
              size="lg"
            />
            <Button
              label={children.length > 0 ? 'ホームへ進む' : 'スキップ（後で追加）'}
              onPress={handleDone}
              variant="ghost"
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: Spacing.xl, gap: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24, marginBottom: Spacing.sm },
  existingArea: { marginBottom: Spacing.sm },
  existingLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs },
  existingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginRight: Spacing.sm,
  },
  existingName: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.semibold },
  previewArea: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  previewName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  colorLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 6,
    marginTop: Spacing.sm,
  },
  btnArea: { marginTop: Spacing.md, gap: Spacing.sm },
});
