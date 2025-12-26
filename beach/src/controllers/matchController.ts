import { Response } from "express";
import mongoose from "mongoose";
import Match from "../models/Match";
import Booking from "../models/Booking";
import { AuthRequest } from "../middleware/authMiddleware";

/**
 * 📌 CREA MATCH DA PRENOTAZIONE
 * POST /matches/from-booking/:bookingId
 * Body: { sets: [{ teamA, teamB }] }
 */
export const createMatchFromBooking = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { bookingId } = req.params;
    const { sets } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "ID prenotazione non valido" });
    }

    if (!Array.isArray(sets) || sets.length < 2 || sets.length > 3) {
      return res
        .status(400)
        .json({ message: "Un match deve avere 2 o 3 set" });
    }

    // 🔍 Booking esiste?
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }

    // 🔒 Un solo risultato per booking
    const existing = await Match.findOne({ booking: bookingId });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Risultato già inserito" });
    }

    // 🧮 Calcolo vincitore
    let winsA = 0;
    let winsB = 0;

    sets.forEach((s: any) => {
      if (s.teamA > s.teamB) winsA++;
      if (s.teamB > s.teamA) winsB++;
    });

    if (winsA === winsB) {
      return res
        .status(400)
        .json({ message: "Risultato non valido" });
    }

    const winner: "A" | "B" = winsA > winsB ? "A" : "B";

    // ✅ CREA MATCH (SOLO CAMPI DEL MODEL!)
    const match = await Match.create({
      booking: bookingId,
      score: { sets },
      winner,
    });

    res.status(201).json(match);
  } catch (err) {
    console.error("❌ createMatchFromBooking error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};
