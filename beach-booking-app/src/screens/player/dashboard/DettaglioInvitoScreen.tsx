import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import API_URL from "../../../config/api";
import { resolveAvatarUrl } from "../../../utils/avatar";
import { AuthContext } from "../../../context/AuthContext";
import { useCustomAlert } from "../../../hooks/useCustomAlert";

const DettaglioInvito = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { token, user } = useContext(AuthContext);
  const { showAlert, AlertComponent } = useCustomAlert();
  
  const { inviteId, inviteData } = route.params as any;
  const [loading, setLoading] = useState(!inviteData);
  const [invite, setInvite] = useState(inviteData);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inviteData) {
      loadInviteDetails();
    } else {
      // Verifica che l'utente sia effettivamente un player nel match
      const isUserPlayer = inviteData.players?.some((p: any) => 
        p.user?._id === user?.id || p.user === user?.id
      );
      
      if (!isUserPlayer) {
        setError("Non sei autorizzato a visualizzare questo invito");
      }
    }
  }, []);

  const loadInviteDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usa l'endpoint corretto che include l'autenticazione
      const res = await fetch(`${API_URL}/matches/${inviteId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      
      if (res.status === 403) {
        setError("Non sei autorizzato a visualizzare questo invito");
        return;
      }
      
      if (res.status === 404) {
        setError("Invito non trovato");
        return;
      }
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Errore API:", res.status, errorText);
        setError(`Errore ${res.status}: Impossibile caricare l'invito`);
        return;
      }
      
      const data = await res.json();
      
      // Verifica che l'utente sia un player nel match
      const isUserPlayer = data.players?.some((p: any) => 
        p.user?._id === user?.id || p.user === user?.id
      );
      
      if (!isUserPlayer) {
        setError("Non sei autorizzato a visualizzare questo invito");
        return;
      }
      
      setInvite(data);
    } catch (error) {
      console.error("Errore caricamento dettagli invito:", error);
      setError("Impossibile caricare i dettagli dell'invito");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (response: "accept" | "decline") => {
    try {
      setResponding(true);
      
      // Se accettiamo, dobbiamo includere il team assegnato
      const myPlayer = invite?.players?.find((p: any) => 
        p.user?._id === user?.id || p.user === user?.id
      );
      const assignedTeam = myPlayer?.team;
      
      const body: any = { action: response };
      
      if (response === "accept" && assignedTeam) {
        body.team = assignedTeam;
        console.log("Includo team nella richiesta:", assignedTeam);
      }
      
      const res = await fetch(`${API_URL}/matches/${inviteId}/respond`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showAlert({
          type: response === "accept" ? 'success' : 'info',
          title: response === "accept" ? "Invito accettato!" : "Invito rifiutato",
          message: response === "accept" 
            ? "La partita è stata aggiunta alle tue prenotazioni." 
            : "Hai rifiutato l'invito.",
          buttons: [
            {
              text: "OK",
              onPress: () => {
                // Se accetta, vai alla prenotazione
                if (response === "accept" && invite?.booking) {
                  navigation.navigate("DettaglioPrenotazione", {
                    bookingId: invite.booking._id || invite.booking,
                  });
                } else {
                  // Se rifiuta, torna indietro
                  navigation.goBack();
                }
              }
            }
          ]
        });
      } else if (res.status === 404) {
        showAlert({ type: 'error', title: 'Errore', message: 'Invito non trovato o già risposto' });
      } else if (res.status === 403) {
        showAlert({ type: 'error', title: 'Errore', message: 'Non sei autorizzato a rispondere a questo invito' });
      } else {
        throw new Error("Errore nella risposta");
      }
    } catch (error) {
      showAlert({ type: 'error', title: 'Errore', message: 'Impossibile rispondere all\'invito. Riprova.' });
      console.error("Errore risposta invito:", error);
    } finally {
      setResponding(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Data non disponibile";
    
    try {
      const date = new Date(dateStr + "T12:00:00");
      const today = new Date();
      
      if (date.toDateString() === today.toDateString()) {
        return "Oggi";
      } else {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === tomorrow.toDateString()) {
          return "Domani";
        }
      }
      
      return date.toLocaleDateString("it-IT", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch (error) {
      return dateStr;
    }
  };

  const openStructureDetails = (strutturaId: string) => {
    navigation.navigate("DettaglioStruttura", { strutturaId });
  };

  const openMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.google.com/?q=${encodedAddress}`;
    Linking.openURL(url).catch(err => 
      showAlert({ type: 'error', title: 'Errore', message: 'Impossibile aprire Google Maps' })
    );
  };

  const openDirections = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    Linking.openURL(url).catch(err => 
      showAlert({ type: 'error', title: 'Errore', message: 'Impossibile aprire le indicazioni' })
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento invito...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>Errore</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
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

  if (!invite) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#666" />
          <Text style={styles.errorText}>Invito non trovato</Text>
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

  const match = invite;
  const booking = invite.booking || match.booking;
  const createdBy = invite.createdBy || match.createdBy;
  const players = match.players || [];
  const struttura = booking?.campo?.struttura;

  // Calcola se l'invito è scaduto
  const isExpired = () => {
    if (!booking?.date) return false;
    try {
      const matchDate = new Date(`${booking.date}T${booking.startTime}`);
      return matchDate < new Date();
    } catch {
      return false;
    }
  };

  const expired = isExpired();

  // Trova lo stato dell'utente corrente
  const myPlayer = players.find((p: any) => 
    p.user?._id === user?.id || p.user === user?.id
  );
  const myStatus = myPlayer?.status || "unknown";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Status Banner */}
        {expired && (
          <View style={styles.expiredBanner}>
            <Ionicons name="time-outline" size={20} color="#FFF" />
            <Text style={styles.expiredBannerText}>
              Questo invito è scaduto
            </Text>
          </View>
        )}

        {/* Info Creatore */}
        <View style={styles.card}>
          <View style={styles.creatorSection}>
            <View style={styles.avatarContainer}>
              {createdBy?.avatarUrl ? (
                <Image
                  source={{ uri: resolveAvatarUrl(createdBy.avatarUrl) || "" }}
                  style={styles.creatorAvatar}
                />
              ) : (
                <View style={[styles.creatorAvatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={28} color="#999" />
                </View>
              )}
            </View>
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{createdBy?.name || "Utente"}</Text>
              <Text style={styles.creatorText}>ti ha invitato a una partita</Text>
              <Text style={styles.creatorTime}>
                {new Date(match.createdAt).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />
          
          {/* Informazioni Partita */}
          <View style={styles.bookingSection}>
            <Text style={styles.sectionTitle}>📅 Informazioni Partita</Text>
            
            {booking?.date && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="calendar" size={20} color="#2196F3" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Data</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(booking.date)}
                  </Text>
                </View>
              </View>
            )}
            
            {booking?.startTime && booking?.endTime && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="time" size={20} color="#2196F3" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Orario</Text>
                  <Text style={styles.infoValue}>
                    {booking.startTime} - {booking.endTime}
                  </Text>
                </View>
              </View>
            )}

            {booking?.price && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="cash" size={20} color="#2196F3" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Prezzo</Text>
                  <Text style={styles.infoValue}>
                    €{booking.price.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Struttura - Cliccabile */}
        {struttura && (
          <Pressable 
            style={styles.card}
            onPress={() => openStructureDetails(struttura._id)}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏟️ Struttura</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
            
            {struttura.images?.[0] && (
              <Image
                source={{ uri: resolveAvatarUrl(struttura.images[0]) || "" }}
                style={styles.structureImage}
              />
            )}
            
            <View style={styles.structureInfo}>
              <Text style={styles.structureName}>{struttura.name}</Text>
              
              {struttura.address && (
                <View style={styles.addressRow}>
                  <Ionicons name="location" size={16} color="#666" />
                  <Text style={styles.addressText}>{struttura.address}</Text>
                </View>
              )}
              
              {struttura.city && (
                <View style={styles.addressRow}>
                  <Ionicons name="business" size={16} color="#666" />
                  <Text style={styles.addressText}>
                    {struttura.city} {struttura.zipCode ? `(${struttura.zipCode})` : ''}
                  </Text>
                </View>
              )}

              {/* Azioni rapide */}
              <View style={styles.structureActions}>
                {struttura.address && (
                  <>
                    <Pressable 
                      style={styles.structureActionButton}
                      onPress={() => openMaps(struttura.address)}
                    >
                      <Ionicons name="map-outline" size={16} color="#2196F3" />
                      <Text style={styles.structureActionText}>Mappa</Text>
                    </Pressable>
                    
                    <Pressable 
                      style={styles.structureActionButton}
                      onPress={() => openDirections(struttura.address)}
                    >
                      <Ionicons name="navigate-outline" size={16} color="#4CAF50" />
                      <Text style={styles.structureActionText}>Indicazioni</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </Pressable>
        )}

        {/* Partecipanti */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>👥 Partecipanti ({players.length})</Text>
          
          <View style={styles.playersGrid}>
            {players.map((player: any, index: number) => {
              const playerUser = player.user || {};
              const isCurrentUser = playerUser._id === user?.id || player.user === user?.id;
              
              return (
                <View key={index} style={styles.playerCard}>
                  <View style={styles.playerAvatarContainer}>
                    {playerUser.avatarUrl ? (
                      <Image
                        source={{ uri: resolveAvatarUrl(playerUser.avatarUrl) || "" }}
                        style={styles.playerAvatar}
                      />
                    ) : (
                      <View style={[styles.playerAvatar, styles.avatarPlaceholder]}>
                        <Ionicons name="person" size={18} color="#999" />
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

          {/* Legenda stati */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendConfirmed]} />
              <Text style={styles.legendText}>Confermato</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendPending]} />
              <Text style={styles.legendText}>In attesa</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDeclined]} />
              <Text style={styles.legendText}>Rifiutato</Text>
            </View>
          </View>
        </View>

        {/* Azioni */}
        {myStatus === "pending" && !expired && (
          <View style={styles.actionsContainer}>
            <Pressable
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleRespond("decline")}
              disabled={responding}
            >
              <Ionicons name="close" size={22} color="#F44336" />
              <Text style={styles.declineButtonText}>Rifiuta Invito</Text>
            </Pressable>
            
            <Pressable
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleRespond("accept")}
              disabled={responding}
            >
              {responding ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={22} color="white" />
                  <Text style={styles.acceptButtonText}>Accetta Invito</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {(expired || myStatus !== "pending") && (
          <View style={styles.expiredActions}>
            <Text style={styles.expiredMessage}>
              {expired ? "Questo invito non è più valido perché la data è passata" :
               myStatus === "confirmed" ? "Hai già accettato questo invito" :
               myStatus === "declined" ? "Hai rifiutato questo invito" :
               "Invito non disponibile"}
            </Text>
          </View>
        )}

        <View style={styles.footerSpacer} />
      </ScrollView>
      <AlertComponent />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
  expiredBanner: {
    backgroundColor: "#FF9800",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
  },
  expiredBannerText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
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
  avatarContainer: {
    position: "relative",
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
  creatorTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 20,
  },
  bookingSection: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
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
  structureImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  structureInfo: {
    gap: 12,
  },
  structureName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addressText: {
    fontSize: 15,
    color: "#666",
    flex: 1,
  },
  structureActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  structureActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  structureActionText: {
    fontSize: 14,
    fontWeight: "600",
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
  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendConfirmed: {
    backgroundColor: "#4CAF50",
  },
  legendPending: {
    backgroundColor: "#FFC107",
  },
  legendDeclined: {
    backgroundColor: "#F44336",
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  declineButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  acceptButton: {
    backgroundColor: "#2196F3",
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F44336",
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  expiredActions: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
    padding: 20,
    backgroundColor: "#FFF3CD",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  expiredMessage: {
    fontSize: 15,
    color: "#856404",
    textAlign: "center",
    lineHeight: 22,
  },
  footerSpacer: {
    height: 40,
  },
});

export default DettaglioInvito;