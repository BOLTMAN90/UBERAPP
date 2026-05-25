/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

function sanitizeEnv(value) {
  if (!value) return '';
  return String(value).trim().replace(/^['"]|['"]$/g, '');
}

const googleMapsApiKey =
  sanitizeEnv(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) || 'YOUR_GOOGLE_MAPS_API_KEY';

module.exports = ({ config }) => {
  const base = appJson.expo;

  return {
    ...config,
    ...base,
    name: base.name,
    slug: base.slug,
    ios: {
      ...base.ios,
      config: {
        ...base.ios?.config,
        googleMapsApiKey,
      },
    },
    android: {
      ...base.android,
      config: {
        ...base.android?.config,
        googleMaps: {
          ...base.android?.config?.googleMaps,
          apiKey: googleMapsApiKey,
        },
      },
    },
    plugins: [
      ...(base.plugins ?? []),
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow BoltRide to access your photos for your profile picture.',
          cameraPermission: 'Allow BoltRide to use the camera for your profile picture.',
        },
      ],
    ],
    extra: {
      ...base.extra,
      ...config?.extra,
      googleMapsApiKey,
    },
  };
};
