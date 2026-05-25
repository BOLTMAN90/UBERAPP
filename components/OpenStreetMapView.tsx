import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import type { RideMapProps } from '@/components/rideMapTypes';
import { Colors } from '@/constants/theme';
import { DEFAULT_MAP_CENTER } from '@/constants/location';
import type { GeoPoint } from '@/types';

function buildOsmHtml(center: GeoPoint) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>html,body,#map{height:100%;margin:0;padding:0}</style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map').setView([${center.latitude}, ${center.longitude}], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: 'OpenStreetMap'
    }).addTo(map);
    let pickupMarker = null, destMarker = null, driverMarker = null, routeLine = null;

    function setMarker(existing, latlng, label) {
      if (!latlng) { if (existing) map.removeLayer(existing); return null; }
      if (existing) { existing.setLatLng(latlng); return existing; }
      return L.marker(latlng).addTo(map).bindPopup(label);
    }

    window.updateRideMap = function(payload) {
      const pickup = payload.pickup ? [payload.pickup.lat, payload.pickup.lng] : null;
      const dest = payload.destination ? [payload.destination.lat, payload.destination.lng] : null;
      const driver = payload.driver ? [payload.driver.lat, payload.driver.lng] : null;
      pickupMarker = setMarker(pickupMarker, pickup, 'Pickup');
      destMarker = setMarker(destMarker, dest, 'Destination');
      driverMarker = setMarker(driverMarker, driver, 'Driver');
      if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
      if (pickup && dest) {
        routeLine = L.polyline([pickup, dest], { color: '#FBC02D', weight: 4 }).addTo(map);
      }
      const points = [pickup, dest, driver, payload.center ? [payload.center.lat, payload.center.lng] : null].filter(Boolean);
      if (points.length) map.fitBounds(points, { padding: [50, 50] });
      else if (payload.center) map.setView([payload.center.lat, payload.center.lng], 14);
    };

    map.on('click', function(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapPress',
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      }));
    });

    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
  </script>
</body>
</html>`;
}

export function OpenStreetMapView({
  userLocation,
  driverLocation,
  pickup,
  destination,
  onDestinationChange,
}: RideMapProps) {
  const webRef = useRef<WebView>(null);
  const center = userLocation ?? pickup ?? destination ?? DEFAULT_MAP_CENTER;
  const html = useMemo(() => buildOsmHtml(center), [center.latitude, center.longitude]);

  const payload = useMemo(
    () =>
      JSON.stringify({
        center: userLocation
          ? { lat: userLocation.latitude, lng: userLocation.longitude }
          : { lat: center.latitude, lng: center.longitude },
        pickup: pickup ? { lat: pickup.latitude, lng: pickup.longitude } : null,
        destination: destination
          ? { lat: destination.latitude, lng: destination.longitude }
          : null,
        driver: driverLocation
          ? { lat: driverLocation.latitude, lng: driverLocation.longitude }
          : null,
      }),
    [center.latitude, center.longitude, destination, driverLocation, pickup, userLocation],
  );

  const syncMarkers = () => {
    webRef.current?.injectJavaScript(
      `window.updateRideMap && window.updateRideMap(${payload}); true;`,
    );
  };

  useEffect(() => {
    syncMarkers();
  }, [payload]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        style={StyleSheet.absoluteFill}
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data) as {
              type: string;
              latitude?: number;
              longitude?: number;
            };
            if (data.type === 'ready') {
              syncMarkers();
              return;
            }
            if (data.type === 'mapPress' && data.latitude != null && data.longitude != null) {
              onDestinationChange?.({ latitude: data.latitude, longitude: data.longitude });
            }
          } catch {
            // ignore
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 280,
    backgroundColor: Colors.secondary,
  },
});
