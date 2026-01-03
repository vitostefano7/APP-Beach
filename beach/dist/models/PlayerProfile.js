"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PlayerProfileSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    level: {
        type: String,
        enum: ["beginner", "amateur", "advanced"],
        default: "amateur",
    },
    matchesPlayed: { type: Number, default: 0 },
    ratingAverage: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    favoriteCampo: {
        type: mongoose_1.Types.ObjectId,
        ref: "Campo",
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("PlayerProfile", PlayerProfileSchema);
