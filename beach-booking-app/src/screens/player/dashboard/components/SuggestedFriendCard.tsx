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
  // DEBUG ESTESO
  /*
  console.log("🚨🚨🚨 SUGGESTED FRIEND CARD FULL DEBUG:");
  console.log("1. Friend object:", friend);
  console.log("2. Friend.user:", friend?.user);
  console.log("3. Friend name:", friend?.user?.name);
  console.log("4. Friend ID:", friend?.user?._id);
  console.log("5. Avatar URL:", friend?.user?.avatarUrl);
  console.log("6. Reason:", friend?.reason);
  console.log("7. Score:", friend?.score);
  
  // Controlla se styles esiste
  console.log("8. Styles available?", !!styles);
  console.log("9. Styles.suggestedFriendCard?", styles?.suggestedFriendCard);
*/
  // Estrai i dati in base alla struttura
  const friendData = friend.user || friend; // Supporta entrambe le strutture
  
  // Se friendData è undefined o null, mostra un fallback
  if (!friendData) {
    console.log("❌❌❌ friendData è undefined/null!");
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
  
  // Estrai altre proprietà se presenti
  const commonFriends = friendData.commonFriends || 0;
  const totalMatches = friendData.totalMatches || 0;
  const winRate = friendData.winRate || 0;
  const username = friendData.username;
  const preferredSports = friendData.preferredSports || [];
  
  // Verifica se è già stato invitato
  const isAlreadyInvited = friend.friendshipStatus === 'pending';

  //console.log("10. Extracted friendName:", friendName);
  //console.log("11. Extracted initials:", getInitials(friendName));

  // Prova anche con stili inline per debug
  const debugStyles = {
    card: {
      backgroundColor: "white",
      borderRadius: 16,
      padding: 16,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      height: 140,
      width: '100%',
      borderWidth: 2,
      borderColor: "green", // Bordo verde per debug
    },
    avatarPlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "#E5E7EB",
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 2,
      borderColor: "blue", // Bordo blu per debug
    },
    avatarInitials: {
      color: "#374151",
      fontWeight: "600" as const,
      fontSize: 18,
    },
    nameText: {
      fontSize: 16,
      fontWeight: "700" as const,
      color: "#333",
    }
  };

  return (
    <Pressable 
      style={debugStyles.card} // Usa stili debug
      onPress={() => onPress(friend)}
    >
      {/* AVATAR con stili debug */}
      <View style={debugStyles.avatarPlaceholder}>
        <Text style={debugStyles.avatarInitials}>
          {getInitials(friendName)}
        </Text>
      </View>
      
      {/* INFO */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={debugStyles.nameText} numberOfLines={1}>
          {friendName}
        </Text>
        
        {/* Username */}
        {username && (
          <Text style={{ fontSize: 12, color: "#666", marginBottom: 2 }} numberOfLines={1}>
            @{username}
          </Text>
        )}
        
        {/* Statistiche di debug */}
        <Text style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
          DEBUG: Componente funzionante
        </Text>
        
        {/* Bottone debug */}
        <Pressable
          style={{
            backgroundColor: "#2196F3",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            marginTop: 8,
            alignSelf: 'flex-start',
          }}
          onPress={(e) => {
            e.stopPropagation();
            console.log("Invita cliccato per:", friendName, "ID:", friendId);
            onInvite(friendId);
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>
            Invita
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
};