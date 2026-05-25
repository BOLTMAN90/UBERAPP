import type { GeoPoint } from '@/types';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface RideMapProps {
  userLocation?: GeoPoint | null;
  driverLocation?: GeoPoint | null;
  pickup?: GeoPoint | null;
  destination?: GeoPoint | null;
  onRegionChange?: (region: MapRegion) => void;
  onDestinationChange?: (point: GeoPoint) => void;
}
