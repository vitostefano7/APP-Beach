"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const struttureController_1 = require("../controllers/struttureController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const ownerOnly_1 = __importDefault(require("../middleware/ownerOnly"));
const router = express_1.default.Router();
/* =========================
   UTILITY (PUBLIC)
========================= */
router.get("/search-address", struttureController_1.searchAddress);
/* =========================
   OWNER ROUTES
========================= */
router.get("/owner/me", authMiddleware_1.requireAuth, ownerOnly_1.default, struttureController_1.getOwnerStrutture);
router.post("/", authMiddleware_1.requireAuth, ownerOnly_1.default, struttureController_1.createStruttura);
router.put("/:id", authMiddleware_1.requireAuth, ownerOnly_1.default, struttureController_1.updateStruttura);
router.delete("/:id", authMiddleware_1.requireAuth, ownerOnly_1.default, struttureController_1.deleteStruttura);
/* =========================
   PLAYER ROUTES
========================= */
router.get("/", struttureController_1.getStrutture);
router.get("/:id/campi", struttureController_1.getCampiByStruttura);
router.get("/:id", struttureController_1.getStrutturaById);
exports.default = router;
