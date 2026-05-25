import type { GeoPoint } from '@/types';

/** Default map center (Lagos) when GPS is unavailable — app still works. */
export const DEFAULT_MAP_CENTER: GeoPoint = {
  latitude: 6.5244,
  longitude: 3.3792,
};
