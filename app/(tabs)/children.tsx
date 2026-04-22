import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useFamily } from '../../src/hooks/useFamily';
import { supabase } from '../../src/lib/supabase';
import { ChildCard } from '../../src/components/ChildCard';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/constants/colors';
import { CHILD_COLORS } from '../../src/types';

export default function ChildrenScreen() {
  const { user } = useAuth();
  const { children, family, addChild, refetch } = useFamily(user?.id);
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [childName, setChildName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CHILD_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const handleAddChild = async () => {
    if (!childName.trim()) {
      Alert.alert('入力エラー', 'お子さんの名前を入力してください');
      return;
    }
    setLoading(true);
    try {
      const child = await addChild({ name: childName.trim(), color: selectedColor });
      if (child && institutionName.trim()) {
        await supabase.from('institutions').insert({
          child_id: child.id,
          name: institutionName.trim(),
          type: 'nursery',
        });
      }
      setChildName('');
      setInstitutionName('');
      setSelectedColor(CHILD_COLORS[0]);
      setShowModal(false);
      await refetch();
    } catch (e: any) {
      Alert.alert('エラー', e.message ?? 'もう一度お試しください');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>👶 子ども一覧</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.addBtnText}>＋ 追加</Text>
          </TouchableOpacity>
        </View>

        {/* 招待コード */}
        {family && (
          <TouchableOpacity
            style={styles.inviteCard}
            onPress={() => setShowInvite(!showInvite)}
          >
            <Text style={styles.inviteTitle}>👨‍👩‍👧 家族を招待する</Text>
            {showInvite ? (
              <View style={styles.inviteCode}>
                <Text style={styles.codeLabel}>招待コード</Text>
                <Text style={styles.code}>{family.invite_code}</Text>
                <Text style={styles.codeHint}>このコードを家族にシェアしてください</Text>
              </View>
            ) : (
              <Text style={styles.inviteHint}>タップして招待コードを表示</Text>
            )}
          </TouchableOpacity>
        )}

        {/* 子ども一覧 */}
        {children.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👶</Text>
            <Text style={styles.emptyText}>お子さんを追加しましょう</Text>
            <Button title="追加する" onPress={() => setShowModal(true)} style={styles.emptyBtn} />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {children.map(child => (
              <ChildCard
                key={child.id}
                child={child}
                onPress={() => router.push(`/child/${child.id}`)}
              />
            ))}
          </ScrollView>
        )}

        {/* 子ども詳細リスト */}
        <View style={styles.list}>
          {children.map(child => (
            <TouchableOpacity
              key={child.id}
              style={styles.listItem}
              onPress={() => router.push(`/child/${child.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.listAvatar, { backgroundColor: child.color }]}>
                <Text style={styles.listAvatarText}>{child.name.charAt(0)}</Text>
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listName}>{child.name}</Text>
                {child.institutions && child.institutions.length > 0 && (
                  <Text style={styles.listInstitution}>{child.institutions[0].name}</Text>
                )}
              </View>
              <Text style={styles.listArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 追加モーダル */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>お子さんを追加</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <View style={styles.field}>
              <Text style={styles.label}>お子さんの名前</Text>
              <TextInput
                style={styles.input}
                placeholder="さくら"
                value={childName}
                onChangeText={setChildName}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>施設名（任意）</Text>
              <TextInput
                style={styles.input}
                placeholder="○○保育園"
                value={institutionName}
                onChangeText={setInstitutionName}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>カラー</Text>
              <View style={styles.colors}>
                {CHILD_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorDot, { backgroundColor: color }, selectedColor === color && styles.colorSelected]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>
            </View>
            <Button title="追加する" onPress={handleAddChild} loading={loading} style={styles.modalBtn} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  inviteCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.primaryLight, borderStyle: 'dashed' },
  inviteTitle: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  inviteHint: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  inviteCode: { marginTop: 8 },
  codeLabel: { fontSize: 12, color: Colors.textSecondary },
  code: { fontSize: 32, fontWeight: '700', color: Colors.primary, letterSpacing: 4, textAlign: 'center', marginVertical: 8 },
  codeHint: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, marginBottom: 24 },
  emptyBtn: { width: 160 },
  childRow: { marginBottom: 16, paddingVertical: 8 },
  list: { paddingHorizontal: 16 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  listAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  listContent: { flex: 1 },
  listName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  listInstitution: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  listArrow: { fontSize: 24, color: Colors.textMuted },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: 20, color: Colors.textSecondary },
  modalBody: { flex: 1, padding: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  input: { height: 48, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  colors: { flexDirection: 'row', gap: 12 },
  colorDot: { width: 40, height: 40, borderRadius: 20 },
  colorSelected: { borderWidth: 3, borderColor: Colors.textPrimary },
  modalBtn: { marginTop: 8 },
});
