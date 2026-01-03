"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCampoAvailability = void 0;
const Campo_1 = __importDefault(require("../models/Campo"));
const Strutture_1 = __importDefault(require("../models/Strutture"));
const campoCalendarDay_1 = __importDefault(require("../models/campoCalendarDay"));
const WEEK_MAP = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];
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
 * Aggiorna la disponibilità settimanale di un campo
 * e rigenera automaticamente il calendario annuale
 */
const updateCampoAvailability = async (req, res) => {
    try {
        console.log("🧩 updateCampoAvailability", req.params.id);
        console.log("📦 Body:", req.body);
        const { day, enabled, open, close } = req.body;
        // Validazione input
        if (!day || !WEEK_MAP.includes(day)) {
            return res.status(400).json({
                message: "Giorno non valido. Usa: monday, tuesday, etc."
            });
        }
        if (enabled && (!open || !close)) {
            return res.status(400).json({
                message: "Se enabled=true, open e close sono obbligatori"
            });
        }
        // Trova campo e verifica ownership
        const campo = await Campo_1.default.findById(req.params.id);
        if (!campo) {
            return res.status(404).json({ message: "Campo non trovato" });
        }
        const struttura = await Strutture_1.default.findOne({
            _id: campo.struttura,
            owner: req.user.id,
        });
        if (!struttura) {
            return res.status(403).json({ message: "Non autorizzato" });
        }
        // Aggiorna weeklySchedule
        campo.weeklySchedule[day] = {
            enabled: enabled ?? false,
            open: enabled ? open : "09:00",
            close: enabled ? close : "22:00",
        };
        await campo.save();
        console.log(`✅ weeklySchedule.${day} aggiornato`);
        // 🔥 RIGENERA IL CALENDARIO ANNUALE
        await regenerateAnnualCalendar(campo);
        res.json({
            message: "Disponibilità e calendario aggiornati",
            weeklySchedule: campo.weeklySchedule,
        });
    }
    catch (err) {
        console.error("❌ updateCampoAvailability error:", err);
        res.status(500).json({ message: "Errore aggiornamento disponibilità" });
    }
};
exports.updateCampoAvailability = updateCampoAvailability;
/**
 * Rigenera il calendario annuale per l'anno corrente
 * basandosi sul weeklySchedule del campo
 */
async function regenerateAnnualCalendar(campo) {
    const year = new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    console.log(`📅 Rigenerazione calendario per ${campo.name}...`);
    const updates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const weekday = WEEK_MAP[d.getDay()];
        const daySchedule = campo.weeklySchedule[weekday];
        const date = d.toISOString().split("T")[0];
        const slots = daySchedule.enabled
            ? generateHalfHourSlots(daySchedule.open, daySchedule.close)
            : [];
        updates.push({
            updateOne: {
                filter: { campo: campo._id, date },
                update: { $set: { slots } },
                upsert: true,
            },
        });
    }
    await campoCalendarDay_1.default.bulkWrite(updates);
    console.log(`✅ Calendario aggiornato: ${updates.length} giorni`);
}
