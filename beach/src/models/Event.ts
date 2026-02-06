import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEvent extends Document {
  name: string;
  description?: string;
  type: "tournament" | "league" | "friendly";
  organizer: Types.ObjectId;
  struttura?: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  sport: Types.ObjectId; // Ref to Sport
  maxParticipants?: number;
  isPublic: boolean;
  participants: Types.ObjectId[];
  status: "draft" | "open" | "ongoing" | "completed" | "cancelled";
  coverImage?: string;
}

const EventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      maxlength: 1000,
    },

    type: {
      type: String,
      enum: ["tournament", "league", "friendly"],
      required: true,
    },

    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    struttura: {
      type: Schema.Types.ObjectId,
      ref: "Struttura",
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (endDate: Date) {
          const event = this as IEvent;
          return endDate >= event.startDate;
        },
        message: "endDate deve essere >= startDate",
      },
    },

    sport: {
      type: Schema.Types.ObjectId,
      ref: "Sport",
      required: true,
    },

    maxParticipants: {
      type: Number,
      min: 2,
    },

    isPublic: {
      type: Boolean,
      default: true,
    },

    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    status: {
      type: String,
      enum: ["draft", "open", "ongoing", "completed", "cancelled"],
      default: "draft",
    },

    coverImage: {
      type: String,
    },
  },
  { timestamps: true }
);

EventSchema.index({ status: 1, startDate: 1 });
EventSchema.index({ sport: 1, isPublic: 1 });

export default mongoose.model<IEvent>("Event", EventSchema);