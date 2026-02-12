import React from 'react';
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../../../../components/Avatar";
import SportIcon from '../../../../components/SportIcon';
import { formatSportName } from '../../../../utils/sportUtils';
import { styles } from "../styles";
import { useNavigation } from '@react-navigation/native';
import { AnimatedCard } from '../../../../components/shared/AnimatedComponents';

// Utility: Configurazione risultato match (colori, icone)
const getMatchResultConfig = (isDraw: boolean, isWinner: boolean) => {
  if (isDraw) {
    return {
      accentColor: '#FFC107',
      backgroundColor: '#FFF8E1',
      textColor: '#F57C00',
      icon: 'remove-outline' as const,
      label: 'Pareggio'
    };
  }
  if (isWinner) {
    return {
      accentColor: '#4CAF50',
      backgroundColor: '#E8F5E9',
      textColor: '#2E7D32',
      icon: 'trophy-outline' as const,
      label: 'Vittoria'
    };
  }
  return {
    accentColor: '#F44336',
    backgroundColor: '#FFEBEE',
    textColor: '#C62828',
    icon: 'close-circle-outline' as const,
    label: 'Sconfitta'
  };
};

// Helper function to determine sport category and scoring rules
const getSportConfig = (sport?: string): { category: 'set-points' | 'set-games' | 'point-based'; allowsDraw?: boolean } => {
  if (!sport) return { category: 'set-points' };
  const sportLower = sport.toLowerCase();
  
  // Set-based (points): Volley, Beach Volley
  if (sportLower === 'volley' || sportLower === 'volleyball' ||
      sportLower === 'beach_volley' || sportLower === 'beach volley' || sportLower === 'beachvolley') {
    return { category: 'set-points' };
  }
  
  // Set-based (games): Tennis, Padel, Beach Tennis
  if (sportLower === 'tennis' || sportLower === 'padel' || 
      sportLower === 'beach_tennis' || sportLower === 'beach tennis') {
    return { category: 'set-games' };
  }
  
  // Point-based (calcio sports - allow draw)
  if (sportLower.includes('calcio') || sportLower.includes('calcetto') || sportLower.includes('calciotto')) {
    return { category: 'point-based', allowsDraw: true };
  }
  
  // Point-based (basket - no draw)
  if (sportLower === 'basket' || sportLower === 'basketball') {
    return { category: 'point-based', allowsDraw: false };
  }
  
  return { category: 'set-points' }; // default
};

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
  const navigation = useNavigation<any>();
  const myPlayer = match.players.find((p: any) => p.user._id === userId);
  const isWinner = myPlayer && myPlayer.team === match.winner;
  
  // Get sport config and check for draw
  const sportConfig = getSportConfig(match.booking?.campo?.sport?.code);
  let isDraw = false;
  if (match.score?.sets && match.score.sets.length > 0) {
    const finalSet = match.score.sets[0];
    isDraw = finalSet.teamA === finalSet.teamB && !match.winner;
  }
  
  // Get players for each team
  const teamAPlayers = match.players.filter((p: any) => p.team === 'A');
  const teamBPlayers = match.players.filter((p: any) => p.team === 'B');
  const maxPlayers = match.maxPlayers || (teamAPlayers.length + teamBPlayers.length);
  const maxPerTeam = maxPlayers > 0 ? Math.ceil(maxPlayers / 2) : Math.max(teamAPlayers.length, teamBPlayers.length);

  const handlePress = () => {
    if (match.booking?._id) {
      onPress(match.booking._id);
    }
  };

  const openUserProfile = (userId?: string) => {
    if (!userId) return;
    navigation.navigate("ProfiloUtente", { userId });
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

  // Sub-component: Point-Based Score Display
  const PointBasedScore = ({ finalSet, teamAWon, teamBWon, isDraw }: any) => (
    <View style={styles.matchScoreSection}>
      <Text style={styles.matchScoreLabel}>Risultato Finale</Text>
      <View style={styles.matchScoreDisplay}>
        <View style={[
          styles.matchScoreCircle,
          teamAWon && styles.matchScoreCircleWin
        ]}>
          <Text style={[
            styles.matchScoreNumber,
            teamAWon && styles.matchScoreNumberWin
          ]}>{finalSet.teamA}</Text>
        </View>
        <Text style={styles.matchScoreDivider}>-</Text>
        <View style={[
          styles.matchScoreCircle,
          teamBWon && styles.matchScoreCircleWin
        ]}>
          <Text style={[
            styles.matchScoreNumber,
            teamBWon && styles.matchScoreNumberWin
          ]}>{finalSet.teamB}</Text>
        </View>
      </View>
    </View>
  );

  // Sub-component: Set-Based Score Display
  const SetBasedScore = ({ compiledSets }: any) => (
    <View style={styles.matchScoreSection}>
      <Text style={styles.matchScoreLabel}>Dettaglio Set</Text>
      <View style={styles.matchSetsRow}>
        {compiledSets.map((set: any, idx: number) => {
          const teamAWon = set.teamA > set.teamB;
          const teamBWon = set.teamB > set.teamA;
          return (
            <View key={idx} style={styles.matchSetBox}>
              <Text style={styles.matchSetLabel}>SET {idx + 1}</Text>
              <View style={styles.matchSetScores}>
                <View style={[
                  styles.matchSetCircle,
                  teamAWon && styles.matchSetCircleWin
                ]}>
                  <Text style={[
                    styles.matchSetNumber,
                    teamAWon && styles.matchSetNumberWin
                  ]}>{set.teamA}</Text>
                </View>
                <Text style={styles.matchSetDivider}>-</Text>
                <View style={[
                  styles.matchSetCircle,
                  teamBWon && styles.matchSetCircleWin
                ]}>
                  <Text style={[
                    styles.matchSetNumber,
                    teamBWon && styles.matchSetNumberWin
                  ]}>{set.teamB}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  // Calcolare configurazione risultato
  const resultConfig = getMatchResultConfig(isDraw, isWinner);

  return (
    <AnimatedCard style={style}>
      <Pressable 
        style={[styles.matchHistoryCardNew, { borderLeftColor: resultConfig.accentColor }]} 
        onPress={handlePress}
      >
        {/* Header: Sport + Data + Badge Risultato */}
        <View style={styles.matchHeaderNew}>
          <View style={styles.matchHeaderLeft}>
            {match.booking?.campo?.sport?.code && (
              <View style={styles.matchSportIconContainer}>
                <SportIcon sport={match.booking.campo.sport.code} size={20} color="#2196F3" />
              </View>
            )}
            <View style={styles.matchHeaderInfo}>
              <Text style={styles.matchSportName}>
                {match.booking?.campo?.sport?.code 
                  ? formatSportName(match.booking.campo.sport.code)
                  : 'Partita'}
              </Text>
              <Text style={styles.matchDate}>
                {match.booking?.date
                  ? (() => {
                      const date = new Date(match.booking.date);
                      const day = date.getDate();
                      const month = date.toLocaleString('it-IT', { month: 'short' });
                      return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
                    })()
                  : ''}
              </Text>
            </View>
          </View>
          <View style={[
            styles.matchResultBadgeNew,
            { backgroundColor: resultConfig.backgroundColor }
          ]}>
            <Ionicons
              name={resultConfig.icon}
              size={14}
              color={resultConfig.textColor}
            />
            <Text style={[
              styles.matchResultTextNew,
              { color: resultConfig.textColor }
            ]}>
              {resultConfig.label}
            </Text>
          </View>
        </View>

        {/* Teams Section */}
        <View style={styles.matchTeamsNew}>
          {/* Team A */}
          <View style={styles.matchTeamNew}>
            <View style={styles.matchTeamHeaderNew}>
              <Ionicons name="shield" size={10} color="#2196F3" />
              <Text style={styles.matchTeamTitleNew}>Team A</Text>
            </View>
            <View style={styles.matchTeamPlayersNew}>
              {Array(maxPerTeam).fill(null).map((_, index) => {
                const player = teamAPlayers[index];
                const hasPlayer = index < teamAPlayers.length;
                const isCurrentUser = player?.user?._id === userId;
                return (
                  <View key={`teamA-${index}`} style={styles.matchPlayerSlot}>
                    {hasPlayer && player?.user ? (
                      <Pressable onPress={() => openUserProfile(player.user?._id)}>
                        <View style={[
                          styles.matchPlayerAvatarWrapper,
                          isCurrentUser && styles.matchPlayerAvatarCurrent
                        ]}>
                          <Avatar
                            name={player.user?.name}
                            surname={player.user?.surname}
                            avatarUrl={player.user?.avatarUrl}
                            size={28}
                            backgroundColor="#E3F2FD"
                            textColor="#1976D2"
                          />
                        </View>
                      </Pressable>
                    ) : (
                      <View style={styles.matchPlayerEmpty}>
                        <Ionicons name="person-outline" size={14} color="#ccc" />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* VS Divider */}
          <View style={styles.matchVsDivider}>
            <Text style={styles.matchVsText}>vs</Text>
          </View>

          {/* Team B */}
          <View style={styles.matchTeamNew}>
            <View style={styles.matchTeamHeaderNew}>
              <Ionicons name="shield" size={10} color="#F44336" />
              <Text style={styles.matchTeamTitleNew}>Team B</Text>
            </View>
            <View style={styles.matchTeamPlayersNew}>
              {Array(maxPerTeam).fill(null).map((_, index) => {
                const player = teamBPlayers[index];
                const hasPlayer = index < teamBPlayers.length;
                const isCurrentUser = player?.user?._id === userId;
                return (
                  <View key={`teamB-${index}`} style={styles.matchPlayerSlot}>
                    {hasPlayer && player?.user ? (
                      <Pressable onPress={() => openUserProfile(player.user?._id)}>
                        <View style={[
                          styles.matchPlayerAvatarWrapper,
                          isCurrentUser && styles.matchPlayerAvatarCurrent
                        ]}>
                          <Avatar
                            name={player.user?.name}
                            surname={player.user?.surname}
                            avatarUrl={player.user?.avatarUrl}
                            size={28}
                            backgroundColor="#FFEBEE"
                            textColor="#C62828"
                          />
                        </View>
                      </Pressable>
                    ) : (
                      <View style={styles.matchPlayerEmpty}>
                        <Ionicons name="person-outline" size={14} color="#ccc" />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Score Section */}
        {match.score?.sets && match.score.sets.length > 0 && (() => {
          const compiledSets = match.score.sets.filter((set: any) => set.teamA > 0 || set.teamB > 0);
          
          if (compiledSets.length === 0) return null;
          
          if (sportConfig.category === 'point-based') {
            const finalSet = compiledSets[0];
            const teamAWon = finalSet.teamA > finalSet.teamB;
            const teamBWon = finalSet.teamB > finalSet.teamA;
            return <PointBasedScore finalSet={finalSet} teamAWon={teamAWon} teamBWon={teamBWon} isDraw={isDraw} />;
          }
          
          return <SetBasedScore compiledSets={compiledSets} />;
        })()}
      </Pressable>
    </AnimatedCard>
  );
};

MatchHistoryCard.Title = () => (
  <Text style={styles.sectionTitle}>Ultime Partite</Text>
);

MatchHistoryCard.Link = () => (
  <Text style={styles.sectionLink}>Storico</Text>
);

export default MatchHistoryCard;