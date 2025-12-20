import { Request, Response } from "express";
import Struttura from "../models/Strutture";
import Campo from "../models/Campo";
import { AuthRequest } from "../middleware/authMiddleware";

/**
 * 📌 GET /strutture
 * Tutte le strutture pubbliche (PLAYER)
 */
export const getStrutture = async (_req: Request, res: Response) => {
  try {
    const strutture = await Struttura.find({
      isActive: true,
      isDeleted: false,
    }).sort({ isFeatured: -1, createdAt: -1 });

    res.json(strutture);
  } catch (err) {
    console.error("❌ getStrutture error:", err);
    res.status(500).json({ message: "Errore caricamento strutture" });
  }
};

/**
 * 📌 GET /strutture/:id
 * Dettaglio singola struttura
 */
export const getStrutturaById = async (req: Request, res: Response) => {
  try {
    const struttura = await Struttura.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!struttura) {
      return res.status(404).json({ message: "Struttura non trovata" });
    }

    res.json(struttura);
  } catch (err) {
    console.error("❌ getStrutturaById error:", err);
    res.status(500).json({ message: "Errore struttura" });
  }
};

/**
 * 📌 GET /strutture/:id/campi
 * Tutti i campi di una struttura
 */
export const getCampiByStruttura = async (
  req: Request,
  res: Response
) => {
  try {
    const campi = await Campo.find({
      struttura: req.params.id,
      isActive: true,
    }).sort({ pricePerHour: 1 });

    res.json(campi);
  } catch (err) {
    console.error("❌ getCampiByStruttura error:", err);
    res.status(500).json({ message: "Errore caricamento campi" });
  }
};

/**
 * 📌 GET /strutture/owner
 * Strutture dell’owner loggato
 */
export const getOwnerStrutture = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const strutture = await Struttura.find({
      owner: req.user!.id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    res.json(strutture);
  } catch (err) {
    console.error("❌ getOwnerStrutture error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};
