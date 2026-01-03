"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.deleteAvatar = exports.uploadAvatar = exports.updateMe = exports.updatePreferences = exports.getPreferences = exports.updatePlayerProfile = exports.getMyProfile = exports.getUserProfile = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = __importDefault(require("../models/User"));
const PlayerProfile_1 = __importDefault(require("../models/PlayerProfile"));
const UserPreferences_1 = __importDefault(require("../models/UserPreferences"));
const Booking_1 = __importDefault(require("../models/Booking"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * GET /users/:userId
 * Ottiene il profilo pubblico di un utente (per owner che vedono chat)
 */
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUser = req.user;
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
        const user = await User_1.default.findById(userId).select("_id name email phone avatarUrl createdAt");
        if (!user) {
            console.log("❌ Utente non trovato:", userId);
            return res.status(404).json({ message: "Utente non trovato" });
        }
        console.log("✅ Profilo utente trovato:", user.name);
        res.json(user);
    }
    catch (error) {
        console.error("❌ Errore getUserProfile:", error);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.getUserProfile = getUserProfile;
/**
 * GET /users/me/profile
 */
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [user, profile, preferences] = await Promise.all([
            User_1.default.findById(userId).select("-password"),
            PlayerProfile_1.default.findOne({ user: userId }).populate("favoriteCampo"),
            UserPreferences_1.default.findOne({ user: userId }),
        ]);
        if (!user) {
            return res.status(404).json({ message: "Utente non trovato" });
        }
        // 📅 oggi a mezzanotte
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // ✅ PARTITE GIOCATE = prenotazioni passate e confermate
        const matchesPlayed = await Booking_1.default.countDocuments({
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
    }
    catch (error) {
        console.error("getMyProfile error", error);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.getMyProfile = getMyProfile;
/**
 * PATCH /users/me/profile
 */
const updatePlayerProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { level, favoriteCampo } = req.body;
        const profile = await PlayerProfile_1.default.findOneAndUpdate({ user: userId }, { level, favoriteCampo }, { new: true, upsert: true }).populate("favoriteCampo");
        res.json(profile);
    }
    catch (error) {
        console.error("updatePlayerProfile error", error);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.updatePlayerProfile = updatePlayerProfile;
/**
 * GET /users/preferences
 * Ottiene le preferenze dell'utente
 */
const getPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = await UserPreferences_1.default.findOne({ user: userId });
        if (!preferences) {
            // Ritorna default se non esistono
            return res.json({
                pushNotifications: false,
                darkMode: false,
            });
        }
        res.json(preferences);
    }
    catch (error) {
        console.error("getPreferences error", error);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.getPreferences = getPreferences;
/**
 * PATCH /users/me/preferences
 */
const updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = await UserPreferences_1.default.findOneAndUpdate({ user: userId }, req.body, { new: true, upsert: true });
        res.json(preferences);
    }
    catch (error) {
        console.error("updatePreferences error", error);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.updatePreferences = updatePreferences;
/**
 * PATCH /users/me
 */
const updateMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User_1.default.findByIdAndUpdate(userId, {
            name: req.body.name,
            surname: req.body.surname,
            phone: req.body.phone,
            avatarUrl: req.body.avatarUrl,
        }, { new: true }).select("-password");
        res.json(user);
    }
    catch (error) {
        console.error("updateMe error", error);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.updateMe = updateMe;
/**
 * POST /users/me/avatar
 * Upload avatar immagine profilo
 */
const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({ message: "Nessun file caricato" });
        }
        console.log("📸 Upload avatar per user:", userId);
        console.log("📁 File:", req.file.filename);
        // ✅ Trova l'utente e il vecchio avatar
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utente non trovato" });
        }
        // ✅ Elimina il vecchio avatar se esiste
        if (user.avatarUrl) {
            const oldFilePath = path_1.default.join(__dirname, "../../", user.avatarUrl);
            if (fs_1.default.existsSync(oldFilePath)) {
                fs_1.default.unlinkSync(oldFilePath);
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
    }
    catch (error) {
        console.error("❌ uploadAvatar error:", error);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.uploadAvatar = uploadAvatar;
/**
 * DELETE /users/me/avatar
 * Rimuove avatar
 */
const deleteAvatar = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utente non trovato" });
        }
        // ✅ Elimina il file se esiste
        if (user.avatarUrl) {
            const filePath = path_1.default.join(__dirname, "../../", user.avatarUrl);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                console.log("🗑️ Avatar eliminato:", filePath);
            }
        }
        // ✅ Rimuovi avatar dal database
        user.avatarUrl = undefined;
        await user.save();
        res.json({ message: "Avatar rimosso con successo" });
    }
    catch (error) {
        console.error("❌ deleteAvatar error:", error);
        res.status(500).json({ message: "Errore server" });
    }
};
exports.deleteAvatar = deleteAvatar;
/**
 * POST /users/me/change-password
 */
const changePassword = async (req, res) => {
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
        const userId = req.user.id;
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
        const user = await User_1.default.findById(userId);
        if (!user) {
            console.log("❌ User not found:", userId);
            return res.status(404).json({ message: "Utente non trovato" });
        }
        console.log("✅ User found:", user._id);
        console.log("✅ Step 4: Verifying current password");
        // Verifica che la password attuale sia corretta
        const isPasswordValid = await bcrypt_1.default.compare(currentPassword, user.password);
        console.log("🔍 Password validation result:", isPasswordValid);
        if (!isPasswordValid) {
            console.log("❌ Current password is incorrect");
            return res.status(400).json({
                message: "Password attuale non corretta"
            });
        }
        console.log("✅ Step 5: Checking if new password is different");
        // Verifica che la nuova password sia diversa dalla vecchia
        const isSamePassword = await bcrypt_1.default.compare(newPassword, user.password);
        console.log("🔍 Same password check:", isSamePassword);
        if (isSamePassword) {
            console.log("❌ New password is the same as current");
            return res.status(400).json({
                message: "La nuova password deve essere diversa da quella attuale"
            });
        }
        console.log("✅ Step 6: Hashing new password");
        // Hash della nuova password
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
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
    }
    catch (error) {
        console.error("❌ ========== PASSWORD CHANGE ERROR ==========");
        console.error("Error details:", error);
        console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
        res.status(500).json({ message: "Errore server" });
    }
};
exports.changePassword = changePassword;
