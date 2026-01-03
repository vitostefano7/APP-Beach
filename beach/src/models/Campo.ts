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

/**
 * Fascia oraria con supporto per giorni specifici
 * - Se daysOfWeek è undefined/null → fascia generica (valida tutti i giorni)
 * - Se daysOfWeek è definito → fascia specifica per quei giorni (priorità maggiore)
 */
export interface TimeSlotPricing {
  start: string; // es. "09:00"
  end: string; // es. "18:00"
  label: string; // es. "Mattina", "Sera lunedì"
  prices: DurationPrice;
  daysOfWeek?: number[]; // 0=dom, 1=lun, ..., 6=sab (opzionale)
}

/**
 * Override di prezzo per una data specifica
 * Priorità massima: sovrascrive tutto
 */
export interface DatePriceOverride {
  date: string; // formato YYYY-MM-DD
  label: string; // es. "Capodanno", "Ferragosto"
  prices: DurationPrice;
}

/**
 * Override di prezzo per un periodo
 * Priorità massima: sovrascrive tutto
 */
export interface PeriodPriceOverride {
  startDate: string; // formato YYYY-MM-DD
  endDate: string; // formato YYYY-MM-DD
  label: string; // es. "Natale", "Estate"
  prices: DurationPrice;
}

export interface PlayerCountPricing {
  count: number;
  label: string;
  prices: DurationPrice;
}

export interface PricingRules {
  // Modalità: flat o advanced
  mode: "flat" | "advanced";

  // FLAT MODE - Prezzi fissi per durata (livello 5 - priorità minima)
  flatPrices: DurationPrice;

  // ADVANCED MODE - Prezzi base (livello 4)
  basePrices: DurationPrice;

  // Fasce orarie (livello 2 e 3)
  // - Con daysOfWeek definito = livello 2 (priorità alta)
  // - Senza daysOfWeek = livello 3 (priorità media)
  timeSlotPricing: {
    enabled: boolean;
    slots: TimeSlotPricing[];
  };

  // Override per date specifiche (livello 1 - priorità massima)
  dateOverrides: {
    enabled: boolean;
    dates: DatePriceOverride[];
  };

  // Override per periodi (livello 1 - priorità massima)
  periodOverrides: {
    enabled: boolean;
    periods: PeriodPriceOverride[];
  };

  // Prezzi per numero giocatori (solo beach volley)
  // Nota: non fa parte della gerarchia principale, è un layer aggiuntivo
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
    daysOfWeek: {
      type: [Number],
      required: false,
      validate: {
        validator: function (arr: number[]) {
          if (!arr || arr.length === 0) return true;
          return arr.every((day) => day >= 0 && day <= 6);
        },
        message: "daysOfWeek deve contenere valori tra 0 (domenica) e 6 (sabato)",
      },
    },
  },
  { _id: false }
);

const DatePriceOverrideSchema = new Schema<DatePriceOverride>(
  {
    date: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^\d{4}-\d{2}-\d{2}$/.test(v);
        },
        message: "date deve essere in formato YYYY-MM-DD",
      },
    },
    label: { type: String, required: true },
    prices: { type: DurationPriceSchema, required: true },
  },
  { _id: false }
);

const PeriodPriceOverrideSchema = new Schema<PeriodPriceOverride>(
  {
    startDate: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^\d{4}-\d{2}-\d{2}$/.test(v);
        },
        message: "startDate deve essere in formato YYYY-MM-DD",
      },
    },
    endDate: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^\d{4}-\d{2}-\d{2}$/.test(v);
        },
        message: "endDate deve essere in formato YYYY-MM-DD",
      },
    },
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

    dateOverrides: {
      enabled: { type: Boolean, default: false },
      dates: {
        type: [DatePriceOverrideSchema],
        default: [],
      },
    },

    periodOverrides: {
      enabled: { type: Boolean, default: false },
      periods: {
        type: [PeriodPriceOverrideSchema],
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

    // ✅ CORREZIONE: Rimossa la funzione default() che sovrascriveva i pricingRules
    // Ora usa i valori inviati dal frontend, oppure i default del PricingRulesSchema
    pricingRules: {
      type: PricingRulesSchema,
      required: true,
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