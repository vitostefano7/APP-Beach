import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
// Debounce utility
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
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
  Modal,
  ScrollView,
} from "react-native";
import { RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Calendar, LocaleConfig } from "react-native-calendars";
import * as Location from "expo-location";
import SportIcon from '../../../components/SportIcon';

import { AuthContext } from "../../../context/AuthContext";
import API_URL from "../../../config/api";
import Avatar from "../../../components/Avatar/Avatar";
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

const getSportLabel = (sport?: string) => {
  if (!sport) return "Sport";
  if (sport === "beach_volley") return "Beach Volley";
  return sport.charAt(0).toUpperCase() + sport.slice(1);
};

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
  const [citySuggestions, setCitySuggestions] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [isLoadingCitySuggestions, setIsLoadingCitySuggestions] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [timeFilter, setTimeFilter] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState<"beach_volley" | "volley" | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const cityInputRef = useRef<TextInput>(null);

  const [playersFilter, setPlayersFilter] = useState<string | null>(null);
  const [showPlayersPicker, setShowPlayersPicker] = useState(false);
  const [activeFilterMode, setActiveFilterMode] = useState<'manual' | 'gps' | 'preferred' | 'visited' | 'none'>('none');
  const [activeFilterInfo, setActiveFilterInfo] = useState<string>('');

  // Hook per il filtraggio geografico
  const {
    userPreferences,
    visitedStruttureIds,
    gpsCoords,
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
  }, [token, user?.id]);



  useEffect(() => {
    loadUserPreferences();
    loadVisitedStrutture();
  }, [loadUserPreferences, loadVisitedStrutture]);

  useEffect(() => {
    // Chiedi GPS dopo che lo screen è caricato (delay di 500ms)
    const timer = setTimeout(() => {
      requestGPSLocation();
    }, 500);

    return () => clearTimeout(timer);
  }, [requestGPSLocation]);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [loadMatches])
  );





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
    if (!value) return "";
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
    if (sportFilter === "beach_volley") {
      return ["2v2", "3v3", "4v4"];
    } else if (sportFilter === "volley") {
      return ["5v5"];
    } else {
      return ["2v2", "3v3", "4v4", "5v5"];
    }
  }, [sportFilter]);

  const getMaxPlayersFromFilter = (filter: string) => {
    switch (filter) {
      case "2v2": return 4;
      case "3v3": return 6;
      case "4v4": return 8;
      case "5v5": return 10;
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
      return { mode: 'gps' as const, displayCity: 'Posizione GPS', canClear: false };
    }
    if (userPreferences?.preferredLocation?.city) {
      return { mode: 'preferred' as const, displayCity: userPreferences.preferredLocation.city, canClear: false };
    }
    if (visitedStruttureIds.length > 0) {
      return { mode: 'visited' as const, displayCity: 'Strutture visitate', canClear: false };
    }
    return { mode: 'none' as const, displayCity: '', canClear: false };
  }, [cityFilter, manualCityCoords, gpsCoords, gpsAddress, userPreferences, visitedStruttureIds]);

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
      activeFilterInfo = `${userPreferences!.preferredLocation!.city} (${searchRadius} km - città preferita)`;
      console.log("📍 [CercaPartita] PRIORITÀ 3 - Città preferita:", userPreferences.preferredLocation.city, "Raggio:", searchRadius, "km");
    } else if (filterMode === 'visited') {
      activeFilterInfo = `Strutture dove hai già giocato (${visitedStruttureIds.length})`;
      console.log("📍 [CercaPartita] FALLBACK - Strutture visitate:", visitedStruttureIds.length, "strutture");
    } else {
      console.log("⚠️ [CercaPartita] Nessun filtro geografico disponibile - nessun risultato");
      // Se non c'è nessun criterio geografico, non mostrare nulla
      return [];
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
          console.log(`📏 [CercaPartita] ${structureName} (${structureCity}): ${distance.toFixed(2)}km`);
          if (distance > searchRadius) {
            return false;
          }
        } else {
          // Se la struttura non ha coordinate, faccio fallback sul controllo testuale della città
          console.log(`⚠️ [CercaPartita] ${structureName} non ha coordinate, fallback su città testuale`);
          if (cityFilter.trim()) {
            // Se c'è un filtro città manuale, controlla la corrispondenza testuale
            if (!structureCity.toLowerCase().includes(cityFilter.trim().toLowerCase())) {
              return false;
            }
          } else if (userPreferences?.preferredLocation?.city) {
            // Se usiamo città preferita, controlla la corrispondenza testuale
            if (!structureCity.toLowerCase().includes(userPreferences.preferredLocation.city.toLowerCase())) {
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
      
      filtered = matches.filter((match) => {
        const structureName = match.booking?.campo?.struttura?.name || "N/A";
        const structureCity = match.booking?.campo?.struttura?.location?.city || "";
        const structureLat = match.booking?.campo?.struttura?.location?.lat;
        const structureLng = match.booking?.campo?.struttura?.location?.lng;
        
        // Filtro raggio con 50km
        if (structureLat && structureLng) {
          const distance = calculateDistance(referenceLat!, referenceLng!, structureLat, structureLng);
          console.log(`📏 [CercaPartita] 50km - ${structureName} (${structureCity}): ${distance.toFixed(2)}km`);
          if (distance > searchRadius) {
            return false;
          }
        } else {
          // Fallback su città testuale se non ha coordinate
          console.log(`⚠️ [CercaPartita] 50km - ${structureName} non ha coordinate, fallback su città testuale`);
          if (cityFilter.trim()) {
            if (!structureCity.toLowerCase().includes(cityFilter.trim().toLowerCase())) {
              return false;
            }
          } else if (userPreferences?.preferredLocation?.city) {
            if (!structureCity.toLowerCase().includes(userPreferences.preferredLocation.city.toLowerCase())) {
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

  const visitedMatches = useMemo(() => {
    const visited = matches.filter((match) => {
      const strutturaId = typeof match.booking?.campo?.struttura === 'object' 
        ? (match.booking?.campo?.struttura as any)?._id 
        : match.booking?.campo?.struttura;
      return strutturaId && visitedStruttureIds.includes(strutturaId);
    }).slice(0, 3); // Limita a 3 partite
    return visited;
  }, [matches, visitedStruttureIds]);

  // Debounced city suggestion fetch
  const fetchCitySuggestions = useCallback(async (text: string) => {
    if (!text.trim()) {
      setManualCityCoords(null);
      setCitySuggestions([]);
      return;
    }
    if (text.trim().length >= 3) {
      setIsLoadingCitySuggestions(true);
      try {
        const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5&addressdetails=1`;
        const res = await fetch(searchUrl, {
          headers: { 'User-Agent': 'SportBookingApp/1.0' },
        });
        if (res.ok) {
          const data = await res.json();
          const suggestions = data.map((item: any) => ({
            name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }));
          setCitySuggestions(suggestions);
        }
      } catch (error) {
        console.error("❌ [CercaPartita] Errore ricerca città:", error);
      } finally {
        setIsLoadingCitySuggestions(false);
      }
    } else {
      setCitySuggestions([]);
    }
  }, []);

  // Debounced version
  const debouncedFetchCitySuggestions = useMemo(() => debounce(fetchCitySuggestions, 500), [fetchCitySuggestions]);

  const handleCityTextChange = useCallback((text: string) => {
    console.log("🔤 [CercaPartita] Cambio testo città:", text);
    setTempCity(text);
    debouncedFetchCitySuggestions(text);
  }, [debouncedFetchCitySuggestions]);

  const handleSelectCitySuggestion = useCallback((suggestion: { name: string; lat: number; lng: number }) => {
    console.log("✅ [CercaPartita] Città selezionata:", suggestion);
    // Estrai solo il nome della città (prima parte prima della virgola)
    const cityName = suggestion.name.split(',')[0].trim();
    setTempCity(cityName);
    setCityFilter(cityName);
    setManualCityCoords({ lat: suggestion.lat, lng: suggestion.lng });
    setCitySuggestions([]);
    setIsCityEditing(false);
  }, []);

  const geocodeCity = async (cityName: string) => {
    try {
      console.log("🌍 [CercaPartita] Geocoding città:", cityName);
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`;
      
      const geoRes = await fetch(geocodeUrl, {
        headers: { 'User-Agent': 'SportBookingApp/1.0' },
      });
      
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          const coords = {
            lat: parseFloat(geoData[0].lat),
            lng: parseFloat(geoData[0].lon),
          };
          console.log("✅ [CercaPartita] Coordinate città:", coords);
          return coords;
        }
      }
    } catch (error) {
      console.error("❌ [CercaPartita] Errore geocoding:", error);
    }
    return null;
  };

  const handleUseGPS = async () => {
    console.log("📍 [CercaPartita] Richiesta posizione GPS dall'input...");
    try {
      await requestGPSLocation();
      setManualCityCoords(null); // Reset manual city when using GPS
      setIsCityEditing(false);
      // Optionally, set city name if available from GPS (not handled here)
    } catch (gpsError) {
      Alert.alert("Errore GPS", "Impossibile ottenere la posizione. Riprova.");
      console.log("⚠️ [CercaPartita] Errore GPS:", gpsError);
    }
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
            {sportFilter === "beach_volley"
              ? "Beach"
              : sportFilter === "volley"
              ? "Volley"
              : "Sport"}
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
            {playersFilter || "#giocatori"}
          </Text>
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

    return (
      <OpenMatchCard
        match={item}
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

  if (loading && !refreshing) {
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
                  setCitySuggestions([]);
                  setIsCityEditing(false);
                }}
              />
              <Pressable
                style={styles.cityEditGPS}
                onPress={handleUseGPS}
                disabled={isLoadingGPS}
              >
                {isLoadingGPS ? (
                  <ActivityIndicator size="small" color="#2196F3" />
                ) : (
                  <Ionicons name="locate" size={16} color="#2196F3" />
                )}
              </Pressable>
              <Pressable
                style={styles.cityEditGPS}
                onPress={() => setShowMapModal(true)}
              >
                <Ionicons name="map" size={16} color="#2196F3" />
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
                  setCitySuggestions([]);
                  setIsCityEditing(false);
                }}
              >
                <Ionicons name="checkmark" size={18} color="white" />
              </Pressable>
              <Pressable
                style={styles.cityEditCancel}
                onPress={() => {
                  setTempCity(cityFilter);
                  setCitySuggestions([]);
                  setIsCityEditing(false);
                }}
              >
                <Ionicons name="close" size={18} color="#666" />
              </Pressable>
            </View>

            {/* Suggerimenti città */}
            {citySuggestions.length > 0 && (
              <View style={styles.citySuggestionsContainer}>
                {isLoadingCitySuggestions && (
                  <View style={styles.citySuggestionItem}>
                    <ActivityIndicator size="small" color="#2196F3" />
                    <Text style={styles.citySuggestionText}>Ricerca in corso...</Text>
                  </View>
                )}
                {!isLoadingCitySuggestions && citySuggestions.map((suggestion, index) => (
                  <Pressable
                    key={index}
                    style={styles.citySuggestionItem}
                    onPress={() => handleSelectCitySuggestion(suggestion)}
                  >
                    <Ionicons name="location" size={16} color="#2196F3" />
                    <Text style={styles.citySuggestionText} numberOfLines={1}>
                      {suggestion.name}
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
            data={filteredMatches}
            keyExtractor={(item) => item._id}
            renderItem={renderMatchCard}
            contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + 24 }]}
            ListHeaderComponent={
              <>
                {visitedMatches.length > 0 && (
                  <View style={styles.visitedSection}>
                    <Text style={styles.visitedTitle}>Partite nelle tue strutture visitate</Text>
                    {visitedMatches.map((match) => (
                      <OpenMatchCard
                        key={match._id}
                        match={match}
                        onPress={() => {
                          const bookingId = match.booking?._id;
                          if (!bookingId) {
                            Alert.alert("Errore", "ID prenotazione non disponibile");
                            return;
                          }
                          navigation.navigate("DettaglioPrenotazione", { bookingId });
                        }}
                        onJoin={() => handleJoinMatch(match)}
                      />
                    ))}
                  </View>
                )}
              </>
            }
            onRefresh={onRefresh}
            refreshing={!!refreshing}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={56} color="#ccc" />
                <Text style={styles.emptyTitle}>Nessuna partita disponibile</Text>
                <Text style={styles.emptySubtitle}>
                  Al momento non ci sono partite con posti liberi.
                </Text>
              </View>
            }
          />
        </>
      )}

      <Modal
        visible={showCalendar}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.centeredModalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Seleziona una data</Text>
            </View>

            <View style={styles.calendarContainer}>
              <Calendar
                current={formatDate(dateFilter) || formatDate(new Date())}
                minDate={formatDate(new Date())}
                locale={'it'}
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

            <View style={styles.filterModalFooter}>
              <Pressable
                style={styles.filterModalCancel}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={styles.filterModalCancelText}>Annulla</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSportPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSportPicker(false)}
      >
        <View style={styles.centeredModalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Scegli sport</Text>
            </View>
            <ScrollView style={styles.filterModalContent} showsVerticalScrollIndicator={false}>
              <Pressable
                style={({ pressed }) => [
                  styles.filterModalOption,
                  styles.filterModalOptionWithBorder,
                  pressed && { backgroundColor: "#E3F2FD" }
                ]}
                onPress={() => {
                  setSportFilter("beach_volley");
                  setShowSportPicker(false);
                }}
              >
                <Text style={styles.filterModalOptionText}>Beach Volley</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.filterModalOption,
                  pressed && { backgroundColor: "#E3F2FD" }
                ]}
                onPress={() => {
                  setSportFilter("volley");
                  setShowSportPicker(false);
                }}
              >
                <Text style={styles.filterModalOptionText}>Volley</Text>
              </Pressable>
            </ScrollView>
            <View style={styles.filterModalFooter}>
              <Pressable
                style={styles.filterModalCancel}
                onPress={() => setShowSportPicker(false)}
              >
                <Text style={styles.filterModalCancelText}>Annulla</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPlayersPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPlayersPicker(false)}
      >
        <View style={styles.centeredModalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Scegli formato</Text>
            </View>
            <ScrollView style={styles.filterModalContent} showsVerticalScrollIndicator={false}>
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
              {playersOptions.map((option, index) => (
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
                  <Text style={styles.filterModalOptionText}>{option}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.filterModalFooter}>
              <Pressable
                style={styles.filterModalCancel}
                onPress={() => setShowPlayersPicker(false)}
              >
                <Text style={styles.filterModalCancelText}>Annulla</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTimePicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.centeredModalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Seleziona un orario</Text>
            </View>
            <ScrollView style={styles.filterModalContent} showsVerticalScrollIndicator={false}>
              {timeSlots.map((slot, index) => (
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
                  <Text style={styles.filterModalOptionText}>{slot}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.filterModalFooter}>
              <Pressable
                style={styles.filterModalCancel}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.filterModalCancelText}>Annulla</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showMapModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowMapModal(false)}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <Pressable onPress={() => setShowMapModal(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="#333" />
            </Pressable>
            <Text style={styles.headerTitle}>Seleziona posizione</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={64} color="#ccc" />
            <Text style={styles.mapPlaceholderText}>
              Per usare la mappa, installa react-native-maps
            </Text>
            <Text style={styles.mapPlaceholderSubtext}>
              npx expo install react-native-maps
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
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
  },
  cityEditGPS: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  cityEditApply: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
  },
  cityEditCancel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
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
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    fontFamily: "monospace",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  timeList: {
    paddingBottom: 8,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 8,
  },
  timeSlotActive: {
    borderColor: "#2196F3",
    backgroundColor: "#E3F2FD",
  },
  timeSlotText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  timeSlotTextActive: {
    color: "#2196F3",
  },
  // Nuovi stili per i modal filtri
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterModal: {
    backgroundColor: "white",
    borderRadius: 20,
    marginHorizontal: 40,
    width: "85%",
    maxHeight: "75%",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
  },
  filterModalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: "#2196F3",
    minHeight: 70,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
  },
  filterModalContent: {
    maxHeight: 350,
    paddingTop: 8,
  },
  filterModalOption: {
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
  filterModalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#f8f9fa",
  },
  filterModalCancel: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  filterModalCancelText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "700",
  },
  calendarContainer: {
    padding: 16,
    backgroundColor: "white",
  },
  visitedSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  visitedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
});
