import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  Modal,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../../config/api";
import { styles } from "../styles/DettaglioPrenotazioneOwnerScreen.styles";
import { Avatar } from "../../../components/Avatar";
import SportIcon from '../../../components/SportIcon';
import { resolveAvatarUrl } from "../../../utils/avatar";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAlert } from "../../../context/AlertContext";

// Componenti condivisi
import {
  AnimatedCard,
  AnimatedButton,
  FadeInView,
  SlideInView,
  ScaleInView,
  SuccessGradient,
  WarningGradient,
  WinnerGradient,
  TeamAGradient,
  TeamBGradient,
  BookingDetailsCard,
  calculateDuration,
  formatDate,
  FieldInfoCard,
} from "../../../components/booking";
import ScoreDisplay from "../../../components/booking/components/ScoreDisplay";
import TeamSection from "../../../components/booking/components/TeamSection";
import PlayerCardWithTeam from "../../../components/booking/components/PlayerCardWithTeam";
import ScoreModal from "../../../components/ScoreModal";
import { submitMatchScore } from "../../player/prenotazioni/DettaglioPrenotazione/utils/DettaglioPrenotazione.utils";

export default function OwnerDettaglioPrenotazioneScreen() {
  console.log('🔍 [Owner] OwnerDettaglioPrenotazioneScreen called');
  const { token, user } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { bookingId } = route.params;
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [loadingGroupChat, setLoadingGroupChat] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);

  // Score modal visibility (owner)
  const [scoreModalVisible, setScoreModalVisible] = useState(false);

  // Stati per il modal invite
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviteToTeam, setInviteToTeam] = useState<"A" | "B" | null>(null);
  const [inviteToSlot, setInviteToSlot] = useState<number | null>(null);
  const suppressInvitePress = useRef(false);

  // Debug log for modal visibility
  useEffect(() => {
    console.log('🔍 [Owner] inviteModalVisible changed to:', inviteModalVisible);
  }, [inviteModalVisible]);

  // Funzioni helper per match status
  const isMatchInProgress = () => {
    console.log('🔍 [Owner] isMatchInProgress called');
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
    console.log('🔍 [Owner] isMatchPassed called');
    if (!booking) return false;
    const now = new Date();
    const matchEndTime = new Date(`${booking.date}T${booking.endTime}`);
    return now > matchEndTime;
  };

  const getTimeUntilRegistrationDeadline = () => {
    console.log('🔍 [Owner] getTimeUntilRegistrationDeadline called');
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

  const getTeamFormationLabel = (maxPlayers: number) => {
    console.log('🔍 [Owner] getTeamFormationLabel called with maxPlayers:', maxPlayers);
    if (maxPlayers === 2) return "1v1";
    if (maxPlayers === 4) return "2v2";
    if (maxPlayers === 6) return "3v3";
    return `${maxPlayers/2}v${maxPlayers/2}`;
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
        return { color: "#4CAF50", text: "Completato", icon: "trophy" as const };
      case "cancelled":
        return { color: "#F44336", text: "Cancellato", icon: "close-circle" as const };
      case "full":
        return { color: "#4CAF50", text: "Completo", icon: "checkmark-circle" as const };
      case "not_team_completed":
        return { color: "#FF9800", text: "Team non completi", icon: "people" as const };
      case "not_completed":
        return { color: "#FF9800", text: "Non completato", icon: "time" as const };
      case "open":
        return { color: "#2196F3", text: "Aperto", icon: "people" as const };
      default:
        return { color: "#999", text: effectiveStatus, icon: "help-circle" as const };
    }
  };

  useEffect(() => {
    loadBooking();
  }, []);

  // Se la navigazione passa openScoreEntry, prova ad aprire il modal (stesse condizioni del pulsante)
  useEffect(() => {
    if (!route?.params?.openScoreEntry) return;

    // Solo se booking è caricato
    if (!booking || loading) return;

    const ownerOk = user?.role === 'owner';
    const passed = isMatchPassed();
    const match = booking.match;
    const noScore = !match?.score || match.score.sets.length === 0;
    const maxPerTeam = match ? Math.floor(match.maxPlayers / 2) : 0;
    const teamAConfirmedCnt = match?.players?.filter((p: any) => p.status === 'confirmed' && p.team === 'A').length || 0;
    const teamBConfirmedCnt = match?.players?.filter((p: any) => p.status === 'confirmed' && p.team === 'B').length || 0;
    const teamsComplete = teamAConfirmedCnt === maxPerTeam && teamBConfirmedCnt === maxPerTeam;

    if (ownerOk && passed && noScore && teamsComplete) {
      setScoreModalVisible(true);
    } else {
      let reason = '';
      if (!ownerOk) reason = "Devi essere l'owner per inserire il risultato.";
      else if (!passed) reason = 'La partita non è ancora conclusa.';
      else if (!noScore) reason = 'Risultato già presente.';
      else if (!teamsComplete) reason = 'I team non sono completi.';
      showAlert({ type: 'error', title: 'Impossibile inserire risultato', message: reason });
    }

    // Ripulisci il parametro per evitare riaperture
    navigation.setParams({ openScoreEntry: false });
  }, [route?.params?.openScoreEntry, booking, loading, user]);

  const loadBooking = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/bookings/owner/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("❌ Errore fetch booking:", res.status);
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ Booking caricato:", data);
      console.log("👤 User data:", data.user);
      console.log("📝 Username:", data.user?.username);
      
      // Add matchId for compatibility with search function
      data.matchId = data.match._id;
      
      setBooking(data);
    } catch (error) {
      console.error("❌ Errore caricamento booking:", error);
      showAlert({ type: 'error', title: 'Errore', message: 'Impossibile caricare i dettagli' });
      navigation.goBack();
    } finally {
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

  // Determina il tipo di sport per lo ScoreModal
  const getSportType = (campo?: any): string => {
    if (!campo) return 'beach_volley';
    
    // Se campo.sport è un oggetto con code
    if (typeof campo.sport === 'object' && campo.sport?.code) {
      return campo.sport.code;
    }
    
    // Se campo.sport è una stringa
    const sportStr = (campo.sport || '').toLowerCase();
    
    // Mappa le possibili varianti al codice corretto
    if (sportStr.includes('beach') && sportStr.includes('volley')) return 'beach_volley';
    if (sportStr === 'volley' || sportStr === 'volleyball') return 'volley';
    if (sportStr.includes('beach') && sportStr.includes('tennis')) return 'beach_tennis';
    if (sportStr === 'tennis') return 'tennis';
    if (sportStr === 'padel') return 'padel';
    if (sportStr === 'calcio') return 'calcio';
    if (sportStr === 'calcetto') return 'calcetto';
    if (sportStr === 'calciotto') return 'calciotto';
    if (sportStr.includes('calcio') && sportStr.includes('7')) return 'calcio_a_7';
    if (sportStr === 'basket' || sportStr === 'basketball') return 'basket';
    
    // Default: beach volley
    return 'beach_volley';
  };

  const isRegistrationOpen = () => {
    if (!booking) return false;
    const now = new Date();
    const matchStartTime = new Date(`${booking.date}T${booking.startTime}`);
    // Deadline: 45 minuti prima dell'inizio
    const deadlineTime = new Date(matchStartTime.getTime() - (45 * 60 * 1000));
    return now < deadlineTime;
  };

  const handleSearchUsers = async (query: string) => {
    console.log('🔍 [Owner] handleSearchUsers called with query:', query);
    console.log('🔍 [Owner] booking.matchId:', booking?.matchId);
    
    if (query.length < 2 || !booking?.matchId) {
      console.log('🔍 [Owner] Early return: query too short or no matchId');
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Get confirmed players IDs for followedBy
      const confirmedPlayers = booking?.match?.players?.filter((p: any) => p.status === "confirmed") || [];
      const followedByIds = confirmedPlayers.map((p: any) => p.user._id).join(',');

      console.log('🔍 [Owner] Fetching users...');
      
      // Fetch all users for owner
      const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}&filter=all&followedBy=${followedByIds}`, { headers });
      
      if (!res.ok) {
        console.log('🔍 [Owner] Search fetch failed:', res.status);
        setSearchResults([]);
        return;
      }
      
      const allUsers = await res.json();
      console.log('🔍 [Owner] All users:', allUsers.length);

      // Filter out users already in the match
      const alreadyInMatch = booking.match?.players?.map((p: any) => p.user._id) || [];
      console.log('🔍 [Owner] Already in match:', alreadyInMatch);
      const filtered = allUsers.filter((u: any) => !alreadyInMatch.includes(u._id));
      console.log('🔍 [Owner] Filtered users:', filtered.length);

      // Sort: prioritize followed users, then by name/surname match, then alphabetical
      const sorted = filtered.sort((a: any, b: any) => {
        if (a.isFollowed && !b.isFollowed) return -1;
        if (!a.isFollowed && b.isFollowed) return 1;
        
        // Prioritize names starting with query
        const queryLower = query.toLowerCase();
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aSurname = (a.surname || '').toLowerCase();
        const bSurname = (b.surname || '').toLowerCase();
        
        const aNameStarts = aName.startsWith(queryLower);
        const bNameStarts = bName.startsWith(queryLower);
        if (aNameStarts && !bNameStarts) return -1;
        if (!aNameStarts && bNameStarts) return 1;
        
        // Then surnames starting with query
        const aSurnameStarts = aSurname.startsWith(queryLower);
        const bSurnameStarts = bSurname.startsWith(queryLower);
        if (aSurnameStarts && !bSurnameStarts) return -1;
        if (!aSurnameStarts && bSurnameStarts) return 1;
        
        // Finally, alphabetical by full name
        const nameA = (a.name || '') + ' ' + (a.surname || '');
        const nameB = (b.name || '') + ' ' + (b.surname || '');
        return nameA.localeCompare(nameB);
      });

      setSearchResults(sorted);
    } catch (error) {
      console.error("❌ [Owner] Errore ricerca:", error);
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
                status: 'confirmed', // Owner invites are automatically confirmed
                team: inviteToTeam || null,
              }
            ]
          }
        }));
      }

      showAlert({ type: 'success', title: 'Invito inviato!', message: "L'utente è stato invitato al match" });
      setInviteModalVisible(false);
      setSearchQuery("");
      setSearchResults([]);
      setInviteToTeam(null);
      setInviteToSlot(null);
    } catch (error: any) {
      showAlert({ type: 'error', title: 'Errore', message: error.message });
    }
  };

  // Apri il profilo utente (usato nella lista di ricerca inviti)
  const openUserProfile = (userId?: string) => {
    if (!userId || userId === user?.id || userId === (user as any)?._id) return;
    navigation.navigate('ProfiloUtente', { userId });
  };

  // Submit score (owner)
  const handleSubmitScore = async (winner: 'A' | 'B' | null, sets: { teamA: number; teamB: number }[]) => {
    if (!booking?.match?._id || !token) return;

    try {
      await submitMatchScore(booking.match._id, winner, sets, token);
      showAlert({ type: 'success', title: 'Risultato salvato!', message: 'Il risultato del match è stato registrato con successo' });
      setScoreModalVisible(false);
      loadBooking();
    } catch (error: any) {
      showAlert({ type: 'error', title: 'Errore', message: error.message || 'Impossibile salvare il risultato' });
      throw error;
    }
  };

  const handleRemovePlayer = async (playerUserId: string) => {
    if (!booking?.matchId) return;

    showAlert({
      type: 'warning',
      title: 'Rimuovi giocatore',
      message: 'Sei sicuro di voler rimuovere questo giocatore dal match?',
      buttons: [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rimuovi',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/matches/${booking.matchId}/players/${playerUserId}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Errore rimozione");
              }

              // Update local state instead of reloading
              updateBookingState((prevBooking) => ({
                ...prevBooking,
                match: {
                  ...prevBooking.match,
                  players: prevBooking.match.players.filter(p => p.user._id !== playerUserId)
                }
              }));

              showAlert({ type: 'success', title: 'Successo', message: 'Giocatore rimosso dal match' });
            } catch (error: any) {
              showAlert({ type: 'error', title: 'Errore', message: error.message });
            }
          },
        },
      ],
    });
  };

  const handleCancel = () => {
    showAlert({
      type: 'warning',
      title: 'Annulla prenotazione',
      message: 'Sei sicuro di voler annullare questa prenotazione? Il cliente verrà notificato.',
      buttons: [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sì, annulla',
          style: 'destructive',
          onPress: cancelBooking,
        },
      ],
    });
  };

  const cancelBooking = async () => {
    try {
      const res = await fetch(`${API_URL}/bookings/owner/${bookingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      showAlert({
        type: 'success',
        title: 'Successo',
        message: 'Prenotazione cancellata',
        buttons: [{ text: 'OK', onPress: () => navigation.goBack() }],
      });
    } catch {
      showAlert({ type: 'error', title: 'Errore', message: 'Impossibile cancellare la prenotazione' });
    }
  };

  const openMaps = () => {
    const address = `${booking.campo.struttura.location.address}, ${booking.campo.struttura.location.city}`;
    const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const openChat = async () => {
    try {
      console.log('💬 [OWNER] Apertura chat Owner (Struttura) → Cliente');
      console.log('👤 [OWNER] Cliente:', {
        userId: booking.user._id,
        userName: booking.user.name,
        userSurname: booking.user.surname,
      });
      console.log('🏢 [OWNER] Struttura:', {
        strutturaId: booking.campo.struttura._id,
        strutturaName: booking.campo.struttura.name
      });

      // Per gli owner, usiamo GET /api/conversations/user/:userId
      // Questo endpoint crea/ottiene una conversazione Owner (Struttura) → Cliente
      // IMPORTANTE: passiamo strutturaId per usare la struttura corretta della prenotazione
      console.log('📤 [OWNER] Richiesta conversazione Owner-Cliente');

      const res = await fetch(
        `${API_URL}/api/conversations/user/${booking.user._id}?strutturaId=${booking.campo.struttura._id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (!res.ok) {
        console.error('❌ [OWNER] Errore creazione conversazione:', res.status);
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ [OWNER] Error details:', errorData);
        throw new Error(errorData.message || 'Errore creazione conversazione');
      }

      const conversation = await res.json();
      console.log('✅ [OWNER] Conversazione Owner-Cliente ottenuta:', {
        conversationId: conversation._id,
        conversationType: conversation.type,
        struttura: conversation.struttura,
        user: conversation.user,
        owner: conversation.owner
      });

      // Per Owner→Cliente: mostra il nome del cliente nell'header
      const navigationParams = {
        conversationId: conversation._id,
        userName: `${booking.user.name} ${booking.user.surname || ''}`.trim(),
        userId: booking.user._id,
        userAvatar: booking.user.avatarUrl,
        // Passa la struttura per mostrare il suo avatar come mittente owner
        struttura: booking.campo.struttura,
        strutturaName: booking.campo.struttura.name,
        strutturaAvatar: booking.campo.struttura.images?.[0],
      };

      console.log('🚀 [OWNER] Navigazione a Chat con parametri:', navigationParams);

      navigation.navigate("Chat", navigationParams);
    } catch (error) {
      console.error("❌ [OWNER] Errore apertura chat:", error);
      showAlert({ type: 'error', title: 'Errore', message: 'Impossibile aprire la chat' });
    }
  };

  const goToInserisciRisultato = () => {
    navigation.navigate("InserisciRisultato", { bookingId });
  };

  const handleOpenGroupChat = async () => {
    if (!booking?.match?._id) {
      showAlert({ type: 'error', title: 'Errore', message: 'Match non disponibile' });
      return;
    }

    try {
      setLoadingGroupChat(true);
      console.log('💬 [OWNER] Apertura chat gruppo match');
      console.log('🏢 [OWNER] Struttura:', {
        strutturaId: booking.campo.struttura._id,
        strutturaName: booking.campo.struttura.name
      });
      
      // Per gli owner, passiamo strutturaId per verificare che sono owner della struttura
      const res = await fetch(
        `${API_URL}/api/conversations/match/${booking.match._id}?strutturaId=${booking.campo.struttura._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const error = await res.json();
        console.error('❌ [OWNER] Errore caricamento chat gruppo:', error);
        throw new Error(error.message || "Errore caricamento chat");
      }

      const conversation = await res.json();
      console.log('✅ [OWNER] Chat gruppo caricata:', conversation._id);
      
      navigation.navigate("GroupChat", {
        conversationId: conversation._id,
        groupName: `Match - ${booking.campo?.struttura?.name || 'Gruppo'}`,
        matchId: booking.match._id,
        struttura: booking.campo?.struttura,
      });
    } catch (error: any) {
      showAlert({ type: 'error', title: 'Errore', message: error.message || 'Impossibile aprire la chat di gruppo' });
    } finally {
      setLoadingGroupChat(false);
    }
  };

  const handlePlayerPress = (player: any) => {
    setSelectedPlayer(player);
    setShowPlayerProfile(true);
  };

  const handleInviteToTeam = (team: "A" | "B", slotNumber: number) => {
    if (isMatchInProgress()) {
      showAlert({
        type: 'warning',
        title: 'Match in corso',
        message: 'Non è possibile invitare giocatori durante il match. Attendi la fine della partita.',
      });
      return;
    }
    if (!isRegistrationOpen()) {
      showAlert({
        type: 'warning',
        title: 'Registrazione chiusa',
        message: 'La deadline per le registrazioni è passata. Non è più possibile invitare giocatori.',
      });
      return;
    }
    setInviteToTeam(team);
    setInviteToSlot(slotNumber);
    setInviteModalVisible(true);
    console.log('🔍 [Owner] Modal opened for team:', team, 'slot:', slotNumber);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={[styles.loadingText, { fontSize: 14 }]}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) return null;

  const isCancelled = booking.status === "cancelled";
  const startDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
  const endDateTime = new Date(`${booking.date}T${booking.endTime}:00`);
  const now = new Date();
  const isFuture = now < startDateTime;
  const isInProgress = now >= startDateTime && now <= endDateTime;
  const isPastBooking = now > endDateTime;
  const canInsertResult = !isCancelled && isPastBooking && !booking.match;

  // Variabili calcolate basate su booking
  const confirmedPlayers = booking?.match?.players?.filter(p => p.status === "confirmed") || [];
  const pendingPlayers = booking?.match?.players?.filter(p => p.status === "pending") || [];
  const maxPlayersPerTeam = booking?.match ? Math.floor(booking.match.maxPlayers / 2) : 0;
  const teamAPlayers = booking?.match?.players?.filter(p => p.team === "A" && p.status === "confirmed").length || 0;
  const teamBPlayers = booking?.match?.players?.filter(p => p.team === "B" && p.status === "confirmed").length || 0;
  const unassignedPlayers = confirmedPlayers.filter(p => !p.team);
  const teamAConfirmed = confirmedPlayers.filter(p => p.team === "A");
  const teamBConfirmed = confirmedPlayers.filter(p => p.team === "B");

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ 
        backgroundColor: 'white', 
        borderBottomWidth: 1, 
        borderBottomColor: '#e0e0e0',
        paddingBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2
      }}>
        <View style={{ 
          paddingHorizontal: 12, 
          paddingTop: 8,
          flexDirection: 'row', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#F5F5F5',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Ionicons name="arrow-back" size={18} color="#2196F3" />
            </View>
          </Pressable>
          
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: booking.status === 'confirmed' ? '#E8F5E9' : '#FFEBEE',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              gap: 4
            }}>
              <Ionicons 
                name={booking.status === 'confirmed' 
                  ? (isPastBooking ? 'checkmark-done-circle' : isInProgress ? 'play-circle' : 'time') 
                  : 'close-circle'
                } 
                size={14} 
                color={booking.status === 'confirmed' ? '#4CAF50' : '#F44336'} 
              />
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: booking.status === 'confirmed' ? '#2E7D32' : '#C62828'
              }}>
                {booking.status === 'confirmed' ? (
                  isPastBooking ? 'Conclusa' : isInProgress ? 'In corso' : 'Prenotata'
                ) : 'Cancellata'}
              </Text>
            </View>
          </View>

          {!isCancelled && isFuture ? (
            <Pressable
              onPress={handleCancel}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#FFEBEE',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              hitSlop={10}
            >
              <Ionicons name="trash-outline" size={20} color="#F44336" />
            </Pressable>
          ) : (
            <View style={{ width: 32 }} />
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 100 }}
      >
        {/* Campo Info Card */}
        <FieldInfoCard
          struttura={booking.campo.struttura}
          campo={{
            name: booking.campo.name,
            sport: booking.campo.sport,
          }}
          onStrutturaPress={() => {/* TODO: implementare apertura dettagli struttura */}}
          onMapPress={openMaps}
          role="owner"
        />

          <AnimatedCard delay={150} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="person-outline" size={20} color="#2196F3" />
                <Text style={styles.cardTitle}>Cliente</Text>
              </View>
            </View>

            <View style={styles.clientCard}>
              <Pressable
                style={styles.clientInfoPressable}
                onPress={() => openUserProfile(booking.user?._id)}
              >
                <Avatar
                  name={booking.user?.name}
                  surname={booking.user?.surname}
                  avatarUrl={booking.user?.avatarUrl}
                  size={48}
                  fallbackIcon="person"
                />
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>
                    {booking.user?.name || "Utente"} {booking.user?.surname || ""}
                  </Text>
                  {booking.user?.username && (
                    <Text style={styles.clientEmail}>
                      @{booking.user.username}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </Pressable>
              
              <Pressable style={styles.chatButtonInline} onPress={openChat}>
                <Ionicons name="chatbubble-outline" size={18} color="#2196F3" />
              </Pressable>
            </View>
          </AnimatedCard>

          {/* NUOVA CARD DETTAGLI - USA BookingDetailsCard */}
          <AnimatedCard delay={200}>
            <BookingDetailsCard
              date={booking.date}
              startTime={booking.startTime}
              endTime={booking.endTime}
              duration={calculateDuration(booking.startTime, booking.endTime)}
              price={booking.price}
              createdAt={booking.createdAt}
              isPublic={booking.match?.isPublic ?? false}
            />
          </AnimatedCard>

          {booking.match ? (
            <AnimatedCard delay={200} style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <FadeInView delay={300}>
                  <Text style={styles.cardTitle}>Match Details</Text>
                </FadeInView>
                
                <View style={styles.matchHeaderActions}>
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
                </View>
              </View>

              {/* Match Status */}
              <FadeInView delay={400}>
                <View style={styles.matchStatusCard}>
                  <View style={styles.matchStatusRow}>
                    <View style={styles.matchStatusLeft}>
                      <View style={[styles.matchStatusIcon, { backgroundColor: getMatchStatusInfo().color + '20' }]}>
                        <Ionicons name={getMatchStatusInfo().icon} size={16} color={getMatchStatusInfo().color} />
                      </View>
                      <Text style={styles.matchStatusTitle}>Stato Partita</Text>
                    </View>
                    <View style={[
                      styles.matchStatusBadge,
                      booking.match.status === "completed" && styles.matchStatusCompleted,
                      booking.match.status === "open" && styles.matchStatusOpen,
                      booking.match.status === "full" && styles.matchStatusFull,
                      booking.match.status === "cancelled" && styles.matchStatusCancelled,
                      getMatchStatus() === "in_progress" && styles.matchStatusInProgress,
                    ]}>
                      <Text style={styles.matchStatusText}>{getMatchStatusInfo().text}</Text>
                    </View>
                  </View>

                  <View style={styles.matchStatsCompact}>
                    <View style={styles.matchStatItem}>
                      <View style={[styles.matchStatIcon, { backgroundColor: '#E8F5E920' }]}>
                        <Ionicons name="people" size={12} color="#4CAF50" />
                      </View>
                      <Text style={styles.matchStatText}>{confirmedPlayers.length}/{booking.match.maxPlayers}</Text>
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

              {/* Score Display */}
              {booking.match.score && booking.match.score.sets.length > 0 && (
                <FadeInView delay={600}>
                  <ScoreDisplay
                    score={booking.match.score}
                    // Allow owner to edit the existing score
                    isInMatch={true}
                    onEdit={() => setScoreModalVisible(true)}
                    matchStatus={getMatchStatus()}
                    teamAPlayers={teamAConfirmed}
                    teamBPlayers={teamBConfirmed}
                    showEditLabel={user?.role === 'owner' && getMatchStatus() !== 'cancelled'}
                    sportType={typeof booking.campo.sport === 'string' ? booking.campo.sport : booking.campo.sport.name || booking.campo.sport.code}
                  />
                </FadeInView>
              )}

              {/* Score Actions - Owner can insert result */}
              {(
                user?.role === 'owner' &&
                isMatchPassed() &&
                getMatchStatus() !== 'cancelled' &&
                (!booking.match.score || booking.match.score.sets.length === 0) &&
                (teamAConfirmed.length === maxPlayersPerTeam && teamBConfirmed.length === maxPlayersPerTeam)
              ) && (
                <FadeInView delay={700}>
                  <View style={{ padding: 10, alignItems: 'center' }}>
                    <AnimatedButton onPress={() => {
                      if (unassignedPlayers.length > 0) {
                        showAlert({ type: 'warning', title: 'Giocatori non assegnati', message: 'Assegna tutti i giocatori ai team prima di inserire il risultato' });
                        return;
                      }
                      setScoreModalVisible(true);
                    }}>
                      <WinnerGradient style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="trophy" size={20} color="#FFF" />
                        <Text style={{ color: '#FFF', fontWeight: '700', marginLeft: 8 }}>Inserisci risultato</Text>
                      </WinnerGradient>
                    </AnimatedButton>
                  </View>
                </FadeInView>
              )}

              {/* Teams Section */}
              {confirmedPlayers.length > 0 && (
                <SlideInView delay={800} from="bottom">
                  <View style={styles.teamsContainer}>
                    <TeamSection
                      team="A"
                      players={teamAConfirmed}
                      isCreator={true}
                      currentUserId={undefined}
                      onRemovePlayer={handleRemovePlayer}
                      onAssignTeam={() => {}}
                      maxPlayersPerTeam={maxPlayersPerTeam}
                      onInviteToTeam={handleInviteToTeam}
                      matchStatus={getMatchStatus()}
                      variant="owner"
                      maxPlayers={booking?.match?.maxPlayers}
                      organizerId={booking.match?.createdBy?._id}
                      teamACount={teamAPlayers}
                      teamBCount={teamBPlayers}
                      showFormation={true}
                    />
                    <TeamSection
                      team="B"
                      players={teamBConfirmed}
                      isCreator={true}
                      currentUserId={undefined}
                      onRemovePlayer={handleRemovePlayer}
                      onAssignTeam={() => {}}
                      maxPlayersPerTeam={maxPlayersPerTeam}
                      onInviteToTeam={handleInviteToTeam}
                      matchStatus={getMatchStatus()}
                      variant="owner"
                      maxPlayers={booking?.match?.maxPlayers}
                      organizerId={booking.match?.createdBy?._id}
                      teamACount={teamAPlayers}
                      teamBCount={teamBPlayers}
                      showFormation={true}
                    />
                  </View>
                </SlideInView>
              )}

              {/* Unassigned Players */}
              {unassignedPlayers.length > 0 && (
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
                            isCreator={true}
                            currentUserId={undefined}
                            onRemove={() => handleRemovePlayer(player.user._id)}
                            onChangeTeam={() => {}}
                            matchStatus={getMatchStatus()}
                            isOrganizer={player?.user?._id === booking.match?.createdBy?._id}
                            teamACount={teamAPlayers}
                            teamBCount={teamBPlayers}
                            maxPlayersPerTeam={maxPlayersPerTeam}
                            variant="owner"
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
                            isCreator={true}
                            currentUserId={undefined}
                            onRemove={() => handleRemovePlayer(player.user._id)}
                            onChangeTeam={() => {}}
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
          ) : null}

          <View style={{ height: 16 }} />

          {canInsertResult && !booking.match ? (
            <AnimatedButton style={styles.insertResultCard} onPress={goToInserisciRisultato}>
              <View style={styles.insertResultIcon}>
                <Ionicons name="clipboard-outline" size={20} color="#2196F3" />
              </View>
              <View style={styles.insertResultContent}>
                <Text style={[styles.insertResultTitle, { fontSize: 14 }]}>Inserisci risultato</Text>
                <Text style={[styles.insertResultSubtitle, { fontSize: 12 }]}>
                  La partita è conclusa, inserisci il punteggio
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#2196F3" />
            </AnimatedButton>
          ) : null}

          {!isCancelled && isFuture && (
            <FadeInView delay={400}>
              <AnimatedButton style={styles.cancelButton} onPress={handleCancel}>
                <Ionicons name="trash-outline" size={18} color="white" />
                <Text style={[styles.cancelButtonText, { fontSize: 14 }]}>Annulla Prenotazione</Text>
              </AnimatedButton>
            </FadeInView>
          )}

          <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal Profilo Cliente */}
      <Modal
        visible={showClientProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowClientProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: 16 }]}>Profilo Cliente</Text>
              <Pressable
                onPress={() => setShowClientProfile(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color="#666" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Avatar e Nome */}
              <View style={styles.profileHeader}>
                <Avatar
                  name={booking?.user?.name}
                  surname={booking?.user?.surname}
                  avatarUrl={booking?.user?.avatarUrl}
                  size={70}
                  fallbackIcon="person"
                />
                <Text style={[styles.profileName, { fontSize: 16 }]}>
                  {booking?.user?.name || "Utente"} {booking?.user?.surname || ""}
                </Text>
                {booking?.user?.username && (
                  <Text style={[styles.profileUsername, { fontSize: 14 }]}>@{booking.user.username}</Text>
                )}
              </View>

              {/* Informazioni di contatto */}
              <View style={styles.profileSection}>
                <Text style={[styles.profileSectionTitle, { fontSize: 16 }]}>Contatti</Text>
                
                {booking?.user?.email && (
                  <View style={styles.profileInfoRow}>
                    <Ionicons name="mail-outline" size={18} color="#2196F3" />
                    <Text style={[styles.profileInfoText, { fontSize: 14 }]}>{booking.user.email}</Text>
                  </View>
                )}

                {booking?.user?.phone && (
                  <View style={styles.profileInfoRow}>
                    <Ionicons name="call-outline" size={18} color="#2196F3" />
                    <Text style={[styles.profileInfoText, { fontSize: 14 }]}>{booking.user.phone}</Text>
                  </View>
                )}
              </View>

              {/* Informazioni account */}
              <View style={styles.profileSection}>
                <Text style={[styles.profileSectionTitle, { fontSize: 16 }]}>Informazioni Account</Text>
                
                <View style={styles.profileInfoRow}>
                  <Ionicons name="calendar-outline" size={18} color="#666" />
                  <View style={styles.profileInfoTextContainer}>
                    <Text style={[styles.profileInfoLabel, { fontSize: 12 }]}>Membro dal</Text>
                    <Text style={[styles.profileInfoText, { fontSize: 14 }]}>
                      {booking?.user?.createdAt 
                        ? new Date(booking.user.createdAt).toLocaleDateString('it-IT', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/D'
                      }
                    </Text>
                  </View>
                </View>

                <View style={styles.profileInfoRow}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#666" />
                  <View style={styles.profileInfoTextContainer}>
                    <Text style={[styles.profileInfoLabel, { fontSize: 12 }]}>Stato account</Text>
                    <Text style={[styles.profileInfoText, { fontSize: 14 }]}>
                      {booking?.user?.isActive ? 'Attivo' : 'Non attivo'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Azioni */}
              <View style={styles.profileActions}>
                <AnimatedButton
                  style={styles.profileActionButton}
                  onPress={() => {
                    setShowClientProfile(false);
                    openChat();
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={18} color="white" />
                  <Text style={[styles.profileActionButtonText, { fontSize: 14 }]}>Invia Messaggio</Text>
                </AnimatedButton>

                {booking?.user?.phone && (
                  <AnimatedButton
                    style={[styles.profileActionButton, styles.profileActionButtonSecondary]}
                    onPress={() => {
                      Linking.openURL(`tel:${booking.user.phone}`);
                    }}
                  >
                    <Ionicons name="call-outline" size={18} color="#2196F3" />
                    <Text style={[styles.profileActionButtonText, styles.profileActionButtonTextSecondary, { fontSize: 14 }]}>
                      Chiama
                    </Text>
                  </AnimatedButton>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Profilo Giocatore */}
      <Modal
        visible={showPlayerProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlayerProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: 16 }]}>Profilo Giocatore</Text>
              <Pressable
                onPress={() => setShowPlayerProfile(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color="#666" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Avatar e Nome */}
              <View style={styles.profileHeader}>
                <Avatar
                  name={selectedPlayer?.user?.name}
                  surname={selectedPlayer?.user?.surname}
                  avatarUrl={selectedPlayer?.user?.avatarUrl}
                  size={70}
                  fallbackIcon="person"
                />
                <Text style={[styles.profileName, { fontSize: 16 }]}>
                  {selectedPlayer?.user?.name || "Giocatore"} {selectedPlayer?.user?.surname || ""}
                </Text>
                {selectedPlayer?.user?.username && (
                  <Text style={[styles.profileUsername, { fontSize: 14 }]}>@{selectedPlayer.user.username}</Text>
                )}
              </View>

              {/* Informazioni di contatto */}
              <View style={styles.profileSection}>
                <Text style={[styles.profileSectionTitle, { fontSize: 16 }]}>Contatti</Text>
                
                {selectedPlayer?.user?.email && (
                  <View style={styles.profileInfoRow}>
                    <Ionicons name="mail-outline" size={18} color="#2196F3" />
                    <Text style={[styles.profileInfoText, { fontSize: 14 }]}>{selectedPlayer.user.email}</Text>
                  </View>
                )}

                {selectedPlayer?.user?.phone && (
                  <View style={styles.profileInfoRow}>
                    <Ionicons name="call-outline" size={18} color="#2196F3" />
                    <Text style={[styles.profileInfoText, { fontSize: 14 }]}>{selectedPlayer.user.phone}</Text>
                  </View>
                )}
              </View>

              {/* Informazioni account */}
              <View style={styles.profileSection}>
                <Text style={[styles.profileSectionTitle, { fontSize: 16 }]}>Informazioni Account</Text>
                
                <View style={styles.profileInfoRow}>
                  <Ionicons name="calendar-outline" size={18} color="#666" />
                  <View style={styles.profileInfoTextContainer}>
                    <Text style={[styles.profileInfoLabel, { fontSize: 12 }]}>Membro dal</Text>
                    <Text style={[styles.profileInfoText, { fontSize: 14 }]}>
                      {selectedPlayer?.user?.createdAt 
                        ? new Date(selectedPlayer.user.createdAt).toLocaleDateString('it-IT', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/D'
                      }
                    </Text>
                  </View>
                </View>

                <View style={styles.profileInfoRow}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#666" />
                  <View style={styles.profileInfoTextContainer}>
                    <Text style={[styles.profileInfoLabel, { fontSize: 12 }]}>Stato account</Text>
                    <Text style={[styles.profileInfoText, { fontSize: 14 }]}>
                      {selectedPlayer?.user?.isActive ? 'Attivo' : 'Non attivo'}
                    </Text>
                  </View>
                </View>

                {/* Stato nel Match */}
                <View style={styles.profileInfoRow}>
                  <Ionicons 
                    name={selectedPlayer?.status === 'confirmed' ? 'checkmark-circle-outline' : 'time-outline'} 
                    size={18} 
                    color="#666" 
                  />
                  <View style={styles.profileInfoTextContainer}>
                    <Text style={[styles.profileInfoLabel, { fontSize: 12 }]}>Stato nel match</Text>
                    <Text style={[styles.profileInfoText, { fontSize: 14 }]}>
                      {selectedPlayer?.status === 'confirmed' ? 'Confermato' : 
                       selectedPlayer?.status === 'pending' ? 'In attesa' : 'Rifiutato'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Azioni */}
              {selectedPlayer?.user?.phone && (
                <View style={styles.profileActions}>
                  <AnimatedButton
                    style={[styles.profileActionButton, styles.profileActionButtonSecondary]}
                    onPress={() => {
                      Linking.openURL(`tel:${selectedPlayer.user.phone}`);
                    }}
                  >
                    <Ionicons name="call-outline" size={20} color="#2196F3" />
                    <Text style={[styles.profileActionButtonText, styles.profileActionButtonTextSecondary, { fontSize: 14 }]}>
                      Chiama
                    </Text>
                  </AnimatedButton>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Invite Modal */}
      <Modal
        visible={inviteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          console.log('🔍 [Owner] Modal closed via onRequestClose');
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
                console.log('🔍 [Owner] Modal closed via close button');
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
                  console.log('🔍 [Owner] TextInput onChangeText called with:', text);
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

      {/* Score Modal - Owner */}
      {booking?.match && (
        <ScoreModal
          visible={scoreModalVisible}
          onClose={() => setScoreModalVisible(false)}
          onSave={handleSubmitScore}
          currentScore={booking.match?.score}
          matchStatus={booking.match?.status}
          sportType={getSportType(booking?.campo)}
        />
      )}

    </SafeAreaView>
  );
}
