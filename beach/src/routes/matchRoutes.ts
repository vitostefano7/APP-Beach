import { Router } from "express";
import { createMatchFromBooking } from "../controllers/matchController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.post(
  "/from-booking/:bookingId",
  requireAuth,
  createMatchFromBooking
);

export default router;
