import express from "express";
import {
  getStrutture,
  getStrutturaById,
  getCampiByStruttura,
  getOwnerStrutture,
  createStruttura,
  updateStruttura,
  deleteStruttura,
  searchAddress,
} from "../controllers/struttureController";
import { requireAuth } from "../middleware/authMiddleware";
import ownerOnly from "../middleware/ownerOnly";

const router = express.Router();

/* =========================
   UTILITY (PUBLIC)
========================= */
router.get("/search-address", searchAddress);

/* =========================
   OWNER ROUTES
========================= */
router.get(
  "/owner/me",
  requireAuth,
  ownerOnly,
  getOwnerStrutture
);

router.post(
  "/",
  requireAuth,
  ownerOnly,
  createStruttura
);

router.put(
  "/:id",
  requireAuth,
  ownerOnly,
  updateStruttura
);

router.delete(
  "/:id",
  requireAuth,
  ownerOnly,
  deleteStruttura
);

/* =========================
   PLAYER ROUTES
========================= */
router.get("/", getStrutture);
router.get("/:id/campi", getCampiByStruttura);
router.get("/:id", getStrutturaById);

export default router;