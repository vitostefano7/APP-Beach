import express from "express";
import { requireAuth } from "../middleware/authMiddleware";
import {
  upload,
  addStrutturaImage,
  deleteStrutturaImage,
  setMainStrutturaImage,
} from "../controllers/strutturaImagesController";

const router = express.Router();

/**
 * POST /:id/images
 * Upload nuova immagine
 */
router.post(
  "/:id/images",
  requireAuth,
  upload.single("image"),
  addStrutturaImage
);

/**
 * DELETE /:id/images
 * Elimina immagine
 * Body: { imageUrl: string }
 */
router.delete(
  "/:id/images",
  requireAuth,
  deleteStrutturaImage
);

/**
 * PUT /:id/images/main
 * Imposta immagine principale
 * Body: { imageUrl: string }
 */
router.put(
  "/:id/images/main",
  requireAuth,
  setMainStrutturaImage
);

export default router;