"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserPreferencesSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        unique: true,
        required: true,
        index: true,
    },
    // ========== NOTIFICHE E TEMA ==========
    pushNotifications: {
        type: Boolean,
        default: true
    },
    darkMode: {
        type: Boolean,
        default: false
    },
    // ========== PRIVACY ==========
    privacyLevel: {
        type: String,
        enum: ["public", "friends", "private"],
        default: "public",
    },
    // ========== LOCATION PREFERITA ==========
    preferredLocation: {
        city: String,
        address: String,
        lat: Number,
        lng: Number,
        radius: {
            type: Number,
            default: 30, // ✅ 30 km di default
            min: 1,
            max: 100,
        },
    },
    // ========== STRUTTURE FAVORITE ==========
    favoriteStrutture: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: "Struttura",
        default: [],
    },
    // ========== SPORT PREFERITI ==========
    favoriteSports: {
        type: [String],
        enum: ["Beach Volley", "Volley"],
        default: [],
    },
    // ========== FASCIA ORARIA PREFERITA ==========
    preferredTimeSlot: {
        type: String,
        enum: ["morning", "afternoon", "evening"],
    },
}, {
    timestamps: true
});
// Indice per query veloci sulle strutture favorite
UserPreferencesSchema.index({ favoriteStrutture: 1 });
exports.default = (0, mongoose_1.model)("UserPreferences", UserPreferencesSchema);
