import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import { DEFAULT_MAP_CENTER } from '@/constants/location';
import type { GeoPoint } from '@/types';

const LOCATION_TIMEOUT_MS = 15_000;

function toGeoPoint(position: Location.LocationObject): GeoPoint {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

export function useCurrentLocation() {
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const resolveLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingFallback(false);

    try {
      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn) {
        setLocation(DEFAULT_MAP_CENTER);
        setUsingFallback(true);
        setError(
          'Location services are off. Turn on GPS in phone settings, or set pickup on the map.',
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation(DEFAULT_MAP_CENTER);
        setUsingFallback(true);
        setError(
          'Location permission denied. Allow location for BoltRide in Settings, or set pickup on the map.',
        );
        return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        setLocation(toGeoPoint(lastKnown));
      }

      try {
        const current = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            mayShowUserSettingsDialog: true,
          }),
          new Promise<Location.LocationObject>((_, reject) => {
            setTimeout(
              () => reject(new Error('Current location is unavailable. Make sure that location services are enabled')),
              LOCATION_TIMEOUT_MS,
            );
          }),
        ]);
        setLocation(toGeoPoint(current));
        setUsingFallback(false);
        setError(null);
      } catch (positionError) {
        if (!lastKnown) {
          setLocation(DEFAULT_MAP_CENTER);
          setUsingFallback(true);
        }
        const message =
          positionError instanceof Error
            ? positionError.message
            : 'Could not get GPS fix. You can still use the map to choose pickup.';
        setError(message);
      }
    } catch (unexpected) {
      setLocation(DEFAULT_MAP_CENTER);
      setUsingFallback(true);
      setError(
        unexpected instanceof Error
          ? unexpected.message
          : 'Location unavailable. Using default map area.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    const start = async () => {
      await resolveLocation();
      if (cancelled) return;

      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 30,
            },
            (position) => {
              if (!cancelled) {
                setLocation(toGeoPoint(position));
                setUsingFallback(false);
              }
            },
          );
        }
      } catch {
        // Live updates are optional; one-shot location is enough to use the app.
      }
    };

    void start();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [resolveLocation]);

  return { location, loading, error, usingFallback, retry: resolveLocation };
}
