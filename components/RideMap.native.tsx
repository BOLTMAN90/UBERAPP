import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { OpenStreetMapView } from '@/components/OpenStreetMapView';
import type { MapRegion, RideMapProps } from '@/components/rideMapTypes';
import { hasGoogleMapsApiKey, useGoogleMapsNative } from '@/constants/config';
import { DEFAULT_MAP_CENTER } from '@/constants/location';
import { Colors } from '@/constants/theme';
import type { GeoPoint } from '@/types';
import { isExpoGo } from '@/utils/expoRuntime';

export type { MapRegion, RideMapProps } from '@/components/rideMapTypes';

const MAP_READY_TIMEOUT_MS = 6000;

const defaultRegion: MapRegion = {
  latitude: DEFAULT_MAP_CENTER.latitude,
  longitude: DEFAULT_MAP_CENTER.longitude,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function NativeMap({
  userLocation,
  driverLocation,
  pickup,
  destination,
  onRegionChange,
  onMapReady,
}: RideMapProps & { onMapReady: () => void }) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const points = [userLocation, driverLocation, pickup, destination].filter(
      (point): point is GeoPoint => Boolean(point),
    );
    if (!points.length || !mapRef.current) return;

    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 80, right: 80, bottom: 220, left: 80 },
      animated: true,
    });
  }, [userLocation, driverLocation, pickup, destination]);

  const routeCoordinates = [pickup, destination].filter((point): point is GeoPoint => Boolean(point));

  return (
    <MapView
      ref={mapRef}
      style={styles.mapFill}
      provider={PROVIDER_GOOGLE}
      mapType="standard"
      initialRegion={
        userLocation
          ? { ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }
          : defaultRegion
      }
      showsUserLocation
      showsMyLocationButton={false}
      onMapReady={onMapReady}
      onRegionChangeComplete={onRegionChange}>
      {pickup ? <Marker coordinate={pickup} title="Pickup" pinColor={Colors.primary} /> : null}
      {destination ? <Marker coordinate={destination} title="Destination" pinColor={Colors.black} /> : null}
      {driverLocation ? <Marker coordinate={driverLocation} title="Driver" pinColor={Colors.success} /> : null}
      {routeCoordinates.length === 2 ? (
        <Polyline coordinates={routeCoordinates} strokeColor={Colors.primary} strokeWidth={4} />
      ) : null}
    </MapView>
  );
}

/** Tries Google Maps; falls back to OpenStreetMap if tiles never load (common when SHA-1 is missing). */
function NativeMapWithFallback(props: RideMapProps) {
  const [googleReady, setGoogleReady] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (googleReady) return;
    const timer = setTimeout(() => setUseFallback(true), MAP_READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [googleReady]);

  if (useFallback) {
    return <OpenStreetMapView {...props} />;
  }

  return (
    <NativeMap
      {...props}
      onMapReady={() => setGoogleReady(true)}
    />
  );
}

export function RideMap(props: RideMapProps) {
  const wantsGoogleNative =
    hasGoogleMapsApiKey && !isExpoGo && useGoogleMapsNative;

  return (
    <View style={styles.mapShell}>
      {wantsGoogleNative ? (
        <NativeMapWithFallback {...props} />
      ) : (
        <OpenStreetMapView {...props} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapShell: {
    flex: 1,
    minHeight: 300,
    backgroundColor: '#e8ecf0',
  },
  mapFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e8ecf0',
  },
});
