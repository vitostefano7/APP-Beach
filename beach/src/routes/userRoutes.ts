import express from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  getMyProfile,
  updatePlayerProfile,
  updatePreferences,
  updateMe,
  changePassword,
} from "../controllers/profileController";

const router = express.Router();

/**
 * USER BASE
 */
router.patch("/me", requireAuth, updateMe);

/**
 * PROFILE (schermata profilo)
 */
router.get("/me/profile", requireAuth, getMyProfile);
router.patch("/me/profile", requireAuth, updatePlayerProfile);

/**
 * PREFERENCES
 */
router.patch("/me/preferences", requireAuth, updatePreferences);

/**
 * SECURITY
 */
router.post("/me/change-password", requireAuth, changePassword);

export default router;