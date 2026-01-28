import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

export default function ownerOnly(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.user?.role !== "owner") {
    return res.status(403).json({ message: "Accesso riservato agli owner" });
  }
  next();
}
