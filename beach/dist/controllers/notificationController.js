"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePushToken = void 0;
exports.sendPushNotification = sendPushNotification;
exports.sendPushNotificationToMultiple = sendPushNotificationToMultiple;
exports.notifyBookingConfirmed = notifyBookingConfirmed;
exports.notifyBookingReminder = notifyBookingReminder;
exports.notifyBookingCancelled = notifyBookingCancelled;
const expo_server_sdk_1 = require("expo-server-sdk");
const User_1 = __importDefault(require("../models/User"));
// Crea un client Expo SDK
const expo = new expo_server_sdk_1.Expo();
/**
 * POST /users/me/push-token
 * Salva il push token dell'utente
 */
const savePushToken = async (req, res) => {
    try {
        const userId = req.user.id;
        const { pushToken } = req.body;
        if (!pushToken) {
            return res.status(400).json({ message: "Push token richiesto" });
        }
        // Verifica che sia un valid Expo push token
        if (!expo_server_sdk_1.Expo.isExpoPushToken(pushToken)) {
            return res.status(400).json({ message: "Invalid push token" });
        }
        // Aggiorna l'utente con il push token
        await User_1.default.findByIdAndUpdate(userId, {
            expoPushToken: pushToken,
            pushTokenUpdatedAt: new Date(),
        });
        console.log('✅ Push token saved for user:', userId);
        res.json({ message: "Push token salvato con successo" });
    }
    catch (error) {
        console.error("savePushToken error", error);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.savePushToken = savePushToken;
/**
 * Invia una notifica push a un utente specifico
 */
async function sendPushNotification(userId, title, body, data) {
    try {
        const user = await User_1.default.findById(userId);
        if (!user || !user.expoPushToken) {
            console.log('⚠️ No push token for user:', userId);
            return;
        }
        if (!expo_server_sdk_1.Expo.isExpoPushToken(user.expoPushToken)) {
            console.log('⚠️ Invalid push token for user:', userId);
            return;
        }
        const message = {
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
            }
            catch (error) {
                console.error('❌ Error sending push notification:', error);
            }
        }
        return tickets;
    }
    catch (error) {
        console.error('sendPushNotification error', error);
    }
}
/**
 * Invia notifiche push a più utenti
 */
async function sendPushNotificationToMultiple(userIds, title, body, data) {
    try {
        const users = await User_1.default.find({
            _id: { $in: userIds },
            expoPushToken: { $exists: true, $ne: null }
        });
        const messages = users
            .filter(user => expo_server_sdk_1.Expo.isExpoPushToken(user.expoPushToken))
            .map(user => ({
            to: user.expoPushToken,
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
            }
            catch (error) {
                console.error('❌ Error sending push notifications:', error);
            }
        }
        console.log(`✅ Sent ${tickets.length} push notifications`);
        return tickets;
    }
    catch (error) {
        console.error('sendPushNotificationToMultiple error', error);
    }
}
/**
 * Esempio: Invia notifica quando una prenotazione viene confermata
 */
async function notifyBookingConfirmed(userId, bookingDetails) {
    await sendPushNotification(userId, '🎾 Prenotazione Confermata!', `${bookingDetails.campoName} - ${bookingDetails.date} alle ${bookingDetails.time}`, {
        screen: 'Bookings',
        type: 'booking_confirmed',
    });
}
/**
 * Esempio: Invia notifica reminder per prenotazione
 */
async function notifyBookingReminder(userId, bookingDetails) {
    await sendPushNotification(userId, '⏰ Promemoria Partita', `La tua partita a ${bookingDetails.campoName} è tra 1 ora!`, {
        screen: 'BookingDetail',
        type: 'booking_reminder',
    });
}
/**
 * Esempio: Invia notifica quando una prenotazione viene cancellata
 */
async function notifyBookingCancelled(userId, bookingDetails) {
    await sendPushNotification(userId, '❌ Prenotazione Cancellata', `${bookingDetails.campoName} - ${bookingDetails.date} alle ${bookingDetails.time}`, {
        screen: 'Bookings',
        type: 'booking_cancelled',
    });
}
