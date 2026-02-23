import { formatSportName as getSportLabelFromUtils, SPORT_LABELS } from '../../../utils/sportUtils';
import { AVAILABLE_AMENITIES, AmenityIcon } from '../../../amenities/availableAmenities';

export const MONTHS = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
export const DAYS_SHORT = ["D", "L", "M", "M", "G", "V", "S"];

// Re-export per retrocompatibilità
export { SPORT_LABELS };

export const SURFACE_LABELS: Record<string, string> = {
  sand: "Sabbia",
  cement: "Cemento",
  pvc: "PVC",
  grass: "Erba naturale",
  synthetic: "Sintetico",
  parquet: "Parquet",
  clay: "Terra",
  tartan: "Tartan",
};

export { AVAILABLE_AMENITIES };

// ✅ Helper: ottieni label e icon per amenity (predefinita o custom)
export function getAmenityDisplay(amenityKey: string): { label: string; icon: AmenityIcon } {
  const predefined = AVAILABLE_AMENITIES.find((a) => a.key === amenityKey);
  
  if (predefined) {
    return { label: predefined.label, icon: predefined.icon };
  }

  // Heuristic mapping for custom amenities: try to infer a meaningful icon
  const normalize = (s: string) => String(s || "").toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const key = normalize(amenityKey);

  const keywordMap: Array<[RegExp, string]> = [
    [/wifi/, 'wifi'],
    [/wi-?fi/, 'wifi'],
    [/bar|caffe|caff/, 'cafe'],
    [/birr|beer/, 'beer'],
    [/ristor|ristorante/, 'restaurant'],
    [/palestr|gym/, 'barbell'],
    [/docc|doccia/, 'water'],
    [/spogli|spogliatoio/, 'shirt'],
    [/bagni|toilet/, 'man'],
    [/parch|parcheggio/, 'car'],
    [/negoz|shop|store/, 'storefront'],
    [/pronto soccorso|soccors|first aid/, 'medical'],
    [/bimb|kids|baby/, 'happy'],
    [/pizza/, 'pizza'],
    [/gelat|ice.?cream/, 'ice-cream'],
    [/luce|illuminaz|illuminazione/, 'bulb'],
    [/aria|condizion/, 'snow'],
    [/wifi gratuito/, 'wifi'],
  ];

  for (const [re, icon] of keywordMap) {
    if (re.test(key)) return { label: amenityKey, icon };
  }

  // Fallback generic icon
  return { label: amenityKey, icon: "checkmark-circle" };
}

// ✅ Helper: converte array di amenities in array di display objects
export function getAmenitiesDisplay(amenities: string[]): Array<{ key: string; label: string; icon: AmenityIcon }> {
  return amenities.map((key) => {
    const { label, icon } = getAmenityDisplay(key);
    return { key, label, icon };
  });
}

// ✅ Helper: ottieni label sport normalizzato
export function getSportLabel(sport: string): string {
  return getSportLabelFromUtils(sport);
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