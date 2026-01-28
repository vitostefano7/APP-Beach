import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { Avatar } from "../../../components/Avatar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useCallback } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useRoute, useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import API_URL from "../../../config/api";
import SportIcon from '../../../components/SportIcon';

/* =========================
   TYPES
========================= */
interface Booking {
  _id: string;
  campo: {
    _id: string;
    name: string;
    sport: string;
    struttura: {
      _id: string;
      name: string;
      location: {
        city: string;
      };
    };
  };
  user: {
    _id: string;
    name: string;
    surname?: string;
    avatarUrl?: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: "confirmed" | "cancelled";
  hasMatch?: boolean;
  matchId?: string;
  match?: {
    _id: string;
    status: string;
    maxPlayers: number;
    isPublic: boolean;
    players?: Array<{
      user: any;
      status: "confirmed" | "pending" | "declined";
      team?: "A" | "B";
    }>;
    score?: {
      winner: "A" | "B";
      sets: { teamA: number; teamB: number }[];
    };
  };
}

/* =========================
   UTILITY FUNCTIONS
========================= */
const formatSportName = (sport: string) => {
  switch (sport) {
    case "beach_volleyball":
    case "beach_volley":
      return "Beach Volley";
    case "volleyball":
    case "volley":
      return "Volley";
    case "calcio":
      return "Calcio";
    case "football":
      return "Football";
    case "tennis":
      return "Tennis";
    case "basket":
      return "Basket";
    case "basketball":
      return "Basketball";
    default:
      return sport.charAt(0).toUpperCase() + sport.slice(1);
  }
};

const isPastBooking = (booking: Booking): boolean => {
  if (booking.status === "cancelled") return true;
  
  try {
    const bookingEndDateTime = new Date(`${booking.date}T${booking.endTime}:00`);
    const now = new Date();
    return bookingEndDateTime < now;
  } catch (error) {
    const bookingDate = new Date(booking.date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate < today;
  }
};

const isUpcomingBooking = (booking: Booking): boolean => {
  if (booking.status === "cancelled") return false;
  
  try {
    const bookingStartDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
    const now = new Date();
    return bookingStartDateTime > now;
  } catch (error) {
    const bookingDate = new Date(booking.date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  }
};

const isOngoingBooking = (booking: Booking): boolean => {
  if (booking.status === "cancelled") return false;
  
  try {
    const now = new Date();
    const bookingStartDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
    const bookingEndDateTime = new Date(`${booking.date}T${booking.endTime}:00`);
    return now >= bookingStartDateTime && now <= bookingEndDateTime;
  } catch (error) {
    return false;
  }
};

const formatDate = (dateStr: string) =>
  new Date(dateStr + "T12:00:00").toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

// Calcola quanto manca alla chiusura della registrazione (1 ora prima dell'inizio)
const getRegistrationCloseStatus = (booking: Booking): string => {
  try {
    const bookingStartDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
    // Registrazione chiude 1 ora prima dell'inizio
    const registrationCloseDateTime = new Date(bookingStartDateTime.getTime() - 60 * 60 * 1000);
    const now = new Date();
    const diffMs = registrationCloseDateTime.getTime() - now.getTime();
    if (diffMs <= 0) return "Tempo di registrazione scaduto";
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHours > 0) {
      return `Chiude tra ${diffHours} ${diffHours === 1 ? 'ora' : 'ore'}`;
    } else {
      return `Chiude tra ${diffMinutes} minuti`;
    }
  } catch (error) {
    return "Chiusura registrazione";
  }
};

const getTimeStatus = (booking: Booking): string => {
  if (isPastBooking(booking)) return "Conclusa";
  if (isOngoingBooking(booking)) return "In corso";
  
  try {
    const bookingStartDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
    const now = new Date();
    const diffMs = bookingStartDateTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Conclusa";
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `Tra ${diffDays} ${diffDays === 1 ? 'giorno' : 'giorni'}`;
    } else if (diffHours > 0) {
      return `Tra ${diffHours} ${diffHours === 1 ? 'ora' : 'ore'}`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `Tra ${diffMinutes} minuti`;
    }
  } catch (error) {
    return "Prossima";
  }
};

// Verifica se il match è in corso
const isMatchInProgress = (booking: Booking): boolean => {
  if (!booking) return false;
  const now = new Date();
  const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
  const matchEndTime = new Date(`${booking.date}T${booking.endTime}`);
  return now >= matchDateTime && now <= matchEndTime;
};

// Verifica se il match è passato
const isMatchPassed = (booking: Booking): boolean => {
  if (!booking) return false;
  const now = new Date();
  const matchEndTime = new Date(`${booking.date}T${booking.endTime}`);
  return now > matchEndTime;
};

// Ottieni lo stato effettivo del match
const getMatchStatus = (booking: Booking): string | null => {
  // Se non c'è match, ritorna null
  if (!booking.hasMatch && !booking.match) {
    return null;
  }

  const match = booking.match;
  if (!match) {
    return null;
  }

  const confirmedPlayers = match.players?.filter(p => p.status === "confirmed").length || 0;
  const isPublic = match.isPublic;
  const teamsIncomplete = confirmedPlayers < match.maxPlayers;

  // Se il match è in corso
  if (isMatchInProgress(booking) && match.status !== "completed" && match.status !== "cancelled") {
    if (isPublic && teamsIncomplete) {
      return "cancelled";
    }
    return "in_progress";
  }

  // Se il match è passato
  if (isMatchPassed(booking) && match.status !== "cancelled") {
    if (isPublic && teamsIncomplete) {
      return "cancelled";
    }
    
    if (!match.score || match.score.sets.length === 0) {
      return "not_completed";
    }
    
    if (match.score && match.score.sets.length > 0) {
      return "completed";
    }
  }

  // Se il match non è ancora iniziato e i team non sono completi
  if (!isMatchPassed(booking) && match.status === "open") {
    if (teamsIncomplete) {
      return "not_team_completed";
    }
  }

  return match.status;
};

// Ottieni le info del badge del match
const getMatchBadgeInfo = (booking: Booking): { text: string; color: string; bgColor: string; icon: string } | null => {
  // Se non c'è match, ritorna null
  if (!booking.hasMatch && !booking.match) {
    return null;
  }
  
  const matchStatus = getMatchStatus(booking);
  
  if (!matchStatus) {
    return null;
  }

  const match = booking.match;
  if (!match) {
    return null;
  }

  const confirmedPlayers = match.players?.filter(p => p.status === "confirmed").length || 0;

  switch (matchStatus) {
    case "not_team_completed":
      return {
        text: `Team incompleti (${confirmedPlayers}/${match.maxPlayers})`,
        color: "#FF9800",
        bgColor: "#FFF3E0",
        icon: "people-outline"
      };
    case "not_completed":
      // Se i team non sono completi mostriamo una badge "Team incompleti" invece di "Risultato mancante"
      if (confirmedPlayers < (match?.maxPlayers || 0)) {
        return {
          text: `Team incompleti (${confirmedPlayers}/${match.maxPlayers})`,
          color: "#FF9800",
          bgColor: "#FFF3E0",
          icon: "people-outline"
        };
      }

      return {
        text: "Risultato mancante",
        color: "#FF9800",
        bgColor: "#FFF3E0",
        icon: "clipboard-outline"
      };
    case "cancelled":
      return {
        text: "Match cancellato",
        color: "#F44336",
        bgColor: "#FFEBEE",
        icon: "close-circle-outline"
      };
    case "in_progress":
      return {
        text: "Match in corso",
        color: "#4CAF50",
        bgColor: "#E8F5E9",
        icon: "play-circle-outline"
      };
    case "completed":
      return {
        text: "Match completato",
        color: "#4CAF50",
        bgColor: "#E8F5E9",
        icon: "trophy-outline"
      };
    case "open":
      if (confirmedPlayers < match.maxPlayers) {
        return {
          text: `Giocatori: ${confirmedPlayers}/${match.maxPlayers}`,
          color: "#2196F3",
          bgColor: "#E3F2FD",
          icon: "people-outline"
        };
      }
      return {
        text: "Match completo",
        color: "#4CAF50",
        bgColor: "#E8F5E9",
        icon: "checkmark-circle-outline"
      };
    default:
      return null;
  }
};

/* =========================
   INFO ROW COMPONENT
========================= */
const InfoRow = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon as any} size={14} color="#666" />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

