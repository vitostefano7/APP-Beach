"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const PlayerProfile_1 = __importDefault(require("../models/PlayerProfile"));
const UserPreferences_1 = __importDefault(require("../models/UserPreferences"));
const JWT_SECRET = "SUPER_MEGA_SECRET"; // poi env
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        console.log("🔐 Tentativo registrazione:", { name, email, role });
        console.log("📸 req.file presente?", req.file ? "SÌ" : "NO");
        if (req.file) {
            console.log("📸 File info:", {
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype,
            });
        }
        if (!name || !email || !password) {
            console.log("❌ Registrazione fallita: campi mancanti");
            return res
                .status(400)
                .json({ message: "Name, email e password sono obbligatori" });
        }
        const existing = await User_1.default.findOne({ email });
        if (existing) {
            console.log("❌ Registrazione fallita: email già esistente:", email);
            return res.status(400).json({ message: "Email già registrata" });
        }
        const hashed = await bcrypt_1.default.hash(password, 10);
        // ✅ Gestione avatar durante registrazione
        let avatarUrl = undefined;
        let tempFilePath = undefined;
        if (req.file) {
            console.log("📸 File ricevuto durante registrazione:", req.file.filename);
            tempFilePath = req.file.path;
            // Per ora usiamo il filename temporaneo
            avatarUrl = `/images/profilo/${req.file.filename}`;
        }
        const user = await User_1.default.create({
            name,
            email,
            password: hashed,
            role: role === "owner" ? "owner" : "player",
            ...(avatarUrl && { avatarUrl }), // ✅ Aggiungi solo se esiste
        });
        console.log("✅ Utente registrato:", {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
        });
        // ✅ Se c'è un file temporaneo, rinominalo con l'userId reale
        if (tempFilePath && req.file) {
            const fs = require("fs");
            const path = require("path");
            const oldFilename = req.file.filename;
            const ext = path.extname(oldFilename);
            const newFilename = `${user._id}_${Date.now()}${ext}`;
            const newFilePath = path.join(path.dirname(tempFilePath), newFilename);
            try {
                fs.renameSync(tempFilePath, newFilePath);
                console.log("🔄 File rinominato:", oldFilename, "→", newFilename);
                // Aggiorna avatarUrl nel database
                user.avatarUrl = `/images/profilo/${newFilename}`;
                await user.save();
                console.log("✅ avatarUrl aggiornato nel DB:", user.avatarUrl);
            }
            catch (err) {
                console.error("❌ Errore rinomina file:", err);
            }
        }
        // 👇 CREA STRUTTURE DI PROFILO SOLO PER PLAYER
        if (user.role === "player") {
            await PlayerProfile_1.default.create({ user: user._id });
            await UserPreferences_1.default.create({ user: user._id });
            console.log("✅ Profilo player creato per:", user._id);
        }
        // ✅ GENERA TOKEN ALLA REGISTRAZIONE
        const token = jsonwebtoken_1.default.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: "7d" });
        console.log("🔑 Token generato per registrazione:", `${token.substring(0, 20)}...`);
        // ✅ RESTITUISCI TOKEN NELLA RISPOSTA
        return res.status(201).json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl, // ✅ NUOVO
            token,
        });
    }
    catch (err) {
        console.error("❌ Register error:", err);
        return res.status(500).json({ message: "Errore server" });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("🔐 Tentativo login:", email);
        if (!email || !password) {
            console.log("❌ Login fallito: campi mancanti");
            return res
                .status(400)
                .json({ message: "Email e password obbligatorie" });
        }
        const user = await User_1.default.findOne({ email });
        if (!user) {
            console.log("❌ Login fallito: utente non trovato:", email);
            return res.status(400).json({ message: "Credenziali errate" });
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            console.log("❌ Login fallito: password errata per:", email);
            return res.status(400).json({ message: "Credenziali errate" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: "7d" });
        console.log("✅ Login riuscito:", {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
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
                avatarUrl: user.avatarUrl, // ✅ NUOVO
            },
        });
    }
    catch (err) {
        console.error("❌ Login error:", err);
        return res.status(500).json({ message: "Errore server" });
    }
};
exports.login = login;
