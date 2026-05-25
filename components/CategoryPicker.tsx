import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { RIDE_CATEGORIES } from '@/constants/rideOptions';
import { useTheme } from '@/context/ThemeContext';
import { Radius, Spacing } from '@/constants/theme';
import type { RideCategory } from '@/types';

interface CategoryPickerProps {
  value: RideCategory;
  onChange: (category: RideCategory) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { colors } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {RIDE_CATEGORIES.map((cat) => {
        const active = value === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onChange(cat.id)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}>
            <FontAwesome
              name={cat.icon as 'car'}
              size={16}
              color={active ? colors.black : colors.textSecondary}
            />
            <Text style={[styles.chipLabel, { color: active ? colors.black : colors.text }]}>
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipLabel: {
    fontWeight: '600',
    fontSize: 13,
  },
});
