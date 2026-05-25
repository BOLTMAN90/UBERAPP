import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import type { RideStatus } from '@/types';

const statusLabels: Record<RideStatus, string> = {
  requested: 'Driver assigned',
  searching: 'Searching for a driver',
  negotiating: 'Negotiating fare with drivers',
  accepted: 'Driver accepted',
  arriving: 'Driver arriving',
  ongoing: 'Trip in progress',
  completed: 'Trip completed',
  cancelled: 'Trip cancelled',
};

interface RideStatusCardProps {
  status: RideStatus;
  pickup: string;
  destination: string;
  fare?: number;
  etaMinutes?: number;
  category?: string;
}

export function RideStatusCard({
  status,
  pickup,
  destination,
  fare,
  etaMinutes,
  category,
}: RideStatusCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.status}>{statusLabels[status]}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Pickup</Text>
        <Text style={styles.value}>{pickup}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Destination</Text>
        <Text style={styles.value}>{destination}</Text>
      </View>
      {category ? <Text style={styles.value}>Category: {category}</Text> : null}
      {typeof etaMinutes === 'number' ? (
        <Text style={styles.value}>ETA: {etaMinutes} min</Text>
      ) : null}
      {typeof fare === 'number' ? (
        <Text style={styles.fare}>Fare: {fare.toFixed(2)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    shadowColor: Colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  status: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  row: {
    gap: 2,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 15,
    color: Colors.text,
  },
  fare: {
    marginTop: Spacing.xs,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
});
