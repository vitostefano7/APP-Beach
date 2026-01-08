import express from "express";
import { requireAuth } from "../middleware/authMiddleware";

// ✅ Tutte le funzioni da profileController
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
  searchUsers,
  getUserPublicProfile,
  getUserPublicProfileById,
  getUserMatches,
  getPlayedWith,
  getFrequentedVenues,
  getUserStats,
} from "../controllers/profileController";

import { uploadAvatar as uploadMiddleware } from "../middleware/uploadProfiloImages";

const router = express.Router();

/**
 * SEARCH & SOCIAL
 */
router.get("/search", requireAuth, searchUsers);
router.get("/me/played-with", requireAuth, getPlayedWith);
router.get("/me/frequented-venues", requireAuth, getFrequentedVenues);
router.get("/me/stats", requireAuth, getUserStats);

/**
 * USER BASE
 */
router.patch("/me", requireAuth, updateMe);

/**
 * AVATAR UPLOAD
 */
router.post(
  "/me/avatar",
  requireAuth,
  uploadMiddleware.single("avatar"),
  uploadAvatar
);
router.delete("/me/avatar", requireAuth, deleteAvatar);

/**
 * PROFILE
 */
router.get("/me/profile", requireAuth, getMyProfile);
router.patch("/me/profile", requireAuth, updatePlayerProfile);

/**
 * PREFERENCES
 */
router.get("/preferences", requireAuth, getPreferences);
router.patch("/preferences", requireAuth, updatePreferences);
router.get("/me/preferences", requireAuth, getPreferences);
router.patch("/me/preferences", requireAuth, updatePreferences);

/**
 * SECURITY
 */
router.post("/me/change-password", requireAuth, changePassword);

/**
 * PUBLIC PROFILES (devono essere dopo /me/*)
 */
router.get("/:userId/public-profile", requireAuth, getUserPublicProfileById);
router.get("/:username/profile", requireAuth, getUserPublicProfile);
router.get("/:username/matches", requireAuth, getUserMatches);

/**
 * GET PROFILO UTENTE (per owner - legacy)
 */
router.get("/:userId", requireAuth, getUserProfile);

export default router;