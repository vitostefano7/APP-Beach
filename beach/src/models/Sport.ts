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

export interface ISportRecommendedSurfaces {
  indoor?: string[];
  outdoor?: string[];
  any?: string[];
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
  recommendedSurfaces?: ISportRecommendedSurfaces;
  
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

type SupportedSurface = 'sand' | 'grass' | 'synthetic' | 'parquet' | 'pvc' | 'cement' | 'clay' | 'tartan';

interface SportSurfaceRule {
  indoor?: SupportedSurface[];
  outdoor?: SupportedSurface[];
  any?: SupportedSurface[];
}

const SPORT_SURFACE_RULES: Record<string, SportSurfaceRule> = {
  volley: {
    indoor: ['pvc'],
    outdoor: ['cement'],
  },
  beach_volley: {
    any: ['sand'],
  },
  beach_tennis: {
    any: ['sand'],
  },
  calcio: {
    outdoor: ['grass', 'synthetic', 'clay'],
  },
  calcetto: {
    indoor: ['synthetic'],
    outdoor: ['synthetic'],
  },
  calciotto: {
    indoor: ['synthetic'],
    outdoor: ['synthetic'],
  },
  calcio_a_7: {
    indoor: ['synthetic'],
    outdoor: ['synthetic'],
  },
  basket: {
    indoor: ['pvc'],
    outdoor: ['cement'],
  },
  tennis: {
    indoor: ['grass', 'clay', 'cement'],
    outdoor: ['grass', 'clay', 'cement'],
  },
  padel: {
    indoor: ['synthetic'],
    outdoor: ['synthetic'],
  },
};

function normalizeSurfaceList(list?: string[]): string[] {
  return Array.from(new Set((list ?? []).map((value) => value.toLowerCase()))).sort();
}

function sameSurfaceSet(actual?: string[], expected?: string[]): boolean {
  const normalizedActual = normalizeSurfaceList(actual);
  const normalizedExpected = normalizeSurfaceList(expected);

  if (normalizedActual.length !== normalizedExpected.length) {
    return false;
  }

  return normalizedActual.every((value, index) => value === normalizedExpected[index]);
}

function getSportSurfaceValidationError(input: {
  code?: string;
  allowsIndoor?: boolean;
  allowsOutdoor?: boolean;
  recommendedSurfaces?: ISportRecommendedSurfaces;
}): string | null {
  const code = input.code?.toLowerCase();

  if (!code) {
    return null;
  }

  const rule = SPORT_SURFACE_RULES[code];
  if (!rule) {
    return null;
  }

  const surfaces = input.recommendedSurfaces;
  if (!surfaces) {
    return `recommendedSurfaces obbligatorio per ${code}`;
  }

  if (!input.allowsIndoor && surfaces.indoor && surfaces.indoor.length > 0) {
    return `${code} non consente indoor ma ha superfici indoor configurate`;
  }

  if (!input.allowsOutdoor && surfaces.outdoor && surfaces.outdoor.length > 0) {
    return `${code} non consente outdoor ma ha superfici outdoor configurate`;
  }

  if (rule.any && rule.any.length > 0) {
    const hasAny = (surfaces.any?.length ?? 0) > 0;
    const hasIndoor = (surfaces.indoor?.length ?? 0) > 0;
    const hasOutdoor = (surfaces.outdoor?.length ?? 0) > 0;

    if (hasAny) {
      if (!sameSurfaceSet(surfaces.any, rule.any)) {
        return `${code} deve avere any=${rule.any.join(', ')}`;
      }

      if (hasIndoor || hasOutdoor) {
        return `${code} non deve definire indoor/outdoor quando usa any`;
      }

      return null;
    }

    if (!hasIndoor || !hasOutdoor) {
      return `${code} deve avere superfici sia indoor che outdoor oppure any`;
    }

    if (!sameSurfaceSet(surfaces.indoor, rule.any) || !sameSurfaceSet(surfaces.outdoor, rule.any)) {
      return `${code} deve avere indoor/outdoor=${rule.any.join(', ')}`;
    }

    return null;
  }

  if (rule.indoor) {
    if (!input.allowsIndoor) {
      return `${code} deve consentire indoor`;
    }

    if (!sameSurfaceSet(surfaces.indoor, rule.indoor)) {
      return `${code} deve avere indoor=${rule.indoor.join(', ')}`;
    }
  } else if (surfaces.indoor && surfaces.indoor.length > 0) {
    return `${code} non deve avere superfici indoor`;
  }

  if (rule.outdoor) {
    if (!input.allowsOutdoor) {
      return `${code} deve consentire outdoor`;
    }

    if (!sameSurfaceSet(surfaces.outdoor, rule.outdoor)) {
      return `${code} deve avere outdoor=${rule.outdoor.join(', ')}`;
    }
  } else if (surfaces.outdoor && surfaces.outdoor.length > 0) {
    return `${code} non deve avere superfici outdoor`;
  }

  if (surfaces.any && surfaces.any.length > 0) {
    return `${code} non deve avere superfici any`;
  }

  return null;
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
      required: [true, 'Le superfici raccomandate sono obbligatorie'],
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

SportSchema.pre('validate', function (this: any) {
  const doc = this as {
    code?: string;
    allowsIndoor?: boolean;
    allowsOutdoor?: boolean;
    recommendedSurfaces?: ISportRecommendedSurfaces;
    invalidate: (path: string, errorMsg: string) => void;
  };

  const errorMessage = getSportSurfaceValidationError({
    code: doc.code,
    allowsIndoor: doc.allowsIndoor,
    allowsOutdoor: doc.allowsOutdoor,
    recommendedSurfaces: doc.recommendedSurfaces,
  });

  if (errorMessage) {
    doc.invalidate('recommendedSurfaces', errorMessage);
  }
});

SportSchema.pre('findOneAndUpdate', async function (this: mongoose.Query<any, any>) {
  this.setOptions({ runValidators: true });

  const update = (this.getUpdate() ?? {}) as any;
  const setUpdate = update.$set ?? {};
  const unsetUpdate = update.$unset ?? {};

  const existing = await this.model.findOne(this.getQuery()).lean();
  if (!existing) {
    return;
  }

  const merged = {
    code: setUpdate.code ?? update.code ?? existing.code,
    allowsIndoor:
      setUpdate.allowsIndoor ?? update.allowsIndoor ?? (unsetUpdate.allowsIndoor ? undefined : existing.allowsIndoor),
    allowsOutdoor:
      setUpdate.allowsOutdoor ?? update.allowsOutdoor ?? (unsetUpdate.allowsOutdoor ? undefined : existing.allowsOutdoor),
    recommendedSurfaces:
      setUpdate.recommendedSurfaces ??
      update.recommendedSurfaces ??
      (unsetUpdate.recommendedSurfaces ? undefined : existing.recommendedSurfaces),
  };

  const errorMessage = getSportSurfaceValidationError(merged);
  if (!errorMessage) {
    return;
  }

  const validationError = new mongoose.Error.ValidationError();
  validationError.addError(
    'recommendedSurfaces',
    new mongoose.Error.ValidatorError({
      path: 'recommendedSurfaces',
      message: errorMessage,
      value: merged.recommendedSurfaces,
    })
  );

  throw validationError;
});

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
