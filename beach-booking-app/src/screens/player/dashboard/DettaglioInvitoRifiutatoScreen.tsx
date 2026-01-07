import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import API_URL from "../../../config/api";
import { AuthContext } from "../../../context/AuthContext";

const DettaglioInvitoRifiutato = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);
  
  const { inviteId, inviteData, canChangeResponse } = route.params as any;
  const [responding, setResponding] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  const invite = inviteData;
  const booking = invite?.booking;
  const createdBy = invite?.createdBy;
  const match = invite?.match || invite; // Supporta sia invito che match

  // Trova il team dell'utente corrente nell'invito
  const findUserTeam = () => {
    if (!invite?.players || !user?.id) return null;
    
    const userPlayer = invite.players.find((player: any) => {
      const playerUserId = player.user?._id || player.user;
      return playerUserId === user.id;
    });
    
    return userPlayer?.team || null;
  };

  const userTeam = findUserTeam();

  // Trova il giocatore corrente
  const findCurrentPlayer = () => {
    if (!invite?.players || !user?.id) return null;
    
    return invite.players.find((player: any) => {
      const playerUserId = player.user?._id || player.user;
      return playerUserId === user.id;
    });
  };

  const currentPlayer = findCurrentPlayer();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Data non disponibile";
    try {
      const date = new Date(dateStr + "T12:00:00");
      return date.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    } catch (error) {
      return dateStr;
    }
  };

  const getTimeRemaining = () => {
    if (!booking?.date || !booking?.startTime) return "";
    
    try {
      const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
      const now = new Date();
      const minutesDiff = Math.floor((matchDateTime.getTime() - now.getTime()) / (1000 * 60));
      
      if (minutesDiff <= 0) {
        return "Partita già iniziata";
      } else if (minutesDiff < 60) {
        return `Inizia tra ${minutesDiff} minuti`;
      } else {
        const hours = Math.floor(minutesDiff / 60);
        return `Inizia tra ${hours} ore`;
      }
    } catch (error) {
      return "";
    }
  };

  // Funzione per cambiare risposta (da declined ad accept)
  const handleChangeResponse = async () => {
    Alert.alert(
      "Accetta invito",
      `Vuoi cambiare la tua risposta e accettare questo invito?${
        userTeam ? ` Sarai inserito nel Team ${userTeam}.` : ''
      }`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Accetta",
          onPress: async () => {
            try {
              setResponding(true);
              
              const requestBody: any = { action: "accept" };
              
              // Se l'utente aveva un team assegnato, lo includiamo nella richiesta
              if (userTeam) {
                requestBody.team = userTeam;
              }
              
              const res = await fetch(`${API_URL}/matches/${inviteId}/update-response`, {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
              });

              if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Errore nel cambio risposta");
              }

              Alert.alert(
                "Invito accettato!",
                `Hai cambiato la tua risposta. La partita è ora nelle tue prenotazioni.${
                  userTeam ? ` Sei nel Team ${userTeam}.` : ''
                }`,
                [
                  {
                    text: "OK",
                    onPress: () => {
                      navigation.navigate("TuttiInviti");
                    }
                  }
                ]
              );
            } catch (error: any) {
              Alert.alert("Errore", error.message || "Non è stato possibile accettare l'invito");
            } finally {
              setResponding(false);
            }
          }
        }
      ]
    );
  };

  // Funzione per rifiutare nuovamente l'invito (se per qualche motivo è necessario)
  const handleDeclineAgain = async () => {
    if (!inviteId) return;
    
    Alert.alert(
      "Conferma rifiuto",
      "Vuoi confermare il rifiuto di questo invito?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Conferma Rifiuto",
          style: "destructive",
          onPress: async () => {
            try {
              setResponding(true);
              
              const res = await fetch(`${API_URL}/matches/${inviteId}/respond`, {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ action: "decline" }),
              });

              if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Errore nel rifiuto");
              }

              Alert.alert(
                "Invito rifiutato",
                "Hai confermato il rifiuto di questo invito.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      navigation.goBack();
                    }
                  }
                ]
              );
            } catch (error: any) {
              Alert.alert("Errore", error.message || "Non è stato possibile rifiutare l'invito");
            } finally {
              setResponding(false);
            }
          }
        }
      ]
    );
  };

  const getCannotChangeReason = () => {
    if (!booking?.date || !booking?.startTime) {
      return "Informazioni partita non disponibili";
    }
    
    try {
      const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
      const now = new Date();
      const minutesDiff = (matchDateTime.getTime() - now.getTime()) / (1000 * 60);
      
      if (minutesDiff <= 0) {
        return "La partita è già iniziata";
      }
      
      if (minutesDiff <= 30) {
        return "Mancano meno di 30 minuti all'inizio";
      }
      
      const confirmedPlayers = invite.players?.filter((p: any) => p.status === "confirmed").length || 0;
      if (confirmedPlayers >= (invite.maxPlayers || 4)) {
        return "Il match è pieno";
      }
      
      // Controlla se il team dell'utente è pieno
      if (userTeam) {
        const teamPlayers = invite.players?.filter((p: any) => 
          p.team === userTeam && p.status === "confirmed"
        ).length || 0;
        
        const maxPlayersPerTeam = invite.maxPlayers ? Math.ceil(invite.maxPlayers / 2) : 2;
        
        if (teamPlayers >= maxPlayersPerTeam) {
          return `Il Team ${userTeam} è al completo`;
        }
      }
      
      return "Non disponibile";
    } catch (error) {
      return "Errore nel calcolo";
    }
  };

  const getTeamInfo = () => {
    if (!userTeam) return null;
    
    const teamPlayers = invite.players?.filter((p: any) => 
      p.team === userTeam && p.status === "confirmed"
    ).length || 0;
    
    const maxPlayersPerTeam = invite.maxPlayers ? Math.ceil(invite.maxPlayers / 2) : 2;
    
    return {
      team: userTeam,
      currentPlayers: teamPlayers,
      maxPlayers: maxPlayersPerTeam,
      color: userTeam === "A" ? "#2196F3" : "#F44336",
      icon: userTeam === "A" ? "shield" : "shield-outline"
    };
  };

  const teamInfo = getTeamInfo();

  // Funzione per invitare un sostituto (solo per il creatore)
  const handleInviteReplacement = async (username: string) => {
    if (!inviteId) return;

    try {
      const body: any = { 
        username,
        ...(userTeam && { team: userTeam }) // Se c'era un team, lo manteniamo
      };
      
      const res = await fetch(`${API_URL}/matches/${inviteId}/invite`, {
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

      Alert.alert("✅ Invito inviato!", "L'utente è stato invitato al match come sostituto");
      setInviteModalVisible(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error: any) {
      Alert.alert("Errore", error.message);
    }
  };

  const handleSearchUsers = async (query: string) => {
    if (query.length < 2 || !inviteId) {
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
        const alreadyInMatch = invite.players?.map((p: any) => p.user?._id || p.user) || [];
        const filtered = users.filter((u: any) => !alreadyInMatch.includes(u._id));
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error("Errore ricerca:", error);
    } finally {
      setSearching(false);
    }
  };

  // Controlla se l'utente è il creatore
  const isCreator = invite?.createdBy?._id === user?.id || 
                   match?.createdBy?._id === user?.id;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>Invito Rifiutato</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Banner Rifiutato */}
        <View style={styles.declinedBanner}>
          <Ionicons name="close-circle" size={20} color="#FFF" />
          <Text style={styles.declinedBannerText}>
            Hai rifiutato questo invito
          </Text>
          {currentPlayer?.declinedAt && (
            <Text style={styles.declinedTimeText}>
              Rifiutato il {new Date(currentPlayer.declinedAt).toLocaleDateString('it-IT')}
            </Text>
          )}
        </View>

        {/* Sezione Team - Mostra solo se l'utente era stato assegnato a un team */}
        {teamInfo && (
          <View style={styles.teamCard}>
            <View style={styles.teamCardHeader}>
              <View style={[styles.teamIconContainer, { backgroundColor: `${teamInfo.color}20` }]}>
                <Ionicons name={teamInfo.icon} size={24} color={teamInfo.color} />
              </View>
              <View style={styles.teamCardInfo}>
                <Text style={styles.teamCardTitle}>Sei stato assegnato al Team {teamInfo.team}</Text>
                <Text style={styles.teamCardSubtitle}>
                  {teamInfo.currentPlayers}/{teamInfo.maxPlayers} giocatori confermati
                </Text>
              </View>
            </View>
            <View style={styles.teamCardDivider} />
            <View style={styles.teamCardFooter}>
              <Ionicons name="information-circle-outline" size={16} color="#666" />
              <Text style={styles.teamCardFooterText}>
                Accettando l'invito, verrai inserito in questo team
              </Text>
            </View>
          </View>
        )}

        {/* Info */}
        <View style={styles.card}>
          <View style={styles.creatorSection}>
            {createdBy?.avatarUrl ? (
              <Image
                source={{ uri: `${API_URL}${createdBy.avatarUrl}` }}
                style={styles.creatorAvatar}
              />
            ) : (
              <View style={[styles.creatorAvatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={28} color="#999" />
              </View>
            )}
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{createdBy?.name || "Utente"}</Text>
              <Text style={styles.creatorText}>ti aveva invitato a giocare</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Info Partita */}
          <View style={styles.bookingSection}>
            <Text style={styles.sectionTitle}>📅 Dettagli Partita</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar" size={20} color="#2196F3" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Data</Text>
                <Text style={styles.infoValue}>{formatDate(booking?.date)}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="time" size={20} color="#2196F3" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Orario</Text>
                <Text style={styles.infoValue}>
                  {booking?.startTime} - {booking?.endTime}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="location" size={20} color="#2196F3" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Struttura</Text>
                <Text style={styles.infoValue}>
                  {booking?.campo?.struttura?.name || "Struttura"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="cash" size={20} color="#2196F3" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Prezzo</Text>
                <Text style={styles.infoValue}>
                  €{booking?.price?.toFixed(2) || "0.00"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Time Remaining */}
        {getTimeRemaining() && (
          <View style={styles.timeCard}>
            <Ionicons name="time-outline" size={24} color="#FF9800" />
            <Text style={styles.timeText}>{getTimeRemaining()}</Text>
          </View>
        )}

        {/* Partecipanti con visualizzazione team */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            👥 Partecipanti ({invite.players?.length || 0})
            {invite.maxPlayers && ` / ${invite.maxPlayers}`}
          </Text>
          
          {/* Info Team se la partita ha team */}
          {invite.maxPlayers && invite.maxPlayers > 2 && (
            <View style={styles.teamsInfoContainer}>
              <View style={styles.teamInfoRow}>
                <View style={styles.teamLabel}>
                  <Ionicons name="shield" size={16} color="#2196F3" />
                  <Text style={[styles.teamLabelText, { color: "#2196F3" }]}>Team A</Text>
                </View>
                <Text style={styles.teamCount}>
                  {invite.players?.filter((p: any) => p.team === "A" && p.status === "confirmed").length || 0}
                  {invite.maxPlayers && `/${Math.ceil(invite.maxPlayers / 2)}`}
                </Text>
              </View>
              
              <View style={styles.teamInfoRow}>
                <View style={styles.teamLabel}>
                  <Ionicons name="shield-outline" size={16} color="#F44336" />
                  <Text style={[styles.teamLabelText, { color: "#F44336" }]}>Team B</Text>
                </View>
                <Text style={styles.teamCount}>
                  {invite.players?.filter((p: any) => p.team === "B" && p.status === "confirmed").length || 0}
                  {invite.maxPlayers && `/${Math.ceil(invite.maxPlayers / 2)}`}
                </Text>
              </View>
              
              <View style={styles.teamInfoRow}>
                <View style={styles.teamLabel}>
                  <Ionicons name="help-circle-outline" size={16} color="#FF9800" />
                  <Text style={[styles.teamLabelText, { color: "#FF9800" }]}>Da assegnare</Text>
                </View>
                <Text style={styles.teamCount}>
                  {invite.players?.filter((p: any) => !p.team && p.status === "confirmed").length || 0}
                </Text>
              </View>
            </View>
          )}
          
          <View style={styles.playersGrid}>
            {invite.players?.map((player: any, index: number) => {
              const playerUser = player.user || {};
              const isCurrentUser = playerUser._id === user?.id || player.user === user?.id;
              const playerTeam = player.team;
              
              return (
                <View key={index} style={[
                  styles.playerCard,
                  playerTeam && styles.playerCardWithTeam,
                  playerTeam === "A" && styles.teamACard,
                  playerTeam === "B" && styles.teamBCard,
                  isCurrentUser && styles.currentUserCard
                ]}>
                  <View style={styles.playerAvatarContainer}>
                    {playerUser.avatarUrl ? (
                      <Image
                        source={{ uri: `${API_URL}${playerUser.avatarUrl}` }}
                        style={styles.playerAvatar}
                      />
                    ) : (
                      <View style={[styles.playerAvatar, styles.avatarPlaceholder]}>
                        <Ionicons name="person" size={18} color="#999" />
                      </View>
                    )}
                    
                    {/* Badge Team */}
                    {playerTeam && (
                      <View style={[
                        styles.teamBadge,
                        playerTeam === "A" && styles.teamABadge,
                        playerTeam === "B" && styles.teamBBadge
                      ]}>
                        <Text style={styles.teamBadgeText}>
                          {playerTeam}
                        </Text>
                      </View>
                    )}
                    
                    <View style={[
                      styles.playerStatusDot,
                      player.status === 'confirmed' && styles.statusConfirmedDot,
                      player.status === 'pending' && styles.statusPendingDot,
                      player.status === 'declined' && styles.statusDeclinedDot,
                    ]} />
                  </View>
                  
                  <Text style={styles.playerName} numberOfLines={1}>
                    {playerUser.name || "Giocatore"}
                    {isCurrentUser && " (Tu)"}
                  </Text>
                  
                  <View style={[
                    styles.playerStatusBadge,
                    player.status === 'confirmed' && styles.statusConfirmed,
                    player.status === 'pending' && styles.statusPending,
                    player.status === 'declined' && styles.statusDeclined,
                  ]}>
                    <Text style={styles.playerStatusText}>
                      {player.status === 'confirmed' ? '✓' :
                       player.status === 'pending' ? '?' :
                       '✗'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Azioni */}
        {canChangeResponse ? (
          <View style={styles.actionsContainer}>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
              <Text style={styles.infoBoxText}>
                {teamInfo 
                  ? `Puoi ancora cambiare idea e accettare questo invito. Sarai inserito nel Team ${teamInfo.team}.`
                  : "Puoi ancora cambiare idea e accettare questo invito"
                }
              </Text>
            </View>
            
            <Pressable
              style={styles.acceptButton}
              onPress={handleChangeResponse}
              disabled={responding}
            >
              {responding ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="white" />
                  <Text style={styles.acceptButtonText}>
                    {teamInfo ? `Accetta - Team ${teamInfo.team}` : "Accetta Invito"}
                  </Text>
                </>
              )}
            </Pressable>

            {/* Bottone per rifiutare nuovamente (opzionale) */}
            <Pressable
              style={styles.declineAgainButton}
              onPress={handleDeclineAgain}
              disabled={responding}
            >
              <Ionicons name="close-circle" size={22} color="#F44336" />
              <Text style={styles.declineAgainButtonText}>Conferma Rifiuto</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.cannotChangeContainer}>
            <Ionicons name="lock-closed" size={32} color="#999" />
            <Text style={styles.cannotChangeTitle}>
              Non puoi più cambiare risposta
            </Text>
            <Text style={styles.cannotChangeText}>
              {getCannotChangeReason()}
            </Text>
            
            {/* Se l'utente è il creatore, può invitare un sostituto */}
            {isCreator && (
              <Pressable
                style={styles.inviteReplacementButton}
                onPress={() => setInviteModalVisible(true)}
              >
                <Ionicons name="person-add" size={18} color="#2196F3" />
                <Text style={styles.inviteReplacementText}>Invita un sostituto</Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Modal per invitare un sostituto (solo per il creatore) */}
      {isCreator && (
        <Modal
          visible={inviteModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setInviteModalVisible(false);
            setSearchQuery("");
            setSearchResults([]);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {userTeam ? `Invita sostituto - Team ${userTeam}` : 'Invita un sostituto'}
                </Text>
                <Pressable onPress={() => {
                  setInviteModalVisible(false);
                  setSearchQuery("");
                  setSearchResults([]);
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
                  searchResults.map((userItem) => (
                    <Pressable
                      key={userItem._id}
                      style={styles.searchResultItem}
                      onPress={() => handleInviteReplacement(userItem.username)}
                    >
                      {userItem.avatarUrl ? (
                        <Image
                          source={{ uri: `${API_URL}${userItem.avatarUrl}` }}
                          style={styles.resultAvatar}
                        />
                      ) : (
                        <View style={styles.resultAvatarPlaceholder}>
                          <Ionicons name="person" size={20} color="#999" />
                        </View>
                      )}
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName}>{userItem.name}</Text>
                        <Text style={styles.resultUsername}>@{userItem.username}</Text>
                      </View>
                      <Ionicons name="add-circle" size={24} color="#2196F3" />
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  declinedBanner: {
    backgroundColor: "#F44336",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 4,
  },
  declinedBannerText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  declinedTimeText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
  },
  // Stili per la sezione Team
  teamCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  teamCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  teamIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  teamCardInfo: {
    flex: 1,
  },
  teamCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  teamCardSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  teamCardDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  teamCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teamCardFooterText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  // Stili per info Team nei giocatori
  teamsInfoContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  teamInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  teamLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teamLabelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  teamCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  playerCardWithTeam: {
    borderWidth: 2,
    borderColor: "transparent",
  },
  teamACard: {
    borderColor: "#2196F3",
    backgroundColor: "#F0F8FF",
  },
  teamBCard: {
    borderColor: "#F44336",
    backgroundColor: "#FFF0F0",
  },
  currentUserCard: {
    borderColor: "#FF9800",
    borderWidth: 2,
  },
  teamBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "white",
  },
  teamABadge: {
    backgroundColor: "#2196F3",
  },
  teamBBadge: {
    backgroundColor: "#F44336",
  },
  teamBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900",
  },
  card: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  creatorSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  creatorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  creatorInfo: {
    marginLeft: 16,
    flex: 1,
  },
  creatorName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  creatorText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 20,
  },
  bookingSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#FFF3CD",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#856404",
  },
  playersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 12,
  },
  playerCard: {
    width: "30%",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  playerAvatarContainer: {
    position: "relative",
  },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  playerStatusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "white",
  },
  statusConfirmedDot: {
    backgroundColor: "#4CAF50",
  },
  statusPendingDot: {
    backgroundColor: "#FFC107",
  },
  statusDeclinedDot: {
    backgroundColor: "#F44336",
  },
  playerName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  playerStatusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusConfirmed: {
    backgroundColor: "#E8F5E8",
  },
  statusPending: {
    backgroundColor: "#FFF3CD",
  },
  statusDeclined: {
    backgroundColor: "#FFEBEE",
  },
  playerStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  actionsContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    gap: 16,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    color: "#1976D2",
    lineHeight: 20,
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  declineAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#F44336",
    paddingVertical: 14,
    borderRadius: 12,
  },
  declineAgainButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F44336",
  },
  cannotChangeContainer: {
    alignItems: "center",
    marginHorizontal: 32,
    marginTop: 32,
    gap: 12,
    padding: 24,
    backgroundColor: "white",
    borderRadius: 16,
  },
  cannotChangeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#666",
    textAlign: "center",
  },
  cannotChangeText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  inviteReplacementButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#2196F3",
    borderRadius: 8,
  },
  inviteReplacementText: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "600",
  },
  footerSpacer: {
    height: 40,
  },
  // Stili per modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  searchResults: {
    maxHeight: 300,
    paddingHorizontal: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resultUsername: {
    fontSize: 14,
    color: '#666',
  },
  noResults: {
    textAlign: 'center',
    paddingVertical: 20,
    color: '#666',
  },
});

export default DettaglioInvitoRifiutato;