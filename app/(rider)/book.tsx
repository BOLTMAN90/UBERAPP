import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { PremiumVehicleSelector } from '@/components/PremiumVehicleSelector';
import { VehicleProductsModal } from '@/components/VehicleProductsModal';
import { InputField } from '@/components/InputField';
import { PaymentPicker } from '@/components/PaymentPicker';
import { Radius, Spacing } from '@/constants/theme';
import { getCategoryMeta } from '@/constants/rideOptions';
import { getVehicleProducts, type VehicleProduct } from '@/constants/vehicleProducts';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { createRideRequest } from '@/services/rides';
import type { GeoPoint, PaymentMethod, RideCategory, RideLocation } from '@/types';
import { estimateFare, getRouteDistanceKm } from '@/utils/geo';

export default function BookRideScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { location } = useCurrentLocation();
  const [category, setCategory] = useState<RideCategory>('economy');
  const [selectedProduct, setSelectedProduct] = useState<VehicleProduct | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [destination, setDestination] = useState('');
  const [stopLabel, setStopLabel] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [offeredFare, setOfferedFare] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleBook = async () => {
    if (!user || !location) {
      setError('Location required.');
      return;
    }
    const dest: GeoPoint = {
      latitude: location.latitude + 0.02,
      longitude: location.longitude + 0.02,
    };
    const stops: RideLocation[] = stopLabel
      ? [{ address: stopLabel, coordinates: { latitude: location.latitude + 0.01, longitude: location.longitude + 0.01 } }]
      : [];
    const points = [location, ...stops.map((s) => s.coordinates), dest];
    const distanceKm = getRouteDistanceKm(points);
    const baseFare = estimateFare(distanceKm, category);
    const productAdjustedFare =
      Math.round(baseFare * (selectedProduct?.fareModifier ?? 1) * 100) / 100;
    const fare = negotiable && offeredFare ? Number(offeredFare) : productAdjustedFare;

    setLoading(true);
    try {
      await createRideRequest(
        user.uid,
        { address: 'Pickup', coordinates: location },
        { address: destination || 'Destination', coordinates: dest },
        fare,
        distanceKm,
        {
          category,
          paymentMethod,
          stops,
          isNegotiable: negotiable,
          offeredFare: negotiable ? Number(offeredFare) || fare : undefined,
          scheduledAt: scheduledDate ? new Date(scheduledDate).getTime() : undefined,
        },
      );
      router.replace('/(rider)' as Href);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booking failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.secondary }} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Advanced booking</Text>
      <Text style={{ color: colors.textSecondary }}>Scheduled · multi-stop · negotiable fare (inDrive style)</Text>

      <InputField label="Destination" value={destination} onChangeText={setDestination} />
      <PremiumVehicleSelector
        value={category}
        onChange={setCategory}
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
          <Button label="Change" variant="outline" onPress={() => setProductModalOpen(true)} />
        </View>
      ) : null}
      <InputField label="Extra stop (optional)" value={stopLabel} onChangeText={setStopLabel} />
      <InputField
        label="Schedule (YYYY-MM-DD HH:mm)"
        placeholder="2026-05-20 14:30"
        value={scheduledDate}
        onChangeText={setScheduledDate}
      />

      <View style={styles.row}>
        <Text style={{ color: colors.text, fontWeight: '600' }}>Negotiable fare</Text>
        <Switch value={negotiable} onValueChange={setNegotiable} trackColor={{ true: colors.primary }} />
      </View>
      {negotiable ? (
        <InputField
          label="Your offered fare (₦)"
          keyboardType="numeric"
          value={offeredFare}
          onChangeText={setOfferedFare}
        />
      ) : null}

      <Text style={[styles.section, { color: colors.text }]}>Payment</Text>
      <PaymentPicker value={paymentMethod} onChange={setPaymentMethod} />
      {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
      <Button label="Book ride" onPress={handleBook} loading={loading} />

      <VehicleProductsModal
        visible={productModalOpen}
        category={category}
        selectedProductId={selectedProduct?.id ?? null}
        onClose={() => setProductModalOpen(false)}
        onSelect={(p) => setSelectedProduct(p)}
        onConfirm={(p) => {
          setSelectedProduct(p);
          setProductModalOpen(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.md },
  title: { fontSize: 24, fontWeight: '800' },
  section: { fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
});
