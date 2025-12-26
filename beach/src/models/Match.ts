import { Schema, model, Types } from "mongoose";

/**
 * Match = risultato di una prenotazione conclusa
 * - 3 set max
 * - vince chi ne vince 2
 */
const MatchSchema = new Schema(
  {
    // 🔗 Prenotazione di riferimento
    booking: {
      type: Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true, // 1 match per booking
      index: true,
    },

    // 📊 Punteggi
    score: {
      sets: {
        type: [
          {
            teamA: {
              type: Number,
              required: true,
              min: 0,
              max: 21,
            },
            teamB: {
              type: Number,
              required: true,
              min: 0,
              max: 21,
            },
          },
        ],
        validate: {
          validator: (v: any[]) => v.length >= 2 && v.length <= 3,
          message: "Un match deve avere 2 o 3 set",
        },
      },
    },

    // 🏆 Vincitore del match
    winner: {
      type: String,
      enum: ["A", "B"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("Match", MatchSchema);
