import { Request, Response } from "express";
import Booking from "../models/Booking";
import Struttura from "../models/Struttura";

/**
 * 📌 CREA PRENOTAZIONE (PLAYER)
 * POST /bookings
 */
export const createBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // dal middleware JWT
    const { strutturaId, date, startTime, endTime } = req.body;

    if (!strutturaId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: "Dati mancanti" });
    }

    // 🔍 controllo struttura
    const struttura = await Struttura.findById(strutturaId);
    if (!struttura || !struttura.isActive) {
      return res.status(404).json({ message: "Struttura non disponibile" });
    }

    // ❌ controllo conflitto orario
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
      user: userId,
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
 * 📌 PRENOTAZIONI DELL’UTENTE LOGGATO (PLAYER)
 * GET /bookings/me
 */
export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.find({ user: userId })
      .populate("struttura", "name location pricePerHour")
      .sort({ date: -1, startTime: -1 });

    return res.json(bookings);
  } catch (err) {
    console.error("getMyBookings error", err);
    return res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 CANCELLA PRENOTAZIONE (PLAYER)
 * DELETE /bookings/:id
 */
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }

    // 🔐 sicurezza: solo il proprietario può cancellare
    if (booking.user.toString() !== userId) {
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
