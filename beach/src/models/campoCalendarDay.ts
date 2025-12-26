import mongoose, { Schema, Document } from "mongoose";

interface Slot {
  time: string;
  enabled: boolean;
}

export interface CampoCalendarDayDocument extends Document {
  campo: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  slots: Slot[];
  isClosed: boolean;
}

const SlotSchema = new Schema(
  {
    time: { type: String, required: true },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const CampoCalendarDaySchema = new Schema<CampoCalendarDayDocument>(
  {
    campo: {
      type: Schema.Types.ObjectId,
      ref: "Campo",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    slots: {
      type: [SlotSchema],
      required: true,
      default: [],
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

CampoCalendarDaySchema.index({ campo: 1, date: 1 }, { unique: true });

export default mongoose.models.CampoCalendarDay ||
  mongoose.model<CampoCalendarDayDocument>(
    "CampoCalendarDay",
    CampoCalendarDaySchema
  );