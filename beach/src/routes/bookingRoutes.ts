import express from "express";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  getOwnerBookings,
} from "../controllers/bookingController";

import { requireAuth } from "../middleware/authMiddleware";
import ownerOnly from "../middleware/ownerOnly";

const router = express.Router();

/* =========================
   PLAYER
========================= */

router.post("/", requireAuth, createBooking);
router.get("/me", requireAuth, getMyBookings);
router.delete("/:id", requireAuth, cancelBooking);

/* =========================
   OWNER
========================= */

router.get(
  "/owner",
  requireAuth,
  ownerOnly,
  getOwnerBookings
);

export default router;
