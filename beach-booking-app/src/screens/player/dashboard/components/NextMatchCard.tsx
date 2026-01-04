import React from 'react';
import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../../../config/api";
import { formatDate, calculateDaysUntil } from "../utils/dateFormatter";
import { styles } from "../styles";

interface NextMatchCardProps {
  booking: any;
  onPress: () => void;
}

const NextMatchCard: React.FC<NextMatchCardProps> = ({ booking, onPress }) => {
  const displayDate = formatDate(booking.date);
  const daysUntil = calculateDaysUntil(booking.date);

  return (
    <Pressable style={styles.nextMatchCard} onPress={onPress}>
      {booking.campo?.struttura?.images?.[0] && (
        <Image
          source={{ uri: `${API_URL}${booking.campo.struttura.images[0]}` }}
          style={styles.matchImage}
        />
      )}
      <View style={styles.matchOverlay} />

      <View style={styles.matchTimeBadge}>
        <Text style={styles.matchTimeText}>
          {displayDate === "Oggi" || displayDate === "Domani"
            ? displayDate
            : `Tra ${daysUntil} giorni`}
        </Text>
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
          <Pressable style={styles.matchActionButton}>
            <Ionicons name="chatbubble-outline" size={16} color="white" />
            <Text style={styles.matchActionText}>Chat Gruppo</Text>
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