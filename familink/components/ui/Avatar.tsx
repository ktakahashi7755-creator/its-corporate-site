import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontWeight } from '../../constants/theme';

interface AvatarProps {
  name?: string;
  uri?: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function Avatar({ name, uri, size = 40, color = Colors.primary, style }: AvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const fontSize = size * 0.4;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, resizeMode: 'cover' }}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { resizeMode: 'cover' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontWeight: FontWeight.bold },
});
