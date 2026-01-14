import mongoose, { Document, Schema } from "mongoose";

export interface IStrutturaFollower extends Document {
  user: mongoose.Types.ObjectId;
  struttura: mongoose.Types.ObjectId;
  status: "active" | "blocked";
  createdAt: Date;
  updatedAt: Date;
}

const StrutturaFollowerSchema = new Schema<IStrutturaFollower>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    struttura: {
      type: Schema.Types.ObjectId,
      ref: "Struttura",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indice unico per prevenire follow duplicati
StrutturaFollowerSchema.index({ user: 1, struttura: 1 }, { unique: true });

// Indici per performance
StrutturaFollowerSchema.index({ struttura: 1, status: 1, createdAt: -1 });
StrutturaFollowerSchema.index({ user: 1, status: 1, createdAt: -1 });

export default mongoose.model<IStrutturaFollower>(
  "StrutturaFollower",
  StrutturaFollowerSchema
);
