import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export type GeographicFilterMode = 'gps' | 'preferred' | 'visited' | 'none';

export interface GeographicFilterState {
  userPreferences: any;
  visitedStruttureIds: string[];
  gpsCoords: { lat: number; lng: number } | null;
  isLoadingPreferences: boolean;
  isLoadingGPS: boolean;
}

export interface GeographicFilterResult {
  filteredMatches: any[];
  filterMode: GeographicFilterMode;
  searchRadius: number;
  referenceCoords: { lat: number; lng: number } | null;
}

// Calcola distanza tra due punti in km usando formula Haversine
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Raggio della Terra in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useGeographicMatchFiltering = (token: string | null) => {
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [visitedStruttureIds, setVisitedStruttureIds] = useState<string[]>([]);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);

  const loadUserPreferences = useCallback(async () => {
    if (!token) return;

    setIsLoadingPreferences(true);
    try {
      console.log("📍 [GeographicFilter] Caricamento preferenze...");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const prefs = await res.json();
        setUserPreferences(prefs);
        console.log('📍 [GeographicFilter] Città preferita caricata:', prefs.preferredLocation?.city || 'NESSUNA');
      }
    } catch (error) {
      console.error("❌ [GeographicFilter] Errore caricamento preferenze:", error);
    } finally {
      setIsLoadingPreferences(false);
    }
  }, [token]);

  const loadVisitedStrutture = useCallback(async () => {
    if (!token) return;

    try {
      console.log("🏟️ [GeographicFilter] Caricamento strutture visitate...");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/bookings/my?status=completed`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const bookings = Array.isArray(data) ? data : data.bookings || [];
        const strutturaIds = [...new Set(
          bookings
            .filter((b: any) => b.booking?.campo?.struttura?._id)
            .map((b: any) => b.booking.campo.struttura._id)
        )];
        setVisitedStruttureIds(strutturaIds);
        console.log('🏟️ [GeographicFilter] Strutture visitate:', strutturaIds.length);
      }
    } catch (error) {
      console.error("❌ [GeographicFilter] Errore caricamento strutture visitate:", error);
    }
  }, [token]);

  const requestGPSLocation = useCallback(async () => {
    if (!token || gpsCoords) return; // Non sovrascrivere se già disponibile

    setIsLoadingGPS(true);
    console.log("📍 [GeographicFilter] Richiesta posizione GPS...");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };

        setGpsCoords(coords);
        console.log("📍 [GeographicFilter] GPS ottenuto:", coords);
      } else {
        console.log("⚠️ [GeographicFilter] Permesso GPS negato");
      }
    } catch (gpsError) {
      console.log("⚠️ [GeographicFilter] Errore GPS:", gpsError);
    } finally {
      setIsLoadingGPS(false);
    }
  }, [token, gpsCoords]);

  const filterMatchesByGeography = useCallback((
    matches: any[],
    context: string = 'unknown'
  ): GeographicFilterResult => {
    console.log(`🔍 [${context}] === INIZIO FILTRAGGIO GEOGRAFICO ===`);
    console.log(`🔍 [${context}] Partite da filtrare: ${matches.length}`);

    // Determina la città di riferimento e il raggio con priorità corrette
    let referenceLat: number | null = null;
    let referenceLng: number | null = null;
    let searchRadius = 30; // Default 30km
    let filterMode: GeographicFilterMode = 'none';

    // PRIORITÀ 1: GPS (se disponibile)
    if (gpsCoords) {
      referenceLat = gpsCoords.lat;
      referenceLng = gpsCoords.lng;
      searchRadius = 30;
      filterMode = 'gps';
      console.log(`📍 [${context}] PRIORITÀ 1 - GPS:`, gpsCoords, "Raggio: 30km");
    }
    // PRIORITÀ 2: Città preferita (dalle preferenze utente)
    else if (userPreferences?.preferredLocation?.lat && userPreferences?.preferredLocation?.lng) {
      referenceLat = userPreferences.preferredLocation.lat;
      referenceLng = userPreferences.preferredLocation.lng;
      searchRadius = userPreferences.preferredLocation.radius || 30;
      filterMode = 'preferred';
      console.log(`📍 [${context}] PRIORITÀ 2 - Città preferita:`, userPreferences.preferredLocation.city, "Raggio:", searchRadius, "km");
    }
    // FALLBACK: Strutture visitate (se nessuna posizione disponibile)
    else if (visitedStruttureIds.length > 0) {
      filterMode = 'visited';
      console.log(`📍 [${context}] FALLBACK - Strutture visitate:`, visitedStruttureIds.length, "strutture");
    }
    else {
      console.log(`⚠️ [${context}] Nessun filtro geografico disponibile - nessun risultato`);
      return {
        filteredMatches: [],
        filterMode: 'none',
        searchRadius: 0,
        referenceCoords: null
      };
    }

    // Filtra le partite
    let geographicallyFiltered = matches.filter((match) => {
      const structureLat = match.booking?.campo?.struttura?.location?.lat;
      const structureLng = match.booking?.campo?.struttura?.location?.lng;
      const strutturaId = typeof match.booking?.campo?.struttura === 'object'
        ? (match.booking?.campo?.struttura as any)?._id
        : match.booking?.campo?.struttura;

      if (filterMode === 'gps' || filterMode === 'preferred') {
        // Filtro per distanza
        if (referenceLat !== null && referenceLng !== null && structureLat && structureLng) {
          const distance = calculateDistance(referenceLat, referenceLng, structureLat, structureLng);
          console.log(`📏 [${context}] ${match.booking?.campo?.struttura?.name || 'N/A'} (${match.booking?.campo?.struttura?.location?.city || 'N/A'}): ${distance.toFixed(2)}km`);
          return distance <= searchRadius;
        }
        return false;
      } else if (filterMode === 'visited') {
        // Filtro per strutture visitate
        return visitedStruttureIds.includes(strutturaId);
      }

      return false;
    });

    console.log(`✅ [${context}] Match dopo filtro geografico (${filterMode}): ${geographicallyFiltered.length}`);

    // Se nessun risultato e c'è un riferimento geografico, amplia il raggio a 50km
    if (geographicallyFiltered.length === 0 && (filterMode === 'gps' || filterMode === 'preferred') && referenceLat !== null && referenceLng !== null && searchRadius < 50) {
      console.log(`⚠️ [${context}] Nessun risultato, amplio il raggio a 50km`);
      geographicallyFiltered = matches.filter((match) => {
        const structureLat = match.booking?.campo?.struttura?.location?.lat;
        const structureLng = match.booking?.campo?.struttura?.location?.lng;

        if (structureLat && structureLng) {
          const distance = calculateDistance(referenceLat!, referenceLng!, structureLat, structureLng);
          return distance <= 50;
        }
        return false;
      });
      console.log(`✅ [${context}] Match dopo ampliamento a 50km: ${geographicallyFiltered.length}`);
    }

    console.log(`✅ [${context}] === FINE FILTRAGGIO GEOGRAFICO ===`);

    return {
      filteredMatches: geographicallyFiltered,
      filterMode,
      searchRadius: filterMode === 'gps' || filterMode === 'preferred' ? searchRadius : 0,
      referenceCoords: referenceLat !== null && referenceLng !== null ? { lat: referenceLat, lng: referenceLng } : null
    };
  }, [gpsCoords, userPreferences, visitedStruttureIds]);

  const logFilteredMatchesDetails = useCallback((
    matches: any[],
    context: string = 'unknown',
    filterMode: GeographicFilterMode,
    searchRadius: number
  ) => {
    console.log(`📋 Dettagli match ${context} mostrati (${matches.length}):`);
    matches.forEach((match, index) => {
      const confirmedPlayers = match.players?.filter((p: any) => p.status === 'confirmed').length || 0;
      const maxPlayers = match.maxPlayers || 0;
      const struttura = match.booking?.campo?.struttura?.name || 'N/A';
      const citta = match.booking?.campo?.struttura?.location?.city || 'N/A';
      const dataOra = match.booking?.date && match.booking?.startTime ?
        `${match.booking.date} ${match.booking.startTime}` : 'N/A';

      console.log(`   ${index + 1}. Match ${match._id?.slice(-6)} - ${struttura} (${citta}) - ${dataOra} - ${confirmedPlayers}/${maxPlayers} giocatori`);
      console.log(`      ✅ Criteri soddisfatti: ${filterMode === 'gps' ? 'posizione GPS' : filterMode === 'preferred' ? 'città preferita' : filterMode === 'visited' ? 'strutture visitate' : 'nessun filtro geografico'}`);
    });
  }, []);

  return {
    // State
    userPreferences,
    visitedStruttureIds,
    gpsCoords,
    isLoadingPreferences,
    isLoadingGPS,

    // Actions
    loadUserPreferences,
    loadVisitedStrutture,
    requestGPSLocation,
    filterMatchesByGeography,
    logFilteredMatchesDetails,
  };
};