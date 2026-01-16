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

    numberOfPeople: { type: Number, required: false },

    unitPrice: { type: Number, required: false },

    price: { type: Number, required: true },

    // Pagamenti registrati per questa prenotazione
    payments: {
      type: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          amount: { type: Number, required: true },
          method: { type: String, required: false },
          status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    bookingType: {
      type: String,
      enum: ["private", "public"],
      default: "public",
      required: true,
    },

    paymentMode: {
      type: String,
      enum: ["full", "split"],
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

  // Virtuals are computed in controllers when needed; keep schema minimal

export default mongoose.model("Booking", bookingSchema);
