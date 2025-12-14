import { Request, Response } from "express";
import Strutture from "../models/Strutture";
import Booking from "../models/Booking";

/**
 * 🏗️ CREA STRUTTURA (OWNER)
 * POST /owner/strutture
 */
export const createStruttura = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user.id;

    const {
      name,
      description,
      location,
      pricePerHour,
      amenities,
      customAmenities,
      openingHours,
      images,
      coverImage,
      indoor,
      surface,
      maxPlayers,
    } = req.body;

    if (!name || !location?.lat || !location?.lng || !pricePerHour) {
      return res.status(400).json({ message: "Dati obbligatori mancanti" });
    }

    const struttura = await Strutture.create({
      name,
      description,
      owner: ownerId,
      location: {
        ...location,
        coordinates: [location.lng, location.lat],
      },
      pricePerHour,
      amenities,
      customAmenities,
      openingHours,
      images,
      coverImage,
      indoor,
      surface,
      maxPlayers,
    });

    res.status(201).json(struttura);
  } catch (err) {
    console.error("createStruttura error", err);
    res.status(500).json({ message: "Errore creazione struttura" });
  }
};

/**
 * 📋 STRUTTURE DELL'OWNER
 * GET /owner/strutture
 */
export const getMyStrutture = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user.id;

    const strutture = await Strutture.find({
      owner: ownerId,
      isDeleted: false,
    });

    res.json(strutture);
  } catch (err) {
    console.error("getMyStrutture error", err);
    res.status(500).json({ message: "Errore caricamento strutture" });
  }
};

/**
 * ✏️ MODIFICA STRUTTURA (OWNER)
 * PUT /owner/strutture/:id
 */
export const updateStruttura = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user.id;
    const { id } = req.params;

    const struttura = await Strutture.findOne({
      _id: id,
      owner: ownerId,
    });

    if (!struttura) {
      return res.status(404).json({ message: "Struttura non trovata" });
    }

    Object.assign(struttura, req.body);

    // se cambia location → aggiorna coordinates
    if (req.body.location?.lat && req.body.location?.lng) {
      struttura.location.coordinates = [
        req.body.location.lng,
        req.body.location.lat,
      ];
    }

    await struttura.save();
    res.json(struttura);
  } catch (err) {
    console.error("updateStruttura error", err);
    res.status(500).json({ message: "Errore modifica struttura" });
  }
};

/**
 * 📆 PRENOTAZIONI DELLE STRUTTURE OWNER
 * GET /owner/bookings
 */
export const getOwnerBookings = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user.id;

    const strutture = await Strutture.find({ owner: ownerId }).select("_id");
    const strutturaIds = strutture.map(s => s._id);

    const bookings = await Booking.find({
      struttura: { $in: strutturaIds },
      status: "confirmed",
    })
      .populate("user", "name email")
      .populate("struttura", "name location")
      .sort({ date: -1, startTime: 1 });

    res.json(bookings);
  } catch (err) {
    console.error("getOwnerBookings error", err);
    res.status(500).json({ message: "Errore prenotazioni" });
  }
};
