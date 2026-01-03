"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// campiRoutes.ts
const express_1 = __importDefault(require("express"));
const campiController_1 = require("../controllers/campiController");
const campoCalendarController_1 = require("../controllers/campoCalendarController");
const campiPricingController_1 = require("../controllers/campiPricingController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const ownerOnly_1 = __importDefault(require("../middleware/ownerOnly"));
const router = express_1.default.Router();
/* =====================================================
   OWNER ROUTES
===================================================== */
router.get("/owner/struttura/:id", authMiddleware_1.requireAuth, ownerOnly_1.default, campiController_1.getAllCampiByStruttura);
router.post("/", authMiddleware_1.requireAuth, ownerOnly_1.default, campiController_1.createCampi);
router.put("/:id", authMiddleware_1.requireAuth, ownerOnly_1.default, campiController_1.updateCampo);
router.delete("/:id", authMiddleware_1.requireAuth, ownerOnly_1.default, campiController_1.deleteCampo);
/* =====================================================
   CALENDAR MANAGEMENT - OWNER
===================================================== */
router.delete("/:campoId/calendar/:date", authMiddleware_1.requireAuth, ownerOnly_1.default, campoCalendarController_1.closeCalendarDay);
router.post("/:campoId/calendar/:date/reopen", authMiddleware_1.requireAuth, ownerOnly_1.default, campoCalendarController_1.reopenCalendarDay);
router.put("/:campoId/calendar/:date/slot", authMiddleware_1.requireAuth, ownerOnly_1.default, campoCalendarController_1.updateCalendarSlot);
/* =====================================================
   PRICING MANAGEMENT - OWNER & PUBLIC
===================================================== */
// GET pricing rules (public - per mostrare prezzi agli utenti)
router.get("/:id/pricing", campiPricingController_1.getCampoPricing);
// UPDATE pricing rules (owner only)
router.put("/:id/pricing", authMiddleware_1.requireAuth, ownerOnly_1.default, campiPricingController_1.updateCampoPricing);
/* =====================================================
   PUBLIC ROUTES
===================================================== */
router.get("/struttura/:id", campiController_1.getCampiByStruttura);
router.get("/:id/calendar", campoCalendarController_1.getCampoCalendarByMonth);
router.get("/:id", campiController_1.getCampoById);
exports.default = router;
