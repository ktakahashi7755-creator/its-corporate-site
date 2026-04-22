import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/lib/supabase';
import { Colors } from '../src/constants/colors';
import { Notification } from '../src/types';

const typeEmoji: Record<string, string> = {
  task_due: '✅',
  health_alert: '🌡️',
  checklist: '🎒',
  event: '📅',
  invite: '👨‍👩‍👧',
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data ?? []) as Notification[]);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.unread}>{unreadCount}件の未読</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>すべて既読</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyText}>通知はありません</Text>
          </View>
        ) : (
          notifications.map(n => (
            <TouchableOpacity
              key={n.id}
              style={[styles.item, !n.is_read && styles.itemUnread]}
              onPress={() => markRead(n.id)}
              activeOpacity={0.7}
            >
              <View style={styles.iconCol}>
                <Text style={styles.typeEmoji}>{typeEmoji[n.type] ?? '🔔'}</Text>
                {!n.is_read && <View style={styles.unreadDot} />}
              </View>
              <View style={styles.content}>
                <Text style={styles.title}>{n.title}</Text>
                <Text style={styles.body}>{n.body}</Text>
                <Text style={styles.time}>
                  {new Date(n.created_at).toLocaleString('ja-JP', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  unread: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  markAll: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  scroll: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
  item: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  itemUnread: { backgroundColor: Colors.primaryLight + '33' },
  iconCol: { width: 44, alignItems: 'center' },
  typeEmoji: { fontSize: 24 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 4 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  body: { fontSize: 14, color: Colors.textSecondary, marginBottom: 4, lineHeight: 20 },
  time: { fontSize: 12, color: Colors.textMuted },
});
