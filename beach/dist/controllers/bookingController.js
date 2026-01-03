"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOwnerBooking = exports.getOwnerBookingById = exports.getBookingsByCampo = exports.getOwnerBookings = exports.cancelBooking = exports.getBookingById = exports.getMyBookings = exports.createBooking = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Booking_1 = __importDefault(require("../models/Booking"));
const Campo_1 = __importDefault(require("../models/Campo"));
const campoCalendarDay_1 = __importDefault(require("../models/campoCalendarDay"));
const Match_1 = __importDefault(require("../models/Match"));
const pricingUtils_1 = require("../utils/pricingUtils");
/* =====================================================
   PLAYER
===================================================== */
/**
 * 📌 CREA PRENOTAZIONE
 * POST /bookings
 * Body: { campoId, date, startTime, duration }
 */
const createBooking = async (req, res) => {
    try {
        const user = req.user;
        const { campoId, date, startTime, duration = "1h" } = req.body;
        console.log("🏐 Nuova prenotazione:", {
            campoId,
            date,
            startTime,
            duration,
            userId: user?.id,
        });
        if (!campoId || !date || !startTime) {
            return res
                .status(400)
                .json({ message: "Dati mancanti: campoId, date, startTime richiesti" });
        }
        // Valida duration
        if (duration !== "1h" && duration !== "1.5h") {
            return res
                .status(400)
                .json({ message: "Duration non valida: ammessi solo '1h' o '1.5h'" });
        }
        if (user.role === "owner") {
            return res.status(403).json({ message: "Un owner non può prenotare" });
        }
        // 🔍 Verifica campo
        const campo = await Campo_1.default.findById(campoId).populate("struttura");
        if (!campo || !campo.isActive) {
            return res.status(404).json({ message: "Campo non disponibile" });
        }
        // 🔍 Verifica slot disponibile nel calendario
        const calendarDay = await campoCalendarDay_1.default.findOne({
            campo: campoId,
            date,
        });
        if (!calendarDay) {
            return res.status(404).json({ message: "Giorno non trovato nel calendario" });
        }
        const slot = calendarDay.slots.find((s) => s.time === startTime);
        if (!slot) {
            return res.status(404).json({ message: "Slot non trovato" });
        }
        if (!slot.enabled) {
            return res.status(400).json({ message: "Slot non disponibile" });
        }
        // ⛔ Verifica conflitto prenotazione
        const conflict = await Booking_1.default.findOne({
            campo: campoId,
            date,
            startTime,
            status: "confirmed",
        });
        if (conflict) {
            return res.status(400).json({ message: "Orario già prenotato" });
        }
        // 🔍 Se durata è 1.5h, verifica che anche il secondo slot sia disponibile
        let secondSlot = null;
        if (duration === "1.5h") {
            const [h, m] = startTime.split(":").map(Number);
            let nextH = h;
            let nextM = m + 30;
            if (nextM >= 60) {
                nextH++;
                nextM = 0;
            }
            const nextSlotTime = `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`;
            secondSlot = calendarDay.slots.find((s) => s.time === nextSlotTime);
            if (!secondSlot) {
                return res.status(400).json({
                    message: "Slot successivo non trovato per prenotazione da 1.5h",
                });
            }
            if (!secondSlot.enabled) {
                return res.status(400).json({
                    message: "Slot successivo non disponibile per prenotazione da 1.5h",
                });
            }
            // Verifica conflitto anche sul secondo slot
            const secondConflict = await Booking_1.default.findOne({
                campo: campoId,
                date,
                startTime: nextSlotTime,
                status: "confirmed",
            });
            if (secondConflict) {
                return res.status(400).json({
                    message: "Slot successivo già prenotato",
                });
            }
        }
        // 💰 Calcola prezzo usando il sistema deterministico
        const price = (0, pricingUtils_1.calculatePrice)(campo.pricingRules, date, startTime, duration);
        console.log(`💰 Prezzo calcolato: €${price} (${duration})`);
        // Calcola endTime
        const durationMinutes = duration === "1h" ? 60 : 90;
        const [h, m] = String(startTime).split(":").map(Number);
        let endH = h;
        let endM = m + durationMinutes;
        if (endM >= 60) {
            endH += Math.floor(endM / 60);
            endM = endM % 60;
        }
        const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
        // ✅ Crea booking
        const booking = await Booking_1.default.create({
            user: user.id,
            campo: campoId,
            date,
            startTime,
            endTime,
            price,
            status: "confirmed",
        });
        // 🔒 Disabilita lo slot nel calendario
        slot.enabled = false;
        if (secondSlot) {
            secondSlot.enabled = false;
        }
        await calendarDay.save();
        console.log("✅ Prenotazione creata:", booking._id);
        // Popola i dati per la risposta
        const populatedBooking = await Booking_1.default.findById(booking._id)
            .populate({
            path: "campo",
            populate: {
                path: "struttura",
                select: "name location images",
            },
        })
            .populate("user", "name email");
        res.status(201).json(populatedBooking);
    }
    catch (err) {
        console.error("❌ createBooking error:", err);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.createBooking = createBooking;
/**
 * 📌 PRENOTAZIONI DEL PLAYER (con hasMatch)
 * GET /bookings/me
 */
const getMyBookings = async (req, res) => {
    try {
        console.log("📋 Caricamento prenotazioni utente:", req.user.id);
        const bookings = await Booking_1.default.find({ user: req.user.id })
            .populate({
            path: "campo",
            populate: {
                path: "struttura",
                select: "name location images",
            },
        })
            .sort({ date: -1, startTime: -1 });
        // ✅ prende tutte le match collegate a queste booking
        const matches = await Match_1.default.find({
            booking: { $in: bookings.map((b) => b._id) },
        }).select("booking");
        const matchMap = new Set(matches.map((m) => m.booking.toString()));
        const result = bookings.map((b) => ({
            ...b.toObject(),
            hasMatch: matchMap.has(b._id.toString()),
        }));
        console.log(`✅ ${result.length} prenotazioni trovate`);
        res.json(result);
    }
    catch (err) {
        console.error("❌ getMyBookings error:", err);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.getMyBookings = getMyBookings;
/**
 * 📌 SINGOLA PRENOTAZIONE
 * GET /bookings/:id
 */
const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking_1.default.findById(id)
            .populate({
            path: "campo",
            populate: {
                path: "struttura",
                select: "name location images",
            },
        })
            .populate("user", "name email");
        if (!booking) {
            return res.status(404).json({ message: "Prenotazione non trovata" });
        }
        if (booking.user._id.toString() !== req.user.id) {
            return res.status(403).json({ message: "Non autorizzato" });
        }
        const match = await Match_1.default.findOne({ booking: booking._id });
        res.json({
            ...booking.toObject(),
            match: match
                ? {
                    winner: match.winner,
                    sets: match.score?.sets ?? [],
                }
                : null,
        });
    }
    catch (err) {
        console.error("❌ getBookingById error:", err);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.getBookingById = getBookingById;
/**
 * 📌 CANCELLA PRENOTAZIONE
 * DELETE /bookings/:id
 */
const cancelBooking = async (req, res) => {
    try {
        console.log("🗑️ Cancellazione prenotazione:", req.params.id);
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID non valido" });
        }
        const booking = await Booking_1.default.findById(id);
        if (!booking) {
            return res.status(404).json({ message: "Prenotazione non trovata" });
        }
        if (booking.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Non autorizzato" });
        }
        if (booking.status === "cancelled") {
            return res.status(400).json({ message: "Prenotazione già cancellata" });
        }
        // Aggiorna status
        booking.status = "cancelled";
        await booking.save();
        // 🔓 Riabilita lo slot nel calendario
        const calendarDay = await campoCalendarDay_1.default.findOne({
            campo: booking.campo,
            date: booking.date,
        });
        if (calendarDay) {
            const slot = calendarDay.slots.find((s) => s.time === booking.startTime);
            if (slot) {
                slot.enabled = true;
                // Se la prenotazione durava 1.5h, riabilita anche il secondo slot
                const startTime = booking.startTime;
                const endTime = booking.endTime;
                const [startH, startM] = startTime.split(":").map(Number);
                const [endH, endM] = endTime.split(":").map(Number);
                const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
                if (durationMinutes === 90) {
                    let nextH = startH;
                    let nextM = startM + 30;
                    if (nextM >= 60) {
                        nextH++;
                        nextM = 0;
                    }
                    const nextSlotTime = `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`;
                    const secondSlot = calendarDay.slots.find((s) => s.time === nextSlotTime);
                    if (secondSlot) {
                        secondSlot.enabled = true;
                    }
                }
                await calendarDay.save();
                console.log("✅ Slot riabilitato nel calendario");
            }
        }
        console.log("✅ Prenotazione cancellata");
        res.json({ message: "Prenotazione cancellata con successo" });
    }
    catch (err) {
        console.error("❌ cancelBooking error:", err);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.cancelBooking = cancelBooking;
/* =====================================================
   OWNER
===================================================== */
/**
 * 📌 PRENOTAZIONI RICEVUTE DALL'OWNER
 * GET /bookings/owner
 */
const getOwnerBookings = async (req, res) => {
    try {
        console.log("📋 Caricamento prenotazioni owner:", req.user.id);
        const ownerId = req.user.id;
        const bookings = await Booking_1.default.find()
            .populate({
            path: "campo",
            populate: {
                path: "struttura",
                match: { owner: ownerId },
                select: "name location",
            },
        })
            .populate("user", "name email")
            .sort({ date: 1, startTime: 1 });
        // Rimuove booking non dell'owner
        const filtered = bookings.filter((b) => b.campo?.struttura);
        console.log(`✅ ${filtered.length} prenotazioni trovate`);
        res.json(filtered);
    }
    catch (err) {
        console.error("❌ getOwnerBookings error:", err);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.getOwnerBookings = getOwnerBookings;
/**
 * 📌 PRENOTAZIONI PER UN CAMPO SPECIFICO
 * GET /bookings/campo/:campoId?date=YYYY-MM-DD
 */
const getBookingsByCampo = async (req, res) => {
    try {
        const { campoId } = req.params;
        const { date } = req.query;
        if (!mongoose_1.default.Types.ObjectId.isValid(campoId)) {
            return res.status(400).json({ message: "ID campo non valido" });
        }
        const query = {
            campo: campoId,
            status: "confirmed",
        };
        if (date && typeof date === "string") {
            query.date = date;
        }
        const bookings = await Booking_1.default.find(query)
            .populate("user", "name email")
            .sort({ startTime: 1 });
        res.json(bookings);
    }
    catch (err) {
        console.error("❌ getBookingsByCampo error:", err);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.getBookingsByCampo = getBookingsByCampo;
/**
 * 📌 SINGOLA PRENOTAZIONE (OWNER)
 * GET /bookings/owner/:id
 */
const getOwnerBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = req.user.id;
        console.log("📋 Caricamento dettaglio prenotazione owner:", id);
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID non valido" });
        }
        const booking = await Booking_1.default.findById(id)
            .populate({
            path: "campo",
            populate: {
                path: "struttura",
                select: "name location images owner",
            },
        })
            .populate("user", "name email");
        if (!booking) {
            return res.status(404).json({ message: "Prenotazione non trovata" });
        }
        // Verifica che l'owner sia proprietario della struttura
        const struttura = booking.campo?.struttura;
        if (!struttura || struttura.owner.toString() !== ownerId) {
            return res.status(403).json({ message: "Non autorizzato" });
        }
        // Cerca il match associato
        const match = await Match_1.default.findOne({ booking: booking._id });
        res.json({
            ...booking.toObject(),
            match: match
                ? {
                    winner: match.winner,
                    sets: match.score?.sets ?? [],
                }
                : null,
        });
    }
    catch (err) {
        console.error("❌ getOwnerBookingById error:", err);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.getOwnerBookingById = getOwnerBookingById;
/**
 * 📌 CANCELLA PRENOTAZIONE (OWNER)
 * DELETE /bookings/owner/:id
 */
const cancelOwnerBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = req.user.id;
        console.log("🗑️ Owner cancellazione prenotazione:", id);
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID non valido" });
        }
        const booking = await Booking_1.default.findById(id).populate({
            path: "campo",
            populate: {
                path: "struttura",
                select: "owner name",
            },
        });
        if (!booking) {
            return res.status(404).json({ message: "Prenotazione non trovata" });
        }
        // Verifica che l'owner sia proprietario della struttura
        const struttura = booking.campo?.struttura;
        if (!struttura || struttura.owner.toString() !== ownerId) {
            return res.status(403).json({ message: "Non autorizzato" });
        }
        if (booking.status === "cancelled") {
            return res.status(400).json({ message: "Prenotazione già cancellata" });
        }
        // Aggiorna status
        booking.status = "cancelled";
        await booking.save();
        // 🔓 Riabilita lo slot nel calendario
        const calendarDay = await campoCalendarDay_1.default.findOne({
            campo: booking.campo._id,
            date: booking.date,
        });
        if (calendarDay) {
            const slot = calendarDay.slots.find((s) => s.time === booking.startTime);
            if (slot) {
                slot.enabled = true;
                // Se la prenotazione durava 1.5h, riabilita anche il secondo slot
                const startTime = booking.startTime;
                const endTime = booking.endTime;
                const [startH, startM] = startTime.split(":").map(Number);
                const [endH, endM] = endTime.split(":").map(Number);
                const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
                if (durationMinutes === 90) {
                    let nextH = startH;
                    let nextM = startM + 30;
                    if (nextM >= 60) {
                        nextH++;
                        nextM = 0;
                    }
                    const nextSlotTime = `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`;
                    const secondSlot = calendarDay.slots.find((s) => s.time === nextSlotTime);
                    if (secondSlot) {
                        secondSlot.enabled = true;
                    }
                }
                await calendarDay.save();
                console.log("✅ Slot riabilitato nel calendario");
            }
        }
        console.log("✅ Prenotazione cancellata dall'owner");
        res.json({ message: "Prenotazione cancellata con successo" });
    }
    catch (err) {
        console.error("❌ cancelOwnerBooking error:", err);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.cancelOwnerBooking = cancelOwnerBooking;
