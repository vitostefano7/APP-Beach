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

export interface DurationPrice {
  oneHour: number;
  oneHourHalf: number;
}

export interface TimeSlotPricing {
  start: string;
  end: string;
  label: string; // es. "Mattina", "Sera", "Peak"
  prices: DurationPrice; // prezzi specifici per questa fascia
}

export interface PlayerCountPricing {
  count: number; // numero di giocatori (es. 4, 6, 8)
  label: string; // es. "4 giocatori", "6 giocatori"
  prices: DurationPrice; // prezzi specifici per questo numero
}

export interface PricingRules {
  // Modalità: flat o advanced
  mode: "flat" | "advanced"; // "flat" = prezzi fissi, "advanced" = prezzi variabili

  // FLAT MODE - Prezzi fissi per durata
  flatPrices: DurationPrice;

  // ADVANCED MODE - Prezzi base (usati quando altre regole non sono attive)
  basePrices: DurationPrice;

  // Fasce orarie (opzionale)
  timeSlotPricing: {
    enabled: boolean;
    slots: TimeSlotPricing[];
  };

  // Prezzi per numero giocatori (opzionale, solo beach volley)
  playerCountPricing: {
    enabled: boolean;
    prices: PlayerCountPricing[];
  };
}

export interface ICampo extends Document {
  struttura: mongoose.Types.ObjectId;
  name: string;
  sport: "beach_volley" | "volley";
  surface: "sand" | "cement" | "pvc";
  maxPlayers: number;
  indoor: boolean;
  pricePerHour: number; // DEPRECATO - manteniamo per retrocompatibilità
  isActive: boolean;
  pricingRules: PricingRules;
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

const DurationPriceSchema = new Schema<DurationPrice>(
  {
    oneHour: { type: Number, required: true, min: 0 },
    oneHourHalf: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const TimeSlotPricingSchema = new Schema<TimeSlotPricing>(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
    label: { type: String, required: true },
    prices: { type: DurationPriceSchema, required: true },
  },
  { _id: false }
);

const PlayerCountPricingSchema = new Schema<PlayerCountPricing>(
  {
    count: { type: Number, required: true, min: 4, max: 8 },
    label: { type: String, required: true },
    prices: { type: DurationPriceSchema, required: true },
  },
  { _id: false }
);

const PricingRulesSchema = new Schema<PricingRules>(
  {
    mode: {
      type: String,
      enum: ["flat", "advanced"],
      default: "flat",
    },

    flatPrices: {
      type: DurationPriceSchema,
      required: true,
      default: { oneHour: 20, oneHourHalf: 28 },
    },

    basePrices: {
      type: DurationPriceSchema,
      required: true,
      default: { oneHour: 20, oneHourHalf: 28 },
    },

    timeSlotPricing: {
      enabled: { type: Boolean, default: false },
      slots: {
        type: [TimeSlotPricingSchema],
        default: [],
      },
    },

    playerCountPricing: {
      enabled: { type: Boolean, default: false },
      prices: {
        type: [PlayerCountPricingSchema],
        default: [],
      },
    },
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

          if (doc.sport === "beach_volley") {
            return value === "sand";
          }

          if (doc.sport === "volley" && doc.indoor) {
            return value === "pvc";
          }

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

    // 🆕 NUOVO SISTEMA DI PRICING
    pricingRules: {
      type: PricingRulesSchema,
      default: function () {
        const doc = this as any;
        const basePrice = doc.pricePerHour || 20;
        const halfPrice = basePrice * 1.4;

        return {
          mode: "flat",
          flatPrices: {
            oneHour: basePrice,
            oneHourHalf: halfPrice,
          },
          basePrices: {
            oneHour: basePrice,
            oneHourHalf: halfPrice,
          },
          timeSlotPricing: {
            enabled: false,
            slots: [],
          },
          playerCountPricing: {
            enabled: false,
            prices: [],
          },
        };
      },
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