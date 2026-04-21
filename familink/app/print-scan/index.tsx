import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase, uploadImage } from '../../lib/supabase';
import { useFamilyStore } from '../../store/familyStore';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import type { PrintScanResult } from '../../types';

type Step = 'select' | 'scanning' | 'confirm' | 'saving' | 'done';

const EMPTY_RESULT: PrintScanResult = {
  event_name: '',
  event_date: '',
  start_time: '',
  items_to_bring: [],
  submission_deadline: '',
  submission_items: [],
  notes: '',
  summary: '',
  confidence: 0,
};

export default function PrintScanScreen() {
  const { family, children } = useFamilyStore();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<Step>('select');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<PrintScanResult>(EMPTY_RESULT);
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const pickImage = async (fromCamera: boolean) => {
    let result;
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('カメラの許可が必要です');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });
    }

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      await scanImage(result.assets[0].base64 ?? '');
    }
  };

  const scanImage = async (base64: string) => {
    setStep('scanning');
    try {
      // Call Supabase Edge Function for OpenAI Vision
      const { data, error } = await supabase.functions.invoke('scan-print', {
        body: { image_base64: base64 },
      });

      if (error) throw error;

      if (data?.result) {
        setScanResult(data.result as PrintScanResult);
      } else {
        // Fallback: show empty form for manual input
        setScanResult(EMPTY_RESULT);
        Alert.alert('お知らせ', 'AIの読み取りに失敗しました。手動で入力してください。');
      }
    } catch {
      setScanResult(EMPTY_RESULT);
    }
    setStep('confirm');
  };

  const handleSave = async () => {
    if (!family || !user) return;
    setSaving(true);
    setStep('saving');

    // Upload image
    let imageUrl = '';
    if (imageBase64) {
      const path = `documents/${family.id}/${Date.now()}.jpg`;
      imageUrl = await uploadImage('familink', path, imageBase64) ?? '';
    }

    // Save document
    const { data: doc } = await supabase.from('documents').insert({
      family_id: family.id,
      child_id: selectedChildId ?? null,
      title: scanResult.event_name || 'プリント',
      image_url: imageUrl,
      ai_result: scanResult,
      confirmed: true,
      confirmed_by: user.id,
      confirmed_at: new Date().toISOString(),
      created_by: user.id,
    }).select().single();

    // Save event if date exists
    if (scanResult.event_date) {
      await supabase.from('events').insert({
        family_id: family.id,
        child_id: selectedChildId ?? null,
        title: scanResult.event_name || 'プリントのイベント',
        event_date: scanResult.event_date,
        start_time: scanResult.start_time || null,
        all_day: !scanResult.start_time,
        reminder_days: [3, 1, 0],
        created_by: user.id,
        source: 'print_scan',
        document_id: doc?.id ?? null,
      });
    }

    // Save checklist items (items_to_bring)
    if (scanResult.items_to_bring.length > 0 && scanResult.event_date) {
      const items = scanResult.items_to_bring.map((label, i) => ({
        family_id: family.id,
        child_id: selectedChildId ?? null,
        label,
        is_checked: false,
        due_date: scanResult.event_date,
        sort_order: i,
      }));
      await supabase.from('checklist_items').insert(items);
    }

    // Save submission deadlines as tasks
    if (scanResult.submission_items.length > 0) {
      const tasks = scanResult.submission_items.map((title) => ({
        family_id: family.id,
        child_id: selectedChildId ?? null,
        title,
        description: scanResult.submission_deadline ? `提出期限：${scanResult.submission_deadline}` : undefined,
        priority: 'high' as const,
        is_done: false,
        due_date: scanResult.submission_deadline || undefined,
        created_by: user.id,
      }));
      await supabase.from('tasks').insert(tasks);
    }

    setSaving(false);
    setStep('done');
  };

  const handleReset = () => {
    setStep('select');
    setImageUri(null);
    setImageBase64(null);
    setScanResult(EMPTY_RESULT);
    setSelectedChildId(undefined);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>プリント読取</Text>
          <View style={{ width: 24 }} />
        </View>

        {step === 'select' && (
          <View style={styles.selectArea}>
            <View style={styles.iconArea}>
              <Ionicons name="document-text-outline" size={64} color={Colors.primary} />
            </View>
            <Text style={styles.selectTitle}>プリントを読み取ります</Text>
            <Text style={styles.selectSubtitle}>
              AIがプリントの内容を自動読み取りし、{'\n'}
              イベント・持ち物・提出物を登録します。{'\n'}
              読み取り後に確認・修正できます。
            </Text>

            <View style={styles.selectBtns}>
              <TouchableOpacity style={styles.selectBtn} onPress={() => pickImage(true)}>
                <Ionicons name="camera-outline" size={32} color={Colors.primary} />
                <Text style={styles.selectBtnText}>カメラで撮影</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.selectBtn} onPress={() => pickImage(false)}>
                <Ionicons name="images-outline" size={32} color={Colors.secondary} />
                <Text style={styles.selectBtnText}>写真を選択</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'scanning' && (
          <View style={styles.loadingArea}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            )}
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>AIが読み取り中...</Text>
              <Text style={styles.loadingSubtext}>少々お待ちください</Text>
            </View>
          </View>
        )}

        {(step === 'confirm' || step === 'saving') && (
          <ScrollView contentContainerStyle={styles.confirmContent} keyboardShouldPersistTaps="handled">
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.confirmImage} resizeMode="cover" />
            )}

            {/* Confidence indicator */}
            {scanResult.confidence > 0 && (
              <View style={styles.confidenceBanner}>
                <Ionicons
                  name={scanResult.confidence > 0.7 ? 'checkmark-circle' : 'warning'}
                  size={18}
                  color={scanResult.confidence > 0.7 ? Colors.success : Colors.warning}
                />
                <Text style={styles.confidenceText}>
                  AI読取精度：{Math.round(scanResult.confidence * 100)}%
                  {scanResult.confidence < 0.7 ? '内容を必ず確認してください' : '内容を確認してください'}
                </Text>
              </View>
            )}

            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>読み取り結果を確認</Text>

              <FormField label="イベント名">
                <TextInput
                  style={styles.fieldInput}
                  value={scanResult.event_name}
                  onChangeText={(t) => setScanResult((s) => ({ ...s, event_name: t }))}
                  placeholder="イベント名"
                  placeholderTextColor={Colors.textLight}
                />
              </FormField>

              <FormField label="開催日 (YYYY-MM-DD)">
                <TextInput
                  style={styles.fieldInput}
                  value={scanResult.event_date}
                  onChangeText={(t) => setScanResult((s) => ({ ...s, event_date: t }))}
                  placeholder="2024-06-15"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textLight}
                />
              </FormField>

              <FormField label="開始時刻 (HH:MM)">
                <TextInput
                  style={styles.fieldInput}
                  value={scanResult.start_time}
                  onChangeText={(t) => setScanResult((s) => ({ ...s, start_time: t }))}
                  placeholder="09:00"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textLight}
                />
              </FormField>

              <FormField label="持ち物（1行1つ）">
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputMulti]}
                  value={scanResult.items_to_bring.join('\n')}
                  onChangeText={(t) => setScanResult((s) => ({ ...s, items_to_bring: t.split('\n').filter(Boolean) }))}
                  multiline
                  placeholder="お弁当&#10;水筒&#10;上履き"
                  placeholderTextColor={Colors.textLight}
                />
              </FormField>

              <FormField label="提出期限 (YYYY-MM-DD)">
                <TextInput
                  style={styles.fieldInput}
                  value={scanResult.submission_deadline}
                  onChangeText={(t) => setScanResult((s) => ({ ...s, submission_deadline: t }))}
                  placeholder="2024-06-10"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textLight}
                />
              </FormField>

              <FormField label="提出物（1行1つ）">
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputMulti]}
                  value={scanResult.submission_items.join('\n')}
                  onChangeText={(t) => setScanResult((s) => ({ ...s, submission_items: t.split('\n').filter(Boolean) }))}
                  multiline
                  placeholder="返信はがき&#10;参加費500円"
                  placeholderTextColor={Colors.textLight}
                />
              </FormField>

              <FormField label="メモ・注意事項">
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputMulti]}
                  value={scanResult.notes}
                  onChangeText={(t) => setScanResult((s) => ({ ...s, notes: t }))}
                  multiline
                  placeholder="その他のメモ"
                  placeholderTextColor={Colors.textLight}
                />
              </FormField>

              {/* Child selection */}
              <Text style={styles.fieldLabel}>お子さん</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childPicker}>
                <TouchableOpacity
                  onPress={() => setSelectedChildId(undefined)}
                  style={[styles.childChip, !selectedChildId && styles.childChipActive]}
                >
                  <Text style={[styles.chipText, !selectedChildId && styles.chipTextActive]}>家族全員</Text>
                </TouchableOpacity>
                {children.map((child) => (
                  <TouchableOpacity
                    key={child.id}
                    onPress={() => setSelectedChildId(child.id)}
                    style={[styles.childChip, selectedChildId === child.id && { borderColor: child.color, backgroundColor: child.color + '20' }]}
                  >
                    <Avatar name={child.name} color={child.color} size={20} />
                    <Text style={[styles.chipText, selectedChildId === child.id && { color: child.color }]}>
                      {child.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Card>

            <View style={styles.actionBtns}>
              <Button label="この内容で登録する" onPress={handleSave} loading={saving} fullWidth size="lg" />
              <Button label="やり直す" onPress={handleReset} variant="ghost" fullWidth />
            </View>
          </ScrollView>
        )}

        {step === 'done' && (
          <View style={styles.doneArea}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
            <Text style={styles.doneTitle}>登録完了！</Text>
            <Text style={styles.doneSubtitle}>
              イベント・持ち物・提出物をカレンダーと{'\n'}
              チェックリストに登録しました
            </Text>
            <View style={styles.doneBtns}>
              <Button label="ホームへ戻る" onPress={() => router.replace('/(main)')} fullWidth size="lg" />
              <Button label="もう1枚読み取る" onPress={handleReset} variant="outline" fullWidth />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  selectArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  iconArea: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'center' },
  selectSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  selectBtns: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
  selectBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  selectBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  loadingArea: { flex: 1 },
  previewImage: { width: '100%', height: 300 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textWhite },
  loadingSubtext: { fontSize: FontSize.md, color: Colors.textWhite + 'CC' },
  confirmContent: { padding: Spacing.md, gap: Spacing.md },
  confirmImage: { width: '100%', height: 200, borderRadius: Radius.lg },
  confidenceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warningLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  confidenceText: { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
  formCard: { gap: Spacing.sm },
  formTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  fieldWrap: { marginBottom: Spacing.sm },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: 4 },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.surfaceAlt,
  },
  fieldInputMulti: { height: 80, textAlignVertical: 'top' },
  childPicker: { marginBottom: Spacing.sm },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginRight: Spacing.sm,
  },
  childChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '30' },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  actionBtns: { gap: Spacing.sm },
  doneArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  doneTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  doneSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  doneBtns: { width: '100%', gap: Spacing.sm },
});
