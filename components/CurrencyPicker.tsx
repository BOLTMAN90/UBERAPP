import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { CURRENCIES } from '@/constants/currencies';
import { useTheme } from '@/context/ThemeContext';
import { Radius, Spacing } from '@/constants/theme';
import type { CurrencyCode } from '@/types';
import { formatMoney } from '@/utils/currency';

interface CurrencyPickerProps {
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
  balance?: number;
}

export function CurrencyPicker({ value, onChange, balance }: CurrencyPickerProps) {
  const { colors } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {CURRENCIES.map((c) => {
        const active = value === c.code;
        return (
          <Pressable
            key={c.code}
            onPress={() => onChange(c.code)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}>
            <Text style={{ fontWeight: '700', color: active ? colors.black : colors.text }}>
              {c.code}
            </Text>
            <Text style={{ fontSize: 11, color: active ? colors.black : colors.textSecondary }}>
              {c.label}
            </Text>
            {active && balance != null ? (
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.black }}>
                {formatMoney(balance, c.code)}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  chip: {
    minWidth: 88,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 2,
  },
});
