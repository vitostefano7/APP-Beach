import { Types } from "mongoose";
import Notification, { INotification } from "../models/Notification";

type NotificationType = "new_follower" | "follow_back" | "match_invite" | "match_start" | "match_result";

export async function createNotification(
  recipient: Types.ObjectId,
  sender: Types.ObjectId | undefined,
  type: NotificationType,
  title: string,
  message: string,
  relatedId?: Types.ObjectId,
  relatedModel?: "Match" | "Friendship" | "Booking" | "User"
): Promise<INotification | null> {
  try {
    const notification = new Notification({
      recipient,
      sender,
      type,
      title,
      message,
      relatedId,
      relatedModel,
      isRead: false,
    });

    await notification.save();
    
    console.log(`✅ Notifica creata: ${type} per utente ${recipient}`);
    
    return notification;
  } catch (error) {
    console.error("❌ Errore creazione notifica:", error);
    return null;
  }
}
