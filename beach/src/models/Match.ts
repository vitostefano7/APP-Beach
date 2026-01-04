import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMatchPlayer {
  user: Types.ObjectId;
  team?: "A" | "B";
  joinedAt: Date;
  status: "pending" | "confirmed" | "declined";
}

export interface IMatchSet {
  teamA: number;
  teamB: number;
}

export interface IMatch extends Document {
  booking: Types.ObjectId;
  createdBy: Types.ObjectId;
  players: IMatchPlayer[];
  maxPlayers: number;
  isPublic: boolean;
  score?: {
    sets: IMatchSet[];
  };
  winner?: "A" | "B" | "draw";
  playedAt?: Date;
  event?: Types.ObjectId;
  status: "draft" | "open" | "full" | "completed" | "cancelled";
  notes?: string;
}

const MatchPlayerSchema = new Schema<IMatchPlayer>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    team: {
      type: String,
      enum: ["A", "B"],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "declined"],
      default: "pending",
    },
  },
  { _id: false }
);

const MatchSetSchema = new Schema<IMatchSet>(
  {
    teamA: {
      type: Number,
      required: true,
      min: 0,
      max: 30,
    },
    teamB: {
      type: Number,
      required: true,
      min: 0,
      max: 30,
    },
  },
  { _id: false }
);

const MatchSchema = new Schema<IMatch>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    players: {
      type: [MatchPlayerSchema],
      default: [],
      validate: {
        validator: function (players: IMatchPlayer[]) {
          const match = this as IMatch;
          return players.length <= match.maxPlayers;
        },
        message: "Troppi giocatori per questo match",
      },
    },

    maxPlayers: {
      type: Number,
      required: true,
      min: 2,
      max: 8,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    score: {
      sets: {
        type: [MatchSetSchema],
        validate: {
          validator: function (sets: IMatchSet[]) {
            // ✅ Array vuoto = match non ancora giocato (valido)
            if (!sets || sets.length === 0) return true;
            // ✅ Altrimenti deve avere 2 o 3 set
            return sets.length >= 2 && sets.length <= 3;
          },
          message: "Un match deve avere 2 o 3 set",
        },
      },
    },

    winner: {
      type: String,
      enum: ["A", "B", "draw"],
    },

    playedAt: {
      type: Date,
    },

    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },

    status: {
      type: String,
      enum: ["draft", "open", "full", "completed", "cancelled"],
      default: "draft",
    },

    notes: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Index composti
MatchSchema.index({ createdBy: 1, status: 1 });
MatchSchema.index({ "players.user": 1, status: 1 });

// Virtual per contare giocatori confermati
MatchSchema.virtual("confirmedPlayersCount").get(function () {
  return this.players.filter((p: IMatchPlayer) => p.status === "confirmed").length;
});

// Method per verificare se è pieno
MatchSchema.methods.isFull = function () {
  const confirmed = this.players.filter((p: IMatchPlayer) => p.status === "confirmed").length;
  return confirmed >= this.maxPlayers;
};

// Validazione pre-save: team obbligatorio se maxPlayers > 2 E match non in draft
MatchSchema.pre("save", function () {
  const match = this as IMatch;

  // ✅ Se il match è in draft, non serve il team
  if (match.status === "draft") {
    return;
  }

  // ✅ Se maxPlayers > 2 E status non è draft, team obbligatorio
  if (match.maxPlayers > 2) {
    const playersWithoutTeam = match.players.filter((p: IMatchPlayer) => !p.team);
    if (playersWithoutTeam.length > 0) {
      throw new Error("Team obbligatorio per match con più di 2 giocatori");
    }
  }
});

export default mongoose.model<IMatch>("Match", MatchSchema);