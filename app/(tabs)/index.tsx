import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useFamily } from '../../src/hooks/useFamily';
import { supabase } from '../../src/lib/supabase';
import { Card } from '../../src/components/ui/Card';
import { HealthBadge } from '../../src/components/HealthBadge';
import { TaskItem } from '../../src/components/TaskItem';
import { Colors } from '../../src/constants/colors';
import { Event, HealthLog, Task, ChecklistItem } from '../../src/types';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
function todayLabel() {
  return new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
}

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { family, children, loading } = useFamily(user?.id);
  const router = useRouter();

  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [latestHealth, setLatestHealth] = useState<Record<string, HealthLog | null>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tomorrowItems, setTomorrowItems] = useState<ChecklistItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!family) return;

    const today = todayStr();
    const tomorrow = tomorrowStr();

    const [eventsRes, tasksRes] = await Promise.all([
      supabase
        .from('events')
        .select('*, child:children(name, color)')
        .eq('family_id', family.id)
        .in('event_date', [today, tomorrow])
        .order('event_date'),
      supabase
        .from('tasks')
        .select('*, assigned_user:users(name), child:children(name,color)')
        .eq('family_id', family.id)
        .eq('is_completed', false)
        .order('due_date', { ascending: true })
        .limit(5),
    ]);

    setTodayEvents((eventsRes.data ?? []) as Event[]);
    setTasks((tasksRes.data ?? []) as Task[]);

    if (children.length > 0) {
      const healthMap: Record<string, HealthLog | null> = {};
      await Promise.all(
        children.map(async (child) => {
          const { data } = await supabase
            .from('health_logs')
            .select('*')
            .eq('child_id', child.id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          healthMap[child.id] = data as HealthLog | null;
        })
      );
      setLatestHealth(healthMap);

      const tomorrowEventIds = (eventsRes.data ?? [])
        .filter((e: Event) => e.event_date === tomorrow)
        .map((e: Event) => e.id);

      if (tomorrowEventIds.length > 0) {
        const { data: items } = await supabase
          .from('checklist_items')
          .select('*')
          .in('event_id', tomorrowEventIds);
        setTomorrowItems((items ?? []) as ChecklistItem[]);
      }
    }
  }, [family, children]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const toggleTask = async (id: string, completed: boolean) => {
    await supabase.from('tasks').update({ is_completed: completed }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: completed } : t));
  };

  const todayEventsFiltered = todayEvents.filter(e => e.event_date === todayStr());
  const tomorrowChecked = tomorrowItems.filter(i => i.is_checked).length;
  const tomorrowTotal = tomorrowItems.length;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.loading}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <View>
            <Text style={styles.familyName}>{family?.name ?? 'ふぁみりんく'} 🏠</Text>
            <Text style={styles.headerDate}>☀️ {todayLabel()}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={signOut} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 今日の予定 */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>📋 今日の予定</Text>
          {todayEventsFiltered.length === 0 ? (
            <Text style={styles.empty}>今日の予定はありません</Text>
          ) : (
            todayEventsFiltered.map(event => (
              <View key={event.id} style={styles.eventRow}>
                {event.child && (
                  <View style={[styles.childDot, { backgroundColor: (event.child as any).color }]} />
                )}
                <Text style={styles.eventText}>
                  {event.child ? `${(event.child as any).name}： ` : ''}
                  {event.title}
                  {event.start_time ? ` (${event.start_time})` : ''}
                </Text>
              </View>
            ))
          )}
        </Card>

        {/* 明日の準備 */}
        <TouchableOpacity onPress={() => router.push('/preparation')}>
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>🎒 明日の準備</Text>
            {tomorrowTotal === 0 ? (
              <Text style={styles.empty}>明日のチェックリストはまだありません</Text>
            ) : (
              <>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(tomorrowChecked / tomorrowTotal) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressLabel}>
                  {tomorrowChecked} / {tomorrowTotal} チェック済
                </Text>
              </>
            )}
            <Text style={styles.link}>→ 確認する</Text>
          </Card>
        </TouchableOpacity>

        {/* 体調 */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>🌡️ 体調</Text>
          {children.length === 0 ? (
            <Text style={styles.empty}>お子さんを登録しましょう</Text>
          ) : (
            children.map(child => (
              <HealthBadge
                key={child.id}
                log={latestHealth[child.id] ?? null}
                childName={child.name}
              />
            ))
          )}
        </Card>

        {/* 今週のタスク */}
        <Card style={styles.cardLast}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>✅ 今週のタスク</Text>
            <TouchableOpacity onPress={() => router.push('/board')}>
              <Text style={styles.link}>すべて見る</Text>
            </TouchableOpacity>
          </View>
          {tasks.length === 0 ? (
            <Text style={styles.empty}>未完了のタスクはありません 🎉</Text>
          ) : (
            tasks.map(task => (
              <TaskItem key={task.id} task={task} onToggle={toggleTask} />
            ))
          )}
        </Card>

        {/* プリント撮影FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/print-scan')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>📷 プリントを撮影</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { color: Colors.textSecondary, fontSize: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 8,
  },
  familyName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  headerDate: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, backgroundColor: Colors.surface, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  iconBtnText: { fontSize: 18 },
  card: { marginHorizontal: 16, marginBottom: 12 },
  cardLast: { marginHorizontal: 16, marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  empty: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 8 },
  eventRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  childDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  eventText: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
  progressBar: { height: 8, backgroundColor: Colors.border, borderRadius: 4, marginBottom: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  progressLabel: { fontSize: 13, color: Colors.textSecondary },
  link: { fontSize: 13, color: Colors.primary, fontWeight: '600', marginTop: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fab: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
