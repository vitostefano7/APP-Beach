import express from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  createNotificationEndpoint
} from "../controllers/notificationController";

const router = express.Router();

// Applica middleware di autenticazione a tutte le route
router.use(requireAuth);

// Route per le notifiche
router.post("/", createNotificationEndpoint);
router.get("/me", getMyNotifications);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);
router.get("/unread-count", getUnreadCount);
router.delete("/:id", deleteNotification);

export default router;
