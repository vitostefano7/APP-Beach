"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
/* =======================
   SUB SCHEMAS
======================= */
const DayScheduleSchema = new mongoose_1.Schema({
    enabled: { type: Boolean, default: true },
    open: { type: String, default: "09:00" },
    close: { type: String, default: "22:00" },
}, { _id: false });
const DurationPriceSchema = new mongoose_1.Schema({
    oneHour: { type: Number, required: true, min: 0 },
    oneHourHalf: { type: Number, required: true, min: 0 },
}, { _id: false });
const TimeSlotPricingSchema = new mongoose_1.Schema({
    start: { type: String, required: true },
    end: { type: String, required: true },
    label: { type: String, required: true },
    prices: { type: DurationPriceSchema, required: true },
    daysOfWeek: {
        type: [Number],
        required: false,
        validate: {
            validator: function (arr) {
                if (!arr || arr.length === 0)
                    return true;
                return arr.every((day) => day >= 0 && day <= 6);
            },
            message: "daysOfWeek deve contenere valori tra 0 (domenica) e 6 (sabato)",
        },
    },
}, { _id: false });
const DatePriceOverrideSchema = new mongoose_1.Schema({
    date: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^\d{4}-\d{2}-\d{2}$/.test(v);
            },
            message: "date deve essere in formato YYYY-MM-DD",
        },
    },
    label: { type: String, required: true },
    prices: { type: DurationPriceSchema, required: true },
}, { _id: false });
const PeriodPriceOverrideSchema = new mongoose_1.Schema({
    startDate: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^\d{4}-\d{2}-\d{2}$/.test(v);
            },
            message: "startDate deve essere in formato YYYY-MM-DD",
        },
    },
    endDate: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^\d{4}-\d{2}-\d{2}$/.test(v);
            },
            message: "endDate deve essere in formato YYYY-MM-DD",
        },
    },
    label: { type: String, required: true },
    prices: { type: DurationPriceSchema, required: true },
}, { _id: false });
const PlayerCountPricingSchema = new mongoose_1.Schema({
    count: { type: Number, required: true, min: 4, max: 8 },
    label: { type: String, required: true },
    prices: { type: DurationPriceSchema, required: true },
}, { _id: false });
const PricingRulesSchema = new mongoose_1.Schema({
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
}, { _id: false });
/* =======================
   MAIN SCHEMA
======================= */
const CampoSchema = new mongoose_1.Schema({
    struttura: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            validator: function (value) {
                const doc = this;
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
                const doc = this;
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
}, { timestamps: true });
/* =======================
   EXPORT
======================= */
exports.default = mongoose_1.default.models.Campo ||
    mongoose_1.default.model("Campo", CampoSchema);
