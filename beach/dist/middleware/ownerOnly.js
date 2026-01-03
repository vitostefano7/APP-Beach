"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ownerOnly;
function ownerOnly(req, res, next) {
    if (req.user?.role !== "owner") {
        return res.status(403).json({ message: "Accesso riservato agli owner" });
    }
    next();
}
