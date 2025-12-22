import express from "express";
import {
  getCampiByStruttura,
  getAllCampiByStruttura,
  createCampi,
  getCampoById,
  updateCampo,
  deleteCampo,
} from "../controllers/campiController";
import { requireAuth } from "../middleware/authMiddleware";
import ownerOnly from "../middleware/ownerOnly";

const router = express.Router();

/* =========================
   OWNER ROUTES (PRIMA!)
========================= */
router.get("/owner/struttura/:id", requireAuth, ownerOnly, getAllCampiByStruttura);
router.post("/", requireAuth, ownerOnly, createCampi);
router.put("/:id", requireAuth, ownerOnly, updateCampo);
router.delete("/:id", requireAuth, ownerOnly, deleteCampo);

/* =========================
   PUBLIC ROUTES
========================= */
router.get("/struttura/:id", getCampiByStruttura);
router.get("/:id", getCampoById);

export default router;