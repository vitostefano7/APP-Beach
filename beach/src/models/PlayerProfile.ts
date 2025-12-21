import { Schema, model, Types } from "mongoose";

const PlayerProfileSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    level: {
      type: String,
      enum: ["beginner", "amateur", "advanced"],
      default: "amateur",
    },

    matchesPlayed: { type: Number, default: 0 },

    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    favoriteCampo: {
      type: Types.ObjectId,
      ref: "Campo",
    },
  },
  { timestamps: true }
);

export default model("PlayerProfile", PlayerProfileSchema);
