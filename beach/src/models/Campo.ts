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
  weeklySchedule: {
    monday: { enabled: boolean; open: string; close: string };
    tuesday: { enabled: boolean; open: string; close: string };
    wednesday: { enabled: boolean; open: string; close: string };
    thursday: { enabled: boolean; open: string; close: string };
    friday: { enabled: boolean; open: string; close: string };
    saturday: { enabled: boolean; open: string; close: string };
    sunday: { enabled: boolean; open: string; close: string };
  };
  closedDates: string[]; // ["2025-12-25", "2025-01-01"]
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

    weeklySchedule: {
      type: {
        monday: {
          enabled: { type: Boolean, default: true },
          open: { type: String, default: "09:00" },
          close: { type: String, default: "22:00" },
        },
        tuesday: {
          enabled: { type: Boolean, default: true },
          open: { type: String, default: "09:00" },
          close: { type: String, default: "22:00" },
        },
        wednesday: {
          enabled: { type: Boolean, default: true },
          open: { type: String, default: "09:00" },
          close: { type: String, default: "22:00" },
        },
        thursday: {
          enabled: { type: Boolean, default: true },
          open: { type: String, default: "09:00" },
          close: { type: String, default: "22:00" },
        },
        friday: {
          enabled: { type: Boolean, default: true },
          open: { type: String, default: "09:00" },
          close: { type: String, default: "22:00" },
        },
        saturday: {
          enabled: { type: Boolean, default: true },
          open: { type: String, default: "09:00" },
          close: { type: String, default: "22:00" },
        },
        sunday: {
          enabled: { type: Boolean, default: true },
          open: { type: String, default: "09:00" },
          close: { type: String, default: "22:00" },
        },
      },
      default: () => ({
        monday: { enabled: true, open: "09:00", close: "22:00" },
        tuesday: { enabled: true, open: "09:00", close: "22:00" },
        wednesday: { enabled: true, open: "09:00", close: "22:00" },
        thursday: { enabled: true, open: "09:00", close: "22:00" },
        friday: { enabled: true, open: "09:00", close: "22:00" },
        saturday: { enabled: true, open: "09:00", close: "22:00" },
        sunday: { enabled: true, open: "09:00", close: "22:00" },
      }),
    },

    closedDates: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICampo>("Campo", CampoSchema);