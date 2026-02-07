import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../Avatar';

// Import centralized components
import {
  AnimatedButton,
  FadeInView,
  ScaleInView,
  TeamAGradient,
  TeamBGradient,
  WinnerGradient,
} from './AnimatedComponents';

interface Set {
  teamA: number;
  teamB: number;
}

interface Player {
  user: {
    _id: string;
    name: string;
    surname: string;
  };
  team?: 'A' | 'B';
  status: string;
}

interface ScoreDisplayProps {
  score: {
    winner?: 'A' | 'B';
    sets: Set[];
  };
  isInMatch: boolean;
  onEdit: () => void;
  matchStatus: string;
  teamAPlayers?: Player[];
  teamBPlayers?: Player[];
  showEditLabel?: boolean;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  isInMatch,
  onEdit,
  matchStatus,
  teamAPlayers = [],
  teamBPlayers = [],
  showEditLabel = false,
}) => {
  if (!score || score.sets.length === 0) {
    return null;
  }

  const getSetSummary = () => {
    let teamAWins = 0;
    let teamBWins = 0;

    score.sets.forEach(set => {
      if (set.teamA > set.teamB) teamAWins++;
      else if (set.teamB > set.teamA) teamBWins++;
    });

    return { teamAWins, teamBWins };
  };


  const { teamAWins, teamBWins } = getSetSummary();
  // Usa showEditLabel se fornito, altrimenti usa la logica di default
  const canEdit = showEditLabel !== undefined ? showEditLabel : (isInMatch && matchStatus !== "cancelled");

  // Filtra solo i set compilati (con almeno un punteggio > 0)
  const compiledSets = score.sets.filter(set => set.teamA > 0 || set.teamB > 0);

  return (
    <FadeInView delay={0}>
      <View style={{
        backgroundColor: 'white',
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          android: {
            elevation: 3,
          },
        }),
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <ScaleInView delay={100}>
              <Ionicons name="trophy" size={28} color="#FFD700" />
            </ScaleInView>
            <View>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#1a1a1a',
                marginBottom: 2,
              }}>Risultato Match</Text>
              <Text style={{
                fontSize: 14,
                color: '#666',
              }}>
                {compiledSets.length} set giocati
              </Text>
            </View>
          </View>
          {canEdit && (
            <AnimatedButton style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: '#f0f8ff',
            }} onPress={onEdit}>
              <Ionicons name="create-outline" size={20} color="#2196F3" />
            </AnimatedButton>
          )}
        </View>

        {/* Main Score Display con gradients */}
        <FadeInView delay={200}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <TeamAGradient
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginBottom: 8,
                  ...(score.winner === 'A' && {
                    borderWidth: 2,
                    borderColor: '#FFD700',
                  }),
                }}
              >
                {score.winner === 'A' && (
                  <Ionicons name="trophy" size={14} color="white" />
                )}
                <Text style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: 14,
                }}>Team A</Text>
              </TeamAGradient>

              <Text style={{
                fontSize: 32,
                fontWeight: '700',
                color: score.winner === 'A' ? '#2196F3' : '#1a1a1a',
                marginBottom: 4,
              }}>
                {teamAWins}
              </Text>
              {score.winner === 'A' && (
                <ScaleInView delay={300}>
                  <Text style={{
                    fontSize: 12,
                    color: '#2196F3',
                    fontWeight: '600',
                  }}>Vincitore</Text>
                </ScaleInView>
              )}
            </View>

            <View style={{
              alignItems: 'center',
              paddingHorizontal: 20,
            }}>
              <Ionicons name="remove" size={28} color="#999" />
            </View>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <TeamBGradient
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginBottom: 8,
                  ...(score.winner === 'B' && {
                    borderWidth: 2,
                    borderColor: '#FFD700',
                  }),
                }}
              >
                {score.winner === 'B' && (
                  <Ionicons name="trophy" size={14} color="white" />
                )}
                <Text style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: 14,
                }}>Team B</Text>
              </TeamBGradient>

              <Text style={{
                fontSize: 32,
                fontWeight: '700',
                color: score.winner === 'B' ? '#F44336' : '#1a1a1a',
                marginBottom: 4,
              }}>
                {teamBWins}
              </Text>
              {score.winner === 'B' && (
                <ScaleInView delay={300}>
                  <Text style={{
                    fontSize: 12,
                    color: '#F44336',
                    fontWeight: '600',
                  }}>Vincitore</Text>
                </ScaleInView>
              )}
            </View>
          </View>
        </FadeInView>

        {/* Winner Banner */}
        {score.winner && (
          <ScaleInView delay={400}>
            <WinnerGradient style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              gap: 8,
            }}>
              <Ionicons name="trophy" size={16} color="white" />
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 14,
              }}>
                Team {score.winner} ha vinto il match!
              </Text>
            </WinnerGradient>
          </ScaleInView>
        )}

        {/* Sets Detail */}
        <FadeInView delay={500}>
          <View>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#1a1a1a',
              marginBottom: 12,
            }}>Dettaglio Set</Text>
            <View style={{ gap: 8 }}>
              {score.sets
                .filter(set => set.teamA > 0 || set.teamB > 0) // Mostra solo set compilati
                .map((set, index) => {
                const winner = set.teamA > set.teamB ? 'A' : set.teamB > set.teamA ? 'B' : null;

                return (
                  <FadeInView key={index} delay={600 + index * 50}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      backgroundColor: '#f8f9fa',
                      borderRadius: 8,
                    }}>
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#666',
                        width: 60,
                      }}>Set {index + 1}</Text>

                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}>
                        <Text style={{
                          fontSize: 18,
                          fontWeight: '700',
                          color: winner === 'A' ? '#2196F3' : '#666',
                        }}>
                          {set.teamA}
                        </Text>
                        <Text style={{
                          fontSize: 16,
                          color: '#999',
                        }}>-</Text>
                        <Text style={{
                          fontSize: 18,
                          fontWeight: '700',
                          color: winner === 'B' ? '#F44336' : '#666',
                        }}>
                          {set.teamB}
                        </Text>
                      </View>

                      <View style={{
                        width: 30,
                        alignItems: 'center',
                      }}>
                        {winner === 'A' && (
                          <View style={{
                            backgroundColor: '#E3F2FD',
                            borderRadius: 12,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                          }}>
                            <Text style={{
                              color: '#2196F3',
                              fontWeight: '700',
                              fontSize: 12,
                            }}>A</Text>
                          </View>
                        )}
                        {winner === 'B' && (
                          <View style={{
                            backgroundColor: '#FFEBEE',
                            borderRadius: 12,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                          }}>
                            <Text style={{
                              color: '#F44336',
                              fontWeight: '700',
                              fontSize: 12,
                            }}>B</Text>
                          </View>
                        )}
                        {!winner && (
                          <Text style={{
                            color: '#999',
                            fontSize: 14,
                          }}>-</Text>
                        )}
                      </View>
                    </View>
                  </FadeInView>
                );
              })}
            </View>
          </View>
        </FadeInView>
      </View>
    </FadeInView>
  );
};

export default ScoreDisplay;