"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const strutturaImagesController_1 = require("../controllers/strutturaImagesController");
const router = express_1.default.Router();
/**
 * POST /:id/images
 * Upload nuova immagine
 */
router.post("/:id/images", authMiddleware_1.requireAuth, strutturaImagesController_1.upload.single("image"), strutturaImagesController_1.addStrutturaImage);
/**
 * DELETE /:id/images
 * Elimina immagine
 * Body: { imageUrl: string }
 */
router.delete("/:id/images", authMiddleware_1.requireAuth, strutturaImagesController_1.deleteStrutturaImage);
/**
 * PUT /:id/images/main
 * Imposta immagine principale
 * Body: { imageUrl: string }
 */
router.put("/:id/images/main", authMiddleware_1.requireAuth, strutturaImagesController_1.setMainStrutturaImage);
exports.default = router;
