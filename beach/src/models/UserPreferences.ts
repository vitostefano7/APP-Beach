import { Schema, model, Types } from "mongoose";

const UserPreferencesSchema = new Schema({
  user: {
    type: Types.ObjectId,
    ref: "User",
    unique: true,
    required: true,
  },

  pushNotifications: { type: Boolean, default: true },
  darkMode: { type: Boolean, default: false },

  privacyLevel: {
    type: String,
    enum: ["public", "friends", "private"],
    default: "public",
  },
});

export default model("UserPreferences", UserPreferencesSchema);
