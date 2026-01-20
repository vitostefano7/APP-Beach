import React, { useState, useContext } from 'react';
import { View, Text, Image, Pressable, Alert, ActivityIndicator, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import API_URL from "../../../../config/api";
import { resolveImageUrl } from "../../../../utils/imageUtils";
import { AuthContext } from "../../../../context/AuthContext";
import { formatDate, calculateDaysUntil } from "../utils/dateFormatter";
import { styles } from "../styles";

interface NextMatchCardProps {
  booking: any;
  onPress: () => void;
}

const NextMatchCard: React.FC<NextMatchCardProps> = ({ booking, onPress }) => {
  const navigation = useNavigation<any>();
  const { token } = useContext(AuthContext);
  const [loadingChat, setLoadingChat] = useState(false);
  
  const displayDate = formatDate(booking.date);
  const daysUntil = calculateDaysUntil(booking.date);

  // Verifica se la partita è in corso
  const isMatchInProgress = () => {
    try {
      const now = new Date();
      const bookingStartTime = new Date(`${booking.date}T${booking.startTime}:00`);
      const bookingEndTime = new Date(`${booking.date}T${booking.endTime}:00`);
      return now >= bookingStartTime && now <= bookingEndTime;
    } catch (error) {
      return false;
    }
  };

  const handleOpenGroupChat = async () => {
    try {
      const matchId = booking.match?._id || booking.matchId;
      if (!matchId || matchId === "undefined") {
        Alert.alert("Errore", "Nessun match associato a questa prenotazione");
        return;
      }

      setLoadingChat(true);

      // Ottieni o crea la conversazione di gruppo
      const response = await fetch(
        `${API_URL}/api/conversations/match/${matchId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Errore apertura chat');
      }

      const conversation = await response.json();

      // Naviga alla chat di gruppo
      navigation.navigate("GroupChat", {
        conversationId: conversation._id,
        groupName: conversation.groupName,
        matchId,
      });
    } catch (error: any) {
      console.error("Errore apertura chat gruppo:", error);
      Alert.alert("Errore", error.message || "Impossibile aprire la chat di gruppo");
    } finally {
      setLoadingChat(false);
    }
  };

  const handleOpenMaps = () => {
    const location = booking.campo?.struttura?.location;
    if (!location) {
      Alert.alert("Errore", "Indirizzo non disponibile");
      return;
    }

    const { address, city } = location;
    const query = address ? `${address}, ${city}` : city;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert("Errore", "Impossibile aprire Google Maps");
    });
  };

  const matchInProgress = isMatchInProgress();

  // Debug players
  console.log("NextMatchCard - hasMatch:", booking.hasMatch);
  console.log("NextMatchCard - players:", booking.players);
  console.log("NextMatchCard - players length:", booking.players?.length);

  return (
    <Pressable style={styles.nextMatchCard} onPress={onPress}>
      {/* Immagine in alto */}
      <View style={styles.matchImageContainer}>
        {booking.campo?.struttura?.images?.[0] && (
          <Image
            source={{ uri: resolveImageUrl(booking.campo.struttura.images[0]) }}
            style={styles.matchImage}
          />
        )}
        <View style={styles.matchOverlay} />
        
        <View style={[
          styles.matchTimeBadge,
          matchInProgress && { backgroundColor: 'rgba(76, 175, 80, 0.95)' }
        ]}>
          {matchInProgress ? (
            <Text style={styles.matchTimeText}>IN CORSO</Text>
          ) : (
            <Text style={styles.matchTimeText}>
              {displayDate === "Oggi" || displayDate === "Domani"
                ? `Tra ${daysUntil === 0 ? '24' : daysUntil === 1 ? '24' : daysUntil * 24}h`
                : `Tra ${daysUntil}g`}
            </Text>
          )}
        </View>
      </View>

      {/* Contenuto sotto l'immagine */}
      <View style={styles.matchContent}>
        <View style={styles.matchInfoRow}>
          {/* Data, orario e location */}
          <View style={styles.matchInfoLeft}>
            <View style={styles.matchInfoSection}>
              <Text style={styles.matchDay}>{displayDate}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={16} color="#666" style={{ marginRight: 4 }} />
                <Text style={styles.matchTime}>
                  {booking.startTime} - {booking.endTime}
                </Text>
              </View>
            </View>

            {/* Location */}
            <View style={styles.matchLocation}>
              <Ionicons name="location-outline" size={16} color="#666" style={{ marginRight: 4 }} />
              <Text style={styles.matchLocationText}>
                {booking.campo?.struttura?.name}, {booking.campo?.struttura?.location?.address || 'Indirizzo non disponibile'}
              </Text>
            </View>
          </View>

          {/* Avatar partecipanti */}
          {booking.players && booking.players.length > 0 ? (
            <View style={styles.playersAvatarContainer}>
              {booking.players.slice(0, 4).map((player: any, index: number) => (
                <View key={player._id || index} style={[styles.playerAvatar, { zIndex: 4 - index }]}>
                  {player.user?.avatarUrl ? (
                    <Image 
                      source={{ uri: resolveImageUrl(player.user.avatarUrl) }} 
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarInitial}>
                        {player.user?.name?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
              {booking.players.length > 4 && (
                <View style={[styles.playerAvatar, styles.morePlayersAvatar]}>
                  <Text style={styles.morePlayersText}>+{booking.players.length - 4}</Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {/* Pulsanti azioni */}
        {booking.hasMatch && (
          <View style={styles.matchActions}>
            <Pressable
              style={styles.matchActionButton}
              onPress={(event) => {
                event?.stopPropagation?.();
                handleOpenMaps();
              }}
            >
              <Ionicons name="navigate" size={20} color="#2196F3" />
              <Text style={styles.matchActionText}>Indicazioni</Text>
            </Pressable>
            <Pressable 
              style={[styles.matchActionButton, styles.chatButton, loadingChat && { opacity: 0.6 }]}
              onPress={handleOpenGroupChat}
              disabled={loadingChat}
            >
              {loadingChat ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="white" />
                  <Text style={styles.chatActionText}>Chat Partita</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
};

// Componenti separati per titolo e link
NextMatchCard.Title = () => (
  <Text style={styles.sectionTitle}>La tua prossima partita</Text>
);

NextMatchCard.Link = () => (
  <Text style={styles.sectionLink}>Calendario</Text>
);

export default NextMatchCard;
