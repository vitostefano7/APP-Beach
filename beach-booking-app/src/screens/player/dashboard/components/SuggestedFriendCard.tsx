// SuggestedFriendCard.tsx
import React from 'react';
import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../../../config/api";
import { styles } from "../styles";

interface SuggestedFriendCardProps {
  friend: any; // Accetta qualsiasi struttura
  onPress: (friend: any) => void;
  onInvite: (friendId: string) => void;
}

// Funzione per ottenere iniziali
const getInitials = (name?: string): string => {
  if (!name || typeof name !== 'string') return "?";
  
  const trimmedName = name.trim();
  if (trimmedName.length === 0) return "?";
  
  const parts = trimmedName.split(" ").filter(part => part.length > 0);
  
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const SuggestedFriendCard: React.FC<SuggestedFriendCardProps> = ({ 
  friend, 
  onPress, 
  onInvite 
}) => {
  // DEBUG COMPLETO
  console.log("🚨 SUGGESTED FRIEND CARD DEBUG:");
  console.log("Friend object:", JSON.stringify(friend, null, 2));
  
  // Estrai i dati in base alla struttura
  const friendData = friend.user || friend; // Supporta entrambe le strutture
  
  // Se friendData è undefined o null, mostra un fallback
  if (!friendData) {
    console.log("❌ friendData è undefined/null!");
    return (
      <View style={{
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: "red",
      }}>
        <Text style={{ color: "red", fontWeight: "bold" }}>
          ERRORE: Dati amico non disponibili
        </Text>
        <Text>{JSON.stringify(friend, null, 2)}</Text>
      </View>
    );
  }

  const friendId = friendData._id;
  const friendName = friendData.name || "Utente";
  const avatarUrl = friendData.avatarUrl;
  
  // Estrai metriche dalla struttura corretta del backend
  const matchCount = friend.reason?.details?.matchCount || 0;
  const commonFriends = friend.commonFriends || 0;
  const sameVenues = friend.sameVenues || 0;
  const score = friend.score || 0;
  
  console.log(`📊 Stats for ${friendName}:`, { matchCount, commonFriends, sameVenues, score, reason: friend.reason });
  
  const username = friendData.username;
  const preferredSports = friendData.preferredSports || [];
  
  // Verifica se è già stato invitato
  const isAlreadyInvited = friend.friendshipStatus === 'pending';
  
  // Badge per motivo suggerimento
  const getPriorityBadge = () => {
    const reason = friend.reason;
    if (!reason || typeof reason !== 'string') return null;
    
    let color, icon, text;
    if (reason.includes('matches')) {
      color = '#2196F3';
      icon = 'trophy';
      text = 'Compagno';
    } else if (reason.includes('friends')) {
      color = '#FF9800';
      icon = 'people';
      text = 'Amici comuni';
    } else if (reason.includes('venue')) {
      color = '#9C27B0';
      icon = 'location';
      text = 'Stesso centro';
    }
    
    return color ? { color, icon, text } : null;
  };
  
  const badge = getPriorityBadge();

  return (
    <Pressable 
      style={styles.suggestedFriendCard}
      onPress={() => onPress(friend)}
    >
      {/* AVATAR */}
      {avatarUrl ? (
        <Image
          source={{ uri: `${API_URL}${avatarUrl}` }}
          style={styles.friendCardAvatar}
        />
      ) : (
        <View style={styles.friendCardAvatarPlaceholder}>
          <Text style={styles.friendCardAvatarInitials}>
            {getInitials(friendName)}
          </Text>
        </View>
      )}
      
      {/* INFO */}
      <View style={styles.friendCardInfo}>
        <View style={styles.friendCardHeader}>
          <Text style={styles.friendCardName} numberOfLines={1}>
            {friendName}
          </Text>
          {badge && (
            <View style={[styles.friendBadge, { backgroundColor: badge.color + '15' }]}>
              <Ionicons name={badge.icon as any} size={12} color={badge.color} />
            </View>
          )}
        </View>
        
        {username && (
          <Text style={styles.friendCardUsername} numberOfLines={1}>
            @{username}
          </Text>
        )}
        
        {/* Stats dettagliate */}
        <View style={styles.friendCardStats}>
          {matchCount > 0 && (
            <View style={styles.friendStatItem}>
              <Ionicons name="trophy-outline" size={12} color="#2196F3" />
              <Text style={styles.friendStatText}>{matchCount} {matchCount === 1 ? 'partita' : 'partite'}</Text>
            </View>
          )}
          {commonFriends > 0 && (
            <View style={styles.friendStatItem}>
              <Ionicons name="people-outline" size={12} color="#FF9800" />
              <Text style={styles.friendStatText}>{commonFriends} {commonFriends === 1 ? 'amico' : 'amici'}</Text>
            </View>
          )}
          {sameVenues > 0 && matchCount === 0 && commonFriends === 0 && (
            <View style={styles.friendStatItem}>
              <Ionicons name="location-outline" size={12} color="#9C27B0" />
              <Text style={styles.friendStatText}>{sameVenues} {sameVenues === 1 ? 'centro' : 'centri'}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* AZIONE */}
      <Pressable
        style={[
          styles.friendCardButton,
          isAlreadyInvited && styles.friendCardButtonDisabled
        ]}
        onPress={(e) => {
          e.stopPropagation();
          if (!isAlreadyInvited) {
            onInvite(friendId);
          }
        }}
        disabled={isAlreadyInvited}
      >
        <Ionicons 
          name={isAlreadyInvited ? "checkmark" : "person-add"} 
          size={18} 
          color={isAlreadyInvited ? "#999" : "white"} 
        />
      </Pressable>
    </Pressable>
  );
};