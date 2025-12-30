import { Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";
import PlayerProfile from "../models/PlayerProfile";
import UserPreferences from "../models/UserPreferences";
import Booking from "../models/Booking";
import { AuthRequest } from "../middleware/authMiddleware";

/**
 * GET /users/me/profile
 */
export const getMyProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const [user, profile, preferences] = await Promise.all([
      User.findById(userId).select("-password"),
      PlayerProfile.findOne({ user: userId }).populate("favoriteCampo"),
      UserPreferences.findOne({ user: userId }),
    ]);

    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // 📅 oggi a mezzanotte
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ✅ PARTITE GIOCATE = prenotazioni passate e confermate
    const matchesPlayed = await Booking.countDocuments({
      user: userId,
      status: "confirmed",
      date: { $lt: today.toISOString().slice(0, 10) },
    });

    res.json({
      user,
      profile: {
        level: profile?.level ?? "amateur",
        ratingAverage: profile?.ratingAverage ?? 0,
        favoriteCampo: profile?.favoriteCampo ?? null,
        matchesPlayed, // 👈 CALCOLATO DINAMICAMENTE
      },
      preferences: preferences ?? {
        pushNotifications: false,
        darkMode: false,
      },
    });
  } catch (error) {
    console.error("getMyProfile error", error);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * PATCH /users/me/profile
 */
export const updatePlayerProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const { level, favoriteCampo } = req.body;

    const profile = await PlayerProfile.findOneAndUpdate(
      { user: userId },
      { level, favoriteCampo },
      { new: true, upsert: true }
    ).populate("favoriteCampo");

    res.json(profile);
  } catch (error) {
    console.error("updatePlayerProfile error", error);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * PATCH /users/me/preferences
 */
export const updatePreferences = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const preferences = await UserPreferences.findOneAndUpdate(
      { user: userId },
      req.body,
      { new: true, upsert: true }
    );

    res.json(preferences);
  } catch (error) {
    console.error("updatePreferences error", error);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * PATCH /users/me
 */
export const updateMe = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        name: req.body.name,
        surname: req.body.surname,
        phone: req.body.phone,
        avatarUrl: req.body.avatarUrl,
      },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    console.error("updateMe error", error);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * POST /users/me/change-password
 */
export const changePassword = async (
  req: AuthRequest,
  res: Response
) => {
  console.log("🔐 ========== CHANGE PASSWORD CALLED ==========");
  console.log("📍 Route: POST /users/me/change-password");
  console.log("👤 User ID:", req.user?.id);
  console.log("📦 Request Body:", {
    hasCurrentPassword: !!req.body.currentPassword,
    currentPasswordLength: req.body.currentPassword?.length || 0,
    hasNewPassword: !!req.body.newPassword,
    newPasswordLength: req.body.newPassword?.length || 0,
  });
  console.log("🔑 Authorization Header:", req.headers.authorization ? "Present" : "Missing");

  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    console.log("✅ Step 1: Input validation");
    // Validazione input
    if (!currentPassword || !newPassword) {
      console.log("❌ Missing passwords");
      return res.status(400).json({ 
        message: "Password attuale e nuova password sono obbligatorie" 
      });
    }

    console.log("✅ Step 2: Password length check");
    // Validazione lunghezza nuova password
    if (newPassword.length < 8) {
      console.log("❌ New password too short:", newPassword.length);
      return res.status(400).json({ 
        message: "La nuova password deve essere almeno 8 caratteri" 
      });
    }

    console.log("✅ Step 3: Finding user in database");
    // Trova l'utente (con password questa volta)
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found:", userId);
      return res.status(404).json({ message: "Utente non trovato" });
    }
    console.log("✅ User found:", user._id);

    console.log("✅ Step 4: Verifying current password");
    // Verifica che la password attuale sia corretta
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    console.log("🔍 Password validation result:", isPasswordValid);
    
    if (!isPasswordValid) {
      console.log("❌ Current password is incorrect");
      return res.status(400).json({ 
        message: "Password attuale non corretta" 
      });
    }

    console.log("✅ Step 5: Checking if new password is different");
    // Verifica che la nuova password sia diversa dalla vecchia
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    console.log("🔍 Same password check:", isSamePassword);
    
    if (isSamePassword) {
      console.log("❌ New password is the same as current");
      return res.status(400).json({ 
        message: "La nuova password deve essere diversa da quella attuale" 
      });
    }

    console.log("✅ Step 6: Hashing new password");
    // Hash della nuova password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("✅ Password hashed successfully");

    console.log("✅ Step 7: Updating user password");
    // Aggiorna la password
    user.password = hashedPassword;
    await user.save();
    console.log("✅ Password updated in database");

    console.log("🎉 ========== PASSWORD CHANGE SUCCESS ==========");
    res.json({ 
      message: "Password modificata con successo" 
    });
  } catch (error) {
    console.error("❌ ========== PASSWORD CHANGE ERROR ==========");
    console.error("Error details:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    res.status(500).json({ message: "Errore server" });
  }
};