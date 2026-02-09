import React from 'react';
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from "../../../../components/Avatar";
import SportIcon from '../../../../components/SportIcon';
import { formatMatchDate } from "../utils/dateFormatter";
import { formatSportName } from '../../../../utils/sportUtils';
import { styles } from "../styles";
import { useNavigation } from '@react-navigation/native';

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

  // Format sport name

  return (
    <Pressable 
      style={[styles.matchHistoryCard, style]} 
      onPress={handlePress}
    >
      <LinearGradient
        colors={isDraw ? ['#FFC107', '#FF9800'] : isWinner ? ['#4CAF50', '#45A049'] : ['#F44336', '#E53935']}
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
                  isDraw ? styles.matchDraw : isWinner ? styles.matchWin : styles.matchLoss,
                ]}
              >
                <Ionicons
                  name={isDraw ? "ellipse" : isWinner ? "trophy" : "close-circle"}
                  size={22}
                  color={isDraw ? "#FFC107" : isWinner ? "#FFD700" : "#F44336"}
                />
              </View>
              <View>
                <Text style={[
                  styles.matchResultText,
                  isDraw ? styles.matchDrawText : isWinner ? styles.matchWinText : styles.matchLossText
                ]}>
                  {isDraw ? 'PAREGGIO' : isWinner ? 'VITTORIA' : 'SCONFITTA'}
                </Text>
                <Text style={styles.matchDateSubtext}>
                  {match.booking?.date
                    ? (() => {
                        const date = new Date(match.booking.date);
                        const day = date.getDate();
                        const month = date.toLocaleString('it-IT', { month: 'long' });
                        const year = date.getFullYear();
                        return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
                      })()
                    : ''}
                </Text>
              </View>
            </View>

            {match.booking?.campo?.sport?.code && (
              <View style={styles.matchSportBadge}>
                <SportIcon sport={match.booking.campo.sport.code} size={16} color="#2196F3" />
                <Text style={styles.matchSportText}>
                  {formatSportName(match.booking.campo.sport.code)}
                </Text>
              </View>
            )}
          </View>

          {/* Teams */}
          <View style={styles.matchTeamsContainer}>
            {/* Team A */}
            <View style={styles.matchTeamSection}>
              <View style={[styles.openMatchTeamHeader, styles.teamAHeaderSmall]}>
                <Ionicons name="shield-outline" size={12} color="white" />
                <Text style={styles.openMatchTeamTitle}>Team A</Text>
              </View>
              <View style={styles.openMatchTeamSlots}>
                {Array(maxPerTeam).fill(null).map((_, index) => {
                  const player = teamAPlayers[index];
                  const hasPlayer = index < teamAPlayers.length;
                  return (
                    <View 
                      key={`teamA-${index}`} 
                      style={[
                        styles.openMatchTeamSlot,
                        hasPlayer ? styles.openMatchSlotFilled : styles.openMatchSlotEmpty,
                      ]}
                    >
                      {hasPlayer && player?.user ? (
                        <Pressable onPress={() => openUserProfile(player.user?._id)}>
                          <View style={{
                            borderRadius: 20,
                            borderWidth: player.user?._id === userId ? 2 : 0,
                            borderColor: player.user?._id === userId ? '#4CAF50' : 'transparent',
                            padding: player.user?._id === userId ? 2 : 0,
                          }}>
                            <Avatar
                              name={player.user?.name}
                              surname={player.user?.surname}
                              avatarUrl={player.user?.avatarUrl}
                              size={24}
                              backgroundColor="#E3F2FD"
                              textColor="#333"
                            />
                          </View>
                        </Pressable>
                      ) : (
                        <Ionicons name="person-outline" size={12} color="#ccc" />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Divisore VS */}
            <View style={styles.openMatchDivider}>
              <Text style={styles.openMatchVs}>VS</Text>
            </View>

            {/* Team B */}
            <View style={styles.matchTeamSection}>
              <View style={[styles.openMatchTeamHeader, styles.teamBHeaderSmall]}>
                <Ionicons name="shield-outline" size={12} color="white" />
                <Text style={styles.openMatchTeamTitle}>Team B</Text>
              </View>
              <View style={styles.openMatchTeamSlots}>
                {Array(maxPerTeam).fill(null).map((_, index) => {
                  const player = teamBPlayers[index];
                  const hasPlayer = index < teamBPlayers.length;
                  return (
                    <View 
                      key={`teamB-${index}`} 
                      style={[
                        styles.openMatchTeamSlot,
                        hasPlayer ? styles.openMatchSlotFilled : styles.openMatchSlotEmpty,
                      ]}
                    >
                      {hasPlayer && player?.user ? (
                        <Pressable onPress={() => openUserProfile(player.user?._id)}>
                          <View style={{
                            borderRadius: 20,
                            borderWidth: player.user?._id === userId ? 2 : 0,
                            borderColor: player.user?._id === userId ? '#4CAF50' : 'transparent',
                            padding: player.user?._id === userId ? 2 : 0,
                          }}>
                            <Avatar
                              name={player.user?.name}
                              surname={player.user?.surname}
                              avatarUrl={player.user?.avatarUrl}
                              size={24}
                              backgroundColor="#FFEBEE"
                              textColor="#333"
                            />
                          </View>
                        </Pressable>
                      ) : (
                        <Ionicons name="person-outline" size={12} color="#ccc" />
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
            
            // POINT-BASED: Mostra solo punteggio finale
            if (sportConfig.category === 'point-based') {
              const finalSet = compiledSets[0];
              const isDraw = finalSet.teamA === finalSet.teamB;
              const teamAWon = finalSet.teamA > finalSet.teamB;
              const teamBWon = finalSet.teamB > finalSet.teamA;
              
              return (
                <View style={{ 
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderTopWidth: 1,
                  borderTopColor: '#f0f0f0',
                  alignItems: 'center'
                }}>
                  <Text style={{ 
                    fontSize: 10, 
                    fontWeight: '700', 
                    color: '#999',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    marginBottom: 8
                  }}>
                    {isDraw ? 'Pareggio' : 'Risultato Finale'}
                  </Text>
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    gap: 12,
                  }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: teamAWon ? '#2196F3' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: teamAWon ? 0 : 2,
                      borderColor: '#2196F3',
                    }}>
                      <Text style={{ 
                        fontSize: 18, 
                        fontWeight: '800', 
                        color: teamAWon ? '#FFFFFF' : '#2196F3'
                      }}>
                        {finalSet.teamA}
                      </Text>
                    </View>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: '600', 
                      color: '#ccc' 
                    }}>
                      -
                    </Text>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: teamBWon ? '#F44336' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: teamBWon ? 0 : 2,
                      borderColor: '#F44336',
                    }}>
                      <Text style={{ 
                        fontSize: 18, 
                        fontWeight: '800', 
                        color: teamBWon ? '#FFFFFF' : '#F44336'
                      }}>
                        {finalSet.teamB}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }
            
            // SET-BASED: Mostra Set 1, Set 2, Set 3
            return (
              <View style={{ 
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderTopWidth: 1,
                borderTopColor: '#f0f0f0',
              }}>
                <Text style={{ 
                  fontSize: 10, 
                  fontWeight: '700', 
                  color: '#999',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  marginBottom: 8
                }}>
                  Dettaglio Set
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                  {compiledSets.map((set: any, idx: number) => {
                    const teamAWon = set.teamA > set.teamB;
                    const teamBWon = set.teamB > set.teamA;
                    return (
                      <View key={idx} style={{ 
                        flexDirection: 'column',
                        alignItems: 'center',
                        backgroundColor: '#F5F5F5',
                        borderRadius: 10,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        flex: 1,
                        maxWidth: 100,
                      }}>
                        <Text style={{ 
                          fontSize: 8, 
                          fontWeight: '700', 
                          color: '#999',
                          marginBottom: 4
                        }}>
                          SET {idx + 1}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <View style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: teamAWon ? '#2196F3' : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: teamAWon ? 0 : 1.5,
                            borderColor: '#2196F3',
                          }}>
                            <Text style={{ 
                              fontSize: 12, 
                              fontWeight: '800', 
                              color: teamAWon ? '#FFFFFF' : '#2196F3'
                            }}>
                              {set.teamA}
                            </Text>
                          </View>
                          <Text style={{ 
                            fontSize: 10, 
                            fontWeight: '600', 
                            color: '#ccc' 
                          }}>
                            -
                          </Text>
                          <View style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: teamBWon ? '#F44336' : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: teamBWon ? 0 : 1.5,
                            borderColor: '#F44336',
                          }}>
                            <Text style={{ 
                              fontSize: 12, 
                              fontWeight: '800', 
                              color: teamBWon ? '#FFFFFF' : '#F44336'
                            }}>
                              {set.teamB}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })()}
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