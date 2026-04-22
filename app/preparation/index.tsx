import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { useFamily } from '../../src/hooks/useFamily';
import { supabase } from '../../src/lib/supabase';
import { Colors } from '../../src/constants/colors';
import { Event, ChecklistItem, Child } from '../../src/types';

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export default function PreparationScreen() {
  const { user } = useAuth();
  const { family, children } = useFamily(user?.id);

  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);

  const tomorrow = tomorrowStr();
  const tomorrowLabel = new Date(tomorrow + 'T00:00:00').toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const fetchData = useCallback(async () => {
    if (!family) return;
    const childId = selectedChild?.id;

    const eventsQuery = supabase
      .from('events')
      .select('*')
      .eq('family_id', family.id)
      .eq('event_date', tomorrow);
    if (childId) eventsQuery.eq('child_id', childId);

    const { data: evts } = await eventsQuery;
    setEvents((evts ?? []) as Event[]);

    if (!evts || evts.length === 0) {
      setItems([]);
      return;
    }

    const eventIds = evts.map((e: Event) => e.id);
    const { data: chkItems } = await supabase
      .from('checklist_items')
      .select('*')
      .in('event_id', eventIds);

    const allItems = (chkItems ?? []) as ChecklistItem[];

    // デイリーテンプレートも取得
    const templateQuery = supabase
      .from('checklist_templates')
      .select('*, items:checklist_items(*)')
      .eq('family_id', family.id)
      .eq('is_daily', true);
    if (childId) templateQuery.eq('child_id', childId);

    const { data: templates } = await templateQuery;
    const dailyItems = (templates ?? []).flatMap((t: any) => t.items ?? []) as ChecklistItem[];

    const merged = [...allItems, ...dailyItems.filter(d => !allItems.some(a => a.id === d.id))];
    setItems(merged);
  }, [family, selectedChild, tomorrow]);

  useEffect(() => {
    if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0]);
    }
  }, [children]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleItem = async (item: ChecklistItem) => {
    const newVal = !item.is_checked;
    await supabase
      .from('checklist_items')
      .update({ is_checked: newVal, checked_by: user?.id })
      .eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_checked: newVal } : i));
  };

  const addItem = async () => {
    if (!newItem.trim() || events.length === 0) return;
    const { data } = await supabase
      .from('checklist_items')
      .insert({ event_id: events[0].id, name: newItem.trim(), is_checked: false })
      .select()
      .single();
    if (data) setItems(prev => [...prev, data as ChecklistItem]);
    setNewItem('');
  };

  const notifyAll = async () => {
    Alert.alert('完了通知', '家族全員に準備完了を通知しました！ 🎉');
  };

  const checkedCount = items.filter(i => i.is_checked).length;
  const total = items.length;
  const percent = total > 0 ? checkedCount / total : 0;
  const isAllDone = total > 0 && checkedCount === total;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.date}>📅 {tomorrowLabel}</Text>

        {/* 子ども切り替え */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childTabs} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {children.map(child => (
            <TouchableOpacity
              key={child.id}
              style={[styles.childTab, selectedChild?.id === child.id && { backgroundColor: child.color }]}
              onPress={() => setSelectedChild(child)}
            >
              <Text style={[styles.childTabText, selectedChild?.id === child.id && styles.childTabTextActive]}>
                {child.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 進捗バー */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${percent * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{checkedCount} / {total} チェック済</Text>
        </View>

        {/* イベント情報 */}
        {events.map(event => (
          <View key={event.id} style={styles.eventBadge}>
            <Text style={styles.eventBadgeText}>📌 {event.title}</Text>
          </View>
        ))}

        {/* チェックリスト */}
        <View style={styles.checklist}>
          {items.length === 0 ? (
            <View style={styles.emptyCheck}>
              <Text style={styles.emptyCheckText}>持ち物を追加してください</Text>
            </View>
          ) : (
            items.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.checkItem}
                onPress={() => toggleItem(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, item.is_checked && styles.checkboxDone]}>
                  {item.is_checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.checkLabel, item.is_checked && styles.checkLabelDone]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 追加 */}
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="持ち物を追加..."
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={addItem}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addItem}>
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>
        </View>

        {/* 完了ボタン */}
        {isAllDone && (
          <TouchableOpacity style={styles.doneBtn} onPress={notifyAll}>
            <Text style={styles.doneBtnText}>🎉 全員に完了を知らせる</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, padding: 16 },
  date: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  childTabs: { marginBottom: 16, marginHorizontal: -16 },
  childTab: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, backgroundColor: Colors.border },
  childTabText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  childTabTextActive: { color: '#fff', fontWeight: '700' },
  progressSection: { marginBottom: 16 },
  progressBar: { height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 5 },
  progressLabel: { fontSize: 13, color: Colors.textSecondary, textAlign: 'right' },
  eventBadge: { backgroundColor: Colors.primaryLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 8, alignSelf: 'flex-start' },
  eventBadgeText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  checklist: { backgroundColor: Colors.surface, borderRadius: 16, padding: 4, marginBottom: 16 },
  emptyCheck: { padding: 24, alignItems: 'center' },
  emptyCheckText: { fontSize: 14, color: Colors.textSecondary },
  checkItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  checkbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkLabel: { fontSize: 16, color: Colors.textPrimary, flex: 1 },
  checkLabelDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  addInput: { flex: 1, height: 44, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, borderWidth: 1, borderColor: Colors.border },
  addBtn: { width: 44, height: 44, backgroundColor: Colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '300' },
  doneBtn: { backgroundColor: Colors.success, borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
