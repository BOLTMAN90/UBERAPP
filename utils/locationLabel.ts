import * as Location from 'expo-location';

import type { GeoPoint } from '@/types';

/** Turn GPS coordinates into a readable place name for pickup labels. */
export async function getLocationLabel(point: GeoPoint): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: point.latitude,
      longitude: point.longitude,
    });
    const place = results[0];
    if (!place) return 'Current location';
    const parts = [place.city, place.district, place.subregion, place.region, place.country]
      .filter(Boolean)
      .map((s) => String(s).trim());
    const unique = [...new Set(parts)];
    return unique.slice(0, 2).join(', ') || 'Current location';
  } catch {
    return 'Current location';
  }
}
