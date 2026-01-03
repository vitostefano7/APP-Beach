"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const ownerOnly_1 = __importDefault(require("../middleware/ownerOnly"));
const ownerController_1 = require("../controllers/ownerController");
const router = express_1.default.Router();
router.use(authMiddleware_1.requireAuth, ownerOnly_1.default);
router.post("/strutture", ownerController_1.createStruttura);
router.get("/strutture", ownerController_1.getMyStrutture);
router.put("/strutture/:id", ownerController_1.updateStruttura);
router.get("/bookings", ownerController_1.getOwnerBookings);
exports.default = router;
