import express from "express";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
} from "../controllers/bookingController";
import { requireAuth } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", requireAuth, createBooking);
router.get("/me", requireAuth, getMyBookings);
router.delete("/:id", requireAuth, cancelBooking);

export default router;
