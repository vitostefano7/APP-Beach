import React, { useState, useContext } from 'react';
import { View, Text, Image, Pressable, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import API_URL from "../../../../config/api";
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
      if (!booking.match?._id) {
        Alert.alert("Errore", "Nessun match associato a questa prenotazione");
        return;
      }

      setLoadingChat(true);

      // Ottieni o crea la conversazione di gruppo
      const response = await fetch(
        `${API_URL}/api/conversations/match/${booking.match._id}`,
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
        matchId: booking.match._id,
      });
    } catch (error: any) {
      console.error("Errore apertura chat gruppo:", error);
      Alert.alert("Errore", error.message || "Impossibile aprire la chat di gruppo");
    } finally {
      setLoadingChat(false);
    }
  };

  const matchInProgress = isMatchInProgress();

  return (
    <Pressable style={styles.nextMatchCard} onPress={onPress}>
      {booking.campo?.struttura?.images?.[0] && (
        <Image
          source={{ uri: `${API_URL}${booking.campo.struttura.images[0]}` }}
          style={styles.matchImage}
        />
      )}
      <View style={styles.matchOverlay} />

      <View style={[
        styles.matchTimeBadge,
        matchInProgress && { backgroundColor: 'rgba(76, 175, 80, 0.95)' }
      ]}>
        {matchInProgress ? (
          <>
            <Ionicons name="play-circle" size={14} color="white" style={{ marginRight: 4 }} />
            <Text style={styles.matchTimeText}>IN CORSO</Text>
          </>
        ) : (
          <Text style={styles.matchTimeText}>
            {displayDate === "Oggi" || displayDate === "Domani"
              ? displayDate
              : `Tra ${daysUntil} giorni`}
          </Text>
        )}
      </View>

      <View style={styles.matchInfo}>
        <Text style={styles.matchDay}>{displayDate}</Text>
        <Text style={styles.matchTime}>
          {booking.startTime} - {booking.endTime}
        </Text>
      </View>

      <View style={styles.matchDetails}>
        <Text style={styles.matchTitle}>
          {booking.hasMatch ? "Partita Amichevole" : "Prenotazione Campo"}
        </Text>
        <View style={styles.matchLocation}>
          <Ionicons name="location" size={14} color="white" />
          <Text style={styles.matchLocationText}>
            {booking.campo?.struttura?.name}
          </Text>
        </View>
      </View>

      {booking.hasMatch && (
        <View style={styles.matchActions}>
          <Pressable style={styles.matchActionButton}>
            <Ionicons name="information-circle-outline" size={16} color="white" />
            <Text style={styles.matchActionText}>Indicazioni</Text>
          </Pressable>
          <Pressable 
            style={[styles.matchActionButton, loadingChat && { opacity: 0.6 }]}
            onPress={handleOpenGroupChat}
            disabled={loadingChat}
          >
            {loadingChat ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="chatbubble-outline" size={16} color="white" />
                <Text style={styles.matchActionText}>Chat Gruppo</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
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