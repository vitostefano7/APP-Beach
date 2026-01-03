"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const matchController_1 = require("../controllers/matchController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post("/from-booking/:bookingId", authMiddleware_1.requireAuth, matchController_1.createMatchFromBooking);
exports.default = router;
