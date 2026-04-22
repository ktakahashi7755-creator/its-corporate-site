import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task } from '../types';
import { Colors } from '../constants/colors';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
}

const priorityColors: Record<string, string> = {
  high: Colors.danger,
  medium: Colors.warning,
  low: Colors.success,
};

export function TaskItem({ task, onToggle }: TaskItemProps) {
  return (
    <TouchableOpacity
      style={[styles.item, task.is_completed && styles.completed]}
      onPress={() => onToggle(task.id, !task.is_completed)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, task.is_completed && styles.checkboxDone]}>
        {task.is_completed && <Text style={styles.check}>✓</Text>}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, task.is_completed && styles.titleDone]}>
          {task.title}
        </Text>
        {task.due_date && (
          <Text style={styles.due}>
            期限: {new Date(task.due_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
          </Text>
        )}
      </View>
      {task.priority !== 'low' && (
        <View style={[styles.priority, { backgroundColor: priorityColors[task.priority] + '22' }]}>
          <Text style={[styles.priorityText, { color: priorityColors[task.priority] }]}>
            {task.priority === 'high' ? '急ぎ' : '中'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  completed: { opacity: 0.5 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  check: { color: '#fff', fontSize: 13, fontWeight: '700' },
  content: { flex: 1 },
  title: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  titleDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  due: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  priority: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  priorityText: { fontSize: 11, fontWeight: '600' },
});
