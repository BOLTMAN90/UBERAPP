import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text } from 'react-native';

import { Button } from '@/components/Button';
import { InputField } from '@/components/InputField';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { createPromoCode, getPlatformSettings, updatePlatformSettings } from '@/services/admin';

export default function AdminSettingsScreen() {
  const { colors } = useTheme();
  const [commission, setCommission] = useState('15');
  const [surge, setSurge] = useState('1');
  const [autoSurge, setAutoSurge] = useState(false);
  const [promoCode, setPromoCode] = useState('RIDE10');

  useEffect(() => {
    void getPlatformSettings().then((s) => {
      setCommission(String(s.commissionPercent));
      setSurge(String(s.surgeMultiplier));
      setAutoSurge(s.autoSurgeEnabled);
    });
  }, []);

  const save = async () => {
    await updatePlatformSettings({
      commissionPercent: Number(commission),
      surgeMultiplier: Number(surge),
      autoSurgeEnabled: autoSurge,
    });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.secondary }} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Platform control</Text>
      <InputField label="Commission %" keyboardType="numeric" value={commission} onChangeText={setCommission} />
      <InputField label="Surge multiplier" keyboardType="decimal-pad" value={surge} onChangeText={setSurge} />
      <Text style={{ color: colors.text }}>Auto surge</Text>
      <Switch value={autoSurge} onValueChange={setAutoSurge} trackColor={{ true: colors.primary }} />
      <Button label="Save settings" onPress={save} />
      <InputField label="New promo code" value={promoCode} onChangeText={setPromoCode} />
      <Button label="Create promo (10% off)" variant="secondary" onPress={() => void createPromoCode(promoCode, 10, 100)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.md },
  title: { fontSize: 22, fontWeight: '800' },
});
