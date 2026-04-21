import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useFamilyStore } from '../../store/familyStore';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { enrichChild, formatDate, daysUntil } from '../../lib/utils';
import type { Event, HealthLog } from '../../types';

export default function ChildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { children } = useFamilyStore();
  const child = children.find((c) => c.id === id);
  const enriched = child ? enrichChild(child) : null;

  const [events, setEvents] = useState<Event[]>([]);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);

  useEffect(() => {
    if (!id) return;
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      supabase.from('events').select('*').eq('child_id', id).gte('event_date', today).order('event_date').limit(5),
      supabase.from('health_logs').select('*').eq('child_id', id).order('recorded_at', { ascending: false }).limit(3),
    ]).then(([eventsRes, healthRes]) => {
      setEvents(eventsRes.data ?? []);
      setHealthLogs(healthRes.data ?? []);
    });
  }, [id]);

  if (!enriched) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.notFound}>お子さんが見つかりません</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.heroArea, { backgroundColor: enriched.color + '30' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Avatar name={enriched.name} color={enriched.color} size={80} />
          <Text style={styles.childName}>{enriched.name}</Text>
          <Text style={styles.childAge}>{enriched.ageLabel}</Text>
          {enriched.school_name && (
            <Badge label={enriched.school_name} color={enriched.color + '40'} textColor={enriched.color} />
          )}
        </View>

        <View style={styles.content}>
          {/* Quick Actions */}
          <View style={styles.quickRow}>
            <QuickAction
              icon="thermometer-outline"
              label="体調記録"
              color="#FF6B6B"
              onPress={() => router.push(`/health/${id}`)}
            />
            <QuickAction
              icon="moon-outline"
              label="明日の準備"
              color={Colors.primary}
              onPress={() => router.push('/tomorrow')}
            />
            <QuickAction
              icon="camera-outline"
              label="プリント"
              color={Colors.secondary}
              onPress={() => router.push('/print-scan')}
            />
          </View>

          {/* Info */}
          <Card style={styles.infoCard}>
            <InfoRow icon="calendar-outline" label="誕生日" value={formatDate(enriched.birth_date, { year: 'numeric', month: 'long', day: 'numeric' })} />
            {enriched.school_name && <InfoRow icon="school-outline" label="学校" value={enriched.school_name} />}
            {enriched.class_name && <InfoRow icon="people-outline" label="クラス" value={enriched.class_name} />}
          </Card>

          {/* Upcoming events */}
          <Text style={styles.sectionTitle}>今後のイベント</Text>
          {events.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>イベントはありません</Text>
            </Card>
          ) : (
            events.map((event) => (
              <Card key={event.id} style={styles.eventCard}>
                <View style={[styles.eventDot, { backgroundColor: enriched.color }]} />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>{formatDate(event.event_date)}</Text>
                </View>
                <Badge
                  label={daysUntil(event.event_date) === 0 ? '今日' : daysUntil(event.event_date) === 1 ? '明日' : `${daysUntil(event.event_date)}日後`}
                  color={daysUntil(event.event_date) <= 1 ? Colors.errorLight : Colors.infoLight}
                  textColor={daysUntil(event.event_date) <= 1 ? Colors.error : Colors.info}
                />
              </Card>
            ))
          )}

          {/* Recent health */}
          <Text style={styles.sectionTitle}>最近の体調</Text>
          {healthLogs.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>体調記録はありません</Text>
            </Card>
          ) : (
            healthLogs.map((log) => (
              <Card key={log.id} style={styles.healthCard}>
                <Ionicons
                  name={log.needs_visit ? 'medical' : 'heart-outline'}
                  size={20}
                  color={log.needs_visit ? Colors.error : Colors.success}
                />
                <View style={styles.healthInfo}>
                  {log.temperature && (
                    <Text style={styles.healthTemp}>{log.temperature}℃</Text>
                  )}
                  {log.symptoms.length > 0 && (
                    <Text style={styles.healthSymptoms}>{log.symptoms.join('・')}</Text>
                  )}
                  <Text style={styles.healthDate}>{new Date(log.recorded_at).toLocaleDateString('ja-JP')}</Text>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={Colors.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.quickAction} activeOpacity={0.8}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  notFound: { padding: Spacing.xl, textAlign: 'center', color: Colors.textSecondary },
  heroArea: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  backBtn: { position: 'absolute', top: Spacing.md, left: Spacing.md },
  childName: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  childAge: { fontSize: FontSize.md, color: Colors.textSecondary },
  content: { padding: Spacing.md, gap: Spacing.sm },
  quickRow: { flexDirection: 'row', gap: Spacing.sm },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: FontSize.xs, color: Colors.text, fontWeight: FontWeight.semibold },
  infoCard: { gap: 4 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, width: 60 },
  infoValue: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  emptyCard: { alignItems: 'center' },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  eventDot: { width: 10, height: 10, borderRadius: 5 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  eventDate: { fontSize: FontSize.sm, color: Colors.textSecondary },
  healthCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  healthInfo: { flex: 1 },
  healthTemp: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  healthSymptoms: { fontSize: FontSize.sm, color: Colors.textSecondary },
  healthDate: { fontSize: FontSize.xs, color: Colors.textLight },
});
