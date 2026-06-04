import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { OpenStreetMapView } from '@/components/OpenStreetMapView';
import type { MapRegion, RideMapProps } from '@/components/rideMapTypes';
import { hasGoogleMapsApiKey, useGoogleMapsNative } from '@/constants/config';
import { Colors } from '@/constants/theme';
import type { GeoPoint } from '@/types';
import { isExpoGo } from '@/utils/expoRuntime';

export type { MapRegion, RideMapProps } from '@/components/rideMapTypes';

const defaultRegion: MapRegion = {
  latitude: 6.5244,
  longitude: 3.3792,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function NativeMap({
  userLocation,
  driverLocation,
  pickup,
  destination,
  onRegionChange,
  useGoogleProvider,
}: RideMapProps & { useGoogleProvider: boolean }) {
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
      style={StyleSheet.absoluteFill}
      provider={useGoogleProvider ? PROVIDER_GOOGLE : undefined}
      mapType="standard"
      initialRegion={
        userLocation
          ? { ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }
          : defaultRegion
      }
      showsUserLocation
      showsMyLocationButton={false}
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

export function RideMap(props: RideMapProps) {
  // OpenStreetMap: works in Expo Go and release APK without Google Cloud SHA-1 setup.
  const useOsm =
    !hasGoogleMapsApiKey || isExpoGo || !useGoogleMapsNative;

  if (useOsm) {
    return (
      <View style={styles.mapShell}>
        <OpenStreetMapView {...props} />
      </View>
    );
  }

  return (
    <View style={styles.mapShell}>
      <NativeMap {...props} useGoogleProvider />
    </View>
  );
}

const styles = StyleSheet.create({
  mapShell: {
    flex: 1,
    minHeight: 300,
    backgroundColor: Colors.secondary,
  },
});
