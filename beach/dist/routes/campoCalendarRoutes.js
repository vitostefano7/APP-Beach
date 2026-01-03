"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/campoCalendarRoutes.ts
const express_1 = __importDefault(require("express"));
const campoCalendarController_1 = require("../controllers/campoCalendarController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const ownerOnly_1 = __importDefault(require("../middleware/ownerOnly"));
const router = express_1.default.Router();
/* =====================================================
   PUBLIC ROUTES
===================================================== */
/**
 * 📅 Calendario mensile
 * GET /calendar/campo/:id?month=YYYY-MM
 */
router.get("/campo/:id", campoCalendarController_1.getCampoCalendarByMonth);
/* =====================================================
   OWNER ROUTES
===================================================== */
/**
 * ⏱️ Modifica singolo slot
 * PUT /calendar/campo/:campoId/date/:date/slot
 */
router.put("/campo/:campoId/date/:date/slot", authMiddleware_1.requireAuth, ownerOnly_1.default, campoCalendarController_1.updateCalendarSlot);
/**
 * 🔒 Chiude una giornata
 * DELETE /calendar/campo/:campoId/date/:date
 */
router.delete("/campo/:campoId/date/:date", authMiddleware_1.requireAuth, ownerOnly_1.default, campoCalendarController_1.closeCalendarDay);
/**
 * 🔓 Riapre una giornata
 * POST /calendar/campo/:campoId/date/:date/reopen
 */
router.post("/campo/:campoId/date/:date/reopen", authMiddleware_1.requireAuth, ownerOnly_1.default, campoCalendarController_1.reopenCalendarDay);
exports.default = router;
