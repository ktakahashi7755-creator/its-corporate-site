import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { supabase } from '../../lib/supabase';
import { useFamilyStore } from '../../store/familyStore';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { formatDate, formatTime, getTodayString } from '../../lib/utils';
import type { Event } from '../../types';

// Japanese locale
LocaleConfig.locales['ja'] = {
  monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
  today: '今日',
};
LocaleConfig.defaultLocale = 'ja';

export default function CalendarScreen() {
  const { family, children } = useFamilyStore();
  const user = useAuthStore((s) => s.user);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newChildId, setNewChildId] = useState<string | undefined>();
  const [newAllDay, setNewAllDay] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchEvents = async () => {
    if (!family) return;
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('family_id', family.id)
      .order('event_date');
    setEvents(data ?? []);
  };

  useEffect(() => { fetchEvents(); }, [family?.id]);

  // Build marked dates for calendar
  const markedDates: Record<string, any> = {};
  events.forEach((e) => {
    const child = children.find((c) => c.id === e.child_id);
    const color = child?.color ?? Colors.secondary;
    if (!markedDates[e.event_date]) {
      markedDates[e.event_date] = { dots: [] };
    }
    markedDates[e.event_date].dots.push({ color });
  });
  markedDates[selectedDate] = {
    ...markedDates[selectedDate],
    selected: true,
    selectedColor: Colors.primary,
  };

  const todaysEvents = events.filter((e) => e.event_date === selectedDate);

  const handleAddEvent = async () => {
    if (!newTitle.trim() || !family || !user) return;
    setSaving(true);
    await supabase.from('events').insert({
      family_id: family.id,
      child_id: newChildId ?? null,
      title: newTitle,
      event_date: selectedDate,
      all_day: newAllDay,
      reminder_days: [3, 1, 0],
      created_by: user.id,
      source: 'manual',
    });
    setNewTitle('');
    setNewChildId(undefined);
    setShowAdd(false);
    setSaving(false);
    await fetchEvents();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>カレンダー</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Calendar
          current={selectedDate}
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
          markingType="multi-dot"
          markedDates={markedDates}
          theme={{
            backgroundColor: Colors.background,
            calendarBackground: Colors.surface,
            textSectionTitleColor: Colors.textSecondary,
            selectedDayBackgroundColor: Colors.primary,
            selectedDayTextColor: Colors.textWhite,
            todayTextColor: Colors.primary,
            dayTextColor: Colors.text,
            textDisabledColor: Colors.textLight,
            arrowColor: Colors.primary,
            monthTextColor: Colors.text,
            textMonthFontWeight: FontWeight.bold,
            textMonthFontSize: FontSize.lg,
          }}
          style={styles.calendar}
        />

        {/* Selected day events */}
        <View style={styles.daySection}>
          <Text style={styles.dayTitle}>{formatDate(selectedDate)}</Text>
          {todaysEvents.length === 0 ? (
            <View style={styles.emptyDay}>
              <Ionicons name="calendar-outline" size={32} color={Colors.textLight} />
              <Text style={styles.emptyDayText}>この日のイベントはありません</Text>
              <TouchableOpacity onPress={() => setShowAdd(true)}>
                <Text style={styles.addEventLink}>イベントを追加する</Text>
              </TouchableOpacity>
            </View>
          ) : (
            todaysEvents.map((event) => {
              const child = children.find((c) => c.id === event.child_id);
              return (
                <Card key={event.id} style={styles.eventCard}>
                  <View style={[styles.eventBar, { backgroundColor: child?.color ?? Colors.secondary }]} />
                  <View style={styles.eventBody}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.start_time && (
                      <Text style={styles.eventTime}>{formatTime(event.start_time)}</Text>
                    )}
                    {child && (
                      <Badge label={child.name} color={child.color + '30'} textColor={child.color} />
                    )}
                    {event.source === 'print_scan' && (
                      <Badge label="プリントAI" color={Colors.infoLight} textColor={Colors.info} />
                    )}
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Event Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>イベントを追加</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDate}>{formatDate(selectedDate)}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="イベント名を入力"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholderTextColor={Colors.textLight}
            />
            <Text style={styles.modalLabel}>お子さん（任意）</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childPicker}>
              <TouchableOpacity
                onPress={() => setNewChildId(undefined)}
                style={[styles.childChip, !newChildId && styles.childChipActive]}
              >
                <Text style={[styles.chipText, !newChildId && styles.chipTextActive]}>家族全員</Text>
              </TouchableOpacity>
              {children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  onPress={() => setNewChildId(child.id)}
                  style={[styles.childChip, newChildId === child.id && { borderColor: child.color, backgroundColor: child.color + '20' }]}
                >
                  <Text style={[styles.chipText, newChildId === child.id && { color: child.color }]}>
                    {child.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>終日</Text>
              <Switch
                value={newAllDay}
                onValueChange={setNewAllDay}
                trackColor={{ true: Colors.primary, false: Colors.border }}
              />
            </View>
            <Button label="追加する" onPress={handleAddEvent} loading={saving} fullWidth />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendar: { borderRadius: Radius.lg, marginHorizontal: Spacing.md, overflow: 'hidden' },
  daySection: { padding: Spacing.md },
  dayTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  emptyDay: { alignItems: 'center', padding: Spacing.lg, gap: Spacing.sm },
  emptyDayText: { fontSize: FontSize.md, color: Colors.textSecondary },
  addEventLink: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.semibold },
  eventCard: { marginBottom: Spacing.sm, flexDirection: 'row', padding: 0, overflow: 'hidden' },
  eventBar: { width: 4 },
  eventBody: { flex: 1, padding: Spacing.md, gap: 4 },
  eventTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  eventTime: { fontSize: FontSize.sm, color: Colors.textSecondary },
  modalBg: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  modalDate: { fontSize: FontSize.md, color: Colors.textSecondary },
  modalLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  modalInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.surfaceAlt,
  },
  childPicker: { marginBottom: Spacing.sm },
  childChip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginRight: Spacing.sm,
  },
  childChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '30' },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: FontSize.md, color: Colors.text },
});
