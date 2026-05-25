import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { router } from 'expo-router';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { getAdminStats, subscribeToActiveRides } from '@/services/admin';
import type { AdminStats, Ride } from '@/types';
import { voidFirestore } from '@/utils/voidFirestore';

export default function AdminDashboardScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeRides, setActiveRides] = useState<Ride[]>([]);

  useEffect(() => {
    voidFirestore(getAdminStats().then(setStats), 'admin:stats');
    return subscribeToActiveRides(setActiveRides);
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.secondary }} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>BoltRide Admin</Text>
      <View style={styles.grid}>
        {[
          ['Total rides', stats?.totalRides],
          ['Active now', stats?.activeRides],
          ['Revenue', stats ? `₦${stats.totalRevenue.toLocaleString()}` : '—'],
          ['Drivers online', stats?.onlineDrivers],
          ['Riders', stats?.totalRiders],
        ].map(([label, value]) => (
          <View key={String(label)} style={[styles.stat, { backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{label}</Text>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 20 }}>{value ?? '…'}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.section, { color: colors.text }]}>Live map · {activeRides.length} active</Text>
      {activeRides.slice(0, 5).map((r) => (
        <Text key={r.id} style={{ color: colors.textSecondary, fontSize: 13 }}>
          {r.status} · {r.pickup?.address} → {r.destination?.address}
          {r.sosTriggered ? ' · 🚨 SOS' : ''}
        </Text>
      ))}

      <Button label="Manage users & KYC" onPress={() => router.push('/(admin)/users')} />
      <Button label="Monitor all rides" variant="secondary" onPress={() => router.push('/(admin)/rides')} />
      <Button label="Surge & commission" variant="outline" onPress={() => router.push('/(admin)/settings')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.md },
  title: { fontSize: 26, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  stat: { width: '47%', padding: Spacing.md, borderRadius: Radius.md },
  section: { fontWeight: '700', fontSize: 16 },
});
