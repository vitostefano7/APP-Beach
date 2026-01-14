import mongoose, { Document, Schema } from "mongoose";

export interface ICommunityEvent extends Document {
  title: string;
  description: string;
  date: Date;
  location: string;
  image?: string; // Cloudinary URL
  organizer: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  maxParticipants: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  struttura?: mongoose.Types.ObjectId; // Ref to Struttura if organized by owner
  isStrutturaEvent: boolean; // True if organized by owner for a struttura
  createdAt: Date;
  updatedAt: Date;
}

const CommunityEventSchema = new Schema<ICommunityEvent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    image: {
      type: String,
      trim: true,
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    maxParticipants: {
      type: Number,
      required: true,
      min: 2,
      max: 100,
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
      index: true,
    },
    struttura: {
      type: Schema.Types.ObjectId,
      ref: "Struttura",
      default: null,
      index: true,
    },
    isStrutturaEvent: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indici per performance
CommunityEventSchema.index({ status: 1, date: 1 });
CommunityEventSchema.index({ organizer: 1, createdAt: -1 });

// Virtual per contare partecipanti
CommunityEventSchema.virtual("participantsCount").get(function () {
  return this.participants.length;
});

// Virtual per verificare se è pieno
CommunityEventSchema.virtual("isFull").get(function () {
  return this.participants.length >= this.maxParticipants;
});

// Validazione: data deve essere futura per eventi "upcoming"
CommunityEventSchema.pre("save", function (next: any) {
  if (this.isNew && this.status === "upcoming") {
    if (this.date <= new Date()) {
      throw new Error("Event date must be in the future");
    }
  }
  next();
});

export default mongoose.model<ICommunityEvent>(
  "CommunityEvent",
  CommunityEventSchema
);
