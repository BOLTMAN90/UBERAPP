import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AcceptRideWithPin } from '@/components/AcceptRideWithPin';
import { Button } from '@/components/Button';
import { RideMap } from '@/components/RideMap';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  acceptRideWithPin,
  declineRide,
  subscribeToRide,
  updateRideStatus,
} from '@/services/rides';
import { incrementDriverEarnings } from '@/services/drivers';
import type { Ride, RideStatus } from '@/types';
import { formatMoney } from '@/utils/currency';

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
  searching: 'Searching for driver',
  requested: 'Pending — awaiting your acceptance',
  negotiating: 'Negotiating fare',
  accepted: 'Accepted — head to pickup',
  arriving: 'Arriving at pickup',
  ongoing: 'Trip in progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function DriverTripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToRide(id, (next) => {
      setRide(next);
      setLoading(false);
    });
    return unsub;
  }, [id]);

  const relation = useMemo<'pending' | 'mine' | 'declined' | 'other'>(() => {
    if (!ride || !user) return 'other';
    if (ride.driverId === user.uid) {
      return ride.status === 'requested' ? 'pending' : 'mine';
    }
    if (ride.declinedBy?.includes(user.uid)) return 'declined';
    return 'other';
  }, [ride, user]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.secondary }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.secondary }]}>
        <Text style={{ color: colors.textSecondary }}>Trip not found.</Text>
      </View>
    );
  }

  const handleAccept = async (pin: string): Promise<boolean> => {
    if (!user) return false;
    setActionError(null);
    const ok = await acceptRideWithPin(ride.id, user.uid, pin);
    if (!ok) return false;
    return true;
  };

  const handleDecline = async () => {
    if (!user) return;
    try {
      await declineRide(ride.id, user.uid);
      router.back();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not decline ride.');
    }
  };

  const advance = async (nextStatus: RideStatus) => {
    if (!user) return;
    setActionError(null);
    try {
      await updateRideStatus(ride.id, nextStatus);
      if (nextStatus === 'completed') {
        await incrementDriverEarnings(user.uid, ride.estimatedFare);
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not update trip.');
    }
  };

  const statusColor = STATUS_COLORS[ride.status];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.secondary }}
      contentContainerStyle={styles.content}>
      <View style={styles.mapWrap}>
        <RideMap pickup={ride.pickup.coordinates} destination={ride.destination.coordinates} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.statusPill, { backgroundColor: `${statusColor}1A` }]}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {relation === 'declined' ? 'DECLINED BY YOU' : STATUS_LABELS[ride.status].toUpperCase()}
          </Text>
        </View>

        <View style={styles.routeBlock}>
          <View style={styles.routeRow}>
            <FontAwesome name="circle" size={10} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.routeLabel, { color: colors.textSecondary }]}>PICKUP</Text>
              <Text style={[styles.routeAddress, { color: colors.text }]}>
                {ride.pickup.address}
              </Text>
            </View>
          </View>
          <View style={styles.routeRow}>
            <FontAwesome name="map-marker" size={14} color={colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.routeLabel, { color: colors.textSecondary }]}>DROP-OFF</Text>
              <Text style={[styles.routeAddress, { color: colors.text }]}>
                {ride.destination.address}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <MetaBox
            icon="money"
            label="Fare"
            value={formatMoney(ride.estimatedFare, ride.currency ?? 'USD')}
          />
          <MetaBox icon="road" label="Distance" value={`${ride.distanceKm.toFixed(1)} km`} />
          <MetaBox icon="car" label="Category" value={ride.category} />
          <MetaBox icon="credit-card" label="Payment" value={ride.paymentMethod} />
          {ride.driverEtaMinutes ? (
            <MetaBox icon="clock-o" label="ETA" value={`${ride.driverEtaMinutes} min`} />
          ) : null}
          <MetaBox
            icon="calendar"
            label="Booked"
            value={new Date(ride.createdAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        </View>

        {ride.stops?.length ? (
          <View style={styles.stopsBlock}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>STOPS</Text>
            {ride.stops.map((s, i) => (
              <Text key={i} style={{ color: colors.text }} numberOfLines={1}>
                • {s.address}
              </Text>
            ))}
          </View>
        ) : null}

        {ride.isNegotiable ? (
          <View
            style={[
              styles.noteBox,
              { backgroundColor: 'rgba(251, 192, 45, 0.12)', borderColor: colors.primary },
            ]}>
            <FontAwesome name="info-circle" size={12} color={colors.primaryDark} />
            <Text style={[styles.noteText, { color: colors.primaryDark }]}>
              Rider offered {formatMoney(ride.offeredFare ?? ride.estimatedFare, ride.currency ?? 'USD')} (negotiable).
            </Text>
          </View>
        ) : null}

        {actionError ? (
          <View style={[styles.errorBox, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
            <FontAwesome name="exclamation-circle" size={12} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{actionError}</Text>
          </View>
        ) : null}
      </View>

      {relation === 'pending' ? (
        <View style={styles.actionSection}>
          <AcceptRideWithPin
            expectedPin={ride.pinCode ?? null}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        </View>
      ) : relation === 'mine' && ['accepted', 'arriving', 'ongoing'].includes(ride.status) ? (
        <View style={styles.actionSection}>
          {ride.status === 'accepted' ? (
            <Button label="Arriving at pickup" onPress={() => void advance('arriving')} />
          ) : null}
          {ride.status === 'arriving' ? (
            <Button label="Start trip" onPress={() => void advance('ongoing')} />
          ) : null}
          {ride.status === 'ongoing' ? (
            <Button label="Complete trip" onPress={() => void advance('completed')} />
          ) : null}
          <Button
            label="Back to trips"
            variant="outline"
            onPress={() => router.push('/(driver)/trips' as Href)}
          />
        </View>
      ) : (
        <View style={styles.actionSection}>
          <Button
            label="Back to trips"
            variant="outline"
            onPress={() => router.push('/(driver)/trips' as Href)}
          />
        </View>
      )}
    </ScrollView>
  );
}

function MetaBox({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        metaStyles.box,
        { backgroundColor: colors.secondary, borderColor: colors.border },
      ]}>
      <View style={[metaStyles.iconWrap, { backgroundColor: 'rgba(251, 192, 45, 0.18)' }]}>
        <FontAwesome name={icon as 'car'} size={12} color={colors.primaryDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[metaStyles.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text
          style={[metaStyles.value, { color: colors.text }]}
          numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: Spacing.xl, gap: Spacing.md },
  mapWrap: { height: 220 },
  card: {
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },

  routeBlock: { gap: 10, marginTop: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  routeLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  routeAddress: { fontSize: 14, fontWeight: '700', marginTop: 2 },

  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },

  stopsBlock: { gap: 4 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },

  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  noteText: { flex: 1, fontSize: 12, fontWeight: '700' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  errorText: { fontSize: 12, fontWeight: '600' },

  actionSection: {
    marginHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
});

const metaStyles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '47%',
    flexBasis: '47%',
    flexGrow: 1,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 9.5, fontWeight: '800', letterSpacing: 1 },
  value: { fontSize: 13, fontWeight: '700', marginTop: 2 },
});
