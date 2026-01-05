import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../../config/api";

/* =========================
   TYPES
========================= */
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
  isMyBooking?: boolean;
  isInvitedPlayer?: boolean;
}

/* =========================
   SCREEN
========================= */
export default function LeMiePrenotazioniScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

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
      
      setBookings(data);
      setLoading(false);
    } catch {
      Alert.alert("Errore", "Impossibile caricare le prenotazioni");
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
    if (isPastBooking(booking)) return "Passata";
    if (isOngoingBooking(booking)) return "In corso";
    
    try {
      const bookingStartDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
      const now = new Date();
      const diffMs = bookingStartDateTime.getTime() - now.getTime();
      
      if (diffMs <= 0) return "Passata";
      
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
    const canInsertResult = isPast && item.status === "confirmed" && !item.hasMatch;
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
            {isCancelled ? (
              <View style={styles.cancelledBadge}>
                <Ionicons name="close-circle" size={14} color="#F44336" />
                <Text style={styles.cancelledText}>Cancellata</Text>
              </View>
            ) : (
              <View style={isPast ? styles.pastBadge : styles.confirmedBadge}>
                <Ionicons 
                  name={isPast ? "time-outline" : "checkmark-circle"} 
                  size={14} 
                  color={isPast ? "#FF9800" : "#4CAF50"} 
                />
                <Text style={isPast ? styles.pastText : styles.confirmedText}>
                  {isPast ? "Passata" : "Confermata"}
                </Text>
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
            <Text style={styles.priceLabel}>Totale</Text>
            <Text style={styles.price}>€{item.price}</Text>
          </View>

          {canInsertResult ? (
            <Pressable
              style={styles.resultBtn}
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate("InserisciRisultato", {
                  bookingId: item._id,
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
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Le mie prenotazioni</Text>
          <Text style={styles.headerSubtitle}>
            {filter === "upcoming" && `${sortedBookings.length} ${sortedBookings.length === 1 ? "prenotazione futura" : "prenotazioni future"}`}
            {filter === "past" && `${sortedBookings.length} ${sortedBookings.length === 1 ? "prenotazione passata" : "prenotazioni passate"}`}
            {filter === "all" && `${sortedBookings.length} ${sortedBookings.length === 1 ? "prenotazione totale" : "prenotazioni totali"}`}
          </Text>
        </View>
        <Pressable onPress={loadBookings} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color="#2196F3" />
        </Pressable>
      </View>

      {/* FILTERS */}
      <View style={styles.filters}>
        {[
          { key: "upcoming", label: "Future", icon: "arrow-forward-circle-outline" },
          { key: "past", label: "Passate", icon: "time-outline" },
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
  );
}

/* =========================
   SMALL COMPONENT
========================= */
const InfoRow = ({ icon, text }: { icon: any; text: string }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={16} color="#666" />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

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
    paddingBottom: 32,
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
  },
  win: { color: "#4CAF50" },
  lose: { color: "#F44336" },
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
});