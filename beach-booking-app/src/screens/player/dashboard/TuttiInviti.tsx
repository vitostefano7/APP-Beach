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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useContext, useState, useCallback } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import API_URL from "../../../config/api";
import styles from "./TuttiInviti.styles";

export default function TuttiInvitiScreen() {
  const { token, user } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "declined" | "expired">("all");

  useFocusEffect(
    useCallback(() => {
      loadAllMatches();
    }, [])
  );

  const loadAllMatches = async () => {
    try {
      setLoading(true);
      console.log("📡 Caricamento TUTTI i match per utente:", user?.id);

      const res = await fetch(`${API_URL}/matches/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`✅ Ricevuti ${data.length} match totali`);
        setAllMatches(data);
        
        // Filtra SOLO gli inviti di ALTRI (esclude match creati dall'utente)
        const userInvites = data.filter((match: any) => {
          const myPlayer = match.players?.find((p: any) => p.user._id === user?.id);
          const isCreatedByMe = match.createdBy?._id === user?.id;
          
          // Solo match dove:
          // 1. L'utente è un player
          // 2. NON è il creatore del match (non sono sue partite)
          return myPlayer && !isCreatedByMe;
        });
        
        console.log(`📋 ${userInvites.length} inviti ricevuti da altri`);
        setInvites(userInvites);
      }
    } catch (error) {
      console.error("Errore caricamento match:", error);
      Alert.alert("Errore", "Impossibile caricare gli inviti");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAllMatches();
  };

  const respondToInvite = async (matchId: string, response: "accept" | "decline") => {
    try {
      console.log(`🤔 Risposta invito ${matchId}: ${response}`);
      
      Alert.alert(
        response === "accept" ? "Accetta invito" : "Rifiuta invito",
        response === "accept" 
          ? "Sei sicuro di voler accettare questo invito?" 
          : "Sei sicuro di voler rifiutare questo invito?",
        [
          { text: "Annulla", style: "cancel" },
          {
            text: response === "accept" ? "Accetta" : "Rifiuta",
            style: response === "accept" ? "default" : "destructive",
            onPress: async () => {
              const res = await fetch(`${API_URL}/matches/${matchId}/respond`, {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ action: response }),
              });

              if (!res.ok) throw new Error();

              Alert.alert(
                "Successo",
                response === "accept" 
                  ? "Invito accettato con successo!" 
                  : "Invito rifiutato con successo!",
                [{ text: "OK" }]
              );

              loadAllMatches();
            }
          }
        ]
      );
    } catch (error) {
      console.error("Errore risposta invito:", error);
      Alert.alert(
        "Errore",
        "Non è stato possibile rispondere all'invito",
        [{ text: "OK" }]
      );
    }
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
          weekday: "long",
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

  const getFilteredInvites = () => {
    console.log(`🔍 Filtro attivo: ${filter}`);
    console.log(`📋 Inviti totali (da altri): ${invites.length}`);
    
    if (filter === "all") {
      return invites;
    }
    
    if (filter === "pending") {
      // Solo pending NON scaduti
      return invites.filter((invite) => {
        const myPlayer = invite.players?.find((p: any) => p.user._id === user?.id);
        const isPending = myPlayer?.status === "pending";
        const isExpired = isInviteExpired(invite);
        return isPending && !isExpired;
      });
    }
    
    if (filter === "expired") {
      // Solo pending SCADUTI
      return invites.filter((invite) => {
        const myPlayer = invite.players?.find((p: any) => p.user._id === user?.id);
        const isPending = myPlayer?.status === "pending";
        const isExpired = isInviteExpired(invite);
        return isPending && isExpired;
      });
    }
    
    // Per "confirmed" e "declined" mostra tutti
    return invites.filter((invite) => {
      const myPlayer = invite.players?.find((p: any) => p.user._id === user?.id);
      return myPlayer?.status === filter;
    });
  };

  const filteredInvites = getFilteredInvites();

  const getFilterCount = (filterType: string) => {
    if (filterType === "all") return invites.length;
    
    if (filterType === "pending") {
      return invites.filter((invite) => {
        const myPlayer = invite.players?.find((p: any) => p.user._id === user?.id);
        const isPending = myPlayer?.status === "pending";
        const isExpired = isInviteExpired(invite);
        return isPending && !isExpired;
      }).length;
    }
    
    if (filterType === "expired") {
      return invites.filter((invite) => {
        const myPlayer = invite.players?.find((p: any) => p.user._id === user?.id);
        const isPending = myPlayer?.status === "pending";
        const isExpired = isInviteExpired(invite);
        return isPending && isExpired;
      }).length;
    }
    
    return invites.filter((invite) => {
      const myPlayer = invite.players?.find((p: any) => p.user._id === user?.id);
      return myPlayer?.status === filterType;
    }).length;
  };

  const renderInviteCard = ({ item }: { item: any }) => {
    const booking = item.booking;
    const myPlayer = item.players?.find((p: any) => p.user._id === user?.id);
    const myStatus = myPlayer?.status || "unknown";
    const isExpired = isInviteExpired(item);
    
    // Determina lo stato di visualizzazione
    let displayStatus = myStatus;
    let displayLabel = "In attesa";
    let displayColor = "#FF9800";
    let displayIcon = "time";
    let canRespond = false;
    
    if (myStatus === "pending" && isExpired) {
      displayStatus = "expired";
      displayLabel = "Scaduto";
      displayColor = "#757575";
      displayIcon = "time-outline";
      canRespond = false;
    } else if (myStatus === "pending") {
      canRespond = true;
    } else if (myStatus === "confirmed") {
      displayLabel = "Accettato";
      displayColor = "#4CAF50";
      displayIcon = "checkmark-circle";
    } else if (myStatus === "declined") {
      displayLabel = "Rifiutato";
      displayColor = "#F44336";
      displayIcon = "close-circle";
    }

    if (!booking) return null;

    return (
      <Pressable
        style={[
          styles.inviteCard,
          isExpired && styles.expiredCard,
          myStatus === "confirmed" && styles.confirmedCard,
          myStatus === "declined" && styles.declinedCard,
        ]}
        onPress={() => {
          booking &&
            navigation.navigate("DettaglioPrenotazione", {
              bookingId: booking._id,
            });
        }}
      >
        {/* Badge tempo scaduto */}
        {isExpired && displayStatus === "expired" && (
          <View style={styles.expiredBadge}>
            <Ionicons name="time-outline" size={12} color="white" />
            <Text style={styles.expiredBadgeText}>
              {getTimeSinceExpiration(item)}
            </Text>
          </View>
        )}

        {/* Header Card */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            {item.createdBy?.avatarUrl ? (
              <Image
                source={{ uri: `${API_URL}${item.createdBy.avatarUrl}` }}
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
                isExpired && styles.expiredText
              ]}>
                {item.createdBy?.name || "Utente"}
              </Text>
              <Text style={[
                styles.inviteText,
                isExpired && styles.expiredText
              ]}>
                ti ha invitato a giocare
              </Text>
            </View>
          </View>
          
          {/* Badge Status */}
          <View style={[
            styles.statusBadge,
            { backgroundColor: displayColor + "20" }
          ]}>
            <Ionicons 
              name={displayIcon as any} 
              size={12} 
              color={displayColor} 
              style={{ marginRight: 4 }}
            />
            <Text style={[
              styles.statusBadgeText,
              { color: displayColor }
            ]}>
              {displayLabel}
            </Text>
          </View>
        </View>

        {/* Match Info */}
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
        </View>

        {/* Players Preview */}
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
                    source={{ uri: `${API_URL}${player.user.avatarUrl}` }}
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

        {/* Actions - Mostra solo se può rispondere (pending non scaduto) */}
        {canRespond && (
          <View style={styles.cardActions}>
            <Pressable
              style={[styles.actionButton, styles.declineButton]}
              onPress={(e) => {
                e.stopPropagation();
                respondToInvite(item._id, "decline");
              }}
            >
              <Ionicons name="close" size={18} color="#F44336" />
              <Text style={styles.declineButtonText}>Rifiuta</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.acceptButton]}
              onPress={(e) => {
                e.stopPropagation();
                respondToInvite(item._id, "accept");
              }}
            >
              <Ionicons name="checkmark" size={18} color="white" />
              <Text style={styles.acceptButtonText}>Accetta</Text>
            </Pressable>
          </View>
        )}

        {/* Messaggio se scaduto */}
        {!canRespond && isExpired && (
          <View style={styles.expiredMessage}>
            <Ionicons name="alert-circle-outline" size={16} color="#999" />
            <Text style={styles.expiredMessageText}>
              Invito scaduto 2 ore prima della partita
            </Text>
          </View>
        )}

        {/* Messaggio se già risposto */}
        {!canRespond && !isExpired && myStatus !== "pending" && (
          <View style={styles.respondedMessage}>
            <Ionicons 
              name={myStatus === "confirmed" ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={myStatus === "confirmed" ? "#4CAF50" : "#F44336"} 
            />
            <Text style={[
              styles.respondedMessageText,
              { color: myStatus === "confirmed" ? "#4CAF50" : "#F44336" }
            ]}>
              {myStatus === "confirmed" ? "Hai accettato questo invito" : "Hai rifiutato questo invito"}
            </Text>
          </View>
        )}

        {/* Chevron */}
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color={isExpired ? "#ddd" : "#ccc"} />
        </View>
      </Pressable>
    );
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

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{invites.length}</Text>
          <Text style={styles.statLabel}>Totali</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.statPending]}>
            {getFilterCount("pending")}
          </Text>
          <Text style={styles.statLabel}>In attesa</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.statConfirmed]}>
            {getFilterCount("confirmed")}
          </Text>
          <Text style={styles.statLabel}>Accettati</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.statExpired]}>
            {getFilterCount("expired")}
          </Text>
          <Text style={styles.statLabel}>Scaduti</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Pressable
          style={[styles.filterChip, filter === "all" && styles.filterChipActive]}
          onPress={() => setFilter("all")}
        >
          <Text style={[styles.filterChipText, filter === "all" && styles.filterChipTextActive]}>
            Tutti
          </Text>
          {filter === "all" && <View style={styles.filterChipDot} />}
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === "pending" && styles.filterChipActive]}
          onPress={() => setFilter("pending")}
        >
          <Ionicons
            name="time"
            size={14}
            color={filter === "pending" ? "white" : "#FF9800"}
          />
          <Text
            style={[styles.filterChipText, filter === "pending" && styles.filterChipTextActive]}
          >
            In attesa
          </Text>
          {getFilterCount("pending") > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getFilterCount("pending")}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === "confirmed" && styles.filterChipActive]}
          onPress={() => setFilter("confirmed")}
        >
          <Ionicons
            name="checkmark-circle"
            size={14}
            color={filter === "confirmed" ? "white" : "#4CAF50"}
          />
          <Text
            style={[styles.filterChipText, filter === "confirmed" && styles.filterChipTextActive]}
          >
            Accettati
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === "declined" && styles.filterChipActive]}
          onPress={() => setFilter("declined")}
        >
          <Ionicons
            name="close-circle"
            size={14}
            color={filter === "declined" ? "white" : "#F44336"}
          />
          <Text
            style={[styles.filterChipText, filter === "declined" && styles.filterChipTextActive]}
          >
            Rifiutati
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, filter === "expired" && styles.filterChipActive]}
          onPress={() => setFilter("expired")}
        >
          <Ionicons
            name="time-outline"
            size={14}
            color={filter === "expired" ? "white" : "#757575"}
          />
          <Text
            style={[styles.filterChipText, filter === "expired" && styles.filterChipTextActive]}
          >
            Scaduti
          </Text>
          {getFilterCount("expired") > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getFilterCount("expired")}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Lista */}
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
    </SafeAreaView>
  );
}