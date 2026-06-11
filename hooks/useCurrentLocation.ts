import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import type { GeoPoint } from '@/types';

const LOCATION_TIMEOUT_MS = 25_000;
const MAX_LAST_KNOWN_AGE_MS = 2 * 60 * 1000;

function toGeoPoint(position: Location.LocationObject): GeoPoint {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

function isFreshPosition(position: Location.LocationObject): boolean {
  const age = Date.now() - position.timestamp;
  return age >= 0 && age <= MAX_LAST_KNOWN_AGE_MS;
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

    let hasRecentFix = false;

    try {
      if (Platform.OS === 'android') {
        await Location.enableNetworkProviderAsync().catch(() => null);
      }

      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn) {
        setLocation(null);
        setUsingFallback(true);
        setError('Turn on location (GPS) in your phone settings, then tap Retry.');
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation(null);
        setUsingFallback(true);
        setError('Allow location for BoltRide in Settings → Permissions → Location.');
        return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: MAX_LAST_KNOWN_AGE_MS,
        requiredAccuracy: 500,
      });

      if (lastKnown && isFreshPosition(lastKnown)) {
        setLocation(toGeoPoint(lastKnown));
        hasRecentFix = true;
      }

      const accuracy =
        Platform.OS === 'web' ? Location.Accuracy.Balanced : Location.Accuracy.High;

      const current = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy,
          mayShowUserSettingsDialog: true,
        }),
        new Promise<Location.LocationObject>((_, reject) => {
          setTimeout(
            () => reject(new Error('GPS timed out. Go outside or near a window, then tap Retry.')),
            LOCATION_TIMEOUT_MS,
          );
        }),
      ]);

      setLocation(toGeoPoint(current));
      setUsingFallback(false);
      setError(null);
    } catch (positionError) {
      if (!hasRecentFix) {
        setLocation(null);
        setUsingFallback(true);
      }
      const message =
        positionError instanceof Error
          ? positionError.message
          : 'Could not get your live location. Tap Retry.';
      setError(message);
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
              accuracy: Location.Accuracy.High,
              distanceInterval: 15,
              timeInterval: 5000,
            },
            (position) => {
              if (!cancelled) {
                setLocation(toGeoPoint(position));
                setUsingFallback(false);
                setError(null);
              }
            },
          );
        }
      } catch {
        // Live updates are optional.
      }
    };

    void start();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { location, loading, error, usingFallback, retry: resolveLocation };
}
