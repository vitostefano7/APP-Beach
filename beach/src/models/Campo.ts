import mongoose, { Schema, Document } from "mongoose";

/* =======================
   INTERFACES
======================= */

export interface Slot {
  time: string;
  enabled: boolean;
}

export interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
}

export interface ICampo extends Document {
  struttura: mongoose.Types.ObjectId;
  name: string;
  sport: "beach_volley" | "volley";
  surface: "sand" | "cement" | "pvc";
  maxPlayers: number;
  indoor: boolean;
  pricePerHour: number;
  isActive: boolean;
  weeklySchedule: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
}

/* =======================
   SUB SCHEMAS
======================= */

const DayScheduleSchema = new Schema<DaySchedule>(
  {
    enabled: { type: Boolean, default: true },
    open: { type: String, default: "09:00" },
    close: { type: String, default: "22:00" },
  },
  { _id: false }
);

/* =======================
   MAIN SCHEMA
======================= */

const CampoSchema = new Schema<ICampo>(
  {
    struttura: {
      type: Schema.Types.ObjectId,
      ref: "Struttura",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    sport: {
      type: String,
      enum: ["beach_volley", "volley"],
      required: true,
    },

    surface: {
      type: String,
      enum: ["sand", "cement", "pvc"],
      required: true,
      validate: {
        validator: function (value: string) {
          const doc = this as any;

          // Beach volley → sabbia
          if (doc.sport === "beach_volley") {
            return value === "sand";
          }

          // Volley indoor → PVC
          if (doc.sport === "volley" && doc.indoor) {
            return value === "pvc";
          }

          // Volley outdoor → cemento
          if (doc.sport === "volley" && !doc.indoor) {
            return value === "cement";
          }

          return true;
        },
        message: function () {
          const doc = this as any;

          if (doc.sport === "beach_volley") {
            return "Beach volley deve avere superficie sabbia";
          }
          if (doc.sport === "volley" && doc.indoor) {
            return "Volley indoor deve avere superficie PVC";
          }
          if (doc.sport === "volley" && !doc.indoor) {
            return "Volley outdoor deve avere superficie cemento";
          }
          return "Superficie non valida";
        },
      },
    },

    maxPlayers: {
      type: Number,
      default: 4,
      min: 1,
    },

    indoor: {
      type: Boolean,
      default: false,
    },

    pricePerHour: {
      type: Number,
      required: true,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    weeklySchedule: {
      monday: {
        type: DayScheduleSchema,
        default: { enabled: true, open: "09:00", close: "22:00" },
      },
      tuesday: {
        type: DayScheduleSchema,
        default: { enabled: true, open: "09:00", close: "22:00" },
      },
      wednesday: {
        type: DayScheduleSchema,
        default: { enabled: true, open: "09:00", close: "22:00" },
      },
      thursday: {
        type: DayScheduleSchema,
        default: { enabled: true, open: "09:00", close: "22:00" },
      },
      friday: {
        type: DayScheduleSchema,
        default: { enabled: true, open: "09:00", close: "22:00" },
      },
      saturday: {
        type: DayScheduleSchema,
        default: { enabled: true, open: "09:00", close: "22:00" },
      },
      sunday: {
        type: DayScheduleSchema,
        default: { enabled: true, open: "09:00", close: "22:00" },
      },
    },
  },
  { timestamps: true }
);

/* =======================
   EXPORT
======================= */

export default mongoose.models.Campo ||
  mongoose.model<ICampo>("Campo", CampoSchema);
