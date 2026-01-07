import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  // Campi per chat diretta (1-a-1 Player ↔ Owner)
  user?: mongoose.Types.ObjectId;
  struttura?: mongoose.Types.ObjectId;
  owner?: mongoose.Types.ObjectId;
  
  // Campi per chat di gruppo
  type: 'direct' | 'group';
  participants: mongoose.Types.ObjectId[];  // Array di user IDs
  match?: mongoose.Types.ObjectId;          // Riferimento al match
  groupName?: string;                        // Nome del gruppo (es. "Partita 29/12")
  
  // Campi comuni
  lastMessage: string;
  lastMessageAt: Date;
  
  // Unread gestito come oggetto per supportare sia direct che group
  unreadByUser: number;   // Mantenuto per retrocompatibilità chat dirette
  unreadByOwner: number;  // Mantenuto per retrocompatibilità chat dirette
  unreadCount: Map<string, number>;  // Per chat di gruppo: userId -> count
  
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
  {
    // Tipo di conversazione
    type: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
      required: true,
    },
    
    // Campi per chat diretta (opzionali per gruppi)
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function(this: IConversation) {
        return this.type === 'direct';
      },
    },
    struttura: {
      type: Schema.Types.ObjectId,
      ref: 'Struttura',
      required: function(this: IConversation) {
        return this.type === 'direct';
      },
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function(this: IConversation) {
        return this.type === 'direct';
      },
    },
    
    // Campi per chat di gruppo
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    match: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
    },
    groupName: {
      type: String,
    },
    
    // Campi comuni
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    
    // Unread - mantenuto per retrocompatibilità
    unreadByUser: {
      type: Number,
      default: 0,
    },
    unreadByOwner: {
      type: Number,
      default: 0,
    },
    
    // Unread per gruppi - Map di userId -> count
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Indice composto per trovare velocemente le conversazioni
// Per chat dirette: unique su user + struttura
ConversationSchema.index({ type: 1, user: 1, struttura: 1 }, { 
  unique: true,
  partialFilterExpression: { type: 'direct' }
});

// Per chat di gruppo: unique su match (un solo gruppo per match)
ConversationSchema.index({ type: 1, match: 1 }, { 
  unique: true,
  partialFilterExpression: { type: 'group' }
});

// Indici per ricerca veloce
ConversationSchema.index({ owner: 1, lastMessageAt: -1 });
ConversationSchema.index({ user: 1, lastMessageAt: -1 });
ConversationSchema.index({ participants: 1, lastMessageAt: -1 });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);