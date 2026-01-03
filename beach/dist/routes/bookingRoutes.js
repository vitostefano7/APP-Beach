"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bookingController_1 = require("../controllers/bookingController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const ownerOnly_1 = __importDefault(require("../middleware/ownerOnly"));
const router = express_1.default.Router();
/* =========================
   PLAYER ROUTES
========================= */
/**
 * Crea nuova prenotazione
 * POST /bookings
 */
router.post("/", authMiddleware_1.requireAuth, bookingController_1.createBooking);
/**
 * Le mie prenotazioni
 * GET /bookings/me
 */
router.get("/me", authMiddleware_1.requireAuth, bookingController_1.getMyBookings);
/* =========================
   OWNER ROUTES
========================= */
/**
 * Tutte le prenotazioni ricevute
 * GET /bookings/owner
 */
router.get("/owner", authMiddleware_1.requireAuth, ownerOnly_1.default, bookingController_1.getOwnerBookings);
/**
 * Singola prenotazione owner
 * GET /bookings/owner/:id
 */
router.get("/owner/:id", authMiddleware_1.requireAuth, ownerOnly_1.default, bookingController_1.getOwnerBookingById);
/**
 * Cancella prenotazione owner
 * DELETE /bookings/owner/:id
 */
router.delete("/owner/:id", authMiddleware_1.requireAuth, ownerOnly_1.default, bookingController_1.cancelOwnerBooking);
/**
 * Prenotazioni per un campo specifico
 * GET /bookings/campo/:campoId?date=YYYY-MM-DD
 */
router.get("/campo/:campoId", authMiddleware_1.requireAuth, bookingController_1.getBookingsByCampo);
/* =========================
   ROUTES CON PARAMETRI DINAMICI
   ⚠️ DEVONO ESSERE ALLA FINE
========================= */
/**
 * Singola prenotazione
 * GET /bookings/:id
 */
router.get("/:id", authMiddleware_1.requireAuth, bookingController_1.getBookingById);
/**
 * Cancella prenotazione
 * DELETE /bookings/:id
 */
router.delete("/:id", authMiddleware_1.requireAuth, bookingController_1.cancelBooking);
exports.default = router;
