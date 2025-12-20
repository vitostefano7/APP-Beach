import { Response } from "express";
import Booking from "../models/Booking";
import Campo from "../models/Campo";
import { AuthRequest } from "../middleware/authMiddleware";

/* =====================================================
   PLAYER
===================================================== */

/**
 * 📌 CREA PRENOTAZIONE
 * POST /bookings
 */
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { campoId, date, startTime, endTime } = req.body;

    if (!campoId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: "Dati mancanti" });
    }

    if (user.role === "owner") {
      return res
        .status(403)
        .json({ message: "Un owner non può prenotare" });
    }

    /* 🔍 campo */
    const campo = await Campo.findById(campoId).populate("struttura");

    if (!campo || !campo.isActive) {
      return res.status(404).json({ message: "Campo non disponibile" });
    }

    /* ❌ conflitto orario */
    const conflict = await Booking.findOne({
      campo: campoId,
      date,
      startTime,
      status: "confirmed",
    });

    if (conflict) {
      return res.status(400).json({ message: "Orario già prenotato" });
    }

    /* ✅ crea booking */
    const booking = await Booking.create({
      user: user.id,
      campo: campoId,
      date,
      startTime,
      endTime,
      price: campo.pricePerHour,
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error("❌ createBooking error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 PRENOTAZIONI DEL PLAYER
 * GET /bookings/me
 */
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find({ user: req.user!.id })
      .populate({
        path: "campo",
        populate: {
          path: "struttura",
          select: "name location images",
        },
      })
      .sort({ date: -1, startTime: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("getMyBookings error", err);
    res.status(500).json({ message: "Errore server" });
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

    res.json({ message: "Prenotazione cancellata" });
  } catch (err) {
    console.error("❌ cancelBooking error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/* =====================================================
   OWNER
===================================================== */

/**
 * 📌 PRENOTAZIONI RICEVUTE DALL’OWNER
 * GET /bookings/owner
 */
export const getOwnerBookings = async (req: AuthRequest, res: Response) => {
  try {
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

    /* ❗ rimuove booking non dell’owner */
    const filtered = bookings.filter(
      b => (b as any).campo?.struttura
    );

    res.json(filtered);
  } catch (err) {
    console.error("❌ getOwnerBookings error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};
