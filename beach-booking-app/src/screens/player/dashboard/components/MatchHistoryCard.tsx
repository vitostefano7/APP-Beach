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

  // Format player names for display
  const getPlayerName = (player: any) => {
    const firstName = player.user?.name || 'Giocatore';
    const surname = player.user?.surname;
    if (surname) {
      return `${firstName} ${surname.charAt(0)}.`;
    }
    return firstName;
  };

  // Format sport name
  const formatSportName = (sport: string) => {
    switch (sport) {
      case 'beach_volleyball':
        return 'Beach Volley';
      case 'volleyball':
        return 'Pallavolo';
      case 'padel':
        return 'Padel';
      case 'tennis':
        return 'Tennis';
      default:
        return sport;
    }
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
                  size={22}
                  color={isWinner ? "#FFD700" : "#F44336"}
                />
              </View>
              <View>
                <Text style={[
                  styles.matchResultText,
                  isWinner ? styles.matchWinText : styles.matchLossText
                ]}>
                  {isWinner ? 'VITTORIA' : 'SCONFITTA'}
                </Text>
                <Text style={styles.matchDateSubtext}>
                  {formatMatchDate(match.playedAt || match.createdAt)}
                </Text>
              </View>
            </View>

            <View style={styles.matchSportBadge}>
              <Ionicons 
                name={getSportIcon(match.booking?.sport || 'beach_volleyball')} 
                size={16} 
                color="#2196F3" 
              />
              <Text style={styles.matchSportText}>
                {formatSportName(match.booking?.sport || 'beach_volleyball')}
              </Text>
            </View>
          </View>

          {/* Teams and Score */}
          <View style={styles.matchTeamsContainer}>
            {/* Team A */}
            <View style={styles.matchTeamSection}>
              <View style={[
                styles.matchTeamLabelContainer,
                myPlayer?.team === 'A' && styles.matchTeamLabelContainerMy
              ]}>
                <Text style={[
                  styles.matchTeamLabel,
                  myPlayer?.team === 'A' && styles.matchTeamLabelMy
                ]}>
                  TEAM A
                </Text>
              </View>
              <View style={styles.matchTeamAvatars}>
                {teamAPlayers.slice(0, 2).map((player: any, idx: number) => (
                  <View 
                    key={player._id || player.user?._id || `teamA-${idx}`}
                    style={[
                      styles.matchAvatar,
                      styles.matchAvatarA,
                      idx > 0 && { marginLeft: -8 }
                    ]}
                  >
                    <Text style={styles.matchAvatarText}>
                      {getInitials(player.user?.name, player.user?.surname)}
                    </Text>
                  </View>
                ))}
              </View>
              {teamAPlayers.length > 0 && (
                <View style={styles.matchPlayerNames}>
                  {teamAPlayers.slice(0, 2).map((player: any, idx: number) => (
                    <Text 
                      key={`nameA-${idx}`}
                      style={[
                        styles.matchPlayerName,
                        player.user?._id === userId && styles.matchPlayerNameMy
                      ]}
                      numberOfLines={1}
                    >
                      {getPlayerName(player)}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* Score */}
            <View style={styles.matchScoreMainContainer}>
              <View style={styles.matchScoreContainer}>
                <Text style={styles.matchScoreLarge}>
                  {getTeamScore(myPlayer?.team === 'A' ? 'A' : 'B')}
                </Text>
                <Text style={styles.matchScoreSeparator}>-</Text>
                <Text style={styles.matchScoreLarge}>
                  {getTeamScore(myPlayer?.team === 'A' ? 'B' : 'A')}
                </Text>
              </View>
              {match.score?.sets && match.score.sets.length > 0 && (
                <View style={styles.matchSetsContainer}>
                  {match.score.sets.map((set: any, idx: number) => (
                    <Text key={idx} style={styles.matchSetScore}>
                      {myPlayer?.team === 'A' ? `${set.teamA}-${set.teamB}` : `${set.teamB}-${set.teamA}`}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* Team B */}
            <View style={styles.matchTeamSection}>
              <View style={[
                styles.matchTeamLabelContainer,
                myPlayer?.team === 'B' && styles.matchTeamLabelContainerMy
              ]}>
                <Text style={[
                  styles.matchTeamLabel,
                  myPlayer?.team === 'B' && styles.matchTeamLabelMy
                ]}>
                  TEAM B
                </Text>
              </View>
              <View style={styles.matchTeamAvatars}>
                {teamBPlayers.slice(0, 2).map((player: any, idx: number) => (
                  <View 
                    key={player._id || player.user?._id || `teamB-${idx}`}
                    style={[
                      styles.matchAvatar,
                      styles.matchAvatarB,
                      idx > 0 && { marginLeft: -8 }
                    ]}
                  >
                    <Text style={styles.matchAvatarText}>
                      {getInitials(player.user?.name, player.user?.surname)}
                    </Text>
                  </View>
                ))}
              </View>
              {teamBPlayers.length > 0 && (
                <View style={styles.matchPlayerNames}>
                  {teamBPlayers.slice(0, 2).map((player: any, idx: number) => (
                    <Text 
                      key={`nameB-${idx}`}
                      style={[
                        styles.matchPlayerName,
                        player.user?._id === userId && styles.matchPlayerNameMy
                      ]}
                      numberOfLines={1}
                    >
                      {getPlayerName(player)}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Footer with location and time */}
          <View style={styles.matchCardFooter}>
            <View style={styles.matchLocationContainer}>
              <Ionicons name="location" size={14} color="#2196F3" />
              <Text style={styles.matchLocationText} numberOfLines={1}>
                {match.booking?.campo?.struttura?.name || 'Struttura'}
              </Text>
            </View>
            <View style={styles.matchTimeContainer}>
              <Ionicons name="time-outline" size={12} color="#999" />
              <Text style={styles.matchTimeText}>
                {match.booking?.startTime || '--:--'}
              </Text>
            </View>
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