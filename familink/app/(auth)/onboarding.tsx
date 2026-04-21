import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'heart-circle' as const,
    iconColor: Colors.primary,
    title: 'ふぁみりんく',
    subtitle: '家族みんなで\n子育てを運営しよう',
    description: 'ママだけが知っている情報をなくし、\n家族全員でスムーズに子育てができる\nアプリです。',
    bg: '#FFF0F5',
  },
  {
    id: '2',
    icon: 'calendar-outline' as const,
    iconColor: Colors.secondary,
    title: '行事・持ち物を一元管理',
    subtitle: 'プリントを撮るだけで\n自動登録',
    description: 'AIがプリントを読み取り、イベントや\n持ち物を自動で整理。家族全員が\n同じ情報を共有できます。',
    bg: '#F0FFFE',
  },
  {
    id: '3',
    icon: 'checkmark-circle-outline' as const,
    iconColor: Colors.accent,
    title: '明日の準備を一緒に',
    subtitle: '誰がチェックしたか\nリアルタイムで確認',
    description: '持ち物チェックリストをパパとも共有。\n離れていても「できた！」が\n分かります。',
    bg: '#FFFCF0',
  },
  {
    id: '4',
    icon: 'medical-outline' as const,
    iconColor: '#6BCB77',
    title: '体調記録も家族で共有',
    subtitle: '体温・症状をすぐに\n家族へ通知',
    description: '子どもの体調変化を記録すると、\n家族にすぐお知らせ。いつでも\n状態を確認できます。',
    bg: '#F0FFF4',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.bg }]}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.surface }]}>
              <Ionicons name={item.icon} size={80} color={item.iconColor} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.btnArea}>
        <Button
          label={currentIndex === SLIDES.length - 1 ? 'はじめる' : 'つぎへ'}
          onPress={handleNext}
          fullWidth
          size="lg"
        />
        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skip}>
            <Text style={styles.skipText}>スキップ</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 34,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  btnArea: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  skip: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
