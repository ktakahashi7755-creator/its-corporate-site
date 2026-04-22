import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { useFamily } from '../src/hooks/useFamily';
import { supabase } from '../src/lib/supabase';
import { extractFromPrintImage } from '../src/lib/openai';
import { Button } from '../src/components/ui/Button';
import { Colors } from '../src/constants/colors';
import { ExtractedData, Child } from '../src/types';

type Step = 'capture' | 'processing' | 'confirm' | 'done';

export default function PrintScanScreen() {
  const { user } = useAuth();
  const { family, children } = useFamily(user?.id);
  const router = useRouter();

  const [step, setStep] = useState<Step>('capture');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [editedData, setEditedData] = useState<ExtractedData>({});
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [saving, setSaving] = useState(false);

  const pickImage = async (fromCamera: boolean) => {
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri: string) => {
    setImageUri(uri);
    setStep('processing');

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const data = await extractFromPrintImage(base64);
      if (!data) throw new Error('読み取りに失敗しました');

      setExtracted(data);
      setEditedData({ ...data });
      setStep('confirm');
    } catch (e: any) {
      Alert.alert(
        '読み取りエラー',
        e.message ?? '画像を読み取れませんでした。もう一度お試しください。',
        [{ text: 'OK', onPress: () => setStep('capture') }]
      );
    }
  };

  const handleRegister = async () => {
    if (!family || !user) return;
    setSaving(true);

    try {
      let imageUrl = '';
      if (imageUri) {
        const fileName = `prints/${family.id}/${Date.now()}.jpg`;
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const { data: storageData, error: storageError } = await supabase.storage
          .from('documents')
          .upload(fileName, decode(base64), { contentType: 'image/jpeg' });
        if (!storageError && storageData) {
          const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      }

      // ドキュメント保存
      await supabase.from('documents').insert({
        family_id: family.id,
        child_id: selectedChild?.id ?? null,
        image_url: imageUrl,
        ai_summary: editedData.event_name ?? '読み取り結果',
        extracted_data: editedData,
        status: 'confirmed',
      });

      // イベント自動登録
      if (editedData.event_name && editedData.event_date) {
        await supabase.from('events').insert({
          family_id: family.id,
          child_id: selectedChild?.id ?? null,
          title: editedData.event_name,
          event_date: editedData.event_date,
          start_time: editedData.start_time ?? null,
          notes: editedData.notes ?? null,
          source: 'ai',
        });
      }

      // タスク自動登録
      if (editedData.tasks && editedData.tasks.length > 0) {
        await supabase.from('tasks').insert(
          editedData.tasks.map(title => ({
            family_id: family.id,
            child_id: selectedChild?.id ?? null,
            title,
            priority: 'medium',
            is_completed: false,
          }))
        );
      }

      setStep('done');
    } catch (e: any) {
      Alert.alert('エラー', e.message ?? '登録に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep('capture');
    setImageUri(null);
    setExtracted(null);
    setEditedData({});
  };

  function decode(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  // 撮影画面
  if (step === 'capture') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.closeRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeText}>✕ 閉じる</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.captureContainer}>
          <Text style={styles.captureEmoji}>📄</Text>
          <Text style={styles.captureTitle}>プリントを撮影</Text>
          <Text style={styles.captureDesc}>
            保育園・学校のプリントを撮影すると、{'\n'}
            AI が日程・持ち物・提出物を自動で読み取ります
          </Text>

          <View style={styles.frame}>
            <Text style={styles.frameHint}>📷 プリントを枠内に収めてね</Text>
          </View>

          <TouchableOpacity style={styles.cameraBtn} onPress={() => pickImage(true)}>
            <Text style={styles.cameraBtnText}>📷 撮影する</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.libraryBtn} onPress={() => pickImage(false)}>
            <Text style={styles.libraryBtnText}>📁 ライブラリから選ぶ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 処理中
  if (step === 'processing') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.processingContainer}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewSmall} resizeMode="cover" />
          )}
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 32 }} />
          <Text style={styles.processingText}>AIが読み取り中...</Text>
          <Text style={styles.processingSubtext}>少しお待ちください ✨</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 完了
  if (step === 'done') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.doneContainer}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>登録完了！</Text>
          <Text style={styles.doneDesc}>
            カレンダーとタスクボードに反映されました
          </Text>
          <Button title="ホームに戻る" onPress={() => router.replace('/(tabs)')} style={styles.doneBtn} />
          <TouchableOpacity onPress={reset} style={styles.scanMore}>
            <Text style={styles.scanMoreText}>続けて撮影する</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 確認・修正画面
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.confirmHeader}>
          <Text style={styles.confirmTitle}>📋 読み取り結果を確認</Text>
          <Text style={styles.confirmDesc}>内容を確認・修正してから登録してください</Text>
        </View>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
        )}

        {/* 子ども選択 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📌 対象のお子さん</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childScroll}>
            <TouchableOpacity
              style={[styles.childChip, !selectedChild && styles.childChipSelected]}
              onPress={() => setSelectedChild(null)}
            >
              <Text style={[styles.childChipText, !selectedChild && styles.childChipTextSelected]}>家族全員</Text>
            </TouchableOpacity>
            {children.map(child => (
              <TouchableOpacity
                key={child.id}
                style={[styles.childChip, selectedChild?.id === child.id && styles.childChipSelected, { borderColor: child.color }]}
                onPress={() => setSelectedChild(child)}
              >
                <Text style={[styles.childChipText, selectedChild?.id === child.id && styles.childChipTextSelected]}>
                  {child.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* イベント名 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>🗓️ イベント名</Text>
          <TextInput
            style={styles.input}
            value={editedData.event_name ?? ''}
            onChangeText={v => setEditedData(prev => ({ ...prev, event_name: v }))}
            placeholder="例: 運動会、遠足など"
          />
        </View>

        {/* 日付 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📅 日付</Text>
          <TextInput
            style={styles.input}
            value={editedData.event_date ?? ''}
            onChangeText={v => setEditedData(prev => ({ ...prev, event_date: v }))}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        {/* 持ち物 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>🎒 持ち物</Text>
          {(editedData.items ?? []).map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.bullet}>・</Text>
              <TextInput
                style={styles.itemInput}
                value={item}
                onChangeText={v => {
                  const items = [...(editedData.items ?? [])];
                  items[i] = v;
                  setEditedData(prev => ({ ...prev, items }));
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  const items = (editedData.items ?? []).filter((_, j) => j !== i);
                  setEditedData(prev => ({ ...prev, items }));
                }}
              >
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setEditedData(prev => ({ ...prev, items: [...(prev.items ?? []), ''] }))}
          >
            <Text style={styles.addItem}>＋ 追加</Text>
          </TouchableOpacity>
        </View>

        {/* 提出物 */}
        {(editedData.submission_items ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📝 提出物</Text>
            {(editedData.submission_items ?? []).map((item, i) => (
              <Text key={i} style={styles.listItem}>・ {item}</Text>
            ))}
            {editedData.submission_deadline && (
              <Text style={styles.deadline}>期限: {editedData.submission_deadline}</Text>
            )}
          </View>
        )}

        {/* メモ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📌 注意事項</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={editedData.notes ?? ''}
            onChangeText={v => setEditedData(prev => ({ ...prev, notes: v }))}
            placeholder="AIが読み取った注意事項"
            multiline
            numberOfLines={3}
          />
        </View>

        <Button
          title="この内容で登録する ✓"
          onPress={handleRegister}
          loading={saving}
          style={styles.registerBtn}
        />
        <TouchableOpacity onPress={reset} style={styles.retakeBtn}>
          <Text style={styles.retakeBtnText}>撮り直す</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  closeRow: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  closeText: { fontSize: 16, color: Colors.textSecondary },
  captureContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  captureEmoji: { fontSize: 64, marginBottom: 16 },
  captureTitle: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  captureDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  frame: { width: '100%', height: 200, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 2, borderColor: Colors.primaryLight, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  frameHint: { fontSize: 15, color: Colors.textSecondary },
  cameraBtn: { width: '100%', height: 52, backgroundColor: Colors.primary, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  cameraBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  libraryBtn: { width: '100%', height: 52, backgroundColor: Colors.surface, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.primary },
  libraryBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  processingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  previewSmall: { width: 200, height: 150, borderRadius: 12 },
  processingText: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: 16 },
  processingSubtext: { fontSize: 14, color: Colors.textSecondary, marginTop: 8 },
  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  doneEmoji: { fontSize: 80, marginBottom: 16 },
  doneTitle: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  doneDesc: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  doneBtn: { width: '100%', marginBottom: 12 },
  scanMore: { paddingVertical: 12 },
  scanMoreText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  scroll: { flex: 1 },
  confirmHeader: { padding: 20, paddingBottom: 0 },
  confirmTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  confirmDesc: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16 },
  previewImage: { width: '100%', height: 180, resizeMode: 'cover' },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  input: { height: 48, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  textarea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  bullet: { fontSize: 16, color: Colors.textSecondary, marginRight: 4 },
  itemInput: { flex: 1, height: 40, backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 12, fontSize: 15, borderWidth: 1, borderColor: Colors.border },
  removeBtn: { color: Colors.danger, fontSize: 16, paddingHorizontal: 8 },
  addItem: { color: Colors.primary, fontSize: 14, fontWeight: '600', marginTop: 4 },
  listItem: { fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
  deadline: { fontSize: 13, color: Colors.warning, fontWeight: '600', marginTop: 4 },
  childScroll: { marginBottom: 4 },
  childChip: { borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  childChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  childChipText: { fontSize: 14, color: Colors.textSecondary },
  childChipTextSelected: { color: '#fff' },
  registerBtn: { marginHorizontal: 16, marginTop: 24 },
  retakeBtn: { alignItems: 'center', paddingVertical: 16, marginBottom: 32 },
  retakeBtnText: { color: Colors.textSecondary, fontSize: 15 },
});
