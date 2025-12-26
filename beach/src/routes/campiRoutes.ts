// campiRoutes.ts
import express from "express";
import {
  getCampiByStruttura,
  getAllCampiByStruttura,
  getCampoById,
  createCampi,
  updateCampo,
  deleteCampo,
} from "../controllers/campiController";
import {
  getCampoCalendarByMonth,
  updateCalendarSlot,
  closeCalendarDay,
  reopenCalendarDay,
} from "../controllers/campoCalendarController";
import { requireAuth } from "../middleware/authMiddleware";
import ownerOnly from "../middleware/ownerOnly";

const router = express.Router();

/* =====================================================
   OWNER ROUTES
===================================================== */
router.get("/owner/struttura/:id", requireAuth, ownerOnly, getAllCampiByStruttura);
router.post("/", requireAuth, ownerOnly, createCampi);
router.put("/:id", requireAuth, ownerOnly, updateCampo);
router.delete("/:id", requireAuth, ownerOnly, deleteCampo);

/* =====================================================
   CALENDAR MANAGEMENT - OWNER
===================================================== */
router.delete("/:campoId/calendar/:date", requireAuth, ownerOnly, closeCalendarDay);
router.post("/:campoId/calendar/:date/reopen", requireAuth, ownerOnly, reopenCalendarDay);
router.put("/:campoId/calendar/:date/slot", requireAuth, ownerOnly, updateCalendarSlot);

/* =====================================================
   PUBLIC ROUTES
===================================================== */
router.get("/struttura/:id", getCampiByStruttura);
router.get("/:id/calendar", getCampoCalendarByMonth);
router.get("/:id", getCampoById);

export default router;