import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import API_URL from "../../../config/api";
import { ScaleInView } from "./DettaglioPrenotazione/components/AnimatedComponents";
import SportIcon from "../../../components/SportIcon";

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
    sport: {
      _id: string;
      name: string;
      code: string;
      icon?: string;
    };
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
  const { token, user } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const initialFilter = route?.params?.initialFilter || "upcoming";
  const [filter, setFilter] = useState<"all" | "upcoming" | "past" | "invites">(initialFilter);
  const fromDashboard = route?.params?.fromDashboard || false;

  // Nuovi stati per i filtri avanzati
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedStruttura, setSelectedStruttura] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  // Stati per il modal personalizzato
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState("");
  const [customAlertMessage, setCustomAlertMessage] = useState("");
  const [customAlertButtons, setCustomAlertButtons] = useState<Array<{text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive'}>>([]);

  // Stati per il modal filtro
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterModalLabel, setFilterModalLabel] = useState("");
  const [filterModalOptions, setFilterModalOptions] = useState<string[]>([]);
  const [filterModalOnSelect, setFilterModalOnSelect] = useState<((value: string | null) => void) | null>(null);

  // Funzione per resettare i filtri avanzati quando si cambia il filtro temporale
  const resetAdvancedFilters = () => {
    setSelectedCity(null);
    setSelectedStruttura(null);
    setSelectedDay(null);
    setSelectedTime(null);
    setSelectedSport(null);
  };

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
          //console.log(`🎮 Prenotazione ${i + 1}: ${b.players.length} players`, b.players);
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

  // Funzione helper per ottenere il nome dello sport
  const getSportName = (sport: { _id: string; name: string; code: string; icon?: string }): string => {
    return sport.name || sport.code || '';
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
    // Controlla se l'utente ha un invito pendente
    const hasPendingInvite = b.isInvitedPlayer && b.players?.some(p => p.user._id === user._id && p.status === "pending");
    
    if (filter === "all") {
      // "Tutte": escludi gli inviti pendenti
      return !hasPendingInvite;
    }
    if (filter === "upcoming") {
      // "Future": escludi gli inviti pendenti
      return (isUpcomingBooking(b) || isOngoingBooking(b)) && !hasPendingInvite;
    }
    if (filter === "past") return isPastBooking(b);
    if (filter === "invites") return hasPendingInvite;
    return true;
  });

  // Ordinamento: per le prossime, ordina per data/ora crescente
  // Per le passate, ordina per data/ora decrescente
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const aDate = new Date(`${a.date}T${a.startTime}:00`).getTime();
    const bDate = new Date(`${b.date}T${b.startTime}:00`).getTime();
    
    if (filter === "upcoming" || filter === "invites") {
      return aDate - bDate; // Più recenti prima
    } else if (filter === "past") {
      return bDate - aDate; // Più recenti ultime
    }
    return bDate - aDate; // Di default, più recenti prima
  });

  // Estrazione valori unici per i filtri dalle prenotazioni già filtrate per stato (future/passate/tutte)
  const availableCities = [...new Set(filteredBookings.filter(b => b.campo?.struttura?.location?.city).map(b => b.campo.struttura.location.city))].sort();
  const availableStrutture = [...new Set(filteredBookings.filter(b => b.campo?.struttura?.name).map(b => b.campo.struttura.name))].sort();
  const availableSports = [...new Set(filteredBookings.filter(b => b.campo?.sport).map(b => getSportName(b.campo.sport)))].sort();
  const availableDays = [...new Set(filteredBookings.filter(b => b.date).map(b => {
    const date = new Date(b.date);
    return date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  }))].sort();
  const availableTimes = [...new Set(filteredBookings.filter(b => b.startTime).map(b => b.startTime))].sort();

  // Applicazione filtri avanzati
  const finalFilteredBookings = sortedBookings.filter(booking => {
    if (selectedCity && booking.campo.struttura.location.city !== selectedCity) return false;
    if (selectedStruttura && booking.campo.struttura.name !== selectedStruttura) return false;
    if (selectedSport && getSportName(booking.campo.sport) !== selectedSport) return false;
    if (selectedDay) {
      const bookingDay = new Date(booking.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
      if (bookingDay !== selectedDay) return false;
    }
    if (selectedTime && booking.startTime !== selectedTime) return false;
    return true;
  });

  // Calcola i conteggi per i filtri
  const upcomingCount = bookings.filter(b => isUpcomingBooking(b) || isOngoingBooking(b)).length;
  const pastCount = bookings.filter(b => isPastBooking(b)).length;
  const allCount = bookings.length;
  const invitesCount = bookings.filter(b => b.isInvitedPlayer && b.players?.some(p => p.user._id === user._id && p.status === "pending")).length;

  /* =========================
     FILTER CHIP COMPONENT
  ========================= */
  const FilterChip = ({ 
    label, 
    value, 
    options, 
    onSelect, 
    icon 
  }: { 
    label: string; 
    value: string | null; 
    options: string[]; 
    onSelect: (value: string | null) => void; 
    icon: string; 
  }) => {
    const handlePress = () => {
      if (options.length === 0) return;
      
      setFilterModalLabel(label);
      setFilterModalOptions(options);
      setFilterModalOnSelect(() => onSelect);
      setFilterModalVisible(true);
    };

    return (
      <Pressable style={[styles.filterChip, value && styles.filterChipActive]} onPress={handlePress}>
        {label === "Sport" && value ? (
          <SportIcon sport={value} size={16} color={value ? "#2196F3" : "#666"} />
        ) : (
          <Ionicons 
            name={icon as any} 
            size={16} 
            color={value ? "#2196F3" : "#666"} 
          />
        )}
        <Text style={[styles.filterChipText, value && styles.filterChipTextActive]}>
          {value || label}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={14} 
          color={value ? "#2196F3" : "#666"} 
        />
      </Pressable>
    );
  };

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

    // Calcola il formato della partita basato su maxPlayers
    const matchFormat = item.maxPlayers && item.maxPlayers % 2 === 0 ? `${item.maxPlayers / 2}v${item.maxPlayers / 2}` : null;
    
    // Controlla se l'utente ha status pending in questa prenotazione
    const isPendingInvite = item.isInvitedPlayer && item.players?.some(p => p.user._id === user._id && p.status === "pending");

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

            {/* Formato partita */}
            {matchFormat && (
              <View style={styles.formatBadge}>
                <Ionicons name="people" size={12} color="#FF9800" />
                <Text style={styles.formatText}>{matchFormat}</Text>
              </View>
            )}

            <View style={styles.sportBadge}>
              <SportIcon sport={getSportName(item.campo.sport)} size={12} color="#2196F3" />
              <Text style={styles.sportText}>
                {(getSportName(item.campo.sport) === 'beach_volley' || getSportName(item.campo.sport) === 'beach volley')
                  ? 'Beach Volley' 
                  : getSportName(item.campo.sport).charAt(0).toUpperCase() + getSportName(item.campo.sport).slice(1)}
              </Text>
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
            text={`${item.campo.struttura.location.address}, ${item.campo.struttura.location.city}` || 'Indirizzo non disponibile'}
          />
        </View>

        {/* IN ATTESA DI CONFERMA */}
        {isPendingInvite && (
          <View style={styles.pendingInviteNotice}>
            <Ionicons name="hourglass-outline" size={16} color="#FF9800" />
            <Text style={styles.pendingInviteNoticeText}>Conferma la tua partecipazione</Text>
          </View>
        )}

        {/* TEAMS */}
        {item.players && item.players.length > 0 && (
          <View style={styles.teamsContainer}>
            <View style={styles.teamsRow}>
              <TeamSection players={item.players} team="A" />
              <TeamSection players={item.players} team="B" />
            </View>
            
            {/* PENDING PLAYERS SECTION */}
            <PendingPlayersSection players={item.players} />
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
        {fromDashboard ? (
          <View>
            <View style={styles.backHeader}>
              <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
              </Pressable>
              <Text style={styles.backHeaderTitle}>Prossime Partite</Text>
              <View style={{ width: 24 }} />
            </View>
            
            {/* CHIP FILTERS */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.chipFiltersContainer}
              contentContainerStyle={styles.chipFiltersContent}
            >
              <FilterChip
                label="Città"
                value={selectedCity}
                options={availableCities}
                onSelect={setSelectedCity}
                icon="location-outline"
              />
              <FilterChip
                label="Struttura"
                value={selectedStruttura}
                options={availableStrutture}
                onSelect={setSelectedStruttura}
                icon="business-outline"
              />
              <FilterChip
                label="Giorno"
                value={selectedDay}
                options={availableDays}
                onSelect={setSelectedDay}
                icon="calendar-outline"
              />
              <FilterChip
                label="Orario"
                value={selectedTime}
                options={availableTimes}
                onSelect={setSelectedTime}
                icon="time-outline"
              />
              <FilterChip
                label="Sport"
                value={selectedSport}
                options={availableSports}
                onSelect={setSelectedSport}
                icon="football-outline"
              />
            </ScrollView>
          </View>
        ) : (
          <View>
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.headerTitle}>Le mie prenotazioni</Text>
                {/* Chip Inviti accanto al titolo */}
                <Pressable
                  style={[
                    styles.filterBtn,
                    styles.invitesChip,
                    filter === "invites" && styles.filterBtnActive,
                  ]}
                  onPress={() => {
                    setFilter("invites");
                    resetAdvancedFilters();
                  }}
                >
                  <View style={styles.inviteIconContainer}>
                    <Ionicons 
                      name="mail-outline" 
                      size={16} 
                      color={filter === "invites" ? "white" : "#666"} 
                    />
                    {invitesCount > 0 && (
                      <View style={styles.inviteNotificationBadge}>
                        <View style={styles.inviteNotificationDot} />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.filterText,
                      filter === "invites" && styles.filterTextActive,
                    ]}
                  >
                    Inviti{" "}
                  </Text>
                  <Text
                    style={[
                      styles.filterNumber,
                      filter === "invites" && styles.filterNumberActive,
                    ]}
                  >
                    {invitesCount}
                  </Text>
                </Pressable>
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
                    onPress={() => {
                      setFilter(f.key as any);
                      resetAdvancedFilters();
                    }}
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
                      {f.label}{" "}
                    </Text>
                    <Text
                      style={[
                        styles.filterNumber,
                        filter === f.key && styles.filterNumberActive,
                      ]}
                    >
                      {f.key === "upcoming" ? upcomingCount : f.key === "past" ? pastCount : f.key === "invites" ? invitesCount : allCount}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.chipFiltersContainer}
              contentContainerStyle={styles.chipFiltersContent}
            >
              {availableCities.length > 1 && (
                <FilterChip
                  label="Città"
                  value={selectedCity}
                  options={availableCities}
                  onSelect={setSelectedCity}
                  icon="location-outline"
                />
              )}
              {availableStrutture.length > 1 && (
                <FilterChip
                  label="Struttura"
                  value={selectedStruttura}
                  options={availableStrutture}
                  onSelect={setSelectedStruttura}
                  icon="business-outline"
                />
              )}
              {availableDays.length > 1 && (
                <FilterChip
                  label="Giorno"
                  value={selectedDay}
                  options={availableDays}
                  onSelect={setSelectedDay}
                  icon="calendar-outline"
                />
              )}
              {availableTimes.length > 1 && (
                <FilterChip
                  label="Orario"
                  value={selectedTime}
                  options={availableTimes}
                  onSelect={setSelectedTime}
                  icon="time-outline"
                />
              )}
              {availableSports.length > 1 && (
                <FilterChip
                  label="Sport"
                  value={selectedSport}
                  options={availableSports}
                  onSelect={setSelectedSport}
                  icon="football-outline"
                />
              )}
            </ScrollView>
          </View>
        )}

        {/* LIST */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Caricamento...</Text>
          </View>
        ) : finalFilteredBookings.length === 0 ? (
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
            data={finalFilteredBookings}
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

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.centeredModalOverlay}>
          <ScaleInView style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Seleziona {filterModalLabel}</Text>
            </View>
            <ScrollView style={styles.filterModalContent} showsVerticalScrollIndicator={false}>
              <Pressable 
                style={({ pressed }) => [
                  styles.filterModalOption,
                  styles.filterModalOptionWithBorder,
                  pressed && { backgroundColor: "#E3F2FD" }
                ]} 
                onPress={() => {
                  filterModalOnSelect?.(null);
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.filterModalOptionText}>✨ Tutti</Text>
              </Pressable>
              {filterModalOptions.map((option, index) => (
                <Pressable 
                  key={index} 
                  style={({ pressed }) => [
                    styles.filterModalOption,
                    index < filterModalOptions.length - 1 && styles.filterModalOptionWithBorder,
                    pressed && { backgroundColor: "#E3F2FD" }
                  ]} 
                  onPress={() => {
                    filterModalOnSelect?.(option);
                    setFilterModalVisible(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {option !== "✨ Tutti" && (
                      <>
                        {filterModalLabel === "Sport" ? (
                          <SportIcon sport={option} size={16} color="#2196F3" />
                        ) : (
                          <Ionicons 
                            name={
                              filterModalLabel === "Città" ? "location-outline" :
                              filterModalLabel === "Struttura" ? "business-outline" :
                              filterModalLabel === "Giorno" ? "calendar-outline" :
                              filterModalLabel === "Orario" ? "time-outline" :
                              "help-circle-outline"
                            } 
                            size={16} 
                            color="#2196F3" 
                          />
                        )}
                      </>
                    )}
                    <Text style={styles.filterModalOptionText}>{option}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.filterModalFooter}>
              <Pressable 
                style={styles.filterModalCancel} 
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.filterModalCancelText}>Annulla</Text>
              </Pressable>
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
  // Mostra solo i giocatori confermati nel team
  const teamPlayers = players.filter(p => p.team === team && p.status === "confirmed");
  
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

const PendingPlayersSection = ({ players }: { players: Player[] }) => {
  const pendingPlayers = players.filter(p => p.status === "pending");
  
  if (pendingPlayers.length === 0) return null;
  
  return (
    <View style={styles.pendingPlayersSection}>
      <View style={styles.pendingPlayersHeader}>
        <Ionicons name="hourglass-outline" size={14} color="#FF9800" />
        <Text style={styles.pendingPlayersTitle}>In attesa di risposta ({pendingPlayers.length})</Text>
      </View>
      <View style={styles.pendingPlayersList}>
        {pendingPlayers.map((player) => (
          <View key={player.user._id} style={styles.pendingPlayerItem}>
            <PlayerAvatar player={player} size={24} />
            <Text style={styles.pendingPlayerName} numberOfLines={1}>
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

  backHeader: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  backHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
    textAlign: "center",
    flex: 1,
  },

  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 1,
    backgroundColor: "white",
    flexDirection: "column",
    alignItems: "stretch",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: "800",
    color: "#1a1a1a",
    textAlign: "center",
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
    paddingVertical: 16,
    gap: 10,
    backgroundColor: "transparent",
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
  filterNumber: { 
    fontWeight: "800", 
    color: "#2196F3",
    fontSize: 13,
  },
  filterNumberActive: { color: "white" },
  invitesChip: {
    flex: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  inviteIconContainer: {
    position: 'relative',
  },
  inviteNotificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteNotificationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F44336',
  },

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
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  pendingText: { 
    fontSize: 11, 
    fontWeight: "700", 
    color: "#FF9800",
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
  formatBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  formatText: { 
    fontSize: 11, 
    fontWeight: "700", 
    color: "#FF9800",
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
    fontSize: 15, 
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  campoName: { 
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },

  cardBody: { 
    gap: 8,
    marginBottom: 12,
  },

  pendingInviteNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#FF9800",
  },
  pendingInviteNoticeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF9800",
    flex: 1,
  },

  infoRow: { 
    flexDirection: "row", 
    gap: 8, 
    alignItems: "center",
  },
  infoText: { 
    fontSize: 13,
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

  // Pending Players Section
  pendingPlayersSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  pendingPlayersHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  pendingPlayersTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FF9800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pendingPlayersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pendingPlayerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF3E0",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  pendingPlayerName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF9800",
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

  // Chip Filters
  chipFiltersContainer: {
    maxHeight: 50,
    backgroundColor: "white",
  },
  chipFiltersContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f8f8f8",
  },
  filterChipActive: {
    borderColor: "#2196F3",
    backgroundColor: "#E3F2FD",
  },
  filterChipText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#2196F3",
    fontWeight: "600",
  },

  // Filter Modal
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
});
