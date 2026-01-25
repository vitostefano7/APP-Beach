import React from 'react';
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from "../../../../components/Avatar";
import SportIcon from '../../../../components/SportIcon';
import { formatMatchDate } from "../utils/dateFormatter";
import { styles } from "../styles";
import { useNavigation } from '@react-navigation/native';

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

            <View style={styles.matchSportBadge}>
              <SportIcon sport={match.booking?.sport || 'beach_volleyball'} size={16} color="#2196F3" />
              <Text style={styles.matchSportText}>
                {formatSportName(match.booking?.sport || 'beach_volleyball')}
              </Text>
            </View>
          </View>

          {/* Teams and Score */}
          <View style={styles.matchTeamsContainer}>
            {/* Team A */}
            <View style={styles.matchTeamSection}>
              <View style={[styles.matchTeamLabelContainer, { backgroundColor: '#2196F3' }]}> 
                <Text style={[styles.matchTeamLabel, { color: '#fff' }]}> 
                  TEAM A
                </Text>
              </View>
              <View style={[styles.openMatchTeamSlots, { flexWrap: 'wrap', height: undefined }]}> 
                {(() => {
                  const sport = match.booking?.sport || match.booking?.campo?.sport || '';
                  const lowerSport = sport.toLowerCase();
                  const isBeachVolley = lowerSport.includes('beach') && lowerSport.includes('volley');
                  const teamSize = teamAPlayers.length;
                  // 2v2: una riga, 3v3: due righe (2 sopra, 1 sotto centrato)
                  if (isBeachVolley && teamSize === 2) {
                    // Una colonna
                    return (
                      <View style={{ flexDirection: 'column' }}>
                        {Array(2).fill(null).map((_, idx) => {
                          const player = teamAPlayers[idx];
                          const hasPlayer = idx < teamAPlayers.length;
                          return (
                            <View
                              key={`teamA-${idx}`}
                              style={[
                                styles.openMatchTeamSlot,
                                hasPlayer ? styles.openMatchSlotFilled : styles.openMatchSlotEmpty,
                                idx > 0 ? { marginTop: 8 } : null,
                              ]}
                            >
                              {hasPlayer && player?.user ? (
                                <Pressable onPress={() => openUserProfile(player.user?._id)}>
                                  <View style={{
                                    borderRadius: 20,
                                    borderWidth: player.user?._id === userId ? 1.5 : 0,
                                    borderColor: player.user?._id === userId ? '#4CAF50' : 'transparent',
                                    padding: player.user?._id === userId ? 2 : 0,
                                  }}>
                                    <Avatar
                                      name={player.user?.name}
                                      surname={player.user?.surname}
                                      avatarUrl={player.user?.avatarUrl}
                                      size={36}
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
                    );
                  } else if (isBeachVolley && teamSize === 3) {
                    // Due sopra, uno sotto centrato
                    return (
                      <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 4, paddingHorizontal: 18 }}>
                          {Array(2).fill(null).map((_, idx) => {
                            const player = teamAPlayers[idx];
                            const hasPlayer = idx < teamAPlayers.length;
                            return (
                              <View
                                key={`teamA-${idx}`}
                                style={[
                                  styles.openMatchTeamSlot,
                                  hasPlayer ? styles.openMatchSlotFilled : styles.openMatchSlotEmpty,
                                  idx > 0 ? { marginLeft: -4 } : null,
                                ]}
                              >
                                {hasPlayer && player?.user ? (
                                  <Pressable onPress={() => openUserProfile(player.user?._id)}>
                                    <View style={{
                                      borderRadius: 20,
                                      borderWidth: player.user?._id === userId ? 1.5 : 0,
                                      borderColor: player.user?._id === userId ? '#4CAF50' : 'transparent',
                                      padding: player.user?._id === userId ? 2 : 0,
                                    }}>
                                      <Avatar
                                        name={player.user?.name}
                                        surname={player.user?.surname}
                                        avatarUrl={player.user?.avatarUrl}
                                        size={32}
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
                        <View style={{ flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 18 }}>
                          <View style={styles.openMatchTeamSlot}>
                            {teamAPlayers[2]?.user ? (
                              <Pressable onPress={() => openUserProfile(teamAPlayers[2].user?._id)}>
                                <View style={{
                                  borderRadius: 20,
                                  borderWidth: teamAPlayers[2].user?._id === userId ? 2.5 : 0,
                                  borderColor: teamAPlayers[2].user?._id === userId ? '#4CAF50' : 'transparent',
                                  padding: teamAPlayers[2].user?._id === userId ? 2 : 0,
                                }}>
                                  <Avatar
                                    name={teamAPlayers[2].user?.name}
                                    surname={teamAPlayers[2].user?.surname}
                                    avatarUrl={teamAPlayers[2].user?.avatarUrl}
                                    size={32}
                                    backgroundColor="#E3F2FD"
                                    textColor="#333"
                                  />
                                </View>
                              </Pressable>
                            ) : (
                              <Ionicons name="person-outline" size={12} color="#ccc" />
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  } else if (isBeachVolley && teamSize === 4) {
                    // Due righe da 2
                    return [0, 1].map(row => (
                      <View key={row} style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: row === 0 ? 4 : 0, paddingHorizontal: 18 }}>
                        {Array(2).fill(null).map((_, col) => {
                          const idx = row * 2 + col;
                          const player = teamAPlayers[idx];
                          const hasPlayer = idx < teamAPlayers.length;
                          return (
                            <View
                              key={`teamA-${idx}`}
                              style={[
                                styles.openMatchTeamSlot,
                                hasPlayer ? styles.openMatchSlotFilled : styles.openMatchSlotEmpty,
                                col > 0 ? { marginLeft: -4 } : null,
                              ]}
                            >
                              {hasPlayer && player?.user ? (
                                <Pressable onPress={() => openUserProfile(player.user?._id)}>
                                  <View style={{
                                    borderRadius: 20,
                                    borderWidth: player.user?._id === userId ? 1.5 : 0,
                                    borderColor: player.user?._id === userId ? '#4CAF50' : 'transparent',
                                    padding: player.user?._id === userId ? 2 : 0,
                                  }}>
                                    <Avatar
                                      name={player.user?.name}
                                      surname={player.user?.surname}
                                      avatarUrl={player.user?.avatarUrl}
                                      size={32}
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
                    ));
                  } else {
                    // Default: due righe da 4
                    return [0, 1].map(row => (
                      <View key={row} style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: row === 0 ? 4 : 0, paddingHorizontal: 18 }}>
                        {Array(4).fill(null).map((_, col) => {
                          const index = row * 4 + col;
                          const player = teamAPlayers[index];
                          const hasPlayer = index < teamAPlayers.length;
                          return (
                            <View
                              key={`teamA-${index}`}
                              style={[
                                styles.openMatchTeamSlot,
                                hasPlayer ? styles.openMatchSlotFilled : styles.openMatchSlotEmpty,
                                col > 0 ? { marginLeft: -10 } : null,
                              ]}
                            >
                              {hasPlayer && player?.user ? (
                                <Pressable onPress={() => openUserProfile(player.user?._id)}>
                                  <View style={{
                                    borderRadius: 20,
                                    borderWidth: player.user?._id === userId ? 1.5 : 0,
                                    borderColor: player.user?._id === userId ? '#4CAF50' : 'transparent',
                                    padding: player.user?._id === userId ? 2 : 0,
                                  }}>
                                    <Avatar
                                      name={player.user?.name}
                                      surname={player.user?.surname}
                                      avatarUrl={player.user?.avatarUrl}
                                      size={32}
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
                    ));
                  }
                })()}
              </View>
            </View>

            {/* Score */}
            <View style={styles.matchScoreMainContainer}>
              {match.score?.sets && match.score.sets.length > 0 && (
                <View style={{ flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  {match.score.sets.map((set: any, idx: number) => {
                    const teamAWon = set.teamA > set.teamB;
                    const teamBWon = set.teamB > set.teamA;
                    return (
                      <View key={idx} style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        gap: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor: '#F5F5F5',
                        borderRadius: 12,
                      }}>
                        <Text style={{ 
                          fontSize: 9, 
                          fontWeight: '700', 
                          color: '#999',
                          letterSpacing: 0.5,
                          textTransform: 'uppercase'
                        }}>
                          Set {idx + 1}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: teamAWon ? '#2196F3' : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: teamAWon ? 0 : 2,
                            borderColor: '#2196F3',
                          }}>
                            <Text style={{ 
                              fontSize: 14, 
                              fontWeight: '800', 
                              color: teamAWon ? '#FFFFFF' : '#2196F3'
                            }}>
                              {set.teamA}
                            </Text>
                          </View>
                          <Text style={{ 
                            fontSize: 14, 
                            fontWeight: '600', 
                            color: '#ccc' 
                          }}>
                            -
                          </Text>
                          <View style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: teamBWon ? '#F44336' : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: teamBWon ? 0 : 2,
                            borderColor: '#F44336',
                          }}>
                            <Text style={{ 
                              fontSize: 14, 
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
              )}
            </View>

            {/* Team B */}
            <View style={styles.matchTeamSection}>
              <View style={[styles.matchTeamLabelContainer, { backgroundColor: '#F44336' }]}> 
                <Text style={[styles.matchTeamLabel, { color: '#fff' }]}> 
                  TEAM B
                </Text>
              </View>
              <View style={[styles.openMatchTeamSlots, { flexWrap: 'wrap', height: undefined }]}> 
                {(() => {
                  const sport = match.booking?.sport || match.booking?.campo?.sport || '';
                  const lowerSport = sport.toLowerCase();
                  const isBeachVolley = lowerSport.includes('beach') && lowerSport.includes('volley');
                  const teamSize = teamBPlayers.length;
                  if (isBeachVolley && teamSize === 2) {
                    // Una colonna
                    return (
                      <View style={{ flexDirection: 'column' }}>
                        {Array(2).fill(null).map((_, idx) => {
                          const player = teamBPlayers[idx];
                          const hasPlayer = idx < teamBPlayers.length;
                          return (
                            <View
                              key={`teamB-${idx}`}
                              style={[
                                styles.openMatchTeamSlot,
                                hasPlayer ? styles.openMatchSlotFilled : styles.openMatchSlotEmpty,
                                idx > 0 ? { marginTop: 8 } : null,
                              ]}
                            >
                              {hasPlayer && player?.user ? (
                                <Pressable onPress={() => openUserProfile(player.user?._id)}>
                                  <View style={{
                                    borderRadius: 20,
                                    borderWidth: player.user?._id === userId ? 2.5 : 0,
                                    borderColor: player.user?._id === userId ? '#4CAF50' : 'transparent',
                                    padding: player.user?._id === userId ? 2 : 0,
                                  }}>
                                    <Avatar
                                      name={player.user?.name}
                                      surname={player.user?.surname}
                                      avatarUrl={player.user?.avatarUrl}
                                      size={36}
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
                    );
                  } else if (isBeachVolley && teamSize === 3) {
                    // Due sopra, uno sotto centrato
                    return (
                      <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 4, paddingHorizontal: 18 }}>
                          {Array(2).fill(null).map((_, idx) => {
                            const player = teamBPlayers[idx];
                            const hasPlayer = idx < teamBPlayers.length;
                            return (
                              <View
                                key={`teamB-${idx}`}
                                style={[
                                  styles.openMatchTeamSlot,
                                  hasPlayer ? styles.openMatchSlotFilled : styles.openMatchSlotEmpty,
                                  idx > 0 ? { marginLeft: -4 } : null,
                                ]}
                              >
                                {hasPlayer && player?.user ? (
                                  <Pressable onPress={() => openUserProfile(player.user?._id)}>
                                    <View style={{
                                      borderRadius: 20,
                                      borderWidth: player.user?._id === userId ? 1.5 : 0,
                                      borderColor: player.user?._id === userId ? '#4CAF50' : 'transparent',
                                      padding: player.user?._id === userId ? 2 : 0,
                                    }}>
                                      <Avatar
                                        name={player.user?.name}
                                        surname={player.user?.surname}
                                        avatarUrl={player.user?.avatarUrl}
                                        size={32}
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
                        <View style={{ flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 18 }}>
                          <View style={styles.openMatchTeamSlot}>
                            {teamBPlayers[2]?.user ? (
                              <Pressable onPress={() => openUserProfile(teamBPlayers[2].user?._id)}>
                                <View style={{
                                  borderRadius: 20,
                                  borderWidth: teamBPlayers[2].user?._id === userId ? 2.5 : 0,
                                  borderColor: teamBPlayers[2].user?._id === userId ? '#4CAF50' : 'transparent',
                                  padding: teamBPlayers[2].user?._id === userId ? 2 : 0,
                                }}>
                                  <Avatar
                                    name={teamBPlayers[2].user?.name}
                                    surname={teamBPlayers[2].user?.surname}
                                    avatarUrl={teamBPlayers[2].user?.avatarUrl}
                                    size={32}
                                    backgroundColor="#FFEBEE"
                                    textColor="#333"
                                  />
                                </View>
                              </Pressable>
                            ) : (
                              <Ionicons name="person-outline" size={12} color="#ccc" />
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  } else if (isBeachVolley && teamSize === 4) {
                    // Due righe da 2
                    return [0, 1].map(row => (
                      <View key={row} style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: row === 0 ? 4 : 0, paddingHorizontal: 18 }}>
                        {Array(2).fill(null).map((_, col) => {
                          const idx = row * 2 + col;
                          const player = teamBPlayers[idx];
                          const hasPlayer = idx < teamBPlayers.length;
                          return (
                            <View
                              key={`teamB-${idx}`}
                              style={[
                                styles.openMatchTeamSlot,
                                hasPlayer ? styles.openMatchSlotFilled : styles.openMatchSlotEmpty,
                                col > 0 ? { marginLeft: -4 } : null,
                              ]}
                            >
                              {hasPlayer && player?.user ? (
                                <Pressable onPress={() => openUserProfile(player.user?._id)}>
                                  <View style={{
                                    borderRadius: 20,
                                    borderWidth: player.user?._id === userId ? 1.5 : 0,
                                    borderColor: player.user?._id === userId ? '#4CAF50' : 'transparent',
                                    padding: player.user?._id === userId ? 2 : 0,
                                  }}>
                                    <Avatar
                                      name={player.user?.name}
                                      surname={player.user?.surname}
                                      avatarUrl={player.user?.avatarUrl}
                                      size={32}
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
                    ));
                  } else {
                    // Default: due righe da 4
                    return [0, 1].map(row => (
                      <View key={row} style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: row === 0 ? 4 : 0, paddingHorizontal: 18 }}>
                        {Array(4).fill(null).map((_, col) => {
                          const index = row * 4 + col;
                          const player = teamBPlayers[index];
                          const hasPlayer = index < teamBPlayers.length;
                          return (
                            <View
                              key={`teamB-${index}`}
                              style={[
                                styles.openMatchTeamSlot,
                                hasPlayer ? styles.openMatchSlotFilled : styles.openMatchSlotEmpty,
                                col > 0 ? { marginLeft: -10 } : null,
                              ]}
                            >
                              {hasPlayer && player?.user ? (
                                <Pressable onPress={() => openUserProfile(player.user?._id)}>
                                  <View style={{
                                    borderRadius: 20,
                                    borderWidth: player.user?._id === userId ? 1.5 : 0,
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
                    ));
                  }
                })()}
              </View>
            </View>
          </View>

          {/* Footer with location */}
          <View style={styles.matchCardFooter}>
            <View style={styles.matchLocationContainer}>
              <Ionicons name="location" size={14} color="#2196F3" />
              <Text style={styles.matchLocationText} numberOfLines={1}>
                {match.booking?.campo?.struttura?.name || 'Struttura'}
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