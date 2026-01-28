import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  surname?: string;
  email: string;
  password: string;
  username: string;
  role: "player" | "owner";
  isActive: boolean;
  avatarUrl?: string;
  expoPushToken?: string;
  pushTokenUpdatedAt?: Date;
  preferredSports?: ("volley" | "beach volley")[]; 
  profilePrivacy?: "public" | "private"; // 🆕 Privacy del profilo
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  // 💰 Guadagni owner (storico transazioni)
  earnings?: Array<{
    type: "booking" | "refund" | "cancellation_penalty";
    amount: number;
    booking?: mongoose.Types.ObjectId;
    description?: string;
    createdAt: Date;
  }>;
  totalEarnings?: number; // Bilancio totale calcolato
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    surname: { type: String },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: { type: String, required: true },

    // 🆕 USERNAME
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9_]+$/,
      index: true,
    },

    role: {
      type: String,
      enum: ["player", "owner"],
      default: "player",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    avatarUrl: {
      type: String,
      default: null,
    },

    expoPushToken: {
      type: String,
      default: null,
    },

    pushTokenUpdatedAt: {
      type: Date,
      default: null,
    },

    // 🆕 PREFERENZE SPORT
    preferredSports: {
      type: [String],
      enum: ["volley", "beach volley"],
      default: [],
    },

    // 🆕 PRIVACY PROFILO
    profilePrivacy: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    // 🆕 LOCATION
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },

    // 💰 GUADAGNI OWNER
    earnings: {
      type: [
        {
          type: {
            type: String,
            enum: ["booking", "refund", "cancellation_penalty"],
            required: true,
          },
          amount: { type: Number, required: true },
          booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
          description: { type: String },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    totalEarnings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index per ricerca username
UserSchema.index({ username: "text" });

// Method per JSON pubblico (NO password, NO email)
UserSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    username: this.username,
    name: this.name,
    avatarUrl: this.avatarUrl,
  };
};

export default mongoose.model<IUser>("User", UserSchema);

