  import { Request, Response, NextFunction } from "express";
  import jwt from "jsonwebtoken";

  const JWT_SECRET = "SUPER_MEGA_SECRET";

  export interface AuthRequest extends Request {
    user?: {
      id: string;
      role: "player" | "owner";
    };
  }

  export function requireAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token mancante" });
    }

    const token = header.split(" ")[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      req.user = {
        id: decoded.id,
        role: decoded.role,
      };

      next();
    } catch {
      return res.status(401).json({ message: "Token non valido" });
    }
  }
