import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    campo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campo",
      required: true,
    },

    struttura: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Struttura",
      required: true,
    },

    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true }, // in ore

    price: { type: Number, required: true },

    bookingType: {
      type: String,
      enum: ["private", "public"],
      default: "public",
      required: true,
    },

    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },

    cancelledBy: {
      type: String,
      enum: ["user", "owner", "system"],
      required: false,
    },

    cancelledReason: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
