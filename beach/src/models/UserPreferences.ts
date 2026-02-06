import { Schema, model, Types, Document } from "mongoose";

export interface IUserPreferences extends Document {
  user: Types.ObjectId;
  
  // Notifiche e tema
  pushNotifications: boolean;
  darkMode: boolean;
  
  // Privacy
  privacyLevel: "public" | "friends" | "private";
  
  // Location preferita (città/zona dove gioca di solito)
  preferredLocation?: {
    city: string;
    address?: string;
    lat: number;
    lng: number;
    radius?: number; // Raggio in km per cercare strutture vicine (default 10km)
    
    // 🆕 Città suggerita automaticamente (fallback intelligente)
    suggestedCity?: string;
    suggestedLat?: number;
    suggestedLng?: number;
    suggestedUpdatedAt?: Date; // Ultimo aggiornamento calcolo automatico
  };
  
  // Strutture preferite (stellina)
  favoriteStrutture: Types.ObjectId[];
  
  // Sport preferiti (per filtrare automaticamente)
  favoriteSports?: Types.ObjectId[]; // Ref to Sport
  
  // Fascia oraria preferita
  preferredTimeSlot?: "morning" | "afternoon" | "evening";
  
  // 🆕 Storia delle città dove ha giocato (per calcolare suggestedCity)
  playHistory?: Record<string, number>; // { "Milano": 5, "Roma": 3 }
  lastVisitedCity?: string;
}

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
      index: true,
    },

    // ========== NOTIFICHE E TEMA ==========
    pushNotifications: { 
      type: Boolean, 
      default: true 
    },
    
    darkMode: { 
      type: Boolean, 
      default: false 
    },

    // ========== PRIVACY ==========
    privacyLevel: {
      type: String,
      enum: ["public", "friends", "private"],
      default: "public",
    },

    // ========== LOCATION PREFERITA ==========
    preferredLocation: {
      city: String,
      address: String,
      lat: Number,
      lng: Number,
      radius: {
        type: Number,
        default: 30, // ✅ 30 km di default
        min: 1,
        max: 100,
      },
      // 🆕 Città suggerita automaticamente
      suggestedCity: String,
      suggestedLat: Number,
      suggestedLng: Number,
      suggestedUpdatedAt: Date,
    },

    // ========== STRUTTURE FAVORITE ==========
    favoriteStrutture: {
      type: [Schema.Types.ObjectId],
      ref: "Struttura",
      default: [],
    },

    // ========== SPORT PREFERITI ==========
    favoriteSports: {
      type: [Schema.Types.ObjectId],
      ref: "Sport",
      default: [],
    },

    // ========== FASCIA ORARIA PREFERITA ==========
    preferredTimeSlot: {
      type: String,
      enum: ["morning", "afternoon", "evening"],
    },
    
    // ========== PLAY HISTORY ==========
    playHistory: {
      type: Map,
      of: Number,
      default: {},
    },
    
    lastVisitedCity: {
      type: String,
    },
  },
  { 
    timestamps: true 
  }
);

// Indice per query veloci sulle strutture favorite
UserPreferencesSchema.index({ favoriteStrutture: 1 });

export default model<IUserPreferences>("UserPreferences", UserPreferencesSchema);