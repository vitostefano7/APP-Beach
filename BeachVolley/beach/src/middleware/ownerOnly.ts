import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export function ownerOnly(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.user?.role !== "owner") {
    return res.status(403).json({ message: "Solo per owner" });
  }
  next();
}
