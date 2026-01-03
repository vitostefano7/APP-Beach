"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerOnly = playerOnly;
function playerOnly(req, res, next) {
    if (req.user?.role !== "player") {
        return res.status(403).json({ message: "Solo per player" });
    }
    next();
}
