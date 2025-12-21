import { Schema, model, Types } from "mongoose";

const PaymentMethodSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    provider: { type: String, default: "stripe" },
    brand: { type: String },        // visa, mastercard
    last4: { type: String },        // "4242"
    expMonth: { type: Number },
    expYear: { type: Number },

    isDefault: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model("PaymentMethod", PaymentMethodSchema);
