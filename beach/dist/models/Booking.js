"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bookingSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    campo: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Campo",
        required: true,
    },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    price: { type: Number, required: true },
    status: {
        type: String,
        enum: ["confirmed", "cancelled"],
        default: "confirmed",
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Booking", bookingSchema);
