import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/theme';
import { ChildColor } from '../../types';

const COLORS: ChildColor[] = [
  '#FF6B9D',
  '#4ECDC4',
  '#FFE66D',
  '#A8E6CF',
  '#FF8B94',
  '#B4A7D6',
];

interface ChildColorPickerProps {
  selected: ChildColor;
  onSelect: (color: ChildColor) => void;
}

export function ChildColorPicker({ selected, onSelect }: ChildColorPickerProps) {
  return (
    <View style={styles.row}>
      {COLORS.map((color) => (
        <TouchableOpacity
          key={color}
          onPress={() => onSelect(color)}
          style={[styles.swatch, { backgroundColor: color }]}
          activeOpacity={0.8}
        >
          {selected === color && (
            <Ionicons name="checkmark" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
