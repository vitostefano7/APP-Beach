import mongoose, { Schema, Document } from 'mongoose';

export type ScoringSystemType = 'set-based' | 'point-based' | 'game-based';

export interface IScoringRules {
  // Per set-based (volley, beach volley)
  setsToWin?: number; // es. 2 (best of 3)
  pointsPerSet?: number; // es. 25 per volley, 21 per beach volley
  tiebreakAdvantage?: number; // es. 2 per deuce
  
  // Per game-based (beach tennis)
  gamesToWin?: number; // es. 7 o 9
  tiebreakPoints?: number; // es. 7 per tiebreak
  
  // Per point-based (calcio, basket, etc.)
  allowsDraw?: boolean; // es. true per calcio, false per basket playoff
}

export interface ISport extends Document {
  name: string; // "Beach Volley", "Calcio", etc.
  code: string; // "beach_volley", "calcio", etc.
  icon: string; // Nome icona MaterialCommunityIcons
  color: string; // Colore hex per UI
  
  // Regole partecipanti
  minPlayers: number;
  maxPlayers: number;
  allowedFormations: string[]; // es. ["2v2", "3v3", "4v4"]
  requiresEvenPlayers: boolean; // true per sport a squadre bilanciate
  
  // Ambienti consentiti
  allowsIndoor: boolean;
  allowsOutdoor: boolean;
  
  // Superfici raccomandate per ambiente (opzionale, non vincolante)
  recommendedSurfaces?: {
    indoor?: string[];   // es. ["pvc"] per volley indoor
    outdoor?: string[];  // es. ["cement"] per volley outdoor
    any?: string[];      // es. ["sand"] per beach volley (valido sia indoor che outdoor)
  };
  
  // Pricing
  allowsPlayerPricing: boolean; // Se true, permette split costi tra giocatori
  
  // Sistema di punteggio
  scoringSystem: ScoringSystemType;
  scoringRules: IScoringRules;
  
  // Metadata
  isActive: boolean;
  sortOrder: number; // Per ordinamento in UI
  createdAt: Date;
  updatedAt: Date;
  
  // Metodi istanza
  validatePlayerCount(playerCount: number): boolean;
  validateFormation(formation: string): boolean;
  getDisplayName(): string;
}

// Interface per metodi statici
export interface ISportModel extends mongoose.Model<ISport> {
  findByCode(code: string): Promise<ISport | null>;
  getActiveSports(): Promise<ISport[]>;
  getSportsForEnvironment(environment: 'indoor' | 'outdoor'): Promise<ISport[]>;
}

const SportSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Il nome dello sport è obbligatorio'],
      trim: true,
      maxlength: [50, 'Il nome non può superare 50 caratteri'],
    },
    code: {
      type: String,
      required: [true, 'Il codice dello sport è obbligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9_]+$/, 'Il codice può contenere solo lettere minuscole, numeri e underscore'],
    },
    icon: {
      type: String,
      required: true,
      default: 'basketball',
    },
    color: {
      type: String,
      required: true,
      default: '#2196F3',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Il colore deve essere in formato hex (#RRGGBB)'],
    },
    minPlayers: {
      type: Number,
      required: [true, 'Il numero minimo di giocatori è obbligatorio'],
      min: [1, 'Il numero minimo di giocatori deve essere almeno 1'],
      validate: {
        validator: function (this: ISport, v: number) {
          return v <= this.maxPlayers;
        },
        message: 'Il numero minimo di giocatori non può superare il massimo',
      },
    },
    maxPlayers: {
      type: Number,
      required: [true, 'Il numero massimo di giocatori è obbligatorio'],
      min: [1, 'Il numero massimo di giocatori deve essere almeno 1'],
      max: [50, 'Il numero massimo di giocatori non può superare 50'],
    },
    allowedFormations: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v.length > 0 && v.every(f => /^\d+v\d+$/.test(f));
        },
        message: 'Le formazioni devono essere nel formato "NvN" (es. "2v2", "5v5")',
      },
    },
    requiresEvenPlayers: {
      type: Boolean,
      default: true,
    },
    allowsIndoor: {
      type: Boolean,
      required: true,
      default: true,
    },
    allowsOutdoor: {
      type: Boolean,
      required: true,
      default: true,
    },
    recommendedSurfaces: {
      type: {
        indoor: {
          type: [String],
          enum: ['sand', 'grass', 'synthetic', 'parquet', 'pvc', 'cement', 'clay', 'tartan'],
        },
        outdoor: {
          type: [String],
          enum: ['sand', 'grass', 'synthetic', 'parquet', 'pvc', 'cement', 'clay', 'tartan'],
        },
        any: {
          type: [String],
          enum: ['sand', 'grass', 'synthetic', 'parquet', 'pvc', 'cement', 'clay', 'tartan'],
        },
      },
      default: {},
      required: false,
    },
    allowsPlayerPricing: {
      type: Boolean,
      default: false,
      comment: 'Se true, permette la divisione dei costi tra i giocatori (utile per sport con pochi partecipanti)',
    },
    scoringSystem: {
      type: String,
      enum: ['set-based', 'point-based', 'game-based'],
      required: [true, 'Il sistema di punteggio è obbligatorio'],
    },
    scoringRules: {
      type: {
        setsToWin: { type: Number, min: 1 },
        pointsPerSet: { type: Number, min: 1 },
        tiebreakAdvantage: { type: Number, min: 1 },
        gamesToWin: { type: Number, min: 1 },
        tiebreakPoints: { type: Number, min: 1 },
        allowsDraw: { type: Boolean },
      },
      required: true,
      validate: {
        validator: function (this: ISport, v: IScoringRules) {
          if (this.scoringSystem === 'set-based') {
            return v.setsToWin != null && v.pointsPerSet != null;
          }
          if (this.scoringSystem === 'game-based') {
            return v.gamesToWin != null;
          }
          if (this.scoringSystem === 'point-based') {
            return v.allowsDraw != null;
          }
          return false;
        },
        message: 'Le regole di punteggio non sono coerenti con il sistema selezionato',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indici
SportSchema.index({ code: 1 });
SportSchema.index({ isActive: 1, sortOrder: 1 });

// Metodi di istanza
SportSchema.methods.validatePlayerCount = function (this: ISport, playerCount: number): boolean {
  return playerCount >= this.minPlayers && playerCount <= this.maxPlayers;
};

SportSchema.methods.validateFormation = function (this: ISport, formation: string): boolean {
  return this.allowedFormations.includes(formation);
};

SportSchema.methods.getDisplayName = function (this: ISport): string {
  return this.name;
};

// Metodi statici
SportSchema.statics.findByCode = function (code: string) {
  return this.findOne({ code: code.toLowerCase(), isActive: true });
};

SportSchema.statics.getActiveSports = function () {
  return this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
};

SportSchema.statics.getSportsForEnvironment = function (environment: 'indoor' | 'outdoor') {
  const filter: any = { isActive: true };
  if (environment === 'indoor') {
    filter.allowsIndoor = true;
  } else {
    filter.allowsOutdoor = true;
  }
  return this.find(filter).sort({ sortOrder: 1, name: 1 });
};

export default mongoose.model<ISport, ISportModel>('Sport', SportSchema);
