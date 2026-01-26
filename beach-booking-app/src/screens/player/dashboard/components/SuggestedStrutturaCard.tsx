// SuggestedStrutturaCard.tsx
import React from 'react';
import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles";
import { resolveImageUrl } from "../../../../utils/imageUtils";

interface SuggestedStrutturaCardProps {
  struttura: {
    _id: string;
    name: string;
    description?: string;
    images: string[];
    location: {
      address: string;
      city: string;
    };
    isFollowing?: boolean;
    reason?: {
      type: string;
      details?: any;
    };
    score?: number;
  };
  onPress: (struttura: any) => void;
  onFollow: (strutturaId: string) => void;
}

export const SuggestedStrutturaCard: React.FC<SuggestedStrutturaCardProps> = ({
  struttura,
  onPress,
  onFollow
}) => {
  const strutturaId = struttura._id;
  const strutturaName = struttura.name;
  const location = struttura.location;
  const isFollowing = struttura.isFollowing || false;
  const imageUrl = struttura.images?.[0] ? resolveImageUrl(struttura.images[0]) : null;

  // Badge per motivo suggerimento (similar to friend card)
  const getPriorityBadge = () => {
    const reason = struttura.reason;
    if (!reason) return null;
    
    let color, icon, text;
    
    if (typeof reason === 'object' && reason.type) {
      const reasonType = reason.type;
      
      if (reasonType === 'played') {
        color = '#2196F3';
        icon = 'trophy';
        text = 'Giocato';
      } else if (reasonType === 'followed_by_friends') {
        color = '#FF9800';
        icon = 'people';
        text = 'Amici seguono';
      } else if (reasonType === 'popular') {
        color = '#4CAF50';
        icon = 'star';
        text = 'Popolare';
      }
    }
    
    return color ? { color, icon, text } : null;
  };
  
  const badge = getPriorityBadge();

  return (
    <Pressable
      style={styles.suggestedFriendCard}
      onPress={() => onPress(struttura)}
    >
      {/* IMAGE */}
      <View style={styles.friendCardAvatar}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.friendCardAvatar}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.friendCardAvatarPlaceholder}>
            <Ionicons name="business" size={24} color="#666" />
          </View>
        )}
      </View>
      
      {/* INFO */}
      <View style={styles.friendCardInfo}>
        <View style={styles.friendCardHeader}>
          <Text style={styles.friendCardName} numberOfLines={1}>
            {strutturaName}
          </Text>
          {badge && (
            <View style={[styles.friendBadge, { backgroundColor: badge.color + '15' }]}>
              <Ionicons name={badge.icon as any} size={12} color={badge.color} />
            </View>
          )}
        </View>
        
        <Text style={styles.friendCardUsername} numberOfLines={1}>
          {location.city}, {location.address}
        </Text>
        
        {/* Additional info if needed */}
        {struttura.description && (
          <Text style={styles.friendStatText} numberOfLines={2}>
            {struttura.description}
          </Text>
        )}
      </View>
      
      {/* FOLLOW BUTTON */}
      <Pressable
        style={[
          styles.friendCardButton,
          isFollowing && styles.friendCardButtonDisabled
        ]}
        onPress={(e) => {
          e.stopPropagation();
          onFollow(strutturaId);
        }}
      >
        <Ionicons 
          name={isFollowing ? "heart" : "heart-outline"} 
          size={18} 
          color={isFollowing ? "#FF5722" : "white"} 
        />
      </Pressable>
    </Pressable>
  );
};