/* =========================
   BOOKING CARD
========================= */
function BookingCard({ item, onPress }: { item: Booking; onPress: () => void }) {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const isPast = isPastBooking(item);
  const isOngoing = isOngoingBooking(item);
  const isUpcoming = isUpcomingBooking(item);
  const isCancelled = item.status === "cancelled";
  const timeStatus = getTimeStatus(item);
  const matchBadgeInfo = getMatchBadgeInfo(item);
  const matchStatus = getMatchStatus(item);
  const needsScore = matchStatus === "not_completed" && isMatchPassed(item);

  // Team completeness
  const match = item.match;
  const maxPlayersPerTeam = match ? Math.floor(match.maxPlayers / 2) : 0;
  const teamAConfirmed = match?.players?.filter(p => p.status === 'confirmed' && p.team === 'A').length || 0;
  const teamBConfirmed = match?.players?.filter(p => p.status === 'confirmed' && p.team === 'B').length || 0;
  const teamsComplete = teamAConfirmed === maxPlayersPerTeam && teamBConfirmed === maxPlayersPerTeam;

  const canOwnerInsert = needsScore && user?.role === 'owner' && teamsComplete;

  return (
    <Pressable
      style={[
        styles.card,
        isOngoing && styles.ongoingCard,
        isCancelled && styles.cancelledCard,
      ]}
      onPress={onPress}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.dateContainer}>
           <Text style={styles.dateText}>{formatDate(item.date)}</Text>
           <Text style={styles.timeText}>{item.startTime} - {item.endTime}</Text>
        </View>
        <View style={styles.statusBadgeContainer}>
            {isCancelled ? (
                <View style={[styles.statusBadge, styles.statusBadgeCancelled]}>
                  <Text style={[styles.statusBadgeText, styles.statusBadgeTextCancelled]}>Cancellata</Text>
                </View>
            ) : (
                <View style={[
                  styles.statusBadge, 
                  isOngoing ? styles.statusBadgeOngoing : (isPast ? styles.statusBadgePast : styles.statusBadgeUpcoming)
                ]}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    {!isPast && !isOngoing && (
                      <Ionicons name="hourglass-outline" size={13} color="#2196F3" style={{ marginRight: 3 }} />
                    )}
                    <Text style={[
                        styles.statusBadgeText, 
                        isOngoing ? styles.statusBadgeTextOngoing : (isPast ? styles.statusBadgeTextPast : styles.statusBadgeTextUpcoming)
                    ]}>{timeStatus}</Text>
                  </View>
                  {/* Riga aggiuntiva: quanto manca alla chiusura registrazione */}
                  {!isPast && !isOngoing && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Ionicons name="lock-closed-outline" size={13} color="#2196F3" style={{ marginRight: 3 }} />
                      <Text style={{ fontSize: 11, color: '#2196F3', fontWeight: '700' }}>{getRegistrationCloseStatus(item)}</Text>
                    </View>
                  )}
                </View>
            )}
            
            {/* Match Status Badge - sotto lo stato temporale */}
            {matchBadgeInfo && (
              <View style={[styles.matchStatusBadgeInline, { backgroundColor: matchBadgeInfo.bgColor }]}>
                <Ionicons name={matchBadgeInfo.icon as any} size={12} color={matchBadgeInfo.color} />
                <Text style={[styles.matchStatusTextInline, { color: matchBadgeInfo.color }]}>
                  {matchBadgeInfo.text}
                </Text>
              </View>
            )}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardContent}>
        <View style={styles.infoRowMain}>
          {/* Avatar instead of Ionicons person */}
          <Avatar
            name={item.user?.name}
            surname={item.user?.surname}
            avatarUrl={item.user?.avatarUrl}
            size={32}
            fallbackIcon="person"
            style={{ marginRight: 2 }}
          />
          <Text style={styles.userNameText}>
            {item.user?.name || "N/A"} {item.user?.surname || ""}
          </Text>
        </View>

        <View style={styles.infoRowSub}>
             <Ionicons name="location-outline" size={16} color="#888" />
             <Text style={styles.locationText}>
                {item.campo.struttura.name} • {item.campo.name}
             </Text>
        </View>

        <View style={styles.infoRowSub}>
             <SportIcon sport={item.campo.sport} size={16} color="#888" />
             <Text style={styles.locationText}>{formatSportName(item.campo.sport)}</Text>
        </View>
      </View>

      {/* PULSANTE INSERIMENTO RISULTATO */}
      {canOwnerInsert && (
        <View style={styles.scoreButtonContainer}>
          <Pressable
            style={styles.scoreButton}
            onPress={() => {
              navigation.navigate("OwnerDettaglioPrenotazione", {
                bookingId: item._id,
                openScoreEntry: true,
              });
            }}
          >
            <Ionicons name="clipboard" size={18} color="#FF9800" />
            <Text style={styles.scoreButtonText}>Inserisci risultato</Text>
            <Ionicons name="chevron-forward" size={16} color="#FF9800" />
          </Pressable>
        </View>
      )}

      {/* FOOTER */}
      <View style={styles.cardFooterBlue}>
         <View style={styles.priceContainerBlue}>
             <Text style={styles.priceLabelBlue}>Prezzo</Text>
             <Text style={styles.priceValueBlue}>€{item.price}</Text>
         </View>
         <View style={styles.actionButtonBlue}>
             <Text style={styles.actionButtonTextBlue}>Vedi dettagli</Text>
             <Ionicons name="chevron-forward" size={16} color="#fff" />
         </View>
      </View>
    </Pressable>
  );
}

