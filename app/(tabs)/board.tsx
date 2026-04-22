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
import { useAuth } from '../../src/hooks/useAuth';
import { useFamily } from '../../src/hooks/useFamily';
import { supabase } from '../../src/lib/supabase';
import { TaskItem } from '../../src/components/TaskItem';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/constants/colors';
import { Task, FamilyMember } from '../../src/types';

type Filter = 'all' | 'mine' | 'pending';

export default function BoardScreen() {
  const { user } = useAuth();
  const { family, members, children } = useFamily(user?.id);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!family) return;
    const { data } = await supabase
      .from('tasks')
      .select('*, assigned_user:users(name), child:children(name,color)')
      .eq('family_id', family.id)
      .order('is_completed', { ascending: true })
      .order('due_date', { ascending: true });
    setTasks((data ?? []) as Task[]);
  }, [family]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const toggleTask = async (id: string, completed: boolean) => {
    await supabase.from('tasks').update({ is_completed: completed }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: completed } : t));
  };

  const handleAddTask = async () => {
    if (!title.trim() || !family) return;
    setLoading(true);
    try {
      await supabase.from('tasks').insert({
        family_id: family.id,
        title: title.trim(),
        due_date: dueDate || null,
        assigned_to: assignedTo,
        priority,
        is_completed: false,
      });
      setTitle('');
      setDueDate('');
      setAssignedTo(null);
      setPriority('medium');
      setShowModal(false);
      await fetchTasks();
    } catch (e: any) {
      Alert.alert('エラー', e.message ?? 'もう一度お試しください');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'mine') return t.assigned_to === user?.id;
    if (filter === 'pending') return !t.is_completed;
    return true;
  });

  const pendingCount = tasks.filter(t => !t.is_completed).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>✅ 家族共有ボード</Text>
            <Text style={styles.subtitle}>{pendingCount}件が未完了</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.addBtnText}>＋ 追加</Text>
          </TouchableOpacity>
        </View>

        {/* フィルター */}
        <View style={styles.filters}>
          {(['all', 'pending', 'mine'] as Filter[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'すべて' : f === 'pending' ? '未完了' : '自分のタスク'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* タスクリスト */}
        <View style={styles.taskList}>
          {filteredTasks.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyText}>タスクはありません</Text>
            </View>
          ) : (
            filteredTasks.map(task => (
              <TaskItem key={task.id} task={task} onToggle={toggleTask} />
            ))
          )}
        </View>
      </ScrollView>

      {/* 追加モーダル */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>タスクを追加</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <View style={styles.field}>
              <Text style={styles.label}>タスク名</Text>
              <TextInput
                style={styles.input}
                placeholder="例: 水着袋を洗う"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>期限（任意、YYYY-MM-DD形式）</Text>
              <TextInput
                style={styles.input}
                placeholder="2025-04-30"
                value={dueDate}
                onChangeText={setDueDate}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>担当者（任意）</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.chip, !assignedTo && styles.chipActive]}
                  onPress={() => setAssignedTo(null)}
                >
                  <Text style={[styles.chipText, !assignedTo && styles.chipTextActive]}>誰でも</Text>
                </TouchableOpacity>
                {members.map(m => (
                  <TouchableOpacity
                    key={m.user_id}
                    style={[styles.chip, assignedTo === m.user_id && styles.chipActive]}
                    onPress={() => setAssignedTo(m.user_id)}
                  >
                    <Text style={[styles.chipText, assignedTo === m.user_id && styles.chipTextActive]}>
                      {(m as any).users?.name ?? m.user_id}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>優先度</Text>
              <View style={styles.priorityRow}>
                {(['low', 'medium', 'high'] as const).map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityChip, priority === p && styles.priorityChipActive]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>
                      {p === 'low' ? '低' : p === 'medium' ? '中' : '高'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button title="追加する" onPress={handleAddTask} loading={loading} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  filters: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterChip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  taskList: { paddingHorizontal: 16, backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: 16, paddingVertical: 8, marginBottom: 32 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: 20, color: Colors.textSecondary },
  modalBody: { flex: 1, padding: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  input: { height: 48, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  chip: { borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 14, color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityChip: { flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 10, alignItems: 'center' },
  priorityChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  priorityText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  priorityTextActive: { color: '#fff' },
});
