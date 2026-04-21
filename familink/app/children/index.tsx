import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFamilyStore } from '../../store/familyStore';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';
import { enrichChild, calcAgeLabel } from '../../lib/utils';

export default function ChildrenScreen() {
  const { children } = useFamilyStore();
  const enriched = children.map(enrichChild);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>お子さん一覧</Text>
        <TouchableOpacity onPress={() => router.push('/setup/children')}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {enriched.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="お子さんが登録されていません"
          description="右上の「＋」からお子さんを追加してください"
        />
      ) : (
        <FlatList
          data={enriched}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/children/${item.id}`)} activeOpacity={0.8}>
              <Card style={styles.childCard}>
                <Avatar name={item.name} color={item.color} size={60} />
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{item.name}</Text>
                  <Text style={styles.childAge}>{item.ageLabel}</Text>
                  {item.school_name && (
                    <Badge label={item.school_name} color={item.color + '30'} textColor={item.color} />
                  )}
                  {item.class_name && (
                    <Text style={styles.childClass}>{item.class_name}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
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
  list: { padding: Spacing.md, gap: Spacing.sm },
  childCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  childInfo: { flex: 1, gap: 4 },
  childName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  childAge: { fontSize: FontSize.sm, color: Colors.textSecondary },
  childClass: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
