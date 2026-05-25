import { StyleSheet, View } from 'react-native';

import { OpenStreetMapView } from '@/components/OpenStreetMapView';
import { MapFallback } from '@/components/MapFallback';
import type { RideMapProps } from '@/components/rideMapTypes';
import { hasGoogleMapsApiKey } from '@/constants/config';
import { Colors } from '@/constants/theme';

export type { MapRegion, RideMapProps } from '@/components/rideMapTypes';

export function RideMap(props: RideMapProps) {
  if (!hasGoogleMapsApiKey) {
    return (
      <View style={styles.shell}>
        <MapFallback
          userLocation={props.userLocation}
          pickup={props.pickup}
          destination={props.destination}
          onShiftDestination={props.onDestinationChange}
        />
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <OpenStreetMapView {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, minHeight: 300, backgroundColor: Colors.secondary },
});
