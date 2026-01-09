import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
import PlayerProfile from "../models/PlayerProfile";
import UserPreferences from "../models/UserPreferences";
import cloudinary from "../config/cloudinary";

const JWT_SECRET = "SUPER_MEGA_SECRET"; // poi env

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    console.log("🔐 Tentativo registrazione:", { name, email, role });
    console.log("📸 req.file presente?", (req as any).file ? "SÌ" : "NO");
    if ((req as any).file) {
      console.log("📸 File info:", {
        filename: (req as any).file.filename,
        path: (req as any).file.path,
        mimetype: (req as any).file.mimetype,
      });
    }

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

    // Gestione avatar durante registrazione
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role === "owner" ? "owner" : "player",
    });

    console.log("Utente registrato:", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    });

    if ((req as any).file) {
      try {
        const file = (req as any).file as Express.Multer.File;
        const base64 = file.buffer.toString("base64");
        const dataUri = `data:${file.mimetype};base64,${base64}`;
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "userImage";
        const publicId = `avatars/${user._id}`;

        const result = await cloudinary.uploader.upload(dataUri, {
          public_id: publicId,
          overwrite: true,
          invalidate: true,
          upload_preset: uploadPreset,
          resource_type: "image",
        });

        const avatarUrl = result.secure_url || result.url;
        if (avatarUrl) {
          user.avatarUrl = avatarUrl;
          await user.save();
        }
      } catch (err) {
        console.error("Avatar upload failed during registration:", err);
      }
    }

    // 👇 CREA STRUTTURE DI PROFILO SOLO PER PLAYER
    if (user.role === "player") {
      await PlayerProfile.create({ user: user._id });
      await UserPreferences.create({ user: user._id });
      console.log("✅ Profilo player creato per:", user._id);
    }

    // ✅ GENERA TOKEN ALLA REGISTRAZIONE
    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("🔑 Token generato per registrazione:", `${token.substring(0, 20)}...`);

    // ✅ RESTITUISCI TOKEN NELLA RISPOSTA
    return res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      profilePrivacy: user.profilePrivacy || "public", // ✅ NUOVO: privacy del profilo
      token,
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
      avatarUrl: user.avatarUrl,
      profilePrivacy: user.profilePrivacy,
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
        avatarUrl: user.avatarUrl,
        profilePrivacy: user.profilePrivacy || "public", // ✅ NUOVO: privacy del profilo
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ message: "Errore server" });
  }
};