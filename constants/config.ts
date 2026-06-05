import Constants from 'expo-constants';

import { sanitizeEnvValue } from '@/utils/env';

const placeholderFirebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
} as const;

/** Used only when EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true (see npm run dev:emulators). */
export const demoFirebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-rideyellow.firebaseapp.com',
  projectId: 'demo-rideyellow',
  storageBucket: 'demo-rideyellow.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:rideyellow-demo',
} as const;

const envApiKey = sanitizeEnvValue(process.env.EXPO_PUBLIC_FIREBASE_API_KEY);

export const hasValidFirebaseConfig =
  Boolean(envApiKey) && !envApiKey.includes('YOUR_');

/** Opt-in: set EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true and run npm run dev:emulators. */
export const useFirebaseEmulators =
  process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

export const firebaseConfig = useFirebaseEmulators
  ? demoFirebaseConfig
  : hasValidFirebaseConfig
    ? {
        apiKey: envApiKey,
        authDomain: sanitizeEnvValue(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
        projectId: sanitizeEnvValue(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
        storageBucket: sanitizeEnvValue(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
        messagingSenderId: sanitizeEnvValue(
          process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        ),
        appId: sanitizeEnvValue(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
      }
    : placeholderFirebaseConfig;

/** Google Maps API key used by react-native-maps (Android/iOS). */
export const googleMapsApiKey =
  sanitizeEnvValue(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) ||
  sanitizeEnvValue(Constants.expoConfig?.extra?.googleMapsApiKey) ||
  sanitizeEnvValue(Constants.expoConfig?.android?.config?.googleMaps?.apiKey) ||
  'YOUR_GOOGLE_MAPS_API_KEY';

export const hasGoogleMapsApiKey = !googleMapsApiKey.includes('YOUR_');

/**
 * Native Google Maps on APK (react-native-maps). Requires Maps SDK for Android + EAS SHA-1 on API key.
 * Also set EXPO_PUBLIC_GOOGLE_MAPS_NATIVE_VERIFIED=true after Google Cloud is configured.
 * If Google tiles fail to load, the app auto-falls back to OpenStreetMap after a few seconds.
 */
export const useGoogleMapsNative =
  sanitizeEnvValue(process.env.EXPO_PUBLIC_USE_GOOGLE_MAPS_NATIVE) === 'true' &&
  sanitizeEnvValue(process.env.EXPO_PUBLIC_GOOGLE_MAPS_NATIVE_VERIFIED) === 'true';

/** Simple fare model for the learning MVP. */
export const FARE = {
  baseFare: 2.5,
  perKm: 1.2,
  perMinute: 0.25,
  averageSpeedKmh: 30,
} as const;

/** Seeded in Firebase emulators only; not used with cloud Firebase unless you create the same users. */
export const demoAccounts = {
  rider: {
    email: 'rider@rideyellow.test',
    password: 'RideYellow123!',
  },
  driver: {
    email: 'driver@rideyellow.test',
    password: 'RideYellow123!',
  },
} as const;
