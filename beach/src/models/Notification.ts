import mongoose, { Schema, Types, Document } from "mongoose";

export interface INotification extends Document {
  recipient: Types.ObjectId;
  sender?: Types.ObjectId;
  type: "new_follower" | "follow_back" | "match_invite" | "match_start" | "match_result";
  title: string;
  message: string;
  relatedId?: Types.ObjectId;
  relatedModel?: "Match" | "Friendship" | "Booking" | "User";
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["new_follower", "follow_back", "match_invite", "match_start", "match_result"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
    },
    relatedModel: {
      type: String,
      enum: ["Match", "Friendship", "Booking", "User"],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indici composti per query efficienti
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, type: 1 });

export default mongoose.model<INotification>("Notification", NotificationSchema);
