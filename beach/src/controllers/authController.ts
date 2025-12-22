import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
import PlayerProfile from "../models/PlayerProfile";
import UserPreferences from "../models/UserPreferences";

const JWT_SECRET = "SUPER_MEGA_SECRET"; // poi env

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    console.log("📝 Tentativo registrazione:", { name, email, role });

    if (!name || !email || !password) {
      console.log("❌ Registrazione fallita: campi mancanti");
      return res
        .status(400)
        .json({ message: "Name, email e password sono obbligatori" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("❌ Registrazione fallita: email già esistente:", email);
      return res.status(400).json({ message: "Email già registrata" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role === "owner" ? "owner" : "player",
    });

    console.log("✅ Utente registrato:", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // 👇 CREA STRUTTURE DI PROFILO SOLO PER PLAYER
    if (user.role === "player") {
      await PlayerProfile.create({ user: user._id });
      await UserPreferences.create({ user: user._id });
      console.log("✅ Profilo player creato per:", user._id);
    }

    return res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error("❌ Register error:", err);
    return res.status(500).json({ message: "Errore server" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log("🔐 Tentativo login:", email);

    if (!email || !password) {
      console.log("❌ Login fallito: campi mancanti");
      return res
        .status(400)
        .json({ message: "Email e password obbligatorie" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ Login fallito: utente non trovato:", email);
      return res.status(400).json({ message: "Credenziali errate" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Login fallito: password errata per:", email);
      return res.status(400).json({ message: "Credenziali errate" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Login riuscito:", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: `${token.substring(0, 20)}...`,
    });

    console.log("🔑 TOKEN COMPLETO:", token);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ message: "Errore server" });
  }
};