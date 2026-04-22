import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { useAuth } from '../../src/hooks/useAuth';
import { useFamily } from '../../src/hooks/useFamily';
import { supabase } from '../../src/lib/supabase';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/constants/colors';
import { Event, Child } from '../../src/types';

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const { family, children } = useFamily(user?.id);

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [events, setEvents] = useState<Event[]>([]);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!family) return;
    const { data } = await supabase
      .from('events')
      .select('*, child:children(name, color)')
      .eq('family_id', family.id)
      .order('event_date');

    const evts = (data ?? []) as Event[];
    setEvents(evts);

    const marks: Record<string, any> = {};
    evts.forEach(e => {
      const color = (e.child as any)?.color ?? Colors.primary;
      if (!marks[e.event_date]) {
        marks[e.event_date] = { dots: [] };
      }
      marks[e.event_date].dots.push({ color, selectedDotColor: color });
    });

    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: Colors.primary,
    };

    setMarkedDates(marks);
  }, [family, selectedDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const dayEvents = events.filter(e => e.event_date === selectedDate);

  const handleAddEvent = async () => {
    if (!title.trim() || !family) return;
    setLoading(true);
    try {
      await supabase.from('events').insert({
        family_id: family.id,
        child_id: selectedChild?.id ?? null,
        title: title.trim(),
        event_date: selectedDate,
        notes: notes.trim() || null,
        source: 'manual',
      });
      setTitle('');
      setNotes('');
      setSelectedChild(null);
      setShowModal(false);
      await fetchEvents();
    } catch (e: any) {
      Alert.alert('エラー', e.message ?? 'もう一度お試しください');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    Alert.alert('削除', 'この予定を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('events').delete().eq('id', id);
          await fetchEvents();
        },
      },
    ]);
  };

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>📅 カレンダー</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.addBtnText}>＋ 予定を追加</Text>
          </TouchableOpacity>
        </View>

        <Calendar
          style={styles.calendar}
          theme={{
            backgroundColor: Colors.surface,
            calendarBackground: Colors.surface,
            selectedDayBackgroundColor: Colors.primary,
            selectedDayTextColor: '#fff',
            todayTextColor: Colors.primary,
            dayTextColor: Colors.textPrimary,
            textDisabledColor: Colors.textMuted,
            dotColor: Colors.primary,
            arrowColor: Colors.primary,
            monthTextColor: Colors.textPrimary,
            textMonthFontWeight: '700',
          }}
          markingType="multi-dot"
          markedDates={markedDates}
          onDayPress={onDayPress}
          locale="ja"
        />

        {/* 選択日のイベント */}
        <View style={styles.events}>
          <Text style={styles.dateLabel}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ja-JP', {
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            })}
          </Text>
          {dayEvents.length === 0 ? (
            <Text style={styles.empty}>予定はありません</Text>
          ) : (
            dayEvents.map(event => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onLongPress={() => handleDeleteEvent(event.id)}
                activeOpacity={0.8}
              >
                {event.child && (
                  <View style={[styles.colorBar, { backgroundColor: (event.child as any).color }]} />
                )}
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.child && (
                    <Text style={styles.eventChild}>{(event.child as any).name}</Text>
                  )}
                  {event.notes && <Text style={styles.eventNotes}>{event.notes}</Text>}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* 追加モーダル */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>予定を追加</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.selectedDateLabel}>
              📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>タイトル</Text>
              <TextInput
                style={styles.input}
                placeholder="遠足、参観日など"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>お子さん（任意）</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

            <View style={styles.field}>
              <Text style={styles.label}>メモ（任意）</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="持ち物など"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <Button title="追加する" onPress={handleAddEvent} loading={loading} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  calendar: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  events: { paddingHorizontal: 16, paddingBottom: 32 },
  dateLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  empty: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 24 },
  eventCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12, marginBottom: 8, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  colorBar: { width: 4 },
  eventContent: { flex: 1, padding: 12 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  eventChild: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  eventNotes: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: 20, color: Colors.textSecondary },
  modalBody: { flex: 1, padding: 20 },
  selectedDateLabel: { fontSize: 16, fontWeight: '600', color: Colors.primary, marginBottom: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  input: { height: 48, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  textarea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  childChip: { borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  childChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  childChipText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  childChipTextSelected: { color: '#fff' },
});
