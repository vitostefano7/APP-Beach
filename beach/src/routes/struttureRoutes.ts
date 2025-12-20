import express from "express";
import {
  getStrutture,
  getStrutturaById,
  getCampiByStruttura,
  getOwnerStrutture,
} from "../controllers/struttureController";

import { requireAuth } from "../middleware/authMiddleware";
import ownerOnly from "../middleware/ownerOnly";

const router = express.Router();

/* =========================
   OWNER (PRIMA!)
========================= */

router.get(
  "/owner/me",
  requireAuth,
  ownerOnly,
  getOwnerStrutture
);

/* =========================
   PLAYER
========================= */

router.get("/", getStrutture);
router.get("/:id/campi", getCampiByStruttura);
router.get("/:id", getStrutturaById);

export default router;
