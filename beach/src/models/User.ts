import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "player" | "owner";
  isActive: boolean;
  avatarUrl?: string; // ✅ NUOVO: URL dell'immagine profilo
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },

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
      default: null 
    }, // ✅ NUOVO
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);