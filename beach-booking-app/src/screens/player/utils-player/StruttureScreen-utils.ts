import { Region } from "react-native-maps";

/* =========================
   TYPES
========================= */
export type Struttura = {
  _id: string;
  name: string;
  pricePerHour: number;
  indoor: boolean;
  location: {
    address: string;
    city: string;
    lat: number;
    lng: number;
  };
  rating?: {
    average: number;
    count: number;
  };
  images: string[];
  sports?: string[];
  isFavorite?: boolean;
  distance?: number; // english alias
  distanza?: number;  // italian alias for distance
  prezzoPerHour?: number; // italian alias for pricePerHour
  isCostSplittingEnabled?: boolean;
  hasOpenGames?: boolean;
  openGamesCount?: number;
};

export type Cluster = {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  strutture: Struttura[];
  radius: number;
};

export type FilterState = {
  indoor: boolean | null;
  sport: string | null;
  date: Date | null;
  timeSlot: string | null;
  city: string | null;
  splitPayment: boolean | null;
  openGames: boolean | null;
};

export type UserPreferences = {
  preferredLocation?: {
    city: string;
    lat: number;
    lng: number;
    radius: number;
    // 🆕 Città suggerita automaticamente (fallback intelligente)
    suggestedCity?: string;
    suggestedLat?: number;
    suggestedLng?: number;
    suggestedUpdatedAt?: string;
  };
  favoriteSports?: string[];
  favoriteStrutture: string[];
  // 🆕 Storia città giocate
  playHistory?: Record<string, number>;
  lastVisitedCity?: string;
};

/* =========================
   GEO FUNCTIONS
========================= */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Backwards compatibility wrapper (italian name used in parts of the codebase)
export function calculatedistanza(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return calculateDistance(lat1, lon1, lat2, lon2);
}

/* =========================
   CLUSTERING
========================= */
export function createClusters(
  strutture: Struttura[],
  region: Region
): Cluster[] {
  const gridSize = region.latitudeDelta * 0.2;
  const grid: Record<string, Struttura[]> = {};

  strutture.forEach((s) => {
    const x = Math.floor(s.location.lat / gridSize);
    const y = Math.floor(s.location.lng / gridSize);
    const key = `${x}_${y}`;

    if (!grid[key]) grid[key] = [];
    grid[key].push(s);
  });

  const clusters: Cluster[] = [];

  Object.values(grid).forEach((items, index) => {
    if (items.length === 0) return;

    const avgLat =
      items.reduce((sum, s) => sum + s.location.lat, 0) / items.length;
    const avgLng =
      items.reduce((sum, s) => sum + s.location.lng, 0) / items.length;

    clusters.push({
      id: `cluster-${index}`,
      coordinate: { latitude: avgLat, longitude: avgLng },
      strutture: items,
      radius: Math.max(region.latitudeDelta * 3000, 1000),
    });
  });

  return clusters;
}

/* =========================
   FILTERS
========================= */
export function filterStrutture(
  strutture: Struttura[],
  filters: FilterState,
  query: string
): Struttura[] {
  const filtered = strutture.filter((s) => {
    // Filtro indoor/outdoor
    if (filters.indoor !== null && s.indoor !== filters.indoor) {
      return false;
    }

    // Filtro sport
    if (filters.sport) {
      const normalizedSelectedSport = filters.sport.trim().toLowerCase();
      const hasMatchingSport =
        Array.isArray(s.sports) &&
        s.sports.some((sport) => sport?.trim().toLowerCase() === normalizedSelectedSport);

      if (!hasMatchingSport) {
        return false;
      }
    }

    // Filtro ricerca testuale
    if (
      query &&
      !`${s.name} ${s.location.city}`
        .toLowerCase()
        .includes(query.toLowerCase())
    ) {
      return false;
    }

    // Filtro città
    if (filters.city) {
      if (!s.location.city.toLowerCase().includes(filters.city.toLowerCase())) {
        return false;
      }
    }

    // Filtro split payment
    if (filters.splitPayment !== null && s.isCostSplittingEnabled !== filters.splitPayment) {
      return false;
    }

    // Filtro partite aperte
    if (filters.openGames !== null && s.hasOpenGames !== filters.openGames) {
      return false;
    }

    return true;
  });
  
  return filtered;
}

export function countActiveFilters(filters: FilterState): number {
  return [
    filters.indoor !== null,
    filters.sport !== null,
    filters.date !== null,
    filters.timeSlot !== null,
    filters.city !== null,
    filters.splitPayment !== null,
    filters.openGames !== null,
  ].filter(Boolean).length;
}