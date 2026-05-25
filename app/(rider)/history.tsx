import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { subscribeToUserRides, updateRideStatus } from '@/services/rides';
import type { Ride, RideStatus } from '@/types';
import { formatMoney } from '@/utils/currency';

const ACTIVE_STATUSES: RideStatus[] = [
  'searching',
  'requested',
  'negotiating',
  'accepted',
  'arriving',
  'ongoing',
];

const STATUS_COLORS: Record<RideStatus, string> = {
  searching: '#F59E0B',
  requested: '#F59E0B',
  negotiating: '#F59E0B',
  accepted: '#10B981',
  arriving: '#3B82F6',
  ongoing: '#3B82F6',
  completed: '#6B7280',
  cancelled: '#EF4444',
};

const STATUS_LABELS: Record<RideStatus, string> = {
  searching: 'Searching for a driver',
  requested: 'Awaiting driver acceptance',
  negotiating: 'Negotiating fare',
  accepted: 'Driver accepted · waiting for pickup',
  arriving: 'Driver is arriving',
  ongoing: 'Trip in progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function RiderHistoryScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserRides(user.uid, (next) => {
      setRides(next);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const { activeRides, pastRides } = useMemo(() => {
    const active: Ride[] = [];
    const past: Ride[] = [];
    for (const r of rides) {
      if (ACTIVE_STATUSES.includes(r.status)) active.push(r);
      else past.push(r);
    }
    return { activeRides: active, pastRides: past };
  }, [rides]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.secondary }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.secondary }}
      contentContainerStyle={styles.content}>
      {activeRides.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Active booking</Text>
          {activeRides.map((ride) => (
            <ActiveRideCard key={ride.id} ride={ride} />
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Trip history</Text>
        {pastRides.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            No completed trips yet.
          </Text>
        ) : (
          pastRides.map((ride) => <PastRideRow key={ride.id} ride={ride} />)
        )}
      </View>
    </ScrollView>
  );
}

function ActiveRideCard({ ride }: { ride: Ride }) {
  const { colors } = useTheme();
  const statusColor = STATUS_COLORS[ride.status];
  const showCancel = ride.status !== 'ongoing';

  return (
    <View
      style={[
        styles.activeCard,
        { backgroundColor: colors.surface, borderColor: colors.primary },
      ]}>
      <View style={styles.activeHeader}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.activeStatus, { color: colors.text }]}>
          {STATUS_LABELS[ride.status]}
        </Text>
      </View>

      {ride.pinCode && !ride.pinVerified ? (
        <View style={[styles.pinBox, { borderColor: colors.primary }]}>
          <Text style={[styles.pinEyebrow, { color: colors.primaryDark }]}>YOUR RIDE PIN</Text>
          <Text style={[styles.pinValue, { color: colors.text }]}>{ride.pinCode}</Text>
          <Text style={[styles.pinHint, { color: colors.textSecondary }]}>
            Share this PIN with the driver — they must enter it to accept your booking.
          </Text>
        </View>
      ) : null}

      <View style={styles.routeRow}>
        <FontAwesome name="circle" size={10} color={colors.primary} />
        <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>
          {ride.pickup.address}
        </Text>
      </View>
      <View style={styles.routeRow}>
        <FontAwesome name="map-marker" size={12} color={colors.error} />
        <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>
          {ride.destination.address}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          {ride.category} · {formatMoney(ride.estimatedFare, ride.currency ?? 'USD')}
          {ride.driverEtaMinutes ? ` · ${ride.driverEtaMinutes} min` : ''}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push(`/(rider)/ride/${ride.id}` as Href)}
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.actionText, { color: Colors.black }]}>View details</Text>
        </Pressable>
        {showCancel ? (
          <Pressable
            onPress={() => void updateRideStatus(ride.id, 'cancelled')}
            style={[styles.actionBtn, styles.actionOutline, { borderColor: colors.border }]}>
            <Text style={[styles.actionText, { color: colors.text }]}>Cancel ride</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function PastRideRow({ ride }: { ride: Ride }) {
  const { colors } = useTheme();
  const statusColor = STATUS_COLORS[ride.status];
  const isCompleted = ride.status === 'completed';
  const needsRating = isCompleted && !ride.riderRating;

  return (
    <Pressable
      onPress={() => router.push(`/(rider)/ride/${ride.id}` as Href)}
      style={[styles.pastCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.pastTop}>
        <View style={[styles.statusPill, { backgroundColor: `${statusColor}1A` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusPillText, { color: statusColor }]}>
            {ride.status.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.pastDate, { color: colors.textSecondary }]}>
          {new Date(ride.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={[styles.pastRoute, { color: colors.text }]} numberOfLines={1}>
        {ride.pickup.address} → {ride.destination.address}
      </Text>
      <Text style={[styles.pastMeta, { color: colors.textSecondary }]}>
        {ride.category} · {formatMoney(ride.estimatedFare, ride.currency ?? 'USD')} ·{' '}
        {ride.paymentMethod}
      </Text>
      {needsRating ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/(rider)/rate?rideId=${ride.id}` as Href);
          }}
          style={[styles.rateBtn, { backgroundColor: colors.primary }]}>
          <FontAwesome name="star" size={12} color={Colors.black} />
          <Text style={[styles.rateText, { color: Colors.black }]}>Rate trip</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: Spacing.xl },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  empty: { textAlign: 'center', paddingVertical: Spacing.lg },

  activeCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  activeStatus: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },

  pinBox: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 2,
    marginTop: 4,
  },
  pinEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  pinValue: { fontSize: 34, fontWeight: '800', letterSpacing: 12 },
  pinHint: { fontSize: 11.5, textAlign: 'center', marginTop: 4 },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  routeText: { fontSize: 13.5, flex: 1, fontWeight: '600' },
  metaRow: { marginTop: 2 },
  metaText: { fontSize: 12.5, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  actionOutline: { backgroundColor: 'transparent', borderWidth: 1 },
  actionText: { fontWeight: '800', fontSize: 13 },

  pastCard: { padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, gap: 6 },
  pastTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  pastDate: { fontSize: 11.5 },
  pastRoute: { fontSize: 13.5, fontWeight: '700' },
  pastMeta: { fontSize: 12 },
  rateBtn: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 6,
  },
  rateText: { fontSize: 12, fontWeight: '800' },
});
