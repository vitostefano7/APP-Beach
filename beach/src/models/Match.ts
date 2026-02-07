import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMatchPlayer {
  user: Types.ObjectId;
  team?: "A" | "B";
  joinedAt: Date;
  status: "pending" | "confirmed" | "declined";
  respondedAt?: Date; // AGGIUNGI QUESTA PROPRIETÀ
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
  status: "open" | "full" | "completed" | "cancelled" | "not_team_completed" | "not_completed";
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
    respondedAt: { // AGGIUNGI QUESTO CAMPO
      type: Date,
      required: false,
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
      max: 99, // Aumentato per sport senza limite preciso (calcio, basket)
    },
    teamB: {
      type: Number,
      required: true,
      min: 0,
      max: 99,
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
          // Conta solo i giocatori confermati (i pending/declined non occupano slot)
          const confirmedPlayers = players.filter(p => p.status === "confirmed").length;
          return confirmedPlayers <= match.maxPlayers;
        },
        message: "Troppi giocatori per questo match",
      },
    },

    maxPlayers: {
      type: Number,
      required: true,
      min: 2,
      max: 22, // Aumentato per supportare calcio (22), basket (10) e altri sport
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
            // ✅ Altrimenti deve avere almeno 1 set, max 5 (per flessibilità)
            return sets.length >= 1 && sets.length <= 5;
          },
          message: "Un match deve avere tra 1 e 5 set",
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
      enum: ["open", "full", "completed", "cancelled", "not_team_completed", "not_completed"],
      default: "open",
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

// Validazione pre-save: team obbligatorio se maxPlayers > 2
MatchSchema.pre("save", async function () {
  const match = this as IMatch;

  // ✅ Se maxPlayers > 2, team obbligatorio
  if (match.maxPlayers > 2) {
    const playersWithoutTeam = match.players.filter((p: IMatchPlayer) => !p.team);
    if (playersWithoutTeam.length > 0) {
      throw new Error("Team obbligatorio per match con più di 2 giocatori");
    }
  }

  // ✅ Validazione sport-specifica: controlla se maxPlayers è valido per il tipo di sport
  if (match.isModified("maxPlayers") || match.isNew) {
    // Popola il booking per accedere al campo e sport
    await match.populate({
      path: "booking",
      populate: {
        path: "campo",
        populate: {
          path: "sport",
          select: "minPlayers maxPlayers name",
        },
      },
    });

    const booking = match.booking as any;
    const sport = booking?.campo?.sport;
    
    if (sport) {
      // Validazione dinamica contro Sport model
      if (match.maxPlayers < sport.minPlayers || match.maxPlayers > sport.maxPlayers) {
        throw new Error(
          `${sport.name} richiede tra ${sport.minPlayers} e ${sport.maxPlayers} giocatori`
        );
      }
    }
  }
});

export default mongoose.model<IMatch>("Match", MatchSchema);