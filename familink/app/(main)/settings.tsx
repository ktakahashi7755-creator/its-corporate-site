import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useFamilyStore } from '../../store/familyStore';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const { family, members, reset } = useFamilyStore();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [tomorrowNotif, setTomorrowNotif] = useState(true);

  const displayName = user?.user_metadata?.display_name ?? 'ユーザー';

  const handleInvite = async () => {
    if (!family) return;
    try {
      await Share.share({
        message: `ふぁみりんくに招待します！\n招待コード：${family.invite_code}\n\nアプリを開いて「招待コードで参加」から入力してください。`,
        title: 'ふぁみりんくへの招待',
      });
    } catch {
      Alert.alert('招待コード', family.invite_code);
    }
  };

  const handleSignOut = () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: async () => {
          reset();
          await signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>設定</Text>

        {/* Profile */}
        <Card style={styles.profileCard}>
          <Avatar name={displayName} size={64} uri={user?.user_metadata?.avatar_url} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </Card>

        {/* Family */}
        <Text style={styles.sectionLabel}>家族</Text>
        <Card style={styles.section}>
          {family && (
            <View style={styles.row}>
              <Ionicons name="home-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.rowLabel}>{family.name}</Text>
              <Text style={styles.rowValue}>招待コード: {family.invite_code}</Text>
            </View>
          )}
          <SettingRow icon="person-add-outline" label="家族を招待する" onPress={handleInvite} />
          <Text style={styles.sectionSubLabel}>メンバー</Text>
          {members.map((m) => (
            <View key={m.id} style={styles.memberRow}>
              <Avatar name={m.display_name} size={32} uri={m.avatar_url} />
              <Text style={styles.memberName}>{m.display_name}</Text>
              <Text style={styles.memberRole}>{m.role === 'owner' ? 'オーナー' : 'メンバー'}</Text>
            </View>
          ))}
        </Card>

        {/* Children */}
        <Text style={styles.sectionLabel}>お子さん管理</Text>
        <Card style={styles.section}>
          <SettingRow
            icon="add-circle-outline"
            label="お子さんを追加"
            onPress={() => router.push('/setup/children')}
          />
        </Card>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>通知設定</Text>
        <Card style={styles.section}>
          <View style={styles.switchRow}>
            <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.switchLabel}>通知を受け取る</Text>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ true: Colors.primary, false: Colors.border }}
            />
          </View>
          <View style={styles.switchRow}>
            <Ionicons name="moon-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.switchLabel}>明日の準備リマインダー（21時）</Text>
            <Switch
              value={tomorrowNotif}
              onValueChange={setTomorrowNotif}
              trackColor={{ true: Colors.primary, false: Colors.border }}
            />
          </View>
        </Card>

        {/* App */}
        <Text style={styles.sectionLabel}>アプリについて</Text>
        <Card style={styles.section}>
          <SettingRow icon="document-text-outline" label="利用規約" onPress={() => {}} />
          <SettingRow icon="shield-checkmark-outline" label="プライバシーポリシー" onPress={() => {}} />
          <View style={styles.row}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.rowLabel}>バージョン</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
        </Card>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.signOutText}>ログアウト</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={20} color={Colors.textSecondary} />
      <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    padding: Spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  profileEmail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  sectionSubLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingLeft: 4,
  },
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rowLabel: { fontSize: FontSize.md, color: Colors.text },
  rowValue: { fontSize: FontSize.sm, color: Colors.textSecondary },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  switchLabel: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  memberName: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  memberRole: { fontSize: FontSize.sm, color: Colors.textSecondary },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.errorLight,
  },
  signOutText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.error },
});
