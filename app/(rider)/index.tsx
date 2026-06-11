import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { PremiumVehicleSelector } from '@/components/PremiumVehicleSelector';
import { VehicleProductsModal } from '@/components/VehicleProductsModal';
import { WelcomeBanner } from '@/components/WelcomeBanner';
import { InputField } from '@/components/InputField';
import { PaymentPicker } from '@/components/PaymentPicker';
import { RideMap } from '@/components/RideMap';
import type { MapRegion } from '@/components/rideMapTypes';
import { RideStatusCard } from '@/components/RideStatusCard';
import { SearchingAnimation } from '@/components/SearchingAnimation';
import { SOSButton } from '@/components/SOSButton';
import { PinVerification } from '@/components/PinVerification';
import { hasGoogleMapsApiKey } from '@/constants/config';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { getFavoriteLocations } from '@/services/favorites';
import { subscribeToDriverLocation } from '@/services/drivers';
import { notifyRideStatusChange } from '@/services/notifications';
import { createRideRequest, subscribeToRide, updateRideStatus } from '@/services/rides';
import type { CurrencyCode, GeoPoint, PaymentMethod, Ride, RideCategory } from '@/types';
import { formatMoney } from '@/utils/currency';
import { estimateFare, getDistanceKm } from '@/utils/geo';
import { getLocationLabel } from '@/utils/locationLabel';
import { estimateEtaMinutes } from '@/utils/ride';
import { getVehicleProducts, type VehicleProduct } from '@/constants/vehicleProducts';
import { getCategoryMeta } from '@/constants/rideOptions';

