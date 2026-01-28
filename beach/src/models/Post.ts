import mongoose, { Document, Schema } from "mongoose";

export interface IComment {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  struttura?: mongoose.Types.ObjectId; // Ref to Struttura if commented by owner for a struttura
  text: string;
  createdAt: Date;
}

export interface IPost extends Document {
  user: mongoose.Types.ObjectId;
  content: string;
  image?: string; // Cloudinary URL
  likes: mongoose.Types.ObjectId[];
  comments: IComment[];
  struttura?: mongoose.Types.ObjectId; // Ref to Struttura if posted by owner
  isStrutturaPost: boolean; // True if posted by owner for a struttura
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    struttura: {
      type: Schema.Types.ObjectId,
      ref: "Struttura",
      default: null,
    },
    text: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const PostSchema = new Schema<IPost>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [CommentSchema],
    struttura: {
      type: Schema.Types.ObjectId,
      ref: "Struttura",
      default: null,
      index: true,
    },
    isStrutturaPost: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indici per performance
PostSchema.index({ createdAt: -1 });
PostSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IPost>("Post", PostSchema);
