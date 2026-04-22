import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HealthLog } from '../types';
import { Colors } from '../constants/colors';

interface HealthBadgeProps {
  log: HealthLog | null;
  childName: string;
}

export function HealthBadge({ log, childName }: HealthBadgeProps) {
  const hasFever = log && log.temperature != null && log.temperature >= 37.5;
  const color = hasFever ? Colors.danger : Colors.success;
  const label = hasFever ? `${log!.temperature}℃ 発熱中` : '平熱';

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.name}>{childName}</Text>
      <Text style={[styles.status, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  name: { fontSize: 14, color: Colors.textPrimary, marginRight: 6 },
  status: { fontSize: 14, fontWeight: '600' },
});
