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
  { key: "locker", label: "Armadietti", icon: "locker" },
  { key: "disabledAccess", label: "Accesso disabili", icon: "accessible" },
  { key: "disabledParking", label: "Parcheggio disabili", icon: "parking" },
  { key: "defibrillator", label: "Defibrillatore", icon: "heartbeat" },
  { key: "relaxArea", label: "Area relax", icon: "sofa" },
  { key: "equipmentRental", label: "Noleggio attrezzatura", icon: "attach-money" },
  { key: "equipmentStorage", label: "Deposito attrezzatura", icon: "cube" },
  { key: "coachService", label: "Allenatore/Istruttore", icon: "person" },
  { key: "courses", label: "Corsi sportivi", icon: "school" },
  { key: "tournaments", label: "Tornei/Eventi", icon: "trophy" },
  { key: "scoreboard", label: "Tabellone segnapunti", icon: "stats-chart" },
  { key: "coworking", label: "Area coworking", icon: "laptop" },
  { key: "kidsArea", label: "Area bambini", icon: "happy" },
  { key: "bikeParking", label: "Parcheggio bici", icon: "bicycle" },
  { key: "chargingStation", label: "Ricarica auto elettriche", icon: "flash" },
  { key: "spa", label: "SPA", icon: "spa" },
  { key: "sauna", label: "Sauna", icon: "flame" },
  { key: "turkishBath", label: "Bagno turco", icon: "water" },
  { key: "massage", label: "Massaggi", icon: "hand-left" },

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

export interface TimeSlot {
  open: string;
  close: string;
}

export interface OpeningHours {
  [key: string]: { 
    closed: boolean;
    slots: TimeSlot[];
  };
}

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  monday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
  tuesday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
  wednesday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
  thursday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
  friday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
  saturday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
  sunday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
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