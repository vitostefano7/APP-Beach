import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../../config/api";

interface Player {
  user: {
    _id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  status: "pending" | "confirmed";
  team?: "A" | "B";
  joinedAt: string;
}

interface Set {
  teamA: number;
  teamB: number;
}

interface MatchDetails {
  _id: string;
  booking?: {
    _id: string;
    campo?: {
      name: string;
      sport: string;
      struttura?: {
        name: string;
        location?: {
          city: string;
        };
      };
    };
    date: string;
    startTime: string;
    endTime: string;
  };
  createdBy: {
    _id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  players: Player[];
  maxPlayers: number;
  isPublic: boolean;
  status: "draft" | "open" | "full" | "completed" | "cancelled";
  winner?: "A" | "B";
  score?: {
    sets: Set[];
  };
  playedAt?: string;
  createdAt: string;
}

export default function DettaglioMatchScreen() {
  const { token, user } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { matchId } = route.params;

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);

  useEffect(() => {
    if (!matchId || matchId === 'undefined') {
      setError('ID match non valido');
      setLoading(false);
      Alert.alert('Errore', 'ID match non valido', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Caricamento match ID:', matchId);
      
      const res = await fetch(`${API_URL}/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Errore ${res.status}`);
      }

      const data = await res.json();
      
      // DEBUG: Log completo della risposta
      console.log('📥 Risposta completa:', JSON.stringify(data, null, 2));
      
      // Valida i dati minimi richiesti
      if (!data._id) {
        throw new Error('Dati match incompleti');
      }

      // Assicurati che i campi obbligatori esistano
      const validatedMatch: MatchDetails = {
        _id: data._id,
        createdBy: data.createdBy || {
          _id: data.createdBy?._id || 'unknown',
          name: data.createdBy?.name || 'Creatore sconosciuto',
          username: data.createdBy?.username || 'unknown',
          avatarUrl: data.createdBy?.avatarUrl,
        },
        players: data.players || [],
        maxPlayers: data.maxPlayers || 4,
        isPublic: data.isPublic !== undefined ? data.isPublic : false,
        status: data.status || 'draft',
        winner: data.winner,
        score: data.score,
        playedAt: data.playedAt,
        createdAt: data.createdAt || new Date().toISOString(),
      };

      // Aggiungi booking se presente
      if (data.booking) {
        validatedMatch.booking = {
          _id: data.booking._id,
          date: data.booking.date,
          startTime: data.booking.startTime,
          endTime: data.booking.endTime,
          campo: data.booking.campo ? {
            name: data.booking.campo.name,
            sport: data.booking.campo.sport,
            struttura: data.booking.campo.struttura ? {
              name: data.booking.campo.struttura.name,
              location: data.booking.campo.struttura.location,
            } : undefined,
          } : undefined,
        };
      }

      console.log('✅ Match validato:', {
        id: validatedMatch._id,
        status: validatedMatch.status,
        players: validatedMatch.players.length,
        hasBooking: !!validatedMatch.booking,
        hasCreatedBy: !!validatedMatch.createdBy,
      });
      
      setMatch(validatedMatch);
    } catch (error: any) {
      console.error('Errore nel caricamento:', error);
      setError(error.message);
      Alert.alert('Errore', error.message || 'Impossibile caricare il match', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Data non valida';
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  // Funzioni helper per valori safe
  const getField = (obj: any, path: string, defaultValue: any = '') => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) || defaultValue;
  };

  const renderMatchSection = () => {
    if (!match) return null;

    const isCreator = match.createdBy?._id === user?.id;
    const myPlayer = match.players?.find((p) => p.user?._id === user?.id);
    const isPendingInvite = myPlayer?.status === "pending";
    const isConfirmedPlayer = myPlayer?.status === "confirmed";
    const canInvite = isCreator && match?.status !== "completed" && match?.status !== "cancelled";
    const confirmedPlayers = match.players?.filter(p => p.status === "confirmed").length || 0;
    
    return (
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons name="trophy" size={32} color="#FF9800" />
          <View style={[
            styles.statusBadge,
            match.status === "completed" && styles.statusCompleted,
            match.status === "open" && styles.statusOpen,
            match.status === "full" && styles.statusFull,
            match.status === "draft" && styles.statusDraft,
            match.status === "cancelled" && styles.statusCancelled,
          ]}>
            <Text style={styles.statusText}>
              {match.status === "completed" ? "Completato" :
               match.status === "full" ? "Completo" :
               match.status === "open" ? "Aperto" :
               match.status === "draft" ? "Da configurare" :
               match.status === "cancelled" ? "Cancellato" : match.status}
            </Text>
          </View>
        </View>

        <View style={styles.statusInfo}>
          <View style={styles.statusInfoItem}>
            <Ionicons name="people" size={20} color="#666" />
            <Text style={styles.statusInfoText}>
              {confirmedPlayers} / {match.maxPlayers} giocatori
            </Text>
          </View>
          <View style={styles.statusInfoItem}>
            <Ionicons name={match.isPublic ? "globe" : "lock-closed"} size={20} color="#666" />
            <Text style={styles.statusInfoText}>
              {match.isPublic ? "Match pubblico" : "Match privato"}
            </Text>
          </View>
          {match.booking && (
            <View style={styles.statusInfoItem}>
              <Ionicons name="calendar" size={20} color="#666" />
              <Text style={styles.statusInfoText}>
                {formatDate(match.booking.date)} • {formatTime(match.booking.startTime)}
              </Text>
            </View>
          )}
        </View>

        {/* Creatore del match */}
        <View style={styles.creatorCard}>
          <Ionicons name="person-circle" size={24} color="#666" />
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorLabel}>Creato da</Text>
            <Text style={styles.creatorName}>
              {getField(match, 'createdBy.name', 'Utente sconosciuto')}
            </Text>
          </View>
        </View>

        {/* Info Prenotazione */}
        {match.booking && (
          <View style={styles.bookingCard}>
            <Text style={styles.bookingTitle}>Info Prenotazione</Text>
            <View style={styles.bookingInfo}>
              {match.booking.campo?.struttura?.name && (
                <View style={styles.bookingRow}>
                  <Ionicons name="business" size={18} color="#666" />
                  <Text style={styles.bookingText}>
                    {match.booking.campo.struttura.name}
                  </Text>
                </View>
              )}
              {match.booking.campo?.name && (
                <View style={styles.bookingRow}>
                  <Ionicons name="tennisball" size={18} color="#666" />
                  <Text style={styles.bookingText}>
                    {match.booking.campo.name}
                    {match.booking.campo.sport && ` • ${match.booking.campo.sport}`}
                  </Text>
                </View>
              )}
              <View style={styles.bookingRow}>
                <Ionicons name="time" size={18} color="#666" />
                <Text style={styles.bookingText}>
                  {formatTime(match.booking.startTime)} - {formatTime(match.booking.endTime)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Azioni rapide */}
        <View style={styles.quickActions}>
          {canInvite && (
            <Pressable 
              style={styles.inviteButton} 
              onPress={() => setInviteModalVisible(true)}
            >
              <Ionicons name="person-add" size={20} color="#2196F3" />
              <Text style={styles.inviteButtonText}>Invita Giocatori</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const renderPlayersSection = () => {
    if (!match) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Giocatori ({match.players.length})</Text>
        </View>

        {match.players.length === 0 ? (
          <View style={styles.emptyPlayers}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyPlayersText}>Nessun giocatore ancora</Text>
            <Text style={styles.emptyPlayersSubtext}>
              Invita i primi giocatori al match
            </Text>
          </View>
        ) : (
          <View style={styles.playersList}>
            {match.players.map((player, index) => (
              <View key={index} style={styles.playerCard}>
                <View style={styles.playerLeft}>
                  {player.user?.avatarUrl ? (
                    <Image
                      source={{ uri: `${API_URL}${player.user.avatarUrl}` }}
                      style={styles.playerAvatar}
                    />
                  ) : (
                    <View style={styles.playerAvatarPlaceholder}>
                      <Ionicons name="person" size={20} color="#999" />
                    </View>
                  )}
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>
                      {getField(player, 'user.name', 'Giocatore')}
                    </Text>
                    <Text style={styles.playerUsername}>
                      @{getField(player, 'user.username', 'unknown')}
                    </Text>
                  </View>
                </View>

                <View style={styles.playerRight}>
                  <View style={[
                    styles.playerStatusBadge,
                    player.status === "confirmed" && styles.playerStatusConfirmed,
                    player.status === "pending" && styles.playerStatusPending,
                  ]}>
                    <Text style={styles.playerStatusText}>
                      {player.status === "confirmed" ? "Confermato" : "In attesa"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Caricamento match...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>Errore</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable 
            style={styles.retryButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Torna indietro</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!match) return null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Dettaglio Match</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Match Info */}
        {renderMatchSection()}
        
        {/* Players */}
        {renderPlayersSection()}
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    padding: 16,
  },

  // Status Card
  statusCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  statusCompleted: { backgroundColor: "#E8F5E9" },
  statusOpen: { backgroundColor: "#E3F2FD" },
  statusFull: { backgroundColor: "#FFF3E0" },
  statusDraft: { backgroundColor: "#FFF3E0" },
  statusCancelled: { backgroundColor: "#FFEBEE" },
  statusText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#666",
  },
  statusInfo: {
    gap: 12,
    marginBottom: 16,
  },
  statusInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusInfoText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  // Creator Card
  creatorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    marginBottom: 16,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  creatorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },

  // Booking Card
  bookingCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    marginBottom: 12,
  },
  bookingInfo: {
    gap: 10,
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bookingText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },

  // Quick Actions
  quickActions: {
    marginTop: 8,
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#2196F3",
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },

  // Card
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
  },

  // Empty Players
  emptyPlayers: {
    alignItems: "center",
    padding: 24,
  },
  emptyPlayersText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    marginTop: 12,
    marginBottom: 8,
  },
  emptyPlayersSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },

  // Players List
  playersList: {
    gap: 10,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
  },
  playerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  playerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  playerUsername: {
    fontSize: 13,
    color: "#666",
  },
  playerRight: {
    alignItems: "flex-end",
  },
  playerStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#F5F5F5",
  },
  playerStatusConfirmed: {
    backgroundColor: "#E8F5E9",
  },
  playerStatusPending: {
    backgroundColor: "#FFF3E0",
  },
  playerStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
  },
});