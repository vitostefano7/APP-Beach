import express from "express";
import {
  createStruttura,
  getMyStrutture,
  updateStruttura,
  getOwnerBookings,
} from "../controllers/ownerController";
import { authMiddleware } from "../middleware/authMiddleware";
import { ownerOnly } from "../middleware/ownerOnly";

const router = express.Router();

router.use(authMiddleware);
router.use(ownerOnly);

router.post("/strutture", createStruttura);
router.get("/strutture", getMyStrutture);
router.put("/strutture/:id", updateStruttura);
router.get("/bookings", getOwnerBookings);

export default router;
