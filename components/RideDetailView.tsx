import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { RideMap } from '@/components/RideMap';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { Ride } from '@/types';
import { formatMoney } from '@/utils/currency';

interface RideDetailViewProps {
  ride: Ride;
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: '600', flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

export function RideDetailView({ ride }: RideDetailViewProps) {
  const { colors } = useTheme();
  const currency = ride.currency ?? 'USD';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.secondary }} contentContainerStyle={styles.content}>
      <View style={styles.mapWrap}>
        <RideMap pickup={ride.pickup.coordinates} destination={ride.destination.coordinates} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.status, { color: colors.primary }]}>{ride.status.toUpperCase()}</Text>
        <Row label="Ride ID" value={ride.id.slice(0, 12)} />
        <Row label="Category" value={ride.category} />
        <Row label="Payment" value={ride.paymentMethod} />
        <Row label="Fare" value={formatMoney(ride.estimatedFare, currency)} />
        <Row label="Distance" value={`${ride.distanceKm.toFixed(1)} km`} />
        {ride.driverEtaMinutes ? <Row label="ETA" value={`${ride.driverEtaMinutes} min`} /> : null}
        <Row label="Pickup" value={ride.pickup.address} />
        <Row label="Destination" value={ride.destination.address} />
        {ride.stops?.length ? (
          <Row label="Stops" value={ride.stops.map((s) => s.address).join(' → ')} />
        ) : null}
        {ride.pinCode ? <Row label="PIN" value={ride.pinVerified ? 'Verified' : ride.pinCode} /> : null}
        {ride.riderRating ? <Row label="Your rating" value={`${ride.riderRating} ★`} /> : null}
        <Row label="Booked" value={new Date(ride.createdAt).toLocaleString()} />
        {ride.completedAt ? (
          <Row label="Completed" value={new Date(ride.completedAt).toLocaleString()} />
        ) : null}
        {ride.sosTriggered ? (
          <Text style={{ color: colors.error, fontWeight: '700' }}>SOS was triggered on this trip</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.xl },
  mapWrap: { height: 220 },
  card: {
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  status: { fontSize: 18, fontWeight: '800', marginBottom: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
});
