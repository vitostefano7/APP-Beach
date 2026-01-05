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
  if (!booking) return null;
  
  if (!booking.hasMatch || !booking.match) {
    if (booking.status === 'confirmed') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Match</Text>
          <View style={styles.noMatchCard}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.noMatchText}>Nessun match associato</Text>
            <Text style={styles.noMatchSubtext}>
              Il match non è stato creato o c'è un errore
            </Text>
          </View>
        </View>
      );
    }
    return null;
  }

  const match = booking.match;
  
  // DEBUG
  console.log("=== DEBUG MATCH ===");
  console.log("Match status:", match.status);
  console.log("Match completed?", match.status === "completed");
  console.log("Match has score?", match.score);
  console.log("Match score sets:", match.score?.sets);
  console.log("Confirmed players:", confirmedPlayers);
  console.log("Is creator?", isCreator);
  console.log("Is confirmed player?", isConfirmedPlayer);
  console.log("===================");

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Match</Text>
        <View style={styles.matchHeaderActions}>
          {canInvite && (
            <Pressable 
              style={styles.inviteButton} 
              onPress={() => {
                setInviteToTeam(null);
                setInviteToSlot(null);
                setInviteModalVisible(true);
              }}
            >
              <Ionicons name="person-add" size={18} color="white" />
              <Text style={styles.inviteButtonText}>Invita</Text>
            </Pressable>
          )}
          
          {canJoinPublic && (
            <Pressable style={styles.joinButton} onPress={joinPublicMatch}>
              <Ionicons name="person-add" size={18} color="white" />
              <Text style={styles.joinButtonText}>Unisciti</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.matchStatusCard}>
        <View style={styles.matchStatusRow}>
          <View style={[
            styles.matchStatusBadge,
            match.status === "completed" && styles.matchStatusCompleted,
            match.status === "open" && styles.matchStatusOpen,
            match.status === "full" && styles.matchStatusFull,
            match.status === "draft" && styles.matchStatusDraft,
            match.status === "cancelled" && styles.matchStatusCancelled,
          ]}>
            <Text style={styles.matchStatusText}>
              {match.status === "completed" ? "Completato" :
               match.status === "full" ? "Completo" :
               match.status === "open" ? "Aperto" :
               match.status === "draft" ? "Da configurare" :
               match.status === "cancelled" ? "Cancellato" : match.status}
            </Text>
          </View>

          <View style={styles.matchInfoRow}>
            <View style={styles.matchInfoItem}>
              <Ionicons name="people" size={16} color="#666" />
              <Text style={styles.matchInfoText}>
                {confirmedPlayers}/{booking.match.maxPlayers}
              </Text>
            </View>
            {pendingPlayers > 0 && (
              <View style={[styles.matchInfoItem, styles.pendingBadge]}>
                <Ionicons name="time" size={16} color="#FF9800" />
                <Text style={[styles.matchInfoText, { color: '#FF9800' }]}>
                  {pendingPlayers} in attesa
                </Text>
              </View>
            )}
            <View style={styles.matchInfoItem}>
              <Ionicons 
                name={match.isPublic ? "globe" : "lock-closed"} 
                size={16} 
                color="#666" 
              />
              <Text style={styles.matchInfoText}>
                {match.isPublic ? "Pubblico" : "Privato"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* === SEZIONE RISULTATI PER MATCH COMPLETATI === */}
      {match.status === "completed" && match.score && (
        <ScoreDisplay
          winner={match.winner!}
          sets={match.score.sets}
          isCreator={isCreator}
          isPlayer={isConfirmedPlayer || isDeclinedPlayer}
          onEdit={() => setScoreModalVisible(true)}
          matchStatus={match.status}
        />
      )}

      {/* === PULSANTI RISULTATO === */}
      <View style={styles.scoreActionsContainer}>
        {/* 1. PULSANTE PER INSERIRE/MODIFICARE RISULTATO (MATCH IN CORSO) */}
        {(isCreator || isConfirmedPlayer) && 
         match.status !== "completed" &&
         match.status !== "cancelled" && 
         confirmedPlayers >= 2 && (
          <Pressable
            style={styles.submitScoreButton}
            onPress={() => setScoreModalVisible(true)}
          >
            <Ionicons name="trophy" size={20} color="#FFF" />
            <Text style={styles.submitScoreButtonText}>
              {match.score ? "Modifica Risultato" : "Inserisci Risultato"}
            </Text>
          </Pressable>
        )}

        {/* 2. PULSANTE PER VISUALIZZARE RISULTATO (MATCH COMPLETATI) */}
        {match.status === "completed" && match.score && (
          <Pressable
            style={[styles.submitScoreButton, styles.viewScoreButton]}
            onPress={() => setScoreModalVisible(true)}
          >
            <Ionicons name="eye" size={20} color="#FFF" />
            <Text style={styles.submitScoreButtonText}>Visualizza Risultato</Text>
          </Pressable>
        )}

        {/* 3. PULSANTE VISUALIZZA PER GIOCATORI IN MATCH COMPLETATI (senza score) */}
        {match.status === "completed" && !match.score && (isCreator || isConfirmedPlayer || isDeclinedPlayer) && (
          <Pressable
            style={[styles.submitScoreButton, { backgroundColor: '#9C27B0' }]}
            onPress={() => setScoreModalVisible(true)}
          >
            <Ionicons name="add-circle" size={20} color="#FFF" />
            <Text style={styles.submitScoreButtonText}>Aggiungi Risultato</Text>
          </Pressable>
        )}
      </View>

      {/* === CARD PER INVITO PENDENTE === */}
      {renderPendingInviteCard()}

      {/* === CARD PER INVITO RIFIUTATO === */}
      {myPlayer?.status === "declined" && (
        <View style={styles.declinedCard}>
          <View style={styles.declinedHeader}>
            <Ionicons name="close-circle" size={24} color="#F44336" />
            <Text style={styles.declinedTitle}>Invito rifiutato</Text>
          </View>
          <Text style={styles.declinedText}>
            Hai rifiutato l'invito. Vuoi cambiare idea?
          </Text>
          <Pressable
            style={styles.changeResponseButton}
            onPress={() => handleChangeInviteResponse()}
            disabled={acceptingInvite}
          >
            {acceptingInvite ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="refresh" size={20} color="#FFF" />
                <Text style={styles.changeResponseButtonText}>Accetta invito</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* === SEZIONE TEAM PER MATCH MULTIPLAYER === */}
      {match.maxPlayers > 2 ? (
        <View style={styles.teamsContainer}>
          {renderTeamSectionWithSlots("A")}
          {renderTeamSectionWithSlots("B")}
        </View>
      ) : (
        <View style={styles.playersSection}>
          <Text style={styles.playersSectionTitle}>Giocatori</Text>
          <View style={styles.playersGrid}>
            {match.players?.filter(p => p.status === "confirmed").map((player: any, index: number) => {
              const isCurrentUser = player.user?._id === user?.id;
              
              return (
                <PlayerCardWithTeam
                  key={index}
                  player={player}
                  isCreator={isCreator}
                  currentUserId={user?.id}
                  onRemove={() => player.user?._id && handleRemovePlayer(player.user._id)}
                  onChangeTeam={(newTeam) => player.user?._id && handleAssignTeam(player.user._id, newTeam)}
                  onLeave={isCurrentUser && player.status === "confirmed" ? handleLeaveMatch : undefined}
                  currentTeam={null}
                  matchStatus={match.status}
                />
              );
            })}
          </View>
        </View>
      )}

      {/* === GIOCATORI NON ASSEGNATI === */}
      {match.maxPlayers > 2 && unassignedPlayers > 0 && (
        <View style={styles.unassignedSection}>
          <Text style={styles.unassignedTitle}>Giocatori da assegnare ({unassignedPlayers})</Text>
          <Text style={styles.unassignedSubtitle}>
            Trascina questi giocatori nei team o clicca su "Bilancia Team" per assegnarli automaticamente
          </Text>
          <View style={styles.playersGrid}>
            {match.players?.filter(p => !p.team && p.status === "confirmed").map((player: any, index: number) => {
              const isCurrentUser = player.user?._id === user?.id;
              
              return (
                <PlayerCardWithTeam
                  key={index}
                  player={player}
                  isCreator={isCreator}
                  currentUserId={user?.id}
                  onRemove={() => player.user?._id && handleRemovePlayer(player.user._id)}
                  onChangeTeam={(newTeam) => player.user?._id && handleAssignTeam(player.user._id, newTeam)}
                  onLeave={isCurrentUser && player.status === "confirmed" ? handleLeaveMatch : undefined}
                  currentTeam={null}
                  matchStatus={match.status}
                />
              );
            })}
          </View>
        </View>
      )}

      {/* === INVITI IN ATTESA === */}
      {pendingPlayers > 0 && (
        <View style={styles.pendingSection}>
          <Text style={styles.pendingTitle}>Inviti in attesa ({pendingPlayers})</Text>
          <View style={styles.playersGrid}>
            {match.players?.filter(p => p.status === "pending").map((player: any, index: number) => (
              <PlayerCardWithTeam
                key={index}
                player={player}
                isCreator={isCreator}
                currentUserId={user?.id}
                onRemove={() => player.user?._id && handleRemovePlayer(player.user._id)}
                onChangeTeam={() => {}}
                currentTeam={null}
                isPending
                matchStatus={match.status}
              />
            ))}
          </View>
        </View>
      )}

      {/* === PULSANTE BILANCIA TEAM === */}
      {isCreator && unassignedPlayers > 0 && match.status !== "completed" && (
        <Pressable
          style={styles.balanceTeamsButton}
          onPress={autoAssignTeams}
        >
          <Ionicons name="shuffle" size={20} color="#FFF" />
          <Text style={styles.balanceTeamsButtonText}>Bilancia Team</Text>
        </Pressable>
      )}
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