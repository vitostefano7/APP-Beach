import express from "express";
import User from "../models/User";
import { auth, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.put(
  "/me",
  auth,
  async (req: AuthRequest, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Dati non validi" });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, email },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    res.json(user);
  }
);

export default router;
