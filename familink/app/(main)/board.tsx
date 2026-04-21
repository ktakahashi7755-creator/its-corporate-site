import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useFamilyStore } from '../../store/familyStore';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import type { Task } from '../../types';

const PRIORITY_COLORS = {
  low: { bg: Colors.infoLight, text: Colors.info, label: '低' },
  normal: { bg: Colors.border, text: Colors.textSecondary, label: '普通' },
  high: { bg: Colors.errorLight, text: Colors.error, label: '急ぎ' },
};

export default function BoardScreen() {
  const { family, members } = useFamilyStore();
  const user = useAuthStore((s) => s.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'undone' | 'done'>('undone');

  const fetchTasks = async () => {
    if (!family) return;
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('family_id', family.id)
      .order('created_at', { ascending: false });
    setTasks(data ?? []);
  };

  useEffect(() => {
    fetchTasks();
    if (!family) return;
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `family_id=eq.${family.id}` }, fetchTasks)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [family?.id]);

  const toggleTask = async (task: Task) => {
    await supabase
      .from('tasks')
      .update({
        is_done: !task.is_done,
        done_by: !task.is_done ? user?.id : null,
        done_at: !task.is_done ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id);
    fetchTasks();
  };

  const handleAdd = async () => {
    if (!newTitle.trim() || !family || !user) return;
    setSaving(true);
    await supabase.from('tasks').insert({
      family_id: family.id,
      title: newTitle,
      description: newDesc || null,
      priority,
      is_done: false,
      created_by: user.id,
    });
    setNewTitle('');
    setNewDesc('');
    setPriority('normal');
    setShowAdd(false);
    setSaving(false);
    fetchTasks();
  };

  const filtered = tasks.filter((t) =>
    filter === 'all' ? true : filter === 'done' ? t.is_done : !t.is_done
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>家族共有ボード</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {[
          { key: 'undone', label: '未完了' },
          { key: 'all', label: 'すべて' },
          { key: 'done', label: '完了' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setFilter(key as any)}
            style={[styles.filterTab, filter === key && styles.filterTabActive]}
          >
            <Text style={[styles.filterTabText, filter === key && styles.filterTabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="checkmark-done-circle-outline"
          title={filter === 'done' ? '完了したタスクはありません' : 'タスクはありません'}
          description="右上の「＋」ボタンでタスクを追加しましょう"
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const doneMember = members.find((m) => m.user_id === item.done_by);
            const p = PRIORITY_COLORS[item.priority];
            return (
              <Card style={item.is_done ? [styles.taskCard, styles.taskCardDone] : styles.taskCard}>
                <TouchableOpacity onPress={() => toggleTask(item)} style={styles.taskRow}>
                  <Ionicons
                    name={item.is_done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={28}
                    color={item.is_done ? Colors.success : Colors.border}
                  />
                  <View style={styles.taskBody}>
                    <View style={styles.taskTitleRow}>
                      <Text style={[styles.taskTitle, item.is_done && styles.taskTitleDone]}>
                        {item.title}
                      </Text>
                      <Badge label={p.label} color={p.bg} textColor={p.text} />
                    </View>
                    {item.description ? (
                      <Text style={styles.taskDesc}>{item.description}</Text>
                    ) : null}
                    {item.is_done && doneMember && (
                      <View style={styles.doneRow}>
                        <Avatar name={doneMember.display_name} size={16} />
                        <Text style={styles.doneText}>{doneMember.display_name}が完了</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Card>
            );
          }}
        />
      )}

      {/* Add Task Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>タスクを追加</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="タスク名"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholderTextColor={Colors.textLight}
            />
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="詳細（任意）"
              value={newDesc}
              onChangeText={setNewDesc}
              multiline
              numberOfLines={3}
              placeholderTextColor={Colors.textLight}
            />
            <Text style={styles.modalLabel}>優先度</Text>
            <View style={styles.priorityRow}>
              {(['low', 'normal', 'high'] as const).map((p) => {
                const pc = PRIORITY_COLORS[p];
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPriority(p)}
                    style={[styles.priorityChip, priority === p && { backgroundColor: pc.bg, borderColor: pc.text }]}
                  >
                    <Text style={[styles.priorityChipText, priority === p && { color: pc.text }]}>
                      {pc.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Button label="追加する" onPress={handleAdd} loading={saving} fullWidth />
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterTabText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  filterTabTextActive: { color: Colors.textWhite, fontWeight: FontWeight.semibold },
  list: { padding: Spacing.md, gap: Spacing.sm },
  taskCard: { marginBottom: 0 },
  taskCardDone: { opacity: 0.7 },
  taskRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  taskBody: { flex: 1, gap: 4 },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  taskTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, flex: 1 },
  taskTitleDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  taskDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneText: { fontSize: FontSize.xs, color: Colors.success },
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
  modalLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.surfaceAlt,
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', gap: Spacing.sm },
  priorityChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  priorityChipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
