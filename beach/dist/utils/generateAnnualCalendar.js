"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAnnualCalendarForCampo = void 0;
// utils/generateAnnualCalendar.ts
const campoCalendarDay_1 = __importDefault(require("../models/campoCalendarDay"));
const generateSlot_1 = require("./generateSlot");
const WEEK_MAP = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];
const generateAnnualCalendarForCampo = async (campoId, openingHours, year = new Date().getFullYear()) => {
    const days = [];
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const weekday = WEEK_MAP[d.getDay()];
        const config = openingHours[weekday];
        const date = d.toISOString().split("T")[0];
        days.push({
            campo: campoId,
            date,
            slots: config.enabled
                ? (0, generateSlot_1.generateHalfHourSlots)(config.open, config.close)
                : [],
        });
    }
    await campoCalendarDay_1.default.insertMany(days);
};
exports.generateAnnualCalendarForCampo = generateAnnualCalendarForCampo;
