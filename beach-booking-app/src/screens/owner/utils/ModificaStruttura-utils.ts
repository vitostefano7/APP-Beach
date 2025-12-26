// ✅ AMENITIES PREDEFINITE
export const AVAILABLE_AMENITIES = [
  { key: "toilets", label: "Bagni", icon: "man" },
  { key: "lockerRoom", label: "Spogliatoi", icon: "shirt" },
  { key: "showers", label: "Docce", icon: "water" },
  { key: "parking", label: "Parcheggio", icon: "car" },
  { key: "restaurant", label: "Ristorante", icon: "restaurant" },
  { key: "bar", label: "Bar/Caffè", icon: "cafe" },
  { key: "wifi", label: "WiFi", icon: "wifi" },
  { key: "airConditioning", label: "Aria condizionata", icon: "snow" },
  { key: "lighting", label: "Illuminazione notturna", icon: "bulb" },
  { key: "gym", label: "Palestra", icon: "barbell" },
  { key: "store", label: "Negozio sportivo", icon: "storefront" },
  { key: "firstAid", label: "Pronto soccorso", icon: "medical" },
];

export const DAYS = [
  { key: "monday", label: "Lunedì" },
  { key: "tuesday", label: "Martedì" },
  { key: "wednesday", label: "Mercoledì" },
  { key: "thursday", label: "Giovedì" },
  { key: "friday", label: "Venerdì" },
  { key: "saturday", label: "Sabato" },
  { key: "sunday", label: "Domenica" },
];

export interface OpeningHours {
  [key: string]: { open: string; close: string; closed: boolean };
}

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  monday: { open: "09:00", close: "22:00", closed: false },
  tuesday: { open: "09:00", close: "22:00", closed: false },
  wednesday: { open: "09:00", close: "22:00", closed: false },
  thursday: { open: "09:00", close: "22:00", closed: false },
  friday: { open: "09:00", close: "22:00", closed: false },
  saturday: { open: "09:00", close: "22:00", closed: false },
  sunday: { open: "09:00", close: "22:00", closed: false },
};

// ✅ Helper: determina se un'amenity è custom
export function isCustomAmenity(amenityKey: string): boolean {
  return !AVAILABLE_AMENITIES.find((a) => a.key === amenityKey);
}

// ✅ Helper: filtra amenities attive (incluse custom)
export function getActiveAmenities(amenities: string[]): string[] {
  return amenities.filter(a => a.trim() !== "");
}

// ✅ Helper: separa predefinite da custom
export function separateAmenities(amenities: string[]): {
  predefined: string[];
  custom: string[];
} {
  const predefined: string[] = [];
  const custom: string[] = [];

  amenities.forEach((amenity) => {
    if (isCustomAmenity(amenity)) {
      custom.push(amenity);
    } else {
      predefined.push(amenity);
    }
  });

  return { predefined, custom };
}