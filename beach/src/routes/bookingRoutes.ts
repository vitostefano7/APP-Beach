import express from "express";
import {
  createBooking,
  getMyBookings,
   getMyBookingsPaginated,
  getBookingById,
   addPaymentToBooking,
  cancelBooking,
  getOwnerBookings,
   getOwnerBookingsPaginated,
   getOwnerDailyRevenue,
  getBookingsByCampo,
  getOwnerBookingById,
  cancelOwnerBooking,
  getBookingByMatchId,
} from "../controllers/bookingController";

import { requireAuth } from "../middleware/authMiddleware";
import ownerOnly from "../middleware/ownerOnly";

const router = express.Router();

/* =========================
   PLAYER ROUTES
========================= */

/**
 * Crea nuova prenotazione
 * POST /bookings
 */
router.post("/", requireAuth, createBooking);

/**
 * Aggiungi pagamento a prenotazione
 * POST /bookings/:id/payments
 */
router.post("/:id/payments", requireAuth, addPaymentToBooking);

/**
 * Le mie prenotazioni
 * GET /bookings/me
 */
router.get("/me", requireAuth, getMyBookings);

/**
 * Le mie prenotazioni paginate
 * GET /bookings/me/paginated?page=1&limit=10&timeFilter=upcoming|past|invites
 */
router.get("/me/paginated", requireAuth, getMyBookingsPaginated);

/* =========================
   OWNER ROUTES
========================= */

/**
 * Tutte le prenotazioni ricevute
 * GET /bookings/owner
 */
router.get("/owner", requireAuth, ownerOnly, getOwnerBookings);

/**
 * Prenotazioni owner paginate
 * GET /bookings/owner/paginated?page=1&limit=10&timeFilter=all|upcoming|past|ongoing
 */
router.get("/owner/paginated", requireAuth, ownerOnly, getOwnerBookingsPaginated);

/**
 * Revenue giornaliera owner
 * GET /bookings/owner/revenue/daily?from=YYYY-MM-DD&to=YYYY-MM-DD&strutturaId=<id>
 */
router.get("/owner/revenue/daily", requireAuth, ownerOnly, getOwnerDailyRevenue);

/**
 * Singola prenotazione owner
 * GET /bookings/owner/:id
 */
router.get("/owner/:id", requireAuth, ownerOnly, getOwnerBookingById);

/**
 * Cancella prenotazione owner
 * DELETE /bookings/owner/:id
 */
router.delete("/owner/:id", requireAuth, ownerOnly, cancelOwnerBooking);

/**
 * Prenotazioni per un campo specifico
 * GET /bookings/campo/:campoId?date=YYYY-MM-DD
 */
router.get("/campo/:campoId", requireAuth, getBookingsByCampo);

/**
 * Recupera booking da matchId
 * GET /bookings/by-match/:matchId
 */
router.get("/by-match/:matchId", requireAuth, getBookingByMatchId);

/* =========================
   ROUTES CON PARAMETRI DINAMICI
   ⚠️ DEVONO ESSERE ALLA FINE
========================= */

/**
 * Singola prenotazione
 * GET /bookings/:id
 */
router.get("/:id", requireAuth, getBookingById);

/**
 * Cancella prenotazione
 * DELETE /bookings/:id
 */
router.delete("/:id", requireAuth, cancelBooking);

export default router;