import mongoose, { Schema, Document } from "mongoose";

export interface IStruttura extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  isCostSplittingEnabled?: boolean;
  location: {
    address: string;
    city: string;
    lat: number;
    lng: number;
    coordinates: [number, number];
  };
  amenities: string[]; // ✅ Array di stringhe invece di oggetto
  openingHours: any;
  images: string[];
  rating: { average: number; count: number };
  isActive: boolean;
  isFeatured: boolean;
  isDeleted: boolean;
}

const StrutturaSchema = new Schema<IStruttura>(
  {
    name: { type: String, required: true },
    description: String,

    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },

    location: {
      address: String,
      city: String,
      lat: Number,
      lng: Number,
      coordinates: { type: [Number], index: "2dsphere" },
    },

    // ✅ Amenities come array di stringhe (supporta custom)
    amenities: {
      type: [String],
      default: [],
    },

    openingHours: Schema.Types.Mixed,

    images: { type: [String], default: [] },

    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    isCostSplittingEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Indice per query con amenities
StrutturaSchema.index({ amenities: 1 });

export default mongoose.models.Struttura ||
  mongoose.model<IStruttura>("Struttura", StrutturaSchema);