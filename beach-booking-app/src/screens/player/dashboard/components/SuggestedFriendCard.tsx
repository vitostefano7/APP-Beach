// SuggestedFriendCard.tsx
import React from 'react';
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../../../../components/Avatar";
import { styles } from "../styles";
import { useNavigation } from '@react-navigation/native';

interface SuggestedFriendCardProps {
  friend: any; // Accetta qualsiasi struttura
  onPress: (friend: any) => void;
  onInvite: (friendId: string) => void;
}

export const SuggestedFriendCard: React.FC<SuggestedFriendCardProps> = ({
  friend,
  onPress,
  onInvite
}) => {
  const navigation = useNavigation<any>();

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
  const friendSurname = friendData.surname || "";
  const avatarUrl = friendData.avatarUrl;
  
  // Estrai metriche dalla struttura corretta del backend
  const matchCount = friend.reason?.details?.matchCount || 0;
  const commonFriends = friend.reason?.details?.mutualFriendsCount || friend.commonFriends || 0;
  const sameVenues = friend.sameVenues || 0;
  const gamesCount = friend.reason?.details?.gamesCount || 0;
  const strutturaName = friend.reason?.details?.strutturaName;
  const vipLevel = friend.reason?.details?.vipLevel;
  const score = friend.score || 0;
  
  console.log(`📊 Stats for ${friendName}:`, { matchCount, commonFriends, sameVenues, score, reason: friend.reason });
  
  const username = friendData.username;
  const preferredSports = friendData.preferredSports || [];
  
  // Verifica lo stato dell'amicizia
  const friendshipStatus = friend.friendshipStatus;
  const isAlreadyFriend = friendshipStatus === 'accepted';
  const isPendingRequest = friendshipStatus === 'pending';
  
  // Badge per motivo suggerimento
  const getPriorityBadge = () => {
    const reason = friend.reason;
    if (!reason) return null;
    
    let color, icon, text;
    
    // Gestisci la struttura oggetto del backend
    if (typeof reason === 'object' && reason.type) {
      const reasonType = reason.type;
      const details = reason.details || {};
      
      if (reasonType === 'match_together') {
        // Se ha molte partite (>=3) è un utente VIP
        if (details.matchCount >= 3) {
          color = '#FFD700'; // Oro
          icon = 'star';
          text = 'Giocatore VIP';
        } else {
          color = '#2196F3';
          icon = 'trophy';
          text = 'Compagno';
        }
      } else if (reasonType === 'mutual_friends') {
        color = '#FF9800';
        icon = 'people';
        text = 'Amici comuni';
      } else if (reasonType === 'same_venue') {
        color = '#9C27B0';
        icon = 'location';
        text = 'Stesso centro';
      } else if (reasonType === 'most_games') {
        color = '#4CAF50';
        icon = 'game-controller';
        text = 'Giocatore frequente';
      } else if (reasonType === 'follows_structure') {
        color = '#FF5722';
        icon = 'heart';
        text = 'Segue struttura';
      } else if (reasonType === 'vip_user') {
        color = '#FFD700';
        icon = 'star';
        text = 'Utente VIP';
      }
    } 
    // Gestisci la struttura stringa legacy
    else if (typeof reason === 'string') {
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
    }
    
    return color ? { color, icon, text } : null;
  };
  
  const badge = getPriorityBadge();

  const openUserProfile = (userId?: string) => {
    if (!userId) return;
    navigation.navigate("ProfiloUtente", { userId });
  };

  return (
    <Pressable
      style={styles.suggestedFriendCard}
      onPress={() => onPress(friend)}
    >
      {/* AVATAR */}
      <Pressable onPress={() => openUserProfile(friendId)}>
        <Avatar
          name={friendName}
          surname={friendData.surname}
          avatarUrl={avatarUrl}
          size={48}
        />
      </Pressable>
      
      {/* INFO */}
      <View style={styles.friendCardInfo}>
        <View style={styles.friendCardHeader}>
          <Text style={styles.friendCardName} numberOfLines={1}>
            {friendName}
            {friendSurname ? ` ${friendSurname}` : ""}
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
              <Ionicons name="trophy-outline" size={12} color={matchCount >= 3 ? "#FFD700" : "#2196F3"} />
              <Text style={styles.friendStatText}>
                {matchCount} {matchCount === 1 ? 'partita' : 'partite'}
                {matchCount >= 3 && ' 🌟'}
              </Text>
            </View>
          )}
          {gamesCount > 0 && (
            <View style={styles.friendStatItem}>
              <Ionicons name="game-controller-outline" size={12} color="#4CAF50" />
              <Text style={styles.friendStatText}>
                {gamesCount} {gamesCount === 1 ? 'partita' : 'partite'} nella tua struttura
              </Text>
            </View>
          )}
          {strutturaName && (
            <View style={styles.friendStatItem}>
              <Ionicons name="heart-outline" size={12} color="#FF5722" />
              <Text style={styles.friendStatText} numberOfLines={1}>
                Segue {strutturaName}
              </Text>
            </View>
          )}
          {vipLevel && (
            <View style={styles.friendStatItem}>
              <Ionicons name="star-outline" size={12} color="#FFD700" />
              <Text style={styles.friendStatText}>
                VIP {vipLevel}
              </Text>
            </View>
          )}
          {commonFriends > 0 && (
            <View style={styles.friendStatItem}>
              <Ionicons name="people-outline" size={12} color="#FF9800" />
              <Text style={styles.friendStatText}>{commonFriends} {commonFriends === 1 ? 'amico' : 'amici'}</Text>
            </View>
          )}
          {sameVenues > 0 && matchCount === 0 && commonFriends === 0 && gamesCount === 0 && !strutturaName && !vipLevel && (
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
          (isAlreadyFriend || isPendingRequest) && styles.friendCardButtonDisabled
        ]}
        onPress={(e) => {
          e.stopPropagation();
          if (!isAlreadyFriend && !isPendingRequest) {
            onInvite(friendId);
          }
        }}
        disabled={isAlreadyFriend || isPendingRequest}
      >
        <Ionicons 
          name={isAlreadyFriend ? "checkmark" : isPendingRequest ? "time" : "person-add"} 
          size={18} 
          color={(isAlreadyFriend || isPendingRequest) ? "#999" : "white"} 
        />
      </Pressable>
    </Pressable>
  );
};