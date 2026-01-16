import { Types } from "mongoose";
import Notification, { INotification } from "../models/Notification";

type NotificationType = "new_follower" | "follow_back" | "match_invite" | "match_start" | "match_result" | "new_booking" | "match_join";

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
    console.log(`📝 [createNotification] Creazione notifica:`, {
      type,
      recipient: recipient.toString(),
      sender: sender?.toString(),
      title,
      message,
      relatedId: relatedId?.toString(),
      relatedModel
    });

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
    
    console.log(`✅ [createNotification] Notifica creata con ID: ${notification._id} per utente ${recipient}`);
    
    return notification;
  } catch (error) {
    console.error("❌ [createNotification] Errore creazione notifica:", error);
    return null;
  }
}
