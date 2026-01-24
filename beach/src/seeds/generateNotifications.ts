// seeds/generateNotifications.ts
import Notification from "../models/Notification";
import { randomInt, randomElement } from "./config";

export async function generateNotifications(users: any[], matches: any[], bookings: any[]) {
  console.log(`🔔 Creazione notifiche...`);

  const notificationsData = [];

  // Notification type definitions with their related models
  const notificationTypes = [
    { type: "match_invite", relatedModel: "Match", title: "Invito a partita", message: "Sei stato invitato a una partita" },
    { type: "match_join", relatedModel: "Match", title: "Nuovo giocatore", message: "Un giocatore si è unito alla tua partita" },
    { type: "match_start", relatedModel: "Match", title: "Partita in corso", message: "La partita sta per iniziare" },
    { type: "match_result", relatedModel: "Match", title: "Risultato partita", message: "I risultati della partita sono stati registrati" },
    { type: "new_booking", relatedModel: "Booking", title: "Nuova prenotazione", message: "Hai una nuova prenotazione" },
    { type: "booking_cancelled", relatedModel: "Booking", title: "Prenotazione cancellata", message: "Una prenotazione è stata cancellata" },
    { type: "new_follower", relatedModel: "User", title: "Nuovo follower", message: "Hai un nuovo follower" },
    { type: "follow_back", relatedModel: "User", title: "Follow reciproco", message: "Un utente ti ha seguito di ritorno" },
  ];

  for (const user of users) {
    const numNotifications = randomInt(3, 10);

    for (let i = 0; i < numNotifications; i++) {
      const notifType = randomElement(notificationTypes);
      
      let relatedId = null;
      let sender = null;

      // Assign related objects based on type
      if (notifType.relatedModel === "Match") {
        const match = randomElement(matches);
        relatedId = match?._id;
        sender = match?.createdBy;
      } else if (notifType.relatedModel === "Booking") {
        const booking = randomElement(bookings);
        relatedId = booking?._id;
        sender = booking?.user;
      } else if (notifType.relatedModel === "User") {
        const randomUser = randomElement(users.filter((u: any) => !u._id.equals(user._id)));
        relatedId = randomUser?._id;
        sender = randomUser?._id;
      }

      notificationsData.push({
        recipient: user._id,
        sender: sender,
        type: notifType.type,
        title: notifType.title,
        message: notifType.message,
        relatedId: relatedId,
        relatedModel: notifType.relatedModel,
        isRead: Math.random() > 0.6,
        createdAt: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000),
      });
    }
  }

  const notifications = await Notification.insertMany(notificationsData);
  console.log(`✅ ${notifications.length} notifiche create`);

  return notifications;
}
