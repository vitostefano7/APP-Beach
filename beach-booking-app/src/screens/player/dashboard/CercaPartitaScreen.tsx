import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useCityGeocode } from "../../../hooks/useCityGeocode";

// Calcola la distanza tra due coordinate geografiche (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raggio della Terra in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Calendar, LocaleConfig } from "react-native-calendars";
import SportIcon from '../../../components/SportIcon';
import FilterModal from "../../../components/FilterModal";

import { AuthContext } from "../../../context/AuthContext";
import API_URL from "../../../config/api";
import OpenMatchCard from "./components/OpenMatchCard";
import { useGeographicMatchFiltering } from './hooks/useGeographicMatchFiltering';

// Configurazione lingua italiana per il calendario
LocaleConfig.locales['it'] = {
  monthNames: ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'],
  monthNamesShort: ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'],
  dayNames: ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'],
  dayNamesShort: ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'],
  today: 'Oggi'
};
LocaleConfig.defaultLocale = 'it';

type UserPreferences = {
  preferredLocation?: {
    city: string;
    lat: number;
    lng: number;
    radius: number;
  };
  favoriteSports?: string[];
};

type MatchItem = {
  _id: string;
  createdBy?: {
    _id?: string;
    name?: string;
    surname?: string;
    username?: string;
    avatarUrl?: string | null;
  };
  players?: Array<{
    user?: { _id?: string; name?: string; surname?: string; avatarUrl?: string | null };
    status?: "pending" | "confirmed";
    team?: "A" | "B";
  }>;
  maxPlayers?: number;
  isPublic?: boolean;
  status?: "open" | "full" | "completed" | "cancelled" | "not_team_completed" | "not_completed";
  booking?: {
    _id?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    bookingType?: "private" | "public";
    campo?: {
      name?: string;
      sport?: string;
      struttura?: {
        name?: string;
        location?: { 
          city?: string;
          lat?: number;
          lng?: number;
        };
      };
    };
  };
  createdAt?: string;
};

type MatchListRow =
  | { type: "date"; key: string; date: string }
  | { type: "match"; key: string; match: MatchItem };

const getPlayersCount = (players: MatchItem["players"], status?: "pending" | "confirmed") => {
  if (!players || players.length === 0) return 0;
  if (!status) return players.length;
  return players.filter((player) => player.status === status).length;
};

const parseMatchStart = (match: MatchItem) => {
  if (!match.booking?.date || !match.booking?.startTime) return null;
  try {
    return new Date(`${match.booking.date}T${match.booking.startTime}`);
  } catch {
    return null;
  }
};

const formatMatchDateHeader = (dateString?: string) => {
  if (!dateString) return "Data non disponibile";
  try {
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  } catch {
    return dateString;
  }
};

interface SportData {
  _id: string;
  name: string;
  code: string;
  allowedFormations: string[];
}

const INITIAL_VISIBLE_MATCHES = 10;
const MATCHES_LOAD_STEP = 10;

const getDuration = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return null;
  try {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours % 1 === 0) {
      return `${diffHours}h`;
    } else {
      return `${diffHours.toFixed(1)}h`;
    }
  } catch {
    return null;
  }
};

const getTimeLeft = (item: MatchItem) => {
  const matchStart = new Date(`${item.booking?.date}T${item.booking?.startTime}:00`);
  const registrationDeadline = new Date(matchStart.getTime() - 45 * 60 * 1000); // 45 minutes before
  const now = new Date();
  const diff = registrationDeadline.getTime() - now.getTime();
  if (diff <= 0) return { text: 'Chiuso', color: '#ff0000' };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const totalHours = hours + minutes / 60;
  let color = '#666';
  if (totalHours <= 3) {
    color = '#ff0000'; // red
  } else {
    color = '#ffcc00'; // yellow
  }
  let text;
  if (hours > 0) text = `${hours}h ${minutes}m`;
  else text = `${minutes}m`;
  return { text, color };
};

