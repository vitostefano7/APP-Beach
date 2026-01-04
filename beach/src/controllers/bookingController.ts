import { Response } from "express";
import mongoose from "mongoose";
import Booking from "../models/Booking";
import Campo from "../models/Campo";
import CampoCalendarDay from "../models/campoCalendarDay";
import Match from "../models/Match";
import { AuthRequest } from "../middleware/authMiddleware";
import { calculatePrice } from "../utils/pricingUtils";

/* =====================================================
   PLAYER
===================================================== */

/**
 * 📌 CREA PRENOTAZIONE
 * POST /bookings
 * Body: { campoId, date, startTime, duration }
 */
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
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
    const campo = await Campo.findById(campoId).populate("struttura");
    if (!campo || !(campo as any).isActive) {
      return res.status(404).json({ message: "Campo non disponibile" });
    }

    // 🔍 Verifica slot disponibile nel calendario
    const calendarDay = await CampoCalendarDay.findOne({
      campo: campoId,
      date,
    });

    if (!calendarDay) {
      return res.status(404).json({ message: "Giorno non trovato nel calendario" });
    }

    const slot = (calendarDay as any).slots.find((s: any) => s.time === startTime);

    if (!slot) {
      return res.status(404).json({ message: "Slot non trovato" });
    }

    if (!slot.enabled) {
      return res.status(400).json({ message: "Slot non disponibile" });
    }

    // ⛔ Verifica conflitto prenotazione
    const conflict = await Booking.findOne({
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

      secondSlot = (calendarDay as any).slots.find((s: any) => s.time === nextSlotTime);

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
      const secondConflict = await Booking.findOne({
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
    const price = calculatePrice(
      (campo as any).pricingRules,
      date,
      startTime,
      duration
    );

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
    const booking = await Booking.create({
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

    // 🆕 Crea automaticamente un Match associato
    const match = await Match.create({
      booking: new mongoose.Types.ObjectId(booking._id),
      createdBy: new mongoose.Types.ObjectId(user.id),
      players: [
        {
          user: new mongoose.Types.ObjectId(user.id),
          status: "confirmed",
          joinedAt: new Date(),
        },
      ],
      maxPlayers: 4, // Default per beach volley 2v2
      isPublic: false,
      status: "draft",
    });

    console.log("✅ Match creato automaticamente:", match._id);

    // Popola i dati per la risposta
    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: "campo",
        populate: {
          path: "struttura",
          select: "name location images",
        },
      })
      .populate("user", "name email");

    res.status(201).json(populatedBooking);
  } catch (err) {
    console.error("❌ createBooking error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 PRENOTAZIONI DEL PLAYER (con hasMatch)
 * GET /bookings/me
 */
// In bookingController.ts - getMyBookings
// bookingController.ts - getMyBookings (VERSIONE CORRETTA)
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    console.log("📋 Caricamento prenotazioni utente:", req.user!.id);

    const bookings = await Booking.find({ user: req.user!.id })
      .populate({
        path: "campo",
        populate: {
          path: "struttura",
          select: "name location images",
        },
      })
      .sort({ date: -1, startTime: -1 });

    // Prende tutti i match collegati
    const matchIds = bookings.map(b => b._id);
    const matches = await Match.find({ booking: { $in: matchIds } })
      .select('booking status players maxPlayers isPublic winner score');

    // Crea una mappa bookingId -> match
    const matchMap = new Map();
    matches.forEach(match => {
      matchMap.set(match.booking.toString(), {
        _id: match._id,
        status: match.status,
        players: match.players,
        maxPlayers: match.maxPlayers,
        isPublic: match.isPublic,
        winner: match.winner,
        sets: match.score?.sets || [],
      });
    });

    const result = bookings.map(booking => {
      const bookingObj = booking.toObject();
      const matchData = matchMap.get(booking._id.toString());
      
      return {
        ...bookingObj,
        hasMatch: !!matchData,
        matchId: matchData?._id,
        match: matchData || null,
      };
    });

    console.log(`✅ ${result.length} prenotazioni trovate`);
    console.log(`✅ Prenotazioni con match: ${result.filter(b => b.hasMatch).length}`);
    
    res.json(result);
  } catch (err) {
    console.error("❌ getMyBookings error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 SINGOLA PRENOTAZIONE
 * GET /bookings/:id
 */
// bookingController.ts - getBookingById (VERSIONE CORRETTA)
// bookingController.ts - getBookingById (AGGIORNA)
export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    console.log('📋 Caricamento prenotazione ID:', id);

    const booking = await Booking.findById(id)
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

    if ((booking as any).user._id.toString() !== req.user!.id) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    // Cerca il match associato
    const match = await Match.findOne({ booking: booking._id })
      .populate("players.user", "name username avatarUrl")
      .populate("createdBy", "name username avatarUrl");

    // Converti tutto in oggetto semplice
    const bookingObj = booking.toObject({ versionKey: false });
    
    // Prepara l'oggetto di risposta
    const responseData: any = {
      ...bookingObj,
    };

    // Se esiste il match, aggiungi i dettagli CONVERTITI IN STRINGHE
    if (match) {
      const matchObj = match.toObject({ versionKey: false });
      
      // Converti tutti gli ObjectId in stringhe
      responseData.matchId = matchObj._id.toString();
      responseData.hasMatch = true;
      responseData.match = {
        _id: matchObj._id.toString(),
        status: matchObj.status,
        players: matchObj.players.map((p: any) => ({
          ...p,
          user: {
            ...p.user,
            _id: p.user._id.toString()
          },
          _id: p._id ? p._id.toString() : undefined
        })),
        maxPlayers: matchObj.maxPlayers,
        isPublic: matchObj.isPublic,
        winner: matchObj.winner,
        sets: matchObj.score?.sets || [],
        createdBy: {
          ...matchObj.createdBy,
          _id: matchObj.createdBy._id.toString()
        },
        booking: matchObj.booking ? matchObj.booking.toString() : undefined,
      };
    } else {
      responseData.hasMatch = false;
      responseData.match = null;
    }

    // Converti anche gli altri ObjectId in stringhe
    responseData._id = responseData._id.toString();
    responseData.user._id = responseData.user._id.toString();
    responseData.campo._id = responseData.campo._id.toString();
    responseData.campo.struttura._id = responseData.campo.struttura._id.toString();

    console.log('✅ Prenotazione caricata con match:', {
      hasMatch: !!match,
      matchId: match?._id.toString(),
      matchStatus: match?.status
    });

    res.json(responseData);
  } catch (err) {
    console.error("❌ getBookingById error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 CANCELLA PRENOTAZIONE
 * DELETE /bookings/:id
 */
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    console.log("🗑️ Cancellazione prenotazione:", req.params.id);

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID non valido" });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }

    if ((booking as any).user.toString() !== req.user!.id) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    if ((booking as any).status === "cancelled") {
      return res.status(400).json({ message: "Prenotazione già cancellata" });
    }

    // Aggiorna status
    (booking as any).status = "cancelled";
    await booking.save();

    // 🔓 Riabilita lo slot nel calendario
    const calendarDay = await CampoCalendarDay.findOne({
      campo: (booking as any).campo,
      date: (booking as any).date,
    });

    if (calendarDay) {
      const slot = (calendarDay as any).slots.find(
        (s: any) => s.time === (booking as any).startTime
      );
      if (slot) {
        slot.enabled = true;

        // Se la prenotazione durava 1.5h, riabilita anche il secondo slot
        const startTime = (booking as any).startTime;
        const endTime = (booking as any).endTime;
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
          const secondSlot = (calendarDay as any).slots.find((s: any) => s.time === nextSlotTime);
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
  } catch (err) {
    console.error("❌ cancelBooking error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/* =====================================================
   OWNER
===================================================== */

/**
 * 📌 PRENOTAZIONI RICEVUTE DALL'OWNER
 * GET /bookings/owner
 */
export const getOwnerBookings = async (req: AuthRequest, res: Response) => {
  try {
    console.log("📋 Caricamento prenotazioni owner:", req.user!.id);

    const ownerId = req.user!.id;

    const bookings = await Booking.find()
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
    const filtered = bookings.filter((b) => (b as any).campo?.struttura);

    console.log(`✅ ${filtered.length} prenotazioni trovate`);
    res.json(filtered);
  } catch (err) {
    console.error("❌ getOwnerBookings error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 PRENOTAZIONI PER UN CAMPO SPECIFICO
 * GET /bookings/campo/:campoId?date=YYYY-MM-DD
 */
export const getBookingsByCampo = async (req: AuthRequest, res: Response) => {
  try {
    const { campoId } = req.params;
    const { date } = req.query;

    if (!mongoose.Types.ObjectId.isValid(campoId)) {
      return res.status(400).json({ message: "ID campo non valido" });
    }

    const query: any = {
      campo: campoId,
      status: "confirmed",
    };

    if (date && typeof date === "string") {
      query.date = date;
    }

    const bookings = await Booking.find(query)
      .populate("user", "name email")
      .sort({ startTime: 1 });

    res.json(bookings);
  } catch (err) {
    console.error("❌ getBookingsByCampo error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 SINGOLA PRENOTAZIONE (OWNER)
 * GET /bookings/owner/:id
 */
export const getOwnerBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ownerId = req.user!.id;

    console.log("📋 Caricamento dettaglio prenotazione owner:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID non valido" });
    }

    const booking = await Booking.findById(id)
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
    const struttura = (booking as any).campo?.struttura;
    if (!struttura || struttura.owner.toString() !== ownerId) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    // Cerca il match associato
    const match = await Match.findOne({ booking: booking._id });

    res.json({
      ...booking.toObject(),
      match: match
        ? {
            winner: match.winner,
            sets: match.score?.sets ?? [],
          }
        : null,
    });
  } catch (err) {
    console.error("❌ getOwnerBookingById error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 CANCELLA PRENOTAZIONE (OWNER)
 * DELETE /bookings/owner/:id
 */
export const cancelOwnerBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ownerId = req.user!.id;

    console.log("🗑️ Owner cancellazione prenotazione:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID non valido" });
    }

    const booking = await Booking.findById(id).populate({
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
    const struttura = (booking as any).campo?.struttura;
    if (!struttura || struttura.owner.toString() !== ownerId) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    if ((booking as any).status === "cancelled") {
      return res.status(400).json({ message: "Prenotazione già cancellata" });
    }

    // Aggiorna status
    (booking as any).status = "cancelled";
    await booking.save();

    // 🔓 Riabilita lo slot nel calendario
    const calendarDay = await CampoCalendarDay.findOne({
      campo: (booking as any).campo._id,
      date: (booking as any).date,
    });

    if (calendarDay) {
      const slot = (calendarDay as any).slots.find(
        (s: any) => s.time === (booking as any).startTime
      );
      if (slot) {
        slot.enabled = true;

        // Se la prenotazione durava 1.5h, riabilita anche il secondo slot
        const startTime = (booking as any).startTime;
        const endTime = (booking as any).endTime;
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
          const secondSlot = (calendarDay as any).slots.find((s: any) => s.time === nextSlotTime);
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
  } catch (err) {
    console.error("❌ cancelOwnerBooking error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};  