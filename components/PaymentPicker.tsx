import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PAYMENT_METHODS } from '@/constants/rideOptions';
import { useTheme } from '@/context/ThemeContext';
import { Radius, Spacing } from '@/constants/theme';
import type { PaymentMethod } from '@/types';

interface PaymentPickerProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentPicker({ value, onChange }: PaymentPickerProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.grid}>
      {PAYMENT_METHODS.map((method) => {
        const active = value === method.id;
        return (
          <Pressable
            key={method.id}
            onPress={() => onChange(method.id)}
            style={[
              styles.item,
              {
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}>
            <FontAwesome
              name={method.icon as 'money'}
              size={18}
              color={active ? colors.black : colors.textSecondary}
            />
            <Text style={[styles.label, { color: active ? colors.black : colors.text }]}>
              {method.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    minWidth: '30%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
