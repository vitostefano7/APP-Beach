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
import cloudinary from "../config/cloudinary";

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

    // Costruisci l'oggetto di aggiornamento solo con i campi presenti
    const updateFields: any = {};
    if (req.body.name !== undefined) updateFields.name = req.body.name;
    if (req.body.surname !== undefined) updateFields.surname = req.body.surname;
    if (req.body.phone !== undefined) updateFields.phone = req.body.phone;
    if (req.body.avatarUrl !== undefined) updateFields.avatarUrl = req.body.avatarUrl;
    
    // Aggiungi profilePrivacy se presente e valido
    if (req.body.profilePrivacy !== undefined) {
      if (!["public", "private"].includes(req.body.profilePrivacy)) {
        return res.status(400).json({ 
          message: "profilePrivacy deve essere 'public' o 'private'" 
        });
      }
      updateFields.profilePrivacy = req.body.profilePrivacy;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateFields,
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
  const userId = req.user?.id;
  try {
    if (!userId) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    console.log("[uploadAvatar] start", {
      userId,
      hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || "userImage",
    });

    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      console.log("[uploadAvatar] missing file");
      return res.status(400).json({ message: "Nessun file caricato" });
    }

    console.log("[uploadAvatar] file", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    if (user.avatarUrl && user.avatarUrl.startsWith("/images/profilo/")) {
      const oldFilePath = path.join(__dirname, "../../../", user.avatarUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log("Vecchio avatar locale eliminato:", oldFilePath);
      }
    }

    const base64 = file.buffer.toString("base64");
    const dataUri = `data:${file.mimetype};base64,${base64}`;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "userImage";
    const publicId = `avatars/${userId}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      overwrite: true,
      invalidate: true,
      upload_preset: uploadPreset,
      resource_type: "image",
    });

    console.log("[uploadAvatar] cloudinary result", {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
    });

    const avatarUrl = result.secure_url || result.url;
    if (!avatarUrl) {
      return res.status(500).json({ message: "Errore upload Cloudinary" });
    }

    user.avatarUrl = avatarUrl;
    await user.save();

    res.json({
      message: "Avatar caricato con successo",
      avatarUrl,
    });
  } catch (error) {
    console.error("uploadAvatar error:", error);
    console.log("[uploadAvatar] error context", {
      userId,
      hasFile: !!req.file,
    });
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

    const publicId = `avatars/${userId}`;
    await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: "image",
    });

    if (user.avatarUrl && user.avatarUrl.startsWith("/images/profilo/")) {
      const filePath = path.join(__dirname, "../../", user.avatarUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Avatar locale eliminato:", filePath);
      }
    }

    user.avatarUrl = null as any;
    await user.save();

    res.json({ message: "Avatar rimosso con successo" });
  } catch (error) {
    console.error("deleteAvatar error:", error);
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
    const currentUserId = req.user!.id;

    if (!q || typeof q !== "string" || q.length < 2) {
      return res.status(400).json({ message: "Query minimo 2 caratteri" });
    }

    const users = await User.find({
      username: { $regex: q.toLowerCase(), $options: "i" },
      isActive: true,
    })
      .select("username name surname avatarUrl preferredSports")
      .limit(20);

    // Calculate common matches and mutual friends for each user
    const Friendship = (await import("../models/Friendship")).default;
    
    // Get current user's friends once
    const currentUserFriends = await Friendship.find({
      $or: [
        { requester: currentUserId, status: 'accepted' },
        { recipient: currentUserId, status: 'accepted' }
      ]
    });

    const currentUserFriendIds = currentUserFriends.map(f => 
      f.requester.toString() === currentUserId ? f.recipient.toString() : f.requester.toString()
    );

    const usersWithCommonMatches = await Promise.all(
      users.map(async (user) => {
        // Count matches where both users played together
        const commonMatchesCount = await Match.countDocuments({
          status: "completed",
          "players.user": { $all: [currentUserId, user._id] },
          "players.status": "confirmed"
        });

        // Count mutual friends
        const targetUserFriends = await Friendship.find({
          $or: [
            { requester: user._id, status: 'accepted' },
            { recipient: user._id, status: 'accepted' }
          ]
        });

        const targetUserFriendIds = targetUserFriends.map(f => 
          f.requester.toString() === user._id.toString() ? f.recipient.toString() : f.requester.toString()
        );

        const mutualFriendsCount = currentUserFriendIds.filter(id => 
          targetUserFriendIds.includes(id)
        ).length;

        return {
          ...user.toObject(),
          commonMatchesCount,
          mutualFriendsCount
        };
      })
    );

    res.json(usersWithCommonMatches);
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
 * GET /users/:userId/public-profile
 * Profilo pubblico utente tramite ID
 */
export const getUserPublicProfileById = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!.id;

    // Validate userId format
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID utente non valido" });
    }

    const user = await User.findOne({
      _id: userId,
      isActive: true,
    }).select("_id username name surname avatarUrl preferredSports profilePrivacy createdAt");

    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // Controlla la privacy del profilo
    const isPrivate = user.profilePrivacy === "private";
    const isOwner = req.user!.role === "owner";

    // Check friendship status - controlla entrambe le direzioni
    const Friendship = (await import("../models/Friendship")).default;
    
    console.log(`🔍 [getUserPublicProfileById] Checking friendship: currentUserId=${currentUserId}, userId=${userId}`);
    
    // Check if I sent a request to them (my outgoing request)
    const myOutgoingRequest = await Friendship.findOne({
      requester: currentUserId,
      recipient: userId
    });

    // Check if they sent a request to me (their outgoing request = my incoming request)
    const theirOutgoingRequest = await Friendship.findOne({
      requester: userId,
      recipient: currentUserId
    });

    console.log(`🔍 [getUserPublicProfileById] My outgoing request (me→them):`, myOutgoingRequest ? {
      _id: myOutgoingRequest._id,
      status: myOutgoingRequest.status
    } : 'NONE');

    console.log(`🔍 [getUserPublicProfileById] Their outgoing request (them→me):`, theirOutgoingRequest ? {
      _id: theirOutgoingRequest._id,
      status: theirOutgoingRequest.status
    } : 'NONE');

    let friendshipStatus: 'none' | 'pending' | 'accepted' = 'none';
    let isFollowing = false;
    let theyFollowMe = false;
    let hasIncomingRequest = false;
    
    // Check MY request to THEM (my outgoing)
    if (myOutgoingRequest) {
      if (myOutgoingRequest.status === 'accepted') {
        friendshipStatus = 'accepted';
        isFollowing = true;
        console.log(`✅ [getUserPublicProfileById] I follow them - friendshipStatus=accepted`);
      } else if (myOutgoingRequest.status === 'pending') {
        friendshipStatus = 'pending';
        isFollowing = false;
        console.log(`⏳ [getUserPublicProfileById] My request pending - friendshipStatus=pending`);
      }
    }
    
    // Check if THEY follow ME
    if (theirOutgoingRequest) {
      if (theirOutgoingRequest.status === 'accepted') {
        theyFollowMe = true;
        console.log(`✅ [getUserPublicProfileById] They follow me (accepted)`);
      } else if (theirOutgoingRequest.status === 'pending') {
        hasIncomingRequest = true;
        console.log(`📥 [getUserPublicProfileById] They have pending request to follow me`);
      }
    }

    if (!myOutgoingRequest && !theirOutgoingRequest) {
      console.log(`❌ [getUserPublicProfileById] No friendship in either direction`);
    }

    // Se il profilo è privato e non sei follower accettato (e non sei owner), limita le info
    if (isPrivate && !isFollowing && !isOwner && currentUserId !== userId) {
      return res.json({
        user: {
          _id: user._id,
          username: user.username,
          name: user.name,
          avatarUrl: user.avatarUrl,
          profilePrivacy: user.profilePrivacy,
        },
        stats: {
          matchesPlayed: 0,
          commonMatchesCount: 0,
          mutualFriendsCount: 0,
        },
        friendshipStatus,
        isPrivate: true,
        message: "Questo profilo è privato",
      });
    }

    // Statistiche pubbliche (visibili solo se pubblico o sei follower)
    const matchesPlayed = await Match.countDocuments({
      "players.user": user._id,
      "players.status": "confirmed",
      status: "completed",
    });

    // Count common matches
    const commonMatchesCount = await Match.countDocuments({
      status: "completed",
      "players.user": { $all: [currentUserId, user._id] },
      "players.status": "confirmed"
    });

    // Count mutual friends
    const currentUserFriends = await Friendship.find({
      $or: [
        { requester: currentUserId, status: 'accepted' },
        { recipient: currentUserId, status: 'accepted' }
      ]
    });

    const currentUserFriendIds = currentUserFriends.map(f => 
      f.requester.toString() === currentUserId ? f.recipient.toString() : f.requester.toString()
    );

    const targetUserFriends = await Friendship.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });

    const targetUserFriendIds = targetUserFriends.map(f => 
      f.requester.toString() === userId ? f.recipient.toString() : f.requester.toString()
    );

    const mutualFriendsCount = currentUserFriendIds.filter(id =>
      targetUserFriendIds.includes(id)
    ).length;

    // Conta follower (chi segue l'utente target)
    const followersCount = await Friendship.countDocuments({
      recipient: userId,
      status: 'accepted'
    });

    // Conta following (chi l'utente target segue)
    const followingCount = await Friendship.countDocuments({
      requester: userId,
      status: 'accepted'
    });

    res.json({
      user,
      stats: {
        matchesPlayed,
        commonMatchesCount,
        mutualFriendsCount,
        followersCount,
        followingCount,
      },
      friendshipStatus, // Il tuo status verso di loro (none/pending/accepted)
      isPrivate: false,
      hasIncomingRequest, // Hanno una richiesta pending verso di te
      theyFollowMe, // Ti seguono già (accepted)
    });
  } catch (err) {
    console.error("❌ getUserPublicProfileById error:", err);
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

/**
 * GET /users/:userId/posts
 * Ottiene i post pubblici di un utente (solo se profilo pubblico o se lo seguiamo)
 */
export const getUserPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    console.log("📝 getUserPosts chiamato per userId:", userId);

    // Validate userId format
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID utente non valido" });
    }

    const user = await User.findOne({
      _id: userId,
      isActive: true,
    }).select("profilePrivacy");

    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    // Check se il profilo è privato
    const isPrivate = user.profilePrivacy === "private";

    // Se privato, verifica che l'utente corrente lo segua
    if (isPrivate && currentUserId !== userId) {
      const Friendship = (await import("../models/Friendship")).default;
      const friendship = await Friendship.findOne({
        requester: currentUserId,
        recipient: userId,
        status: 'accepted'
      });

      if (!friendship) {
        return res.status(403).json({
          message: "Questo profilo è privato. Segui l'utente per vedere i suoi post."
        });
      }
    }

    // Recupera i post dell'utente
    const Post = (await import("../models/Post")).default;
    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate("user", "name surname avatarUrl")
      .populate("comments.user", "name avatarUrl")
      .lean();

    const total = await Post.countDocuments({ user: userId });
    const hasMore = offset + limit < total;

    console.log("✅ Posts trovati:", posts.length);

    res.json({
      posts,
      total,
      hasMore,
    });
  } catch (err) {
    console.error("❌ getUserPosts error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};
