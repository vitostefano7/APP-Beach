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
  status: "draft" | "open" | "full" | "completed" | "cancelled";
  players: Player[];
  maxPlayers: number;
  isPublic: boolean;
  winner?: "A" | "B";
  score?: {
    sets: Set[];
  };
  playedAt?: string;
  createdAt: string;
  createdBy: {
    _id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
}

interface BookingDetails {
  _id: string;
  campo: {
    name: string;
    sport: string;
    struttura: {
      name: string;
      location: {
        city: string;
        address?: string;
      };
    };
  };
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: "confirmed" | "cancelled";
  createdAt: string;
  hasMatch?: boolean;
  matchId?: string;
  match?: MatchDetails;
}

// 🆕 Funzione helper per assegnare team
const assignPlayerToTeam = async (
  matchId: string,
  userId: string,
  team: "A" | "B" | null,
  token: string
) => {
  try {
    const res = await fetch(`${API_URL}/matches/${matchId}/players/${userId}/team`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ team }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Errore assegnazione team");
    }

    return true;
  } catch (error: any) {
    throw error;
  }
};

export default function DettaglioPrenotazioneScreen() {
  const { token, user } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { bookingId } = route.params;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);

  useEffect(() => {
    if (!bookingId || bookingId === 'undefined') {
      setError('ID prenotazione non valido');
      setLoading(false);
      Alert.alert('Errore', 'ID prenotazione non valido', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Caricamento prenotazione ID:', bookingId);
      
      const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Errore ${res.status}`);
      }

      const data = await res.json();
      console.log('✅ Prenotazione caricata:', {
        hasMatch: data.hasMatch,
        matchId: data.matchId,
        matchStatus: data.match?.status
      });
      
      setBooking(data);
    } catch (error: any) {
      console.error('Errore nel caricamento:', error);
      setError(error.message);
      Alert.alert('Errore', error.message || 'Impossibile caricare la prenotazione', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Handler per assegnare giocatore a team
  const handleAssignTeam = async (playerId: string, team: "A" | "B" | null) => {
    if (!booking?.matchId) return;

    try {
      await assignPlayerToTeam(booking.matchId, playerId, team, token!);
      loadBooking(); // Ricarica
    } catch (error: any) {
      Alert.alert("Errore", error.message || "Impossibile assegnare il giocatore");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string, timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date(dateStr + 'T12:00:00');
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleString('it-IT', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2 || !booking?.matchId) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const users = await res.json();
        const alreadyInMatch = booking.match?.players?.map((p: any) => p.user._id) || [];
        const filtered = users.filter((u: any) => !alreadyInMatch.includes(u._id));
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error("Errore ricerca:", error);
    } finally {
      setSearching(false);
    }
  };

  const invitePlayer = async (username: string) => {
    if (!booking?.matchId) return;

    try {
      const res = await fetch(`${API_URL}/matches/${booking.matchId}/invite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore invito");
      }

      Alert.alert("✅ Invito inviato!", "L'utente è stato invitato al match");
      setInviteModalVisible(false);
      setSearchQuery("");
      setSearchResults([]);
      loadBooking();
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    }
  };

  const respondToInvite = async (response: "accept" | "decline", team?: "A" | "B") => {
    if (!booking?.matchId) return;

    try {
      const body: any = { action: response };
      if (team) body.team = team;
      
      const res = await fetch(`${API_URL}/matches/${booking.matchId}/respond`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      Alert.alert(
        response === "accept" ? "✅ Invito accettato!" : "❌ Invito rifiutato",
        response === "accept" ? "Ora fai parte del match" : "Hai rifiutato l'invito"
      );
      loadBooking();
    } catch {
      Alert.alert("Errore", "Impossibile rispondere all'invito");
    }
  };

  const removePlayer = async (playerId: string) => {
    if (!booking?.matchId) return;

    Alert.alert(
      "Rimuovi giocatore",
      "Sei sicuro di voler rimuovere questo giocatore dal match?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Rimuovi",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/matches/${booking.matchId}/players/${playerId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              if (!res.ok) throw new Error();

              Alert.alert("✅ Giocatore rimosso");
              loadBooking();
            } catch {
              Alert.alert("Errore", "Impossibile rimuovere il giocatore");
            }
          },
        },
      ]
    );
  };

  const submitResult = () => {
    if (!booking?.matchId) return;
    
    navigation.navigate('InserisciRisultato', { 
      matchId: booking.matchId,
      maxPlayers: booking.match?.maxPlayers || 4,
      players: booking.match?.players || []
    });
  };

  const joinPublicMatch = async () => {
    if (!booking?.matchId || !booking.match?.isPublic) return;

    Alert.alert(
      "Unisciti al match",
      "Scegli la squadra:",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Team A",
          onPress: () => joinMatch("A"),
        },
        {
          text: "Team B",
          onPress: () => joinMatch("B"),
        },
      ]
    );
  };

  const joinMatch = async (team: "A" | "B") => {
    if (!booking?.matchId) return;

    try {
      const res = await fetch(`${API_URL}/matches/${booking.matchId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ team }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore nell'unione al match");
      }

      Alert.alert("✅ Partecipazione confermata!", "Sei stato aggiunto al match");
      loadBooking();
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    }
  };

  const calculateDuration = () => {
    if (!booking) return "1h";
    const [startH, startM] = booking.startTime.split(':').map(Number);
    const [endH, endM] = booking.endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    return durationMinutes === 90 ? "1h 30m" : "1h";
  };

  const isCreator = booking?.match?.createdBy._id === user?.id;
  const myPlayer = booking?.match?.players.find((p) => p.user._id === user?.id);
  const isPendingInvite = myPlayer?.status === "pending";
  const isConfirmedPlayer = myPlayer?.status === "confirmed";
  const canInvite = isCreator && booking?.match?.status !== "completed" && booking?.match?.status !== "cancelled";
  const canManage = isCreator && booking?.match?.status !== "completed" && booking?.match?.status !== "cancelled";
  const canJoinPublic = !isCreator && !myPlayer && booking?.match?.isPublic && booking?.match?.status === "open";
  const canSubmitResult = (isCreator || isConfirmedPlayer) && booking?.match?.status === "full";
  
  const confirmedPlayers = booking?.match?.players.filter(p => p.status === "confirmed").length || 0;
  const pendingPlayers = booking?.match?.players.filter(p => p.status === "pending").length || 0;
  const teamAPlayers = booking?.match?.players.filter(p => p.team === "A" && p.status === "confirmed").length || 0;
  const teamBPlayers = booking?.match?.players.filter(p => p.team === "B" && p.status === "confirmed").length || 0;
  const unassignedPlayers = booking?.match?.players.filter(p => !p.team && p.status === "confirmed").length || 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Caricamento...</Text>
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

  if (!booking) return null;

  const renderTeamSection = (team: "A" | "B", players: Player[]) => {
    return (
      <View style={styles.teamSection}>
        <View style={[styles.teamHeader, team === "A" ? styles.teamAHeader : styles.teamBHeader]}>
          <Ionicons name="shield" size={20} color={team === "A" ? "#2196F3" : "#F44336"} />
          <Text style={styles.teamTitle}>Team {team}</Text>
          <Text style={styles.teamCount}>
            {players.length} {players.length === 1 ? 'giocatore' : 'giocatori'}
          </Text>
        </View>
        
        {players.length > 0 ? (
          <View style={styles.playersGrid}>
            {players.map((player, index) => (
              <PlayerCardWithTeam
                key={index}
                player={player}
                isCreator={isCreator}
                currentUserId={user?.id}
                onRemove={() => removePlayer(player.user._id)}
                onChangeTeam={(newTeam) => handleAssignTeam(player.user._id, newTeam)}
                currentTeam={team}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyTeamText}>Nessun giocatore</Text>
        )}
      </View>
    );
  };
  // Continua dalla PARTE 1...

  const renderMatchSection = () => {
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
    const teamAPlayersList = match.players.filter(p => p.team === "A" && p.status === "confirmed");
    const teamBPlayersList = match.players.filter(p => p.team === "B" && p.status === "confirmed");
    const pendingPlayersList = match.players.filter(p => p.status === "pending");
    const unassignedPlayersList = match.players.filter(p => !p.team && p.status === "confirmed");

    return (
      <View style={styles.card}>
        {/* Match Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Match</Text>
          <View style={styles.matchHeaderActions}>
            {canInvite && (
              <Pressable 
                style={styles.inviteButton} 
                onPress={() => setInviteModalVisible(true)}
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

        {/* Match Status */}
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
            
            <View style={styles.matchStats}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={16} color="#666" />
                <Text style={styles.statText}>
                  {confirmedPlayers} / {match.maxPlayers}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name={match.isPublic ? "globe" : "lock-closed"} size={16} color="#666" />
                <Text style={styles.statText}>
                  {match.isPublic ? "Pubblico" : "Privato"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.creatorInfo}>
            <Ionicons name="person-circle" size={16} color="#666" />
            <Text style={styles.creatorText}>
              Creato da {match.createdBy?.name || 'Utente sconosciuto'}
            </Text>
          </View>
        </View>

        {/* Invito pendente */}
        {isPendingInvite && (
          <View style={styles.pendingInviteCard}>
            <View style={styles.pendingInviteHeader}>
              <Ionicons name="mail" size={20} color="#2196F3" />
              <Text style={styles.pendingInviteTitle}>Sei stato invitato!</Text>
            </View>
            <Text style={styles.pendingInviteText}>
              {match.createdBy?.name || 'Un utente'} ti ha invitato a partecipare
            </Text>
            <View style={styles.pendingInviteActions}>
              <Pressable 
                style={styles.pendingDeclineButton} 
                onPress={() => respondToInvite("decline")}
              >
                <Text style={styles.pendingDeclineButtonText}>Rifiuta</Text>
              </Pressable>
              <Pressable 
                style={styles.pendingAcceptButton} 
                onPress={() => respondToInvite("accept")}
              >
                <Ionicons name="checkmark" size={18} color="white" />
                <Text style={styles.pendingAcceptButtonText}>Accetta</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Team Sections */}
        {match.maxPlayers > 2 ? (
          <>
            {renderTeamSection("A", teamAPlayersList)}
            {renderTeamSection("B", teamBPlayersList)}
          </>
        ) : (
          <View style={styles.teamSection}>
            <View style={styles.teamHeader}>
              <Ionicons name="people" size={20} color="#666" />
              <Text style={styles.teamTitle}>Giocatori</Text>
              <Text style={styles.teamCount}>
                {unassignedPlayersList.length} giocatori
              </Text>
            </View>
            <View style={styles.playersGrid}>
              {unassignedPlayersList.map((player, index) => (
                <PlayerCardWithTeam
                  key={index}
                  player={player}
                  isCreator={isCreator}
                  currentUserId={user?.id}
                  onRemove={() => removePlayer(player.user._id)}
                  onChangeTeam={(newTeam) => handleAssignTeam(player.user._id, newTeam)}
                  currentTeam={null}
                />
              ))}
            </View>
          </View>
        )}

        {/* Giocatori non assegnati */}
        {match.maxPlayers > 2 && unassignedPlayersList.length > 0 && (
          <View style={styles.unassignedSection}>
            <Text style={styles.unassignedTitle}>Da assegnare</Text>
            <View style={styles.playersGrid}>
              {unassignedPlayersList.map((player, index) => (
                <PlayerCardWithTeam
                  key={index}
                  player={player}
                  isCreator={isCreator}
                  currentUserId={user?.id}
                  onRemove={() => removePlayer(player.user._id)}
                  onChangeTeam={(newTeam) => handleAssignTeam(player.user._id, newTeam)}
                  currentTeam={null}
                />
              ))}
            </View>
          </View>
        )}

        {/* Inviti in attesa */}
        {pendingPlayersList.length > 0 && (
          <View style={styles.pendingSection}>
            <Text style={styles.pendingTitle}>Inviti in attesa ({pendingPlayersList.length})</Text>
            <View style={styles.playersGrid}>
              {pendingPlayersList.map((player, index) => (
                <PlayerCardWithTeam
                  key={index}
                  player={player}
                  isCreator={isCreator}
                  currentUserId={user?.id}
                  onRemove={() => removePlayer(player.user._id)}
                  onChangeTeam={() => {}}
                  currentTeam={null}
                  isPending
                />
              ))}
            </View>
          </View>
        )}

        {/* Risultato */}
        {match.status === "completed" && match.score && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Risultato Finale</Text>
            
            {match.winner && (
              <View style={styles.winnerCard}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
                <Text style={styles.winnerText}>Team {match.winner} vince!</Text>
              </View>
            )}
            
            <View style={styles.setsContainer}>
              {match.score.sets.map((set, index) => (
                <View key={index} style={styles.setCard}>
                  <Text style={styles.setLabel}>Set {index + 1}</Text>
                  <View style={styles.setScore}>
                    <View style={[styles.scoreTeam, styles.scoreTeamA]}>
                      <Text style={styles.scoreValue}>{set.teamA}</Text>
                    </View>
                    <Text style={styles.scoreSeparator}>-</Text>
                    <View style={[styles.scoreTeam, styles.scoreTeamB]}>
                      <Text style={styles.scoreValue}>{set.teamB}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Azioni */}
        <View style={styles.matchActions}>
          {canSubmitResult && (
            <Pressable 
              style={styles.resultButton} 
              onPress={submitResult}
              disabled={submittingResult}
            >
              {submittingResult ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="clipboard" size={18} color="white" />
                  <Text style={styles.resultButtonText}>Inserisci Risultato</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Dettaglio Prenotazione</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={booking.status === 'confirmed' ? 'checkmark-circle' : 'close-circle'} 
              size={32} 
              color={booking.status === 'confirmed' ? '#4CAF50' : '#F44336'} 
            />
            <View style={[
              styles.statusBadge,
              booking.status === 'confirmed' ? styles.statusConfirmed : styles.statusCancelled
            ]}>
              <Text style={styles.statusText}>
                {booking.status === 'confirmed' ? 'CONFERMATA' : 'CANCELLATA'}
              </Text>
            </View>
          </View>

          <View style={styles.statusInfo}>
            <View style={styles.statusInfoItem}>
              <Ionicons name="calendar" size={20} color="#666" />
              <Text style={styles.statusInfoText}>
                {formatDate(booking.date)}
              </Text>
            </View>
            <View style={styles.statusInfoItem}>
              <Ionicons name="time" size={20} color="#666" />
              <Text style={styles.statusInfoText}>
                {booking.startTime} - {booking.endTime} ({calculateDuration()})
              </Text>
            </View>
          </View>
        </View>

        {/* Info Struttura */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informazioni Campo</Text>
          
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="business" size={24} color="#2196F3" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Struttura</Text>
                <Text style={styles.infoValue}>{booking.campo.struttura.name}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location" size={24} color="#2196F3" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Località</Text>
                <Text style={styles.infoValue}>{booking.campo.struttura.location.city}</Text>
                {booking.campo.struttura.location.address && (
                  <Text style={styles.infoSubValue}>{booking.campo.struttura.location.address}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons 
                name={
                  booking.campo.sport === 'calcio' ? 'football' :
                  booking.campo.sport === 'tennis' ? 'tennisball' :
                  booking.campo.sport === 'basket' ? 'basketball' : 'fitness'
                } 
                size={24} 
                color="#2196F3" 
              />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Sport / Campo</Text>
                <Text style={styles.infoValue}>
                  {booking.campo.sport.charAt(0).toUpperCase() + booking.campo.sport.slice(1)} - {booking.campo.name}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info Prenotazione */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dettagli Prenotazione</Text>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Data e Ora</Text>
              <Text style={styles.detailValue}>
                {formatDateTime(booking.date, booking.startTime)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Durata</Text>
              <Text style={styles.detailValue}>
                {calculateDuration()}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Prezzo</Text>
              <Text style={[styles.detailValue, styles.priceText]}>
                €{booking.price.toFixed(2)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Data Prenotazione</Text>
              <Text style={styles.detailValue}>
                {new Date(booking.createdAt).toLocaleDateString('it-IT')}
              </Text>
            </View>
          </View>
        </View>

        {/* Sezione Match */}
        {renderMatchSection()}
      </ScrollView>

      {/* Modal Invita Giocatori */}
      <Modal
        visible={inviteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invita Giocatore</Text>
              <Pressable onPress={() => setInviteModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Cerca per username..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  searchUsers(text);
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <ScrollView style={styles.searchResults}>
              {searching ? (
                <ActivityIndicator size="small" color="#FF9800" style={{ marginTop: 20 }} />
              ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                <Text style={styles.noResults}>Nessun utente trovato</Text>
              ) : (
                searchResults.map((user) => (
                  <Pressable
                    key={user._id}
                    style={styles.searchResultItem}
                    onPress={() => invitePlayer(user.username)}
                  >
                    {user.avatarUrl ? (
                      <Image
                        source={{ uri: `${API_URL}${user.avatarUrl}` }}
                        style={styles.resultAvatar}
                      />
                    ) : (
                      <View style={styles.resultAvatarPlaceholder}>
                        <Ionicons name="person" size={20} color="#999" />
                      </View>
                    )}
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>{user.name}</Text>
                      <Text style={styles.resultUsername}>@{user.username}</Text>
                    </View>
                    <Ionicons name="add-circle" size={24} color="#2196F3" />
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// 🆕 Componente PlayerCard con gestione team
const PlayerCardWithTeam = ({ 
  player, 
  isCreator, 
  currentUserId, 
  onRemove, 
  onChangeTeam,
  currentTeam,
  isPending = false 
}: { 
  player: Player;
  isCreator: boolean;
  currentUserId?: string;
  onRemove: () => void;
  onChangeTeam: (team: "A" | "B" | null) => void;
  currentTeam?: "A" | "B" | null;
  isPending?: boolean;
}) => {
  const [showTeamMenu, setShowTeamMenu] = useState(false);

  const handleTeamPress = () => {
    if (isCreator && player.status === "confirmed") {
      setShowTeamMenu(!showTeamMenu);
    }
  };

  return (
    <View style={[styles.playerCard, isPending && styles.playerCardPending]}>
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
            {player.user?.name || 'Giocatore'}
          </Text>
          <Text style={styles.playerUsername}>
            @{player.user?.username || 'unknown'}
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

        {isCreator && player.status === "confirmed" && currentTeam !== null && (
          <View style={styles.teamControl}>
            <Pressable 
              style={styles.teamButton}
              onPress={handleTeamPress}
            >
              <Ionicons 
                name="swap-horizontal" 
                size={18} 
                color="#2196F3" 
              />
            </Pressable>

            {showTeamMenu && (
              <View style={styles.teamMenu}>
                <Pressable
                  style={[styles.teamMenuItem, styles.teamMenuItemA]}
                  onPress={() => {
                    onChangeTeam("A");
                    setShowTeamMenu(false);
                  }}
                >
                  <Text style={styles.teamMenuText}>Team A</Text>
                </Pressable>
                <Pressable
                  style={[styles.teamMenuItem, styles.teamMenuItemB]}
                  onPress={() => {
                    onChangeTeam("B");
                    setShowTeamMenu(false);
                  }}
                >
                  <Text style={styles.teamMenuText}>Team B</Text>
                </Pressable>
                <Pressable
                  style={styles.teamMenuItem}
                  onPress={() => {
                    onChangeTeam(null);
                    setShowTeamMenu(false);
                  }}
                >
                  <Text style={styles.teamMenuText}>Rimuovi da team</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
        
        {isCreator && player.user?._id !== currentUserId && (
          <Pressable style={styles.removeButton} onPress={onRemove}>
            <Ionicons name="close-circle" size={22} color="#F44336" />
          </Pressable>
        )}
      </View>
    </View>
  );
};
// Continua dalla PARTE 2...

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

  // Status Card (Prenotazione)
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
  },
  statusConfirmed: { 
    backgroundColor: "#E8F5E9" 
  },
  statusCancelled: { 
    backgroundColor: "#FFEBEE" 
  },
  statusText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#666",
  },
  statusInfo: {
    gap: 12,
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

  // General Card
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
  },
  matchHeaderActions: {
    flexDirection: "row",
    gap: 8,
  },

  // Info Section
  infoSection: {
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "700",
  },
  infoSubValue: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },

  // Details Grid
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  detailItem: {
    width: '48%',
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "700",
  },
  priceText: {
    color: "#4CAF50",
    fontSize: 18,
  },

  // Match Section
  matchStatusCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  matchStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  matchStatusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  matchStatusCompleted: { backgroundColor: "#E8F5E9" },
  matchStatusOpen: { backgroundColor: "#E3F2FD" },
  matchStatusFull: { backgroundColor: "#FFF3E0" },
  matchStatusDraft: { backgroundColor: "#FFF3E0" },
  matchStatusCancelled: { backgroundColor: "#FFEBEE" },
  matchStatusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
  },
  matchStats: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  creatorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  creatorText: {
    fontSize: 13,
    color: "#666",
  },

  // Invite Button
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#2196F3",
  },
  inviteButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
  },

  // Pending Invite
  pendingInviteCard: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  pendingInviteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  pendingInviteTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2196F3",
  },
  pendingInviteText: {
    fontSize: 13,
    color: "#1976D2",
    marginBottom: 12,
    lineHeight: 18,
  },
  pendingInviteActions: {
    flexDirection: "row",
    gap: 8,
  },
  pendingDeclineButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  pendingDeclineButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },
  pendingAcceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#2196F3",
  },
  pendingAcceptButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },

  // Team Sections
  teamSection: {
    marginBottom: 20,
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  teamAHeader: {
    backgroundColor: "#E3F2FD",
  },
  teamBHeader: {
    backgroundColor: "#FFEBEE",
  },
  teamTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  teamCount: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  emptyTeamText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  playersGrid: {
    gap: 8,
  },

  // Unassigned Section
  unassignedSection: {
    marginBottom: 20,
  },
  unassignedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    marginBottom: 12,
  },

  // Pending Section
  pendingSection: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    marginBottom: 12,
  },

  // Player Card
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
  },
  playerCardPending: {
    backgroundColor: "#FFF3E0",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playerStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
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
  removeButton: {
    marginLeft: 4,
  },

  // 🆕 Team Control Styles
  teamControl: {
    position: 'relative',
  },
  teamButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamMenu: {
    position: 'absolute',
    right: 0,
    top: 36,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 140,
    overflow: 'hidden',
    zIndex: 1000,
  },
  teamMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  teamMenuItemA: {
    backgroundColor: '#E3F2FD',
  },
  teamMenuItemB: {
    backgroundColor: '#FFEBEE',
  },
  teamMenuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  // Result Card
  resultCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  winnerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FFF8E1",
    marginBottom: 16,
  },
  winnerText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F57C00",
  },
  setsContainer: {
    gap: 10,
  },
  setCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "white",
  },
  setLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginBottom: 8,
  },
  setScore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreTeam: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
  },
  scoreTeamA: {
    backgroundColor: "#E3F2FD",
  },
  scoreTeamB: {
    backgroundColor: "#FFEBEE",
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  scoreSeparator: {
    fontSize: 20,
    fontWeight: "800",
    color: "#666",
    marginHorizontal: 16,
  },

  // Match Actions
  matchActions: {
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  resultButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#FF9800",
  },
  resultButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },

  // No Match Card
  noMatchCard: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  noMatchText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    marginTop: 12,
    marginBottom: 8,
  },
  noMatchSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  searchResults: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  noResults: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    marginBottom: 8,
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  resultAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  resultUsername: {
    fontSize: 13,
    color: "#666",
  },
});