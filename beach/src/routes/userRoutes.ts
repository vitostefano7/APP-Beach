import express from "express";
import User from "../models/User";
import { requireAuth, AuthRequest } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    res.json(user);
  } catch (err) {
    console.error("get me error", err);
    res.status(500).json({ message: "Errore server" });
  }
});

export default router;
