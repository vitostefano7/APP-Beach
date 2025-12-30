import { Response } from "express";
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";

// Crea un client Expo SDK
const expo = new Expo();

/**
 * POST /users/me/push-token
 * Salva il push token dell'utente
 */
export const savePushToken = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({ message: "Push token richiesto" });
    }

    // Verifica che sia un valid Expo push token
    if (!Expo.isExpoPushToken(pushToken)) {
      return res.status(400).json({ message: "Invalid push token" });
    }

    // Aggiorna l'utente con il push token
    await User.findByIdAndUpdate(userId, {
      expoPushToken: pushToken,
      pushTokenUpdatedAt: new Date(),
    });

    console.log('✅ Push token saved for user:', userId);
    res.json({ message: "Push token salvato con successo" });
  } catch (error) {
    console.error("savePushToken error", error);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * Invia una notifica push a un utente specifico
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
) {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.expoPushToken) {
      console.log('⚠️ No push token for user:', userId);
      return;
    }

    if (!Expo.isExpoPushToken(user.expoPushToken)) {
      console.log('⚠️ Invalid push token for user:', userId);
      return;
    }

    const message: ExpoPushMessage = {
      to: user.expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        console.log('✅ Push notification sent:', ticketChunk);
      } catch (error) {
        console.error('❌ Error sending push notification:', error);
      }
    }

    return tickets;
  } catch (error) {
    console.error('sendPushNotification error', error);
  }
}

/**
 * Invia notifiche push a più utenti
 */
export async function sendPushNotificationToMultiple(
  userIds: string[],
  title: string,
  body: string,
  data?: any
) {
  try {
    const users = await User.find({ 
      _id: { $in: userIds },
      expoPushToken: { $exists: true, $ne: null }
    });

    const messages: ExpoPushMessage[] = users
      .filter(user => Expo.isExpoPushToken(user.expoPushToken!))
      .map(user => ({
        to: user.expoPushToken!,
        sound: 'default',
        title,
        body,
        data,
      }));

    if (messages.length === 0) {
      console.log('⚠️ No valid push tokens found');
      return;
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('❌ Error sending push notifications:', error);
      }
    }

    console.log(`✅ Sent ${tickets.length} push notifications`);
    return tickets;
  } catch (error) {
    console.error('sendPushNotificationToMultiple error', error);
  }
}

/**
 * Esempio: Invia notifica quando una prenotazione viene confermata
 */
export async function notifyBookingConfirmed(
  userId: string,
  bookingDetails: {
    campoName: string;
    date: string;
    time: string;
  }
) {
  await sendPushNotification(
    userId,
    '🎾 Prenotazione Confermata!',
    `${bookingDetails.campoName} - ${bookingDetails.date} alle ${bookingDetails.time}`,
    {
      screen: 'Bookings',
      type: 'booking_confirmed',
    }
  );
}

/**
 * Esempio: Invia notifica reminder per prenotazione
 */
export async function notifyBookingReminder(
  userId: string,
  bookingDetails: {
    campoName: string;
    date: string;
    time: string;
  }
) {
  await sendPushNotification(
    userId,
    '⏰ Promemoria Partita',
    `La tua partita a ${bookingDetails.campoName} è tra 1 ora!`,
    {
      screen: 'BookingDetail',
      type: 'booking_reminder',
    }
  );
}

/**
 * Esempio: Invia notifica quando una prenotazione viene cancellata
 */
export async function notifyBookingCancelled(
  userId: string,
  bookingDetails: {
    campoName: string;
    date: string;
    time: string;
  }
) {
  await sendPushNotification(
    userId,
    '❌ Prenotazione Cancellata',
    `${bookingDetails.campoName} - ${bookingDetails.date} alle ${bookingDetails.time}`,
    {
      screen: 'Bookings',
      type: 'booking_cancelled',
    }
  );
}