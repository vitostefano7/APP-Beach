import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/authMiddleware";
import Strutture from "../models/Strutture";
import Booking from "../models/Booking";
import Match from "../models/Match";
import Campo from "../models/Campo";

/**
 * CREA STRUTTURA
 */
export const createStruttura = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;

    const struttura = await Strutture.create({
      ...req.body,
      owner: new mongoose.Types.ObjectId(ownerId),
      location: {
        ...req.body.location,
        coordinates: [
          req.body.location.lng,
          req.body.location.lat,
        ],
      },
    });

    res.status(201).json(struttura);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore creazione struttura" });
  }
};

/**
 * STRUTTURE OWNER
 */
export const getMyStrutture = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;

    const strutture = await Strutture.find({
      owner: new mongoose.Types.ObjectId(ownerId),
      isDeleted: false,
    });

    res.json(strutture);
  } catch (err) {
    res.status(500).json({ message: "Errore" });
  }
};

/**
 * UPDATE STRUTTURA
 */
export const updateStruttura = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;

    const struttura = await Strutture.findOne({
      _id: id,
      owner: new mongoose.Types.ObjectId(ownerId),
    });

    if (!struttura) {
      return res.status(404).json({ message: "Struttura non trovata" });
    }

    Object.assign(struttura, req.body);

    if (req.body.location?.lat && req.body.location?.lng) {
      struttura.location.coordinates = [
        req.body.location.lng,
        req.body.location.lat,
      ];
    }

    await struttura.save();
    res.json(struttura);
  } catch (err) {
    res.status(500).json({ message: "Errore update" });
  }
};

/**
 * PRENOTAZIONI OWNER
 */
export const getOwnerBookings = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const { campoId, month, strutturaId, date } = req.query;

    console.log("📋 getOwnerBookings chiamato:", { campoId, month, strutturaId, date });

    // ✅ Trova le strutture dell'owner
    const strutture = await Strutture.find({
      owner: new mongoose.Types.ObjectId(ownerId),
    }).select("_id");

    const struttureIds = strutture.map(s => s._id);
    console.log("🏢 Strutture owner:", struttureIds.length);

    // ✅ Costruisci filtro dinamico
    const filter: any = {
      status: "confirmed",
    };

    // Filtra per campo specifico (questo è il filtro più importante per noi)
    if (campoId) {
      filter.campo = new mongoose.Types.ObjectId(campoId as string);
      console.log("🎯 Filtro per campo:", campoId);
    } else if (strutturaId) {
      // Filtra per struttura specifica
      filter.struttura = new mongoose.Types.ObjectId(strutturaId as string);
    } else {
      // Altrimenti filtra per tutte le strutture dell'owner
      filter.struttura = { $in: struttureIds };
    }

    // Filtra per data specifica (YYYY-MM-DD)
    if (date && typeof date === "string") {
      filter.date = date;
      console.log("📅 Filtro per data:", date);
    }
    // Filtra per mese (YYYY-MM)
    else if (month && typeof month === "string") {
      const [year, monthNum] = month.split("-").map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
      
      filter.date = {
        $gte: startDate.toISOString().split("T")[0],
        $lte: endDate.toISOString().split("T")[0],
      };
      console.log("📅 Filtro per mese:", month);
    }

    console.log("🔍 Filtro finale:", JSON.stringify(filter, null, 2));

    const bookings = await Booking.find(filter)
      .populate("user", "name surname email phone")
      .populate("campo", "name")
      .populate("struttura", "name location")
      .sort({ date: 1, startTime: 1 });

    console.log(`✅ Prenotazioni trovate: ${bookings.length}`);
    if (bookings.length > 0) {
      console.log("📋 Prima prenotazione:", {
        date: bookings[0].date,
        startTime: (bookings[0] as any).startTime,
        user: (bookings[0] as any).user?.name,
      });
    }

    // ✅ Formatta risposta con dati user accessibili
    const formattedBookings = bookings.map((b: any) => ({
      _id: b._id,
      userId: b.user?._id,
      userName: b.user?.name || "N/A",
      userSurname: b.user?.surname || "",
      userPhone: b.user?.phone,
      userEmail: b.user?.email,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      duration: b.duration || 1,
      totalPrice: b.price,
      status: b.status,
      campo: b.campo,
      struttura: b.struttura,
      createdAt: b.createdAt,
    }));

    res.json(formattedBookings);
  } catch (err) {
    console.error("❌ Errore getOwnerBookings:", err);
    res.status(500).json({ message: "Errore bookings" });
  }
};

/**
 * GET /owner/matches
 * Ottiene i match delle strutture del proprietario
 */
export const getOwnerMatches = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const { status } = req.query;

    console.log("🏐 [getOwnerMatches] Richiesta per owner:", ownerId);

    // Trova le strutture dell'owner
    const strutture = await Strutture.find({
      owner: new mongoose.Types.ObjectId(ownerId),
    }).select("_id");

    const struttureIds = strutture.map(s => s._id);
    console.log("🏢 [getOwnerMatches] Strutture owner:", struttureIds.length);

    // Trova tutti i campi delle strutture dell'owner
    const campi = await Campo.find({
      struttura: { $in: struttureIds },
    }).select("_id");

    const campiIds = campi.map(c => c._id);
    console.log("⚽ [getOwnerMatches] Campi owner:", campiIds.length);

    // Trova booking dei campi dell'owner con data >= oggi
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const bookings = await Booking.find({
      campo: { $in: campiIds },
      date: { $gte: todayStr },
    }).select("_id");

    const bookingIds = bookings.map(b => b._id);
    console.log("📋 [getOwnerMatches] Booking owner futuri:", bookingIds.length);

    // Costruisci filtro per i match
    const filter: any = {
      booking: { $in: bookingIds },
    };

    if (status) {
      filter.status = status;
    }

    // Trova i match
    const matches = await Match.find(filter)
      .populate("players.user", "username name surname avatarUrl")
      .populate("createdBy", "username name surname avatarUrl")
      .populate({
        path: "booking",
        populate: [
          {
            path: "campo",
            select: "name sport",
            populate: {
              path: "struttura",
              select: "name location",
            },
          },
          {
            path: "user",
            select: "name surname",
          },
        ],
      })
      .sort({ createdAt: -1 });

    // Filtra match con booking valido e campo/struttura popolati
    const validMatches = matches.filter(m => {
      if (!m.booking) {
        console.log("⚠️ Match senza booking:", m._id);
        return false;
      }
      const booking = m.booking as any;
      if (!booking.campo) {
        console.log("⚠️ Booking senza campo:", booking._id);
        return false;
      }
      if (!booking.campo.struttura) {
        console.log("⚠️ Campo senza struttura:", booking.campo._id);
        return false;
      }
      return true;
    });

    // Ordina per data e ora
    validMatches.sort((a, b) => {
      const bookingA = a.booking as any;
      const bookingB = b.booking as any;
      const dateA = new Date(`${bookingA.date}T${bookingA.startTime}`);
      const dateB = new Date(`${bookingB.date}T${bookingB.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });

    console.log(`✅ [getOwnerMatches] Match validi trovati: ${validMatches.length}`);

    res.json(validMatches);
  } catch (err) {
    console.error("❌ [getOwnerMatches] Errore:", err);
    res.status(500).json({ message: "Errore caricamento match" });
  }
};
