import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useFamily } from '../../src/hooks/useFamily';
import { supabase } from '../../src/lib/supabase';
import { Colors } from '../../src/constants/colors';
import { HealthLog, SYMPTOM_OPTIONS } from '../../src/types';

export default function HealthScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { user } = useAuth();
  const { children } = useFamily(user?.id);

  const child = children.find(c => c.id === childId);

  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [temperature, setTemperature] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [doctorVisit, setDoctorVisit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!childId) return;
    const { data } = await supabase
      .from('health_logs')
      .select('*')
      .eq('child_id', childId)
      .order('recorded_at', { ascending: false })
      .limit(20);
    setLogs((data ?? []) as HealthLog[]);
  }, [childId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleSymptom = (s: string) => {
    setSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleRecord = async () => {
    if (!childId || !user) return;
    setLoading(true);
    try {
      const temp = temperature ? parseFloat(temperature) : null;
      if (temp != null && (temp < 34 || temp > 42)) {
        Alert.alert('入力エラー', '体温は34〜42℃の範囲で入力してください');
        return;
      }
      await supabase.from('health_logs').insert({
        child_id: childId,
        recorded_by: user.id,
        recorded_at: new Date().toISOString(),
        temperature: temp,
        symptoms,
        notes: notes || null,
        doctor_visit: doctorVisit,
      });
      setTemperature('');
      setSymptoms([]);
      setNotes('');
      setDoctorVisit(false);
      setShowForm(false);
      await fetchLogs();
    } catch (e: any) {
      Alert.alert('エラー', e.message ?? 'もう一度お試しください');
    } finally {
      setLoading(false);
    }
  };

  const latestLog = logs[0];
  const hasFever = latestLog?.temperature != null && latestLog.temperature >= 37.5;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll}>
        {/* 現在の状態 */}
        <View style={[styles.statusCard, hasFever && styles.statusCardFever]}>
          <Text style={styles.childName}>{child?.name ?? ''} の体調</Text>
          <View style={styles.statusRow}>
            <Text style={styles.tempBig}>
              {latestLog?.temperature != null ? `${latestLog.temperature}℃` : '---'}
            </Text>
            <View style={[styles.feverBadge, hasFever && styles.feverBadgeOn]}>
              <Text style={styles.feverBadgeText}>{hasFever ? '発熱中' : '平熱'}</Text>
            </View>
          </View>
          {latestLog && (
            <Text style={styles.recordedAt}>
              {new Date(latestLog.recorded_at).toLocaleString('ja-JP', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })} 記録
            </Text>
          )}
        </View>

        {/* 記録ボタン */}
        <TouchableOpacity
          style={styles.recordBtn}
          onPress={() => setShowForm(!showForm)}
        >
          <Text style={styles.recordBtnText}>
            {showForm ? '▲ 閉じる' : '🌡️ 体調を記録する'}
          </Text>
        </TouchableOpacity>

        {/* 記録フォーム */}
        {showForm && (
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>体温 (℃)</Text>
              <TextInput
                style={styles.tempInput}
                placeholder="37.2"
                value={temperature}
                onChangeText={setTemperature}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>症状（複数選択可）</Text>
              <View style={styles.symptoms}>
                {SYMPTOM_OPTIONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.symptomChip, symptoms.includes(s) && styles.symptomChipOn]}
                    onPress={() => toggleSymptom(s)}
                  >
                    <Text style={[styles.symptomText, symptoms.includes(s) && styles.symptomTextOn]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>メモ</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="受診した病院、処方薬など"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>病院受診した</Text>
                <Switch
                  value={doctorVisit}
                  onValueChange={setDoctorVisit}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={doctorVisit ? Colors.primary : '#fff'}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleRecord}
              disabled={loading}
            >
              <Text style={styles.submitBtnText}>記録する</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 履歴 */}
        <Text style={styles.historyTitle}>📋 記録履歴</Text>
        {logs.length === 0 ? (
          <Text style={styles.empty}>記録はまだありません</Text>
        ) : (
          logs.map(log => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <Text style={styles.logDate}>
                  {new Date(log.recorded_at).toLocaleString('ja-JP', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
                {log.temperature != null && (
                  <Text style={[styles.logTemp, log.temperature >= 37.5 && styles.logTempFever]}>
                    {log.temperature}℃
                  </Text>
                )}
                {log.doctor_visit && <Text style={styles.doctorBadge}>🏥 受診</Text>}
              </View>
              {log.symptoms && log.symptoms.length > 0 && (
                <Text style={styles.logSymptoms}>{log.symptoms.join(' · ')}</Text>
              )}
              {log.notes && <Text style={styles.logNotes}>{log.notes}</Text>}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, padding: 16 },
  statusCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statusCardFever: { backgroundColor: '#FFF0F0' },
  childName: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tempBig: { fontSize: 48, fontWeight: '700', color: Colors.textPrimary },
  feverBadge: { backgroundColor: Colors.success + '22', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  feverBadgeOn: { backgroundColor: Colors.danger + '22' },
  feverBadgeText: { fontSize: 14, fontWeight: '600', color: Colors.success },
  recordedAt: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },
  recordBtn: { backgroundColor: Colors.primary, borderRadius: 16, height: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  recordBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  form: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  tempInput: { height: 56, backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 16, fontSize: 28, fontWeight: '700', textAlign: 'center', borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary },
  symptoms: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symptomChip: { borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 6 },
  symptomChipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  symptomText: { fontSize: 13, color: Colors.textSecondary },
  symptomTextOn: { color: '#fff' },
  input: { height: 48, backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary },
  textarea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  historyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  empty: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 32 },
  logCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 10 },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  logDate: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  logTemp: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  logTempFever: { color: Colors.danger },
  doctorBadge: { fontSize: 12 },
  logSymptoms: { fontSize: 13, color: Colors.primary, marginBottom: 2 },
  logNotes: { fontSize: 13, color: Colors.textSecondary },
});
