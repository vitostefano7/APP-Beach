import { Request, Response } from "express";
import Campo from "../models/Campo";

export const getCampiByStruttura = async (req: Request, res: Response) => {
  const campi = await Campo.find({
    struttura: req.params.id,
    isActive: true,
  });
  res.json(campi);
};
