import { useEffect, useState } from 'react';
import { FlatList, Text } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { subscribeToActiveRides } from '@/services/admin';
import type { Ride } from '@/types';

export default function AdminRidesScreen() {
  const { colors } = useTheme();
  const [rides, setRides] = useState<Ride[]>([]);

  useEffect(() => subscribeToActiveRides(setRides), []);

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.secondary }}
      data={rides}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
      ListEmptyComponent={<Text style={{ color: colors.textSecondary }}>No active rides.</Text>}
      renderItem={({ item }) => (
        <Text style={{ color: colors.text, backgroundColor: colors.surface, padding: Spacing.md, borderRadius: 12 }}>
          {item.status.toUpperCase()} · ₦{item.estimatedFare}
          {'\n'}
          {item.pickup?.address} → {item.destination?.address}
          {item.sosTriggered ? '\n🚨 SOS ALERT' : ''}
        </Text>
      )}
    />
  );
}
