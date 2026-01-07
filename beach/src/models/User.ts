import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  surname?: string;
  email: string;
  password: string;
  username: string; // 🆕 NUOVO
  role: "player" | "owner";
  isActive: boolean;
  avatarUrl?: string;
  expoPushToken?: string;
  pushTokenUpdatedAt?: Date;
  preferredSports?: ("volleyball" | "beach_volleyball")[]; // 🆕 NUOVO
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
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
      enum: ["volleyball", "beach_volleyball"],
      default: [],
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

