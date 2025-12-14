import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/authMiddleware";
import Strutture from "../models/Strutture";
import Booking from "../models/Booking";

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

    const strutture = await Strutture.find({
      owner: new mongoose.Types.ObjectId(ownerId),
    }).select("_id");

    const ids = strutture.map(s => s._id);

    const bookings = await Booking.find({
      struttura: { $in: ids },
      status: "confirmed",
    })
      .populate("user", "name email")
      .populate("struttura", "name location");

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Errore bookings" });
  }
};
