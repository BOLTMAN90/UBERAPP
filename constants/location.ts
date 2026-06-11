import type { GeoPoint } from '@/types';

/** Neutral Nigeria map center — only used when no live GPS is available yet. */
export const DEFAULT_MAP_CENTER: GeoPoint = {
  latitude: 7.7719,
  longitude: 4.5561,
};
