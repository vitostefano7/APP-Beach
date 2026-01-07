import React from 'react';
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { formatMatchDate } from "../utils/dateFormatter";
import { styles } from "../styles";

interface MatchHistoryCardProps {
  match: any;
  userId?: string;
  onPress: (bookingId?: string) => void;
  style?: any;
}

const MatchHistoryCard: React.FC<MatchHistoryCardProps> = ({ 
  match, 
  userId, 
  onPress,
  style 
}) => {
  const myPlayer = match.players.find((p: any) => p.user._id === userId);
  const isWinner = myPlayer && myPlayer.team === match.winner;
  
  // Get players for each team
  const teamAPlayers = match.players.filter((p: any) => p.team === 'A');
  const teamBPlayers = match.players.filter((p: any) => p.team === 'B');
  
  // Helper to get initials
  const getInitials = (name?: string, surname?: string) => {
    if (!name) return '?';
    const firstInitial = name.charAt(0).toUpperCase();
    const lastInitial = surname ? surname.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  };

  // Get sport icon
  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'beach_volleyball':
        return 'sunny';
      case 'volleyball':
        return 'basketball';
      case 'padel':
        return 'tennisball';
      case 'tennis':
        return 'tennisball';
      default:
        return 'football';
    }
  };

  const handlePress = () => {
    if (match.booking?._id) {
      onPress(match.booking._id);
    }
  };

  // Calculate total score for display
  const getTeamScore = (team: 'A' | 'B') => {
    if (!match.score?.sets) return 0;
    return match.score.sets.filter((s: any) => 
      team === 'A' ? s.teamA > s.teamB : s.teamB > s.teamA
    ).length;
  };

  return (
    <Pressable 
      style={[styles.matchHistoryCard, style]} 
      onPress={handlePress}
    >
      <LinearGradient
        colors={isWinner ? ['#4CAF50', '#45A049'] : ['#F44336', '#E53935']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.matchGradientBorder}
      >
        <View style={styles.matchCardInner}>
          {/* Header with result badge and sport */}
          <View style={styles.matchCardHeader}>
            <View style={styles.matchResultContainer}>
              <View
                style={[
                  styles.matchResultBadge,
                  isWinner ? styles.matchWin : styles.matchLoss,
                ]}
              >
                <Ionicons
                  name={isWinner ? "trophy" : "close-circle"}
                  size={18}
                  color={isWinner ? "#FFD700" : "#F44336"}
                />
              </View>
              <Text style={[
                styles.matchResultText,
                isWinner ? styles.matchWinText : styles.matchLossText
              ]}>
                {isWinner ? 'Vittoria' : 'Sconfitta'}
              </Text>
            </View>

            <View style={styles.matchSportBadge}>
              <Ionicons 
                name={getSportIcon(match.booking?.sport || 'beach_volleyball')} 
                size={14} 
                color="#666" 
              />
            </View>
          </View>

          {/* Teams and Score */}
          <View style={styles.matchTeamsContainer}>
            {/* Team A */}
            <View style={styles.matchTeamSection}>
              <Text style={[
                styles.matchTeamLabel,
                myPlayer?.team === 'A' && styles.matchTeamLabelMy
              ]}>
                Team A
              </Text>
              <View style={styles.matchTeamAvatars}>
                {teamAPlayers.slice(0, 3).map((player: any, idx: number) => (
                  <View 
                    key={player._id || player.user?._id || `teamA-${idx}`}
                    style={[
                      styles.matchAvatar,
                      styles.matchAvatarA,
                      idx > 0 && { marginLeft: -6 }
                    ]}
                  >
                    <Text style={styles.matchAvatarText}>
                      {getInitials(player.user?.name, player.user?.surname)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Score */}
            <View style={styles.matchScoreContainer}>
              <Text style={styles.matchScoreLarge}>
                {getTeamScore(myPlayer?.team === 'A' ? 'A' : 'B')}
              </Text>
              <Text style={styles.matchScoreSeparator}>-</Text>
              <Text style={styles.matchScoreLarge}>
                {getTeamScore(myPlayer?.team === 'A' ? 'B' : 'A')}
              </Text>
            </View>

            {/* Team B */}
            <View style={styles.matchTeamSection}>
              <Text style={[
                styles.matchTeamLabel,
                myPlayer?.team === 'B' && styles.matchTeamLabelMy
              ]}>
                Team B
              </Text>
              <View style={styles.matchTeamAvatars}>
                {teamBPlayers.slice(0, 3).map((player: any, idx: number) => (
                  <View 
                    key={player._id || player.user?._id || `teamB-${idx}`}
                    style={[
                      styles.matchAvatar,
                      styles.matchAvatarB,
                      idx > 0 && { marginLeft: -6 }
                    ]}
                  >
                    <Text style={styles.matchAvatarText}>
                      {getInitials(player.user?.name, player.user?.surname)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Footer with location and date */}
          <View style={styles.matchCardFooter}>
            <View style={styles.matchLocationContainer}>
              <Ionicons name="location" size={10} color="#666" />
              <Text style={styles.matchLocationText} numberOfLines={1}>
                {match.booking?.campo?.struttura?.name || 'Struttura'}
              </Text>
            </View>
            <Text style={styles.matchHistoryDate}>
              {formatMatchDate(match.playedAt || match.createdAt)}
            </Text>
          </View>
        </View>
      </LinearGradient>
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