"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMatchFromBooking = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Match_1 = __importDefault(require("../models/Match"));
const Booking_1 = __importDefault(require("../models/Booking"));
/**
 * 📌 CREA MATCH DA PRENOTAZIONE
 * POST /matches/from-booking/:bookingId
 * Body: { sets: [{ teamA, teamB }] }
 */
const createMatchFromBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { sets } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: "ID prenotazione non valido" });
        }
        if (!Array.isArray(sets) || sets.length < 2 || sets.length > 3) {
            return res
                .status(400)
                .json({ message: "Un match deve avere 2 o 3 set" });
        }
        // 🔍 Booking esiste?
        const booking = await Booking_1.default.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Prenotazione non trovata" });
        }
        // 🔒 Un solo risultato per booking
        const existing = await Match_1.default.findOne({ booking: bookingId });
        if (existing) {
            return res
                .status(400)
                .json({ message: "Risultato già inserito" });
        }
        // 🧮 Calcolo vincitore
        let winsA = 0;
        let winsB = 0;
        sets.forEach((s) => {
            if (s.teamA > s.teamB)
                winsA++;
            if (s.teamB > s.teamA)
                winsB++;
        });
        if (winsA === winsB) {
            return res
                .status(400)
                .json({ message: "Risultato non valido" });
        }
        const winner = winsA > winsB ? "A" : "B";
        // ✅ CREA MATCH (SOLO CAMPI DEL MODEL!)
        const match = await Match_1.default.create({
            booking: bookingId,
            score: { sets },
            winner,
        });
        res.status(201).json(match);
    }
    catch (err) {
        console.error("❌ createMatchFromBooking error:", err);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.createMatchFromBooking = createMatchFromBooking;
