import React from 'react';
import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../../../config/api";
import { formatDate } from "../utils/dateFormatter";
import { styles } from "../styles";

interface InviteCardProps {
  invite: any;
  userId?: string; // Aggiungi questa prop
  onPress: (bookingId?: string) => void;
  onRespond: (matchId: string, response: "accept" | "decline") => void;
}

const InviteCard: React.FC<InviteCardProps> = ({ invite, userId, onPress, onRespond }) => {
  // Gestione di diverse strutture dati
  const match = invite.match || invite;
  const booking = invite.booking || match.booking;
  const matchId = match._id;
  const createdBy = invite.createdBy || match.createdBy;
  
  // Trova lo stato del player corrente - usa la prop userId
  const myPlayer = match.players?.find((p: any) => p.user?._id === userId);
  const myStatus = myPlayer?.status || "unknown";

  console.log(`InviteCard - Match: ${matchId}, My status: ${myStatus}, User ID: ${userId}`);

  const handlePress = () => {
    if (booking?._id) {
      onPress(booking._id);
    } else {
      console.log("Invito senza booking:", match);
    }
  };

  const handleRespond = (response: "accept" | "decline", e: any) => {
    e.stopPropagation();
    console.log(`Rispondo all'invito ${matchId} con: ${response}`);
    
    if (matchId) {
      onRespond(matchId, response);
    } else {
      console.error("Match ID non trovato");
      alert("Errore: ID invito non valido");
    }
  };

  // Se lo status non è "pending", non mostrare la card
  if (myStatus !== "pending") {
    console.log(`Invito ${matchId} non mostrato: status = ${myStatus}, userId = ${userId}`);
    return null;
  }

  return (
    <Pressable style={styles.inviteCard} onPress={handlePress}>
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
            {booking ? (
              <View style={styles.inviteDetails}>
                <Ionicons name="location" size={12} color="#666" />
                <Text style={styles.inviteDetailText}>
                  {booking.campo?.struttura?.name || "Campo non specificato"}
                </Text>
              </View>
            ) : (
              <Text style={[styles.inviteDetailText, { fontStyle: 'italic' }]}>
                Partita senza prenotazione
              </Text>
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

      <View style={styles.inviteActions}>
        <Pressable
          style={[styles.inviteActionButton, styles.inviteDecline]}
          onPress={(e) => handleRespond("decline", e)}
        >
          <Text style={styles.inviteDeclineText}>Rifiuta</Text>
        </Pressable>
        <Pressable
          style={[styles.inviteActionButton, styles.inviteAccept]}
          onPress={(e) => handleRespond("accept", e)}
        >
          <Ionicons name="checkmark" size={16} color="white" />
          <Text style={styles.inviteAcceptText}>Accetta</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

InviteCard.Title = ({ count }: { count: number }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <Text style={styles.sectionTitle}>Inviti in attesa</Text>
    {count > 0 && (
      <View style={styles.inviteCountBadge}>
        <Text style={styles.inviteCountText}>{count}</Text>
      </View>
    )}
  </View>
);

export default InviteCard;