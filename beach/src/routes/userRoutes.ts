import express from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  getUserProfile,
  getMyProfile,
  updatePlayerProfile,
  getPreferences,
  updatePreferences,
  updateMe,
  changePassword,
  uploadAvatar,
  deleteAvatar,
} from "../controllers/profileController";
import { uploadAvatar as uploadMiddleware } from "../middleware/uploadProfiloImages";

const router = express.Router();

/**
 * ⚠️ ORDINE IMPORTANTE: Route specifiche (/me/*, /preferences) PRIMA di route generiche (/:userId)
 * Altrimenti Express interpreta stringhe come "me" o "preferences" come userId!
 */

/**
 * USER BASE
 */
router.patch("/me", requireAuth, updateMe);

/**
 * AVATAR UPLOAD
 * ✅ NUOVO: Upload e gestione immagine profilo
 */
router.post(
  "/me/avatar", 
  requireAuth, 
  uploadMiddleware.single("avatar"), 
  uploadAvatar
);
router.delete("/me/avatar", requireAuth, deleteAvatar);

/**
 * PROFILE (schermata profilo)
 */
router.get("/me/profile", requireAuth, getMyProfile);
router.patch("/me/profile", requireAuth, updatePlayerProfile);

/**
 * PREFERENCES
 * ⚠️ IMPORTANTE: Anche /preferences deve essere prima di /:userId
 */
router.get("/preferences", requireAuth, getPreferences); // GET preferences
router.patch("/preferences", requireAuth, updatePreferences); // UPDATE preferences
router.get("/me/preferences", requireAuth, getPreferences); // Alias per compatibilità
router.patch("/me/preferences", requireAuth, updatePreferences); // Alias per compatibilità

/**
 * SECURITY
 */
router.post("/me/change-password", requireAuth, changePassword);

/**
 * GET PROFILO UTENTE PUBBLICO (solo per owner)
 * ⚠️ QUESTA DEVE ESSERE L'ULTIMA - dopo tutte le route specifiche
 */
router.get("/:userId", requireAuth, getUserProfile);

export default router;