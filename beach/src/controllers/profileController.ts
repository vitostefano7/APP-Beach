import { Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";
import PlayerProfile from "../models/PlayerProfile";
import UserPreferences from "../models/UserPreferences";
import Booking from "../models/Booking";
import Match from "../models/Match";
import Campo from "../models/Campo";
import { AuthRequest } from "../middleware/authMiddleware";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

const { Types } = mongoose;

/**
 * GET /users/:userId
 * Ottiene il profilo pubblico di un utente (per owner che vedono chat)
 */
export const getUserProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user!;

    console.log("👤 getUserProfile chiamato");
    console.log("   - currentUser:", currentUser.id, currentUser.role);
    console.log("   - userId richiesto:", userId);

    // Solo gli owner possono vedere i profili degli altri utenti
    if (currentUser.role !== "owner") {
      console.log("❌ Accesso negato: utente non è owner");
      return res.status(403).json({ 
        message: "Solo i proprietari possono vedere i profili degli utenti" 
      });
    }

    const user = await User.findById(userId).select(
      "_id name email phone avatarUrl createdAt"
    );

    if (!user) {
      console.log("❌ Utente non trovato:", userId);
      return res.status(404).json({ message: "Utente non trovato" });
    }

    console.log("✅ Profilo utente trovato:", user.name);
    res.json(user);
  } catch (error) {
    console.error("❌ Errore getUserProfile:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

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
 * GET /users/preferences
 * Ottiene le preferenze dell'utente
 */
export const getPreferences = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const preferences = await UserPreferences.findOne({ user: userId });

    if (!preferences) {
      // Ritorna default se non esistono
      return res.json({
        pushNotifications: false,
        darkMode: false,
      });
    }

    res.json(preferences);
  } catch (error) {
    console.error("getPreferences error", error);
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
 * POST /users/me/avatar
 * Upload avatar immagine profilo
 */
export const uploadAvatar = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    if (!req.file) {
      return res.status(400).json({ message: "Nessun file caricato" });
    }

    console.log("📸 Upload avatar per user:", userId);
    console.log("📁 File:", req.file.filename);

    // ✅ Trova l'utente e il vecchio avatar
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // ✅ Elimina il vecchio avatar se esiste
    if (user.avatarUrl) {
      const oldFilePath = path.join(__dirname, "../../../", user.avatarUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log("🗑️ Vecchio avatar eliminato:", oldFilePath);
      }
    }

    // ✅ Aggiorna l'utente con il nuovo avatar
    const avatarUrl = `/images/profilo/${req.file.filename}`;
    user.avatarUrl = avatarUrl;
    await user.save();

    console.log("✅ Avatar aggiornato:", avatarUrl);

    res.json({
      message: "Avatar caricato con successo",
      avatarUrl,
    });
  } catch (error) {
    console.error("❌ uploadAvatar error:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * DELETE /users/me/avatar
 * Rimuove avatar
 */
export const deleteAvatar = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // ✅ Elimina il file se esiste
    if (user.avatarUrl) {
      const filePath = path.join(__dirname, "../../", user.avatarUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("🗑️ Avatar eliminato:", filePath);
      }
    }

    // ✅ Rimuovi avatar dal database
    user.avatarUrl = undefined;
    await user.save();

    res.json({ message: "Avatar rimosso con successo" });
  } catch (error) {
    console.error("❌ deleteAvatar error:", error);
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
  console.log("🔒 ========== CHANGE PASSWORD CALLED ==========");
  console.log("🔒 Route: POST /users/me/change-password");
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

/* ==========================================
   🆕 NUOVE FUNZIONI SOCIAL
========================================== */

/**
 * GET /users/search?q=mario
 * Cerca utenti per username
 */
export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string" || q.length < 2) {
      return res.status(400).json({ message: "Query minimo 2 caratteri" });
    }

    const users = await User.find({
      username: { $regex: q.toLowerCase(), $options: "i" },
      isActive: true,
    })
      .select("username name avatarUrl")
      .limit(20);

    res.json(users);
  } catch (err) {
    console.error("❌ searchUsers error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * GET /users/:username/profile
 * Profilo pubblico utente
 */
export const getUserPublicProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({
      username: username.toLowerCase(),
      isActive: true,
    }).select("username name avatarUrl createdAt");

    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // Statistiche pubbliche
    const matchesPlayed = await Match.countDocuments({
      "players.user": user._id,
      "players.status": "confirmed",
      status: "completed",
    });

    res.json({
      user,
      stats: {
        matchesPlayed,
      },
    });
  } catch (err) {
    console.error("❌ getUserPublicProfile error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * GET /users/:username/matches
 * Match pubblici di un utente
 */
export const getUserMatches = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const { limit = 20 } = req.query;

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    const matches = await Match.find({
      "players.user": user._id,
      status: "completed",
      isPublic: true,
    })
      .sort({ playedAt: -1 })
      .limit(Number(limit))
      .populate("players.user", "username name avatarUrl")
      .populate("createdBy", "username name avatarUrl");

    res.json(matches);
  } catch (err) {
    console.error("❌ getUserMatches error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * GET /users/me/played-with
 * Persone con cui ho giocato
 */
export const getPlayedWith = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const playedWith = await Match.aggregate([
      {
        $match: {
          "players.user": new Types.ObjectId(userId),
          "players.status": "confirmed",
          status: "completed",
        },
      },

      { $unwind: "$players" },

      {
        $match: {
          "players.status": "confirmed",
          "players.user": { $ne: new Types.ObjectId(userId) },
        },
      },

      {
        $group: {
          _id: "$players.user",
          matchCount: { $sum: 1 },
          lastPlayedAt: { $max: "$playedAt" },
        },
      },

      { $sort: { matchCount: -1, lastPlayedAt: -1 } },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },

      { $unwind: "$user" },

      {
        $project: {
          _id: 0,
          userId: "$_id",
          username: "$user.username",
          name: "$user.name",
          avatarUrl: "$user.avatarUrl",
          matchCount: 1,
          lastPlayedAt: 1,
        },
      },

      { $limit: 50 },
    ]);

    res.json(playedWith);
  } catch (err) {
    console.error("❌ getPlayedWith error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * GET /users/me/frequented-venues
 * Strutture frequentate
 */
export const getFrequentedVenues = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const venues = await Booking.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
          status: "confirmed",
        },
      },

      {
        $lookup: {
          from: "campos",
          localField: "campo",
          foreignField: "_id",
          as: "campo",
        },
      },

      { $unwind: "$campo" },

      {
        $lookup: {
          from: "strutturas",
          localField: "campo.struttura",
          foreignField: "_id",
          as: "struttura",
        },
      },

      { $unwind: "$struttura" },

      {
        $group: {
          _id: "$struttura._id",
          name: { $first: "$struttura.name" },
          city: { $first: "$struttura.location.city" },
          images: { $first: "$struttura.images" },
          visitCount: { $sum: 1 },
          lastVisit: { $max: "$date" },
          totalSpent: { $sum: "$price" },
        },
      },

      { $sort: { visitCount: -1, lastVisit: -1 } },

      { $limit: 20 },
    ]);

    res.json(venues);
  } catch (err) {
    console.error("❌ getFrequentedVenues error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * GET /users/me/stats
 * Statistiche derivate
 */
export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Match giocati
    const matchesPlayed = await Match.countDocuments({
      "players.user": userId,
      "players.status": "confirmed",
      status: "completed",
    });

    // Vittorie
    const wins = await Match.aggregate([
      {
        $match: {
          "players.user": new Types.ObjectId(userId),
          "players.status": "confirmed",
          status: "completed",
          winner: { $exists: true },
        },
      },
      {
        $addFields: {
          myTeam: {
            $arrayElemAt: [
              {
                $map: {
                  input: {
                    $filter: {
                      input: "$players",
                      cond: {
                        $eq: ["$$this.user", new Types.ObjectId(userId)],
                      },
                    },
                  },
                  in: "$$this.team",
                },
              },
              0,
            ],
          },
        },
      },
      {
        $match: {
          $expr: { $eq: ["$myTeam", "$winner"] },
        },
      },
      { $count: "wins" },
    ]);

    const winCount = wins[0]?.wins || 0;

    // Strutture visitate
    const campiIds = await Booking.distinct("campo", {
      user: userId,
      status: "confirmed",
    });

    const venuesCount = await Campo.distinct("struttura", {
      _id: { $in: campiIds },
    }).then((strutture) => strutture.length);

    // Persone incontrate
    const peopleCount = await Match.aggregate([
      {
        $match: {
          "players.user": new Types.ObjectId(userId),
          status: "completed",
        },
      },
      { $unwind: "$players" },
      {
        $match: {
          "players.user": { $ne: new Types.ObjectId(userId) },
          "players.status": "confirmed",
        },
      },
      {
        $group: {
          _id: "$players.user",
        },
      },
      { $count: "people" },
    ]);

    res.json({
      matchesPlayed,
      wins: winCount,
      winRate: matchesPlayed > 0 ? Math.round((winCount / matchesPlayed) * 100) : 0,
      venuesVisited: venuesCount,
      peopleMetCount: peopleCount[0]?.people || 0,
    });
  } catch (err) {
    console.error("❌ getUserStats error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};