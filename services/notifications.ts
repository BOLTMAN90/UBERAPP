import * as Device from 'expo-device';
import { isRunningInExpoGo } from 'expo';
import { Alert, Platform } from 'react-native';

import type { RideStatus } from '@/types';

// expo-notifications throws on import in Android Expo Go (SDK 53+). Lazy-load only in dev builds.
const canUsePushNotifications = Platform.OS !== 'web' && !isRunningInExpoGo();

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null = null;
let initPromise: Promise<NotificationsModule | null> | null = null;

async function getNotifications(): Promise<NotificationsModule | null> {
  if (!canUsePushNotifications) {
    return null;
  }

  if (notificationsModule) {
    return notificationsModule;
  }

  if (!initPromise) {
    initPromise = import('expo-notifications').then((mod) => {
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      notificationsModule = mod;
      return mod;
    });
  }

  return initPromise;
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web' || isRunningInExpoGo()) {
    return null;
  }

  if (!Device.isDevice) {
    return null;
  }

  const Notifications = await getNotifications();
  if (!Notifications) {
    return null;
  }

  type PermissionResult = { granted?: boolean; status?: string };
  const existing = (await Notifications.getPermissionsAsync()) as PermissionResult;
  let granted = existing.granted ?? existing.status === 'granted';

  if (!granted) {
    const requested = (await Notifications.requestPermissionsAsync()) as PermissionResult;
    granted = requested.granted ?? requested.status === 'granted';
  }

  if (!granted) {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('rides', {
      name: 'Ride updates',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return token.data;
}

const rideStatusMessages: Partial<Record<RideStatus, { title: string; body: string }>> = {
  accepted: {
    title: 'Driver accepted',
    body: 'Your driver is on the way to confirm the pickup.',
  },
  arriving: {
    title: 'Driver arriving',
    body: 'Your driver is almost at the pickup point.',
  },
  ongoing: {
    title: 'Trip started',
    body: 'Enjoy your ride. We are tracking the trip in real time.',
  },
  completed: {
    title: 'Trip completed',
    body: 'Thanks for riding with RideYellow.',
  },
};

export async function notifyRideStatusChange(status: RideStatus): Promise<void> {
  const message = rideStatusMessages[status];
  if (!message) {
    return;
  }

  const Notifications = await getNotifications();
  if (!Notifications) {
    if (__DEV__) {
      Alert.alert(message.title, message.body);
    }
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: message.title,
      body: message.body,
      sound: true,
    },
    trigger: null,
  });
}
