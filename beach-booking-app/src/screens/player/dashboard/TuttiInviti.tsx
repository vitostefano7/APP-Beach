import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useContext, useState, useCallback, useLayoutEffect } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import { useFocusEffect } from "@react-navigation/native";
import API_URL from "../../../config/api";
import { resolveAvatarUrl } from "../../../utils/avatar";
import SportIcon from "../../../components/SportIcon";
import styles from "./TuttiInviti.styles";

export default function TuttiInvitiScreen() {
  const { token, user } = useContext(AuthContext);
  const { showAlert, AlertComponent } = useCustomAlert();
  const navigation = useNavigation<any>();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Tutti gli Inviti Ricevuti",
      headerTitleStyle: { fontSize: 18 },
      headerTitleAlign: "center",
      headerBackTitleVisible: false,
      headerLeft: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#f0f0f0",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-back" size={20} color="#333" />
        </Pressable>
      ),
    });
  }, [navigation]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "declined" | "expired">("all");

  useFocusEffect(
    useCallback(() => {
      setFilter("all");
      loadAllMatches();
    }, [])
  );

  // Nel file TuttiInviti.tsx, modifica loadAllMatches:
const loadAllMatches = async () => {
  try {
    setLoading(true);
    console.log("📡 Caricamento TUTTI i match per utente:", user?.id);
    console.log("📡 Token presente:", token ? "Sì" : "No");
    console.log("📡 API URL:", API_URL);

    const res = await fetch(`${API_URL}/matches/me`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    console.log("📡 Risposta status:", res.status);
    console.log("📡 Risposta headers:", Object.fromEntries(res.headers.entries()));

    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Ricevuti ${data.length} match totali`);
      console.log("📊 Primo match (se presente):", data[0] ? JSON.stringify(data[0], null, 2).substring(0, 500) : "Nessun match");
      
      const userInvites = data.filter((match: any) => {
        console.log("🔍 Analizzo match:", match._id);
        console.log("   Creato da:", match.createdBy?._id);
        console.log("   Players:", match.players?.length);
        
        const myPlayer = match.players?.find((p: any) => {
          const playerId = p.user?._id || p.user;
          const userId = user?.id;
          console.log(`   Comparo: ${playerId} === ${userId}`, playerId === userId);
          return playerId === userId;
        });
        
        const isCreatedByMe = match.createdBy?._id === user?.id;
        console.log(`   Sono creatore? ${isCreatedByMe}`);
        console.log(`   Sono player? ${!!myPlayer}`);
        console.log(`   È invito? ${!!myPlayer && !isCreatedByMe}`);
        
        return myPlayer && !isCreatedByMe;
      });
      
      console.log(`📋 ${userInvites.length} inviti totali da altri`);
      setInvites(userInvites);
    } else {
      const errorText = await res.text();
      console.error("❌ Errore completo nel caricamento:");
      console.error("   Status:", res.status);
      console.error("   Body:", errorText);
      
      // Prova a parsare come JSON se possibile
      try {
        const errorJson = JSON.parse(errorText);
        console.error("   Error JSON:", errorJson);
      } catch {
        // Non è JSON, lascia come testo
      }
      
      showAlert({ type: 'error', title: 'Errore', message: 'Impossibile caricare gli inviti' });
    }
  } catch (error) {
    console.error("❌ Errore caricamento match:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }
    showAlert({ type: 'error', title: 'Errore', message: 'Impossibile caricare gli inviti' });
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  const onRefresh = () => {
    setRefreshing(true);
    loadAllMatches();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Data non disponibile";
    
    try {
      const date = new Date(dateStr + "T12:00:00");
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return "Oggi";
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return "Domani";
      } else {
        return date.toLocaleDateString("it-IT", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
      }
    } catch (error) {
      console.error("Errore formattazione data:", dateStr, error);
      return dateStr;
    }
  };

  const isInviteExpired = (invite: any) => {
    const booking = invite.booking;
    if (!booking?.date || !booking?.startTime) {
      return false;
    }
    
    try {
      const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
      const cutoffTime = new Date(matchDateTime);
      cutoffTime.setHours(cutoffTime.getHours() - 2);
      
      const now = new Date();
      return now > cutoffTime;
    } catch (error) {
      console.error("Errore nel calcolo scadenza:", error);
      return false;
    }
  };

  const getTimeSinceExpiration = (invite: any) => {
    const booking = invite.booking;
    if (!booking?.date || !booking?.startTime) return "";
    
    try {
      const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
      const cutoffTime = new Date(matchDateTime);
      cutoffTime.setHours(cutoffTime.getHours() - 2);
      
      const now = new Date();
      const hoursDiff = Math.floor((now.getTime() - cutoffTime.getTime()) / (1000 * 60 * 60));
      
      if (hoursDiff < 24) {
        return `Scaduto ${hoursDiff} ore fa`;
      } else {
        const daysDiff = Math.floor(hoursDiff / 24);
        return `Scaduto ${daysDiff} giorni fa`;
      }
    } catch (error) {
      return "";
    }
  };

  const getMyPlayerStatus = (invite: any) => {
    const myPlayer = invite.players?.find((p: any) => {
      return p.user?._id === user?.id || p.user === user?.id;
    });
    
    return myPlayer?.status || "unknown";
  };

  const getFilteredInvites = () => {
    if (filter === "all") {
      return invites;
    }
    
    if (filter === "pending") {
      return invites.filter((invite) => {
        const status = getMyPlayerStatus(invite);
        const isExpired = isInviteExpired(invite);
        return status === "pending" && !isExpired;
      });
    }
    
    if (filter === "expired") {
      return invites.filter((invite) => {
        const status = getMyPlayerStatus(invite);
        const isExpired = isInviteExpired(invite);
        return status === "pending" && isExpired;
      });
    }
    
    return invites.filter((invite) => {
      const status = getMyPlayerStatus(invite);
      return status === filter;
    });
  };

  const filteredInvites = getFilteredInvites();

  const getFilterCount = (filterType: string) => {
    if (filterType === "all") return invites.length;
    
    if (filterType === "pending") {
      return invites.filter((invite) => {
        const status = getMyPlayerStatus(invite);
        const isExpired = isInviteExpired(invite);
        return status === "pending" && !isExpired;
      }).length;
    }
    
    if (filterType === "expired") {
      return invites.filter((invite) => {
        const status = getMyPlayerStatus(invite);
        const isExpired = isInviteExpired(invite);
        return status === "pending" && isExpired;
      }).length;
    }
    
    return invites.filter((invite) => {
      const status = getMyPlayerStatus(invite);
      return status === filterType;
    }).length;
  };

  const canChangeDeclinedResponse = (invite: any) => {
    const booking = invite.booking;
    if (!booking?.date || !booking?.startTime) {
      return false;
    }
    
    try {
      const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
      const now = new Date();
      const minutesDiff = (matchDateTime.getTime() - now.getTime()) / (1000 * 60);
      
      const confirmedPlayers = invite.players?.filter((p: any) => p.status === "confirmed").length || 0;
      const hasAvailableSlots = confirmedPlayers < (invite.maxPlayers || 4);
      
      return minutesDiff > 30 && hasAvailableSlots;
    } catch (error) {
      return false;
    }
  };

  const renderInviteCard = ({ item }: { item: any }) => {
    const booking = item.booking;
    const myStatus = getMyPlayerStatus(item);
    const isExpired = isInviteExpired(item);
    
    if (!booking) return null;

    // Calcola il prezzo per persona
    const pricePerPerson = booking?.price && item?.players ? 
      (booking.price / item.players.length).toFixed(2) : null;

    let statusLabel = "In attesa";
    let statusColor = "#FF9800";
    let statusIcon = "time";
    let isActiveInvite = false;

    if (myStatus === "pending" && isExpired) {
      statusLabel = "Scaduto";
      statusColor = "#757575";
      statusIcon = "time-outline";
    } else if (myStatus === "pending") {
      isActiveInvite = true;
    } else if (myStatus === "confirmed") {
      statusLabel = "Accettato";
      statusColor = "#4CAF50";
      statusIcon = "checkmark-circle";
    } else if (myStatus === "declined") {
      statusLabel = "Rifiutato";
      statusColor = "#F44336";
      statusIcon = "close-circle";
    }

    return (
      <Pressable
        style={[
          styles.inviteCard,
          isExpired && styles.expiredCard,
          myStatus === "confirmed" && styles.confirmedCard,
          myStatus === "declined" && styles.declinedCard,
        ]}
        onPress={() => {
          const bookingId = booking?._id;
          if (!bookingId) {
            showAlert({ type: 'error', title: 'Errore', message: 'Dettagli prenotazione non disponibili' });
            return;
          }
          navigation.navigate("DettaglioPrenotazione", {
            bookingId,
          });
        }}
      >
        {isExpired && myStatus === "pending" && (
          <View style={styles.expiredBadge}>
            <Ionicons name="time-outline" size={12} color="white" />
            <Text style={styles.expiredBadgeText}>
              {getTimeSinceExpiration(item)}
            </Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            {item.createdBy?.avatarUrl ? (
              <Image
                source={{ uri: resolveAvatarUrl(item.createdBy.avatarUrl) || "" }}
                style={styles.creatorAvatar}
              />
            ) : (
              <View style={styles.creatorAvatarPlaceholder}>
                <Ionicons name="person" size={20} color="#999" />
              </View>
            )}
            <View style={styles.creatorInfo}>
              <Text style={[
                styles.creatorName,
                isExpired && styles.expiredText,
                myStatus === "declined" && styles.declinedText
              ]}>
                {item.createdBy?.name || "Utente"} {item.createdBy?.surname || ""}
              </Text>
              <Text style={[
                styles.inviteText,
                isExpired && styles.expiredText,
                myStatus === "declined" && styles.declinedText
              ]}>
                ti ha invitato a giocare
              </Text>
            </View>
          </View>
          
          <View style={[
            styles.statusBadge,
            { backgroundColor: statusColor + "20" }
          ]}>
            <Ionicons 
              name={statusIcon as any} 
              size={12} 
              color={statusColor} 
              style={{ marginRight: 4 }}
            />
            <Text style={[
              styles.statusBadgeText,
              { color: statusColor }
            ]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={[
          styles.matchInfoSection,
          isExpired && styles.expiredMatchInfo
        ]}>
          <View style={styles.matchInfoRow}>
            <Ionicons name="location" size={16} color={isExpired ? "#999" : "#2196F3"} />
            <Text style={[
              styles.matchInfoText,
              isExpired && styles.expiredText
            ]} numberOfLines={1}>
              {booking.campo?.struttura?.name || "Struttura"}
            </Text>
          </View>

          <View style={styles.matchInfoRow}>
            <Ionicons name="calendar" size={16} color={isExpired ? "#999" : "#666"} />
            <Text style={[
              styles.matchInfoText,
              isExpired && styles.expiredText
            ]}>
              {formatDate(booking.date)}
            </Text>
          </View>

          <View style={styles.matchInfoRow}>
            <Ionicons name="time" size={16} color={isExpired ? "#999" : "#666"} />
            <Text style={[
              styles.matchInfoText,
              isExpired && styles.expiredText
            ]}>
              {booking.startTime} - {booking.endTime}
            </Text>
          </View>

          <View style={styles.matchInfoRow}>
            <SportIcon sport={booking.campo?.sport?.code} size={16} color={isExpired ? "#999" : "#666"} />
            <Text style={[
              styles.matchInfoText,
              isExpired && styles.expiredText
            ]}>
              {booking.campo?.sport?.name || "Sport"}
            </Text>
          </View>

          {pricePerPerson && (
            <View style={styles.matchInfoRow}>
              <Ionicons name="wallet-outline" size={16} color={isExpired ? "#999" : "#4CAF50"} />
              <Text style={[
                styles.matchInfoText,
                isExpired && styles.expiredText,
                !isExpired && { color: "#4CAF50", fontWeight: "600" }
              ]}>
                € {pricePerPerson}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.playersPreview}>
          <View style={styles.playersAvatars}>
            {item.players?.slice(0, 4).map((player: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.playerAvatarWrapper,
                  index > 0 && styles.playerAvatarOverlap,
                ]}
              >
                {player.user?.avatarUrl ? (
                  <Image
                    source={{ uri: resolveAvatarUrl(player.user.avatarUrl) || "" }}
                    style={[
                      styles.playerAvatarSmall,
                      isExpired && styles.expiredPlayerAvatar
                    ]}
                  />
                ) : (
                  <View style={[
                    styles.playerAvatarSmallPlaceholder,
                    isExpired && styles.expiredPlayerAvatar
                  ]}>
                    <Ionicons name="person" size={12} color="#999" />
                  </View>
                )}
              </View>
            ))}
          </View>
          <Text style={[
            styles.playersCount,
            isExpired && styles.expiredText
          ]}>
            {item.players?.filter((p: any) => p.status === "confirmed").length || 0} /{" "}
            {item.maxPlayers || item.players?.length} giocatori
          </Text>
        </View>

        {isActiveInvite && (
          <View style={styles.cardQuickActions}>
            <Pressable
              style={[styles.quickActionButton, styles.quickDeclineButton]}
              onPress={(e) => {
                e.stopPropagation();
                showAlert({
                  type: 'warning',
                  title: 'Rifiuta invito',
                  message: 'Sei sicuro di voler rifiutare questo invito?',
                  buttons: [
                    { text: "Annulla", style: "cancel" },
                    {
                      text: "Rifiuta",
                      style: "destructive",
                      onPress: () => respondToInvite(item._id, "decline")
                    }
                  ]
                });
              }}
            >
              <Ionicons name="close" size={16} color="#F44336" />
              <Text style={styles.quickActionText}>Rifiuta</Text>
            </Pressable>
            <Pressable
              style={[styles.quickActionButton, styles.quickAcceptButton]}
              onPress={(e) => {
                e.stopPropagation();
                showAlert({
                  type: 'info',
                  title: 'Accetta invito',
                  message: 'Sei sicuro di voler accettare questo invito?',
                  buttons: [
                    { text: "Annulla", style: "cancel" },
                    {
                      text: "Accetta",
                      onPress: () => respondToInvite(item._id, "accept")
                    }
                  ]
                });
              }}
            >
              <Ionicons name="checkmark" size={16} color="white" />
              <Text style={[styles.quickActionText, styles.quickAcceptText]}>Accetta</Text>
            </Pressable>
          </View>
        )}

        {!isActiveInvite && (
          <View style={[
            styles.respondedMessage,
            myStatus === "confirmed" && styles.confirmedMessage,
            myStatus === "declined" && styles.declinedMessage,
            isExpired && styles.expiredMessage
          ]}>
            <Ionicons 
              name={statusIcon} 
              size={16} 
              color={statusColor} 
            />
            <Text style={[
              styles.respondedMessageText,
              { color: statusColor }
            ]}>
              {myStatus === "confirmed" ? "Hai accettato questo invito" : 
               myStatus === "declined" ? "Hai rifiutato questo invito" :
               "Invito scaduto"}
            </Text>
          </View>
        )}

        <View style={styles.chevronContainer}>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={
              isExpired ? "#ddd" : 
              myStatus === "declined" ? "#FFCDD2" : 
              "#ccc"
            } 
          />
        </View>
      </Pressable>
    );
  };

  const respondToInvite = async (matchId: string, response: "accept" | "decline") => {
    try {
      console.log(`🤔 Risposta invito ${matchId}: ${response}`);
      
      const myInvite = invites.find((inv: any) => inv._id === matchId);
      const myPlayer = myInvite?.players?.find((p: any) => 
        p.user?._id === user?.id || p.user === user?.id
      );
      const assignedTeam = myPlayer?.team;
      
      console.log("Team assegnato:", assignedTeam);
      
      const body: any = { action: response };
      
      if (response === "accept" && assignedTeam) {
        body.team = assignedTeam;
        console.log("Includo team nella richiesta:", assignedTeam);
      }
      
      const res = await fetch(`${API_URL}/matches/${matchId}/respond`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Errore sconosciuto" }));
        console.error("❌ Errore risposta:", errorData);
        throw new Error(errorData.message || "Errore nella risposta");
      }

      await loadAllMatches();
      
      showAlert({
        type: response === "accept" ? 'success' : 'info',
        title: response === "accept" ? "Invito accettato!" : "Invito rifiutato",
        message: response === "accept" 
          ? "La partita è stata aggiunta alle tue prenotazioni." 
          : "Hai rifiutato l'invito.",
        buttons: [{ text: "OK" }]
      });

    } catch (error: any) {
      console.error("❌ Errore risposta invito:", error);
      showAlert({
        type: 'error',
        title: 'Errore',
        message: error.message || "Non è stato possibile rispondere all'invito",
        buttons: [{ text: "OK" }]
      });
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento inviti...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>

      <View style={styles.statsBar}>
        <Pressable 
          style={[styles.statItem, filter === "all" && styles.statItemActive]}
          onPress={() => setFilter("all")}
        >
          <Text style={[styles.statValue, filter === "all" && styles.statValueActive]}>{invites.length}</Text>
          <Text style={[styles.statLabel, filter === "all" && styles.statLabelActive]}>Totali</Text>
        </Pressable>
        <View style={styles.statDivider} />
        <Pressable 
          style={[styles.statItem, filter === "pending" && styles.statItemActive]}
          onPress={() => setFilter("pending")}
        >
          <Text style={[styles.statValue, styles.statPending, filter === "pending" && styles.statValueActive]}>
            {getFilterCount("pending")}
          </Text>
          <Text style={[styles.statLabel, filter === "pending" && styles.statLabelActive]}>In attesa</Text>
        </Pressable>
        <View style={styles.statDivider} />
        <Pressable 
          style={[styles.statItem, filter === "confirmed" && styles.statItemActive]}
          onPress={() => setFilter("confirmed")}
        >
          <Text style={[styles.statValue, styles.statConfirmed, filter === "confirmed" && styles.statValueActive]}>
            {getFilterCount("confirmed")}
          </Text>
          <Text style={[styles.statLabel, filter === "confirmed" && styles.statLabelActive]}>Accettati</Text>
        </Pressable>
        <View style={styles.statDivider} />
        <Pressable 
          style={[styles.statItem, filter === "declined" && styles.statItemActive]}
          onPress={() => setFilter("declined")}
        >
          <Text style={[styles.statValue, styles.statDeclined, filter === "declined" && styles.statValueActive]}>
            {getFilterCount("declined")}
          </Text>
          <Text style={[styles.statLabel, filter === "declined" && styles.statLabelActive]}>Rifiutati</Text>
        </Pressable>
        <View style={styles.statDivider} />
        <Pressable 
          style={[styles.statItem, filter === "expired" && styles.statItemActive]}
          onPress={() => setFilter("expired")}
        >
          <Text style={[styles.statValue, styles.statExpired, filter === "expired" && styles.statValueActive]}>
            {getFilterCount("expired")}
          </Text>
          <Text style={[styles.statLabel, filter === "expired" && styles.statLabelActive]}>Scaduti</Text>
        </Pressable>
      </View>

      {filteredInvites.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons 
              name={filter === "expired" ? "time-outline" : 
                    filter === "pending" ? "time" :
                    filter === "confirmed" ? "checkmark-circle" :
                    filter === "declined" ? "close-circle" : "mail-open-outline"} 
              size={48} 
              color="#2196F3" 
            />
          </View>
          <Text style={styles.emptyStateTitle}>
            {filter === "expired" ? "Nessun invito scaduto" : 
             filter === "pending" ? "Nessun invito in attesa" :
             filter === "confirmed" ? "Nessun invito accettato" :
             filter === "declined" ? "Nessun invito rifiutato" : "Nessun invito"}
          </Text>
          <Text style={styles.emptyStateSubtitle}>
            {filter === "pending"
              ? "Non hai inviti in attesa di risposta"
              : filter === "expired"
              ? "Non hai inviti scaduti"
              : filter === "declined"
              ? "Non hai inviti rifiutati"
              : "Non hai inviti in questa categoria"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvites}
          keyExtractor={(item) => item._id}
          renderItem={renderInviteCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
      <AlertComponent />
    </SafeAreaView>
  );
}