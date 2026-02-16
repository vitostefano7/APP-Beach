import React from 'react';
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "../Avatar/Avatar";
import { useNavigation } from '@react-navigation/native';

interface SuggestedFriendCardProps {
  friend: any;
  onPress: (friend: any) => void;
  onInvite: (friendId: string) => void;
}

export const SuggestedFriendCard: React.FC<SuggestedFriendCardProps> = ({
  friend,
  onPress,
  onInvite
}) => {
  const navigation = useNavigation<any>();

  // Estrai i dati in base alla struttura
  const friendData = friend.user || friend;
  
  if (!friendData) {
    return (
      <View style={[styles.suggestedFriendCard, { borderColor: "red", borderWidth: 2 }]}>
        <Text style={{ color: "red", fontWeight: "bold" }}>
          ERRORE: Dati amico non disponibili
        </Text>
      </View>
    );
  }

  const friendId = friendData._id;
  const friendName = friendData.name || "Utente";
  const friendSurname = friendData.surname || "";
  const avatarUrl = friendData.avatarUrl;
  
  // Estrai metriche
  const matchCount = friend.reason?.details?.matchCount || 0;
  const commonFriends = friend.reason?.details?.mutualFriendsCount || friend.commonFriends || 0;
  const sameVenues = friend.sameVenues || 0;
  const gamesCount = friend.reason?.details?.gamesCount || 0;
  const strutturaName = friend.reason?.details?.strutturaName;
  const vipLevel = friend.reason?.details?.vipLevel;
  
  const username = friendData.username;
  
  // Verifica lo stato dell'amicizia
  const friendshipStatus = friend.friendshipStatus;
  const isAlreadyFriend = friendshipStatus === 'accepted';
  const isPendingRequest = friendshipStatus === 'pending';

  const openUserProfile = (userId?: string) => {
    if (!userId) return;
    navigation.navigate("ProfiloUtente", { userId });
  };

  return (
    <Pressable
      style={styles.suggestedFriendCard}
      onPress={() => onPress(friend)}
    >
      <Pressable onPress={() => openUserProfile(friendId)}>
        <Avatar
          name={friendName}
          surname={friendData.surname}
          avatarUrl={avatarUrl}
          size={48}
        />
      </Pressable>
      
      <View style={styles.friendCardInfo}>
        <View style={styles.friendCardHeader}>
          <Text style={styles.friendCardName} numberOfLines={1}>
            {friendName}
            {friendSurname ? ` ${friendSurname}` : ""}
          </Text>
        </View>
        
        {username && (
          <Text style={styles.friendCardUsername} numberOfLines={1}>
            @{username}
          </Text>
        )}
        
        <View style={styles.friendCardStats}>
          {matchCount > 0 && (
            <View style={styles.friendStatItem}>
              <Ionicons name="trophy-outline" size={12} color="#2196F3" />
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

const styles = StyleSheet.create({
  suggestedFriendCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  friendCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  friendCardName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  friendCardUsername: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  friendCardStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  friendStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  friendStatText: {
    fontSize: 11,
    color: '#666',
  },
  friendCardButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  friendCardButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
});
