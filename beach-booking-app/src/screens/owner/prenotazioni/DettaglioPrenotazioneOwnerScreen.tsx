import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../../config/api";
import { styles } from "../styles/DettaglioPrenotazioneOwnerScreen.styles";
import { Avatar } from "../../../components/Avatar";
import SportIcon from '../../../components/SportIcon';

// Componenti animati e gradients
import {
  AnimatedCard,
  AnimatedButton,
  FadeInView,
  SlideInView,
  ScaleInView,
} from "./DettaglioPrenotazione/components/AnimatedComponents";

import {
  SuccessGradient,
  WarningGradient,
} from "./DettaglioPrenotazione/components/GradientComponents";

import BookingDetailsCard from "./DettaglioPrenotazione/components/BookingDetailsCard";
import { calculateDuration } from "./DettaglioPrenotazione/utils/DettaglioPrenotazione.utils";

// Import componenti owner per la visualizzazione match
import ScoreDisplay from "./DettaglioPrenotazione/components/ScoreDisplay";
import {
  TeamAGradient,
  TeamBGradient,
} from "./DettaglioPrenotazione/components/GradientComponents";
import PlayerCardWithTeam from "./DettaglioPrenotazione/components/DettaglioPrenotazione.components";
import TeamSection from "./DettaglioPrenotazione/components/TeamSection";
import AddPlayerModal from "./DettaglioPrenotazione/components/AddPlayerModal";

export default function OwnerDettaglioPrenotazioneScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { bookingId } = route.params;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [loadingGroupChat, setLoadingGroupChat] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [selectedTeamForAdd, setSelectedTeamForAdd] = useState<"A" | "B">("A");

  useEffect(() => {
    loadBooking();
  }, []);

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
      setBooking(data);
    } catch (error) {
      console.error("❌ Errore caricamento booking:", error);
      Alert.alert("Errore", "Impossibile caricare i dettagli");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Annulla prenotazione",
      "Sei sicuro di voler annullare questa prenotazione? Il cliente verrà notificato.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sì, annulla",
          style: "destructive",
          onPress: cancelBooking,
        },
      ]
    );
  };

  const cancelBooking = async () => {
    try {
      const res = await fetch(`${API_URL}/bookings/owner/${bookingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      Alert.alert("Successo", "Prenotazione cancellata", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert("Errore", "Impossibile cancellare la prenotazione");
    }
  };

  const openMaps = () => {
    const address = `${booking.campo.struttura.location.address}, ${booking.campo.struttura.location.city}`;
    const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const openChat = async () => {
    try {
      console.log('💬 Apertura chat con user:', booking.user._id);
      
      const res = await fetch(
        `${API_URL}/api/conversations/user/${booking.user._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        console.error('❌ Errore creazione conversazione:', res.status);
        throw new Error();
      }

      const conversation = await res.json();
      console.log('✅ Conversazione ottenuta:', conversation._id);

      navigation.navigate("Chat", {
        conversationId: conversation._id,
        strutturaName: booking.campo.struttura.name,
        userName: booking.user.name,
        userId: booking.user._id,
        struttura: booking.campo.struttura,
      });
    } catch (error) {
      console.error("❌ Errore apertura chat:", error);
      Alert.alert("Errore", "Impossibile aprire la chat");
    }
  };

  const goToInserisciRisultato = () => {
    navigation.navigate("InserisciRisultato", { bookingId });
  };

  const handleOpenGroupChat = async () => {
    if (!booking?.match?._id) {
      Alert.alert("Errore", "Match non disponibile");
      return;
    }

    try {
      setLoadingGroupChat(true);
      const res = await fetch(`${API_URL}/api/conversations/match/${booking.match._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore caricamento chat");
      }

      const conversation = await res.json();
      navigation.navigate("GroupChat", {
        conversationId: conversation._id,
        groupName: `Match - ${booking.campo?.struttura?.name || 'Gruppo'}`,
        matchId: booking.match._id,
        struttura: booking.campo?.struttura,
      });
    } catch (error: any) {
      Alert.alert("Errore", error.message || "Impossibile aprire la chat di gruppo");
    } finally {
      setLoadingGroupChat(false);
    }
  };

  const handlePlayerPress = (player: any) => {
    setSelectedPlayer(player);
    setShowPlayerProfile(true);
  };

  const handleAddPlayer = async (userId: string, team: "A" | "B") => {
    if (!booking?.match?._id) {
      throw new Error("Match non disponibile");
    }

    try {
      const res = await fetch(`${API_URL}/matches/${booking.match._id}/players`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, team }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Errore aggiunta giocatore");
      }

      // Ricarica i dati della prenotazione
      await loadBooking();
    } catch (error: any) {
      throw error;
    }
  };

  const handleInviteToTeam = (team: "A" | "B", slotNumber: number) => {
    console.log(`📝 Invito al Team ${team}, Slot ${slotNumber}`);
    setSelectedTeamForAdd(team);
    setShowAddPlayerModal(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento...</Text>
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

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header fisso con back button e status */}
      <View style={{ 
        backgroundColor: 'white', 
        borderBottomWidth: 1, 
        borderBottomColor: '#e0e0e0',
        paddingBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2
      }}>
        <View style={{ 
          paddingHorizontal: 16, 
          paddingTop: 12,
          flexDirection: 'row', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#F5F5F5',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Ionicons name="arrow-back" size={20} color="#2196F3" />
            </View>
          </Pressable>
          
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: booking.status === 'confirmed' ? '#E8F5E9' : '#FFEBEE',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              gap: 6
            }}>
              <Ionicons 
                name={booking.status === 'confirmed' 
                  ? (isPastBooking ? 'checkmark-done-circle' : isInProgress ? 'play-circle' : 'time') 
                  : 'close-circle'
                } 
                size={18} 
                color={booking.status === 'confirmed' ? '#4CAF50' : '#F44336'} 
              />
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: booking.status === 'confirmed' ? '#2E7D32' : '#C62828'
              }}>
                {booking.status === 'confirmed' ? (
                  isPastBooking ? 'Conclusa' : isInProgress ? 'In corso' : 'Prenotata'
                ) : 'Cancellata'}
              </Text>
            </View>
          </View>

          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { paddingTop: 40 }]}>
          <AnimatedCard delay={100}>
            <View style={styles.strutturaHeader}>
              <View style={styles.sportIconBox}>
                <SportIcon
                  sport={booking.campo?.sport || 'beach_volley'}
                  size={28}
                  color="#2196F3"
                />
              </View>
              <View style={styles.strutturaInfo}>
                <Text style={styles.strutturaName}>
                  {booking.campo?.struttura?.name || "Struttura"}
                </Text>
                <Text style={styles.campoName}>{booking.campo?.name || "Campo"}</Text>
              </View>
            </View>

            <Pressable style={styles.locationCard} onPress={openMaps}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color="#F44336" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationAddress}>
                  {booking.campo?.struttura?.location?.address || "Indirizzo non disponibile"}
                </Text>
                <Text style={styles.locationCity}>
                  {booking.campo?.struttura?.location?.city || ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>
          </AnimatedCard>

          <AnimatedCard delay={150}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={20} color="#2196F3" />
              <Text style={styles.cardTitle}>Cliente</Text>
            </View>

            <View style={styles.clientCard}>
              <Pressable
                style={styles.clientInfoPressable}
                onPress={() => setShowClientProfile(true)}
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
                  {booking.user?.email && (
                    <Text style={styles.clientEmail}>{booking.user.email}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </Pressable>
              
              <Pressable style={styles.chatButtonInline} onPress={openChat}>
                <Ionicons name="chatbubble-outline" size={20} color="#2196F3" />
              </Pressable>
            </View>
          </AnimatedCard>

          {booking.match && (
            <FadeInView delay={200}>
              <Pressable 
                style={[styles.groupChatButton, loadingGroupChat && styles.groupChatButtonDisabled]} 
                onPress={handleOpenGroupChat}
                disabled={loadingGroupChat}
              >
                {loadingGroupChat ? (
                  <ActivityIndicator size="small" color="#2196F3" />
                ) : (
                  <>
                    <Ionicons name="people-outline" size={20} color="#2196F3" />
                    <Text style={styles.groupChatButtonText}>Chat Gruppo Match</Text>
                  </>
                )}
              </Pressable>
            </FadeInView>
          )}

          {/* NUOVA CARD DETTAGLI - USA BookingDetailsCard */}
          <AnimatedCard delay={200}>
            <BookingDetailsCard
              date={booking.date}
              startTime={booking.startTime}
              endTime={booking.endTime}
              duration={calculateDuration(booking.startTime, booking.endTime)}
              price={booking.price}
              createdAt={booking.createdAt}
            />
          </AnimatedCard>

          {booking.match ? (
            <>
              {/* DEBUG LOG */}
              {console.log('🔍 MATCH DATA:', {
                maxPlayers: booking.match.maxPlayers,
                status: booking.match.status,
                playersTotal: booking.match.players?.length,
                playersConfirmed: booking.match.players?.filter((p: any) => p.status === 'confirmed').length,
                playersPending: booking.match.players?.filter((p: any) => p.status === 'pending').length,
                teamA: booking.match.players?.filter((p: any) => p.team === 'A').length,
                teamB: booking.match.players?.filter((p: any) => p.team === 'B').length,
                noTeam: booking.match.players?.filter((p: any) => !p.team).length,
                players: booking.match.players?.map((p: any) => ({
                  name: p.user?.name,
                  status: p.status,
                  team: p.team
                })),
                hasScore: !!booking.match.sets,
                scoreOnly: !booking.match.players && !!booking.match.sets
              })}
              
              {/* MATCH SECTION CON GIOCATORI */}
              {booking.match.players && (
                <>
                  <AnimatedCard delay={300}>
                <View style={styles.cardHeader}>
                  <Ionicons name="people" size={20} color="#2196F3" />
                  <Text style={styles.cardTitle}>Match Details</Text>
                </View>

                {/* Match Status */}
                <FadeInView delay={100}>
                  <View style={styles.matchStatusCard}>
                    <View style={styles.matchStatusRow}>
                      <View style={[
                        styles.matchStatusBadge,
                        booking.match.status === "completed" && styles.matchStatusCompleted,
                        booking.match.status === "open" && styles.matchStatusOpen,
                        booking.match.status === "full" && styles.matchStatusFull,
                        booking.match.status === "cancelled" && styles.matchStatusCancelled,
                      ]}>
                        <Text style={styles.matchStatusText}>
                          {booking.match.status === 'completed' ? 'Completato' : 
                           booking.match.status === 'open' ? 'Aperto' :
                           booking.match.status === 'full' ? 'Completo' : 
                           booking.match.status === 'cancelled' ? 'Cancellato' : booking.match.status}
                        </Text>
                      </View>

                      <View style={styles.matchInfoRowContainer}>
                        <View style={styles.matchInfoItem}>
                          <Ionicons name="people" size={16} color="#2196F3" />
                          <Text style={styles.matchInfoText}>
                            {booking.match.players?.filter((p: any) => p.status === 'confirmed').length || 0}/{booking.match.maxPlayers}
                          </Text>
                        </View>
                        
                        {booking.match.players?.filter((p: any) => p.status === 'pending').length > 0 && (
                          <View style={[styles.matchInfoItem, styles.pendingBadge]}>
                            <Ionicons name="time" size={14} color="#FF9800" />
                            <Text style={[styles.matchInfoText, { color: "#FF9800" }]}>
                              {booking.match.players.filter((p: any) => p.status === 'pending').length} in attesa
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </FadeInView>

                {/* Match Info */}
                <View style={styles.matchInfoBox}>
                  <View style={styles.matchInfoRow}>
                    <Text style={styles.matchInfoLabel}>Formato:</Text>
                    <Text style={styles.matchInfoValue}>
                      {booking.match.maxPlayers / 2}vs{booking.match.maxPlayers / 2}
                    </Text>
                  </View>
                  {booking.match.createdBy && (
                    <View style={styles.matchInfoRow}>
                      <Text style={styles.matchInfoLabel}>Creato da:</Text>
                      <Text style={styles.matchInfoValue}>
                        {booking.match.createdBy.name} {booking.match.createdBy.surname || ''}
                      </Text>
                    </View>
                  )}
                </View>
              </AnimatedCard>

              {/* Score Display */}
              {booking.match.score && booking.match.score.sets.length > 0 && (
                <AnimatedCard delay={350}>
                  <ScoreDisplay
                    score={booking.match.score}
                    isInMatch={false}
                    onEdit={() => {}}
                    matchStatus={booking.match.status}
                    teamAPlayers={booking.match.players?.filter((p: any) => p.team === 'A' && p.status === 'confirmed') || []}
                    teamBPlayers={booking.match.players?.filter((p: any) => p.team === 'B' && p.status === 'confirmed') || []}
                  />
                </AnimatedCard>
              )}

              {/* Teams Section - SEMPRE VISIBILE */}
              <SlideInView delay={400} from="bottom">
                <View style={styles.teamsContainer}>
                  {/* Team A */}
                  <TeamSection
                    team="A"
                    players={booking.match.players?.filter((p: any) => p.team === 'A' && p.status === 'confirmed') || []}
                    isCreator={true}
                    currentUserId={undefined}
                    onRemovePlayer={() => {}}
                    onAssignTeam={() => {}}
                    maxPlayersPerTeam={Math.floor((booking.match.maxPlayers || 4) / 2)}
                    onInviteToTeam={handleInviteToTeam}
                    matchStatus={booking.match.status}
                    onPlayerPress={handlePlayerPress}
                  />

                  {/* Team B */}
                  <TeamSection
                    team="B"
                    players={booking.match.players?.filter((p: any) => p.team === 'B' && p.status === 'confirmed') || []}
                    isCreator={true}
                    currentUserId={undefined}
                    onRemovePlayer={() => {}}
                    onAssignTeam={() => {}}
                    maxPlayersPerTeam={Math.floor((booking.match.maxPlayers || 4) / 2)}
                    onInviteToTeam={handleInviteToTeam}
                    matchStatus={booking.match.status}
                    onPlayerPress={handlePlayerPress}
                  />
                </View>
              </SlideInView>

              {/* Giocatori non assegnati */}
              {booking.match.players?.filter((p: any) => !p.team && p.status === 'confirmed').length > 0 && (
                <FadeInView delay={500}>
                  <View style={[styles.unassignedSection, { marginTop: 16 }]}>
                    <Text style={styles.unassignedTitle}>Giocatori Non Assegnati</Text>
                    <Text style={styles.unassignedSubtitle}>
                      Giocatori confermati in attesa di assegnazione
                    </Text>
                    <View style={styles.playersGrid}>
                      {booking.match.players
                        .filter((p: any) => !p.team && p.status === 'confirmed')
                        .map((player: any, index: number) => (
                          <FadeInView key={player.user._id} delay={550 + index * 50}>
                            <PlayerCardWithTeam
                              player={player}
                              isCreator={false}
                              currentUserId={undefined}
                              onRemove={() => {}}
                              onChangeTeam={() => {}}
                              onLeave={() => {}}
                              currentTeam={null}
                              isPending={false}
                              matchStatus={booking.match.status}
                              isOrganizer={player?.user?._id === booking.match?.createdBy?._id}
                            />
                          </FadeInView>
                        ))}
                    </View>
                  </View>
                </FadeInView>
              )}

              {/* Giocatori in attesa di risposta */}
              {booking.match.players?.filter((p: any) => p.status === 'pending').length > 0 && (
                <FadeInView delay={600}>
                  <View style={styles.pendingSection}>
                    <Text style={styles.pendingTitle}>In Attesa di Risposta</Text>
                    <Text style={styles.pendingSubtitle}>
                      Questi giocatori devono ancora confermare
                    </Text>
                    <View style={styles.playersGrid}>
                      {booking.match.players
                        .filter((p: any) => p.status === 'pending')
                        .map((player: any, index: number) => (
                          <FadeInView key={player.user._id} delay={650 + index * 50}>
                            <PlayerCardWithTeam
                              player={player}
                              isCreator={false}
                              currentUserId={undefined}
                              onRemove={() => {}}
                              onChangeTeam={() => {}}
                              onLeave={() => {}}
                              currentTeam={player.team || null}
                              isPending={true}
                              matchStatus={booking.match.status}
                            />
                          </FadeInView>
                        ))}
                    </View>
                  </View>
                </FadeInView>
              )}
            </>
          )}
            </>
          ) : null}

          {canInsertResult && !booking.match ? (
            <AnimatedButton style={styles.insertResultCard} onPress={goToInserisciRisultato}>
              <View style={styles.insertResultIcon}>
                <Ionicons name="clipboard-outline" size={24} color="#2196F3" />
              </View>
              <View style={styles.insertResultContent}>
                <Text style={styles.insertResultTitle}>Inserisci risultato</Text>
                <Text style={styles.insertResultSubtitle}>
                  La partita è conclusa, inserisci il punteggio
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#2196F3" />
            </AnimatedButton>
          ) : null}

          {!isCancelled && isFuture && (
            <FadeInView delay={400}>
              <AnimatedButton style={styles.cancelButton} onPress={handleCancel}>
                <Ionicons name="trash-outline" size={20} color="white" />
                <Text style={styles.cancelButtonText}>Annulla Prenotazione</Text>
              </AnimatedButton>
            </FadeInView>
          )}

          <View style={{ height: 40 }} />
        </View>
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
              <Text style={styles.modalTitle}>Profilo Cliente</Text>
              <Pressable
                onPress={() => setShowClientProfile(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Avatar e Nome */}
              <View style={styles.profileHeader}>
                <Avatar
                  name={booking?.user?.name}
                  surname={booking?.user?.surname}
                  avatarUrl={booking?.user?.avatarUrl}
                  size={80}
                  fallbackIcon="person"
                />
                <Text style={styles.profileName}>
                  {booking?.user?.name || "Utente"} {booking?.user?.surname || ""}
                </Text>
                {booking?.user?.username && (
                  <Text style={styles.profileUsername}>@{booking.user.username}</Text>
                )}
              </View>

              {/* Informazioni di contatto */}
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>Contatti</Text>
                
                {booking?.user?.email && (
                  <View style={styles.profileInfoRow}>
                    <Ionicons name="mail-outline" size={20} color="#2196F3" />
                    <Text style={styles.profileInfoText}>{booking.user.email}</Text>
                  </View>
                )}

                {booking?.user?.phone && (
                  <View style={styles.profileInfoRow}>
                    <Ionicons name="call-outline" size={20} color="#2196F3" />
                    <Text style={styles.profileInfoText}>{booking.user.phone}</Text>
                  </View>
                )}
              </View>

              {/* Informazioni account */}
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>Informazioni Account</Text>
                
                <View style={styles.profileInfoRow}>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <View style={styles.profileInfoTextContainer}>
                    <Text style={styles.profileInfoLabel}>Membro dal</Text>
                    <Text style={styles.profileInfoText}>
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
                  <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
                  <View style={styles.profileInfoTextContainer}>
                    <Text style={styles.profileInfoLabel}>Stato account</Text>
                    <Text style={styles.profileInfoText}>
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
                  <Ionicons name="chatbubble-outline" size={20} color="white" />
                  <Text style={styles.profileActionButtonText}>Invia Messaggio</Text>
                </AnimatedButton>

                {booking?.user?.phone && (
                  <AnimatedButton
                    style={[styles.profileActionButton, styles.profileActionButtonSecondary]}
                    onPress={() => {
                      Linking.openURL(`tel:${booking.user.phone}`);
                    }}
                  >
                    <Ionicons name="call-outline" size={20} color="#2196F3" />
                    <Text style={[styles.profileActionButtonText, styles.profileActionButtonTextSecondary]}>
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
              <Text style={styles.modalTitle}>Profilo Giocatore</Text>
              <Pressable
                onPress={() => setShowPlayerProfile(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Avatar e Nome */}
              <View style={styles.profileHeader}>
                <Avatar
                  name={selectedPlayer?.user?.name}
                  surname={selectedPlayer?.user?.surname}
                  avatarUrl={selectedPlayer?.user?.avatarUrl}
                  size={80}
                  fallbackIcon="person"
                />
                <Text style={styles.profileName}>
                  {selectedPlayer?.user?.name || "Giocatore"} {selectedPlayer?.user?.surname || ""}
                </Text>
                {selectedPlayer?.user?.username && (
                  <Text style={styles.profileUsername}>@{selectedPlayer.user.username}</Text>
                )}
              </View>

              {/* Informazioni di contatto */}
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>Contatti</Text>
                
                {selectedPlayer?.user?.email && (
                  <View style={styles.profileInfoRow}>
                    <Ionicons name="mail-outline" size={20} color="#2196F3" />
                    <Text style={styles.profileInfoText}>{selectedPlayer.user.email}</Text>
                  </View>
                )}

                {selectedPlayer?.user?.phone && (
                  <View style={styles.profileInfoRow}>
                    <Ionicons name="call-outline" size={20} color="#2196F3" />
                    <Text style={styles.profileInfoText}>{selectedPlayer.user.phone}</Text>
                  </View>
                )}
              </View>

              {/* Informazioni account */}
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>Informazioni Account</Text>
                
                <View style={styles.profileInfoRow}>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <View style={styles.profileInfoTextContainer}>
                    <Text style={styles.profileInfoLabel}>Membro dal</Text>
                    <Text style={styles.profileInfoText}>
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
                  <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
                  <View style={styles.profileInfoTextContainer}>
                    <Text style={styles.profileInfoLabel}>Stato account</Text>
                    <Text style={styles.profileInfoText}>
                      {selectedPlayer?.user?.isActive ? 'Attivo' : 'Non attivo'}
                    </Text>
                  </View>
                </View>

                {/* Stato nel Match */}
                <View style={styles.profileInfoRow}>
                  <Ionicons 
                    name={selectedPlayer?.status === 'confirmed' ? 'checkmark-circle-outline' : 'time-outline'} 
                    size={20} 
                    color="#666" 
                  />
                  <View style={styles.profileInfoTextContainer}>
                    <Text style={styles.profileInfoLabel}>Stato nel match</Text>
                    <Text style={styles.profileInfoText}>
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
                    <Text style={[styles.profileActionButtonText, styles.profileActionButtonTextSecondary]}>
                      Chiama
                    </Text>
                  </AnimatedButton>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Aggiungi Giocatore */}
      <AddPlayerModal
        visible={showAddPlayerModal}
        onClose={() => setShowAddPlayerModal(false)}
        onAddPlayer={handleAddPlayer}
        token={token!}
        apiUrl={API_URL}
        initialTeam={selectedTeamForAdd}
      />
    </SafeAreaView>
  );
}
