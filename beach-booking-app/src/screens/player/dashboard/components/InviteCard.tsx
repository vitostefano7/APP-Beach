import React from 'react';
import { View, Text, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Avatar } from "../../../../components/Avatar";
import { formatDate } from "../utils/dateFormatter";
import { styles } from "../styles";

interface InviteCardProps {
  invite: any;
  userId?: string;
  onViewDetails: (invite: any) => void;
  onRespond: (matchId: string, response: "accept" | "decline") => void;
}

const InviteCard: React.FC<InviteCardProps> = ({ 
  invite, 
  userId, 
  onViewDetails, 
  onRespond 
}) => {
  const navigation = useNavigation<any>();
  console.log("🎯 InviteCard rendering");

  const match = invite.match || invite;
  const booking = invite.booking || match.booking;
  const matchId = match._id;
  const createdBy = invite.createdBy || match.createdBy;
  
  // Trova lo stato del player corrente
  const myPlayer = match.players?.find((p: any) => p.user?._id === userId);
  const myStatus = myPlayer?.status || "unknown";

  console.log(`Match ID: ${matchId}, My status: ${myStatus}`);

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

  const expired = isExpired();

  // 2. POI controlla lo stato: se NON è pending OPPURE è scaduto → non mostrare
  if (myStatus !== "pending" || expired) {
    console.log(`Skipping invite ${matchId}, status: ${myStatus}, expired: ${expired}`);
    return null; // Non renderizzare niente, l'invito scompare
  }

  const handleCardPress = () => {
    const bookingId = booking?._id;
    if (!bookingId) {
      console.log(`No booking ID found for invite: ${matchId}`);
      Alert.alert("Errore", "Dettagli prenotazione non disponibili");
      return;
    }
    
    console.log(`Card pressed - navigating to DettaglioPrenotazione with bookingId: ${bookingId}`);
    navigation.navigate("DettaglioPrenotazione", {
      bookingId,
    });
  };

  const handleAccept = (e: any) => {
    e.stopPropagation();
    console.log(`Accepting invite: ${matchId}`);
    
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
            console.log(`User confirmed accept for match: ${matchId}`);
            onRespond(matchId, "accept");
          },
          style: "default"
        }
      ]
    );
  };

  const handleDecline = (e: any) => {
    e.stopPropagation();
    console.log(`Declining invite: ${matchId}`);
    
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
            console.log(`User confirmed decline for match: ${matchId}`);
            onRespond(matchId, "decline");
          },
          style: "destructive"
        }
      ]
    );
  };

  // Funzione per mostrare quanto tempo rimane (opzionale)
  const getTimeRemaining = () => {
    if (!booking?.date || !booking?.startTime) return "";
    
    const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
    const cutoffTime = new Date(matchDateTime);
    cutoffTime.setHours(cutoffTime.getHours() - CUTOFF_HOURS_BEFORE);
    
    const now = new Date();
    const minutesRemaining = Math.floor((cutoffTime - now) / (1000 * 60));
    
    if (minutesRemaining <= 0) return "";
    
    if (minutesRemaining < 60) {
      return `Scade tra ${minutesRemaining} minuti`;
    } else if (minutesRemaining < 120) {
      return `Scade tra 1 ora`;
    } else {
      const hoursRemaining = Math.floor(minutesRemaining / 60);
      return `Scade tra ${hoursRemaining} ore`;
    }
  };

  const timeRemaining = getTimeRemaining();

  return (
    <Pressable 
      style={styles.inviteCard}
      onPress={handleCardPress}
    >
      {/* Badge per il tempo rimanente (opzionale) */}
      {timeRemaining && (
        <View style={styles.timeRemainingBadge}>
          <Ionicons name="time-outline" size={12} color="#FF9800" />
          <Text style={styles.timeRemainingText}>{timeRemaining}</Text>
        </View>
      )}

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
            <Text style={styles.inviteTitle}>
              {createdBy?.name} ti ha invitato
            </Text>
            {booking?.campo?.struttura?.name && (
              <View style={styles.inviteDetails}>
                <Ionicons name="location-outline" size={12} color="#666" />
                <Text style={styles.inviteDetailText}>
                  {booking.campo.struttura.name}
                </Text>
              </View>
            )}
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
        </View>
      )}

      <View style={styles.inviteActions}>
        <Pressable
          style={[styles.inviteActionButton, styles.inviteDecline]}
          onPress={handleDecline}
        >
          <Ionicons name="close" size={16} color="#F44336" />
          <Text style={styles.inviteDeclineText}>Rifiuta</Text>
        </Pressable>
        <Pressable
          style={[styles.inviteActionButton, styles.inviteAccept]}
          onPress={handleAccept}
        >
          <Ionicons name="checkmark" size={16} color="white" />
          <Text style={styles.inviteAcceptText}>Accetta</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

export default InviteCard;