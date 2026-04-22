import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Child } from '../types';
import { Colors } from '../constants/colors';

interface ChildCardProps {
  child: Child;
  onPress: () => void;
}

export function ChildCard({ child, onPress }: ChildCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.avatar, { backgroundColor: child.color }]}>
        <Text style={styles.avatarText}>{child.name.charAt(0)}</Text>
      </View>
      <Text style={styles.name}>{child.name}</Text>
      {child.institutions && child.institutions.length > 0 && (
        <Text style={styles.institution}>{child.institutions[0].name}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  institution: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});
