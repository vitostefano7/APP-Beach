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

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email e password sono obbligatori" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email già registrata" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role === "owner" ? "owner" : "player",
    });

    // 👇 CREA STRUTTURE DI PROFILO SOLO PER PLAYER
    if (user.role === "player") {
      await PlayerProfile.create({ user: user._id });
      await UserPreferences.create({ user: user._id });
    }

    return res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error("Register error", err);
    return res.status(500).json({ message: "Errore server" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email e password obbligatorie" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Credenziali errate" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Credenziali errate" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

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
    console.error("Login error", err);
    return res.status(500).json({ message: "Errore server" });
  }
};
