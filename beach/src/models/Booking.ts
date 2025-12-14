import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    struttura: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Struttura", // ✅ NOME MODELLO CORRETTO
      required: true,
    },

    date: {
      type: String, // "2025-01-20"
      required: true,
    },

    startTime: {
      type: String, // "14:00"
      required: true,
    },

    endTime: {
      type: String, // "15:00"
      required: true,
    },

    durationHours: {
      type: Number,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
