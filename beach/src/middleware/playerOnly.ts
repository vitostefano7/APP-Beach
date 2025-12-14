import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export function playerOnly(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.user?.role !== "player") {
    return res.status(403).json({ message: "Solo per player" });
  }
  next();
}
