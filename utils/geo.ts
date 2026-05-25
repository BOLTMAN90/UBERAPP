import { FARE } from '@/constants/config';
import { getCategoryMultiplier } from '@/constants/rideOptions';
import type { GeoPoint, RideCategory } from '@/types';

const EARTH_RADIUS_KM = 6371;

export function getDistanceKm(from: GeoPoint, to: GeoPoint): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Total distance for multi-stop route. */
export function getRouteDistanceKm(points: GeoPoint[]): number {
  if (points.length < 2) {
    return 0;
  }
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += getDistanceKm(points[i - 1], points[i]);
  }
  return total;
}

export function estimateFare(
  distanceKm: number,
  category: RideCategory = 'economy',
  surgeMultiplier = 1,
): number {
  const durationHours = distanceKm / FARE.averageSpeedKmh;
  const durationMinutes = durationHours * 60;
  const base =
    FARE.baseFare + distanceKm * FARE.perKm + durationMinutes * FARE.perMinute;
  const fare = base * getCategoryMultiplier(category) * surgeMultiplier;
  return Math.round(fare * 100) / 100;
}

/** Smart match: nearest driver with best rating. */
export function findBestDriver<
  T extends { uid: string; currentLocation?: GeoPoint; rating?: number; rideCategories?: RideCategory[] },
>(drivers: T[], pickup: GeoPoint, category?: RideCategory): T | null {
  const eligible = drivers.filter((d) => {
    if (!d.currentLocation) {
      return false;
    }
    if (category && d.rideCategories?.length && !d.rideCategories.includes(category)) {
      return false;
    }
    return true;
  });

  if (!eligible.length) {
    return null;
  }

  let best: T | null = null;
  let bestScore = -Infinity;

  for (const driver of eligible) {
    const distance = getDistanceKm(pickup, driver.currentLocation!);
    const rating = driver.rating ?? 4;
    const score = rating * 2 - distance;
    if (score > bestScore) {
      bestScore = score;
      best = driver;
    }
  }

  return best;
}

export function findClosestDriver<T extends { uid: string; currentLocation?: GeoPoint }>(
  drivers: T[],
  pickup: GeoPoint,
): T | null {
  return findBestDriver(drivers, pickup);
}
