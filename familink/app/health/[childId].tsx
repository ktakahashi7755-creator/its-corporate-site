import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useFamilyStore } from '../../store/familyStore';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { enrichChild, COMMON_SYMPTOMS, symptomLabel } from '../../lib/utils';
import type { HealthLog } from '../../types';

export default function HealthLogScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { children, family } = useFamilyStore();
  const user = useAuthStore((s) => s.user);
  const child = children.find((c) => c.id === childId);
  const enriched = child ? enrichChild(child) : null;

  const [temperature, setTemperature] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [needsVisit, setNeedsVisit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<HealthLog[]>([]);

  const fetchLogs = async () => {
    if (!childId) return;
    const { data } = await supabase
      .from('health_logs')
      .select('*')
      .eq('child_id', childId)
      .order('recorded_at', { ascending: false })
      .limit(10);
    setLogs(data ?? []);
  };

  useEffect(() => { fetchLogs(); }, [childId]);

  const toggleSymptom = (key: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!childId || !family || !user) return;
    const tempNum = temperature ? parseFloat(temperature) : undefined;
    if (tempNum !== undefined && (tempNum < 34 || tempNum > 42)) {
      Alert.alert('確認', '体温の値を確認してください（34℃〜42℃）');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('health_logs').insert({
      family_id: family.id,
      child_id: childId,
      recorded_by: user.id,
      temperature: tempNum ?? null,
      symptoms: selectedSymptoms,
      memo: memo || null,
      needs_visit: needsVisit,
      recorded_at: new Date().toISOString(),
    });

    if (!error) {
      // Notify family via notification table
      await supabase.from('notifications').insert({
        user_id: user.id,
        family_id: family.id,
        type: 'health_update',
        title: `${enriched?.name}の体調を記録しました`,
        body: [
          tempNum ? `体温：${tempNum}℃` : null,
          selectedSymptoms.length > 0 ? selectedSymptoms.map(symptomLabel).join('・') : null,
          needsVisit ? '受診が必要です' : null,
        ].filter(Boolean).join(' / ') || '記録されました',
        read: false,
      });

      setTemperature('');
      setSelectedSymptoms([]);
      setMemo('');
      setNeedsVisit(false);
      Alert.alert('記録完了', '体調を記録しました。家族にお知らせしました。');
      fetchLogs();
    } else {
      Alert.alert('エラー', '記録に失敗しました');
    }
    setSaving(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>体調記録</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Child info */}
          {enriched && (
            <View style={styles.childBanner}>
              <Avatar name={enriched.name} color={enriched.color} size={44} />
              <Text style={styles.childName}>{enriched.name}の体調</Text>
            </View>
          )}

          <View style={styles.content}>
            {/* Temperature */}
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>体温</Text>
              <View style={styles.tempRow}>
                <TextInput
                  style={styles.tempInput}
                  value={temperature}
                  onChangeText={setTemperature}
                  keyboardType="decimal-pad"
                  placeholder="36.5"
                  placeholderTextColor={Colors.textLight}
                />
                <Text style={styles.tempUnit}>℃</Text>
              </View>
              {/* Temperature quick buttons */}
              <View style={styles.tempQuickRow}>
                {['36.0', '37.0', '37.5', '38.0', '38.5', '39.0'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setTemperature(t)}
                    style={[
                      styles.tempChip,
                      parseFloat(t) >= 38 && styles.tempChipFever,
                      temperature === t && styles.tempChipSelected,
                    ]}
                  >
                    <Text style={[styles.tempChipText, temperature === t && styles.tempChipTextSelected]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Symptoms */}
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>症状</Text>
              <View style={styles.symptomsGrid}>
                {COMMON_SYMPTOMS.map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => toggleSymptom(key)}
                    style={[styles.symptomChip, selectedSymptoms.includes(key) && styles.symptomChipActive]}
                  >
                    <Text style={[styles.symptomText, selectedSymptoms.includes(key) && styles.symptomTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Needs visit */}
            <Card style={styles.section}>
              <View style={styles.switchRow}>
                <Ionicons name="medical-outline" size={20} color={Colors.error} />
                <Text style={styles.switchLabel}>受診が必要</Text>
                <Switch
                  value={needsVisit}
                  onValueChange={setNeedsVisit}
                  trackColor={{ true: Colors.error, false: Colors.border }}
                />
              </View>
            </Card>

            {/* Memo */}
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>メモ</Text>
              <TextInput
                style={styles.memoInput}
                value={memo}
                onChangeText={setMemo}
                placeholder="気になることがあれば書いておきましょう"
                multiline
                numberOfLines={4}
                placeholderTextColor={Colors.textLight}
              />
            </Card>

            <Button label="記録する" onPress={handleSave} loading={saving} fullWidth size="lg" />

            {/* Log history */}
            {logs.length > 0 && (
              <>
                <Text style={styles.historyTitle}>記録履歴</Text>
                {logs.map((log) => (
                  <Card key={log.id} style={styles.logCard}>
                    <View style={[styles.logDot, { backgroundColor: log.needs_visit ? Colors.error : Colors.success }]} />
                    <View style={styles.logInfo}>
                      <View style={styles.logRow}>
                        {log.temperature && (
                          <Text style={styles.logTemp}>{log.temperature}℃</Text>
                        )}
                        {log.symptoms.length > 0 && (
                          <Text style={styles.logSymptoms}>{log.symptoms.map(symptomLabel).join('・')}</Text>
                        )}
                      </View>
                      {log.memo && <Text style={styles.logMemo}>{log.memo}</Text>}
                      <Text style={styles.logDate}>
                        {new Date(log.recorded_at).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    {log.needs_visit && (
                      <Ionicons name="medical" size={16} color={Colors.error} />
                    )}
                  </Card>
                ))}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  childBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  childName: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
  content: { padding: Spacing.md, gap: Spacing.sm },
  section: {},
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  tempRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  tempInput: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    width: 100,
    textAlign: 'center',
    paddingVertical: 4,
  },
  tempUnit: { fontSize: FontSize.xxl, color: Colors.textSecondary },
  tempQuickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  tempChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  tempChipFever: { borderColor: Colors.error },
  tempChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tempChipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  tempChipTextSelected: { color: Colors.textWhite, fontWeight: FontWeight.semibold },
  symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  symptomChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  symptomChipActive: { backgroundColor: Colors.errorLight, borderColor: Colors.error },
  symptomText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  symptomTextActive: { color: Colors.error, fontWeight: FontWeight.semibold },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  switchLabel: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  memoInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  historyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  logCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  logDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  logInfo: { flex: 1, gap: 2 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  logTemp: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  logSymptoms: { fontSize: FontSize.sm, color: Colors.textSecondary },
  logMemo: { fontSize: FontSize.sm, color: Colors.textSecondary },
  logDate: { fontSize: FontSize.xs, color: Colors.textLight },
});
