import { Response } from "express";
import Booking from "../models/Booking";
import Strutture from "../models/Strutture";
import { AuthRequest } from "../middleware/authMiddleware";

/**
 * 📌 CREA PRENOTAZIONE (PLAYER)
 * POST /bookings
 */
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { strutturaId, date, startTime, endTime } = req.body;

    if (!strutturaId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: "Dati mancanti" });
    }

    // ❌ owner non può prenotare
    if (user.role === "owner") {
      return res
        .status(403)
        .json({ message: "Un owner non può prenotare" });
    }

    // 🔍 controllo struttura
    const struttura = await Strutture.findById(strutturaId);
    if (!struttura || !struttura.isActive) {
      return res.status(404).json({ message: "Struttura non disponibile" });
    }

    // ❌ conflitto orario
    const conflict = await Booking.findOne({
      struttura: strutturaId,
      date,
      startTime,
      status: "confirmed",
    });

    if (conflict) {
      return res.status(400).json({ message: "Orario già prenotato" });
    }

    // ✅ crea booking
    const booking = await Booking.create({
      user: user.id,
      struttura: strutturaId,
      date,
      startTime,
      endTime,
      price: struttura.pricePerHour,
    });

    return res.status(201).json(booking);
  } catch (err) {
    console.error("createBooking error", err);
    return res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 PRENOTAZIONI DELL’UTENTE LOGGATO
 * GET /bookings/me
 */
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find({ user: req.user!.id })
      .populate("struttura", "name location pricePerHour")
      .sort({ date: -1, startTime: -1 });

    return res.json(bookings);
  } catch (err) {
    console.error("getMyBookings error", err);
    return res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 CANCELLA PRENOTAZIONE
 * DELETE /bookings/:id
 */
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }

    if (booking.user.toString() !== req.user!.id) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    booking.status = "cancelled";
    await booking.save();

    return res.json({ message: "Prenotazione cancellata" });
  } catch (err) {
    console.error("cancelBooking error", err);
    return res.status(500).json({ message: "Errore server" });
  }
};
