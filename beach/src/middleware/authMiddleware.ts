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
  console.log("🔐 [requireAuth] Verifica autenticazione per:", req.method, req.originalUrl);
  
  const header = req.headers.authorization;
  console.log("🔐 [requireAuth] Authorization header:", header ? "Presente" : "Mancante");

  if (!header || !header.startsWith("Bearer ")) {
    console.log("❌ [requireAuth] Token mancante o formato errato");
    return res.status(401).json({ 
      error: "Non autenticato",
      message: "Token mancante o formato errato",
      required: "Bearer <token>"
    });
  }

  const token = header.split(" ")[1];
  console.log("🔐 [requireAuth] Token ricevuto:", token.substring(0, 20) + "...");

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log("✅ [requireAuth] Token valido per utente:", decoded.id);
    
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    console.log("❌ [requireAuth] Token non valido:", error.message);
    return res.status(401).json({ 
      error: "Non autenticato",
      message: "Token non valido o scaduto"
    });
  }
}