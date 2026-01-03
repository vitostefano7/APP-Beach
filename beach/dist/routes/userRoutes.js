"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const profileController_1 = require("../controllers/profileController");
const uploadProfiloImages_1 = require("../middleware/uploadProfiloImages");
const router = express_1.default.Router();
/**
 * ⚠️ ORDINE IMPORTANTE: Route specifiche (/me/*, /preferences) PRIMA di route generiche (/:userId)
 * Altrimenti Express interpreta stringhe come "me" o "preferences" come userId!
 */
/**
 * USER BASE
 */
router.patch("/me", authMiddleware_1.requireAuth, profileController_1.updateMe);
/**
 * AVATAR UPLOAD
 * ✅ NUOVO: Upload e gestione immagine profilo
 */
router.post("/me/avatar", authMiddleware_1.requireAuth, uploadProfiloImages_1.uploadAvatar.single("avatar"), profileController_1.uploadAvatar);
router.delete("/me/avatar", authMiddleware_1.requireAuth, profileController_1.deleteAvatar);
/**
 * PROFILE (schermata profilo)
 */
router.get("/me/profile", authMiddleware_1.requireAuth, profileController_1.getMyProfile);
router.patch("/me/profile", authMiddleware_1.requireAuth, profileController_1.updatePlayerProfile);
/**
 * PREFERENCES
 * ⚠️ IMPORTANTE: Anche /preferences deve essere prima di /:userId
 */
router.get("/preferences", authMiddleware_1.requireAuth, profileController_1.getPreferences); // GET preferences
router.patch("/preferences", authMiddleware_1.requireAuth, profileController_1.updatePreferences); // UPDATE preferences
router.get("/me/preferences", authMiddleware_1.requireAuth, profileController_1.getPreferences); // Alias per compatibilità
router.patch("/me/preferences", authMiddleware_1.requireAuth, profileController_1.updatePreferences); // Alias per compatibilità
/**
 * SECURITY
 */
router.post("/me/change-password", authMiddleware_1.requireAuth, profileController_1.changePassword);
/**
 * GET PROFILO UTENTE PUBBLICO (solo per owner)
 * ⚠️ QUESTA DEVE ESSERE L'ULTIMA - dopo tutte le route specifiche
 */
router.get("/:userId", authMiddleware_1.requireAuth, profileController_1.getUserProfile);
exports.default = router;
