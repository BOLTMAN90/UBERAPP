import Constants from 'expo-constants';

/** True when running inside the Expo Go app (not a custom dev build). */
export const isExpoGo = Constants.appOwnership === 'expo';
