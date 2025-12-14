import { Request, Response } from "express";
import Strutture from "../models/Strutture";

/**
 * GET /strutture
 */
export const getStrutture = async (_req: Request, res: Response) => {
  try {
    const strutture = await Strutture.find({
      isActive: true,
      isDeleted: false,
    });
    res.json(strutture);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore caricamento strutture" });
  }
};

/**
 * GET /strutture/:id
 */
export const getStrutturaById = async (req: Request, res: Response) => {
  try {
    const struttura = await Strutture.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!struttura) {
      return res.status(404).json({ message: "Struttura non trovata" });
    }

    res.json(struttura);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore struttura" });
  }
};
