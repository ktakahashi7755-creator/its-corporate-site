import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useFamilyStore } from '../../store/familyStore';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { getTomorrowString, formatDate } from '../../lib/utils';
import type { Event, ChecklistItem } from '../../types';

export default function TomorrowScreen() {
  const { family, children, members } = useFamilyStore();
  const user = useAuthStore((s) => s.user);
  const [events, setEvents] = useState<Event[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  const tomorrow = getTomorrowString();

  const fetchData = async () => {
    if (!family) return;
    const [eventsRes, itemsRes] = await Promise.all([
      supabase.from('events').select('*').eq('family_id', family.id).eq('event_date', tomorrow),
      supabase.from('checklist_items').select('*').eq('family_id', family.id).eq('due_date', tomorrow).order('sort_order'),
    ]);
    setEvents(eventsRes.data ?? []);
    setItems(itemsRes.data ?? []);
  };

  useEffect(() => {
    fetchData();
    if (!family) return;
    const ch = supabase
      .channel('tomorrow-checklist')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items', filter: `family_id=eq.${family.id}` }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [family?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const toggleItem = async (item: ChecklistItem) => {
    await supabase.from('checklist_items').update({
      is_checked: !item.is_checked,
      checked_by: !item.is_checked ? user?.id : null,
      checked_at: !item.is_checked ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', item.id);
    fetchData();
  };

  const addItem = async (label: string) => {
    if (!label.trim() || !family || !user) return;
    await supabase.from('checklist_items').insert({
      family_id: family.id,
      label,
      is_checked: false,
      due_date: tomorrow,
      sort_order: items.length,
    });
    fetchData();
  };

  const checkedCount = items.filter((i) => i.is_checked).length;
  const allDone = items.length > 0 && checkedCount === items.length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>明日の準備</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Date banner */}
        <Card style={allDone ? [styles.dateBanner, styles.dateBannerDone] : styles.dateBanner}>
          <Ionicons name={allDone ? 'checkmark-circle' : 'moon-outline'} size={28} color={allDone ? Colors.success : Colors.primary} />
          <View>
            <Text style={styles.dateLabel}>{formatDate(tomorrow)}</Text>
            <Text style={styles.dateStatus}>
              {allDone
                ? '準備完了！おつかれさまでした 🎉'
                : items.length === 0
                ? '持ち物はありません'
                : `${checkedCount}/${items.length} 完了`}
            </Text>
          </View>
        </Card>

        {/* Progress bar */}
        {items.length > 0 && (
          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(checkedCount / items.length) * 100}%` as any }]} />
            </View>
            <Text style={styles.progressText}>{Math.round((checkedCount / items.length) * 100)}%</Text>
          </View>
        )}

        {/* Tomorrow's events */}
        {events.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>明日のイベント</Text>
            {events.map((event) => {
              const child = children.find((c) => c.id === event.child_id);
              return (
                <Card key={event.id} style={styles.eventCard}>
                  <Ionicons name="calendar-outline" size={20} color={child?.color ?? Colors.secondary} />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.start_time && <Text style={styles.eventTime}>{event.start_time.substring(0, 5)}</Text>}
                  </View>
                  {child && <Badge label={child.name} color={child.color + '30'} textColor={child.color} />}
                </Card>
              );
            })}
          </>
        )}

        {/* Checklist */}
        <Text style={styles.sectionTitle}>持ち物チェックリスト</Text>
        {items.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title="明日の持ち物はまだありません"
            description="下のボタンから追加するか、カレンダーのイベントに持ち物を登録しましょう"
          />
        ) : (
          items.map((item) => {
            const checker = item.checked_by ? members.find((m) => m.user_id === item.checked_by) : null;
            return (
              <TouchableOpacity key={item.id} onPress={() => toggleItem(item)} activeOpacity={0.8}>
                <Card style={item.is_checked ? [styles.checkCard, styles.checkCardDone] : styles.checkCard}>
                  <Ionicons
                    name={item.is_checked ? 'checkmark-circle' : 'ellipse-outline'}
                    size={28}
                    color={item.is_checked ? Colors.success : Colors.border}
                  />
                  <View style={styles.checkBody}>
                    <Text style={[styles.checkLabel, item.is_checked && styles.checkLabelDone]}>
                      {item.label}
                    </Text>
                    {checker && (
                      <View style={styles.checkerRow}>
                        <Avatar name={checker.display_name} size={16} />
                        <Text style={styles.checkerName}>{checker.display_name}がチェック</Text>
                      </View>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}

        {/* Quick add items */}
        <Text style={styles.sectionTitle}>よく使う持ち物</Text>
        <View style={styles.quickAddRow}>
          {COMMON_ITEMS.map((label) => (
            <TouchableOpacity
              key={label}
              onPress={() => addItem(label)}
              style={styles.quickAddChip}
            >
              <Ionicons name="add" size={14} color={Colors.primary} />
              <Text style={styles.quickAddText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const COMMON_ITEMS = [
  'お弁当', '水筒', 'ハンカチ', 'ティッシュ', '体操服', '上履き',
  '連絡帳', '宿題', 'タオル', '着替え', '雨具', '帽子',
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  content: { padding: Spacing.md, gap: Spacing.sm },
  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primaryLight + '20',
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  dateBannerDone: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  dateLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  dateStatus: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  progressBarBg: { flex: 1, height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: 10, backgroundColor: Colors.success, borderRadius: 5 },
  progressText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text, width: 36 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginTop: Spacing.sm },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  eventTime: { fontSize: FontSize.sm, color: Colors.textSecondary },
  checkCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  checkCardDone: { backgroundColor: Colors.successLight + '50' },
  checkBody: { flex: 1, gap: 2 },
  checkLabel: { fontSize: FontSize.md, color: Colors.text },
  checkLabelDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  checkerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  checkerName: { fontSize: FontSize.xs, color: Colors.success },
  quickAddRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  quickAddChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.surface,
  },
  quickAddText: { fontSize: FontSize.sm, color: Colors.primary },
});
