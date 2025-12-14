import mongoose, { Schema, Document } from "mongoose";

export interface IStruttura extends Document {
  name: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  location: {
    address: string;
    city: string;
    lat: number;
    lng: number;
    coordinates: [number, number];
  };
  sport: "beach_volley" | "padel" | "tennis";
  maxPlayers: number;
  indoor: boolean;
  surface: "sand" | "hardcourt" | "grass";
  pricePerHour: number;
  amenities: {
    toilets: boolean;
    lockerRoom: boolean;
    showers: boolean;
    parking: boolean;
    restaurant: boolean;
    bar: boolean;
  };
  customAmenities: { label: string; icon: string }[];
  openingHours: Record<string, { open: string; close: string }>;
  images: string[];
  coverImage?: string;
  rating: { average: number; count: number };
  isActive: boolean;
  isFeatured: boolean;
  isDeleted: boolean;
}

const StrutturaSchema = new Schema<IStruttura>(
  {
    name: { type: String, required: true },
    description: String,

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    location: {
      address: String,
      city: String,
      lat: Number,
      lng: Number,
      coordinates: { type: [Number], index: "2dsphere" },
    },

    sport: {
      type: String,
      enum: ["beach_volley", "padel", "tennis"],
      default: "beach_volley",
    },

    maxPlayers: { type: Number, default: 4 },
    indoor: { type: Boolean, default: false },
    surface: {
      type: String,
      enum: ["sand", "hardcourt", "grass"],
      default: "sand",
    },

    pricePerHour: { type: Number, required: true },

    amenities: {
      toilets: Boolean,
      lockerRoom: Boolean,
      showers: Boolean,
      parking: Boolean,
      restaurant: Boolean,
      bar: Boolean,
    },

    customAmenities: [{ label: String, icon: String }],

    openingHours: Schema.Types.Mixed,

    images: [String],
    coverImage: String,

    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IStruttura>("Struttura", StrutturaSchema);
