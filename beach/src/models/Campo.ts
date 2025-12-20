import mongoose, { Schema, Document } from "mongoose";

export interface ICampo extends Document {
  struttura: mongoose.Types.ObjectId;
  name: string;
  sport: "beach_volley" | "padel" | "tennis";
  surface: "sand" | "hardcourt" | "grass";
  maxPlayers: number;
  indoor: boolean;
  pricePerHour: number;
  isActive: boolean;
}

const CampoSchema = new Schema<ICampo>(
  {
    struttura: {
      type: Schema.Types.ObjectId,
      ref: "Struttura",
      required: true,
    },

    name: { type: String, required: true },

    sport: {
      type: String,
      enum: ["beach_volley", "padel", "tennis"],
      required: true,
    },

    surface: {
      type: String,
      enum: ["sand", "hardcourt", "grass"],
      required: true,
    },

    maxPlayers: { type: Number, default: 4 },
    indoor: { type: Boolean, default: false },

    pricePerHour: { type: Number, required: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICampo>("Campo", CampoSchema);