export default function CercaPartitaScreen() {
  const { token, user } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [tempCity, setTempCity] = useState("");
  const [isCityEditing, setIsCityEditing] = useState(false);
  const [manualCityCoords, setManualCityCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // Hook per geocoding
  const {
    citySuggestions: geocodeSuggestions,
    showSuggestions,
    searchCitySuggestions,
    selectCity,
    resetValidation,
    validateCity,
    cityValidation
  } = useCityGeocode();
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [timeFilter, setTimeFilter] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const [sports, setSports] = useState<SportData[]>([]);
  const [loadingSports, setLoadingSports] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [visibleMatchCount, setVisibleMatchCount] = useState(INITIAL_VISIBLE_MATCHES);
  const cityInputRef = useRef<TextInput>(null);

  const getSportLabel = (sport?: string) => {
    if (!sport) return "Sport";
    const sportData = sports.find(s => s.code === sport);
    return sportData ? sportData.name : sport.charAt(0).toUpperCase() + sport.slice(1).replace(/_/g, ' ');
  };

  const [playersFilter, setPlayersFilter] = useState<string | null>(null);
  const [showPlayersPicker, setShowPlayersPicker] = useState(false);
  const [activeFilterMode, setActiveFilterMode] = useState<'manual' | 'gps' | 'preferred' | 'visited' | 'none'>('none');
  const [activeFilterInfo, setActiveFilterInfo] = useState<string>('');
  
  // 🆕 Stati per modal selezione città al primo accesso
  const [showCitySelectionModal, setShowCitySelectionModal] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Hook per il filtraggio geografico
  const {
    userPreferences,
    visitedStruttureIds,
    gpsCoords,
    gpsTimestamp,
    isLoadingPreferences,
    isLoadingGPS,
    loadUserPreferences,
    loadVisitedStrutture,
    requestGPSLocation,
    filterMatchesByGeography,
    logFilteredMatchesDetails,
  } = useGeographicMatchFiltering(token);

  // Stato per l'indirizzo ottenuto dal GPS (DOPO la dichiarazione di gpsCoords)
  const [gpsAddress, setGpsAddress] = useState<string | null>(null);

  // Funzione per il reverse geocoding delle coordinate GPS
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    try {
      console.log('[DEBUG] Chiamata reverseGeocode con:', lat, lng);
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const res = await fetch(url, { headers: { 'User-Agent': 'SportBookingApp/1.0' } });
      if (res.ok) {
        const data = await res.json();
        console.log('[DEBUG] Risposta reverseGeocode:', data);
        return data.display_name || null;
      } else {
        console.error('[DEBUG] Errore HTTP reverseGeocode:', res.status, res.statusText);
      }
    } catch (e) {
      console.error('[DEBUG] Reverse geocoding error:', e);
    }
    return null;
  }, []);

  // Aggiorna l'indirizzo GPS quando cambiano le coordinate
  useEffect(() => {
    console.log('[DEBUG-USEEFFECT] useEffect (gpsCoords dependency) triggered. gpsCoords:', gpsCoords);
    if (gpsCoords) {
      console.log('[DEBUG-USEEFFECT] gpsCoords presente, chiamo reverseGeocode...');
      reverseGeocode(gpsCoords.lat, gpsCoords.lng).then(addr => {
        console.log('[DEBUG] reverseGeocode result:', addr);
        setGpsAddress(addr);
      });
    } else {
      console.log('[DEBUG-USEEFFECT] gpsCoords è null/undefined, resetto gpsAddress');
      setGpsAddress(null);
    }
  }, [gpsCoords, reverseGeocode]);

  const loadMatches = useCallback(async () => {
    // 🚫 Blocca il caricamento se non ci sono criteri geografici
    const hasGeographicCriteria = 
      gpsCoords || 
      manualCityCoords || 
      userPreferences?.preferredLocation?.city || 
      visitedStruttureIds.length > 0;

    if (!hasGeographicCriteria) {
      console.log("⚠️ [CercaPartita] Nessun criterio geografico - skip caricamento partite");
      setMatches([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      console.log("🔍 [CercaPartita] Caricamento match con token:", token ? "presente" : "MANCANTE");

      const res = await fetch(`${API_URL}/matches?status=open`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      console.log("📡 [CercaPartita] Status risposta:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `Errore ${res.status}` }));
        console.error("❌ [CercaPartita] Errore risposta:", errorData);
        
        if (res.status === 401 || res.status === 403) {
          throw new Error("Non autorizzato");
        }
        throw new Error(errorData.message || `Errore ${res.status}`);
      }

      const data = await res.json();
      
      console.log("📦 [CercaPartita] Dati ricevuti:", JSON.stringify(data).substring(0, 200));

      const rawMatches: MatchItem[] = Array.isArray(data)
        ? data
        : Array.isArray(data.matches)
          ? data.matches
          : Array.isArray(data.data)
            ? data.data
            : [];

      console.log(`✅ [CercaPartita] ${rawMatches.length} match grezzi trovati`);

      const now = new Date();
      const filtered = rawMatches.filter((match) => {
        if (!match?._id) return false;
        if (match.status && ["completed", "cancelled", "full"].includes(match.status)) {
          return false;
        }
        if (match.isPublic === false) return false;

        const confirmedPlayers = getPlayersCount(match.players, "confirmed");
        const maxPlayers = match.maxPlayers || 0;
        if (maxPlayers <= 0 || confirmedPlayers >= maxPlayers) return false;

        const start = parseMatchStart(match);
        if (!start) return false;

        const registrationDeadline = new Date(start.getTime() - 45 * 60 * 1000);
        if (registrationDeadline.getTime() <= now.getTime()) return false;

        const alreadyJoined = match.players?.some((player) => player.user?._id === user?.id);
        if (alreadyJoined) return false;

        return true;
      });

      const sorted = filtered.sort((a, b) => {
        const dateA = parseMatchStart(a)?.getTime() ?? 0;
        const dateB = parseMatchStart(b)?.getTime() ?? 0;
        return dateA - dateB;
      });

      console.log(`✅ [CercaPartita] Partite caricate inizialmente: ${rawMatches.length}`);
      console.log(`✅ [CercaPartita] Partite dopo filtro iniziale (aperte, pubbliche, posti liberi, non unite): ${sorted.length}`);

      setMatches(sorted);
      console.log(`✅ [CercaPartita] State impostato con successo`);
    } catch (err: any) {
      console.error("❌ [CercaPartita] Errore caricamento partite disponibili:", err);
      console.error("❌ [CercaPartita] Stack trace:", err.stack);
      setError(err.message || "Impossibile caricare le partite");
      setMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.id, gpsCoords, manualCityCoords, userPreferences, visitedStruttureIds]);

  const loadSports = useCallback(async () => {
    try {
      setLoadingSports(true);
      console.log("[CercaPartita] Caricamento sport dal backend...");

      const res = await fetch(`${API_URL}/sports`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (!res.ok) {
        throw new Error(`Errore caricamento sport: ${res.status}`);
      }

      const data = await res.json();
      const sportsData: SportData[] = Array.isArray(data.data) ? data.data : [];

      console.log(`[CercaPartita] Caricati ${sportsData.length} sport dal backend`);
      setSports(sportsData);
    } catch (error) {
      console.error("[CercaPartita] Errore caricamento sport:", error);
      setSports([]);
    } finally {
      setLoadingSports(false);
    }
  }, [token]);

  useEffect(() => {
    const loadData = async () => {
      await loadUserPreferences();
      await loadVisitedStrutture();
      await loadSports();
      setPreferencesLoaded(true);
    };
    loadData();
  }, [loadUserPreferences, loadVisitedStrutture, loadSports]);

  // 🆕 Mostra modal selezione città al primo accesso se non ci sono dati geografici
  useEffect(() => {
    if (preferencesLoaded && 
        !gpsCoords && 
        !manualCityCoords && 
        !userPreferences?.preferredLocation?.city && 
        visitedStruttureIds.length === 0) {
      console.log('🎯 [CercaPartita] Primo accesso: mostro modal selezione città obbligatoria');
      setShowCitySelectionModal(true);
    }
  }, [preferencesLoaded, gpsCoords, manualCityCoords, userPreferences, visitedStruttureIds]);

  useEffect(() => {
    // Chiedi GPS dopo che lo screen è caricato (delay di 500ms) - SOLO se non serve il modal
    if (preferencesLoaded && 
        (gpsCoords || manualCityCoords || userPreferences?.preferredLocation?.city || visitedStruttureIds.length > 0)) {
      const timer = setTimeout(() => {
        requestGPSLocation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [requestGPSLocation, preferencesLoaded, gpsCoords, manualCityCoords, userPreferences, visitedStruttureIds]);

  useFocusEffect(
    useCallback(() => {
      // Carica le partite solo se le preferenze sono state caricate
      if (preferencesLoaded) {
        loadMatches();
      }
    }, [loadMatches, preferencesLoaded])
  );

  // 🔄 Ricarica partite quando cambiano i criteri geografici (dopo selezione dal modal)
  useEffect(() => {
    if (preferencesLoaded && (gpsCoords || manualCityCoords)) {
      console.log("🔄 [CercaPartita] Criteri geografici aggiornati, ricarico partite");
      loadMatches();
    }
  }, [gpsCoords, manualCityCoords, preferencesLoaded, loadMatches]);





  const onRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const formatDateLabel = (date: Date | null) => {
    if (!date) return "Giorno";
    return date.toLocaleDateString("it-IT", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  };

  const normalizeSport = (value?: string) => {
    if (!value || typeof value !== 'string') return "";
    return value.toLowerCase().replace(" ", "_");
  };

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 22; hour += 1) {
      slots.push(`${String(hour).padStart(2, "0")}:00`);
      slots.push(`${String(hour).padStart(2, "0")}:30`);
    }
    return slots;
  }, []);

  const playersOptions = useMemo(() => {
    if (sportFilter) {
      const sportData = sports.find(s => s.code === sportFilter);
      return sportData ? sportData.allowedFormations : ["2v2", "3v3", "4v4", "5v5"];
    } else {
      return ["2v2", "3v3", "4v4", "5v5"];
    }
  }, [sportFilter, sports]);

  // Reset playersFilter quando cambia sportFilter e il formato selezionato non è più valido
  useEffect(() => {
    if (sportFilter && playersFilter && !playersOptions.includes(playersFilter)) {
      console.log(`[CercaPartita] Reset formato giocatori: ${playersFilter} non valido per sport ${sportFilter}`);
      setPlayersFilter(null);
    }
  }, [sportFilter, playersFilter, playersOptions]);

  const getMaxPlayersFromFilter = (filter: string) => {
    switch (filter) {
      case "1v1": return 2;
      case "2v2": return 4;
      case "3v3": return 6;
      case "4v4": return 8;
      case "5v5": return 10;
      case "6v6": return 12;
      case "7v7": return 14;
      case "8v8": return 16;
      case "11v11": return 22;
      default: return 0;
    }
  };

  const currentFilter = useMemo(() => {
    console.log('[DEBUG] currentFilter: gpsCoords', gpsCoords, 'gpsAddress', gpsAddress);
    if (cityFilter.trim() && manualCityCoords) {
      return { mode: 'manual' as const, displayCity: cityFilter, canClear: true };
    }
    if (gpsCoords) {
      console.log('[DEBUG] currentFilter using GPS address:', gpsAddress);
      // Determina se la posizione è recente (< 2 min) o cached (>= 2 min)
      const cacheAge = gpsTimestamp ? Date.now() - gpsTimestamp : 0;
      const isCached = cacheAge >= 2 * 60 * 1000; // 2 minuti
      const displayLabel = isCached ? 'Posizione recente' : 'Posizione GPS';
      return { mode: 'gps' as const, displayCity: displayLabel, canClear: false };
    }
    if (userPreferences?.preferredLocation?.city) {
      return { mode: 'preferred' as const, displayCity: userPreferences.preferredLocation.city, canClear: false };
    }
    if (visitedStruttureIds.length > 0) {
      return { mode: 'visited' as const, displayCity: 'Strutture visitate', canClear: false };
    }
    return { mode: 'none' as const, displayCity: '', canClear: false };
  }, [cityFilter, manualCityCoords, gpsCoords, gpsTimestamp, gpsAddress, userPreferences, visitedStruttureIds]);

  const filteredMatches = useMemo(() => {
    console.log("🔍 [CercaPartita] === INIZIO FILTRAGGIO ===");
    console.log("🔍 [CercaPartita] Partite totali da filtrare:", matches.length);
    console.log("🔍 [CercaPartita] Filtri attivi: città=" + (cityFilter || "nessuno") + ", data=" + (dateFilter ? formatDate(dateFilter) : "nessuno") + ", orario=" + (timeFilter || "nessuno") + ", sport=" + (sportFilter || "nessuno") + ", giocatori=" + (playersFilter || "nessuno"));
    console.log("🔍 [CercaPartita] Città preferita:", userPreferences?.preferredLocation);
    console.log("🔍 [CercaPartita] GPS coords:", gpsCoords);
    console.log("🔍 [CercaPartita] Manual coords:", manualCityCoords);
    console.log("🔍 [CercaPartita] Strutture visitate:", visitedStruttureIds.length);
    
    // Determina la città di riferimento e il raggio con priorità corrette
    let referenceLat: number | null = null;
    let referenceLng: number | null = null;
    let searchRadius = 30; // Default 30km
    const filterMode = currentFilter.mode;
    let activeFilterInfo = '';
    
    if (filterMode === 'manual') {
      referenceLat = manualCityCoords!.lat;
      referenceLng = manualCityCoords!.lng;
      searchRadius = 30;
      activeFilterInfo = `${cityFilter} (30 km)`;
      console.log("📍 [CercaPartita] PRIORITÀ 1 - Città manuale:", cityFilter, "Raggio: 30km");
    } else if (filterMode === 'gps') {
      referenceLat = gpsCoords!.lat;
      referenceLng = gpsCoords!.lng;
      searchRadius = 30;
      activeFilterInfo = gpsAddress ? `${gpsAddress} (30 km)` : 'Posizione GPS (30 km)';
      console.log("📍 [CercaPartita] PRIORITÀ 2 - GPS:", gpsCoords, "Raggio: 30km");
    } else if (filterMode === 'preferred') {
      referenceLat = userPreferences!.preferredLocation!.lat;
      referenceLng = userPreferences!.preferredLocation!.lng;
      searchRadius = userPreferences!.preferredLocation!.radius || 30;
      activeFilterInfo = `${userPreferences!.preferredLocation!.city} (${searchRadius} km - Città Preferita)`;
      console.log("📍 [CercaPartita] PRIORITÀ 3 - Città preferita:", userPreferences.preferredLocation.city, "Raggio:", searchRadius, "km");
    } else if (filterMode === 'visited') {
      activeFilterInfo = `Strutture dove hai già giocato (${visitedStruttureIds.length})`;
      console.log("📍 [CercaPartita] FALLBACK - Strutture visitate:", visitedStruttureIds.length, "strutture");
    } else {
      // FALLBACK FINALE: Se non c'è nessun criterio geografico, non mostrare partite
      activeFilterInfo = 'Seleziona una città per vedere partite vicine';
      console.log("⚠️ [CercaPartita] NESSUN criterio geografico - mostro empty state con CTA");
      setActiveFilterMode(filterMode);
      setActiveFilterInfo(activeFilterInfo);
      return []; // 🚫 Nessuna partita senza criterio geografico
    }
    
    setActiveFilterMode(filterMode);
    setActiveFilterInfo(activeFilterInfo);

    // Filtra le partite
    let filtered = matches.filter((match) => {
      const structureName = match.booking?.campo?.struttura?.name || "N/A";
      const structureCity = match.booking?.campo?.struttura?.location?.city || "";
      const structureLat = match.booking?.campo?.struttura?.location?.lat;
      const structureLng = match.booking?.campo?.struttura?.location?.lng;
      const strutturaId = typeof match.booking?.campo?.struttura === 'object' 
        ? (match.booking?.campo?.struttura as any)?._id 
        : match.booking?.campo?.struttura;
      
      // Filtro raggio: se c'è un riferimento geografico (manuale, GPS o preferita)
      if (referenceLat !== null && referenceLng !== null) {
        if (structureLat && structureLng) {
          const distance = calculateDistance(referenceLat, referenceLng, structureLat, structureLng);
          //console.log(`📏 [CercaPartita] ${structureName} (${structureCity}): ${distance.toFixed(2)}km`);
          if (distance > searchRadius) {
            return false;
          }
        } else {
          // Se la struttura non ha coordinate, faccio fallback sul controllo testuale della città
          console.log(`⚠️ [CercaPartita] ${structureName} non ha coordinate, fallback su città testuale`);
          if (cityFilter.trim()) {
            // Se c'è un filtro città manuale, controlla la corrispondenza testuale
            if (!structureCity || !structureCity.toLowerCase().includes(cityFilter.trim().toLowerCase())) {
              return false;
            }
          } else if (userPreferences?.preferredLocation?.city) {
            // Se usiamo città preferita, controlla la corrispondenza testuale
            if (!structureCity || !structureCity.toLowerCase().includes(userPreferences.preferredLocation.city.toLowerCase())) {
              return false;
            }
          } else {
            // Nessun modo di verificare, escludi
            return false;
          }
        }
      }
      // Filtro strutture visitate: se nessun riferimento geografico
      else if (filterMode === 'visited') {
        if (!strutturaId || !visitedStruttureIds.includes(strutturaId)) {
          console.log(`🏟️ [CercaPartita] ${structureName}: escluso (struttura non visitata)`);
          return false;
        } else {
          console.log(`✅ [CercaPartita] ${structureName}: incluso (struttura visitata)`);
        }
      }

      // Filtro data: si applica sempre
      if (dateFilter) {
        if (match.booking?.date !== formatDate(dateFilter)) {
          return false;
        }
      }

      // Filtro orario
      if (timeFilter) {
        if (match.booking?.startTime !== timeFilter) {
          return false;
        }
      }

      // Filtro sport
      if (sportFilter) {
        const matchSport = normalizeSport(match.booking?.campo?.sport);
        if (matchSport !== sportFilter) {
          return false;
        }
      }

      // Filtro giocatori
      if (playersFilter) {
        const expectedMax = getMaxPlayersFromFilter(playersFilter);
        if (match.maxPlayers !== expectedMax) {
          return false;
        }
      }

      return true;
    });

    if (filterMode === 'manual' || filterMode === 'gps' || filterMode === 'preferred') {
      console.log(`✅ [CercaPartita] ${filtered.length} match dopo filtro ${filterMode} con raggio ${searchRadius}km`);
    } else if (filterMode === 'visited') {
      console.log(`✅ [CercaPartita] ${filtered.length} match dopo filtro strutture visitate`);
    } else {
      console.log(`✅ [CercaPartita] ${filtered.length} match senza filtro geografico`);
    }

    // Se nessun risultato e c'è un riferimento geografico, amplia il raggio a 50km
    if (filtered.length === 0 && (filterMode === 'manual' || filterMode === 'gps' || filterMode === 'preferred') && referenceLat !== null && referenceLng !== null && searchRadius < 50) {
      console.log("⚠️ [CercaPartita] Nessun risultato, amplio il raggio a 50km");
      searchRadius = 50;
      
      // 🔧 FIX: Aggiorna l'header con il nuovo raggio ampliato
      if (filterMode === 'manual') {
        activeFilterInfo = `${cityFilter} (50 km)`;
      } else if (filterMode === 'gps') {
        activeFilterInfo = gpsAddress ? `${gpsAddress} (50 km)` : 'Posizione GPS (50 km)';
      } else if (filterMode === 'preferred') {
        activeFilterInfo = `${userPreferences!.preferredLocation!.city} (50 km - Città Preferita)`;
      }
      setActiveFilterInfo(activeFilterInfo);
      
      filtered = matches.filter((match) => {
        const structureName = match.booking?.campo?.struttura?.name || "N/A";
        const structureCity = match.booking?.campo?.struttura?.location?.city || "";
        const structureLat = match.booking?.campo?.struttura?.location?.lat;
        const structureLng = match.booking?.campo?.struttura?.location?.lng;
        
        // Filtro raggio con 50km
        if (structureLat && structureLng) {
          const distance = calculateDistance(referenceLat!, referenceLng!, structureLat, structureLng);
          //console.log(`📏 [CercaPartita] 50km - ${structureName} (${structureCity}): ${distance.toFixed(2)}km`);
          if (distance > searchRadius) {
            return false;
          }
        } else {
          // Fallback su città testuale se non ha coordinate
          console.log(`⚠️ [CercaPartita] 50km - ${structureName} non ha coordinate, fallback su città testuale`);
          if (cityFilter.trim()) {
            if (!structureCity || !structureCity.toLowerCase().includes(cityFilter.trim().toLowerCase())) {
              return false;
            }
          } else if (userPreferences?.preferredLocation?.city) {
            if (!structureCity || !structureCity.toLowerCase().includes(userPreferences.preferredLocation.city.toLowerCase())) {
              return false;
            }
          } else {
            return false;
          }
        }

        // Filtro data
        if (dateFilter) {
          if (match.booking?.date !== formatDate(dateFilter)) {
            return false;
          }
        }

        // Filtro orario
        if (timeFilter) {
          if (match.booking?.startTime !== timeFilter) {
            return false;
          }
        }

        // Filtro sport
        if (sportFilter) {
          const matchSport = normalizeSport(match.booking?.campo?.sport);
          if (matchSport !== sportFilter) {
            return false;
          }
        }

        return true;
      });
      
      console.log(`✅ [CercaPartita] ${filtered.length} match dopo ampliamento a 50km`);
    }

    // Ordinamento: se NON c'è filtro città manuale, ordina mettendo prima i match della città preferita
    if (!cityFilter.trim() && userPreferences?.preferredLocation?.city) {
      const preferredCity = userPreferences.preferredLocation.city.toLowerCase();
      console.log("📍 [CercaPartita] Ordinamento con città preferita:", preferredCity);
      
      const sorted = filtered.sort((a, b) => {
        const cityA = (a.booking?.campo?.struttura?.location?.city || "").toLowerCase();
        const cityB = (b.booking?.campo?.struttura?.location?.city || "").toLowerCase();
        
        const aIsPreferred = cityA.includes(preferredCity);
        const bIsPreferred = cityB.includes(preferredCity);
        
        // Prima quelli della città preferita
        if (aIsPreferred && !bIsPreferred) return -1;
        if (!aIsPreferred && bIsPreferred) return 1;
        
        // Poi ordina per data
        const dateA = parseMatchStart(a)?.getTime() ?? 0;
        const dateB = parseMatchStart(b)?.getTime() ?? 0;
        return dateA - dateB;
      });
      
      return sorted;
    }

    // Ordinamento normale per data
    console.log("📍 [CercaPartita] Ordinamento normale per data");
    const finalResult = filtered.sort((a, b) => {
      const dateA = parseMatchStart(a)?.getTime() ?? 0;
      const dateB = parseMatchStart(b)?.getTime() ?? 0;
      return dateA - dateB;
    });
    
    // Log dettagliato per ogni card mostrata
    console.log(`📋 Dettagli match cercapartita mostrati (${finalResult.length}):`);
    finalResult.forEach((match, index) => {
      const confirmedPlayers = getPlayersCount(match.players, 'confirmed');
      const maxPlayers = match.maxPlayers || 0;
      const struttura = match.booking?.campo?.struttura?.name || 'N/A';
      const citta = match.booking?.campo?.struttura?.location?.city || 'N/A';
      const dataOra = match.booking?.date && match.booking?.startTime ? 
        `${match.booking.date} ${match.booking.startTime}` : 'N/A';
      
      console.log(`   ${index + 1}. Match ${match._id?.slice(-6)} - ${struttura} (${citta}) - ${dataOra} - ${confirmedPlayers}/${maxPlayers} giocatori`);
      console.log(`      ✅ Criteri soddisfatti: ${filterMode === 'manual' ? 'città manuale' : filterMode === 'gps' ? 'posizione GPS' : filterMode === 'preferred' ? 'città preferita' : filterMode === 'visited' ? 'strutture visitate' : 'nessun filtro geografico'}`);
    });
    
    console.log(`✅ [CercaPartita] === FINE FILTRAGGIO === Partite finali mostrate: ${finalResult.length}`);
    return finalResult;
  }, [matches, cityFilter, dateFilter, timeFilter, sportFilter, userPreferences, manualCityCoords, visitedStruttureIds, playersFilter, currentFilter]);

  useEffect(() => {
    setVisibleMatchCount(INITIAL_VISIBLE_MATCHES);
  }, [filteredMatches]);

  const visibleMatches = useMemo(() => {
    return filteredMatches.slice(0, visibleMatchCount);
  }, [filteredMatches, visibleMatchCount]);

  const hasMoreMatches = visibleMatchCount < filteredMatches.length;

  const loadMoreMatches = useCallback(() => {
    if (!hasMoreMatches) return;
    setVisibleMatchCount((prev) => Math.min(prev + MATCHES_LOAD_STEP, filteredMatches.length));
  }, [hasMoreMatches, filteredMatches.length]);

  const groupedListRows = useMemo<MatchListRow[]>(() => {
    const rows: MatchListRow[] = [];
    let lastDate = "";

    visibleMatches.forEach((match) => {
      const matchDate = match.booking?.date || "Data non disponibile";

      if (matchDate !== lastDate) {
        rows.push({
          type: "date",
          key: `date-${matchDate}`,
          date: matchDate,
        });
        lastDate = matchDate;
      }

      rows.push({
        type: "match",
        key: `match-${match._id}`,
        match,
      });
    });

    return rows;
  }, [visibleMatches]);

  // Gestione cambio testo città
  const handleCityTextChange = useCallback((text: string) => {
    console.log("🔤 [CercaPartita] Cambio testo città:", text);
    setTempCity(text);
    if (!text.trim()) {
      setManualCityCoords(null);
      resetValidation();
    } else {
      searchCitySuggestions(text);
    }
  }, [searchCitySuggestions, resetValidation]);

  // Selezione città dai suggerimenti
  const handleSelectCitySuggestion = useCallback((suggestion: any) => {
    console.log("✅ [CercaPartita] Città selezionata:", suggestion);
    const cityName = suggestion.name;
    setTempCity(cityName);
    setCityFilter(cityName);
    setManualCityCoords({ lat: suggestion.lat, lng: suggestion.lng });
    selectCity(suggestion);
    setIsCityEditing(false);
  }, [selectCity]);

  // Geocoding città con hook globale
  const geocodeCity = useCallback(async (cityName: string) => {
    try {
      console.log("🌍 [CercaPartita] Geocoding città:", cityName);
      const coords = await validateCity(cityName);
      if (coords) {
        console.log("✅ [CercaPartita] Coordinate città:", coords);
      }
      return coords;
    } catch (error) {
      console.error("❌ [CercaPartita] Errore geocoding:", error);
      return null;
    }
  }, [validateCity]);

  const handleUseGPS = async () => {
    console.log("\n\n🎯🎯🎯 [CercaPartita] === CLICK BOTTONE GPS ===");
    console.log("📍 [CercaPartita] Richiesta posizione GPS dall'input (click utente esplicito)...");
    console.log("🔄 [CercaPartita] Chiamo requestGPSLocation(true)...");
    
    const result = await requestGPSLocation(true); // forceRequest = true per bypassare throttling
    
    console.log("📦 [CercaPartita] Risultato requestGPSLocation:", result);
    
    if (result.success) {
      //console.log("✅ [CercaPartita] SUCCESS - reset manual city e chiudo editing");
      setManualCityCoords(null); // Reset manual city when using GPS
      setIsCityEditing(false);
    } else {
      console.log("❌ [CercaPartita] ERRORE - tipo:", result.errorType);
      // Gestisci gli errori
      if (result.errorType === 'service_disabled') {
        console.log("🚨 [CercaPartita] Mostro Alert service_disabled");
        Alert.alert(
          "Servizi di localizzazione disabilitati",
          "Attiva la localizzazione del dispositivo nelle impostazioni per utilizzare il GPS.",
          [{ text: "OK" }]
        );
      } else if (result.errorType === 'permission_denied') {
        console.log("🚨 [CercaPartita] Mostro Alert permission_denied");
        Alert.alert(
          "Permessi di localizzazione negati",
          "Autorizza l'accesso alla posizione nelle impostazioni dell'app per utilizzare questa funzione.",
          [{ text: "OK" }]
        );
      } else {
        console.log("🚨 [CercaPartita] Errore sconosciuto - nessun alert");
      }
    }
    console.log("🎯🎯🎯 [CercaPartita] === FINE CLICK BOTTONE GPS ===\n\n");
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
      >
        <Pressable
          style={[
            styles.filterChip,
            currentFilter.displayCity && styles.filterChipActive,
          ]}
          onPress={() => {
            setTempCity(cityFilter);
            setIsCityEditing(true);
          }}
        >
          <Ionicons 
            name="location" 
            size={14} 
            color={currentFilter.displayCity ? "#2196F3" : "#666"} 
          />
          <Text style={[
            styles.filterChipText,
            currentFilter.displayCity && styles.filterChipTextActive,
          ]}>
            {currentFilter.displayCity || "Città"}
          </Text>
          {currentFilter.canClear && (
            <Pressable
              style={styles.filterChipClear}
              onPress={(event) => {
                event.stopPropagation();
                setCityFilter("");
                setManualCityCoords(null);
                // GPS coords are managed by the hook, no manual reset
              }}
            >
              <Ionicons name="close" size={12} color="#2196F3" />
            </Pressable>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.filterChip,
            dateFilter && styles.filterChipActive,
          ]}
          onPress={() => setShowCalendar(true)}
        >
          <Ionicons 
            name="calendar" 
            size={14} 
            color={dateFilter ? "#2196F3" : "#666"} 
          />
          <Text style={[
            styles.filterChipText,
            dateFilter && styles.filterChipTextActive,
          ]}>
            {formatDateLabel(dateFilter)}
          </Text>
          {dateFilter && (
            <Pressable
              style={styles.filterChipClear}
              onPress={(event) => {
                event.stopPropagation();
                setDateFilter(null);
              }}
            >
              <Ionicons name="close" size={12} color="#2196F3" />
            </Pressable>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.filterChip,
            timeFilter && styles.filterChipActive,
          ]}
          onPress={() => setShowTimePicker(true)}
        >
          <Ionicons 
            name="time" 
            size={14} 
            color={timeFilter ? "#2196F3" : "#666"} 
          />
          <Text style={[
            styles.filterChipText,
            timeFilter && styles.filterChipTextActive,
          ]}>
            {timeFilter || "Orario"}
          </Text>
          {timeFilter && (
            <Pressable
              style={styles.filterChipClear}
              onPress={(event) => {
                event.stopPropagation();
                setTimeFilter(null);
              }}
            >
              <Ionicons name="close" size={12} color="#2196F3" />
            </Pressable>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.filterChip,
            sportFilter && styles.filterChipActive,
          ]}
          onPress={() => setShowSportPicker(true)}
        >
          <Ionicons 
            name="basketball" 
            size={14} 
            color={sportFilter ? "#2196F3" : "#666"} 
          />
          <Text style={[
            styles.filterChipText,
            sportFilter && styles.filterChipTextActive,
          ]}>
            {sportFilter ? getSportLabel(sportFilter) : "Sport"}
          </Text>
          {sportFilter && (
            <Pressable
              style={styles.filterChipClear}
              onPress={(event) => {
                event.stopPropagation();
                setSportFilter(null);
              }}
            >
              <Ionicons name="close" size={12} color="#2196F3" />
            </Pressable>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.filterChip,
            playersFilter && styles.filterChipActive,
          ]}
          onPress={() => setShowPlayersPicker(true)}
        >
          <Ionicons 
            name="people" 
            size={14} 
            color={playersFilter ? "#2196F3" : "#666"} 
          />
          <Text style={[
            styles.filterChipText,
            playersFilter && styles.filterChipTextActive,
          ]}>
            {playersFilter || "Formato"}
          </Text>
          {sportFilter && (
            <View style={styles.filterChipIndicator}>
              <Ionicons name="basketball" size={8} color="#2196F3" />
            </View>
          )}
          {playersFilter && (
            <Pressable
              style={styles.filterChipClear}
              onPress={(event) => {
                event.stopPropagation();
                setPlayersFilter(null);
              }}
            >
              <Ionicons name="close" size={12} color="#2196F3" />
            </Pressable>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );

  const handleJoinMatch = async (match: MatchItem) => {
    const bookingId = match.booking?._id;
    if (!bookingId) {
      Alert.alert("Errore", "ID prenotazione non disponibile");
      return;
    }
    navigation.navigate("DettaglioPrenotazione", { bookingId, openJoinModal: true });
  };

  const renderMatchCard = ({ item }: { item: MatchItem }) => {
    const bookingId = item.booking?._id;
    const strutturaId = typeof item.booking?.campo?.struttura === 'object'
      ? (item.booking?.campo?.struttura as any)?._id
      : item.booking?.campo?.struttura;
    const isVisitedStructure = !!strutturaId && visitedStruttureIds.includes(strutturaId);

    return (
      <OpenMatchCard
        match={item}
        isVisitedStructure={isVisitedStructure}
        onPress={() => {
          if (!bookingId) {
            Alert.alert("Errore", "ID prenotazione non disponibile");
            return;
          }
          navigation.navigate("DettaglioPrenotazione", { bookingId, fromOpenMatch: true });
        }}
        onJoin={() => handleJoinMatch(item)}
      />
    );
  };

  const renderGroupedRow = ({ item }: { item: MatchListRow }) => {
    if (item.type === "date") {
      return (
        <View style={styles.dateGroupHeader}>
          <Text style={styles.dateGroupHeaderText}>{formatMatchDateHeader(item.date)}</Text>
        </View>
      );
    }

    return renderMatchCard({ item: item.match });
  };

  if (loading && !refreshing) {
    // 🚫 Se è il primo caricamento e non ci sono criteri geografici, mostra il modal invece del loading
    if (!preferencesLoaded || showCitySelectionModal) {
      return null; // Il modal verrà mostrato sotto
    }
    
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento partite...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>Cerca una partita</Text>
          <View style={styles.headerSpacer} />
        </View>
        {renderFilters()}
        {isCityEditing && (
          <View style={styles.cityEditContainer}>
            <View style={styles.cityEditField}>
              <Ionicons name="search" size={18} color="#666" />
              <TextInput
                style={styles.cityEditInput}
                placeholder="Cerca città..."
                placeholderTextColor="#999"
                value={tempCity}
                onChangeText={handleCityTextChange}
                autoCapitalize="words"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={async () => {
                  const cityName = tempCity.trim();
                  if (cityName) {
                    const coords = await geocodeCity(cityName);
                    if (coords) {
                      setManualCityCoords(coords);
                    }
                    setCityFilter(cityName);
                  } else {
                    setCityFilter("");
                    setManualCityCoords(null);
                  }
                  resetValidation();
                  setIsCityEditing(false);
                }}
              />
              <Pressable
                style={styles.cityEditGPS}
                onPress={handleUseGPS}
                disabled={isLoadingGPS}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Usa posizione GPS"
              >
                {isLoadingGPS ? (
                  <ActivityIndicator size="small" color="#2196F3" />
                ) : (
                  <Ionicons name="locate" size={18} color="#2196F3" />
                )}
              </Pressable>
              <Pressable
                style={styles.cityEditApply}
                onPress={async () => {
                  const cityName = tempCity.trim();
                  if (cityName) {
                    const coords = await geocodeCity(cityName);
                    if (coords) {
                      setManualCityCoords(coords);
                    }
                    setCityFilter(cityName);
                  } else {
                    setCityFilter("");
                    setManualCityCoords(null);
                  }
                  resetValidation();
                  setIsCityEditing(false);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Applica città"
              >
                <Ionicons name="checkmark" size={18} color="white" />
              </Pressable> 
              <Pressable
                style={styles.cityEditCancel}
                onPress={() => {
                  setTempCity(cityFilter);
                  resetValidation();
                  setIsCityEditing(false);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Annulla ricerca città"
              >
                <Ionicons name="close" size={18} color="#666" />
              </Pressable> 
            </View>

            {/* Suggerimenti città */}
            {showSuggestions && geocodeSuggestions.length > 0 && (
              <View style={styles.citySuggestionsContainer}>
                {cityValidation.isValidating && (
                  <View style={styles.citySuggestionItem}>
                    <ActivityIndicator size="small" color="#2196F3" />
                    <Text style={styles.citySuggestionText}>Ricerca in corso...</Text>
                  </View>
                )}
                {!cityValidation.isValidating && geocodeSuggestions.map((suggestion, index) => (
                  <Pressable
                    key={index}
                    style={styles.citySuggestionItem}
                    onPress={() => handleSelectCitySuggestion(suggestion)}
                  >
                    <Ionicons name="location" size={16} color="#2196F3" />
                    <Text style={styles.citySuggestionText} numberOfLines={1}>
                      {suggestion.displayName}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
        {activeFilterMode !== 'none' && activeFilterInfo && (
          <View style={styles.filterInfoContainer}>
            <Ionicons name="location" size={14} color="#666" />
            <Text style={styles.filterInfoText}>
              Ricerca vicino a: <Text style={styles.filterInfoValue}>{activeFilterInfo}</Text>
            </Text>
          </View>
        )}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadMatches}>
            <Text style={styles.retryButtonText}>Riprova</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={groupedListRows}
            keyExtractor={(item) => item.key}
            renderItem={renderGroupedRow}
            contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + 24 }]}
            onEndReached={loadMoreMatches}
            onEndReachedThreshold={0.35}
            onRefresh={onRefresh}
            refreshing={!!refreshing}
            ListFooterComponent={
              hasMoreMatches ? (
                <View style={styles.loadMoreFooter}>
                  <ActivityIndicator size="small" color="#2196F3" />
                  <Text style={styles.loadMoreFooterText}>Carico altre partite...</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              activeFilterMode === 'none' ? (
                <View style={styles.emptyState}>
                  <Ionicons name="location-outline" size={64} color="#CCC" />
                  <Text style={styles.emptyTitle}>Dove vuoi cercare partite?</Text>
                  <Text style={styles.emptySubtitle}>
                    Attiva il GPS o seleziona una città per scoprire le partite disponibili
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                    <Pressable
                      style={[styles.retryButton, { flex: 1, backgroundColor: '#2196F3' }]}
                      onPress={async () => {
                        const result = await requestGPSLocation(true);
                        if (!result.success) {
                          // Se fallisce, apri il modal città
                          setShowCitySelectionModal(true);
                        }
                      }}
                    >
                      <Ionicons name="locate" size={16} color="white" style={{ marginRight: 6 }} />
                      <Text style={styles.retryButtonText}>Usa GPS</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.retryButton, { flex: 1, backgroundColor: '#666' }]}
                      onPress={() => setShowCitySelectionModal(true)}
                    >
                      <Ionicons name="location" size={16} color="white" style={{ marginRight: 6 }} />
                      <Text style={styles.retryButtonText}>Cerca città</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={56} color="#ccc" />
                  <Text style={styles.emptyTitle}>Nessuna partita disponibile</Text>
                  <Text style={styles.emptySubtitle}>
                    Al momento non ci sono partite con posti liberi. Prova a modificare i filtri.
                  </Text>
                </View>
              )
            }
          />
        </>
      )}

      <FilterModal
        visible={showCalendar}
        title="Seleziona una data"
        onClose={() => setShowCalendar(false)}
      >
        <View style={styles.calendarContainer}>
          <Calendar
            current={formatDate(dateFilter) || formatDate(new Date())}
            minDate={formatDate(new Date())}
            onDayPress={(day) => {
              setDateFilter(new Date(day.dateString));
              setShowCalendar(false);
            }}
            markedDates={{
              [formatDate(dateFilter) || ""]: {
                selected: true,
                selectedColor: "#2196F3",
              },
            }}
            theme={{
              backgroundColor: "#ffffff",
              calendarBackground: "#ffffff",
              textSectionTitleColor: "#666",
              selectedDayBackgroundColor: "#2196F3",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#2196F3",
              dayTextColor: "#1A1A1A",
              textDisabledColor: "#d9d9d9",
              dotColor: "#2196F3",
              selectedDotColor: "#ffffff",
              arrowColor: "#2196F3",
              monthTextColor: "#1A1A1A",
              indicatorColor: "#2196F3",
              textDayFontWeight: "500",
              textMonthFontWeight: "700",
              textDayHeaderFontWeight: "600",
              textDayFontSize: 15,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 13,
            }}
          />
        </View>
      </FilterModal>

      <FilterModal
        visible={showSportPicker}
        title="Scegli sport"
        onClose={() => setShowSportPicker(false)}
        contentScrollable
        searchable
        searchPlaceholder="Cerca sport..."
      >
        {(search) => (
          loadingSports ? (
            <View style={styles.citySuggestionItem}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.citySuggestionText}>Caricamento sport...</Text>
            </View>
          ) : (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.filterModalOption,
                  styles.filterModalOptionWithBorder,
                  pressed && { backgroundColor: "#E3F2FD" }
                ]}
                onPress={() => {
                  setSportFilter(null);
                  setShowSportPicker(false);
                }}
              >
                <Text style={styles.filterModalOptionText}>✨ Tutti gli sport</Text>
              </Pressable>
              {sports.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map((sport, index) => (
                <Pressable
                  key={sport._id}
                  style={({ pressed }) => [
                    styles.filterModalOption,
                    index < sports.length - 1 && styles.filterModalOptionWithBorder,
                    pressed && { backgroundColor: "#E3F2FD" }
                  ]}
                  onPress={() => {
                    setSportFilter(sport.code);
                    setShowSportPicker(false);
                  }}
                >
                  <SportIcon sport={sport.code} size={16} color="#2196F3" />
                  <Text style={[styles.filterModalOptionText, { marginLeft: 12 }]}>{sport.name}</Text>
                </Pressable>
              ))}
            </>
          )
        )}
      </FilterModal>

      <FilterModal
        visible={showPlayersPicker}
        title={sportFilter ? `Formati per ${getSportLabel(sportFilter)}` : 'Scegli formato partita'}
        subtitle={sportFilter ? 'Solo i formati disponibili per questo sport' : undefined}
        onClose={() => setShowPlayersPicker(false)}
        contentScrollable
        searchable
        searchPlaceholder="Cerca formato..."
      >
        {(search) => (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.filterModalOption,
                styles.filterModalOptionWithBorder,
                pressed && { backgroundColor: "#E3F2FD" }
              ]}
              onPress={() => {
                setPlayersFilter(null);
                setShowPlayersPicker(false);
              }}
            >
              <Text style={styles.filterModalOptionText}>✨ Tutti i formati</Text>
            </Pressable>
            {playersOptions.filter(o => o.toLowerCase().includes(search.toLowerCase())).map((option, index) => (
              <Pressable
                key={option}
                style={({ pressed }) => [
                  styles.filterModalOption,
                  index < playersOptions.length - 1 && styles.filterModalOptionWithBorder,
                  pressed && { backgroundColor: "#E3F2FD" }
                ]}
                onPress={() => {
                  setPlayersFilter(option);
                  setShowPlayersPicker(false);
                }}
              >
                <Ionicons name="people" size={16} color="#2196F3" />
                <Text style={[styles.filterModalOptionText, { marginLeft: 12 }]}>{option}</Text>
              </Pressable>
            ))}
          </>
        )}
      </FilterModal>

      <FilterModal
        visible={showTimePicker}
        title="Seleziona un orario"
        onClose={() => setShowTimePicker(false)}
        contentScrollable
        searchable
        searchPlaceholder="Cerca orario..."
      >
        {(search) => (
          <>
            {timeSlots.filter(s => s.toLowerCase().includes(search.toLowerCase())).map((slot, index) => (
              <Pressable
                key={slot}
                style={({ pressed }) => [
                  styles.filterModalOption,
                  index < timeSlots.length - 1 && styles.filterModalOptionWithBorder,
                  pressed && { backgroundColor: "#E3F2FD" }
                ]}
                onPress={() => {
                  setTimeFilter(slot);
                  setShowTimePicker(false);
                }}
              >
                <Ionicons name="time" size={16} color="#2196F3" />
                <Text style={[styles.filterModalOptionText, { marginLeft: 12 }]}>{slot}</Text>
              </Pressable>
            ))}
          </>
        )}
      </FilterModal>

      {/* 🆕 Overlay selezione città iniziale - Non blocca i tab */}
      {showCitySelectionModal && (
        <View style={styles.citySelectionFixedOverlay}>
          <View style={styles.citySelectionContent}>
            {/* Header con icona */}
            <View style={styles.citySelectionHeader}>
              <View style={styles.citySelectionIconContainer}>
                <Ionicons name="football" size={32} color="white" />
              </View>
              <Text style={styles.citySelectionTitle}>Benvenuto! 🎾</Text>
              <Text style={styles.citySelectionSubtitle}>
                Seleziona la tua posizione per scoprire le partite disponibili nella tua zona
              </Text>
            </View>
            
            {/* Opzione GPS */}
            <Pressable
              style={styles.gpsButton}
              onPress={async () => {
                try {
                  const result = await requestGPSLocation(true);
                  if (result.success) {
                    console.log('✅ GPS attivato correttamente');
                    setShowCitySelectionModal(false);
                  } else {
                    Alert.alert(
                      "GPS non disponibile",
                      "Non è stato possibile accedere alla posizione. Inserisci manualmente una città.",
                      [{ text: "OK" }]
                    );
                  }
                } catch (error) {
                  console.error('Errore GPS:', error);
                  Alert.alert(
                    "Errore GPS",
                    "Si è verificato un errore nell'accesso alla posizione.",
                    [{ text: "OK" }]
                  );
                }
              }}
            >
              <View style={styles.gpsButtonContent}>
                <View style={styles.gpsButtonIcon}>
                  <Ionicons name="locate" size={24} color="#2196F3" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gpsButtonTitle}>Usa la mia posizione</Text>
                  <Text style={styles.gpsButtonSubtitle}>Rileva automaticamente dove ti trovi</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            </Pressable>
            
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>oppure</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <View style={styles.manualInputWrapper}>
              <Text style={styles.manualInputLabel}>Inserisci una città</Text>
              <View style={styles.manualInputField}>
                <Ionicons name="search" size={20} color="#999" />
                <TextInput
                  style={styles.manualInput}
                  placeholder="Es: Milano, Roma, Napoli..."
                  placeholderTextColor="#999"
                  value={tempCity}
                  onChangeText={handleCityTextChange}
                  autoCapitalize="words"
                />
              </View>
              
              {showSuggestions && geocodeSuggestions.length > 0 && (
                <View style={styles.citySuggestionsContainer}>
                  {cityValidation.isValidating && (
                    <View style={styles.citySuggestionItem}>
                      <ActivityIndicator size="small" color="#2196F3" />
                      <Text style={styles.citySuggestionText}>Ricerca in corso...</Text>
                    </View>
                  )}
                  {!cityValidation.isValidating && geocodeSuggestions.map((suggestion, index) => (
                    <Pressable
                      key={index}
                      style={styles.citySuggestionItem}
                      onPress={() => {
                        handleSelectCitySuggestion(suggestion);
                        // NON chiudere il modal - l'utente deve cliccare "Conferma"
                      }}
                    >
                      <Ionicons name="location" size={16} color="#2196F3" />
                      <Text style={styles.citySuggestionText} numberOfLines={1}>
                        {suggestion.displayName}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            
            <Pressable
              style={[
                styles.confirmCityButton, 
                (!tempCity.trim() || cityValidation.isValid !== true) && styles.confirmCityButtonDisabled
              ]}
              disabled={!tempCity.trim() || cityValidation.isValid !== true}
              onPress={async () => {
                const cityName = tempCity.trim();
                if (cityName && manualCityCoords) {
                  setCityFilter(cityName);
                  setShowCitySelectionModal(false);
                  console.log('✅ Città manuale impostata:', cityName);
                }
              }}
            >
              <Text style={[
                styles.confirmCityButtonText,
                (!tempCity.trim() || cityValidation.isValid !== true) && styles.confirmCityButtonTextDisabled
              ]}>
                Conferma e cerca partite
              </Text>
            </Pressable>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "column",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  filtersContainer: {
    paddingVertical: 8,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
  },
  filterInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterInfoText: {
    fontSize: 12,
    color: "#666",
  },
  filterInfoValue: {
    fontWeight: "700",
    color: "#2196F3",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  filterChipActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  filterChipTextActive: {
    color: "#2196F3",
  },
  filterChipClear: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F2FD",
    marginLeft: 2,
  },
  filterChipIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F2FD",
    marginLeft: 2,
  },
  cityEditContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "white",
    // borderBottomWidth: 1, // Rimossa la riga separatrice
    // borderBottomColor: "#e0e0e0",
  },
  cityEditField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: "#2196F3",
  },
  cityEditInput: {
    flex: 1,
    fontSize: 13,
    color: "#333",
    minWidth: 100,
    paddingRight: 6,
  },
  cityEditGPS: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  cityEditApply: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  cityEditCancel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  citySuggestionsContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    marginTop: 8,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  citySuggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  citySuggestionText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#333",
    flex: 1,
  },
  badgeContainer: {
    alignItems: "flex-end",
    gap: 4,
  },
  badge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2196F3",
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  timerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  infoIcon: {
    marginLeft: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  pendingText: {
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "700",
    marginLeft: 6,
  },
  teamsVisual: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  teamVisualContainer: {
    flex: 1,
  },
  teamVisualHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  teamAHeader: {
    backgroundColor: "#2196F3",
  },
  teamBHeader: {
    backgroundColor: "#F44336",
  },
  teamVisualTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
  },
  teamVisualSlots: {
    flexDirection: "row",
    gap: 5,
  },
  teamVisualSlot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  teamVisualInitials: {
    fontSize: 11,
    fontWeight: "700",
    color: "#333",
  },
  teamVisualSlotFilled: {
    borderColor: "transparent",
  },
  teamVisualSlotEmpty: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  teamASlot: {
    backgroundColor: "#E3F2FD",
  },
  teamBSlot: {
    backgroundColor: "#FFEBEE",
  },
  teamVisualDivider: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  teamVisualVs: {
    fontSize: 12,
    fontWeight: "700",
    color: "#999",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
    borderStyle: "dashed",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginTop: 6,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginVertical: 12,
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  // Stili opzioni contenuto dei FilterModal
  filterModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 12,
    backgroundColor: "transparent",
  },
  filterModalOptionWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
    marginBottom: 0,
  },
  filterModalOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  calendarContainer: {
    padding: 16,
    backgroundColor: "white",
  },
  dateGroupHeader: {
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dateGroupHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    textTransform: "capitalize",
  },
  loadMoreFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  loadMoreFooterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  // 🆕 Stili per il modal selezione città
  citySelectionFixedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  citySelectionContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  citySelectionHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  citySelectionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  citySelectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  citySelectionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  gpsButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  gpsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gpsButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  gpsButtonSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#999',
  },
  manualInputWrapper: {
    marginBottom: 20,
  },
  manualInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  manualInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  manualInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  confirmCityButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCityButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  confirmCityButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  confirmCityButtonTextDisabled: {
    color: '#999',
  },
});