export default function RiderHomeScreen() {
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { location, loading: locationLoading, error: locationError, usingFallback, retry: retryLocation } =
    useCurrentLocation();
  const [pickupLabel, setPickupLabel] = useState('Current location');
  const [destinationLabel, setDestinationLabel] = useState('');
  const [destinationPoint, setDestinationPoint] = useState<GeoPoint | null>(null);
  const [category, setCategory] = useState<RideCategory>('economy');
  const [selectedProduct, setSelectedProduct] = useState<VehicleProduct | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [driverLocation, setDriverLocation] = useState<GeoPoint | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const products = getVehicleProducts(category);
    if (!products.length) {
      setSelectedProduct(null);
      return;
    }
    if (!selectedProduct || !products.find((p) => p.id === selectedProduct.id)) {
      setSelectedProduct(products[0]);
    }
  }, [category, selectedProduct]);
  const currency = (profile?.preferredCurrency ?? 'USD') as CurrencyCode;

  const pickupPoint = useMemo<GeoPoint | null>(
    () => (location && !usingFallback ? location : null),
    [location, usingFallback],
  );

  useEffect(() => {
    if (!location || usingFallback) return;
    let cancelled = false;
    void getLocationLabel(location).then((label) => {
      if (!cancelled) setPickupLabel(label);
    });
    return () => {
      cancelled = true;
    };
  }, [location, usingFallback]);

  useEffect(() => {
    if (location && !usingFallback && !destinationPoint) {
      setDestinationPoint({
        latitude: location.latitude + 0.01,
        longitude: location.longitude + 0.01,
      });
      setDestinationLabel('Pinned destination');
    }
  }, [location, usingFallback, destinationPoint]);

  const fareEstimate = useMemo(() => {
    if (!pickupPoint || !destinationPoint) return null;
    const distanceKm = getDistanceKm(pickupPoint, destinationPoint);
    const baseFare = estimateFare(distanceKm, category);
    const modifier = selectedProduct?.fareModifier ?? 1;
    const productEtaBias = selectedProduct?.etaBiasMinutes ?? 0;
    return {
      distanceKm,
      fare: Math.round(baseFare * modifier * 100) / 100,
      eta: estimateEtaMinutes(distanceKm) + productEtaBias,
    };
  }, [pickupPoint, destinationPoint, category, selectedProduct]);

  useEffect(() => {
    if (!activeRide?.id) return;
    let previousStatus: Ride['status'] | null = null;
    return subscribeToRide(activeRide.id, (ride) => {
      if (!ride) return;
      if (previousStatus && previousStatus !== ride.status) void notifyRideStatusChange(ride.status);
      previousStatus = ride.status;
      setActiveRide(ride);
    });
  }, [activeRide?.id]);

  useEffect(() => {
    if (!activeRide?.driverId) {
      setDriverLocation(null);
      return;
    }
    return subscribeToDriverLocation(activeRide.driverId, setDriverLocation);
  }, [activeRide?.driverId]);

  const handleRequestRide = async () => {
    if (usingFallback || !location) {
      setError('Live GPS is required before booking. Tap Retry location.');
      return;
    }
    if (!user || !pickupPoint || !destinationPoint || !fareEstimate) {
      setError('Set pickup and destination before requesting.');
      return;
    }
    setError(null);
    setRequesting(true);
    try {
      const rideId = await createRideRequest(
        user.uid,
        { address: pickupLabel, coordinates: pickupPoint },
        { address: destinationLabel || 'Destination', coordinates: destinationPoint },
        fareEstimate.fare,
        fareEstimate.distanceKm,
        { category, paymentMethod, currency },
      );
      setActiveRide({
        id: rideId,
        userId: user.uid,
        pickup: { address: pickupLabel, coordinates: pickupPoint },
        destination: { address: destinationLabel || 'Destination', coordinates: destinationPoint },
        status: 'searching',
        category,
        paymentMethod,
        currency,
        estimatedFare: fareEstimate.fare,
        distanceKm: fareEstimate.distanceKm,
        driverEtaMinutes: fareEstimate.eta,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      router.push('/(rider)/history' as Href);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Request failed.';
      setError(message);
      if (message.toLowerCase().includes('insufficient wallet')) {
        Alert.alert('Insufficient funds', message, [
          { text: 'Top up wallet', onPress: () => router.push('/(rider)/wallet' as Href) },
          { text: 'OK', style: 'cancel' },
        ]);
      }
    } finally {
      setRequesting(false);
    }
  };

  const loadFavorite = async (id: string) => {
    if (!user) return;
    try {
      const favorites = await getFavoriteLocations(user.uid);
      const fav = favorites.find((f) => f.id === id);
      if (fav) {
        setDestinationPoint(fav.coordinates);
        setDestinationLabel(fav.label);
        return;
      }
      Alert.alert(
        `Set up ${id === 'home' ? 'Home' : 'Work'}`,
        `You haven't saved a ${id === 'home' ? 'Home' : 'Work'} address yet. Add it now to book rides faster next time.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add now',
            onPress: () => router.push('/(rider)/favorites' as Href),
          },
        ],
      );
    } catch (loadError) {
      Alert.alert(
        'Could not load favorites',
        loadError instanceof Error ? loadError.message : 'Please try again.',
      );
    }
  };

  const isSearching = activeRide && ['searching', 'requested', 'negotiating'].includes(activeRide.status);
  const mapCenter = pickupPoint;

  const welcomeName = profile?.displayName ?? user?.displayName ?? null;
  const welcomePhoto = profile?.photoURL ?? user?.photoURL ?? null;

  return (
    <View style={styles.screen}>
      {!hasGoogleMapsApiKey ? (
        <View style={{ padding: Spacing.xs, backgroundColor: colors.surface, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>
            Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env for Google Maps
          </Text>
        </View>
      ) : null}
      {!activeRide ? (
        <WelcomeBanner
          name={welcomeName}
          photoURL={welcomePhoto}
          topInset={insets.top + Spacing.sm}
        />
      ) : null}
      <View style={styles.mapArea}>
        {locationLoading ? (
          <View style={[styles.mapLoading, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>Getting your location…</Text>
          </View>
        ) : usingFallback || !mapCenter ? (
          <View style={[styles.mapLoading, { backgroundColor: colors.surface, padding: Spacing.lg }]}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16, textAlign: 'center' }}>
              Live location needed
            </Text>
            <Text style={{ color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }}>
              {locationError ?? 'Enable GPS and allow location permission for BoltRide.'}
            </Text>
            <View style={{ marginTop: Spacing.md, width: '100%' }}>
              <Button label="Retry location" onPress={() => void retryLocation()} />
            </View>
          </View>
        ) : (
          <RideMap
            userLocation={mapCenter}
            driverLocation={driverLocation}
            pickup={pickupPoint}
            destination={destinationPoint}
            onDestinationChange={(point) => {
              if (!activeRide) {
                setDestinationPoint(point);
                setDestinationLabel('Pinned destination');
              }
            }}
            onRegionChange={(region: MapRegion) => {
              if (!activeRide) {
                setDestinationPoint({ latitude: region.latitude, longitude: region.longitude });
                setDestinationLabel('Pinned destination');
              }
            }}
          />
        )}
      </View>

      <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
        {activeRide ? (
          <>
            {isSearching ? <SearchingAnimation /> : null}
            <RideStatusCard
              status={activeRide.status}
              pickup={activeRide.pickup.address}
              destination={activeRide.destination.address}
              fare={activeRide.estimatedFare}
              etaMinutes={activeRide.driverEtaMinutes}
              category={activeRide.category}
            />
            {activeRide.pinCode &&
            ['searching', 'requested', 'negotiating', 'accepted'].includes(activeRide.status) ? (
              <PinVerification
                rideId={activeRide.id}
                pinCode={activeRide.pinCode}
                mode="rider"
                onVerified={() => {}}
              />
            ) : null}
            <SOSButton rideId={activeRide.id} emergencyContacts={profile?.emergencyContacts} />
            {activeRide.status === 'completed' ? (
              <Button
                label="Rate trip"
                onPress={() => router.push(`/(rider)/rate?rideId=${activeRide.id}` as never)}
              />
            ) : activeRide.status !== 'cancelled' ? (
              <Button label="Cancel ride" variant="outline" onPress={() => void updateRideStatus(activeRide.id, 'cancelled').then(() => setActiveRide(null))} />
            ) : (
              <Button label="Book again" onPress={() => setActiveRide(null)} />
            )}
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Where to?</Text>
            <View style={styles.quickRow}>
              <Button label="Home" variant="secondary" onPress={() => void loadFavorite('home')} />
              <Button label="Work" variant="secondary" onPress={() => void loadFavorite('work')} />
              <Button label="Advanced" variant="outline" onPress={() => router.push('/(rider)/book')} />
            </View>
            <PremiumVehicleSelector
              value={category}
              onChange={setCategory}
              distanceKm={fareEstimate?.distanceKm}
              currency={currency}
              onOpenCategory={(cat) => {
                setCategory(cat);
                setProductModalOpen(true);
              }}
            />
            {selectedProduct ? (
              <View style={[styles.selectedRow, { backgroundColor: colors.white, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.selectedLabel, { color: colors.textSecondary }]}>
                    {getCategoryMeta(category).label} · selected ride
                  </Text>
                  <Text style={[styles.selectedName, { color: colors.text }]} numberOfLines={1}>
                    {selectedProduct.name}
                  </Text>
                </View>
                <Button
                  label="Change"
                  variant="outline"
                  onPress={() => setProductModalOpen(true)}
                />
              </View>
            ) : null}
            <InputField label="Pickup" value={pickupLabel} onChangeText={setPickupLabel} />
            <InputField label="Destination" value={destinationLabel} onChangeText={setDestinationLabel} />
            <Text style={[styles.section, { color: colors.text }]}>Payment</Text>
            <PaymentPicker value={paymentMethod} onChange={setPaymentMethod} />
            {fareEstimate ? (
              <Text style={[styles.fare, { color: colors.text }]}>
                {fareEstimate.distanceKm.toFixed(1)} km · {formatMoney(fareEstimate.fare, currency)} · ~{fareEstimate.eta} min
              </Text>
            ) : (
              <Text style={{ color: colors.textSecondary }}>Pan map to set destination.</Text>
            )}
            {locationError ? (
              <Text style={{ color: colors.error, fontSize: 13 }}>{locationError}</Text>
            ) : null}
            {locationError ? (
              <Button label="Retry location" variant="outline" onPress={() => void retryLocation()} />
            ) : null}
            {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
            <Button label="Request ride" onPress={handleRequestRide} loading={requesting} />
          </>
        )}
      </View>

      <VehicleProductsModal
        visible={productModalOpen}
        category={category}
        selectedProductId={selectedProduct?.id ?? null}
        onClose={() => setProductModalOpen(false)}
        onSelect={(product) => setSelectedProduct(product)}
        onConfirm={(product) => {
          setSelectedProduct(product);
          setProductModalOpen(false);
        }}
        distanceKm={fareEstimate?.distanceKm}
        currency={currency}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  selectedLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  selectedName: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '800',
  },
  mapArea: { flex: 1, minHeight: 300 },
  mapLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sheet: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.md,
    maxHeight: '70%',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    elevation: 8,
  },
  title: { fontSize: 22, fontWeight: '800' },
  section: { fontWeight: '700', fontSize: 14 },
  fare: { fontSize: 16, fontWeight: '700' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
