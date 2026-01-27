import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../../../../components/Avatar';
import styles from '../styles/DettaglioPrenotazione.styles';

// Import componenti animati e gradients
import {
  AnimatedButton,
  FadeInView,
  ScaleInView,
} from './AnimatedComponents';

import {
  TeamAGradient,
  TeamBGradient,
  WinnerGradient,
} from './GradientComponents';

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
      <View style={styles.scoreDisplayCard}>
        {/* Header */}
        <View style={styles.scoreDisplayHeader}>
          <View style={styles.scoreDisplayHeaderLeft}>
            <ScaleInView delay={100}>
              <Ionicons name="trophy" size={28} color="#FFD700" />
            </ScaleInView>
            <View>
              <Text style={styles.scoreDisplayTitle}>Risultato Match</Text>
              <Text style={styles.scoreDisplaySubtitle}>
                {compiledSets.length} set giocati
              </Text>
            </View>
          </View>
          {canEdit && (
            <AnimatedButton style={styles.scoreEditButton} onPress={onEdit}>
              <Ionicons name="create-outline" size={20} color="#2196F3" />
            </AnimatedButton>
          )}
        </View>

        {/* Main Score Display con gradients */}
        <FadeInView delay={200}>
          <View style={styles.scoreMainDisplay}>
            <View style={styles.scoreTeamDisplay}>
              <TeamAGradient
                style={[
                  styles.scoreTeamBadge,
                  score.winner === 'A' && styles.scoreTeamBadgeWinner
                ]}
              >
                {score.winner === 'A' && (
                  <Ionicons name="trophy" size={14} color="white" />
                )}
                <Text style={styles.scoreTeamName}>Team A</Text>
              </TeamAGradient>

              <Text style={[
                styles.scoreTeamScore,
                score.winner === 'A' && styles.scoreTeamScoreWinner
              ]}>
                {teamAWins}
              </Text>
              {score.winner === 'A' && (
                <ScaleInView delay={300}>
                  <Text style={styles.scoreWinnerLabel}>Vincitore</Text>
                </ScaleInView>
              )}
            </View>

            <View style={styles.scoreDivider}>
              <Ionicons name="remove" size={28} color="#999" />
            </View>

            <View style={styles.scoreTeamDisplay}>
              <TeamBGradient
                style={[
                  styles.scoreTeamBadge,
                  score.winner === 'B' && styles.scoreTeamBadgeWinner
                ]}
              >
                {score.winner === 'B' && (
                  <Ionicons name="trophy" size={14} color="white" />
                )}
                <Text style={styles.scoreTeamName}>Team B</Text>
              </TeamBGradient>

              <Text style={[
                styles.scoreTeamScore,
                score.winner === 'B' && styles.scoreTeamScoreWinner
              ]}>
                {teamBWins}
              </Text>
              {score.winner === 'B' && (
                <ScaleInView delay={300}>
                  <Text style={styles.scoreWinnerLabel}>Vincitore</Text>
                </ScaleInView>
              )}
            </View>
          </View>
        </FadeInView>

        {/* Winner Banner */}
        {score.winner && (
          <ScaleInView delay={400}>
            <WinnerGradient style={styles.winnerIndicator}>
              <Ionicons name="trophy" size={16} color="white" />
              <Text style={[styles.winnerIndicatorText, { color: 'white' }]}>
                Team {score.winner} ha vinto il match!
              </Text>
            </WinnerGradient>
          </ScaleInView>
        )}

        {/* Sets Detail */}
        <FadeInView delay={500}>
          <View style={styles.setsDetailContainer}>
            <Text style={styles.setsDetailTitle}>Dettaglio Set</Text>
            <View style={styles.setsDetailList}>
              {score.sets
                .filter(set => set.teamA > 0 || set.teamB > 0) // Mostra solo set compilati
                .map((set, index) => {
                const winner = set.teamA > set.teamB ? 'A' : set.teamB > set.teamA ? 'B' : null;
                
                return (
                  <FadeInView key={index} delay={600 + index * 50}>
                    <View style={styles.setDetailRow}>
                      <Text style={styles.setDetailNumber}>Set {index + 1}</Text>
                      
                      <View style={styles.setDetailScore}>
                        <Text style={[
                          styles.setDetailTeamScore,
                          winner === 'A' && styles.setDetailTeamScoreWinner
                        ]}>
                          {set.teamA}
                        </Text>
                        <Text style={styles.setDetailDivider}>-</Text>
                        <Text style={[
                          styles.setDetailTeamScore,
                          winner === 'B' && styles.setDetailTeamScoreWinner
                        ]}>
                          {set.teamB}
                        </Text>
                      </View>

                      <View style={styles.setDetailWinner}>
                        {winner === 'A' && (
                          <View style={[styles.setDetailWinnerBadge, styles.setDetailWinnerBadgeA]}>
                            <Text style={[styles.setDetailWinnerText, { color: '#2196F3' }]}>A</Text>
                          </View>
                        )}
                        {winner === 'B' && (
                          <View style={[styles.setDetailWinnerBadge, styles.setDetailWinnerBadgeB]}>
                            <Text style={[styles.setDetailWinnerText, { color: '#F44336' }]}>B</Text>
                          </View>
                        )}
                        {!winner && (
                          <Text style={styles.setDetailTieText}>-</Text>
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