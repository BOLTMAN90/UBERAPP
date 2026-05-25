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
import { subscribeToDriverTrips } from '@/services/rides';
import type { Ride, RideStatus } from '@/types';
import { formatMoney } from '@/utils/currency';

type TripBucket = 'pending' | 'active' | 'completed' | 'declined' | 'cancelled';

const BUCKET_ORDER: { id: TripBucket; label: string; icon: string }[] = [
  { id: 'pending', label: 'Pending', icon: 'hourglass-half' },
  { id: 'active', label: 'Active', icon: 'car' },
  { id: 'completed', label: 'Completed', icon: 'check-circle' },
  { id: 'declined', label: 'Declined', icon: 'times-circle' },
  { id: 'cancelled', label: 'Cancelled', icon: 'ban' },
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

function classifyTrip(ride: Ride, driverId: string | undefined): TripBucket {
  if (ride.driverId === driverId) {
    if (ride.status === 'requested') return 'pending';
    if (['accepted', 'arriving', 'ongoing', 'negotiating'].includes(ride.status)) {
      return 'active';
    }
    if (ride.status === 'completed') return 'completed';
    if (ride.status === 'cancelled') return 'cancelled';
  }
  if (ride.declinedBy?.includes(driverId ?? '')) {
    return 'declined';
  }
  return 'cancelled';
}

export default function DriverTripsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TripBucket | 'all'>('all');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToDriverTrips(user.uid, (next) => {
      setRides(next);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const buckets = useMemo(() => {
    const map: Record<TripBucket, Ride[]> = {
      pending: [],
      active: [],
      completed: [],
      declined: [],
      cancelled: [],
    };
    for (const ride of rides) {
      const bucket = classifyTrip(ride, user?.uid);
      map[bucket].push(ride);
    }
    return map;
  }, [rides, user?.uid]);

  const visibleBuckets = useMemo(() => {
    if (filter === 'all') {
      return BUCKET_ORDER.filter((b) => buckets[b.id].length > 0);
    }
    return BUCKET_ORDER.filter((b) => b.id === filter);
  }, [filter, buckets]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.secondary }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.secondary }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}>
        <FilterChip
          label="All"
          icon="list"
          active={filter === 'all'}
          onPress={() => setFilter('all')}
          count={rides.length}
        />
        {BUCKET_ORDER.map((b) => (
          <FilterChip
            key={b.id}
            label={b.label}
            icon={b.icon}
            active={filter === b.id}
            onPress={() => setFilter(b.id)}
            count={buckets[b.id].length}
          />
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}>
        {rides.length === 0 ? (
          <View style={styles.emptyWrap}>
            <FontAwesome name="inbox" size={36} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No trips yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              When a customer books a ride for you it will appear here as pending.
            </Text>
          </View>
        ) : visibleBuckets.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary, textAlign: 'center' }]}>
            Nothing in this view.
          </Text>
        ) : (
          visibleBuckets.map((bucket) => (
            <View key={bucket.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <FontAwesome name={bucket.icon as 'list'} size={14} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {bucket.label}
                </Text>
                <View style={[styles.countPill, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.countPillText, { color: colors.text }]}>
                    {buckets[bucket.id].length}
                  </Text>
                </View>
              </View>
              {buckets[bucket.id].map((ride) => (
                <TripCard key={ride.id} ride={ride} bucket={bucket.id} />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function FilterChip({
  label,
  icon,
  active,
  onPress,
  count,
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
  count: number;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}>
      <FontAwesome name={icon as 'list'} size={11} color={active ? Colors.black : colors.text} />
      <Text style={[styles.chipText, { color: active ? Colors.black : colors.text }]}>
        {label}
      </Text>
      <View
        style={[
          styles.chipCount,
          {
            backgroundColor: active ? 'rgba(0,0,0,0.15)' : colors.secondary,
          },
        ]}>
        <Text
          style={[
            styles.chipCountText,
            { color: active ? Colors.black : colors.textSecondary },
          ]}>
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

function TripCard({ ride, bucket }: { ride: Ride; bucket: TripBucket }) {
  const { colors } = useTheme();
  const statusColor = STATUS_COLORS[ride.status];
  const isPending = bucket === 'pending';

  return (
    <Pressable
      onPress={() => router.push(`/(driver)/trip/${ride.id}` as Href)}
      style={[
        styles.tripCard,
        {
          backgroundColor: colors.surface,
          borderColor: isPending ? colors.primary : colors.border,
          borderWidth: isPending ? 2 : 1,
        },
      ]}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusPill, { backgroundColor: `${statusColor}1A` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusPillText, { color: statusColor }]}>
            {bucket === 'pending' ? 'PENDING' : ride.status.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
          {new Date(ride.createdAt).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      <View style={styles.routeBlock}>
        <View style={styles.routeRow}>
          <FontAwesome name="circle" size={9} color={colors.primary} />
          <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>
            {ride.pickup.address}
          </Text>
        </View>
        <View style={styles.routeRow}>
          <FontAwesome name="map-marker" size={11} color={colors.error} />
          <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>
            {ride.destination.address}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={[styles.metaText, { color: colors.text }]}>
          {formatMoney(ride.estimatedFare, ride.currency ?? 'USD')}
        </Text>
        <Text style={[styles.metaSub, { color: colors.textSecondary }]}>
          {ride.category} · {ride.distanceKm.toFixed(1)} km · {ride.paymentMethod}
        </Text>
      </View>

      {isPending ? (
        <View style={[styles.pendingCta, { backgroundColor: 'rgba(251, 192, 45, 0.14)' }]}>
          <FontAwesome name="lock" size={11} color={colors.primaryDark} />
          <Text style={[styles.pendingCtaText, { color: colors.primaryDark }]}>
            Tap to view & enter PIN to accept
          </Text>
          <FontAwesome name="chevron-right" size={10} color={colors.primaryDark} />
        </View>
      ) : (
        <View style={styles.openHint}>
          <Text style={[styles.openHintText, { color: colors.textSecondary }]}>
            Tap to view details
          </Text>
          <FontAwesome name="chevron-right" size={10} color={colors.textSecondary} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12.5, fontWeight: '700' },
  chipCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    minWidth: 18,
    alignItems: 'center',
  },
  chipCountText: { fontSize: 10, fontWeight: '800' },

  list: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: Spacing.xl },
  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countPillText: { fontSize: 11, fontWeight: '800' },

  tripCard: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: 8,
  },
  cardHeader: {
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
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  cardDate: { fontSize: 11 },

  routeBlock: { gap: 4, marginTop: 2 },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeText: { flex: 1, fontSize: 13.5, fontWeight: '600' },

  cardFooter: { marginTop: 4 },
  metaText: { fontSize: 15, fontWeight: '800' },
  metaSub: { fontSize: 12, marginTop: 2 },

  pendingCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 6,
  },
  pendingCtaText: { flex: 1, fontSize: 12, fontWeight: '700' },

  openHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  openHintText: { fontSize: 11.5 },

  emptyWrap: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', paddingHorizontal: Spacing.lg },
});
