import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import type { GeoPoint } from '@/types';

interface MapFallbackProps {
  userLocation?: GeoPoint | null;
  pickup?: GeoPoint | null;
  destination?: GeoPoint | null;
  onShiftDestination?: (offset: GeoPoint) => void;
}

export function MapFallback({
  userLocation,
  pickup,
  destination,
  onShiftDestination,
}: MapFallbackProps) {
  const anchor = userLocation ?? pickup ?? { latitude: 37.78825, longitude: -122.4324 };

  const shift = (latitudeDelta: number, longitudeDelta: number) => {
    onShiftDestination?.({
      latitude: (destination?.latitude ?? anchor.latitude) + latitudeDelta,
      longitude: (destination?.longitude ?? anchor.longitude) + longitudeDelta,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google Maps not configured</Text>
      <Text style={styles.copy}>
        Add your Google Maps API key to .env as EXPO_PUBLIC_GOOGLE_MAPS_API_KEY, then restart
        npm run dev. Until then, use the controls below to move the destination pin.
      </Text>
      <View style={styles.card}>
        <Text style={styles.label}>Pickup</Text>
        <Text style={styles.value}>
          {pickup
            ? `${pickup.latitude.toFixed(4)}, ${pickup.longitude.toFixed(4)}`
            : 'Waiting for location'}
        </Text>
        <Text style={styles.label}>Destination</Text>
        <Text style={styles.value}>
          {destination
            ? `${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)}`
            : 'Not pinned yet'}
        </Text>
      </View>
      <View style={styles.controls}>
        <Pressable style={styles.button} onPress={() => shift(0.01, 0)}>
          <Text style={styles.buttonText}>North</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => shift(-0.01, 0)}>
          <Text style={styles.buttonText}>South</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => shift(0, 0.01)}>
          <Text style={styles.buttonText}>East</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => shift(0, -0.01)}>
          <Text style={styles.buttonText}>West</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary,
    padding: Spacing.lg,
    justifyContent: 'center',
    gap: Spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  copy: {
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  buttonText: {
    fontWeight: '700',
    color: Colors.black,
  },
});
