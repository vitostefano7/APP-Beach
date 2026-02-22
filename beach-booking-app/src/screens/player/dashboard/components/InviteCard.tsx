import React, { useMemo, useCallback } from 'react';
import { View, Text, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Avatar } from "../../../../components/Avatar";
import SportIcon from "../../../../components/SportIcon";
import { formatDate } from "../utils/dateFormatter";
import { styles } from "../styles";

interface InviteCardProps {
  invite: any;
  userId?: string;
  onRespond: (matchId: string, response: "accept" | "decline") => void;
}

const InviteCard: React.FC<InviteCardProps> = ({ 
  invite, 
  userId, 
  onRespond 
}) => {
  const navigation = useNavigation<any>();

  const match = invite.match || invite;
  const booking = invite.booking || match.booking;
  const matchId = match._id;
  const createdBy = invite.createdBy || match.createdBy;
  
  // Trova lo stato del player corrente
  const myPlayer = match.players?.find((p: any) => p.user?._id === userId);
  const myStatus = myPlayer?.status || "unknown";

  // Calcola il prezzo per persona
  const pricePerPerson = useMemo(
    () => (booking?.price && match?.players ? (booking.price / match.players.length).toFixed(2) : null),
    [booking?.price, match?.players]
  );

  // Constante per le ore di cut-off
  const CUTOFF_HOURS_BEFORE = 2; // Inviti si chiudono 2 ore prima

  // 1. PRIMA controlla se l'invito è scaduto (2 ore prima della partita)
  const isExpired = () => {
    if (!booking?.date || !booking?.startTime) return false;
    
    // Combina data e ora della partita
    const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
    
    // Sottrai 2 ore per ottenere il momento di scadenza
    const cutoffTime = new Date(matchDateTime);
    cutoffTime.setHours(cutoffTime.getHours() - CUTOFF_HOURS_BEFORE);
    
    const now = new Date();
    return now > cutoffTime;
  };

  const expired = useMemo(() => isExpired(), [booking?.date, booking?.startTime]);

  // 2. POI controlla lo stato: se NON è pending OPPURE è scaduto → non mostrare
  if (myStatus !== "pending" || expired) {
    return null; // Non renderizzare niente, l'invito scompare
  }

  const handleCardPress = useCallback(() => {
    const bookingId = booking?._id;
    if (!bookingId) {
      Alert.alert("Errore", "Dettagli prenotazione non disponibili");
      return;
    }

    navigation.navigate("DettaglioPrenotazione", {
      bookingId,
    });
  }, [booking?._id, navigation]);

  const handleAccept = useCallback((e: any) => {
    e.stopPropagation();

    Alert.alert(
      "Conferma partecipazione",
      "Vuoi accettare l'invito a questa partita?",
      [
        {
          text: "Annulla",
          style: "cancel"
        },
        {
          text: "Accetta",
          onPress: () => {
            onRespond(matchId, "accept");
          },
          style: "default"
        }
      ]
    );
  }, [matchId, onRespond]);

  const handleDecline = useCallback((e: any) => {
    e.stopPropagation();

    Alert.alert(
      "Rifiuta invito",
      "Sei sicuro di voler rifiutare questo invito?",
      [
        {
          text: "Annulla",
          style: "cancel"
        },
        {
          text: "Rifiuta",
          onPress: () => {
            onRespond(matchId, "decline");
          },
          style: "destructive"
        }
      ]
    );
  }, [matchId, onRespond]);

  // Funzione per mostrare quanto tempo rimane (versione abbreviata)
  const getTimeRemaining = () => {
    if (!booking?.date || !booking?.startTime) return "";
    
    const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
    const cutoffTime = new Date(matchDateTime);
    cutoffTime.setHours(cutoffTime.getHours() - CUTOFF_HOURS_BEFORE);
    
    const now = new Date();
    const diff = cutoffTime.getTime() - now.getTime();
    const minutesRemaining = Math.floor(diff / (1000 * 60));
    
    if (minutesRemaining <= 0) return "";
    
    // Formato abbreviato
    if (minutesRemaining < 60) {
      return `${minutesRemaining}min`;
    } else if (minutesRemaining < 120) {
      return `1h`;
    } else {
      const hoursRemaining = Math.floor(minutesRemaining / 60);
      if (hoursRemaining > 24) {
        const daysRemaining = Math.floor(hoursRemaining / 24);
        return `${daysRemaining}g`;
      } else {
        return `${hoursRemaining}h`;
      }
    }
  };

  const timeRemaining = useMemo(() => getTimeRemaining(), [booking?.date, booking?.startTime]);
  
  // Estrai lo sport
  const sportName = useMemo(() => booking?.campo?.sport?.name || "Sport", [booking?.campo?.sport?.name]);

  return (
    <Pressable 
      style={styles.inviteCard}
      onPress={handleCardPress}
    >
      <View style={styles.inviteHeader}>
        <View style={styles.inviteLeft}>
          <Avatar
            name={createdBy?.name}
            surname={createdBy?.surname}
            avatarUrl={createdBy?.avatarUrl}
            size="small"
            fallbackIcon="person"
          />
          <View style={styles.inviteInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text style={styles.inviteTitle}>
                {createdBy?.name} {createdBy?.surname} ti ha invitato
              </Text>
              {timeRemaining && (
                <View style={styles.timeRemainingBadge}>
                  <Ionicons name="time-outline" size={11} color="#FF9800" />
                  <Text style={styles.timeRemainingText}>{timeRemaining}</Text>
                </View>
              )}
            </View>
            <View style={styles.inviteDetails}>
              {booking?.campo?.struttura?.name && (
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1}}>
                  <Ionicons name="location-outline" size={12} color="#2196F3" />
                  <Text style={styles.inviteDetailText} numberOfLines={1}>
                    {booking.campo.struttura.name}
                  </Text>
                </View>
              )}
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 8}}>
                <SportIcon sport={sportName} size={12} color="#2196F3" />
                <Text style={styles.inviteDetailText}>
                  {sportName}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {booking && (
        <View style={styles.inviteDateTime}>
          <View style={styles.inviteDateBadge}>
            <Ionicons name="calendar-outline" size={14} color="#2196F3" />
            <Text style={styles.inviteDateText}>
              {formatDate(booking.date)}
            </Text>
          </View>
          <View style={styles.inviteTimeBadge}>
            <Ionicons name="time-outline" size={14} color="#2196F3" />
            <Text style={styles.inviteTimeText}>
              {booking.startTime} - {booking.endTime}
            </Text>
          </View>
          {pricePerPerson && (
            <View style={styles.invitePriceBadge}>
              <Ionicons name="wallet-outline" size={14} color="#2E7D32" />
              <Text style={styles.invitePriceText}>
                €{pricePerPerson}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.inviteActions}>
        <Pressable
          style={[styles.inviteActionButton, styles.inviteDecline]}
          onPress={handleDecline}
        >
          <Ionicons name="close" size={14} color="#F44336" />
          <Text style={styles.inviteDeclineText}>Rifiuta</Text>
        </Pressable>
        <Pressable
          style={[styles.inviteActionButton, styles.inviteAccept]}
          onPress={handleAccept}
        >
          <Ionicons name="checkmark" size={14} color="white" />
          <Text style={styles.inviteAcceptText}>Accetta</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

export default React.memo(InviteCard, (prevProps, nextProps) => {
  return (
    prevProps.invite === nextProps.invite &&
    prevProps.userId === nextProps.userId &&
    prevProps.onRespond === nextProps.onRespond
  );
});