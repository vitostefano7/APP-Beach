import {
  View,
  Text,
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
import { BookingDetails, Player } from "./DettaglioPrenotazione/types/DettaglioPrenotazione.types";
import { 
  formatDate, 
  formatDateTime, 
  calculateDuration 
} from "./DettaglioPrenotazione/utils/DettaglioPrenotazione.utils";
import PlayerCardWithTeam from "./DettaglioPrenotazione/components/DettaglioPrenotazione.components";
import styles from "./DettaglioPrenotazione/styles/DettaglioPrenotazione.styles";

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
  const [inviteToTeam, setInviteToTeam] = useState<"A" | "B" | null>(null);
  const [inviteToSlot, setInviteToSlot] = useState<number | null>(null);

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
      
      const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Errore ${res.status}`);
      }

      const data = await res.json();
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

  const handleAssignTeam = async (playerId: string, team: "A" | "B" | null) => {
    if (!booking?.matchId) return;

    try {
      const res = await fetch(`${API_URL}/matches/${booking.matchId}/players/${playerId}/team`, {
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

      loadBooking();
    } catch (error: any) {
      Alert.alert("Errore", error.message || "Impossibile assegnare il giocatore");
    }
  };

  const handleSearchUsers = async (query: string) => {
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

  const handleInvitePlayer = async (username: string) => {
    if (!booking?.matchId) return;

    try {
      const body: any = { 
        username,
        // Se invitiamo a un team specifico, specifichiamo il team
        ...(inviteToTeam && { team: inviteToTeam })
      };
      
      const res = await fetch(`${API_URL}/matches/${booking.matchId}/invite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore invito");
      }

      Alert.alert("✅ Invito inviato!", "L'utente è stato invitato al match");
      setInviteModalVisible(false);
      setSearchQuery("");
      setSearchResults([]);
      setInviteToTeam(null);
      setInviteToSlot(null);
      loadBooking();
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    }
  };

  const handleRespondToInvite = async (response: "accept" | "decline", team?: "A" | "B") => {
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

  const handleRemovePlayer = async (playerId: string) => {
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
          onPress: () => handleJoinMatch("A"),
        },
        {
          text: "Team B",
          onPress: () => handleJoinMatch("B"),
        },
      ]
    );
  };

  const handleJoinMatch = async (team: "A" | "B") => {
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

  const autoAssignTeams = async () => {
    if (!booking?.matchId) return;
    
    Alert.alert(
      "Assegnazione automatica",
      "Vuoi bilanciare automaticamente i giocatori nei team?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Bilancia",
          onPress: async () => {
            try {
              const confirmedPlayers = booking.match?.players
                .filter(p => p.status === "confirmed" && !p.team) || [];
              
              for (let i = 0; i < confirmedPlayers.length; i++) {
                const player = confirmedPlayers[i];
                const team = i % 2 === 0 ? "A" : "B";
                
                const res = await fetch(`${API_URL}/matches/${booking.matchId}/players/${player.user._id}/team`, {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ team }),
                });

                if (!res.ok) throw new Error();
              }
              
              Alert.alert("✅ Successo", "Giocatori assegnati automaticamente!");
              loadBooking();
            } catch (error: any) {
              Alert.alert("Errore", error.message);
            }
          }
        },
      ]
    );
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

  const maxPlayersPerTeam = booking?.match?.maxPlayers 
    ? Math.ceil(booking.match.maxPlayers / 2)
    : 2;

  // Funzione per creare array di slot che include anche i giocatori in pending
  const createSlotsArray = (team: "A" | "B") => {
    if (!booking?.match) return Array(maxPlayersPerTeam).fill(null);
    
    // Ottieni tutti i giocatori del team (sia confirmed che pending)
    const teamPlayers = booking.match.players.filter(p => p.team === team);
    
    // Ordina: prima i confirmed, poi i pending
    const sortedPlayers = [...teamPlayers].sort((a, b) => {
      if (a.status === "confirmed" && b.status === "pending") return -1;
      if (a.status === "pending" && b.status === "confirmed") return 1;
      return 0;
    });
    
    // Crea array di slot
    const slots = Array(maxPlayersPerTeam).fill(null);
    sortedPlayers.forEach((player, index) => {
      if (index < maxPlayersPerTeam) {
        slots[index] = player;
      }
    });
    
    return slots;
  };

  const renderTeamSectionWithSlots = (team: "A" | "B") => {
    const slots = createSlotsArray(team);
    const confirmedCount = booking?.match?.players.filter(p => p.team === team && p.status === "confirmed").length || 0;
    const pendingCount = booking?.match?.players.filter(p => p.team === team && p.status === "pending").length || 0;
    const totalCount = confirmedCount + pendingCount;
    
    return (
      <View style={styles.teamSection}>
        <View style={[styles.teamHeader, team === "A" ? styles.teamAHeader : styles.teamBHeader]}>
          <Ionicons name="shield" size={20} color={team === "A" ? "#2196F3" : "#F44336"} />
          <Text style={styles.teamTitle}>Team {team}</Text>
          <View style={styles.teamHeaderRight}>
            <View style={styles.teamCountContainer}>
              <Text style={styles.teamCount}>
                {confirmedCount}/{maxPlayersPerTeam}
              </Text>
              {pendingCount > 0 && (
                <Text style={styles.teamPendingCount}>
                  (+{pendingCount} in attesa)
                </Text>
              )}
            </View>
            {confirmedCount >= maxPlayersPerTeam && (
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            )}
          </View>
        </View>
        
        <View style={styles.teamSlotsContainer}>
          {slots.map((slotPlayer, index) => {
            const slotNumber = index + 1;
            
            if (slotPlayer) {
              // Slot con giocatore (confirmed o pending)
              return (
                <PlayerCardWithTeam
                  key={slotPlayer.user._id || `pending-${index}`}
                  player={slotPlayer}
                  isCreator={isCreator}
                  currentUserId={user?.id}
                  onRemove={() => slotPlayer.user?._id && handleRemovePlayer(slotPlayer.user._id)}
                  onChangeTeam={(newTeam) => slotPlayer.user?._id && handleAssignTeam(slotPlayer.user._id, newTeam)}
                  currentTeam={team}
                  isPending={slotPlayer.status === "pending"}
                  slotNumber={slotNumber}
                />
              );
            } else {
              // Slot vuoto - mostra solo se è il creator
              return (
                <PlayerCardWithTeam
                  key={`empty-slot-${team}-${slotNumber}`}
                  isEmptySlot={true}
                  isCreator={isCreator}
                  onInviteToSlot={() => {
                    setInviteToTeam(team);
                    setInviteToSlot(slotNumber);
                    setInviteModalVisible(true);
                  }}
                  slotNumber={slotNumber}
                  maxSlotsPerTeam={maxPlayersPerTeam}
                />
              );
            }
          })}
        </View>
      </View>
    );
  };

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
    const pendingPlayersList = match.players.filter(p => p.status === "pending");
    const unassignedPlayersList = match.players.filter(p => !p.team && p.status === "confirmed");

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

        {canManage && match.maxPlayers > 2 && (
          <View style={styles.teamManagementActions}>
            <Text style={styles.sectionSubtitle}>Gestione Team</Text>
            <View style={styles.managementButtons}>
              <Pressable 
                style={styles.managementButton}
                onPress={autoAssignTeams}
              >
                <Ionicons name="shuffle" size={16} color="#2196F3" />
                <Text style={styles.managementButtonText}>Bilancia Team</Text>
              </Pressable>
              
              <Pressable 
                style={styles.managementButton}
                onPress={() => {
                  Alert.alert(
                    "Statistiche Team",
                    `Team A: ${teamAPlayers} giocatori confermati\nTeam B: ${teamBPlayers} giocatori confermati\nDa assegnare: ${unassignedPlayers} giocatori\nIn attesa: ${pendingPlayers} inviti`,
                    [{ text: "OK" }]
                  );
                }}
              >
                <Ionicons name="stats-chart" size={16} color="#4CAF50" />
                <Text style={styles.managementButtonText}>Statistiche</Text>
              </Pressable>
            </View>
          </View>
        )}

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
                onPress={() => handleRespondToInvite("decline")}
              >
                <Text style={styles.pendingDeclineButtonText}>Rifiuta</Text>
              </Pressable>
              <Pressable 
                style={styles.pendingAcceptButton} 
                onPress={() => handleRespondToInvite("accept")}
              >
                <Ionicons name="checkmark" size={18} color="white" />
                <Text style={styles.pendingAcceptButtonText}>Accetta</Text>
              </Pressable>
            </View>
          </View>
        )}

        {match.maxPlayers > 2 ? (
          <>
            {renderTeamSectionWithSlots("A")}
            {renderTeamSectionWithSlots("B")}
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
              {unassignedPlayersList.map((player: any, index: number) => (
                <PlayerCardWithTeam
                  key={index}
                  player={player}
                  isCreator={isCreator}
                  currentUserId={user?.id}
                  onRemove={() => handleRemovePlayer(player.user._id)}
                  onChangeTeam={(newTeam) => handleAssignTeam(player.user._id, newTeam)}
                  currentTeam={null}
                />
              ))}
            </View>
          </View>
        )}

        {match.maxPlayers > 2 && unassignedPlayersList.length > 0 && (
          <View style={styles.unassignedSection}>
            <Text style={styles.unassignedTitle}>Giocatori da assegnare ({unassignedPlayersList.length})</Text>
            <Text style={styles.unassignedSubtitle}>
              Trascina questi giocatori nei team o clicca su "Bilancia Team" per assegnarli automaticamente
            </Text>
            <View style={styles.playersGrid}>
              {unassignedPlayersList.map((player: any, index: number) => (
                <PlayerCardWithTeam
                  key={index}
                  player={player}
                  isCreator={isCreator}
                  currentUserId={user?.id}
                  onRemove={() => handleRemovePlayer(player.user._id)}
                  onChangeTeam={(newTeam) => handleAssignTeam(player.user._id, newTeam)}
                  currentTeam={null}
                />
              ))}
            </View>
          </View>
        )}

        {pendingPlayersList.length > 0 && (
          <View style={styles.pendingSection}>
            <Text style={styles.pendingTitle}>Inviti in attesa ({pendingPlayersList.length})</Text>
            <View style={styles.playersGrid}>
              {pendingPlayersList.map((player: any, index: number) => (
                <PlayerCardWithTeam
                  key={index}
                  player={player}
                  isCreator={isCreator}
                  currentUserId={user?.id}
                  onRemove={() => handleRemovePlayer(player.user._id)}
                  onChangeTeam={() => {}}
                  currentTeam={null}
                  isPending
                />
              ))}
            </View>
          </View>
        )}

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
              {match.score.sets.map((set: any, index: number) => (
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
                {booking.startTime} - {booking.endTime} ({calculateDuration(booking.startTime, booking.endTime)})
              </Text>
            </View>
          </View>
        </View>

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
                {calculateDuration(booking.startTime, booking.endTime)}
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

        {renderMatchSection()}
      </ScrollView>

      <Modal
        visible={inviteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setInviteModalVisible(false);
          setInviteToTeam(null);
          setInviteToSlot(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {inviteToTeam ? `Invita a Team ${inviteToTeam}` : 'Invita Giocatore'}
                {inviteToSlot && ` - Slot ${inviteToSlot}`}
              </Text>
              <Pressable onPress={() => {
                setInviteModalVisible(false);
                setInviteToTeam(null);
                setInviteToSlot(null);
              }}>
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
                  handleSearchUsers(text);
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
                    onPress={() => handleInvitePlayer(user.username)}
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