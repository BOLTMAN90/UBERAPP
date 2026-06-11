import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import type { RideMapProps } from '@/components/rideMapTypes';
import { Colors } from '@/constants/theme';
import { DEFAULT_MAP_CENTER } from '@/constants/location';
import type { GeoPoint } from '@/types';

/** Stable HTML — do not rebuild when GPS updates (rebuilding caused blank/black flashes). */
function buildOsmHtml(initial: GeoPoint) {
  const lat = initial.latitude;
  const lng = initial.longitude;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #e8ecf0; }
    .leaflet-container { background: #e8ecf0; font-family: sans-serif; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = null;
    var userMarker = null, pickupMarker = null, destMarker = null, driverMarker = null, routeLine = null;

    function initMap() {
      if (typeof L === 'undefined') {
        document.body.innerHTML = '<p style="padding:16px;color:#333">Map library failed to load. Check internet connection.</p>';
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'leaflet' }));
        }
        return;
      }
      map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      map.on('click', function(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapPress',
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        }));
      });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      }
    }

    function setMarker(existing, latlng, label, color) {
      if (!latlng) { if (existing) map.removeLayer(existing); return null; }
      if (existing) { existing.setLatLng(latlng); return existing; }
      return L.marker(latlng).addTo(map).bindPopup(label);
    }

    window.updateRideMap = function(payload) {
      if (!map) return;
      var center = payload.center ? [payload.center.lat, payload.center.lng] : null;
      var pickup = payload.pickup ? [payload.pickup.lat, payload.pickup.lng] : null;
      var dest = payload.destination ? [payload.destination.lat, payload.destination.lng] : null;
      var driver = payload.driver ? [payload.driver.lat, payload.driver.lng] : null;
      userMarker = setMarker(userMarker, center, 'You', '#2196F3');
      pickupMarker = setMarker(pickupMarker, pickup, 'Pickup');
      destMarker = setMarker(destMarker, dest, 'Destination');
      driverMarker = setMarker(driverMarker, driver, 'Driver');
      if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
      if (pickup && dest) {
        routeLine = L.polyline([pickup, dest], { color: '#FBC02D', weight: 4 }).addTo(map);
      }
      var points = [pickup, dest, driver, center].filter(Boolean);
      if (points.length > 1) map.fitBounds(points, { padding: [50, 50] });
      else if (center) map.setView(center, 14);
    };

    if (document.readyState === 'complete') initMap();
    else window.addEventListener('load', initMap);
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [webReady, setWebReady] = useState(false);

  const mapAnchor = userLocation ?? pickup ?? destination;
  const [initialCenter, setInitialCenter] = useState<GeoPoint | null>(null);

  useEffect(() => {
    if (mapAnchor && !initialCenter) {
      setInitialCenter(mapAnchor);
    }
  }, [mapAnchor, initialCenter]);

  const html = useMemo(
    () => buildOsmHtml(initialCenter ?? DEFAULT_MAP_CENTER),
    [initialCenter],
  );

  if (!mapAnchor || !initialCenter) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Waiting for your location…</Text>
      </View>
    );
  }

  const payload = useMemo(
    () =>
      JSON.stringify({
        center: userLocation
          ? { lat: userLocation.latitude, lng: userLocation.longitude }
          : {
              lat: initialCenter.latitude,
              lng: initialCenter.longitude,
            },
        pickup: pickup ? { lat: pickup.latitude, lng: pickup.longitude } : null,
        destination: destination
          ? { lat: destination.latitude, lng: destination.longitude }
          : null,
        driver: driverLocation
          ? { lat: driverLocation.latitude, lng: driverLocation.longitude }
          : null,
      }),
    [destination, driverLocation, pickup, userLocation],
  );

  const syncMarkers = () => {
    webRef.current?.injectJavaScript(
      `window.updateRideMap && window.updateRideMap(${payload}); true;`,
    );
  };

  useEffect(() => {
    if (webReady) syncMarkers();
  }, [payload, webReady]);

  if (loadError) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorTitle}>Map could not load</Text>
        <Text style={styles.errorText}>{loadError}</Text>
        <Text style={styles.errorHint}>Check internet connection and try again.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!webReady ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading map…</Text>
        </View>
      ) : null}
      <WebView
        ref={webRef}
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://boltride.local/' }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        allowsInlineMediaPlayback
        androidLayerType="hardware"
        setSupportMultipleWindows={false}
        onLoadEnd={() => syncMarkers()}
        onError={() => setLoadError('WebView failed to load the map.')}
        onHttpError={() => setLoadError('Network error loading map tiles.')}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data) as {
              type: string;
              latitude?: number;
              longitude?: number;
              message?: string;
            };
            if (data.type === 'ready') {
              setWebReady(true);
              setLoadError(null);
              syncMarkers();
              return;
            }
            if (data.type === 'error') {
              setLoadError('Map tiles could not load. Enable internet access for BoltRide.');
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
    backgroundColor: '#e8ecf0',
  },
  webview: {
    flex: 1,
    backgroundColor: '#e8ecf0',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8ecf0',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 8,
    color: Colors.textSecondary,
  },
  errorBox: {
    flex: 1,
    minHeight: 280,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#e8ecf0',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  errorText: {
    marginTop: 8,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  errorHint: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
