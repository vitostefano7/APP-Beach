// SuggestedFriendCard.tsx
import React from 'react';
import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../../../config/api";
import { styles } from "../styles";

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
  return (
    <Pressable 
      style={styles.suggestedFriendCard}
      onPress={() => onPress(friend)}
    >
      {friend.avatarUrl ? (
        <Image
          source={{ uri: `${API_URL}${friend.avatarUrl}` }}
          style={styles.suggestedFriendAvatar}
        />
      ) : (
        <View style={styles.suggestedFriendAvatarPlaceholder}>
          <Ionicons name="person" size={28} color="#999" />
        </View>
      )}
      
      <View style={styles.suggestedFriendInfo}>
        <Text style={styles.suggestedFriendName} numberOfLines={1}>
          {friend.name}
        </Text>
        <Text style={styles.suggestedFriendStats} numberOfLines={1}>
          {friend.totalMatches || 0} partite • {friend.winRate || 0}% win rate
        </Text>
        
        {friend.commonFriends > 0 && (
          <View style={styles.commonFriendsBadge}>
            <Ionicons name="people" size={12} color="#666" />
            <Text style={styles.commonFriendsText}>
              {friend.commonFriends} amici in comune
            </Text>
          </View>
        )}
      </View>
      
      <Pressable
        style={styles.inviteFriendButton}
        onPress={(e) => {
          e.stopPropagation();
          onInvite(friend._id);
        }}
      >
        <Ionicons name="person-add-outline" size={16} color="#2196F3" />
        <Text style={styles.inviteFriendText}>Invita</Text>
      </Pressable>
    </Pressable>
  );
};