import React from 'react';
import { View, Text, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/DettaglioPrenotazione.styles';

// Import componenti animati e gradients
import {
  AnimatedButton,
  ScaleInView,
  FadeInView,
} from './AnimatedComponents';

import {
  TeamAGradient,
  TeamBGradient,
} from './GradientComponents';

interface TeamSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTeam: (team: 'A' | 'B') => void;
  teamA: {
    current: number;
    max: number;
    players: any[];
  };
  teamB: {
    current: number;
    max: number;
    players: any[];
  };
  matchStatus?: string;
  maxPlayersPerTeam: number;
}

const TeamSelectionModal: React.FC<TeamSelectionModalProps> = ({
  visible,
  onClose,
  onSelectTeam,
  teamA,
  teamB,
  matchStatus,
  maxPlayersPerTeam,
}) => {
  const isTeamAFull = teamA.current >= maxPlayersPerTeam;
  const isTeamBFull = teamB.current >= maxPlayersPerTeam;
  const matchLocked = matchStatus === 'completed' || matchStatus === 'cancelled';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ScaleInView style={styles.teamSelectionModal}>
          {/* Header con animazione */}
          <View style={styles.teamModalHeader}>
            <FadeInView delay={100}>
              <Ionicons name="shirt" size={48} color="#FF9800" />
            </FadeInView>
            <FadeInView delay={200}>
              <Text style={styles.teamModalTitle}>Scegli il Team</Text>
            </FadeInView>
            <FadeInView delay={300}>
              <Text style={styles.teamModalSubtitle}>
                Seleziona la squadra in cui vuoi giocare
              </Text>
            </FadeInView>
          </View>

          <View style={styles.teamModalContent}>
            {/* Team A Option con gradient */}
            <FadeInView delay={400}>
              <AnimatedButton
                style={[
                  styles.teamModalOption,
                  (isTeamAFull || matchLocked) && { opacity: 0.6 },
                ]}
                onPress={() => !isTeamAFull && !matchLocked && onSelectTeam('A')}
                disabled={isTeamAFull || matchLocked}
              >
                <TeamAGradient style={styles.teamModalOption}>
                  <View style={styles.teamModalOptionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Ionicons name="shield" size={32} color="white" />
                      <View style={styles.teamModalOptionInfo}>
                        <Text style={[styles.teamModalOptionTitle, { color: 'white' }]}>Team A</Text>
                        <Text style={[styles.teamModalOptionCount, { color: 'rgba(255,255,255,0.8)' }]}>
                          {teamA.current}/{maxPlayersPerTeam} giocatori
                        </Text>
                      </View>
                    </View>
                    {isTeamAFull ? (
                      <Ionicons name="close-circle" size={24} color="white" />
                    ) : (
                      <Ionicons name="chevron-forward" size={24} color="white" />
                    )}
                  </View>
                  {isTeamAFull && (
                    <Text style={[styles.teamFullText, { color: 'white' }]}>Team completo</Text>
                  )}
                </TeamAGradient>
              </AnimatedButton>
            </FadeInView>

            {/* Team B Option con gradient */}
            <FadeInView delay={500}>
              <AnimatedButton
                style={[
                  styles.teamModalOption,
                  (isTeamBFull || matchLocked) && { opacity: 0.6 },
                ]}
                onPress={() => !isTeamBFull && !matchLocked && onSelectTeam('B')}
                disabled={isTeamBFull || matchLocked}
              >
                <TeamBGradient style={styles.teamModalOption}>
                  <View style={styles.teamModalOptionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Ionicons name="shield" size={32} color="white" />
                      <View style={styles.teamModalOptionInfo}>
                        <Text style={[styles.teamModalOptionTitle, { color: 'white' }]}>Team B</Text>
                        <Text style={[styles.teamModalOptionCount, { color: 'rgba(255,255,255,0.8)' }]}>
                          {teamB.current}/{maxPlayersPerTeam} giocatori
                        </Text>
                      </View>
                    </View>
                    {isTeamBFull ? (
                      <Ionicons name="close-circle" size={24} color="white" />
                    ) : (
                      <Ionicons name="chevron-forward" size={24} color="white" />
                    )}
                  </View>
                  {isTeamBFull && (
                    <Text style={[styles.teamFullText, { color: 'white' }]}>Team completo</Text>
                  )}
                </TeamBGradient>
              </AnimatedButton>
            </FadeInView>
          </View>

          {/* Cancel button */}
          <FadeInView delay={600}>
            <AnimatedButton style={styles.teamModalCancel} onPress={onClose}>
              <Text style={styles.teamModalCancelText}>Annulla</Text>
            </AnimatedButton>
          </FadeInView>
        </ScaleInView>
      </View>
    </Modal>
  );
};

export default TeamSelectionModal;