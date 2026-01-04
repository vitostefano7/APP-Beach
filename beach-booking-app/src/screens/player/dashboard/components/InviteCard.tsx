import React from 'react';
import { View, Text, Image, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../../../config/api";
import { formatDate } from "../utils/dateFormatter";
import { styles } from "../styles";

interface InviteCardProps {
  invite: any;
  userId?: string;
  onViewDetails: (invite: any) => void; // Nuova prop per vedere dettagli
  onRespond: (matchId: string, response: "accept" | "decline") => void;
}

const InviteCard: React.FC<InviteCardProps> = ({ 
  invite, 
  userId, 
  onViewDetails, 
  onRespond 
}) => {
  console.log("🎯 InviteCard rendering");

  const match = invite.match || invite;
  const booking = invite.booking || match.booking;
  const matchId = match._id;
  const createdBy = invite.createdBy || match.createdBy;
  
  // Trova lo stato del player corrente
  const myPlayer = match.players?.find((p: any) => p.user?._id === userId);
  const myStatus = myPlayer?.status || "unknown";

  console.log(`Match ID: ${matchId}, My status: ${myStatus}`);

  // Solo se è pending
  if (myStatus !== "pending") {
    console.log(`Skipping invite ${matchId}, status: ${myStatus}`);
    return null;
  }

  const handleCardPress = () => {
    console.log(`Card pressed - showing details for invite: ${matchId}`);
    onViewDetails(invite);
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

  // Calcola se la partita è ancora valida (data nel futuro)
  const isExpired = () => {
    if (!booking?.date) return false;
    const matchDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return matchDate < today;
  };

  const expired = isExpired();

  return (
    <Pressable 
      style={[
        styles.inviteCard, 
        expired && { opacity: 0.6, borderLeftColor: "#CCCCCC" }
      ]} 
      onPress={handleCardPress}
      disabled={expired}
    >
      {expired && (
        <View style={styles.expiredBadge}>
          <Text style={styles.expiredBadgeText}>Scaduto</Text>
        </View>
      )}

      <View style={styles.inviteHeader}>
        <View style={styles.inviteLeft}>
          {createdBy?.avatarUrl ? (
            <Image
              source={{ uri: `${API_URL}${createdBy.avatarUrl}` }}
              style={styles.inviteAvatar}
            />
          ) : (
            <View style={styles.inviteAvatarPlaceholder}>
              <Ionicons name="person" size={20} color="#999" />
            </View>
          )}
          <View style={styles.inviteInfo}>
            <Text style={styles.inviteTitle}>
              {createdBy?.name} ti ha invitato
            </Text>
            {booking?.campo?.struttura?.name && (
              <View style={styles.inviteDetails}>
                <Ionicons name="location" size={12} color="#666" />
                <Text style={styles.inviteDetailText}>
                  {booking.campo.struttura.name}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
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
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.inviteTimeText}>
              {booking.startTime} - {booking.endTime}
            </Text>
          </View>
        </View>
      )}

      {!expired ? (
        <View style={styles.inviteActions}>
          <Pressable
            style={[styles.inviteActionButton, styles.inviteDecline]}
            onPress={handleDecline}
          >
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
      ) : (
        <View style={styles.inviteActions}>
          <Text style={styles.expiredText}>
            Questo invito è scaduto
          </Text>
        </View>
      )}
    </Pressable>
  );
};

export default InviteCard;