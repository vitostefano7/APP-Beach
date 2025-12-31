import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  user: mongoose.Types.ObjectId;
  struttura: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  lastMessage: string;
  lastMessageAt: Date;
  unreadByUser: number;
  unreadByOwner: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    struttura: {
      type: Schema.Types.ObjectId,
      ref: 'Struttura',
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadByUser: {
      type: Number,
      default: 0,
    },
    unreadByOwner: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indice composto per trovare velocemente le conversazioni
ConversationSchema.index({ user: 1, struttura: 1 }, { unique: true });
ConversationSchema.index({ owner: 1, lastMessageAt: -1 });
ConversationSchema.index({ user: 1, lastMessageAt: -1 });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);