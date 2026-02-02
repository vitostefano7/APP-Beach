import React from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlayerCardWithTeam from '../../screens/player/prenotazioni/DettaglioPrenotazione/components/DettaglioPrenotazione.components';
import ScoreDisplay from '../../screens/player/prenotazioni/DettaglioPrenotazione/components/ScoreDisplay';
import { AnimatedCard, AnimatedButton, FadeInView, SlideInView, ScaleInView } from '../../screens/player/prenotazioni/DettaglioPrenotazione/components/AnimatedComponents';
import { TeamAGradient, TeamBGradient, WinnerGradient } from '../../screens/player/prenotazioni/DettaglioPrenotazione/components/GradientComponents';
import { getTeamFormationLabel } from '../../utils';
import styles from '../../screens/player/prenotazioni/DettaglioPrenotazione/styles/DettaglioPrenotazione.styles';

interface MatchSectionProps {
  booking: any;
  user: any;
  confirmedPlayers: any[];
  pendingPlayers: any[];
  maxPlayersPerTeam: number;
  teamAConfirmed: any[];
  teamBConfirmed: any[];
  unassignedPlayers: any[];
  teamAPlayers: number;
  teamBPlayers: number;
  getMatchStatus: () => string;
  getMatchStatusInfo: () => { color: string; text: string; icon: string };
  getTimeUntilRegistrationDeadline: () => string | null;
  isMatchPassed: () => boolean;
  handleOpenGroupChat: () => void;
  loadingGroupChat: boolean;
  handleRemovePlayer: (playerUserId: string) => void;
  handleInviteToTeam: (team: "A" | "B", slotNumber: number) => void;
  setScoreModalVisible: (visible: boolean) => void;
  role: 'player' | 'owner';
}

