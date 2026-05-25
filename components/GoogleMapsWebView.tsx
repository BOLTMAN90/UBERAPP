import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import type { RideMapProps } from '@/components/rideMapTypes';
import { googleMapsApiKey } from '@/constants/config';
import { Colors } from '@/constants/theme';
import type { GeoPoint } from '@/types';

const DEFAULT_CENTER: GeoPoint = { latitude: 6.5244, longitude: 3.3792 };

function buildMapHtml(center: GeoPoint, apiKey: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
    <script>
      function initMap() {
        const center = { lat: ${center.latitude}, lng: ${center.longitude} };
        const map = new google.maps.Map(document.getElementById('map'), {
          center, zoom: 14, mapTypeControl: false, streetViewControl: false,
        });
        let pickupMarker = null, destinationMarker = null, driverMarker = null, routeLine = null;
        function setMarker(existing, position, title) {
          if (!position) { if (existing) existing.setMap(null); return null; }
          if (existing) { existing.setPosition(position); return existing; }
          return new google.maps.Marker({ map, position, title });
        }
        window.updateRideMap = function(payload) {
          pickupMarker = setMarker(pickupMarker, payload.pickup, 'Pickup');
          destinationMarker = setMarker(destinationMarker, payload.destination, 'Destination');
          driverMarker = setMarker(driverMarker, payload.driver, 'Driver');
          if (routeLine) { routeLine.setMap(null); routeLine = null; }
          if (payload.pickup && payload.destination) {
            routeLine = new google.maps.Polyline({
              map, path: [payload.pickup, payload.destination],
              strokeColor: '#FBC02D', strokeWeight: 4,
            });
          }
          const bounds = new google.maps.LatLngBounds();
          [payload.pickup, payload.destination, payload.driver, payload.center].forEach((p) => {
            if (p) bounds.extend(p);
          });
          if (!bounds.isEmpty()) map.fitBounds(bounds, { top: 80, right: 80, bottom: 220, left: 80 });
          else if (payload.center) map.setCenter(payload.center);
        };
        map.addListener('click', (event) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapPress', latitude: event.latLng.lat(), longitude: event.latLng.lng(),
          }));
        });
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      }
    </script>
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap"></script>
  </head>
  <body><div id="map"></div></body>
</html>`;
}

export function GoogleMapsWebView(props: RideMapProps) {
  const webRef = useRef<WebView>(null);
  const center = props.userLocation ?? props.pickup ?? props.destination ?? DEFAULT_CENTER;
  const html = useMemo(() => buildMapHtml(center, googleMapsApiKey), [center.latitude, center.longitude]);

  const payload = useMemo(
    () =>
      JSON.stringify({
        center: props.userLocation
          ? { lat: props.userLocation.latitude, lng: props.userLocation.longitude }
          : { lat: center.latitude, lng: center.longitude },
        pickup: props.pickup ? { lat: props.pickup.latitude, lng: props.pickup.longitude } : null,
        destination: props.destination
          ? { lat: props.destination.latitude, lng: props.destination.longitude }
          : null,
        driver: props.driverLocation
          ? { lat: props.driverLocation.latitude, lng: props.driverLocation.longitude }
          : null,
      }),
    [center, props.destination, props.driverLocation, props.pickup, props.userLocation],
  );

  const syncMarkers = () => {
    webRef.current?.injectJavaScript(`window.updateRideMap && window.updateRideMap(${payload}); true;`);
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
              props.onDestinationChange?.({ latitude: data.latitude, longitude: data.longitude });
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
  container: { flex: 1, minHeight: 280, backgroundColor: Colors.secondary },
});
