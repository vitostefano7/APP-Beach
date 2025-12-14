import mongoose, { Schema, Document } from "mongoose";

interface IStruttura extends Document {
  name: string;
  description: string;
  owner: mongoose.Schema.Types.ObjectId;
  location: {
    address: string;
    city: string;
    lat: number;
    lng: number;
    coordinates: [number, number];  // Geospatial data
  };
  sport: "beach_volley" | "padel" | "tennis";
  maxPlayers: number;
  indoor: boolean;
  surface: "sand" | "hardcourt" | "grass";  // Possibile estensione per altre superfici
  pricePerHour: number;
  amenities: {
    toilets: boolean;
    lockerRoom: boolean;
    showers: boolean;
    parking: boolean;
    restaurant: boolean;
    bar: boolean;
  };
  customAmenities: [
    {
      label: string;
      icon: string;
    }
  ];
  openingHours: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  images: string[];
  coverImage: string;
  rating: {
    average: number;
    count: number;
  };
  isActive: boolean;
  isFeatured: boolean;
  isDeleted: boolean;
}

const StrutturaSchema = new Schema<IStruttura>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      coordinates: { type: [Number], index: "2dsphere" }, // Geospatial index for proximity search
    },

    sport: {
      type: String,
      enum: ["beach_volley", "padel", "tennis"],
      default: "beach_volley",
    },

    maxPlayers: { type: Number, default: 4 },
    indoor: { type: Boolean, default: false },
    surface: { type: String, enum: ["sand", "hardcourt", "grass"], default: "sand" },

    pricePerHour: { type: Number, required: true },

    amenities: {
      toilets: { type: Boolean, default: false },
      lockerRoom: { type: Boolean, default: false },
      showers: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      restaurant: { type: Boolean, default: false },
      bar: { type: Boolean, default: false },
    },

    customAmenities: [
      {
        label: { type: String },
        icon: { type: String },
      },
    ],

    openingHours: {
      monday: { open: { type: String }, close: { type: String } },
      tuesday: { open: { type: String }, close: { type: String } },
      wednesday: { open: { type: String }, close: { type: String } },
      thursday: { open: { type: String }, close: { type: String } },
      friday: { open: { type: String }, close: { type: String } },
      saturday: { open: { type: String }, close: { type: String } },
      sunday: { open: { type: String }, close: { type: String } },
    },

    images: { type: [String], default: [] },
    coverImage: { type: String },

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
