import { AVAILABLE_AMENITIES } from "../../../amenities/availableAmenities";

export { AVAILABLE_AMENITIES };

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