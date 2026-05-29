import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

type NotificationsModule = typeof import('expo-notifications');

function loadNotifications(): NotificationsModule | null {
  if (isExpoGo) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }
}

const Notifications = loadNotifications();

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function getExpoPushToken(): Promise<string | null> {
  if (!Notifications) return null;
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Orders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const finalStatus =
    existing.status === 'granted'
      ? existing.status
      : (await Notifications.requestPermissionsAsync()).status;
  if (finalStatus !== 'granted') return null;

  try {
    // Native FCM registration token (Android) / APNs token (iOS).
    // Backend uses firebase-admin to send directly; no Expo Push project required.
    const token = await Notifications.getDevicePushTokenAsync();
    return typeof token.data === 'string' ? token.data : null;
  } catch {
    return null;
  }
}