const MatchSection: React.FC<MatchSectionProps> = ({
  booking,
  user,
  confirmedPlayers,
  pendingPlayers,
  maxPlayersPerTeam,
  teamAConfirmed,
  teamBConfirmed,
  unassignedPlayers,
  teamAPlayers,
  teamBPlayers,
  getMatchStatus,
  getMatchStatusInfo,
  getTimeUntilRegistrationDeadline,
  isMatchPassed,
  handleOpenGroupChat,
  loadingGroupChat,
  handleRemovePlayer,
  handleInviteToTeam,
  setScoreModalVisible,
  role,
}) => {
  return (
    <AnimatedCard delay={200}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <FadeInView delay={300}>
          <Text style={styles.cardTitle}>Match Details</Text>
        </FadeInView>

        <View style={styles.matchHeaderActions}>
          <AnimatedButton
            style={styles.groupChatButton}
            onPress={handleOpenGroupChat}
            disabled={loadingGroupChat}
          >
            {loadingGroupChat ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="chatbubbles" size={18} color="white" />
                <Text style={styles.groupChatButtonText}>Chat Partita</Text>
              </>
            )}
          </AnimatedButton>
        </View>
      </View>

      {/* Match Status */}
      <FadeInView delay={400}>
        <View style={styles.matchStatusCard}>
          <View style={styles.matchStatusRow}>
            <View style={styles.matchStatusLeft}>
              <View style={[styles.matchStatusIcon, { backgroundColor: getMatchStatusInfo().color + '20' }]}>
                <Ionicons name={getMatchStatusInfo().icon} size={16} color={getMatchStatusInfo().color} />
              </View>
              <Text style={styles.matchStatusTitle}>Stato Partita</Text>
            </View>
            <View style={[
              styles.matchStatusBadge,
              booking.match.status === "completed" && styles.matchStatusCompleted,
              booking.match.status === "open" && styles.matchStatusOpen,
              booking.match.status === "full" && styles.matchStatusFull,
              booking.match.status === "cancelled" && styles.matchStatusCancelled,
              getMatchStatus() === "in_progress" && styles.matchStatusInProgress,
            ]}>
              <Text style={styles.matchStatusText}>{getMatchStatusInfo().text}</Text>
            </View>
          </View>

          <View style={styles.matchStatsCompact}>
            <View style={styles.matchStatItem}>
              <View style={[styles.matchStatIcon, { backgroundColor: '#E8F5E920' }]}>
                <Ionicons name="people" size={12} color="#4CAF50" />
              </View>
              <Text style={styles.matchStatText}>{confirmedPlayers.length}/{booking.match.maxPlayers}</Text>
            </View>

            {pendingPlayers.length > 0 && (
              <View style={styles.matchStatItem}>
                <View style={[styles.matchStatIcon, { backgroundColor: '#FFF3E020' }]}>
                  <Ionicons name="time" size={12} color="#FF9800" />
                </View>
                <Text style={styles.matchStatText}>{pendingPlayers.length}</Text>
              </View>
            )}

            <View style={styles.matchStatItem}>
              <View style={[styles.matchStatIcon, { backgroundColor: '#2196F320' }]}>
                <Ionicons name="hourglass" size={12} color="#2196F3" />
              </View>
              <View>
                <Text style={[styles.matchStatText, { fontSize: 10, color: '#666', marginBottom: 2 }]}>
                  Chiusura prenotazione
                </Text>
                <Text style={styles.matchStatText}>
                  {getTimeUntilRegistrationDeadline() || 'Chiusa'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </FadeInView>

      {/* Score Display */}
      {booking.match.score && booking.match.score.sets.length > 0 && (
        <FadeInView delay={600}>
          <ScoreDisplay
            score={booking.match.score}
            isInMatch={true}
            onEdit={() => setScoreModalVisible(true)}
            matchStatus={getMatchStatus()}
            teamAPlayers={teamAConfirmed}
            teamBPlayers={teamBConfirmed}
            showEditLabel={role === 'owner' && getMatchStatus() !== 'cancelled'}
          />
        </FadeInView>
      )}

      {/* Score Actions - Owner can insert result */}
      {(
        role === 'owner' &&
        isMatchPassed() &&
        getMatchStatus() !== 'cancelled' &&
        (!booking.match.score || booking.match.score.sets.length === 0) &&
        (teamAConfirmed.length === maxPlayersPerTeam && teamBConfirmed.length === maxPlayersPerTeam)
      ) && (
        <FadeInView delay={700}>
          <View style={{ padding: 10, alignItems: 'center' }}>
            <AnimatedButton onPress={() => {
              if (unassignedPlayers.length > 0) {
                Alert.alert('Giocatori non assegnati', 'Assegna tutti i giocatori ai team prima di inserire il risultato');
                return;
              }
              setScoreModalVisible(true);
            }}>
              <WinnerGradient style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="trophy" size={20} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: '700', marginLeft: 8 }}>Inserisci risultato</Text>
              </WinnerGradient>
            </AnimatedButton>
          </View>
        </FadeInView>
      )}

      {/* Teams Section */}
      {confirmedPlayers.length > 0 && (
        <SlideInView delay={800} from="bottom">
          <View style={styles.teamsContainer}>
            {/* Team A */}
            <View style={styles.teamSection}>
              <TeamAGradient style={styles.teamHeader}>
                <Ionicons name="people-circle" size={20} color="white" />
                <Text style={[styles.teamTitle, { color: "white" }]}>
                  Team A ({getTeamFormationLabel(booking?.match?.maxPlayers || 4)})
                </Text>
                <View style={styles.teamHeaderRight}>
                  <Text style={[styles.teamCount, { color: "white" }]}>
                    {teamAConfirmed.length}/{maxPlayersPerTeam}
                  </Text>
                  {teamAConfirmed.length === maxPlayersPerTeam && (
                    <ScaleInView delay={900}>
                      <Ionicons name="checkmark-circle" size={16} color="white" />
                    </ScaleInView>
                  )}
                </View>
              </TeamAGradient>

              <View style={styles.teamSlotsContainer}>
                {Array(maxPlayersPerTeam).fill(null).map((_, index) => {
                  const player = teamAConfirmed[index];
                  const slotNumber = index + 1;

                  return (
                    <FadeInView key={`teamA-slot-${slotNumber}`} delay={1000 + index * 50}>
                      <PlayerCardWithTeam
                        player={player}
                        isCreator={role === 'owner'}
                        currentUserId={undefined}
                        onRemove={() => player ? handleRemovePlayer(player.user._id) : undefined}
                        onChangeTeam={() => {}}
                        onLeave={() => {}}
                        currentTeam="A"
                        isEmptySlot={!player}
                        onInviteToSlot={!player ? () => handleInviteToTeam("A", slotNumber) : undefined}
                        slotNumber={slotNumber}
                        matchStatus={getMatchStatus()}
                        isOrganizer={player?.user?._id === booking.match?.createdBy?._id}
                        teamACount={teamAPlayers}
                        teamBCount={teamBPlayers}
                        maxPlayersPerTeam={maxPlayersPerTeam}
                      />
                    </FadeInView>
                  );
                })}
              </View>
            </View>

            {/* Team B */}
            <View style={styles.teamSection}>
              <TeamBGradient style={styles.teamHeader}>
                <Ionicons name="people" size={20} color="white" />
                <Text style={[styles.teamTitle, { color: "white" }]}>
                  Team B ({getTeamFormationLabel(booking?.match?.maxPlayers || 4)})
                </Text>
                <View style={styles.teamHeaderRight}>
                  <Text style={[styles.teamCount, { color: "white" }]}>
                    {teamBConfirmed.length}/{maxPlayersPerTeam}
                  </Text>
                  {teamBConfirmed.length === maxPlayersPerTeam && (
                    <ScaleInView delay={900}>
                      <Ionicons name="checkmark-circle" size={16} color="white" />
                    </ScaleInView>
                  )}
                </View>
              </TeamBGradient>

              <View style={styles.teamSlotsContainer}>
                {Array(maxPlayersPerTeam).fill(null).map((_, index) => {
                  const player = teamBConfirmed[index];
                  const slotNumber = index + 1;

                  return (
                    <FadeInView key={`teamB-slot-${slotNumber}`} delay={1000 + index * 50}>
                      <PlayerCardWithTeam
                        player={player}
                        isCreator={role === 'owner'}
                        currentUserId={undefined}
                        onRemove={() => player ? handleRemovePlayer(player.user._id) : undefined}
                        onChangeTeam={() => {}}
                        onLeave={() => {}}
                        currentTeam="B"
                        isEmptySlot={!player}
                        onInviteToSlot={!player ? () => handleInviteToTeam("B", slotNumber) : undefined}
                        slotNumber={slotNumber}
                        matchStatus={getMatchStatus()}
                        isOrganizer={player?.user?._id === booking.match?.createdBy?._id}
                        teamACount={teamAPlayers}
                        teamBCount={teamBPlayers}
                        maxPlayersPerTeam={maxPlayersPerTeam}
                      />
                    </FadeInView>
                  );
                })}
              </View>
            </View>
          </View>
        </SlideInView>
      )}

      {/* Unassigned Players */}
      {unassignedPlayers.length > 0 && (
        <FadeInView delay={1100}>
          <View style={styles.unassignedSection}>
            <Text style={styles.unassignedTitle}>Giocatori Non Assegnati</Text>
            <Text style={styles.unassignedSubtitle}>
              Assegna questi giocatori ad un team
            </Text>
            <View style={styles.playersGrid}>
              {unassignedPlayers.map((player, index) => (
                <SlideInView key={player.user._id} delay={1200 + index * 50} from="left">
                  <PlayerCardWithTeam
                    player={player}
                    isCreator={role === 'owner'}
                    currentUserId={undefined}
                    onRemove={() => handleRemovePlayer(player.user._id)}
                    onChangeTeam={() => {}}
                    matchStatus={getMatchStatus()}
                    isOrganizer={player?.user?._id === booking.match?.createdBy?._id}
                    teamACount={teamAPlayers}
                    teamBCount={teamBPlayers}
                    maxPlayersPerTeam={maxPlayersPerTeam}
                  />
                </SlideInView>
              ))}
            </View>
          </View>
        </FadeInView>
      )}

      {/* Pending Players */}
      {pendingPlayers.length > 0 && (
        <FadeInView delay={1300}>
          <View style={styles.pendingSection}>
            <Text style={styles.pendingTitle}>In Attesa di Risposta ({pendingPlayers.length})</Text>
            <View style={styles.playersGrid}>
              {pendingPlayers.map((player, index) => (
                <SlideInView key={player.user._id} delay={1400 + index * 50} from="left">
                  <PlayerCardWithTeam
                    player={player}
                    isCreator={role === 'owner'}
                    currentUserId={undefined}
                    onRemove={() => handleRemovePlayer(player.user._id)}
                    onChangeTeam={() => {}}
                    isPending={true}
                    matchStatus={getMatchStatus()}
                    isOrganizer={player?.user?._id === booking.match?.createdBy?._id}
                    teamACount={teamAPlayers}
                    teamBCount={teamBPlayers}
                    maxPlayersPerTeam={maxPlayersPerTeam}
                  />
                </SlideInView>
              ))}
            </View>
          </View>
        </FadeInView>
      )}
    </AnimatedCard>
  );
};

export default MatchSection;