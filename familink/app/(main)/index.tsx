import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useFamilyStore } from '../../store/familyStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { greetingByTime, formatDate, daysUntil, getTomorrowString, enrichChild } from '../../lib/utils';
import type { Event, ChecklistItem } from '../../types';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { family, children, members } = useFamilyStore();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [tomorrowItems, setTomorrowItems] = useState<ChecklistItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const displayName = user?.user_metadata?.display_name ?? 'ユーザー';
  const enrichedChildren = children.map(enrichChild);

  const fetchData = async () => {
    if (!family) return;
    const tomorrow = getTomorrowString();
    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);

    const [eventsRes, checklistRes] = await Promise.all([
      supabase
        .from('events')
        .select('*')
        .eq('family_id', family.id)
        .gte('event_date', tomorrow)
        .lte('event_date', weekLater.toISOString().split('T')[0])
        .order('event_date')
        .limit(5),
      supabase
        .from('checklist_items')
        .select('*')
        .eq('family_id', family.id)
        .eq('due_date', tomorrow)
        .order('sort_order'),
    ]);

    setUpcomingEvents(eventsRes.data ?? []);
    setTomorrowItems(checklistRes.data ?? []);
  };

  useEffect(() => {
    fetchData();
  }, [family?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const tomorrowChecked = tomorrowItems.filter((i) => i.is_checked).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greetingByTime()}、</Text>
            <Text style={styles.name}>{displayName}さん ✨</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/print-scan')}>
            <View style={styles.scanBtn}>
              <Ionicons name="camera-outline" size={20} color={Colors.textWhite} />
              <Text style={styles.scanBtnText}>プリント読取</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Family name */}
        {family && (
          <Text style={styles.familyName}>🏠 {family.name}</Text>
        )}

        {/* Children cards */}
        <Text style={styles.sectionTitle}>お子さん</Text>
        {enrichedChildren.length === 0 ? (
          <TouchableOpacity style={styles.addChildCard} onPress={() => router.push('/setup/children')}>
            <Ionicons name="add-circle-outline" size={32} color={Colors.primary} />
            <Text style={styles.addChildText}>お子さんを追加する</Text>
          </TouchableOpacity>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childScroll}>
            {enrichedChildren.map((child) => (
              <TouchableOpacity
                key={child.id}
                onPress={() => router.push(`/children/${child.id}`)}
                style={[styles.childCard, { borderColor: child.color }]}
              >
                <Avatar name={child.name} color={child.color} size={52} />
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childAge}>{child.ageLabel}</Text>
                {child.school_name && (
                  <Badge label={child.school_name} color={child.color + '30'} textColor={child.color} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addChildMini}
              onPress={() => router.push('/setup/children')}
            >
              <Ionicons name="add" size={24} color={Colors.textSecondary} />
              <Text style={styles.addChildMiniText}>追加</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Tomorrow preview */}
        <TouchableOpacity onPress={() => router.push('/tomorrow')}>
          <Card style={styles.tomorrowCard}>
            <View style={styles.tomorrowHeader}>
              <View style={styles.tomorrowTitleRow}>
                <Ionicons name="moon-outline" size={20} color={Colors.primary} />
                <Text style={styles.tomorrowTitle}>明日の準備</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </View>
            {tomorrowItems.length === 0 ? (
              <Text style={styles.tomorrowEmpty}>明日の持ち物はありません</Text>
            ) : (
              <>
                <View style={styles.progressRow}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${(tomorrowChecked / tomorrowItems.length) * 100}%` as any },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {tomorrowChecked}/{tomorrowItems.length} 完了
                  </Text>
                </View>
                {tomorrowItems.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.checkRow}>
                    <Ionicons
                      name={item.is_checked ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={item.is_checked ? Colors.success : Colors.textLight}
                    />
                    <Text style={[styles.checkLabel, item.is_checked && styles.checkLabelDone]}>
                      {item.label}
                    </Text>
                  </View>
                ))}
                {tomorrowItems.length > 3 && (
                  <Text style={styles.moreText}>他 {tomorrowItems.length - 3} 件</Text>
                )}
              </>
            )}
          </Card>
        </TouchableOpacity>

        {/* Upcoming events */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>今週のイベント</Text>
          <TouchableOpacity onPress={() => router.push('/calendar')}>
            <Text style={styles.seeAll}>すべて見る</Text>
          </TouchableOpacity>
        </View>

        {upcomingEvents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color={Colors.textLight} />
            <Text style={styles.emptyText}>今週のイベントはありません</Text>
          </Card>
        ) : (
          upcomingEvents.map((event) => {
            const days = daysUntil(event.event_date);
            const child = children.find((c) => c.id === event.child_id);
            return (
              <Card key={event.id} style={styles.eventCard}>
                <View style={styles.eventRow}>
                  <View
                    style={[styles.eventDot, { backgroundColor: child?.color ?? Colors.secondary }]}
                  />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventDate}>{formatDate(event.event_date)}</Text>
                  </View>
                  <Badge
                    label={days === 0 ? '今日' : days === 1 ? '明日' : `${days}日後`}
                    color={days <= 1 ? Colors.errorLight : Colors.infoLight}
                    textColor={days <= 1 ? Colors.error : Colors.info}
                  />
                </View>
              </Card>
            );
          })
        )}

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>クイックアクション</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickCard}
              onPress={() => router.push(action.href as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIcon, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon as any} size={28} color={action.color} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Family members */}
        <Text style={styles.sectionTitle}>家族メンバー</Text>
        <Card style={styles.membersCard}>
          <View style={styles.membersRow}>
            {members.map((m) => (
              <View key={m.id} style={styles.memberItem}>
                <Avatar name={m.display_name} size={44} uri={m.avatar_url} />
                <Text style={styles.memberName}>{m.display_name}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const QUICK_ACTIONS = [
  { label: '体調記録', href: '/health', icon: 'thermometer-outline', color: '#FF6B6B', bg: '#FFECEC' },
  { label: '明日の準備', href: '/tomorrow', icon: 'moon-outline', color: Colors.primary, bg: '#FFF0F5' },
  { label: 'プリント', href: '/print-scan', icon: 'camera-outline', color: Colors.secondary, bg: '#F0FFFE' },
  { label: '共有ボード', href: '/(main)/board', icon: 'people-outline', color: '#B4A7D6', bg: '#F3F0FF' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  greeting: { fontSize: FontSize.sm, color: Colors.textSecondary },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  scanBtnText: { fontSize: FontSize.sm, color: Colors.textWhite, fontWeight: FontWeight.semibold },
  familyName: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.sm },
  seeAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  childScroll: { marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
  childCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    borderWidth: 2,
    width: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  childName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, marginTop: 6, marginBottom: 2 },
  childAge: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 4 },
  addChildCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addChildText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.semibold },
  addChildMini: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    marginRight: Spacing.sm,
  },
  addChildMiniText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  tomorrowCard: { marginBottom: Spacing.sm },
  tomorrowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  tomorrowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tomorrowTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  tomorrowEmpty: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  progressBarBg: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: 8, backgroundColor: Colors.success, borderRadius: 4 },
  progressText: { fontSize: FontSize.sm, color: Colors.textSecondary, width: 50, textAlign: 'right' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 4 },
  checkLabel: { fontSize: FontSize.md, color: Colors.text },
  checkLabelDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  moreText: { fontSize: FontSize.sm, color: Colors.primary, marginTop: 4 },
  eventCard: { marginBottom: Spacing.sm },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  eventDot: { width: 10, height: 10, borderRadius: 5 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  eventDate: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  emptyCard: { alignItems: 'center', padding: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  quickCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  membersCard: {},
  membersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  memberItem: { alignItems: 'center', gap: 4 },
  memberName: { fontSize: FontSize.xs, color: Colors.textSecondary },
});
