import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configura come gestire le notifiche quando l'app è in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registra il device per ricevere push notifications
 * @returns Push token (Expo Push Token)
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  // Configurazione canale Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2979ff',
    });
  }

  // Controlla se è un device fisico
  if (Device.isDevice) {
    // Controlla permessi esistenti
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Se non ha ancora i permessi, chiedili
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // Se l'utente non ha dato il permesso
    if (finalStatus !== 'granted') {
      console.log('❌ Permission not granted for push notifications');
      return;
    }
    
    // Ottieni l'Expo Push Token
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
      
      console.log('✅ Push Token:', token);
    } catch (error) {
      console.error('❌ Error getting push token:', error);
    }
  } else {
    console.log('⚠️ Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Invia una notifica locale immediata (per test)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Invia immediatamente
  });
}

/**
 * Invia una notifica locale programmata per una data specifica
 */
export async function scheduleNotificationForDate(
  title: string,
  body: string,
  date: Date,
  data?: any
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: {
      date,
    },
  });
}

/**
 * Cancella tutte le notifiche programmate
 */
export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Ottieni tutte le notifiche programmate
 */
export async function getAllScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Badge notification count (iOS)
 */
export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

export async function getBadgeCount() {
  return await Notifications.getBadgeCountAsync();
}