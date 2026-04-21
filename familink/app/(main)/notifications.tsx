import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import type { Notification, NotificationType } from '../../types';

const ICON_MAP: Record<NotificationType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  event_reminder: { icon: 'calendar-outline', color: Colors.secondary },
  submission_reminder: { icon: 'document-outline', color: Colors.warning },
  health_update: { icon: 'medical-outline', color: Colors.error },
  tomorrow_reminder: { icon: 'moon-outline', color: Colors.primary },
  task_assigned: { icon: 'checkbox-outline', color: Colors.info },
  task_done: { icon: 'checkmark-circle-outline', color: Colors.success },
  family_invited: { icon: 'people-outline', color: Colors.accent },
  family_joined: { icon: 'heart-outline', color: Colors.primary },
  checklist_update: { icon: 'list-outline', color: Colors.secondary },
};

export default function NotificationsScreen() {
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
  };

  const markRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  useEffect(() => { fetchNotifications(); }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'たった今';
    if (mins < 60) return `${mins}分前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}時間前`;
    return `${Math.floor(hours / 24)}日前`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>通知</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>すべて既読にする</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="通知はありません"
          description="イベントや体調記録、タスクの更新があると\nここに表示されます"
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const iconInfo = ICON_MAP[item.type] ?? { icon: 'notifications-outline', color: Colors.primary };
            return (
              <TouchableOpacity onPress={() => markRead(item.id)} activeOpacity={0.8}>
                <Card style={item.read ? styles.notifCard : [styles.notifCard, styles.notifCardUnread]}>
                  <View style={[styles.iconBox, { backgroundColor: iconInfo.color + '20' }]}>
                    <Ionicons name={iconInfo.icon} size={22} color={iconInfo.color} />
                  </View>
                  <View style={styles.notifBody}>
                    <View style={styles.notifTitleRow}>
                      <Text style={styles.notifTitle}>{item.title}</Text>
                      {!item.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notifBody2}>{item.body}</Text>
                    <Text style={styles.notifTime}>{timeAgo(item.created_at)}</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
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
  markAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  list: { padding: Spacing.md, gap: Spacing.sm },
  notifCard: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  notifCardUnread: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifBody: { flex: 1, gap: 2 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  notifTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  notifBody2: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  notifTime: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
});
