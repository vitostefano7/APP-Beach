import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useRef, useState, useMemo } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import API_URL from "../../../config/api";
import { resolveAvatarUrl } from "../../../utils/avatar";
import { openStrutturaChat } from "../struttura/FieldDetailsScreen/api/fieldDetails.api";
import { BookingDetails, Player } from "./DettaglioPrenotazione/types/DettaglioPrenotazione.types";
import { 
  formatDate, 
  formatDateTime, 
  calculateDuration,
  submitMatchScore
} from "./DettaglioPrenotazione/utils/DettaglioPrenotazione.utils";
import { getTeamFormationLabel } from "../../../utils/matchSportRules";
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
  console.log('🚀 [DettaglioPrenotazione] Componente inizializzato');
  const { token, user, updateUser } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  console.log('🔍 [DettaglioPrenotazione] Route object:', route);
  const { bookingId, openScoreModal, openJoinModal, fromOpenMatch } = route?.params || {};

  // Funzione helper per ottenere ID utente sicuro
  const getUserId = (user: any) => {
    const id = user?.id || user?._id || user?.userId;
    console.log('🔍 [DettaglioPrenotazione] getUserId result:', { id, fromField: user?.id ? 'id' : user?._id ? '_id' : user?.userId ? 'userId' : 'none' });
    return id;
  };

  console.log('🔍 [DettaglioPrenotazione] User object completo:', JSON.stringify(user, null, 2));

  if (!route || !bookingId) {
    console.error('❌ [DettaglioPrenotazione] Route o bookingId mancante');
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorText}>Errore di navigazione: parametri mancanti</Text>
          <AnimatedButton style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Torna indietro</Text>
          </AnimatedButton>
        </View>
      </SafeAreaView>
    );
  }

  console.log('Auth check:', { token: token ? 'present' : 'missing', user: user ? { id: getUserId(user), name: user.name } : 'undefined' });

  if (!user) {
    console.log('❌ [DettaglioPrenotazione] Utente non loggato, mostrando schermata login');
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={64} color="#F44336" />
          <Text style={styles.errorText}>Effettua il login per vedere i dettagli della prenotazione</Text>
          <AnimatedButton style={styles.retryButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.retryButtonText}>Vai al Login</Text>
          </AnimatedButton>
        </View>
      </SafeAreaView>
    );
  }

  console.log('✅ [DettaglioPrenotazione] Utente loggato, procedendo con caricamento');

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
  const [cancellingBooking, setCancellingBooking] = useState(false);
  const [loadingGroupChat, setLoadingGroupChat] = useState(false);
  const [teamSelectionMode, setTeamSelectionMode] = useState<"join" | "invite">("join");
  const suppressInvitePress = useRef(false);

  // Stati per il modal di bilanciamento team
  const [balancingModalVisible, setBalancingModalVisible] = useState(false);
  const [playerToAssign, setPlayerToAssign] = useState<string | null>(null);
  const [targetTeam, setTargetTeam] = useState<"A" | "B" | null>(null);

  // Funzione helper per mostrare alert personalizzato
  const showCustomAlert = (title: string, message: string, buttons: Array<{text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive'}> = [{text: 'OK'}]) => {
    setCustomAlertTitle(title);
    setCustomAlertMessage(message);
    setCustomAlertButtons(buttons);
    setCustomAlertVisible(true);
  };

  // Stati per il modal personalizzato
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState("");
  const [customAlertMessage, setCustomAlertMessage] = useState("");
  const [customAlertButtons, setCustomAlertButtons] = useState<Array<{text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive'}>>([]);

  // Helper per confrontare utenti (con fallback a username/email se ID non disponibile)
  const isSameUser = (userId: string | undefined, targetUser: any) => {
    if (!targetUser) return false;
    
    // Prima prova con ID
    if (userId && (userId === targetUser._id || userId === targetUser.id)) return true;
    
    // Fallback: confronta con username
    if (user?.username && user.username === targetUser.username) return true;
    
    // Fallback: confronta email con email
    if (user?.email && user.email === targetUser.email) return true;
    
    // Fallback: estrai username dall'email e confronta con username
    if (user?.email && targetUser.username) {
      const usernameFromEmail = user.email.split('@')[0];
      if (usernameFromEmail === targetUser.username) return true;
    }
    
    // Fallback: confronta email con username (caso inverso)
    if (user?.username && targetUser.email) {
      const usernameFromEmail = targetUser.email.split('@')[0];
      if (user.username === usernameFromEmail) return true;
    }
    
    return false;
  };

  // Variabili calcolate basate su booking
  const isCreator = booking?.match?.createdBy ? isSameUser(getUserId(user), booking.match.createdBy) : false;
  const currentUserPlayer = booking?.match?.players?.find(p => isSameUser(getUserId(user), p.user));
  const isPendingInvite = currentUserPlayer?.status === "pending";
  const isDeclined = currentUserPlayer?.status === "declined";
  const isConfirmed = currentUserPlayer?.status === "confirmed";
  const isInMatch = !!currentUserPlayer;
  const isRegistrationOpen = () => {
    if (!booking) return false;
    const now = new Date();
    const matchStartTime = new Date(`${booking.date}T${booking.startTime}`);
    // Deadline: 45 minuti prima dell'inizio
    const deadlineTime = new Date(matchStartTime.getTime() - (45 * 60 * 1000));
    return now < deadlineTime;
  };

  const canJoin = useMemo(() => {
    if (!booking?.match) return false;
    return !isInMatch && booking.match.status === "open" && isRegistrationOpen();
  }, [booking, isInMatch]);

  // Variabili aggiuntive per renderMatchSection
  const confirmedPlayers = booking?.match?.players?.filter(p => p.status === "confirmed") || [];
  const pendingPlayers = booking?.match?.players?.filter(p => p.status === "pending") || [];
  const maxPlayersPerTeam = booking?.match ? Math.floor(booking.match.maxPlayers / 2) : 0;
  const teamAPlayers = booking?.match?.players?.filter(p => p.team === "A" && p.status === "confirmed").length || 0;
  const teamBPlayers = booking?.match?.players?.filter(p => p.team === "B" && p.status === "confirmed").length || 0;
  const unassignedPlayers = confirmedPlayers.filter(p => !p.team);
  const teamAConfirmed = confirmedPlayers.filter(p => p.team === "A");
  const teamBConfirmed = confirmedPlayers.filter(p => p.team === "B");

  // Recupera l'ID utente dal backend se mancante
  useEffect(() => {
    const fetchUserIdIfMissing = async () => {
      if (user && !getUserId(user) && token) {
        console.log('🔄 [DettaglioPrenotazione] ID utente mancante, recupero dal backend...');
        try {
          const res = await fetch(`${API_URL}/users/me/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (res.ok) {
            const data = await res.json();
            const freshUser = data.user;
            const updatedUser = {
              ...user,
              id: freshUser._id || freshUser.id,
              _id: freshUser._id || freshUser.id,
            };
            console.log('✅ [DettaglioPrenotazione] ID utente recuperato:', updatedUser.id);
            // Aggiorna il contesto auth
            await updateUser(updatedUser);
            // Ricarica i dati dopo l'aggiornamento
            setTimeout(() => loadBooking(), 100);
          }
        } catch (error) {
          console.error('❌ [DettaglioPrenotazione] Errore recupero ID:', error);
        }
      }
    };
    
    fetchUserIdIfMissing();
  }, []);

  useEffect(() => {
    if (!bookingId || bookingId === 'undefined') {
      setError('ID prenotazione non valido');
      setLoading(false);
      showCustomAlert('Errore', 'ID prenotazione non valido', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }
    loadBooking();
  }, [bookingId]);

  // Apri il modal score se richiesto dai params
  useEffect(() => {
    if (openScoreModal && booking && !loading) {
      setScoreModalVisible(true);
    }
  }, [openScoreModal, booking, loading]);

  // Apri il modal join se richiesto dai params
  useEffect(() => {
    if (openJoinModal && booking && !loading && canJoin) {
      setTeamSelectionModalVisible(true);
    }
  }, [openJoinModal, booking, loading, canJoin]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [DettaglioPrenotazione] Caricamento booking:', bookingId);
      console.log('🔍 [DettaglioPrenotazione] Token presente:', token ? 'SI' : 'NO');
      
      const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('📡 [DettaglioPrenotazione] Status risposta:', res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ [DettaglioPrenotazione] Errore risposta:', errorData);
        throw new Error(errorData.message || `Errore ${res.status}`);
      }

      const data = await res.json();
      console.log('✅ [DettaglioPrenotazione] Booking caricato:', data._id);
      console.log('📋 [DettaglioPrenotazione] Info partita:', {
        id: data._id,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        campo: data.campo?.name,
        struttura: data.campo?.struttura?.name,
        sport: data.campo?.sport,
        price: data.price,
        status: data.status,
        hasMatch: data.hasMatch,
        matchId: data.matchId,
        matchStatus: data.match?.status,
        maxPlayers: data.match?.maxPlayers,
        playersCount: data.match?.players?.length,
        createdBy: data.match?.createdBy?.username
      });
      console.log('🔍 [DettaglioPrenotazione] Dettagli completi booking:', JSON.stringify(data, null, 2));
      setBooking(data);
    } catch (error: any) {
      console.error('Errore nel caricamento:', error);
      setError(error.message);
      showCustomAlert('Errore', error.message || 'Impossibile caricare la prenotazione', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      console.log('🏁 [DettaglioPrenotazione] loadBooking completato');
      setLoading(false);
    }
  };

  // Helper function to update booking state safely
  const updateBookingState = (updater: (prevBooking: any) => any) => {
    setBooking((prevBooking) => {
      if (!prevBooking) return prevBooking;
      return updater(prevBooking);
    });
  };

  // Verifica se la partita è in corso o passata
  const isMatchInProgress = () => {
    if (!booking) return false;
    const now = new Date();
    const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
    const matchEndTime = new Date(`${booking.date}T${booking.endTime}`);
    const inProgress = now >= matchDateTime && now <= matchEndTime;
    
    console.log('🕐 Match Status Check:', {
      now: now.toISOString(),
      matchStart: matchDateTime.toISOString(),
      matchEnd: matchEndTime.toISOString(),
      inProgress,
      bookingDate: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime
    });
    
    return inProgress;
  };

  const isMatchPassed = () => {
    if (!booking) return false;
    const now = new Date();
    const matchEndTime = new Date(`${booking.date}T${booking.endTime}`);
    return now > matchEndTime;
  };

  const getTimeUntilMatchStart = () => {
    if (!booking) return null;
    const now = new Date();
    const matchStartTime = new Date(`${booking.date}T${booking.startTime}`);
    const diffMs = matchStartTime.getTime() - now.getTime();

    if (diffMs <= 0) return null; // Match già iniziato

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getTimeUntilRegistrationDeadline = () => {
    if (!booking) return null;
    const now = new Date();
    const matchStartTime = new Date(`${booking.date}T${booking.startTime}`);
    // Deadline: 45 minuti prima dell'inizio
    const deadlineTime = new Date(matchStartTime.getTime() - (45 * 60 * 1000));
    const diffMs = deadlineTime.getTime() - now.getTime();

    if (diffMs <= 0) return null; // Deadline passata

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const isWithin24Hours = () => {
    if (!booking) return false;
    const now = new Date();
    const matchStartTime = new Date(`${booking.date}T${booking.startTime}`);
    const diffMs = matchStartTime.getTime() - now.getTime();
    const hoursDiff = diffMs / (1000 * 60 * 60);
    return hoursDiff <= 24 && hoursDiff > 0;
  };

  // Helper functions for team colors
  const getTeamColors = (team: "A" | "B" | null) => {
    if (team === "A") {
      return {
        primary: "#2196F3",
        gradient: ["#2196F3", "#1976D2", "#1565C0"],
        light: "#E3F2FD",
        text: "white"
      };
    } else if (team === "B") {
      return {
        primary: "#F44336",
        gradient: ["#F44336", "#E53935", "#D32F2F"],
        light: "#FFEBEE",
        text: "white"
      };
    }
    return {
      primary: "#667eea",
      gradient: ["#667eea", "#764ba2"],
      light: "#f0f2f5",
      text: "white"
    };
  };

  const getTeamIcon = (team: "A" | "B" | null) => {
    return team === "A" ? "people" : team === "B" ? "people" : "person-add";
  };

  const canCancelBooking = () => {
    if (!booking || !user) return false;
    // Solo il creatore della prenotazione può cancellarla
    const bookingUserId = booking.match?.createdBy?._id;
    const isBookingCreator = bookingUserId === getUserId(user);
    // Solo se la partita non è ancora iniziata e mancano meno di 24 ore
    console.log('canCancelBooking check:', {
      isBookingCreator,
      bookingUserId,
      userId: getUserId(user),
      isMatchInProgress: isMatchInProgress(),
      isMatchPassed: isMatchPassed(),
      isWithin24Hours: isWithin24Hours(),
      bookingStatus: booking.status
    });
    return isBookingCreator && !isMatchInProgress() && !isMatchPassed() && isWithin24Hours() && booking.status !== "cancelled";
  };

  const handleSubmitScore = async (winner: 'A' | 'B', sets: { teamA: number; teamB: number }[]) => {
    if (!booking?.matchId || !token) return;

    try {
      await submitMatchScore(booking.matchId, winner, sets, token);
      showCustomAlert('✅ Risultato salvato!', 'Il risultato del match è stato registrato con successo');
      setScoreModalVisible(false);
      loadBooking();
    } catch (error: any) {
      throw error;
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    // Calcola l'importo del rimborso da mostrare
    const ownerEarnings = booking.price || 0;
    const maxPlayers = booking.match?.maxPlayers || 4;
    const confirmedPlayers = booking.match?.players?.filter((p: any) => p.status === "confirmed").length || 1;
    const refundPerPlayer = ownerEarnings / confirmedPlayers;

    showCustomAlert(
      "Annulla Prenotazione",
      `Sei sicuro di voler annullare questa prenotazione?\n\nRiceverai un rimborso fittizio di €${refundPerPlayer.toFixed(2)}.\n\nQuesta azione non può essere annullata.`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Sì, Annulla",
          style: "destructive",
          onPress: async () => {
            try {
              setCancellingBooking(true);
              const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Errore durante la cancellazione");
              }

              showCustomAlert(
                "Prenotazione Annullata", 
                `La prenotazione è stata annullata con successo.\n\nRimborso: €${refundPerPlayer.toFixed(2)}`, 
                [
                  { text: "OK", onPress: () => navigation.goBack() }
                ]
              );
            } catch (error: any) {
              showCustomAlert("Errore", error.message || "Impossibile annullare la prenotazione");
            } finally {
              setCancellingBooking(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenGroupChat = async () => {
    const matchId = booking?.matchId;
    if (!matchId || matchId === "undefined") {
      Alert.alert("Errore", "Match non disponibile");
      return;
    }

    try {
      setLoadingGroupChat(true);
      const res = await fetch(`${API_URL}/api/conversations/match/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore caricamento chat");
      }

      const conversation = await res.json();
      navigation.navigate("GroupChat", {
        conversationId: conversation._id,
        matchId: booking.matchId,
        headerInfo: {
          strutturaName: booking.campo?.struttura?.name,
          date: booking.date,
          startTime: booking.startTime,
          participantsCount: booking.match?.players?.length || 0,
          bookingId: booking._id,
        },
      });
    } catch (error: any) {
      showCustomAlert("Errore", error.message || "Impossibile aprire la chat di gruppo");
    } finally {
      setLoadingGroupChat(false);
    }
  };

  const handleOpenStrutturaChat = async () => {
    if (!booking?.campo?.struttura?._id) {
      Alert.alert("Errore", "Struttura non disponibile");
      return;
    }

    if (!token) {
      Alert.alert("Errore", "Effettua il login per chattare con la struttura");
      return;
    }

    try {
      const conversation = await openStrutturaChat(booking.campo.struttura._id, token);
      navigation.navigate("Chat", {
        conversationId: conversation._id,
        strutturaName: booking.campo.struttura.name,
        struttura: booking.campo.struttura,
      });
    } catch (error: any) {
      showCustomAlert("Errore", error.message || "Impossibile aprire la chat. Riprova più tardi.");
    }
  };

  const handleOpenStrutturaDetails = () => {
    if (!booking?.campo?.struttura?._id) {
      showCustomAlert("Errore", "Struttura non disponibile");
      return;
    }

    navigation.navigate("DettaglioStruttura", { struttura: booking.campo.struttura });
  };

  const handleAssignTeam = async (playerId: string, team: "A" | "B" | null) => {
    if (!booking?.matchId) return;

    // Calcola i conteggi attuali dei team
    const teamACount = booking.match?.players?.filter(p => p.team === "A").length || 0;
    const teamBCount = booking.match?.players?.filter(p => p.team === "B").length || 0;
    const maxPlayersPerTeam = booking.match?.maxPlayersPerTeam || 2;

    // Se il team target è pieno (ma non sovraffollato), mostra il modal di bilanciamento
    if (team && ((team === "A" && teamACount >= maxPlayersPerTeam) || (team === "B" && teamBCount >= maxPlayersPerTeam))) {
      setPlayerToAssign(playerId);
      setTargetTeam(team);
      setBalancingModalVisible(true);
      return;
    }

    // Procedi con l'assegnazione normale
    await performTeamAssignment(playerId, team);
  };

  const performTeamAssignment = async (playerId: string, team: "A" | "B" | null) => {
    try {
      const res = await fetch(`${API_URL}/matches/${booking!.matchId}/players/${playerId}/team`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ team }),
      });

      if (!res.ok) {
        const error = await res.json();
        // Gestione specifica per team sovraffollato
        if (error.overcrowdedTeam) {
          Alert.alert(
            "Team Sovraffollato",
            `${error.message}\n\nTeam ${error.overcrowdedTeam}: ${error.currentCount}/${error.maxAllowed} giocatori`,
            [
              { text: "OK", style: "default" }
            ]
          );
        } else {
          Alert.alert("Errore", error.message || "Errore assegnazione team");
        }
        return;
      }

      // Aggiorna solo lo stato locale senza ricaricare tutto
      setBooking(prevBooking => {
        if (!prevBooking) return prevBooking;

        return {
          ...prevBooking,
          match: prevBooking.match ? {
            ...prevBooking.match,
            players: prevBooking.match.players.map(p =>
              p.user._id === playerId
                ? { ...p, team }
                : p
            )
          } : null
        };
      });
    } catch (error: any) {
      Alert.alert("Errore", error.message || "Impossibile assegnare il giocatore");
    }
  };

  const handlePlayerToMoveSelection = async (playerToMoveId: string) => {
    if (!playerToAssign || !targetTeam || !booking?.matchId) return;

    try {
      // Prima sposta il giocatore selezionato al team opposto
      const oppositeTeam = targetTeam === "A" ? "B" : "A";
      await performTeamAssignment(playerToMoveId, oppositeTeam);

      // Poi assegna il giocatore originale al team target
      await performTeamAssignment(playerToAssign, targetTeam);

      // Chiudi il modal
      setBalancingModalVisible(false);
      setPlayerToAssign(null);
      setTargetTeam(null);
    } catch (error) {
      console.error("Errore durante il bilanciamento:", error);
    }
  };

  const handleSearchUsers = async (query: string) => {
    if (query.length < 2 || !booking?.matchId) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch followed and public users in parallel
      const [followedRes, publicRes] = await Promise.allSettled([
        fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}&filter=followed`, { headers }),
        fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}&filter=public`, { headers })
      ]);

      let followedUsers: any[] = [];
      if (followedRes.status === 'fulfilled' && followedRes.value.ok) {
        followedUsers = await followedRes.value.json();
      }

      let publicUsers: any[] = [];
      if (publicRes.status === 'fulfilled' && publicRes.value.ok) {
        publicUsers = await publicRes.value.json();
      }

      // Merge: followed first, then public, remove duplicates
      const userMap = new Map();
      followedUsers.forEach((u: any) => userMap.set(u._id, { ...u, isFollowed: true }));
      publicUsers.forEach((u: any) => {
        if (!userMap.has(u._id)) userMap.set(u._id, { ...u, isFollowed: false });
      });
      const merged = Array.from(userMap.values());

      // Filter out users already in the match
      const alreadyInMatch = booking.match?.players?.map((p: any) => p.user._id) || [];
      const filtered = merged.filter((u: any) => !alreadyInMatch.includes(u._id));

      setSearchResults(filtered);
    } catch (error) {
      console.error("Errore ricerca:", error);
      setSearchResults([]);
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

      // Update local state instead of reloading
      const invitedUser = searchResults.find(user => user.username === username);
      if (invitedUser) {
        updateBookingState((prevBooking) => ({
          ...prevBooking,
          match: {
            ...prevBooking.match,
            players: [
              ...prevBooking.match.players,
              {
                user: invitedUser,
                status: 'pending',
                team: inviteToTeam || null,
              }
            ]
          }
        }));
      }

      showCustomAlert("✅ Invito inviato!", "L'utente è stato invitato al match");
      setInviteModalVisible(false);
      setSearchQuery("");
      setSearchResults([]);
      setInviteToTeam(null);
      setInviteToSlot(null);
    } catch (error: any) {
      showCustomAlert("Errore", error.message);
    }
  };

  const handleRespondToInvite = async (response: "accept" | "decline", team?: "A" | "B") => {
    if (!booking?.matchId) return;

    if (response === "accept" && booking.match?.maxPlayers && booking.match?.maxPlayers > 2 && !team) {
      setTeamSelectionMode("invite");
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

      // Update local state instead of reloading
      updateBookingState((prevBooking) => ({
        ...prevBooking,
        match: {
          ...prevBooking.match,
          players: prevBooking.match.players.map(p =>
            p.user._id === getUserId(user)
              ? { ...p, status: response === "accept" ? "confirmed" : "declined", team: team || p.team }
              : p
          )
        }
      }));

      // La notifica viene ora creata automaticamente dal backend
      console.log('📤 [Frontend] Notifica all\'organizzatore verrà creata dal backend');

      setTeamSelectionModalVisible(false);
      
      if (response === "accept") {
        showCustomAlert("✅ Invito accettato!", "Ti sei unito al match con successo");
      } else {
        showCustomAlert("Invito rifiutato", "Hai rifiutato l'invito al match");
      }
    } catch (error: any) {
      showCustomAlert("Errore", error.message);
    } finally {
      setAcceptingInvite(false);
    }
  };

  const handleSelectTeamForInvite = (team: "A" | "B") => {
    if (teamSelectionMode === "join") {
      handleJoinMatch(team);
    } else {
      handleRespondToInvite("accept", team);
    }
    setTeamSelectionModalVisible(false);
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!booking?.matchId) return;

    showCustomAlert(
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

              // Update local state instead of reloading
              updateBookingState((prevBooking) => ({
                ...prevBooking,
                match: {
                  ...prevBooking.match,
                  players: prevBooking.match.players.filter(p => p.user._id !== playerId)
                }
              }));
            } catch (error: any) {
              showCustomAlert("Errore", error.message);
            }
          }
        }
      ]
    );
  };

  const handleJoinMatch = async (team?: "A" | "B") => {
    if (!booking?.matchId) return;

    if (!isRegistrationOpen()) {
      showCustomAlert(
        "Registrazione chiusa",
        "La deadline per le registrazioni è passata. Non è più possibile unirsi al match."
      );
      return;
    }

    if (!team && booking.match?.maxPlayers && booking.match?.maxPlayers > 2) {
      setTeamSelectionMode("join");
      setTeamSelectionModalVisible(true);
      return;
    }

    // Alert di conferma per unione via slot
    if (team) {
      showCustomAlert(
        "Conferma unione",
        `Vuoi unirti al Team ${team}?`,
        [
          { text: "Annulla", style: "cancel" },
          {
            text: "Sì, Unisciti",
            onPress: () => performJoinMatch(team)
          }
        ]
      );
      return;
    }

    // Per il pulsante generale senza team specificato
    await performJoinMatch(team);
  };

  const performJoinMatch = async (team?: "A" | "B") => {
    try {
      const res = await fetch(`${API_URL}/matches/${booking!.matchId}/join`, {
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

      // Update local state instead of reloading
      updateBookingState((prevBooking) => ({
        ...prevBooking,
        match: {
          ...prevBooking.match,
          players: [
            ...prevBooking.match.players,
            {
              user: user,
              status: 'confirmed',
              team: team || null,
            }
          ]
        }
      }));

      showCustomAlert("✅ Match unito!", "Ti sei unito al match con successo");
    } catch (error: any) {
      showCustomAlert("Errore", error.message);
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

      // Update local state instead of reloading
      updateBookingState((prevBooking) => ({
        ...prevBooking,
        match: {
          ...prevBooking.match,
          players: prevBooking.match.players.filter(p => p.user._id !== getUserId(user))
        }
      }));

      showCustomAlert("Match abbandonato", "Hai lasciato il match");
    } catch (error: any) {
      showCustomAlert("Errore", error.message);
    } finally {
      setLeavingMatch(false);
    }
  };

  const handleInviteToTeam = (team: "A" | "B", slotNumber: number) => {
    if (isMatchInProgress()) {
      showCustomAlert(
        "Match in corso",
        "Non è possibile invitare giocatori durante il match. Attendi la fine della partita."
      );
      return;
    }
    if (!isRegistrationOpen()) {
      showCustomAlert(
        "Registrazione chiusa",
        "La deadline per le registrazioni è passata. Non è più possibile invitare giocatori."
      );
      return;
    }
    setInviteToTeam(team);
    setInviteToSlot(slotNumber);
    setInviteModalVisible(true);
  };

  const handleOpenMaps = () => {
    if (!booking?.campo?.struttura?.location) return;

    const { address, city } = booking.campo.struttura.location;
    const query = address ? `${address}, ${city}` : city;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    
    Linking.openURL(url).catch(err => {
      showCustomAlert("Errore", "Impossibile aprire Google Maps");
      console.error("Errore apertura Maps:", err);
    });
  };

  const openUserProfile = (userId?: string) => {
    if (!userId || userId === user?.id) return;
    navigation.navigate("ProfiloUtente", { userId });
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

  const getMatchStatusInfo = () => {
    const match = booking.match;
    if (!match) return { color: "#999", text: "Nessun Match", icon: "help-circle" as const };

    const effectiveStatus = getMatchStatus();

    // Verifica se il match è in corso
    if (effectiveStatus === "in_progress") {
      return { color: "#FF9800", text: "In Corso", icon: "play-circle" as const };
    }

    switch (effectiveStatus) {
      case "completed":
        return { color: "#4CAF50", text: "Conclusa", icon: "checkmark-circle" as const };
      case "cancelled":
        return { color: "#F44336", text: "Cancellata", icon: "close-circle" as const };
      case "full":
        return { color: "#FF9800", text: "Completa", icon: "people" as const };
      case "not_team_completed":
        return { color: "#FFC107", text: "Disponibile", icon: "people-outline" as const };
      case "not_completed":
        return { color: "#FF9800", text: "Da Completare", icon: "alert-circle" as const };
      case "open":
        return { color: "#2196F3", text: "Aperta", icon: "radio-button-on" as const };
      default:
        return { color: "#999", text: effectiveStatus, icon: "help-circle" as const };
    }
  };

  const getMatchStatus = () => {
    const match = booking.match;
    if (!match) return "open"; // Dovrebbe sempre esserci un match

    const confirmedPlayers = match.players?.filter(p => p.status === "confirmed").length || 0;
    const isPublic = match.isPublic;
    const teamsIncomplete = confirmedPlayers < match.maxPlayers;

    // Se il match è in corso
    if (isMatchInProgress() && match.status !== "completed" && match.status !== "cancelled") {
      // Se è pubblico con team incompleti → cancellato
      if (isPublic && teamsIncomplete) {
        return "cancelled";
      }
      return "in_progress";
    }

    // Se il match è passato
    if (isMatchPassed() && match.status !== "cancelled") {
      // Se è una partita PUBBLICA e i team non erano completi, non si è svolta
      if (isPublic && teamsIncomplete) {
        return "cancelled";
      }
      
      // Per partite PRIVATE o pubbliche con team completi:
      // Se non c'è punteggio, può essere completato
      if (!match.score || match.score.sets.length === 0) {
        return "not_completed";
      }
      
      // Se c'è il punteggio, è completato
      if (match.score && match.score.sets.length > 0) {
        return "completed";
      }
    }

    // Se il match non è ancora iniziato e i team non sono completi
    if (!isMatchPassed() && match.status === "open") {
      if (teamsIncomplete) {
        return "not_team_completed";
      }
    }

    return match.status;
  };

  console.log('🔍 [isCreator Debug]:', {
    userId: getUserId(user),
    userUsername: user?.username,
    userEmail: user?.email,
    createdBy: booking?.match?.createdBy,
    isCreator,
  });

  console.log('User status check:', {
    isCreator,
    currentUserPlayer: currentUserPlayer?.status,
    isPendingInvite,
    isDeclined,
    isConfirmed,
    isInMatch
  });

  const renderMatchSection = () => {
  // IL MATCH ESISTE SEMPRE - NON SERVE CONTROLLO
  const match = booking.match;
  const effectiveStatus = getMatchStatus();
  
  const statusInfo = getMatchStatusInfo();
  const canInvite = isCreator && effectiveStatus !== "completed" && effectiveStatus !== "cancelled" && effectiveStatus !== "not_completed" && effectiveStatus !== "in_progress" && isRegistrationOpen();
  // const canJoin = !isInMatch && match.status === "open" && isRegistrationOpen(); // Ora definito globalmente
  // Tutti i giocatori confermati possono inserire il risultato dopo la fine del match
  const canSubmitScore = isInMatch && isMatchPassed() && effectiveStatus !== "cancelled";

  return (
    <AnimatedCard delay={200} style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <FadeInView delay={300}>
          <Text style={styles.cardTitle}>Match Details</Text>
        </FadeInView>
        
        <View style={styles.matchHeaderActions}>
          {booking.hasMatch && (
            <AnimatedButton
              style={styles.groupChatButton}
              onPress={handleOpenGroupChat}
              disabled={loadingGroupChat}
            >
              {loadingGroupChat ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="chatbubbles" size={18} color="white" />
                  <Text style={styles.groupChatButtonText}>Chat Partita</Text>
                </>
              )}
            </AnimatedButton>
          )}
        </View>
      </View>

      {/* Match Status - Nascosto se la partita è passata, conclusa o cancellata */}
      {effectiveStatus !== "completed" && effectiveStatus !== "cancelled" && !isMatchPassed() && (
        <FadeInView delay={400}>
          <View style={styles.matchStatusCard}>
            <View style={styles.matchStatusRow}>
              <View style={styles.matchStatusLeft}>
                <View style={[styles.matchStatusIcon, { backgroundColor: statusInfo.color + '20' }]}>
                  <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
                </View>
                <Text style={styles.matchStatusTitle}>Stato Partita</Text>
              </View>
              <View style={[
                styles.matchStatusBadge,
                match.status === "completed" && styles.matchStatusCompleted,
                match.status === "open" && styles.matchStatusOpen,
                match.status === "full" && styles.matchStatusFull,
                match.status === "cancelled" && styles.matchStatusCancelled,
                effectiveStatus === "in_progress" && styles.matchStatusInProgress,
              ]}>
                <Text style={styles.matchStatusText}>{statusInfo.text}</Text>
              </View>
            </View>

            <View style={styles.matchStatsCompact}>
            <View style={styles.matchStatItem}>
              <View style={[styles.matchStatIcon, { backgroundColor: '#E8F5E920' }]}>
                <Ionicons name="people" size={12} color="#4CAF50" />
              </View>
              <Text style={styles.matchStatText}>{confirmedPlayers.length}/{match.maxPlayers}</Text>
            </View>

            {pendingPlayers.length > 0 && (
              <View style={styles.matchStatItem}>
                <View style={[styles.matchStatIcon, { backgroundColor: '#FFF3E020' }]}>
                  <Ionicons name="time" size={12} color="#FF9800" />
                </View>
                <Text style={styles.matchStatText}>{pendingPlayers.length}</Text>
              </View>
            )}

            <View style={styles.matchStatItem}>
              <View style={[styles.matchStatIcon, { backgroundColor: '#2196F320' }]}>
                <Ionicons name="hourglass" size={12} color="#2196F3" />
              </View>
              <View>
                <Text style={[styles.matchStatText, { fontSize: 10, color: '#666', marginBottom: 2 }]}>
                  Chiusura prenotazione
                </Text>
                <Text style={styles.matchStatText}>
                  {getTimeUntilRegistrationDeadline() || 'Chiusa'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </FadeInView>
      )}

      {/* Pending Invite Card */}
      {isPendingInvite && (
        <ScaleInView delay={500}>
          <LinearGradient
            colors={['#FFF8E1', '#FFECB3', '#FFE082']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pendingInviteCard}
          >
            {/* Icon decorativo in background */}
            <View style={styles.pendingInviteBackgroundIcon}>
              <Ionicons name="mail-open-outline" size={120} color="rgba(255, 193, 7, 0.08)" />
            </View>

            {/* Header con animazione */}
            <FadeInView delay={600}>
              <View style={styles.pendingInviteHeader}>
                <View style={styles.pendingInviteIconContainer}>
                  <LinearGradient
                    colors={['#FF9800', '#F57C00']}
                    style={styles.pendingInviteIconGradient}
                  >
                    <Ionicons name="mail" size={24} color="white" />
                  </LinearGradient>
                </View>
                <View style={styles.pendingInviteTitleContainer}>
                  <Text style={styles.pendingInviteTitle}>Invito al Match</Text>

                </View>
              </View>
            </FadeInView>

            {/* Messaggio */}
            <FadeInView delay={700}>
              <View style={styles.pendingInviteMessageBox}>
                <Ionicons name="information-circle" size={18} color="#F57F17" />
                <Text style={styles.pendingInviteText}>
                  Sei stato invitato a partecipare a questo match. Accetta l'invito per confermare la tua presenza.
                </Text>
              </View>
            </FadeInView>

            {/* Azioni con gradienti */}
            <SlideInView delay={800} from="bottom">
              <View style={styles.pendingInviteActions}>
                <AnimatedButton
                  style={styles.pendingAcceptButton}
                  onPress={() => handleRespondToInvite("accept")}
                  disabled={acceptingInvite}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#388E3C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.pendingButtonGradient}
                  >
                    {acceptingInvite ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <View style={styles.pendingButtonIconCircle}>
                          <Ionicons name="checkmark" size={18} color="white" />
                        </View>
                        <Text style={styles.pendingAcceptButtonText}>Accetta Invito</Text>
                      </>
                    )}
                  </LinearGradient>
                </AnimatedButton>

                <AnimatedButton
                  style={styles.pendingDeclineButton}
                  onPress={() => handleRespondToInvite("decline")}
                  disabled={acceptingInvite}
                >
                  <View style={styles.pendingDeclineButtonContent}>
                    <Ionicons name="close" size={18} color="#666" />
                    <Text style={styles.pendingDeclineButtonText}>Rifiuta</Text>
                  </View>
                </AnimatedButton>
              </View>
            </SlideInView>
          </LinearGradient>
        </ScaleInView>
      )}

      {/* Score Display */}
      {match.score && match.score.sets.length > 0 && (
        <FadeInView delay={600}>
          <ScoreDisplay
            score={match.score}
            isInMatch={isInMatch}
            onEdit={() => setScoreModalVisible(true)}
            matchStatus={getMatchStatus()}
            teamAPlayers={teamAConfirmed}
            teamBPlayers={teamBConfirmed}
            showEditLabel={isCreator && getMatchStatus() !== "cancelled"}
          />
        </FadeInView>
      )}

      {/* Score Actions */}
      {canSubmitScore && (!match.score || match.score.sets.length === 0) && (
        <FadeInView delay={700}>
          <View style={styles.scoreActionsContainer}>
            <AnimatedButton onPress={() => {
              if (unassignedPlayers.length > 0) {
                showCustomAlert(
                  "Giocatori non assegnati",
                  "Prima di inserire il risultato, tutti i giocatori devono essere assegnati a un team.",
                  [{ text: "OK" }]
                );
                return;
              }
              setScoreModalVisible(true);
            }}>
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
                <Text style={[styles.teamTitle, { color: "white" }]}>
                  Team A ({getTeamFormationLabel(booking?.match?.maxPlayers || 4)})
                </Text>
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
                        currentUserId={getUserId(user)}
                        onRemove={() => player && handleRemovePlayer(player.user._id)}
                        onChangeTeam={(team) => player && handleAssignTeam(player.user._id, team)}
                        onLeave={handleLeaveMatch}
                        currentTeam="A"
                        isEmptySlot={!player}
                        onInviteToSlot={!player ? (isCreator ? () => handleInviteToTeam("A", slotNumber) : () => handleJoinMatch("A")) : undefined}
                        slotNumber={slotNumber}
                        matchStatus={getMatchStatus()}
                        isOrganizer={player?.user?._id === booking.match?.createdBy?._id}
                        teamACount={teamAPlayers}
                        teamBCount={teamBPlayers}
                        maxPlayersPerTeam={maxPlayersPerTeam}
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
                <Text style={[styles.teamTitle, { color: "white" }]}>
                  Team B ({getTeamFormationLabel(booking?.match?.maxPlayers || 4)})
                </Text>
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
                        currentUserId={getUserId(user)}
                        onRemove={() => player && handleRemovePlayer(player.user._id)}
                        onChangeTeam={(team) => player && handleAssignTeam(player.user._id, team)}
                        onLeave={handleLeaveMatch}
                        currentTeam="B"
                        isEmptySlot={!player}
                        onInviteToSlot={!player ? (isCreator ? () => handleInviteToTeam("B", slotNumber) : () => handleJoinMatch("B")) : undefined}
                        slotNumber={slotNumber}
                        matchStatus={getMatchStatus()}
                        isOrganizer={player?.user?._id === booking.match?.createdBy?._id}
                        teamACount={teamAPlayers}
                        teamBCount={teamBPlayers}
                        maxPlayersPerTeam={maxPlayersPerTeam}
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
                    currentUserId={getUserId(user)}
                    onRemove={() => handleRemovePlayer(player.user._id)}
                    onChangeTeam={(team) => handleAssignTeam(player.user._id, team)}
                    matchStatus={getMatchStatus()}
                    isOrganizer={player?.user?._id === booking.match?.createdBy?._id}
                    teamACount={teamAPlayers}
                    teamBCount={teamBPlayers}
                    maxPlayersPerTeam={maxPlayersPerTeam}
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
                    currentUserId={getUserId(user)}
                    onRemove={() => handleRemovePlayer(player.user._id)}
                    onChangeTeam={(team) => handleAssignTeam(player.user._id, team)}
                    isPending={true}
                    matchStatus={getMatchStatus()}
                    isOrganizer={player?.user?._id === booking.match?.createdBy?._id}
                    teamACount={teamAPlayers}
                    teamBCount={teamBPlayers}
                    maxPlayersPerTeam={maxPlayersPerTeam}
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
      {/* Header fisso con back button e status */}
      <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
        <View style={{ 
          paddingHorizontal: 16, 
          paddingVertical: 16, 
          flexDirection: 'row', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <View style={{ width: 40 }}>
            <AnimatedButton 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#2196F3" />
            </AnimatedButton>
          </View>
          
          <Text style={[styles.headerTitle, { flex: 1, textAlign: 'center' }]}> 
            {fromOpenMatch
              ? 'Partita Aperta Disponibile'
              : (booking.status === 'confirmed'
                  ? (isMatchInProgress()
                      ? 'Partita in Corso'
                      : (isMatchPassed() ? 'Partita Conclusa' : 'Prossima Partita'))
                  : 'Cancellata')}
          </Text>

          {canCancelBooking() ? (
            <Pressable
              onPress={handleCancelBooking}
              disabled={cancellingBooking}
              style={styles.headerCancelButton}
              hitSlop={10}
            >
              <Ionicons name="trash-outline" size={22} color="#F44336" />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 100 }}
      >
        {/* Campo Info Card - Versione compatta */}
        <AnimatedCard delay={100}>
          <View style={styles.fieldInfoCard}>
            <View style={styles.fieldInfoHeader}>
              <Ionicons name="location-sharp" size={20} color="#FF9800" />
              <Text style={styles.fieldInfoTitle}>Dove giochi</Text>
            </View>
            
            <View style={styles.fieldInfoList}>
              {/* Struttura */}
              <FadeInView delay={200}>
                <Pressable style={styles.fieldInfoRow} onPress={handleOpenStrutturaDetails}>
                  <View style={styles.fieldIconCircle}>
                    <Ionicons name="business" size={18} color="#2196F3" />
                  </View>
                  <View style={styles.fieldInfoContent}>
                    <Text style={styles.fieldInfoLabel}>STRUTTURA</Text>
                    <Text style={styles.fieldInfoValue}>{booking.campo.struttura.name}</Text>
                  </View>
                  <Pressable 
                    style={styles.chatIconButton}
                    onPress={handleOpenStrutturaChat}
                    hitSlop={10}
                  >
                    <Ionicons name="chatbubble-outline" size={20} color="#2196F3" />
                  </Pressable>
                </Pressable>
              </FadeInView>

              <View style={styles.fieldInfoDivider} />

              {/* Sport e Campo - Due colonne */}
              <View style={styles.sportCampoGrid}>
                <FadeInView delay={300} style={styles.sportCampoColumn}>
                  <View style={styles.sportCampoBox}>
                    <View style={[styles.fieldIconCircle, { backgroundColor: '#FFF3E0' }]}>
                      {(booking.campo.sport === 'beach_volley' || booking.campo.sport === 'beach volley' || booking.campo.sport === 'volley') ? (
                        <FontAwesome5 name="volleyball-ball" size={18} color="#FF9800" />
                      ) : (
                        <Ionicons 
                          name={
                            booking.campo.sport === 'calcio' ? 'football' :
                            booking.campo.sport === 'tennis' ? 'tennisball' :
                            booking.campo.sport === 'basket' ? 'basketball' : 'barbell'
                          } 
                          size={18} 
                          color="#FF9800" 
                        />
                      )}
                    </View>
                    <View style={styles.fieldInfoContent}>
                      <Text style={styles.fieldInfoLabel}>SPORT</Text>
                      <Text style={styles.fieldInfoValue}>
                        {(booking.campo.sport === 'beach_volley' || booking.campo.sport === 'beach volley')
                          ? 'Beach Volley' 
                          : booking.campo.sport.charAt(0).toUpperCase() + booking.campo.sport.slice(1)}
                      </Text>
                    </View>
                  </View>
                </FadeInView>

                <FadeInView delay={350} style={styles.sportCampoColumn}>
                  <View style={styles.sportCampoBox}>
                    <View style={[styles.fieldIconCircle, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="grid-outline" size={18} color="#4CAF50" />
                    </View>
                    <View style={styles.fieldInfoContent}>
                      <Text style={styles.fieldInfoLabel}>CAMPO</Text>
                      <Text style={styles.fieldInfoValue}>{booking.campo.name}</Text>
                    </View>
                  </View>
                </FadeInView>
              </View>

              <View style={styles.fieldInfoDivider} />

              {/* Località - Cliccabile */}
              <FadeInView delay={400}>
                <View style={styles.fieldInfoRow}>
                  <View style={[styles.fieldIconCircle, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="location" size={18} color="#2196F3" />
                  </View>
                  <View style={styles.fieldInfoContent}>
                    <Text style={styles.fieldInfoLabel}>LOCALITÀ</Text>
                    <View style={styles.locationRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldInfoValue}>{booking.campo.struttura.location.city}</Text>
                        {booking.campo.struttura.location.address && (
                          <Text style={styles.fieldInfoSubValue}>{booking.campo.struttura.location.address}</Text>
                        )}
                      </View>
                      <Pressable 
                        style={styles.mapButton}
                        onPress={handleOpenMaps}
                        android_ripple={{ color: 'rgba(156, 39, 176, 0.1)', radius: 40 }}
                      >
                        <Ionicons name="navigate" size={14} color="#2196F3" />
                        <Text style={styles.mapButtonText}>Indicazioni</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </FadeInView>
            </View>
          </View>
        </AnimatedCard>

        <AnimatedCard delay={150}>
          <BookingDetailsCard
            date={booking.date}
            startTime={booking.startTime}
            endTime={booking.endTime}
            duration={calculateDuration(booking.startTime, booking.endTime)}
            price={booking.price}
            createdAt={booking.createdAt}
            isPublic={booking.match?.isPublic}
            displayPrice={
              (() => {
                if (booking.paymentMode === 'full') {
                  // Pagamento full: prezzo fisso
                  return undefined;
                }
                // Pagamento split
                const splitCount = booking.numberOfPeople || booking.match?.maxPlayers || 1;
                const quota = booking.price / splitCount;
                const confirmedCount = confirmedPlayers.length;
                const remainingPrice = booking.price - (confirmedCount * quota);
                console.log('💰 Prezzo calc:', {
                  paymentMode: booking.paymentMode,
                  totalPrice: booking.price,
                  splitCount,
                  quota,
                  confirmedCount,
                  remainingPrice,
                  isCreator
                });
                return isCreator ? remainingPrice : quota;
              })()
            }
          />
        </AnimatedCard>

        {/* CTA Join Match - Solo per chi non è nel match e la registrazione è aperta */}
        {!isInMatch && booking.match?.status === "open" && isRegistrationOpen() && (
          <AnimatedCard delay={180}>
            <Pressable 
              style={styles.joinMatchCTA}
              onPress={() => handleJoinMatch()}
            >
              <View style={styles.joinMatchCTAContent}>
                <View style={styles.joinMatchCTAIconContainer}>
                  <Ionicons name="people" size={24} color="#fff" />
                </View>
                <View style={styles.joinMatchCTATextContainer}>
                  <Text style={styles.joinMatchCTATitle}>Unisciti a questa partita!</Text>
                  <Text style={styles.joinMatchCTASubtitle}>
                    {confirmedPlayers.length}/{booking.match?.maxPlayers || 0} giocatori • {
                      (booking.match?.maxPlayers || 0) - confirmedPlayers.length
                    } posti disponibili • {getTimeUntilRegistrationDeadline()} rimasti
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={28} color="#fff" />
              </View>
            </Pressable>
          </AnimatedCard>
        )}

        {renderMatchSection()}

        {/* Cancel Booking Button - Only for organizer */}
        {canCancelBooking() && (
          <AnimatedCard delay={2000} style={styles.cancelCard}>
            <AnimatedButton style={styles.cancelButton} onPress={handleCancelBooking} disabled={cancellingBooking}>
              {cancellingBooking ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color="white" />
                  <Text style={styles.cancelButtonText}>Annulla Prenotazione</Text>
                </>
              )}
            </AnimatedButton>
          </AnimatedCard>
        )}
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
            <View style={[styles.modalHeader, { backgroundColor: getTeamColors(inviteToTeam).primary }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons 
                  name={getTeamIcon(inviteToTeam)} 
                  size={24} 
                  color="white" 
                  style={{ marginRight: 12 }} 
                />
                <Text style={styles.modalTitle}>
                  {inviteToTeam ? `Invita a Team ${inviteToTeam}` : 'Invita Giocatore'}
                  {inviteToSlot && ` - Slot ${inviteToSlot}`}
                </Text>
              </View>
              <AnimatedButton onPress={() => {
                setInviteModalVisible(false);
                setInviteToTeam(null);
                setInviteToSlot(null);
              }} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="white" />
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
                      onPress={() => {
                        if (suppressInvitePress.current) {
                          suppressInvitePress.current = false;
                          return;
                        }
                        handleInvitePlayer(user.username);
                      }}
                    >
                      <Pressable
                        key="avatar"
                        onPress={() => openUserProfile(user._id)}
                        hitSlop={10}
                        onPressIn={() => {
                          suppressInvitePress.current = true;
                        }}
                        onPressOut={() => {
                          setTimeout(() => {
                            suppressInvitePress.current = false;
                          }, 150);
                        }}
                      >
                        {user.avatarUrl ? (
                          <Image
                            source={{ uri: resolveAvatarUrl(user.avatarUrl) || "" }}
                            style={styles.resultAvatar}
                          />
                        ) : (
                          <View style={styles.resultAvatarPlaceholder}>
                            <Ionicons name="person" size={20} color="#999" />
                          </View>
                        )}
                      </Pressable>
                      <View key="info" style={styles.resultInfo}>
                        <Text style={styles.resultName}>{user.name} {user.surname}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.resultUsername, { color: getTeamColors(inviteToTeam).primary }]}>@{user.username}</Text>
                          {user.isFollowed && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 5 }}>
                              <Ionicons name="person" size={14} color="#FF9800" />
                              <Text style={{ fontSize: 12, color: '#FF9800', marginLeft: 2 }}>Following</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Ionicons key="add" name="add-circle" size={24} color={getTeamColors(inviteToTeam).primary} />
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
        maxPlayers={booking?.match?.maxPlayers || 4}
        costPerPlayer={
          (() => {
            const cost = booking?.match?.isPublic && !isCreator
              ? booking.price / booking.match.maxPlayers
              : undefined;
            console.log('🧮 [TeamSelectionModal] costPerPlayer calc:', {
              isPublic: booking?.match?.isPublic,
              isCreator,
              isCostSplittingEnabled: booking?.campo?.struttura?.isCostSplittingEnabled,
              price: booking?.price,
              maxPlayers: booking?.match?.maxPlayers,
              cost
            });
            return cost;
          })()
        }
      />

      {/* Score Modal */}
      {booking?.match && (
        <ScoreModal
          visible={scoreModalVisible}
          onClose={() => setScoreModalVisible(false)}
          onSave={handleSubmitScore}
          currentScore={booking.match?.score}
          matchStatus={booking.match?.status}
          teamAPlayers={teamAConfirmed}
          teamBPlayers={teamBConfirmed}
        />
      )}

      {/* Team Balancing Modal */}
      <Modal
        visible={balancingModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setBalancingModalVisible(false);
          setPlayerToAssign(null);
          setTargetTeam(null);
        }}
      >
        <View style={styles.centeredModalOverlay}>
          <ScaleInView style={styles.balancingModal}>
            {/* Header con colore del team */}
            <View style={[
              styles.balancingModalHeader,
              targetTeam === "A" ? styles.teamAHeader : styles.teamBHeader
            ]}>
              <Ionicons
                name="swap-horizontal"
                size={24}
                color="white"
              />
              <Text style={styles.balancingModalTitle}>Sposta un giocatore</Text>
            </View>

            <View style={styles.balancingModalContent}>
              <Text style={styles.balancingModalMessage}>
                Team {targetTeam} è pieno. Scegli chi spostare al Team {targetTeam === "A" ? "B" : "A"}:
              </Text>

              <ScrollView style={styles.playersList} showsVerticalScrollIndicator={false}>
                {booking?.match?.players
                  ?.filter(p => p.team === targetTeam)
                  .map(player => (
                    <Pressable
                      key={player.user._id}
                      style={[
                        styles.playerToMoveOption,
                        { borderLeftColor: targetTeam === "A" ? "#2196F3" : "#F44336" }
                      ]}
                      onPress={() => handlePlayerToMoveSelection(player.user._id)}
                    >
                      <View style={styles.playerToMoveInfo}>
                        <Image
                          source={{ uri: resolveAvatarUrl(player.user.avatar) }}
                          style={styles.playerToMoveAvatar}
                        />
                        <Text style={styles.playerToMoveName}>
                          {player.user.name} {player.user.surname}
                        </Text>
                      </View>
                      <View style={styles.playerToMoveArrow}>
                        <Ionicons name="arrow-forward" size={20} color="#007AFF" />
                      </View>
                    </Pressable>
                  ))}
              </ScrollView>
            </View>

            <View style={styles.balancingModalButtons}>
              <Pressable
                style={styles.balancingCancelButton}
                onPress={() => {
                  setBalancingModalVisible(false);
                  setPlayerToAssign(null);
                  setTargetTeam(null);
                }}
              >
                <Text style={styles.balancingCancelButtonText}>Annulla</Text>
              </Pressable>
            </View>
          </ScaleInView>
        </View>
      </Modal>

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
    </SafeAreaView>
  );
}
