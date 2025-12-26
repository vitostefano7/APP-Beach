export const MONTHS = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
export const DAYS_SHORT = ["D", "L", "M", "M", "G", "V", "S"];

export const SPORT_LABELS: Record<string, string> = {
  beach_volley: "Beach Volley",
  padel: "Padel",
  tennis: "Tennis",
};

export const SURFACE_LABELS: Record<string, string> = {
  sand: "Sabbia",
  hardcourt: "Cemento",
  grass: "Erba",
  pvc: "PVC",
  cement: "Cemento",
};

// ✅ Lista amenities predefinite (uguale a ModificaStruttura)
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

// ✅ Helper: ottieni label e icon per amenity (predefinita o custom)
export function getAmenityDisplay(amenityKey: string): { label: string; icon: string } {
  const predefined = AVAILABLE_AMENITIES.find((a) => a.key === amenityKey);
  
  if (predefined) {
    return { label: predefined.label, icon: predefined.icon };
  }
  
  // Custom amenity - icona generica + testo originale
  return { label: amenityKey, icon: "checkmark-circle" };
}

// ✅ Helper: converte array di amenities in array di display objects
export function getAmenitiesDisplay(amenities: string[]): Array<{ key: string; label: string; icon: string }> {
  return amenities.map((key) => {
    const { label, icon } = getAmenityDisplay(key);
    return { key, label, icon };
  });
}

// ✅ Helper: ottieni icona sport
export function getSportIcon(sport: string): string {
  switch (sport) {
    case "beach_volley":
      return "fitness";
    case "padel":
    case "tennis":
      return "tennisball";
    default:
      return "football";
  }
}

// ✅ Date utils
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getMonthStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate < today;
}

export function isPastSlot(dateStr: string, timeStr: string): boolean {
  const now = new Date();
  const [hours, minutes] = timeStr.split(":").map(Number);
  const slotDate = new Date(dateStr + "T00:00:00");
  slotDate.setHours(hours, minutes, 0, 0);
  return slotDate < now;
}