/* =========================
   MAIN SCREEN
========================= */
export default function OwnerBookingsScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past" | "ongoing">(route.params?.filterDate ? "all" : "upcoming");
  
  const [filterUsername, setFilterUsername] = useState("");
  const [filterStruttura, setFilterStruttura] = useState(route.params?.filterStrutturaId || "");
  const [filterCampo, setFilterCampo] = useState(route.params?.filterCampoId || "");
  const [filterDate, setFilterDate] = useState(route.params?.filterDate || "");
  
  const [strutture, setStrutture] = useState<Array<{ _id: string; name: string }>>([]);
  const [campi, setCampi] = useState<Array<{ _id: string; name: string; strutturaId: string }>>([]);
  
  const [showStrutturaModal, setShowStrutturaModal] = useState(false);
  const [showCampoModal, setShowCampoModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  /* =========================
     LOAD DATA
  ========================= */
  const loadOwnerData = useCallback(async () => {
    if (!token) return;

    try {
      const struttureRes = await fetch(`${API_URL}/strutture/owner/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!struttureRes.ok) throw new Error(`HTTP ${struttureRes.status}`);
      const struttureData = await struttureRes.json();
      setStrutture(struttureData.map((s: any) => ({ _id: s._id, name: s.name })));

      const allCampi: Array<{ _id: string; name: string; strutturaId: string }> = [];

      for (const struttura of struttureData) {
        try {
          const campiRes = await fetch(`${API_URL}/campi/owner/struttura/${struttura._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (campiRes.ok) {
            const campiData = await campiRes.json();
            campiData.forEach((campo: any) => {
              allCampi.push({
                _id: campo._id,
                name: campo.name,
                strutturaId: struttura._id,
              });
            });
          }
        } catch (err) {
          console.log(`⚠️ Errore caricamento campi per struttura ${struttura._id}`);
        }
      }

      setCampi(allCampi);
    } catch (err) {
      console.log("❌ Errore caricamento dati owner");
    }
  }, [token]);

  const loadBookings = useCallback(async () => {
    if (!token) return;

    try {
      setRefreshing(true);
      const res = await fetch(`${API_URL}/bookings/owner`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      console.log(`📋 Caricate ${data.length} prenotazioni owner`);
      setBookings(data);
      setLoading(false);
    } catch (err) {
      console.log("❌ Errore fetch owner bookings");
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await loadOwnerData();
        await loadBookings();
      };
      loadData();
    }, [loadOwnerData, loadBookings])
  );

  /* =========================
     FILTERS
  ========================= */
  const getFilteredCount = (timeFilter: "all" | "upcoming" | "past" | "ongoing") => {
    return bookings.filter((b) => {
      // Filter by time
      if (timeFilter === "upcoming" && !isUpcomingBooking(b)) return false;
      if (timeFilter === "ongoing" && !isOngoingBooking(b)) return false;
      if (timeFilter === "past" && !isPastBooking(b)) return false;
      
      // Filter by struttura
      if (filterStruttura && b.campo?.struttura?._id !== filterStruttura) return false;
      
      // Filter by campo
      if (filterCampo && b.campo?._id !== filterCampo) return false;
      
      // Filter by date
      if (filterDate && b.date !== filterDate) return false;
      
      return true;
    }).length;
  };

  const filteredBookings = bookings.filter((b) => {
    // Filter by time
    if (filter === "upcoming" && !isUpcomingBooking(b)) return false;
    if (filter === "ongoing" && !isOngoingBooking(b)) return false;
    if (filter === "past" && !isPastBooking(b)) return false;
    
    // Filter by username
    if (filterUsername.trim()) {
      const searchLower = filterUsername.toLowerCase().trim();
      const userName = (b.user?.name?.toLowerCase() || "") + " " + (b.user?.surname?.toLowerCase() || "");
      if (!userName.includes(searchLower)) return false;
    }
    
    // Filter by struttura
    if (filterStruttura && b.campo?.struttura?._id !== filterStruttura) return false;
    
    // Filter by campo
    if (filterCampo && b.campo?._id !== filterCampo) return false;
    
    // Filter by date
    if (filterDate && b.date !== filterDate) return false;
    
    return true;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const aDate = new Date(`${a.date}T${a.startTime}:00`).getTime();
    const bDate = new Date(`${b.date}T${b.startTime}:00`).getTime();
    
    if (filter === "upcoming" || filter === "ongoing") {
      return aDate - bDate;
    } else if (filter === "past") {
      return bDate - aDate;
    }
    return bDate - aDate;
  });

  const campiFiltered = filterStruttura
    ? campi.filter((c) => c.strutturaId === filterStruttura)
    : campi;

  const clearFilters = () => {
    setFilterUsername("");
    setFilterStruttura("");
    setFilterCampo("");
    setFilterDate("");
  };

  const hasActiveFilters = filterUsername || filterStruttura || filterCampo || filterDate;

  /* =========================
     RENDER
  ========================= */
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              {route.params?.fromDashboard && (
                <Pressable
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color="#2196F3" />
                </Pressable>
              )}
              <View style={styles.headerIconContainer}>
                <Ionicons name="calendar" size={26} color="#2196F3" />
              </View>
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.title}>Prenotazioni</Text>
            </View>
            <Pressable
              onPress={async () => {
                await loadOwnerData();
                await loadBookings();
              }}
              disabled={refreshing}
              style={styles.refreshButton}
            >
              <Ionicons
                name={refreshing ? "hourglass-outline" : "refresh"}
                size={24}
                color="#2196F3"
              />
            </Pressable>
          </View>

          {/* FILTER TABS - ORIZZONTALI E COMPATTI */}
          <View style={styles.filterTabsWrapperCompact}>
            <Pressable
              style={[styles.filterTabCompact, filter === "ongoing" && styles.filterTabOngoing]}
              onPress={() => setFilter("ongoing")}
            >
              <Text style={[styles.filterTabTextCompact, filter === "ongoing" && styles.filterTabTextActive]}>
                In corso
              </Text>
              <View style={[styles.filterBadgeCompact, filter === "ongoing" && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeTextCompact, filter === "ongoing" && styles.filterBadgeTextActive]}>
                  {getFilteredCount("ongoing")}
                </Text>
              </View>
            </Pressable>
            <Pressable
              style={[styles.filterTabCompact, filter === "upcoming" && styles.filterTabActive]}
              onPress={() => setFilter("upcoming")}
            >
              <Text style={[styles.filterTabTextCompact, filter === "upcoming" && styles.filterTabTextActive]}>
                Prossime
              </Text>
              <View style={[styles.filterBadgeCompact, filter === "upcoming" && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeTextCompact, filter === "upcoming" && styles.filterBadgeTextActive]}>
                  {getFilteredCount("upcoming")}
                </Text>
              </View>
            </Pressable>
            <Pressable
              style={[styles.filterTabCompact, filter === "past" && styles.filterTabActive]}
              onPress={() => setFilter("past")}
            >
              <Text style={[styles.filterTabTextCompact, filter === "past" && styles.filterTabTextActive]}>
                Concluse
              </Text>
              <View style={[styles.filterBadgeCompact, filter === "past" && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeTextCompact, filter === "past" && styles.filterBadgeTextActive]}>
                  {getFilteredCount("past")}
                </Text>
              </View>
            </Pressable>
            <Pressable
              style={[styles.filterTabCompact, filter === "all" && styles.filterTabActive]}
              onPress={() => setFilter("all")}
            >
              <Text style={[styles.filterTabTextCompact, filter === "all" && styles.filterTabTextActive]}>
                Tutte
              </Text>
              <View style={[styles.filterBadgeCompact, filter === "all" && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeTextCompact, filter === "all" && styles.filterBadgeTextActive]}>
                  {getFilteredCount("all")}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* ADDITIONAL FILTERS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filtersScrollContent}
          >
            {/* CHIP RICERCA NOME - PRIMO CHIP */}
            <Pressable
              style={[styles.filterChip, filterUsername && styles.filterChipActive]}
              onPress={() => setShowSearchModal(true)}
            >
              <Ionicons
                name="search"
                size={16}
                color={filterUsername ? "white" : "#666"}
              />
              <Text style={[styles.filterChipText, filterUsername && styles.filterChipTextActive]}>
                {filterUsername ? filterUsername : "Cliente"}
              </Text>
              {filterUsername.length > 0 && (
                <Pressable onPress={() => setFilterUsername("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={filterUsername ? "white" : "#999"} />
                </Pressable>
              )}
            </Pressable>

            {/* CHIP DATA */}
            <Pressable
              style={[styles.filterChip, filterDate && styles.filterChipActive]}
              onPress={() => setShowCalendarModal(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={filterDate ? "white" : "#666"}
              />
              <Text style={[styles.filterChipText, filterDate && styles.filterChipTextActive]}>
                {filterDate
                  ? new Date(filterDate + "T12:00:00").toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Data"}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterChip, filterStruttura && styles.filterChipActive]}
              onPress={() => setShowStrutturaModal(true)}
            >
              <Ionicons
                name="business-outline"
                size={16}
                color={filterStruttura ? "white" : "#666"}
              />
              <Text style={[styles.filterChipText, filterStruttura && styles.filterChipTextActive]}>
                {filterStruttura
                  ? strutture.find((s) => s._id === filterStruttura)?.name || "Struttura"
                  : "Struttura"}
              </Text>
            </Pressable>

            {filterStruttura && campiFiltered.length > 0 && (
              <Pressable
                style={[styles.filterChip, filterCampo && styles.filterChipActive]}
                onPress={() => setShowCampoModal(true)}
              >
                <Ionicons
                  name="basketball-outline"
                  size={16}
                  color={filterCampo ? "white" : "#666"}
                />
                <Text style={[styles.filterChipText, filterCampo && styles.filterChipTextActive]}>
                  {filterCampo
                    ? campiFiltered.find((c) => c._id === filterCampo)?.name || "Campo"
                    : "Campo"}
                </Text>
              </Pressable>
            )}

            {hasActiveFilters && (
              <Pressable style={styles.filterChipReset} onPress={clearFilters}>
                <Ionicons name="close" size={16} color="#E53935" />
                <Text style={styles.filterChipResetText}>Reset</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>

        {/* MODAL RICERCA NOME CLIENTE - CENTRATO */}
        <Modal visible={showSearchModal} animationType="fade" transparent>
          <Pressable style={styles.modalOverlayCenter} onPress={() => setShowSearchModal(false)}>
            <Pressable style={styles.modalContentCenter} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cerca per nome cliente</Text>
                <Pressable onPress={() => setShowSearchModal(false)} hitSlop={10}>
                  <Ionicons name="close" size={24} color="#999" />
                </Pressable>
              </View>
              <TextInput
                style={styles.searchInputModal}
                placeholder="Nome o cognome..."
                placeholderTextColor="#999"
                value={filterUsername}
                onChangeText={setFilterUsername}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => setShowSearchModal(false)}
              />
              {filterUsername.length > 0 && (
                <Pressable onPress={() => setFilterUsername("")} style={{ marginTop: 12, alignSelf: 'flex-end' }}>
                  <Ionicons name="close-circle" size={22} color="#E53935" />
                </Pressable>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* LIST */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Caricamento...</Text>
          </View>
        ) : (
          <FlatList
            data={sortedBookings}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <BookingCard
                item={item}
                onPress={() =>
                  navigation.navigate("OwnerDettaglioPrenotazione", {
                    bookingId: item._id,
                  })
                }
              />
            )}
            showsVerticalScrollIndicator={false}
            onRefresh={async () => {
              await loadOwnerData();
              await loadBookings();
            }}
            refreshing={refreshing}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>Nessuna prenotazione</Text>
                <Text style={styles.emptyText}>
                  {hasActiveFilters
                    ? "Prova a modificare i filtri"
                    : filter === "ongoing"
                    ? "Non hai prenotazioni in corso"
                    : filter === "upcoming"
                    ? "Non hai prenotazioni in arrivo"
                    : filter === "past"
                    ? "Non hai prenotazioni concluse"
                    : "Non hai ancora prenotazioni"}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* STRUTTURA MODAL */}
      <Modal visible={showStrutturaModal} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowStrutturaModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleziona Struttura</Text>
              <Pressable onPress={() => setShowStrutturaModal(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color="#999" />
              </Pressable>
            </View>

            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              <Pressable
                style={[styles.optionItem, !filterStruttura && styles.optionItemSelected]}
                onPress={() => {
                  setFilterStruttura("");
                  setFilterCampo("");
                  setShowStrutturaModal(false);
                }}
              >
                <Text style={[styles.optionText, !filterStruttura && styles.optionTextSelected]}>
                  Tutte le strutture
                </Text>
                {!filterStruttura && <Ionicons name="checkmark" size={20} color="#2196F3" />}
              </Pressable>

              {strutture.map((struttura) => (
                <Pressable
                  key={struttura._id}
                  style={[
                    styles.optionItem,
                    filterStruttura === struttura._id && styles.optionItemSelected,
                  ]}
                  onPress={() => {
                    setFilterStruttura(struttura._id);
                    setFilterCampo("");
                    setShowStrutturaModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      filterStruttura === struttura._id && styles.optionTextSelected,
                    ]}
                  >
                    {struttura.name}
                  </Text>
                  {filterStruttura === struttura._id && (
                    <Ionicons name="checkmark" size={20} color="#2196F3" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* CAMPO MODAL */}
      <Modal visible={showCampoModal} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCampoModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleziona Campo</Text>
              <Pressable onPress={() => setShowCampoModal(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color="#999" />
              </Pressable>
            </View>

            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              <Pressable
                style={[styles.optionItem, !filterCampo && styles.optionItemSelected]}
                onPress={() => {
                  setFilterCampo("");
                  setShowCampoModal(false);
                }}
              >
                <Text style={[styles.optionText, !filterCampo && styles.optionTextSelected]}>
                  Tutti i campi
                </Text>
                {!filterCampo && <Ionicons name="checkmark" size={20} color="#2196F3" />}
              </Pressable>

              {campiFiltered.map((campo) => (
                <Pressable
                  key={campo._id}
                  style={[
                    styles.optionItem,
                    filterCampo === campo._id && styles.optionItemSelected,
                  ]}
                  onPress={() => {
                    setFilterCampo(campo._id);
                    setShowCampoModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      filterCampo === campo._id && styles.optionTextSelected,
                    ]}
                  >
                    {campo.name}
                  </Text>
                  {filterCampo === campo._id && (
                    <Ionicons name="checkmark" size={20} color="#2196F3" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* CALENDAR MODAL */}
      <Modal visible={showCalendarModal} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCalendarModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleziona Data</Text>
              <Pressable onPress={() => setShowCalendarModal(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color="#999" />
              </Pressable>
            </View>

            <Calendar
              onDayPress={(day) => {
                setFilterDate(day.dateString);
                setShowCalendarModal(false);
              }}
              markedDates={{
                [filterDate]: {
                  selected: true,
                  selectedColor: "#2196F3",
                },
              }}
              theme={{
                selectedDayBackgroundColor: "#2196F3",
                todayTextColor: "#2196F3",
                arrowColor: "#2196F3",
                monthTextColor: "#333",
                textMonthFontSize: 18,
                textDayFontSize: 16,
                textDayHeaderFontSize: 14,
              }}
              style={styles.calendar}
            />

            {filterDate && (
              <Pressable
                style={styles.clearDateButton}
                onPress={() => {
                  setFilterDate("");
                  setShowCalendarModal(false);
                }}
              >
                <Text style={styles.clearDateText}>Rimuovi filtro data</Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
  },

  // HEADER
  header: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 11,
    color: "#666",
    marginTop: 1,
    fontWeight: "600",
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  // SEARCH
  // SEARCH MODAL INPUT
  searchInputModal: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    backgroundColor: "#fafafa",
  },

  // FILTER TABS - COMPACT ORIZZONTALE
  filterTabsWrapperCompact: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 16,
    marginTop: 0,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterTabCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: "white",
    borderWidth: 1.2,
    borderColor: "#E0E0E0",
    minWidth: 0,
    marginHorizontal: 0,
    gap: 4,
  },
  filterTabActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  filterTabOngoing: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  filterTabTextCompact: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    marginRight: 2,
  },
  filterTabTextActive: {
    color: "white",
  },
  filterBadgeCompact: {
    backgroundColor: "#F0F0F0",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    marginLeft: 2,
  },
  filterBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  filterBadgeTextCompact: {
    fontSize: 11,
    fontWeight: "800",
    color: "#666",
    paddingHorizontal: 1,
  },
  filterBadgeTextActive: {
    color: "white",
  },

  // ADDITIONAL FILTERS
  filtersScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 40,
  },
  filtersScrollContent: {
    paddingHorizontal: 16,
    gap: 6,
    alignItems: "flex-start",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e9ecef",
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
  },
  filterChipTextActive: {
    color: "white",
  },
  filterChipReset: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E53935",
    gap: 4,
  },
  filterChipResetText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E53935",
  },

  // LOADING
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },

  // LIST
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 60, // Maggiore spazio per la tab bar
  },

  // EMPTY
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  emptyText: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 22,
  },

  // CARD
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e9ecef",
    overflow: "hidden",
  },
  ongoingCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#4CAF50",
    backgroundColor: "#F1F8F4",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cancelledCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#F44336",
  },

  // CARD TOP ROW
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 12,
  },
  dateContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 3,
    textTransform: "capitalize",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  statusBadgeContainer: {
    marginLeft: 12,
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeCancelled: {
    backgroundColor: "#FFEBEE",
  },
  statusBadgePast: {
    backgroundColor: "#E0E0E0",
  },
  statusBadgeOngoing: {
    backgroundColor: "#4CAF50",
  },
  statusBadgeUpcoming: {
    backgroundColor: "#E3F2FD",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  statusBadgeTextCancelled: {
    color: "#F44336",
  },
  statusBadgeTextPast: {
    color: "#757575",
  },
  statusBadgeTextOngoing: {
    color: "white",
  },
  statusBadgeTextUpcoming: {
    color: "#2196F3",
  },

  // DIVIDER
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 16,
  },

  // CARD CONTENT
  cardContent: {
    padding: 14,
    paddingTop: 10,
    gap: 8,
  },
  infoRowMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoRowSub: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 2,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
    flex: 1,
  },

  // MATCH STATUS BADGE
  matchStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  matchStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  matchStatusBadgeInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    alignSelf: "flex-end",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  matchStatusTextInline: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  // SCORE BUTTON
  scoreButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFF8E1",
    borderTopWidth: 1,
    borderTopColor: "#FFE082",
  },
  scoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FF9800",
    shadowColor: "#FF9800",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FF9800",
    letterSpacing: 0.3,
  },

  // CARD FOOTER
  cardFooterBlue: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#2196F3",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  priceContainerBlue: {
    gap: 2,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
  },
  priceLabelBlue: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceValueBlue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    marginTop: -2,
  },
  actionButtonBlue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  actionButtonTextBlue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  // Centered modal overlay for search
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
  },
  // Centered modal content for search
  modalContentCenter: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    minWidth: 300,
    maxWidth: '90%',
    alignItems: 'stretch',
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1a1a1a",
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  optionItemSelected: {
    backgroundColor: "#E3F2FD",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  optionTextSelected: {
    color: "#2196F3",
    fontWeight: "800",
  },
  calendar: {
    borderRadius: 10,
    marginBottom: 20,
  },
  clearDateButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginBottom: 10,
  },
  clearDateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
});
