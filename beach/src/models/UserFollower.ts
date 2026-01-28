import mongoose, { Document, Schema } from "mongoose";

export interface IUserFollower extends Document {
  struttura: mongoose.Types.ObjectId; // Struttura che segue
  user: mongoose.Types.ObjectId; // Utente seguito
  status: "active" | "blocked";
  createdAt: Date;
  updatedAt: Date;
}

const UserFollowerSchema = new Schema<IUserFollower>(
  {
    struttura: {
      type: Schema.Types.ObjectId,
      ref: "Struttura",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
UserFollowerSchema.index({ struttura: 1, user: 1 }, { unique: true });

// Indici per performance
UserFollowerSchema.index({ user: 1, status: 1, createdAt: -1 });
UserFollowerSchema.index({ struttura: 1, status: 1, createdAt: -1 });

export default mongoose.model<IUserFollower>(
  "UserFollower",
  UserFollowerSchema
);
