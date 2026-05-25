import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Resolve the host machine for Firebase emulators across Expo targets. */
export function getEmulatorHost(): string {
  const debuggerHost = Constants.expoGoConfig?.debuggerHost ?? Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return '127.0.0.1';
}
