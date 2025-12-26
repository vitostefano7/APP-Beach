// src/routes/campoCalendarRoutes.ts
import express from "express";
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
   PUBLIC ROUTES
===================================================== */

/**
 * 📅 Calendario mensile
 * GET /calendar/campo/:id?month=YYYY-MM
 */
router.get("/campo/:id", getCampoCalendarByMonth);

/* =====================================================
   OWNER ROUTES
===================================================== */

/**
 * ⏱️ Modifica singolo slot
 * PUT /calendar/campo/:campoId/date/:date/slot
 */
router.put(
  "/campo/:campoId/date/:date/slot",
  requireAuth,
  ownerOnly,
  updateCalendarSlot
);

/**
 * 🔒 Chiude una giornata
 * DELETE /calendar/campo/:campoId/date/:date
 */
router.delete(
  "/campo/:campoId/date/:date",
  requireAuth,
  ownerOnly,
  closeCalendarDay
);

/**
 * 🔓 Riapre una giornata
 * POST /calendar/campo/:campoId/date/:date/reopen
 */
router.post(
  "/campo/:campoId/date/:date/reopen",
  requireAuth,
  ownerOnly,
  reopenCalendarDay
);

export default router;
