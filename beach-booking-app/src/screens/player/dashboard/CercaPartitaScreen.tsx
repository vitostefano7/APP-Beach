import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import * as Location from "expo-location";

import { AuthContext } from "../../../context/AuthContext";
import API_URL from "../../../config/api";
import Avatar from "../../../components/Avatar/Avatar";

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
  status?: "draft" | "open" | "full" | "completed" | "cancelled";
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
        location?: { city?: string };
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

const getSportIcon = (sport?: string) => {
  switch (sport) {
    case "calcio":
      return "football";
    case "tennis":
      return "tennisball";
    case "basket":
      return "basketball";
    case "beach_volley":
      return "trophy";
    default:
      return "fitness";
  }
};

export default function CercaPartitaScreen() {
  const { token, user } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [tempCity, setTempCity] = useState("");
  const [isCityEditing, setIsCityEditing] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [timeFilter, setTimeFilter] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState<"beach_volley" | "volley" | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const cityInputRef = useRef<TextInput>(null);

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
        // Escludi partite che iniziano tra 30 minuti o meno
        if (start && start.getTime() - now.getTime() <= 30 * 60 * 1000) return false;

        const alreadyJoined = match.players?.some((player) => player.user?._id === user?.id);
        if (alreadyJoined) return false;

        return true;
      });

      const sorted = filtered.sort((a, b) => {
        const dateA = parseMatchStart(a)?.getTime() ?? 0;
        const dateB = parseMatchStart(b)?.getTime() ?? 0;
        return dateA - dateB;
      });

      console.log(`✅ [CercaPartita] ${sorted.length} match dopo filtri - tutto OK, impostando state`);

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
  }, [token]);

  useEffect(() => {
    // Chiedi GPS dopo che lo screen è caricato (delay di 500ms)
    const timer = setTimeout(() => {
      requestLocationAndSetCity();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [loadMatches])
  );

  const requestLocationAndSetCity = async () => {
    if (!token || cityFilter) return; // Non sovrascrivere se già impostato

    console.log("📍 [CercaPartita] Richiesta posizione GPS...");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === "granted") {
        console.log("✅ [CercaPartita] Permesso GPS concesso");
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        console.log("📍 [CercaPartita] Coordinate GPS:", {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });

        // Reverse geocoding per ottenere la città
        const reverseUrl = 
          `https://nominatim.openstreetmap.org/reverse?` +
          `lat=${location.coords.latitude}&` +
          `lon=${location.coords.longitude}&` +
          `format=json`;
        
        const geoRes = await fetch(reverseUrl, {
          headers: { 'User-Agent': 'SportBookingApp/1.0' },
        });
        
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const city = geoData.address?.city || 
                      geoData.address?.town || 
                      geoData.address?.village;
          
          if (city) {
            setCityFilter(city);
            console.log("✅ [CercaPartita] Città da GPS impostata:", city);
          }
        }
      } else {
        console.log("⚠️ [CercaPartita] Permesso GPS negato");
      }
    } catch (gpsError) {
      console.log("⚠️ [CercaPartita] Errore GPS:", gpsError);
    }
  };

  const loadUserPreferences = async () => {
    if (!token) {
      setIsLoadingPreferences(false);
      return;
    }

    try {
      console.log("📍 [CercaPartita] Caricamento preferenze...");
      const res = await fetch(`${API_URL}/users/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const prefs: UserPreferences = await res.json();
        setPreferences(prefs);
        
        // Imposta la città dalle preferenze solo se non è già stata impostata
        if (prefs.preferredLocation?.city && !cityFilter) {
          setCityFilter(prefs.preferredLocation.city);
          console.log("✅ [CercaPartita] Città da preferenze:", prefs.preferredLocation.city);
        }
      }
    } catch (error) {
      console.error("❌ [CercaPartita] Errore caricamento preferenze:", error);
    } finally {
      setIsLoadingPreferences(false);
    }
  };

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

  const filteredMatches = useMemo(() => {
    console.log("🔍 [CercaPartita] Filtro partite - cityFilter:", cityFilter);
    console.log("🔍 [CercaPartita] Città preferita:", preferences?.preferredLocation?.city);
    
    const filtered = matches.filter((match) => {
      const city = match.booking?.campo?.struttura?.location?.city || "";
      if (cityFilter.trim()) {
        if (!city.toLowerCase().includes(cityFilter.trim().toLowerCase())) {
          return false;
        }
      }

      if (dateFilter) {
        if (match.booking?.date !== formatDate(dateFilter)) {
          return false;
        }
      }

      if (timeFilter) {
        if (match.booking?.startTime !== timeFilter) {
          return false;
        }
      }

      if (sportFilter) {
        const matchSport = normalizeSport(match.booking?.campo?.sport);
        if (matchSport !== sportFilter) {
          return false;
        }
      }

      return true;
    });

    console.log(`✅ [CercaPartita] ${filtered.length} match dopo filtri`);

    // Se NON c'è filtro città attivo, ordina mettendo prima i match della città preferita
    if (!cityFilter.trim() && preferences?.preferredLocation?.city) {
      const preferredCity = preferences.preferredLocation.city.toLowerCase();
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
      
      const preferredCount = sorted.filter(m => 
        (m.booking?.campo?.struttura?.location?.city || "").toLowerCase().includes(preferredCity)
      ).length;
      console.log(`✅ [CercaPartita] ${preferredCount} match di ${preferredCity} in cima`);
      
      return sorted;
    }

    console.log("📍 [CercaPartita] Ordinamento normale per data");
    return filtered;
  }, [matches, cityFilter, dateFilter, timeFilter, sportFilter, preferences]);

  const handleCityTextChange = useCallback((text: string) => {
    console.log("🔤 [CercaPartita] Cambio testo città:", text);
    setTempCity(text);
  }, []);

  const handleUseGPS = async () => {
    console.log("📍 [CercaPartita] Richiesta posizione GPS dall'input...");
    setIsLoadingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === "granted") {
        console.log("✅ [CercaPartita] Permesso GPS concesso");
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        console.log("📍 [CercaPartita] Coordinate GPS:", {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });

        // Reverse geocoding per ottenere la città
        const reverseUrl = 
          `https://nominatim.openstreetmap.org/reverse?` +
          `lat=${location.coords.latitude}&` +
          `lon=${location.coords.longitude}&` +
          `format=json`;
        
        const geoRes = await fetch(reverseUrl, {
          headers: { 'User-Agent': 'SportBookingApp/1.0' },
        });
        
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const city = geoData.address?.city || 
                      geoData.address?.town || 
                      geoData.address?.village;
          
          if (city) {
            setTempCity(city);
            setCityFilter(city);
            setIsCityEditing(false);
            console.log("✅ [CercaPartita] Città da GPS impostata:", city);
          }
        }
      } else {
        Alert.alert("Permesso GPS negato", "Per usare la posizione GPS devi consentire l'accesso alla posizione.");
        console.log("⚠️ [CercaPartita] Permesso GPS negato");
      }
    } catch (gpsError) {
      Alert.alert("Errore GPS", "Impossibile ottenere la posizione. Riprova.");
      console.log("⚠️ [CercaPartita] Errore GPS:", gpsError);
    } finally {
      setIsLoadingGPS(false);
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
            cityFilter.trim() && styles.filterChipActive,
          ]}
          onPress={() => {
            setTempCity(cityFilter);
            setIsCityEditing(true);
          }}
        >
          <Ionicons 
            name="location" 
            size={14} 
            color={cityFilter.trim() ? "white" : "#2196F3"} 
          />
          <Text style={[
            styles.filterChipText,
            cityFilter.trim() && styles.filterChipTextActive,
          ]}>
            {cityFilter.trim() ? cityFilter : "Città"}
          </Text>
          {cityFilter.trim() && (
            <Pressable
              style={styles.filterChipClear}
              onPress={(event) => {
                event.stopPropagation();
                setCityFilter("");
              }}
            >
              <Ionicons name="close" size={12} color="white" />
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
            color={dateFilter ? "white" : "#2196F3"} 
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
              <Ionicons name="close" size={12} color="white" />
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
            color={timeFilter ? "white" : "#2196F3"} 
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
              <Ionicons name="close" size={12} color="white" />
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
            color={sportFilter ? "white" : "#2196F3"} 
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
              <Ionicons name="close" size={12} color="white" />
            </Pressable>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );

  const renderMatchCard = ({ item }: { item: MatchItem }) => {
    const confirmedPlayers = getPlayersCount(item.players, "confirmed");
    const pendingPlayers = getPlayersCount(item.players, "pending");
    const maxPlayers = item.maxPlayers || 0;
    const available = Math.max(maxPlayers - confirmedPlayers, 0);
    const maxPerTeam = maxPlayers > 0 ? Math.ceil(maxPlayers / 2) : 0;
    const teamAPlayers = item.players?.filter((player) => player.team === "A" && player.status === "confirmed") || [];
    const teamBPlayers = item.players?.filter((player) => player.team === "B" && player.status === "confirmed") || [];
    const bookingId = item.booking?._id;

    return (
      <Pressable
        style={styles.card}
        onPress={() => {
          if (!bookingId) {
            Alert.alert("Errore", "ID prenotazione non disponibile");
            return;
          }
          navigation.navigate("DettaglioPrenotazione", { bookingId });
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>
              {item.booking?.campo?.struttura?.name || "Struttura"}
              {item.booking?.campo?.struttura?.location?.city &&
                ` - ${item.booking.campo.struttura.location.city}`}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{available} posti</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.booking?.date || "Data da definire"}
          </Text>
          <Ionicons name="time-outline" size={16} color="#666" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            {item.booking?.startTime || "--:--"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name={getSportIcon(item.booking?.campo?.sport)} size={16} color="#666" />
          <Text style={styles.infoText}>
            {getSportLabel(item.booking?.campo?.sport)}
          </Text>
        </View>

        {/* Visualizzazione Team Grafica */}
        {maxPlayers > 2 && (
          <View style={styles.teamsVisual}>
            {/* Team A */}
            <View style={styles.teamVisualContainer}>
              <View style={[styles.teamVisualHeader, styles.teamAHeader]}>
                <Ionicons name="shield" size={16} color="white" />
                <Text style={styles.teamVisualTitle}>Team A</Text>
              </View>
              <View style={styles.teamVisualSlots}>
                {Array(maxPerTeam).fill(null).map((_, index) => {
                  const player = teamAPlayers[index];
                  const hasPlayer = index < teamAPlayers.length;
                  return (
                    <View 
                      key={`teamA-${index}`} 
                      style={[
                        styles.teamVisualSlot,
                        hasPlayer ? styles.teamVisualSlotFilled : styles.teamVisualSlotEmpty,
                        hasPlayer && styles.teamASlot
                      ]}
                    >
                      {hasPlayer && player?.user ? (
                        <Avatar
                          name={player.user.name}
                          surname={player.user.surname}
                          avatarUrl={player.user.avatarUrl}
                          size={32}
                          backgroundColor="#E3F2FD"
                          textColor="#333"
                        />
                      ) : (
                        <Ionicons name="person-outline" size={14} color="#ccc" />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Divisore VS */}
            <View style={styles.teamVisualDivider}>
              <Text style={styles.teamVisualVs}>VS</Text>
            </View>

            {/* Team B */}
            <View style={styles.teamVisualContainer}>
              <View style={[styles.teamVisualHeader, styles.teamBHeader]}>
                <Ionicons name="shield-outline" size={16} color="white" />
                <Text style={styles.teamVisualTitle}>Team B</Text>
              </View>
              <View style={styles.teamVisualSlots}>
                {Array(maxPerTeam).fill(null).map((_, index) => {
                  const player = teamBPlayers[index];
                  const hasPlayer = index < teamBPlayers.length;
                  return (
                    <View 
                      key={`teamB-${index}`} 
                      style={[
                        styles.teamVisualSlot,
                        hasPlayer ? styles.teamVisualSlotFilled : styles.teamVisualSlotEmpty,
                        hasPlayer && styles.teamBSlot
                      ]}
                    >
                      {hasPlayer && player?.user ? (
                        <Avatar
                          name={player.user.name}
                          surname={player.user.surname}
                          avatarUrl={player.user.avatarUrl}
                          size={32}
                          backgroundColor="#FFEBEE"
                          textColor="#333"
                        />
                      ) : (
                        <Ionicons name="person-outline" size={14} color="#ccc" />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </Pressable>
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
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Cerca una partita</Text>
        <View style={styles.headerSpacer} />
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
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <>
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
                        onSubmitEditing={() => {
                          setCityFilter(tempCity.trim());
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
                        style={styles.cityEditApply}
                        onPress={() => {
                          setCityFilter(tempCity.trim());
                          setIsCityEditing(false);
                        }}
                      >
                        <Ionicons name="checkmark" size={18} color="white" />
                      </Pressable>
                      <Pressable
                        style={styles.cityEditCancel}
                        onPress={() => {
                          setTempCity(cityFilter);
                          setIsCityEditing(false);
                        }}
                      >
                        <Ionicons name="close" size={18} color="#666" />
                      </Pressable>
                    </View>
                  </View>
                )}
                {renderFilters()}
              </>
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
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
        animationType="fade"
        transparent
        onRequestClose={() => setShowCalendar(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCalendar(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleziona una data</Text>
              <Pressable onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={22} color="#333" />
              </Pressable>
            </View>

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
                  selectedColor: "#2979ff",
                },
              }}
              theme={{
                backgroundColor: "#ffffff",
                calendarBackground: "#ffffff",
                textSectionTitleColor: "#666",
                selectedDayBackgroundColor: "#2979ff",
                selectedDayTextColor: "#ffffff",
                todayTextColor: "#2979ff",
                dayTextColor: "#1A1A1A",
                textDisabledColor: "#d9d9d9",
                dotColor: "#2979ff",
                selectedDotColor: "#ffffff",
                arrowColor: "#2979ff",
                monthTextColor: "#1A1A1A",
                indicatorColor: "#2979ff",
                textDayFontWeight: "500",
                textMonthFontWeight: "700",
                textDayHeaderFontWeight: "600",
                textDayFontSize: 15,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 13,
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showSportPicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowSportPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSportPicker(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scegli sport</Text>
              <Pressable onPress={() => setShowSportPicker(false)}>
                <Ionicons name="close" size={22} color="#333" />
              </Pressable>
            </View>

            <View style={{ gap: 10 }}>
              <Pressable
                style={[
                  styles.timeSlot,
                  sportFilter === "beach_volley" && styles.timeSlotActive,
                ]}
                onPress={() => {
                  setSportFilter("beach_volley");
                  setShowSportPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    sportFilter === "beach_volley" && styles.timeSlotTextActive,
                  ]}
                >
                  Beach Volley
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.timeSlot,
                  sportFilter === "volley" && styles.timeSlotActive,
                ]}
                onPress={() => {
                  setSportFilter("volley");
                  setShowSportPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    sportFilter === "volley" && styles.timeSlotTextActive,
                  ]}
                >
                  Volley
                </Text>
              </Pressable>
              <Pressable
                style={styles.timeSlot}
                onPress={() => {
                  setSportFilter(null);
                  setShowSportPicker(false);
                }}
              >
                <Text style={styles.timeSlotText}>Rimuovi filtro</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showTimePicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowTimePicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTimePicker(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleziona un orario</Text>
              <Pressable onPress={() => setShowTimePicker(false)}>
                <Ionicons name="close" size={22} color="#333" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.timeList}>
              {timeSlots.map((slot) => (
                <Pressable
                  key={slot}
                  style={[
                    styles.timeSlot,
                    timeFilter === slot && styles.timeSlotActive,
                  ]}
                  onPress={() => {
                    setTimeFilter(slot);
                    setShowTimePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      timeFilter === slot && styles.timeSlotTextActive,
                    ]}
                  >
                    {slot}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
    backgroundColor: "white",
    paddingVertical: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    borderWidth: 1.5,
    borderColor: "#90CAF9",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1976D2",
  },
  filterChipActive: {
    backgroundColor: "#2196F3",
    borderColor: "#1976D2",
  },
  filterChipTextActive: {
    color: "white",
  },
  filterChipClear: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    marginLeft: 2,
  },
  cityEditContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
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
});
