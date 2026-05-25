import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { activateDriverSubscription, getDriverProfile } from '@/services/drivers';
import { getPlatformSettings } from '@/services/admin';
import type { DriverProfile } from '@/types';

export default function DriverEarningsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [weeklyFee, setWeeklyFee] = useState(2500);

  useEffect(() => {
    if (!user) return;
    void getDriverProfile(user.uid).then(setProfile);
    void getPlatformSettings().then((s) => setWeeklyFee(s.driverSubscriptionWeekly));
  }, [user]);

  const net = (profile?.totalEarnings ?? 0) - (profile?.fuelCostTotal ?? 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.secondary }} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Earnings analytics</Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={{ color: colors.textSecondary }}>Total earnings</Text>
        <Text style={[styles.big, { color: colors.primary }]}>₦{(profile?.totalEarnings ?? 0).toLocaleString()}</Text>
        <Text style={{ color: colors.textSecondary }}>Fuel spent: ₦{(profile?.fuelCostTotal ?? 0).toLocaleString()}</Text>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Net estimate: ₦{net.toLocaleString()}</Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Demand heatmap</Text>
        <Text style={{ color: colors.textSecondary }}>
          Busy zones update live when more drivers are online. Check peak hours 7–9am and 5–8pm.
        </Text>
        <View style={[styles.heat, { backgroundColor: colors.primary + '33' }]} />
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Weekly subscription</Text>
        <Text style={{ color: colors.textSecondary }}>
          Lower commission model — ₦{weeklyFee.toLocaleString()}/week
        </Text>
        <Button
          label={profile?.subscriptionActive ? 'Subscription active' : 'Activate subscription'}
          disabled={profile?.subscriptionActive}
          onPress={() => user && void activateDriverSubscription(user.uid, weeklyFee).then(() => getDriverProfile(user.uid).then(setProfile))}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.md },
  title: { fontSize: 22, fontWeight: '800' },
  card: { padding: Spacing.lg, borderRadius: Radius.lg, gap: Spacing.sm },
  big: { fontSize: 32, fontWeight: '800' },
  heat: { height: 80, borderRadius: Radius.md, marginTop: Spacing.sm },
});
