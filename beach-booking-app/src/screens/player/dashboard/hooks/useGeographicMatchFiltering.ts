import { useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Cache GPS: 15 minuti di validità
const GPS_CACHE_DURATION = 15 * 60 * 1000; // 15 minuti in millisecondi
// Tempo di attesa prima di riprovare dopo un rifiuto: 1 ora
const GPS_DENIED_RETRY_DURATION = 60 * 60 * 1000; // 1 ora in millisecondi

// Keys per AsyncStorage
const STORAGE_KEYS = {
  GPS_COORDS: '@beach_gps_coords',
  GPS_TIMESTAMP: '@beach_gps_timestamp',
  GPS_PERMISSION_DENIED: '@beach_gps_permission_denied',
};

export const useGeographicMatchFiltering = (token: string | null) => {
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [visitedStruttureIds, setVisitedStruttureIds] = useState<string[]>([]);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsTimestamp, setGpsTimestamp] = useState<number | null>(null);
  const [gpsPermissionDenied, setGpsPermissionDenied] = useState<number | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Carica i dati persistiti all'avvio
  useEffect(() => {
    const loadPersistedGPSData = async () => {
      try {
        console.log("🔄 [GPS Cache] Caricamento dati persistiti...");
        
        const [coords, timestamp, denied] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.GPS_COORDS),
          AsyncStorage.getItem(STORAGE_KEYS.GPS_TIMESTAMP),
          AsyncStorage.getItem(STORAGE_KEYS.GPS_PERMISSION_DENIED),
        ]);

        if (coords && timestamp) {
          const parsedCoords = JSON.parse(coords);
          const parsedTimestamp = parseInt(timestamp);
          const now = Date.now();
          const age = now - parsedTimestamp;

          if (age < GPS_CACHE_DURATION) {
            setGpsCoords(parsedCoords);
            setGpsTimestamp(parsedTimestamp);
            const minutesRemaining = Math.floor((GPS_CACHE_DURATION - age) / 60000);
            console.log(`✅ [GPS Cache] Dati GPS caricati - validi per ${minutesRemaining} min`);
            console.log(`📍 [GPS Cache] Coordinate:`, parsedCoords);
          } else {
            console.log("⚠️ [GPS Cache] Dati GPS scaduti - verranno richiesti");
            // Pulisci i dati scaduti
            await AsyncStorage.multiRemove([STORAGE_KEYS.GPS_COORDS, STORAGE_KEYS.GPS_TIMESTAMP]);
          }
        } else {
          console.log("ℹ️ [GPS Cache] Nessun dato GPS salvato");
        }

        if (denied) {
          const parsedDenied = parseInt(denied);
          const now = Date.now();
          const timeSinceDenied = now - parsedDenied;

          if (timeSinceDenied < GPS_DENIED_RETRY_DURATION) {
            setGpsPermissionDenied(parsedDenied);
            const minutesRemaining = Math.floor((GPS_DENIED_RETRY_DURATION - timeSinceDenied) / 60000);
            console.log(`⚠️ [GPS Cache] Permessi GPS negati - riproverò tra ${minutesRemaining} min`);
          } else {
            console.log("ℹ️ [GPS Cache] Tempo scaduto dal rifiuto GPS - posso riprovare");
            await AsyncStorage.removeItem(STORAGE_KEYS.GPS_PERMISSION_DENIED);
          }
        } else {
          console.log("ℹ️ [GPS Cache] Nessun rifiuto GPS salvato");
        }

        setInitialized(true);
      } catch (error) {
        console.error("❌ [GPS Cache] Errore caricamento dati:", error);
        setInitialized(true);
      }
    };

    loadPersistedGPSData();
  }, []);

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

  const requestGPSLocation = useCallback(async (forceRequest: boolean = false): Promise<{ success: boolean; errorType?: 'permission_denied' | 'service_disabled' | 'timeout' | 'other' }> => {
    console.log("\n\n🚀🚀🚀 [GPS DEBUG] === INIZIO requestGPSLocation ===");
    console.log("📥 [GPS DEBUG] Parametri:", { forceRequest, initialized, gpsCoords, gpsTimestamp, gpsPermissionDenied });
    
    // Aspetta che i dati persistiti siano caricati
    if (!initialized) {
      console.log("❌ [GPS DEBUG] NON INIZIALIZZATO - return early");
      console.log("🏁🏁🏁 [GPS DEBUG] === FINE requestGPSLocation (not initialized) ===\n\n");
      return { success: false, errorType: 'other' };
    }
    console.log("✅ [GPS DEBUG] Inizializzato, procedo...");

    console.log("\n🔍 [GPS] === DEBUG RICHIESTA GPS ===");
    console.log("📊 [GPS] Stato corrente:");
    console.log("   - GPS Coords:", gpsCoords ? `${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}` : 'null');
    console.log("   - GPS Timestamp:", gpsTimestamp ? new Date(gpsTimestamp).toLocaleString('it-IT') : 'null');
    console.log("   - Permission Denied:", gpsPermissionDenied ? new Date(gpsPermissionDenied).toLocaleString('it-IT') : 'null');
    console.log("   - Force Request:", forceRequest);

    console.log("🔍 [GPS DEBUG] Check gpsPermissionDenied:", gpsPermissionDenied);
    // Verifica se l'utente ha negato i permessi recentemente (solo se non è una richiesta forzata)
    if (gpsPermissionDenied && !forceRequest) {
      console.log("⚠️ [GPS DEBUG] gpsPermissionDenied && !forceRequest - check throttling");
      const now = Date.now();
      const timeSinceDenied = now - gpsPermissionDenied;
      console.log("⏱️ [GPS DEBUG] timeSinceDenied:", timeSinceDenied, "GPS_DENIED_RETRY_DURATION:", GPS_DENIED_RETRY_DURATION);
      
      if (timeSinceDenied < GPS_DENIED_RETRY_DURATION) {
        const minutesRemaining = Math.floor((GPS_DENIED_RETRY_DURATION - timeSinceDenied) / 60000);
        console.log(`⛔ [GPS DEBUG] Throttling attivo - return early (${minutesRemaining} min)`);
        console.log("🏁🏁🏁 [GPS DEBUG] === FINE requestGPSLocation (throttled) ===\n\n");
        return { success: false, errorType: 'permission_denied' }; // Non richiedere ancora
      } else {
        console.log("🕐 [GPS DEBUG] Throttling scaduto, pulisco flag");
        console.log("📍 [GPS] Tempo scaduto dal rifiuto, riprovo a richiedere GPS...");
        setGpsPermissionDenied(null);
        await AsyncStorage.removeItem(STORAGE_KEYS.GPS_PERMISSION_DENIED);
      }
    } else if (gpsPermissionDenied && forceRequest) {
      console.log("🔓🔓🔓 [GPS DEBUG] FORCE REQUEST = TRUE - bypasso throttling");
      console.log("🔓 [GPS] Richiesta forzata dall'utente - bypasso il throttling");
      setGpsPermissionDenied(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.GPS_PERMISSION_DENIED);
      console.log("✅ [GPS DEBUG] Flag gpsPermissionDenied pulito");
    } else {
      console.log("ℹ️ [GPS DEBUG] Nessun throttling attivo");
    }
    
    console.log("🔍 [GPS DEBUG] Check cache GPS:", { hasCoords: !!gpsCoords, hasTimestamp: !!gpsTimestamp, forceRequest });
    // Verifica se la cache GPS è ancora valida (ma bypassa se forceRequest è true)
    if (gpsCoords && gpsTimestamp && !forceRequest) {
      console.log("📦 [GPS DEBUG] Cache presente (forceRequest=false), verifico validità...");
      const now = Date.now();
      const cacheAge = now - gpsTimestamp;
      console.log("⏱️ [GPS DEBUG] cacheAge:", cacheAge, "GPS_CACHE_DURATION:", GPS_CACHE_DURATION);
      
      if (cacheAge < GPS_CACHE_DURATION) {
        const minutesRemaining = Math.floor((GPS_CACHE_DURATION - cacheAge) / 60000);
        console.log(`📦 [GPS DEBUG] Cache VALIDA - return early (${minutesRemaining} min)`);
        console.log(`✅ [GPS] Cache valida - riutilizzo per ${minutesRemaining} min`);
        console.log(`📍 [GPS] Coordinate: ${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}`);
        console.log("🏁🏁🏁 [GPS DEBUG] === FINE requestGPSLocation (cached) ===\n\n");
        return { success: true }; // Usa la posizione in cache
      } else {
        console.log("⏰ [GPS DEBUG] Cache SCADUTA, richiedo nuova posizione");
        console.log("⏰ [GPS] Cache scaduta, richiedo nuova posizione...");
      }
    } else if (forceRequest && gpsCoords && gpsTimestamp) {
      console.log("🔄🔄🔄 [GPS DEBUG] Cache presente MA forceRequest=true - BYPASSO cache e richiedo nuova posizione");
      console.log("🔄 [GPS] Richiesta forzata - ignoro cache e richiedo nuova posizione...");
    } else {
      console.log("ℹ️ [GPS DEBUG] Nessuna cache disponibile");
      console.log("ℹ️ [GPS] Nessuna cache disponibile, richiedo posizione...");
    }

    if (!token) {
      console.log("❌ [GPS DEBUG] Token non disponibile - return early");
      console.log("🏁🏁🏁 [GPS DEBUG] === FINE requestGPSLocation (no token) ===\n\n");
      return { success: false, errorType: 'other' };
    }

    setIsLoadingGPS(true);
    console.log("🔄 [GPS DEBUG] isLoadingGPS = true");
    console.log("📡 [GPS DEBUG] Chiamo Location.requestForegroundPermissionsAsync()...");
    console.log("📡 [GPS] Richiesta permessi al sistema...");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("📋 [GPS DEBUG] Risposta permessi ricevuta:", status);
      console.log("📋 [GPS] Risposta permessi:", status);

      if (status === "granted") {
        console.log("✅ [GPS DEBUG] Permessi GRANTED, ottengo posizione...");
        console.log("✅ [GPS] Permessi accettati, ottengo posizione...");
        try {
          console.log("📍 [GPS DEBUG] Chiamo Location.getCurrentPositionAsync()...");
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          console.log("📍 [GPS DEBUG] Posizione ottenuta:", location.coords);

          const coords = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          };
          const now = Date.now();
          console.log("💾 [GPS DEBUG] Salvo coordinate:", coords);

          setGpsCoords(coords);
          setGpsTimestamp(now);
          setGpsPermissionDenied(null);
          console.log("✅ [GPS DEBUG] State aggiornato");
          
          // Salva in AsyncStorage
          console.log("💾 [GPS DEBUG] Salvo in AsyncStorage...");
          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.GPS_COORDS, JSON.stringify(coords)),
            AsyncStorage.setItem(STORAGE_KEYS.GPS_TIMESTAMP, now.toString()),
            AsyncStorage.removeItem(STORAGE_KEYS.GPS_PERMISSION_DENIED),
          ]);
          console.log("✅ [GPS DEBUG] Dati salvati in AsyncStorage");
          
          console.log("✅ [GPS] Posizione ottenuta e salvata:", coords);
          console.log("💾 [GPS] Dati persistiti in AsyncStorage");
          console.log("🏁🏁🏁 [GPS DEBUG] === FINE requestGPSLocation (success) ===\n\n");
          return { success: true };
        } catch (locationError: any) {
          // Errore "unsatisfied device settings" = servizi GPS disabilitati sul dispositivo
          console.error("❌ [GPS DEBUG] CATCH locationError:", locationError);
          console.error("❌ [GPS DEBUG] Error message:", locationError?.message);
          console.error("❌ [GPS DEBUG] Error code:", locationError?.code);
          const errorMessage = locationError?.message || '';
          if (errorMessage.includes('unsatisfied device settings') || errorMessage.includes('Location services')) {
            console.log("⚠️⚠️⚠️ [GPS DEBUG] SERVIZI GPS DISABILITATI sul dispositivo");
            console.log("⚠️ [GPS] Servizi GPS disabilitati sul dispositivo");
            const now = Date.now();
            console.log("💾 [GPS DEBUG] Salvo gpsPermissionDenied:", now);
            setGpsPermissionDenied(now);
            await AsyncStorage.setItem(STORAGE_KEYS.GPS_PERMISSION_DENIED, now.toString());
            console.log("💾 [GPS] Stato salvato - userò città preferita o strutture visitate");
            console.log("🏁🏁🏁 [GPS DEBUG] === FINE requestGPSLocation (service_disabled) ===\n\n");
            return { success: false, errorType: 'service_disabled' };
          } else {
            console.error("❌ [GPS DEBUG] Altro errore location");
            console.error("❌ [GPS] Errore ottenimento posizione:", locationError);
            console.log("🏁🏁🏁 [GPS DEBUG] === FINE requestGPSLocation (location error) ===\n\n");
            return { success: false, errorType: 'other' };
          }
        }
      } else {
        // Permessi negati - salva il timestamp
        console.log("❌❌❌ [GPS DEBUG] Permessi NON granted, status:", status);
        const now = Date.now();
        console.log("💾 [GPS DEBUG] Salvo gpsPermissionDenied:", now);
        setGpsPermissionDenied(now);
        
        await AsyncStorage.setItem(STORAGE_KEYS.GPS_PERMISSION_DENIED, now.toString());
        console.log("💾 [GPS DEBUG] gpsPermissionDenied salvato in AsyncStorage");
        
        console.log("❌ [GPS] Permessi negati dall'utente");
        console.log("💾 [GPS] Stato negato salvato - non chiederò per 1 ora");
        console.log("💡 [GPS] Userò città preferita o strutture visitate");
        console.log("🏁🏁🏁 [GPS DEBUG] === FINE requestGPSLocation (permission_denied) ===\n\n");
        return { success: false, errorType: 'permission_denied' };
      }
    } catch (gpsError) {
      console.error("❌❌❌ [GPS DEBUG] CATCH gpsError:", gpsError);
      console.error("❌ [GPS] Errore richiesta permessi:", gpsError);
      // Anche qui salviamo lo stato per non richiedere continuamente
      const now = Date.now();
      console.log("💾 [GPS DEBUG] Salvo gpsPermissionDenied nel catch generale:", now);
      setGpsPermissionDenied(now);
      await AsyncStorage.setItem(STORAGE_KEYS.GPS_PERMISSION_DENIED, now.toString());
      console.log("🏁🏁🏁 [GPS DEBUG] === FINE requestGPSLocation (catch error) ===\n\n");
      return { success: false, errorType: 'other' };
    } finally {
      console.log("🔄 [GPS DEBUG] Finally - isLoadingGPS = false");
      setIsLoadingGPS(false);
      console.log("🏁 [GPS] === FINE DEBUG RICHIESTA GPS ===\n");
    }
  }, [token, gpsCoords, gpsTimestamp, gpsPermissionDenied, initialized]);

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
    gpsTimestamp,
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