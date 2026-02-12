import express from "express";
import { register, login, checkAvailability } from "../controllers/authController";
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

/**
 * GET /auth/check-availability?username=xxx&email=yyy
 * ✅ Verifica disponibilità username ed email in tempo reale
 */
router.get("/check-availability", checkAvailability);

export default router;