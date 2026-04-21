import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFamilyStore } from '../../store/familyStore';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { enrichChild } from '../../lib/utils';

export default function HealthIndexScreen() {
  const { children } = useFamilyStore();
  const enriched = children.map(enrichChild);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>体調記録</Text>
        <View style={{ width: 24 }} />
      </View>
      <Text style={styles.subtitle}>記録するお子さんを選択してください</Text>

      {enriched.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="お子さんが登録されていません"
          description="設定からお子さんを追加してください"
        />
      ) : (
        <FlatList
          data={enriched}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/health/${item.id}`)}
              activeOpacity={0.8}
            >
              <Card style={styles.childCard}>
                <Avatar name={item.name} color={item.color} size={56} />
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{item.name}</Text>
                  <Text style={styles.childAge}>{item.ageLabel}</Text>
                </View>
                <View style={styles.recordBtn}>
                  <Ionicons name="add-circle" size={32} color={item.color} />
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  list: { padding: Spacing.md, gap: Spacing.sm },
  childCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  childInfo: { flex: 1 },
  childName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  childAge: { fontSize: FontSize.sm, color: Colors.textSecondary },
  recordBtn: {},
});
