import React from 'react';
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatMatchDate } from "../utils/dateFormatter";
import { styles } from "../styles";

interface MatchHistoryCardProps {
  match: any;
  userId?: string;
  onPress: (bookingId?: string) => void;
}

const MatchHistoryCard: React.FC<MatchHistoryCardProps> = ({ match, userId, onPress }) => {
  const myPlayer = match.players.find((p: any) => p.user._id === userId);
  const isWinner = myPlayer && myPlayer.team === match.winner;

  const handlePress = () => {
    if (match.booking?._id) {
      onPress(match.booking._id);
    }
  };

  return (
    <Pressable style={styles.matchHistoryCard} onPress={handlePress}>
      <View
        style={[
          styles.matchResultBadge,
          isWinner ? styles.matchWin : styles.matchLoss,
        ]}
      >
        <Ionicons
          name={isWinner ? "trophy" : "close-circle"}
          size={20}
          color={isWinner ? "#FFD700" : "#F44336"}
        />
      </View>

      <View style={styles.matchHistoryInfo}>
        <Text style={styles.matchHistoryTitle}>
          vs. Team {myPlayer?.team === "A" ? "B" : "A"}
        </Text>
        <Text style={styles.matchHistoryDate}>
          {formatMatchDate(match.playedAt || match.createdAt)}
        </Text>
      </View>

      {match.score?.sets && (
        <Text
          style={[
            styles.matchScore,
            isWinner ? styles.matchScoreWin : styles.matchScoreLoss,
          ]}
        >
          {match.score.sets
            .map((s: any) => (myPlayer?.team === "A" ? s.teamA : s.teamB))
            .join(" - ")}{" "}
          -{" "}
          {match.score.sets
            .map((s: any) => (myPlayer?.team === "A" ? s.teamB : s.teamA))
            .join(" - ")}
        </Text>
      )}

      <Ionicons name="chevron-forward" size={20} color="#999" />
    </Pressable>
  );
};

MatchHistoryCard.Title = () => (
  <Text style={styles.sectionTitle}>Ultime Partite</Text>
);

MatchHistoryCard.Link = () => (
  <Text style={styles.sectionLink}>Storico</Text>
);

export default MatchHistoryCard;