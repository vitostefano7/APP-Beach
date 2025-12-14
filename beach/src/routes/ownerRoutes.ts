import express from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { ownerOnly } from "../middleware/ownerOnly";
import {
  createStruttura,
  getMyStrutture,
  updateStruttura,
  getOwnerBookings,
} from "../controllers/ownerController";

const router = express.Router();

router.use(requireAuth, ownerOnly);

router.post("/strutture", createStruttura);
router.get("/strutture", getMyStrutture);
router.put("/strutture/:id", updateStruttura);
router.get("/bookings", getOwnerBookings);

export default router;
