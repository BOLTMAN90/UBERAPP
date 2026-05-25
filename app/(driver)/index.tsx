import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { InputField } from '@/components/InputField';
import { RideMap } from '@/components/RideMap';
import { hasGoogleMapsApiKey } from '@/constants/config';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import {
  ensureDriverProfile,
  getDriverProfile,
  incrementDriverEarnings,
  logFuelCost,
  setDriverAutoAccept,
  setDriverOnlineStatus,
  subscribeToRideRequests,
  updateDriverLocation,
} from '@/services/drivers';
import { subscribeToDriverAssignedRides, updateRideStatus } from '@/services/rides';
import type { DriverProfile, Ride } from '@/types';
import { formatMoney } from '@/utils/currency';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { voidFirestore } from '@/utils/voidFirestore';

export default function DriverHomeScreen() {
  const { user, profile: authProfile } = useAuth();
  const { colors } = useTheme();
  const { location, error: locationError, usingFallback, retry: retryLocation } = useCurrentLocation();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [fuelAmount, setFuelAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoadError(null);
    try {
      const name = authProfile?.displayName ?? user.displayName ?? 'Driver';
      const p = await ensureDriverProfile(user.uid, name);
      setProfile(p);
    } catch (e) {
      setLoadError(getFirebaseErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user, authProfile?.displayName, user?.displayName]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!user || !location || !profile?.isOnline) return;
    voidFirestore(updateDriverLocation(user.uid, location), 'driver:location');
  }, [user, location, profile?.isOnline]);

  useEffect(() => {
    if (!profile?.isOnline || !user) {
      setPendingCount(0);
      return;
    }
    return subscribeToRideRequests(user.uid, (rides) => {
      setPendingCount(rides.length);
    });
  }, [profile?.isOnline, user?.uid]);

  useEffect(() => {
    if (!user) return;
    return subscribeToDriverAssignedRides(user.uid, (rides) => {
      const live = rides.find((r) => ['accepted', 'arriving', 'ongoing'].includes(r.status));
      setActiveRide(live ?? null);
    });
  }, [user]);

  const toggleOnline = async () => {
    if (!user || !profile) return;
    const next = !profile.isOnline;
    try {
      await setDriverOnlineStatus(user.uid, next, location ?? undefined);
      setProfile({ ...profile, isOnline: next });
    } catch (e) {
      setLoadError(getFirebaseErrorMessage(e));
    }
  };

  const advanceRide = async (status: Ride['status']) => {
    if (!activeRide || !user) return;
    await updateRideStatus(activeRide.id, status);
    if (status === 'completed') {
      await incrementDriverEarnings(user.uid, activeRide.estimatedFare);
      const refreshed = await getDriverProfile(user.uid);
      if (refreshed) setProfile(refreshed);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.secondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
          Loading driver console…
        </Text>
      </View>
    );
  }

  if (loadError && !profile) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.secondary, padding: Spacing.lg }]}>
        <Text style={{ color: colors.error, textAlign: 'center', marginBottom: Spacing.md }}>
          {loadError}
        </Text>
        <Button
          label="Retry"
          onPress={() => {
            setLoading(true);
            void loadProfile();
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {!hasGoogleMapsApiKey ? (
        <View style={[styles.mapBanner, { backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env for Google Maps
          </Text>
        </View>
      ) : null}
      <View style={styles.mapArea}>
        <RideMap
          userLocation={location}
          pickup={activeRide?.pickup.coordinates}
          destination={activeRide?.destination.coordinates}
        />
      </View>
      <ScrollView
        style={[styles.sheet, { backgroundColor: colors.surface }]}
        contentContainerStyle={{ gap: Spacing.sm, paddingBottom: Spacing.md }}>
        <Text style={[styles.title, { color: colors.text }]}>
          Driver · ⭐ {(profile?.rating ?? 5).toFixed(1)}
        </Text>
        <Text style={{ color: colors.textSecondary }}>
          Trips {profile?.totalTrips ?? 0} · {formatMoney(profile?.totalEarnings ?? 0, 'USD')}
          {profile?.subscriptionActive ? ' · Sub active' : ''}
        </Text>
        {locationError ? (
          <Text style={{ color: colors.error, fontSize: 13 }}>
            {locationError}
            {usingFallback ? ' Map shows default area until GPS works.' : ''}
          </Text>
        ) : null}
        {locationError ? (
          <Button label="Retry location" variant="outline" onPress={() => void retryLocation()} />
        ) : null}
        <Button
          label={profile?.isOnline ? 'Go offline' : 'Go online'}
          onPress={toggleOnline}
          variant={profile?.isOnline ? 'secondary' : 'primary'}
        />
        <View style={styles.row}>
          <Text style={{ color: colors.text }}>Auto-accept rides</Text>
          <Switch
            value={profile?.autoAcceptRides ?? false}
            onValueChange={(v) => {
              if (user) {
                void setDriverAutoAccept(user.uid, v).then(() =>
                  setProfile((p) => (p ? { ...p, autoAcceptRides: v } : p)),
                );
              }
            }}
            trackColor={{ true: colors.primary }}
          />
        </View>

        {profile?.isOnline && pendingCount > 0 && !activeRide ? (
          <Pressable
            onPress={() => router.push('/(driver)/trips' as Href)}
            style={[styles.pendingBanner, { borderColor: colors.primary }]}>
            <View style={[styles.pendingIcon, { backgroundColor: colors.primary }]}>
              <FontAwesome name="bell" size={14} color={Colors.black} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pendingTitle, { color: colors.text }]}>
                {pendingCount === 1
                  ? '1 pending booking awaits you'
                  : `${pendingCount} pending bookings await you`}
              </Text>
              <Text style={[styles.pendingSub, { color: colors.textSecondary }]}>
                Open Trips → tap a booking → enter rider PIN to accept.
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={colors.primary} />
          </Pressable>
        ) : null}

        {activeRide ? (
          <View style={[styles.activeCard, { borderColor: colors.primary, backgroundColor: colors.surface }]}>
            <Text style={[styles.activeStatus, { color: colors.primaryDark }]}>
              {activeRide.status.toUpperCase()}
            </Text>
            <Text style={[styles.activeRoute, { color: colors.text }]} numberOfLines={2}>
              {activeRide.pickup.address} → {activeRide.destination.address}
            </Text>
            <View style={styles.activeButtons}>
              {activeRide.status === 'accepted' ? (
                <Button label="Arriving at pickup" onPress={() => void advanceRide('arriving')} />
              ) : null}
              {activeRide.status === 'arriving' ? (
                <Button label="Start trip" onPress={() => void advanceRide('ongoing')} />
              ) : null}
              {activeRide.status === 'ongoing' ? (
                <Button label="Complete trip" onPress={() => void advanceRide('completed')} />
              ) : null}
              <Button
                label="View details"
                variant="outline"
                onPress={() => router.push(`/(driver)/trip/${activeRide.id}` as Href)}
              />
            </View>
          </View>
        ) : profile?.isOnline && pendingCount === 0 ? (
          <View style={[styles.waitingBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <FontAwesome name="signal" size={16} color={colors.primary} />
            <Text style={[styles.waitingText, { color: colors.textSecondary }]}>
              You&apos;re online. Waiting for bookings — pending trips will appear on the Trips tab.
            </Text>
          </View>
        ) : !profile?.isOnline ? (
          <Text style={{ color: colors.textSecondary }}>Go online to receive ride bookings.</Text>
        ) : null}

        <InputField
          label="Log fuel cost"
          keyboardType="decimal-pad"
          value={fuelAmount}
          onChangeText={setFuelAmount}
        />
        <Button
          label="Add fuel expense"
          variant="outline"
          onPress={() => {
            if (user && fuelAmount) {
              void logFuelCost(user.uid, Number(fuelAmount)).then(() => setFuelAmount(''));
            }
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  mapArea: { flex: 1, minHeight: 300 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapBanner: { padding: Spacing.xs, alignItems: 'center' },
  sheet: {
    maxHeight: '60%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.lg,
  },
  title: { fontSize: 20, fontWeight: '800' },
  row: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', justifyContent: 'space-between' },

  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 2,
    backgroundColor: 'rgba(251, 192, 45, 0.10)',
  },
  pendingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  pendingSub: { fontSize: 11.5, marginTop: 2 },

  activeCard: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 2,
    gap: 6,
  },
  activeStatus: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  activeRoute: { fontSize: 13.5, fontWeight: '700' },
  activeButtons: { gap: Spacing.sm, marginTop: 6 },

  waitingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  waitingText: { flex: 1, fontSize: 12.5, fontWeight: '600' },
});
