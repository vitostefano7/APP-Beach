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
  calculateDuration,
  submitMatchScore
} from "./DettaglioPrenotazione/utils/DettaglioPrenotazione.utils";
import PlayerCardWithTeam from "./DettaglioPrenotazione/components/DettaglioPrenotazione.components";
import TeamSelectionModal from "./DettaglioPrenotazione/components/TeamSelectionModal";
import ScoreModal from "./DettaglioPrenotazione/components/ScoreModal";
import ScoreDisplay from "./DettaglioPrenotazione/components/ScoreDisplay";
import BookingDetailsCard from "./DettaglioPrenotazione/components/BookingDetailsCard";
import styles from "./DettaglioPrenotazione/styles/DettaglioPrenotazione.styles";

// Componenti animati e gradients
import {
  AnimatedCard,
  AnimatedButton,
  FadeInView,
  SlideInView,
  ScaleInView,
} from "./DettaglioPrenotazione/components/AnimatedComponents";

import {
  TeamAGradient,
  TeamBGradient,
  WinnerGradient,
  SuccessGradient,
  WarningGradient,
} from "./DettaglioPrenotazione/components/GradientComponents";

export default function DettaglioPrenotazioneScreen() {
  const { token, user } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { bookingId } = route.params;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [teamSelectionModalVisible, setTeamSelectionModalVisible] = useState(false);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);
  const [inviteToTeam, setInviteToTeam] = useState<"A" | "B" | null>(null);
  const [inviteToSlot, setInviteToSlot] = useState<number | null>(null);
  const [leavingMatch, setLeavingMatch] = useState(false);
  const [acceptingInvite, setAcceptingInvite] = useState(false);

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

  const handleSubmitScore = async (winner: 'A' | 'B', sets: { teamA: number; teamB: number }[]) => {
    if (!booking?.matchId || !token) return;

    try {
      await submitMatchScore(booking.matchId, winner, sets, token);
      Alert.alert('✅ Risultato salvato!', 'Il risultato del match è stato registrato con successo');
      setScoreModalVisible(false);
      loadBooking();
    } catch (error: any) {
      throw error;
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

    if (response === "accept" && booking.match?.maxPlayers && booking.match.maxPlayers > 2 && !team) {
      setTeamSelectionModalVisible(true);
      return;
    }

    try {
      setAcceptingInvite(true);
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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Errore nella risposta all'invito");
      }

      setTeamSelectionModalVisible(false);
      loadBooking();
      
      if (response === "accept") {
        Alert.alert("✅ Invito accettato!", "Ti sei unito al match con successo");
      } else {
        Alert.alert("Invito rifiutato", "Hai rifiutato l'invito al match");
      }
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    } finally {
      setAcceptingInvite(false);
    }
  };

  const handleSelectTeamForInvite = (team: "A" | "B") => {
    handleRespondToInvite("accept", team);
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

              if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Errore rimozione giocatore");
              }

              loadBooking();
            } catch (error: any) {
              Alert.alert("Errore", error.message);
            }
          }
        }
      ]
    );
  };

  const handleJoinMatch = async (team?: "A" | "B") => {
    if (!booking?.matchId) return;

    if (!team && booking.match?.maxPlayers && booking.match.maxPlayers > 2) {
      setTeamSelectionModalVisible(true);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/matches/${booking.matchId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(team ? { team } : {}),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore nell'unione al match");
      }

      Alert.alert("✅ Match unito!", "Ti sei unito al match con successo");
      loadBooking();
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    }
  };

  const handleLeaveMatch = async () => {
    if (!booking?.matchId) return;

    try {
      setLeavingMatch(true);
      const res = await fetch(`${API_URL}/matches/${booking.matchId}/leave`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore nell'abbandonare il match");
      }

      Alert.alert("Match abbandonato", "Hai lasciato il match");
      loadBooking();
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    } finally {
      setLeavingMatch(false);
    }
  };

  const handleInviteToTeam = (team: "A" | "B", slotNumber: number) => {
    setInviteToTeam(team);
    setInviteToSlot(slotNumber);
    setInviteModalVisible(true);
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

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorText}>{error || 'Prenotazione non trovata'}</Text>
          <AnimatedButton style={styles.retryButton} onPress={loadBooking}>
            <Text style={styles.retryButtonText}>Riprova</Text>
          </AnimatedButton>
        </View>
      </SafeAreaView>
    );
  }

  const isCreator = booking.match?.createdBy?._id === user?.userId;
  const currentUserPlayer = booking.match?.players?.find(p => p.user._id === user?.userId);
  const isPendingInvite = currentUserPlayer?.status === "pending";
  const isDeclined = currentUserPlayer?.status === "declined";
  const isConfirmed = currentUserPlayer?.status === "confirmed";
  const isInMatch = !!currentUserPlayer;
  
  const maxPlayersPerTeam = booking.match ? Math.floor(booking.match.maxPlayers / 2) : 1;
  const teamAPlayers = booking.match?.players?.filter(p => p.team === "A" && p.status === "confirmed").length || 0;
  const teamBPlayers = booking.match?.players?.filter(p => p.team === "B" && p.status === "confirmed").length || 0;

  const confirmedPlayers = booking.match?.players?.filter(p => p.status === "confirmed") || [];
  const pendingPlayers = booking.match?.players?.filter(p => p.status === "pending") || [];
  const unassignedPlayers = confirmedPlayers.filter(p => !p.team);

  const teamAConfirmed = confirmedPlayers.filter(p => p.team === "A");
  const teamBConfirmed = confirmedPlayers.filter(p => p.team === "B");

  const getMatchStatusInfo = () => {
    const match = booking.match;
    if (!match) return { color: "#999", text: "Nessun Match", icon: "help-circle" as const };

    const confirmedCount = match.players?.filter(p => p.status === "confirmed").length || 0;
    const pendingCount = match.players?.filter(p => p.status === "pending").length || 0;

    switch (match.status) {
      case "completed":
        return { color: "#4CAF50", text: "Completato", icon: "checkmark-circle" as const };
      case "cancelled":
        return { color: "#F44336", text: "Cancellato", icon: "close-circle" as const };
      case "full":
        return { color: "#FF9800", text: "Completo", icon: "people" as const };
      case "open":
        return { color: "#2196F3", text: "Aperto", icon: "radio-button-on" as const };
      case "draft":
        return { color: "#9E9E9E", text: "Bozza", icon: "create" as const };
      default:
        return { color: "#999", text: match.status, icon: "help-circle" as const };
    }
  };

  const renderMatchSection = () => {
    if (!booking.hasMatch || !booking.match) {
      return (
        <AnimatedCard delay={200} style={styles.card}>
          <View style={styles.noMatchCard}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.noMatchText}>Nessun match associato</Text>
            <Text style={styles.noMatchSubtext}>
              Non è stato creato un match per questa prenotazione
            </Text>
          </View>
        </AnimatedCard>
      );
    }

    const match = booking.match;
    const statusInfo = getMatchStatusInfo();
    const canInvite = isCreator && match.status !== "completed" && match.status !== "cancelled";
    const canJoin = !isInMatch && match.status === "open";
    const canSubmitScore = isCreator && match.status !== "completed" && match.status !== "cancelled";

    return (
      <AnimatedCard delay={200} style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <FadeInView delay={300}>
            <Text style={styles.cardTitle}>Match Details</Text>
          </FadeInView>
          
          <View style={styles.matchHeaderActions}>
            {canInvite && (
              <AnimatedButton
                style={styles.inviteButton}
                onPress={() => setInviteModalVisible(true)}
              >
                <Ionicons name="person-add" size={18} color="white" />
                <Text style={styles.inviteButtonText}>Invita</Text>
              </AnimatedButton>
            )}
            
            {canJoin && (
              <AnimatedButton
                style={styles.joinButton}
                onPress={() => handleJoinMatch()}
              >
                <Ionicons name="enter" size={18} color="white" />
                <Text style={styles.joinButtonText}>Unisciti</Text>
              </AnimatedButton>
            )}
          </View>
        </View>

        {/* Match Status */}
        <FadeInView delay={400}>
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
                <Text style={styles.matchStatusText}>{statusInfo.text}</Text>
              </View>

              <View style={styles.matchInfoRow}>
                <View style={styles.matchInfoItem}>
                  <Ionicons name="people" size={16} color={statusInfo.color} />
                  <Text style={styles.matchInfoText}>
                    {confirmedPlayers.length}/{match.maxPlayers}
                  </Text>
                </View>
                
                {pendingPlayers.length > 0 && (
                  <View style={[styles.matchInfoItem, styles.pendingBadge]}>
                    <Ionicons name="time" size={14} color="#FF9800" />
                    <Text style={[styles.matchInfoText, { color: "#FF9800" }]}>
                      {pendingPlayers.length} in attesa
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Pending Invite Card */}
        {isPendingInvite && (
          <ScaleInView delay={500}>
            <View style={styles.pendingInviteCard}>
              <View style={styles.pendingInviteHeader}>
                <Ionicons name="mail" size={24} color="#F57F17" />
                <Text style={styles.pendingInviteTitle}>Invito al Match</Text>
              </View>
              <Text style={styles.pendingInviteText}>
                Sei stato invitato a partecipare a questo match. Scegli un team per confermare la tua presenza.
              </Text>
              <View style={styles.pendingInviteActions}>
                <AnimatedButton
                  style={styles.pendingAcceptButton}
                  onPress={() => handleRespondToInvite("accept")}
                  disabled={acceptingInvite}
                >
                  {acceptingInvite ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color="white" />
                      <Text style={styles.pendingAcceptButtonText}>Accetta</Text>
                    </>
                  )}
                </AnimatedButton>

                <AnimatedButton
                  style={styles.pendingDeclineButton}
                  onPress={() => handleRespondToInvite("decline")}
                  disabled={acceptingInvite}
                >
                  <Text style={styles.pendingDeclineButtonText}>Rifiuta</Text>
                </AnimatedButton>
              </View>
            </View>
          </ScaleInView>
        )}

        {/* Declined Card */}
        {isDeclined && (
          <ScaleInView delay={500}>
            <View style={styles.declinedCard}>
              <View style={styles.declinedHeader}>
                <Ionicons name="close-circle" size={24} color="#D32F2F" />
                <Text style={styles.declinedTitle}>Invito Rifiutato</Text>
              </View>
              <Text style={styles.declinedText}>
                Hai rifiutato l'invito a questo match. Vuoi cambiare idea?
              </Text>
              <AnimatedButton
                style={styles.changeResponseButton}
                onPress={() => handleRespondToInvite("accept")}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.changeResponseButtonText}>Accetta Invito</Text>
              </AnimatedButton>
            </View>
          </ScaleInView>
        )}

        {/* Score Display */}
        {match.score && match.score.sets.length > 0 && (
          <FadeInView delay={600}>
            <ScoreDisplay
              score={match.score}
              isCreator={isCreator}
              onEdit={() => setScoreModalVisible(true)}
              matchStatus={match.status}
            />
          </FadeInView>
        )}

        {/* Score Actions */}
        {canSubmitScore && (!match.score || match.score.sets.length === 0) && confirmedPlayers.length >= 2 && (
          <FadeInView delay={700}>
            <View style={styles.scoreActionsContainer}>
              <AnimatedButton onPress={() => setScoreModalVisible(true)}>
                <WinnerGradient style={styles.submitScoreButton}>
                  <Ionicons name="trophy" size={20} color="#FFF" />
                  <Text style={styles.submitScoreButtonText}>Inserisci Risultato</Text>
                </WinnerGradient>
              </AnimatedButton>
            </View>
          </FadeInView>
        )}

        {/* Teams Section */}
        {confirmedPlayers.length > 0 && (
          <SlideInView delay={800} from="bottom">
            <View style={styles.teamsContainer}>
              {/* Team A */}
              <View style={styles.teamSection}>
                <TeamAGradient style={styles.teamHeader}>
                  <Ionicons name="people-circle" size={20} color="white" />
                  <Text style={[styles.teamTitle, { color: "white" }]}>Team A</Text>
                  <View style={styles.teamHeaderRight}>
                    <Text style={[styles.teamCount, { color: "white" }]}>
                      {teamAConfirmed.length}/{maxPlayersPerTeam}
                    </Text>
                    {teamAConfirmed.length === maxPlayersPerTeam && (
                      <ScaleInView delay={900}>
                        <Ionicons name="checkmark-circle" size={16} color="white" />
                      </ScaleInView>
                    )}
                  </View>
                </TeamAGradient>

                <View style={styles.teamSlotsContainer}>
                  {Array(maxPlayersPerTeam).fill(null).map((_, index) => {
                    const player = teamAConfirmed[index];
                    const slotNumber = index + 1;

                    return (
                      <FadeInView key={`teamA-slot-${slotNumber}`} delay={1000 + index * 50}>
                        <PlayerCardWithTeam
                          player={player}
                          isCreator={isCreator}
                          currentUserId={user?.userId}
                          onRemove={() => player && handleRemovePlayer(player.user._id)}
                          onChangeTeam={(team) => player && handleAssignTeam(player.user._id, team)}
                          onLeave={handleLeaveMatch}
                          currentTeam="A"
                          isEmptySlot={!player}
                          onInviteToSlot={() => handleInviteToTeam("A", slotNumber)}
                          slotNumber={slotNumber}
                          matchStatus={match.status}
                        />
                      </FadeInView>
                    );
                  })}
                </View>
              </View>

              {/* Team B */}
              <View style={styles.teamSection}>
                <TeamBGradient style={styles.teamHeader}>
                  <Ionicons name="people" size={20} color="white" />
                  <Text style={[styles.teamTitle, { color: "white" }]}>Team B</Text>
                  <View style={styles.teamHeaderRight}>
                    <Text style={[styles.teamCount, { color: "white" }]}>
                      {teamBConfirmed.length}/{maxPlayersPerTeam}
                    </Text>
                    {teamBConfirmed.length === maxPlayersPerTeam && (
                      <ScaleInView delay={900}>
                        <Ionicons name="checkmark-circle" size={16} color="white" />
                      </ScaleInView>
                    )}
                  </View>
                </TeamBGradient>

                <View style={styles.teamSlotsContainer}>
                  {Array(maxPlayersPerTeam).fill(null).map((_, index) => {
                    const player = teamBConfirmed[index];
                    const slotNumber = index + 1;

                    return (
                      <FadeInView key={`teamB-slot-${slotNumber}`} delay={1000 + index * 50}>
                        <PlayerCardWithTeam
                          player={player}
                          isCreator={isCreator}
                          currentUserId={user?.userId}
                          onRemove={() => player && handleRemovePlayer(player.user._id)}
                          onChangeTeam={(team) => player && handleAssignTeam(player.user._id, team)}
                          onLeave={handleLeaveMatch}
                          currentTeam="B"
                          isEmptySlot={!player}
                          onInviteToSlot={() => handleInviteToTeam("B", slotNumber)}
                          slotNumber={slotNumber}
                          matchStatus={match.status}
                        />
                      </FadeInView>
                    );
                  })}
                </View>
              </View>
            </View>
          </SlideInView>
        )}

        {/* Unassigned Players */}
        {unassignedPlayers.length > 0 && isCreator && (
          <FadeInView delay={1100}>
            <View style={styles.unassignedSection}>
              <Text style={styles.unassignedTitle}>Giocatori Non Assegnati</Text>
              <Text style={styles.unassignedSubtitle}>
                Assegna questi giocatori ad un team
              </Text>
              <View style={styles.playersGrid}>
                {unassignedPlayers.map((player, index) => (
                  <SlideInView key={player.user._id} delay={1200 + index * 50} from="left">
                    <PlayerCardWithTeam
                      player={player}
                      isCreator={isCreator}
                      currentUserId={user?.userId}
                      onRemove={() => handleRemovePlayer(player.user._id)}
                      onChangeTeam={(team) => handleAssignTeam(player.user._id, team)}
                      matchStatus={match.status}
                    />
                  </SlideInView>
                ))}
              </View>
            </View>
          </FadeInView>
        )}

        {/* Pending Players */}
        {pendingPlayers.length > 0 && (
          <FadeInView delay={1300}>
            <View style={styles.pendingSection}>
              <Text style={styles.pendingTitle}>In Attesa di Risposta ({pendingPlayers.length})</Text>
              <View style={styles.playersGrid}>
                {pendingPlayers.map((player, index) => (
                  <SlideInView key={player.user._id} delay={1400 + index * 50} from="left">
                    <PlayerCardWithTeam
                      player={player}
                      isCreator={isCreator}
                      currentUserId={user?.userId}
                      onRemove={() => handleRemovePlayer(player.user._id)}
                      onChangeTeam={(team) => handleAssignTeam(player.user._id, team)}
                      isPending={true}
                      matchStatus={match.status}
                    />
                  </SlideInView>
                ))}
              </View>
            </View>
          </FadeInView>
        )}
      </AnimatedCard>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedButton 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </AnimatedButton>
        <Text style={styles.headerTitle}>Dettaglio Prenotazione</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container}>
        {/* Status Card */}
        <AnimatedCard delay={0} style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <ScaleInView delay={100}>
              <Ionicons 
                name={booking.status === 'confirmed' ? 'checkmark-circle' : 'close-circle'} 
                size={32} 
                color={booking.status === 'confirmed' ? '#4CAF50' : '#F44336'} 
              />
            </ScaleInView>
            {booking.status === 'confirmed' ? (
              <SuccessGradient style={styles.statusBadge}>
                <Text style={[styles.statusText, { color: "white" }]}>CONFERMATA</Text>
              </SuccessGradient>
            ) : (
              <View style={[styles.statusBadge, styles.statusCancelled]}>
                <Text style={styles.statusText}>CANCELLATA</Text>
              </View>
            )}
          </View>

          <View style={styles.statusInfo}>
            <FadeInView delay={200}>
              <View style={styles.statusInfoItem}>
                <Ionicons name="calendar" size={20} color="#666" />
                <Text style={styles.statusInfoText}>{formatDate(booking.date)}</Text>
              </View>
            </FadeInView>
            <FadeInView delay={300}>
              <View style={styles.statusInfoItem}>
                <Ionicons name="time" size={20} color="#666" />
                <Text style={styles.statusInfoText}>
                  {booking.startTime} - {booking.endTime} ({calculateDuration(booking.startTime, booking.endTime)})
                </Text>
              </View>
            </FadeInView>
          </View>
        </AnimatedCard>

        {/* Campo Info Card */}
        <AnimatedCard delay={100} style={styles.card}>
          <Text style={styles.cardTitle}>Informazioni Campo</Text>
          
          <View style={styles.infoSection}>
            <FadeInView delay={200}>
              <View style={styles.infoRow}>
                <Ionicons name="business" size={24} color="#2196F3" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Struttura</Text>
                  <Text style={styles.infoValue}>{booking.campo.struttura.name}</Text>
                </View>
              </View>
            </FadeInView>

            <FadeInView delay={300}>
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
            </FadeInView>

            <FadeInView delay={400}>
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
            </FadeInView>
          </View>
        </AnimatedCard>

        {/* NUOVA CARD DETTAGLI - USA BookingDetailsCard */}
        <AnimatedCard delay={150}>
          <BookingDetailsCard
            date={booking.date}
            startTime={booking.startTime}
            endTime={booking.endTime}
            duration={calculateDuration(booking.startTime, booking.endTime)}
            price={booking.price}
            createdAt={booking.createdAt}
          />
        </AnimatedCard>

        {renderMatchSection()}
      </ScrollView>

      {/* Invite Modal */}
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
          <ScaleInView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {inviteToTeam ? `Invita a Team ${inviteToTeam}` : 'Invita Giocatore'}
                {inviteToSlot && ` - Slot ${inviteToSlot}`}
              </Text>
              <AnimatedButton onPress={() => {
                setInviteModalVisible(false);
                setInviteToTeam(null);
                setInviteToSlot(null);
              }} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#333" />
              </AnimatedButton>
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
                searchResults.map((user, index) => (
                  <FadeInView key={user._id} delay={index * 50}>
                    <AnimatedButton
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
                    </AnimatedButton>
                  </FadeInView>
                ))
              )}
            </ScrollView>
          </ScaleInView>
        </View>
      </Modal>

      {/* Team Selection Modal */}
      <TeamSelectionModal
        visible={teamSelectionModalVisible}
        onClose={() => setTeamSelectionModalVisible(false)}
        onSelectTeam={handleSelectTeamForInvite}
        teamA={{
          current: teamAPlayers,
          max: maxPlayersPerTeam,
          players: booking?.match?.players?.filter(p => p.team === "A") || []
        }}
        teamB={{
          current: teamBPlayers,
          max: maxPlayersPerTeam,
          players: booking?.match?.players?.filter(p => p.team === "B") || []
        }}
        matchStatus={booking?.match?.status}
        maxPlayersPerTeam={maxPlayersPerTeam}
      />

      {/* Score Modal */}
      {booking?.match && (
        <ScoreModal
          visible={scoreModalVisible}
          onClose={() => setScoreModalVisible(false)}
          onSave={handleSubmitScore}
          currentScore={booking.match.score}
          matchStatus={booking.match.status}
        />
      )}
    </SafeAreaView>
  );
}