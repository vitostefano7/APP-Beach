import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import API_URL from "../../../config/api";
import { ScaleInView } from "./DettaglioPrenotazione/components/AnimatedComponents";

/* =========================
   TYPES
========================= */
interface Player {
  _id: string;
  user: {
    _id: string;
    name: string;
    surname: string;
    username: string;
    avatarUrl?: string;
  };
  team: "A" | "B";
  status: string;
}

interface Booking {
  _id: string;
  campo: {
    name: string;
    sport: string;
    struttura: {
      name: string;
      location: {
        city: string;
      };
    };
  };
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: "confirmed" | "cancelled";
  hasMatch?: boolean;
  matchSummary?: {
    winner: "A" | "B";
    sets: { teamA: number; teamB: number }[];
  };
  matchId?: string;
  isMyBooking?: boolean;
  isInvitedPlayer?: boolean;
  players?: Player[];
  maxPlayers?: number;
}

/* =========================
   SCREEN
========================= */
export default function LeMiePrenotazioniScreen({ route }: any) {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const initialFilter = route?.params?.initialFilter || "upcoming";
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">(initialFilter);

  // Stati per il modal personalizzato
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState("");
  const [customAlertMessage, setCustomAlertMessage] = useState("");
  const [customAlertButtons, setCustomAlertButtons] = useState<Array<{text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive'}>>([]);

  // Funzione helper per mostrare alert personalizzato
  const showCustomAlert = (title: string, message: string, buttons: Array<{text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive'}> = [{text: 'OK'}]) => {
    setCustomAlertTitle(title);
    setCustomAlertMessage(message);
    setCustomAlertButtons(buttons);
    setCustomAlertVisible(true);
  };

  /* =========================
     LOAD BOOKINGS
  ========================= */
  const loadBookings = useCallback(async () => {
    if (!token) return;

    try {
      setRefreshing(true);

      const res = await fetch(`${API_URL}/bookings/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      console.log(`📋 Caricate ${data.length} prenotazioni`);
      console.log(`   - ${data.filter((b: any) => b.isMyBooking).length} create da te`);
      console.log(`   - ${data.filter((b: any) => b.isInvitedPlayer).length} come player invitato`);
      
      // Debug: vediamo i players
      data.forEach((b: any, i: number) => {
        if (b.players && b.players.length > 0) {
          console.log(`🎮 Prenotazione ${i + 1}: ${b.players.length} players`, b.players);
        }
      });
      
      setBookings(data);
      setLoading(false);
    } catch {
      showCustomAlert("Errore", "Impossibile caricare le prenotazioni");
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  /* =========================
     HELPERS
  ========================= */
  // Funzione che controlla se la prenotazione è passata
  // Considera sia la data che l'orario di fine
  const isPastBooking = (booking: Booking): boolean => {
    // Se è cancellata, la consideriamo passata
    if (booking.status === "cancelled") return true;
    
    try {
      // Crea la data e ora di fine della prenotazione
      const bookingEndDateTime = new Date(`${booking.date}T${booking.endTime}:00`);
      const now = new Date();
      
      // Se l'orario di fine è passato rispetto ad ora, la prenotazione è passata
      return bookingEndDateTime < now;
    } catch (error) {
      console.error('Errore nel calcolo data:', error);
      // Fallback: controlla solo la data
      const bookingDate = new Date(booking.date + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return bookingDate < today;
    }
  };

  // Funzione che controlla se la prenotazione è futura
  const isUpcomingBooking = (booking: Booking): boolean => {
    // Se è cancellata, non è futura
    if (booking.status === "cancelled") return false;
    
    try {
      // Crea la data e ora di inizio della prenotazione
      const bookingStartDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
      const now = new Date();
      
      // Se l'orario di inizio è nel futuro, la prenotazione è futura
      return bookingStartDateTime > now;
    } catch (error) {
      console.error('Errore nel calcolo data:', error);
      // Fallback: controlla solo la data
      const bookingDate = new Date(booking.date + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return bookingDate >= today;
    }
  };

  // Funzione che controlla se la prenotazione è in corso
  const isOngoingBooking = (booking: Booking): boolean => {
    // Se è cancellata, non è in corso
    if (booking.status === "cancelled") return false;
    
    try {
      const now = new Date();
      const bookingStartDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
      const bookingEndDateTime = new Date(`${booking.date}T${booking.endTime}:00`);
      
      // La prenotazione è in corso se siamo tra l'inizio e la fine
      return now >= bookingStartDateTime && now <= bookingEndDateTime;
    } catch (error) {
      console.error('Errore nel calcolo data:', error);
      return false;
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T12:00:00").toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  // Funzione per formattare il tempo rimanente
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

  /* =========================
     FILTER
  ========================= */
  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return isUpcomingBooking(b) || isOngoingBooking(b);
    if (filter === "past") return isPastBooking(b);
    return true;
  });

  // Ordinamento: per le prossime, ordina per data/ora crescente
  // Per le passate, ordina per data/ora decrescente
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const aDate = new Date(`${a.date}T${a.startTime}:00`).getTime();
    const bDate = new Date(`${b.date}T${b.startTime}:00`).getTime();
    
    if (filter === "upcoming") {
      return aDate - bDate; // Più recenti prima
    } else if (filter === "past") {
      return bDate - aDate; // Più recenti ultime
    }
    return bDate - aDate; // Di default, più recenti prima
  });

  /* =========================
     RENDER CARD
  ========================= */
  const renderBookingCard = ({ item }: { item: Booking }) => {
    const isPast = isPastBooking(item);
    const isOngoing = isOngoingBooking(item);
    const isUpcoming = isUpcomingBooking(item);
    const isCancelled = item.status === "cancelled";
    // Può inserire risultato se: è passata, confermata, ha un match ma non ha risultato
    const canInsertResult = isPast && item.status === "confirmed" && item.hasMatch && !item.matchSummary;
    const timeStatus = getTimeStatus(item);

    return (
      <Pressable
        style={[
          styles.card,
          isPast && !isCancelled && styles.pastCard,
          isOngoing && styles.ongoingCard,
          isCancelled && styles.cancelledCard,
        ]}
        onPress={() =>
          navigation.navigate("DettaglioPrenotazione", {
            bookingId: item._id,
          })
        }
      >
        {/* STATUS BADGE (top-left ora) */}
        <View style={styles.statusRow}>
          <View style={styles.leftBadges}>
            {isCancelled && (
              <View style={styles.cancelledBadge}>
                <Ionicons name="close-circle" size={14} color="#F44336" />
                <Text style={styles.cancelledText}>Cancellata</Text>
              </View>
            )}

            {/* ✅ BADGE INVITATO */}
            {item.isInvitedPlayer && (
              <View style={styles.invitedBadge}>
                <Ionicons name="people" size={14} color="#2196F3" />
                <Text style={styles.invitedText}>Invitato</Text>
              </View>
            )}
          </View>

          <View style={styles.rightBadges}>
            {/* Indicatore di tempo */}
            {!isCancelled && (
              <View style={[
                styles.timeBadge,
                isPast && styles.timeBadgePast,
                isOngoing && styles.timeBadgeOngoing,
                isUpcoming && styles.timeBadgeUpcoming,
              ]}>
                <Ionicons 
                  name={isOngoing ? "play-circle" : "time-outline"} 
                  size={12} 
                  color={isOngoing ? "#FFF" : isPast ? "#FFF" : "#FFF"} 
                />
                <Text style={styles.timeBadgeText}>{timeStatus}</Text>
              </View>
            )}

            <View style={styles.sportBadge}>
              {(item.campo.sport === "beach volley" || item.campo.sport === "volley") ? (
                <FontAwesome5 name="volleyball-ball" size={12} color="#2196F3" />
              ) : (
                <Ionicons 
                  name={
                    item.campo.sport === "calcio" ? "football" :
                    item.campo.sport === "tennis" ? "tennisball" :
                    item.campo.sport === "basket" ? "basketball" :
                    "fitness"
                  } 
                  size={12} 
                  color="#2196F3" 
                />
              )}
              <Text style={styles.sportText}>{item.campo.sport}</Text>
            </View>
          </View>
        </View>

        {/* HEADER */}
        <View style={styles.cardHeader}>
          <Text style={styles.strutturaName}>
            {item.campo.struttura.name}
          </Text>
          <Text style={styles.campoName}>{item.campo.name}</Text>
        </View>

        {/* BODY */}
        <View style={styles.cardBody}>
          <InfoRow icon="calendar-outline" text={formatDate(item.date)} />
          <InfoRow
            icon="time-outline"
            text={`${item.startTime} - ${item.endTime}`}
          />
          <InfoRow
            icon="location-outline"
            text={item.campo.struttura.location.city}
          />
        </View>

        {/* TEAMS */}
        {item.matchSummary && item.players && item.players.length > 0 && (
          <View style={styles.teamsContainer}>
            <View style={styles.teamsRow}>
              <TeamSection players={item.players} team="A" />
              <TeamSection players={item.players} team="B" />
            </View>
          </View>
        )}

        {/* RESULT */}
        {item.matchSummary && (
          <View style={styles.resultBox}>
            <View style={styles.resultHeader}>
              <Ionicons name="trophy" size={16} color="#FFC107" />
              <Text
                style={[
                  styles.winner,
                  item.matchSummary.winner === "A"
                    ? styles.win
                    : styles.lose,
                ]}
              >
                {item.matchSummary.winner === "A" ? "VITTORIA" : "SCONFITTA"}
              </Text>
              <Text style={styles.finalScore}>
                {item.matchSummary.sets.filter(s => s.teamA > s.teamB).length} - {item.matchSummary.sets.filter(s => s.teamB > s.teamA).length}
              </Text>
            </View>

            <View style={styles.setsGrid}>
              {item.matchSummary.sets.map((s, i) => (
                <View key={i} style={styles.setItem}>
                  <Text style={styles.setLabel}>Set {i + 1}</Text>
                  <Text style={styles.setScore}>
                    {s.teamA} - {s.teamB}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.cardFooter}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>
              {item.paymentMode === 'split' ? 'Quota' : 'Totale'}
            </Text>
            <Text style={styles.price}>
              €{item.paymentMode === 'split' 
                ? ((item.price / (item.players?.length || item.numberOfPeople || 1)).toFixed(2))
                : item.price.toFixed(2)}
            </Text>
          </View>

          {canInsertResult ? (
            <Pressable
              style={styles.resultBtn}
              onPress={(e) => {
                e.stopPropagation();
                // Controlla se i partecipanti sono completi
                if (item.maxPlayers && item.players && item.players.length !== item.maxPlayers) {
                  showCustomAlert(
                    "Partecipanti non completi",
                    "Assicurati che i team siano completi prima di inserire il risultato.",
                    [{ text: "OK" }]
                  );
                  return;
                }
                navigation.navigate("DettaglioPrenotazione", {
                  bookingId: item._id,
                  openScoreModal: true,
                });
              }}
            >
              <Ionicons name="clipboard-outline" size={18} color="white" />
              <Text style={styles.resultBtnText}>Inserisci risultato</Text>
            </Pressable>
          ) : (
            <View style={styles.tapHint}>
              {isOngoing && (
                <View style={styles.ongoingIndicator}>
                  <Ionicons name="play-circle" size={14} color="#4CAF50" />
                  <Text style={styles.ongoingText}>In corso</Text>
                </View>
              )}
              <Text style={styles.tapHintText}>Vedi dettagli</Text>
              <Ionicons name="chevron-forward" size={16} color="#999" />
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Le mie prenotazioni</Text>
            <Text style={styles.headerSubtitle}>
              {filter === "upcoming" && `${sortedBookings.length} ${sortedBookings.length === 1 ? "prenotazione futura" : "prenotazioni future"}`}
              {filter === "past" && `${sortedBookings.length} ${sortedBookings.length === 1 ? "prenotazione conclusa" : "prenotazioni passate"}`}
              {filter === "all" && `${sortedBookings.length} ${sortedBookings.length === 1 ? "prenotazione totale" : "prenotazioni totali"}`}
            </Text>
          </View>
        </View>

        {/* FILTERS */}
        <View style={styles.filters}>
          {[
            { key: "upcoming", label: "Future", icon: "arrow-forward-circle-outline" },
            { key: "past", label: "Concluse", icon: "time-outline" },
            { key: "all", label: "Tutte", icon: "list-outline" },
          ].map((f) => (
            <Pressable
              key={f.key}
              style={[
                styles.filterBtn,
                filter === f.key && styles.filterBtnActive,
              ]}
              onPress={() => setFilter(f.key as any)}
            >
              <Ionicons 
                name={f.icon as any} 
                size={16} 
                color={filter === f.key ? "white" : "#666"} 
              />
              <Text
                style={[
                  styles.filterText,
                  filter === f.key && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* LIST */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Caricamento...</Text>
          </View>
        ) : sortedBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nessuna prenotazione</Text>
            <Text style={styles.emptySubtitle}>
              {filter === "upcoming" 
                ? "Non hai prenotazioni future" 
                : filter === "past"
                ? "Non hai prenotazioni passate"
                : "Non hai ancora effettuato prenotazioni"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={sortedBookings}
            keyExtractor={(item) => item._id}
            renderItem={renderBookingCard}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={loadBookings}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      {/* Custom Alert Modal */}
      <Modal
        visible={customAlertVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCustomAlertVisible(false)}
      >
        <View style={styles.centeredModalOverlay}>
          <ScaleInView style={styles.customAlertModal}>
            <View style={styles.customAlertHeader}>
              <Text style={styles.customAlertTitle}>{customAlertTitle}</Text>
            </View>
            <View style={styles.customAlertContent}>
              <Text style={styles.customAlertMessage}>{customAlertMessage}</Text>
            </View>
            <View style={styles.customAlertButtons}>
              {customAlertButtons.map((button, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.customAlertButton,
                    button.style === 'destructive' && styles.customAlertButtonDestructive,
                    button.style === 'cancel' && styles.customAlertButtonCancel,
                  ]}
                  onPress={() => {
                    setCustomAlertVisible(false);
                    button.onPress?.();
                  }}
                >
                  <Text style={[
                    styles.customAlertButtonText,
                    button.style === 'destructive' && styles.customAlertButtonTextDestructive,
                    button.style === 'cancel' && styles.customAlertButtonTextCancel,
                  ]}>
                    {button.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScaleInView>
        </View>
      </Modal>
    </View>
  );
}

/* =========================
   SMALL COMPONENTS
========================= */
const InfoRow = ({ icon, text }: { icon: any; text: string }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={16} color="#666" />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const PlayerAvatar = ({ player, size = 32 }: { player: Player; size?: number }) => {
  const initials = `${player.user.name.charAt(0)}${player.user.surname.charAt(0)}`.toUpperCase();
  const bgColor = player.team === "A" ? "#F44336" : "#2196F3"; // Rosso per A, Blu per B
  const avatarUrl = player.user.avatarUrl;
  
  if (avatarUrl) {
    return (
      <View style={{ width: size, height: size }}>
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.avatarInitials, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
};

const TeamSection = ({ players, team }: { players: Player[]; team: "A" | "B" }) => {
  const teamPlayers = players.filter(p => p.team === team);
  
  if (teamPlayers.length === 0) return null;
  
  const teamColor = team === "A" ? "#F44336" : "#2196F3";
  const teamBgColor = team === "A" ? "#FFEBEE" : "#E3F2FD";
  
  return (
    <View style={styles.teamSection}>
      <View style={[styles.teamHeader, { backgroundColor: teamBgColor }]}>
        <View style={[styles.teamBadge, { backgroundColor: teamColor }]}>
          <Text style={styles.teamLabel}>Team {team}</Text>
        </View>
        <Text style={styles.teamCount}>{teamPlayers.length}</Text>
      </View>
      <View style={styles.teamPlayers}>
        {teamPlayers.map((player) => (
          <View key={player.user._id} style={styles.playerItem}>
            <PlayerAvatar player={player} size={28} />
            <Text style={styles.playerName} numberOfLines={1}>
              {player.user.name} {player.user.surname.charAt(0)}.
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
  },

  header: {
    padding: 20,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: "800",
    color: "#1a1a1a",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },

  filters: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
    backgroundColor: "white",
  },
  filterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
  },
  filterBtnActive: { 
    backgroundColor: "#2196F3",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: { 
    fontWeight: "700", 
    color: "#666",
    fontSize: 13,
  },
  filterTextActive: { color: "white" },

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

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },

  listContent: { 
    padding: 16,
    paddingBottom: 100,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pastCard: {
    opacity: 0.9,
  },
  ongoingCard: {
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  cancelledCard: {
    opacity: 0.7,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  leftBadges: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  rightBadges: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  cancelledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  cancelledText: { 
    fontSize: 11, 
    fontWeight: "700", 
    color: "#F44336",
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  confirmedText: { 
    fontSize: 11, 
    fontWeight: "700", 
    color: "#4CAF50",
  },
  pastBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  pastText: { 
    fontSize: 11, 
    fontWeight: "700", 
    color: "#FF9800",
  },
  invitedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  invitedText: { 
    fontSize: 11, 
    fontWeight: "700", 
    color: "#2196F3",
  },
  sportBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  sportText: { 
    fontSize: 11, 
    fontWeight: "700", 
    color: "#2196F3",
    textTransform: "capitalize",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timeBadgePast: {
    backgroundColor: "#FF9800",
  },
  timeBadgeOngoing: {
    backgroundColor: "#4CAF50",
  },
  timeBadgeUpcoming: {
    backgroundColor: "#2196F3",
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "white",
  },

  cardHeader: {
    marginBottom: 12,
  },
  strutturaName: { 
    fontSize: 18, 
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  campoName: { 
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },

  cardBody: { 
    gap: 8,
    marginBottom: 12,
  },

  infoRow: { 
    flexDirection: "row", 
    gap: 8, 
    alignItems: "center",
  },
  infoText: { 
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },

  resultBox: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  winner: { 
    fontWeight: "800",
    fontSize: 13,
    flex: 1,
  },
  win: { color: "#4CAF50" },
  lose: { color: "#F44336" },
  finalScore: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  setsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  setItem: {
    flex: 1,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  setLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "600",
    marginBottom: 2,
  },
  setScore: {
    fontSize: 13,
    fontWeight: "800",
    color: "#333",
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },

  priceBox: {
    gap: 2,
  },
  priceLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
  },
  price: { 
    fontSize: 20, 
    fontWeight: "800", 
    color: "#4CAF50",
  },

  resultBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2196F3",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resultBtnText: { 
    fontWeight: "700", 
    color: "white",
    fontSize: 13,
  },

  tapHint: { 
    flexDirection: "row", 
    gap: 8, 
    alignItems: "center",
  },
  tapHintText: { 
    fontSize: 13, 
    color: "#999",
    fontWeight: "500",
  },
  ongoingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ongoingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4CAF50",
  },

  // Team styles
  teamsContainer: {
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
  },
  teamsRow: {
    flexDirection: "row",
    gap: 12,
  },
  teamSection: {
    flex: 1,
  },
  teamHeader: {
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  teamLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "white",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  teamCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
  },
  teamPlayers: {
    gap: 6,
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  playerName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarInitials: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    resizeMode: "cover",
  },
  avatarText: {
    color: "white",
    fontWeight: "800",
  },

  // ==================== CUSTOM ALERT MODAL ====================
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  customAlertModal: {
    backgroundColor: "white",
    borderRadius: 16,
    marginHorizontal: 32,
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  customAlertHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: "center",
  },
  customAlertTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
  },
  customAlertContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  customAlertMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  customAlertButtons: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  customAlertButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  customAlertButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2196F3",
  },
  customAlertButtonDestructive: {
    // Stesso stile base
  },
  customAlertButtonTextDestructive: {
    color: "#F44336",
  },
  customAlertButtonCancel: {
    // Stesso stile base
  },
  customAlertButtonTextCancel: {
    color: "#666",
    fontWeight: "500",
  },
});
