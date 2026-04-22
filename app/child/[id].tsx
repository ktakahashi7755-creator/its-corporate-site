import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useFamily } from '../../src/hooks/useFamily';
import { supabase } from '../../src/lib/supabase';
import { Colors } from '../../src/constants/colors';
import { Event, HealthLog } from '../../src/types';

type Tab = 'events' | 'health' | 'docs';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function ChildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { children } = useFamily(user?.id);
  const router = useRouter();

  const child = children.find(c => c.id === id);
  const [tab, setTab] = useState<Tab>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('events')
      .select('*')
      .eq('child_id', id)
      .gte('event_date', todayStr())
      .order('event_date')
      .limit(20)
      .then(({ data }) => setEvents((data ?? []) as Event[]));

    supabase
      .from('health_logs')
      .select('*')
      .eq('child_id', id)
      .order('recorded_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setHealthLogs((data ?? []) as HealthLog[]));
  }, [id]);

  if (!child) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* プロフィール */}
      <View style={[styles.profile, { backgroundColor: child.color }]}>
        <View style={styles.avatarBig}>
          <Text style={styles.avatarBigText}>{child.name.charAt(0)}</Text>
        </View>
        <Text style={styles.childNameBig}>{child.name}</Text>
        {child.institutions && child.institutions.length > 0 && (
          <Text style={styles.institution}>{child.institutions[0].name}</Text>
        )}
        <View style={styles.profileActions}>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push(`/health/${child.id}`)}
          >
            <Text style={styles.profileBtnText}>🌡️ 体調記録</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/print-scan')}
          >
            <Text style={styles.profileBtnText}>📷 プリント読取</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* タブ */}
      <View style={styles.tabs}>
        {(['events', 'health', 'docs'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'events' ? '📅 予定' : t === 'health' ? '🌡️ 体調' : '📄 書類'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll}>
        {tab === 'events' && (
          <View style={styles.content}>
            {events.length === 0 ? (
              <Text style={styles.empty}>今後の予定はありません</Text>
            ) : (
              events.map(event => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={[styles.colorBar, { backgroundColor: child.color }]} />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventDate}>
                      {new Date(event.event_date + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' })}
                    </Text>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.notes && <Text style={styles.eventNotes}>{event.notes}</Text>}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'health' && (
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.healthBtn}
              onPress={() => router.push(`/health/${child.id}`)}
            >
              <Text style={styles.healthBtnText}>🌡️ 体調を記録する</Text>
            </TouchableOpacity>
            {healthLogs.length === 0 ? (
              <Text style={styles.empty}>体調記録はありません</Text>
            ) : (
              healthLogs.map(log => (
                <View key={log.id} style={styles.logCard}>
                  <Text style={styles.logDate}>
                    {new Date(log.recorded_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {log.temperature != null && (
                    <Text style={[styles.logTemp, log.temperature >= 37.5 && styles.logTempFever]}>
                      {log.temperature}℃
                    </Text>
                  )}
                  {log.symptoms?.length > 0 && (
                    <Text style={styles.logSymptoms}>{log.symptoms.join(' · ')}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'docs' && (
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.healthBtn}
              onPress={() => router.push('/print-scan')}
            >
              <Text style={styles.healthBtnText}>📷 プリントを撮影する</Text>
            </TouchableOpacity>
            <Text style={styles.empty}>読み取ったプリントがここに表示されます</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profile: { paddingTop: 24, paddingBottom: 24, alignItems: 'center' },
  avatarBig: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarBigText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  childNameBig: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  institution: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  profileActions: { flexDirection: 'row', gap: 12 },
  profileBtn: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  profileBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16 },
  empty: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 32 },
  eventCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  colorBar: { width: 4 },
  eventContent: { flex: 1, padding: 12 },
  eventDate: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  eventNotes: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  healthBtn: { backgroundColor: Colors.primary, borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  healthBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  logCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  logDate: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  logTemp: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  logTempFever: { color: Colors.danger },
  logSymptoms: { fontSize: 13, color: Colors.primary },
});
