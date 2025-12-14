import { Request, Response } from "express";
import Booking from "../models/Booking";
import Struttura from "../models/Struttura";

/* ---------------- UTILS ---------------- */

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function hasOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
) {
  return (
    timeToMinutes(startA) < timeToMinutes(endB) &&
    timeToMinutes(endA) > timeToMinutes(startB)
  );
}

/* ---------------- CONTROLLERS ---------------- */

/**
 * 📌 CREA PRENOTAZIONE (SOLO PLAYER)
 * POST /bookings
 */
export const createBooking = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { strutturaId, date, startTime, endTime } = req.body;

    if (!strutturaId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: "Dati mancanti" });
    }

    // ❌ owner non può prenotare
    if (user.role === "owner") {
      return res.status(403).json({
        message: "Un owner non può effettuare prenotazioni",
      });
    }

    const struttura = await Struttura.findById(strutturaId);
    if (!struttura || !struttura.isActive) {
      return res.status(404).json({ message: "Struttura non disponibile" });
    }

    // 🕒 controllo orari apertura
    const weekday = new Date(date)
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    const opening = struttura.openingHours?.[weekday];
    if (!opening) {
      return res.status(400).json({ message: "Struttura chiusa" });
    }

    if (
      timeToMinutes(startTime) < timeToMinutes(opening.open) ||
      timeToMinutes(endTime) > timeToMinutes(opening.close)
    ) {
      return res
        .status(400)
        .json({ message: "Orario fuori apertura" });
    }

    // 🔍 controllo conflitti reali
    const existing = await Booking.find({
      struttura: strutturaId,
      date,
      status: "confirmed",
    });

    const conflict = existing.find(b =>
      hasOverlap(startTime, endTime, b.startTime, b.endTime)
    );

    if (conflict) {
      return res
        .status(400)
        .json({ message: "Orario già prenotato" });
    }

    const durationHours =
      (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60;

    const price = struttura.pricePerHour * durationHours;

    const booking = await Booking.create({
      user: user.id,
      struttura: strutturaId,
      date,
      startTime,
      endTime,
      durationHours,
      price,
    });

    return res.status(201).json(booking);
  } catch (err) {
    console.error("createBooking error", err);
    return res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 PRENOTAZIONI UTENTE
 * GET /bookings/me
 */
export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
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
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Prenotazione non trovata" });
    }

    if (booking.user.toString() !== req.user.id) {
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
