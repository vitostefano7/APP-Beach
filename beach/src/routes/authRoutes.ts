import express from "express";
import { register, login } from "../controllers/authController";
import { uploadAvatar } from "../middleware/uploadProfiloImages";

const router = express.Router();

/**
 * POST /auth/register
 * ✅ Supporta upload avatar opzionale durante registrazione
 */
router.post("/register", uploadAvatar.single("avatar"), register);

/**
 * POST /auth/login
 */
router.post("/login", login);

export default router;