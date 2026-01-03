"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCalendarSlot = exports.reopenCalendarDay = exports.closeCalendarDay = exports.getCampoCalendarByMonth = void 0;
const Campo_1 = __importDefault(require("../models/Campo"));
const campoCalendarDay_1 = __importDefault(require("../models/campoCalendarDay"));
const Booking_1 = __importDefault(require("../models/Booking"));
/* =====================================================
   COSTANTI & UTILS
===================================================== */
const WEEK_MAP = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];
const DEFAULT_MONTHS_AHEAD = 15;
/**
 * Genera slot ogni 30 minuti
 */
const generateHalfHourSlots = (open, close) => {
    const slots = [];
    let [h, m] = open.split(":").map(Number);
    while (true) {
        const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        if (time >= close)
            break;
        slots.push({ time, enabled: true });
        m += 30;
        if (m >= 60) {
            h++;
            m = 0;
        }
    }
    return slots;
};
/**
 * 🔥 FUNZIONE CHIAVE
 * Garantisce che il calendario esista almeno fino a +N mesi
 */
const ensureCalendarAhead = async (campo, monthsAhead = DEFAULT_MONTHS_AHEAD) => {
    const today = new Date();
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + monthsAhead);
    const lastDay = await campoCalendarDay_1.default.findOne({ campo: campo._id })
        .sort({ date: -1 });
    let startDate = lastDay
        ? new Date(lastDay.date)
        : new Date(today);
    startDate.setDate(startDate.getDate() + 1);
    if (startDate > targetDate)
        return;
    const daysToInsert = [];
    for (let d = new Date(startDate); d <= targetDate; d.setDate(d.getDate() + 1)) {
        const weekday = WEEK_MAP[d.getDay()];
        const schedule = campo.weeklySchedule[weekday];
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        daysToInsert.push({
            campo: campo._id,
            date: dateStr,
            isClosed: !schedule.enabled,
            slots: schedule.enabled
                ? generateHalfHourSlots(schedule.open, schedule.close)
                : [],
        });
    }
    if (daysToInsert.length > 0) {
        await campoCalendarDay_1.default.insertMany(daysToInsert);
        console.log(`📅 Calendar extended for ${campo.name}: +${daysToInsert.length} days`);
    }
};
/* =====================================================
   GET /campi/:id/calendar?month=YYYY-MM
===================================================== */
const getCampoCalendarByMonth = async (req, res) => {
    try {
        const { id } = req.params;
        const { month } = req.query;
        if (!month || typeof month !== "string") {
            return res.status(400).json({ message: "month richiesto (YYYY-MM)" });
        }
        const campo = await Campo_1.default.findById(id);
        if (!campo) {
            return res.status(404).json({ message: "Campo non trovato" });
        }
        // 🔥 GARANTISCE IL FUTURO
        await ensureCalendarAhead(campo);
        const days = await campoCalendarDay_1.default.find({
            campo: id,
            date: { $regex: `^${month}` },
        }).sort({ date: 1 });
        res.json(days);
    }
    catch (err) {
        console.error("❌ getCampoCalendarByMonth error:", err);
        res.status(500).json({ message: "Errore calendario" });
    }
};
exports.getCampoCalendarByMonth = getCampoCalendarByMonth;
/* =====================================================
   DELETE /campi/:campoId/calendar/:date
   Chiude un giorno
===================================================== */
const closeCalendarDay = async (req, res) => {
    try {
        const { campoId, date } = req.params;
        const campo = await Campo_1.default.findById(campoId).populate("struttura");
        if (!campo)
            return res.status(404).json({ message: "Campo non trovato" });
        if (campo.struttura.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: "Non autorizzato" });
        }
        const calendarDay = await campoCalendarDay_1.default.findOne({ campo: campoId, date });
        if (!calendarDay) {
            return res.status(404).json({ message: "Giorno non trovato" });
        }
        const bookings = await Booking_1.default.find({
            campo: campoId,
            date,
            status: "confirmed",
        });
        if (bookings.length > 0) {
            await Booking_1.default.updateMany({ campo: campoId, date, status: "confirmed" }, { $set: { status: "cancelled" } });
        }
        calendarDay.slots = [];
        calendarDay.isClosed = true;
        await calendarDay.save();
        res.json({
            message: "Giorno chiuso",
            cancelledBookings: bookings.length,
            calendarDay,
        });
    }
    catch (err) {
        console.error("❌ closeCalendarDay error:", err);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.closeCalendarDay = closeCalendarDay;
/* =====================================================
   POST /campi/:campoId/calendar/:date/reopen
===================================================== */
const reopenCalendarDay = async (req, res) => {
    try {
        const { campoId, date } = req.params;
        const campo = await Campo_1.default.findById(campoId).populate("struttura");
        if (!campo)
            return res.status(404).json({ message: "Campo non trovato" });
        if (campo.struttura.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: "Non autorizzato" });
        }
        const calendarDay = await campoCalendarDay_1.default.findOne({ campo: campoId, date });
        if (!calendarDay) {
            return res.status(404).json({ message: "Giorno non trovato" });
        }
        const weekday = WEEK_MAP[new Date(date).getDay()];
        const schedule = campo.weeklySchedule[weekday];
        calendarDay.slots = schedule.enabled
            ? generateHalfHourSlots(schedule.open, schedule.close)
            : [];
        calendarDay.isClosed = false;
        await calendarDay.save();
        res.json(calendarDay);
    }
    catch (err) {
        console.error("❌ reopenCalendarDay error:", err);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.reopenCalendarDay = reopenCalendarDay;
/* =====================================================
   PUT /campi/:campoId/calendar/:date/slot
===================================================== */
const updateCalendarSlot = async (req, res) => {
    try {
        const { campoId, date } = req.params;
        const { time, enabled } = req.body;
        const campo = await Campo_1.default.findById(campoId).populate("struttura");
        if (!campo)
            return res.status(404).json({ message: "Campo non trovato" });
        if (campo.struttura.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: "Non autorizzato" });
        }
        const calendarDay = await campoCalendarDay_1.default.findOne({ campo: campoId, date });
        if (!calendarDay) {
            return res.status(404).json({ message: "Giorno non trovato" });
        }
        const slot = calendarDay.slots.find((s) => s.time === time);
        if (!slot) {
            return res.status(404).json({ message: "Slot non trovato" });
        }
        if (enabled === false) {
            await Booking_1.default.updateMany({
                campo: campoId,
                date,
                startTime: time,
                status: "confirmed",
            }, { $set: { status: "cancelled" } });
        }
        slot.enabled = enabled;
        await calendarDay.save();
        res.json(calendarDay);
    }
    catch (err) {
        console.error("❌ updateCalendarSlot error:", err);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.updateCalendarSlot = updateCalendarSlot;
