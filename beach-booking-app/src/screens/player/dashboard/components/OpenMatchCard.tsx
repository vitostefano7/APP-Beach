import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../../../components/Avatar/Avatar';
import SportIcon from '../../../../components/SportIcon';
import { styles } from '../styles';

interface OpenMatchCardProps {
  match: any;
  onPress: () => void;
}

const getPlayersCount = (players: any[], status?: 'pending' | 'confirmed') => {
  if (!players || players.length === 0) return 0;
  if (!status) return players.length;
  return players.filter((player) => player.status === status).length;
};

const OpenMatchCard: React.FC<OpenMatchCardProps> = ({ match, onPress }) => {
  const confirmedPlayers = getPlayersCount(match.players, 'confirmed');
  const maxPlayers = match.maxPlayers || 0;
  const available = Math.max(maxPlayers - confirmedPlayers, 0);
  const maxPerTeam = maxPlayers > 0 ? Math.ceil(maxPlayers / 2) : 0;
  const teamAPlayers = match.players?.filter((player: any) => player.team === 'A' && player.status === 'confirmed') || [];
  const teamBPlayers = match.players?.filter((player: any) => player.team === 'B' && player.status === 'confirmed') || [];

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

  // Calculate duration between start and end time
  const getDuration = (startTime: string, endTime: string) => {
    const startParts = startTime.split(':');
    const endParts = endTime.split(':');
    const startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
    const endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
    const diff = endMin - startMin;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Calculate time left until registration closes (assuming 24 hours before match start)
  // Calculate time left until registration closes (now 45 minutes before match start)
  const getTimeLeft = () => {
    const matchStart = new Date(`${match.booking?.date}T${match.booking?.startTime}:00`);
    const registrationDeadline = new Date(matchStart.getTime() - 45 * 60 * 1000); // 45 minutes before
    const now = new Date();
    const diff = registrationDeadline.getTime() - now.getTime();
    if (diff <= 0) return { text: 'Chiuso', color: '#ff0000' };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const totalHours = hours + minutes / 60;
    let color = '#666';
    if (totalHours <= 3) {
      color = '#ff0000'; // red
    } else {
      color = '#ffcc00'; // yellow
    }
    let text;
    if (hours > 0) text = `${hours}h ${minutes}m`;
    else text = `${minutes}m`;
    return { text, color };
  };

  const { text: timeLeftText, color: iconColor } = getTimeLeft();

  return (
    <Pressable style={styles.openMatchCard} onPress={onPress}>
      <View style={styles.openMatchHeader}>
        <View style={styles.openMatchTitleRow}>
          <Text style={styles.openMatchTitle} numberOfLines={1}>
            {match.booking?.campo?.struttura?.name || 'Struttura'}
          </Text>
          <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
            <View style={styles.openMatchBadge}>
              <Text style={styles.openMatchBadgeText}>{available} {available === 1 ? 'posto' : 'posti'}</Text>
            </View>
            {match.booking?.endTime && (
              <View style={[styles.openMatchTimeLabel, { backgroundColor: iconColor }]}>
                <Ionicons name="hourglass-outline" size={12} color="#fff" style={{ marginRight: 4 }} />
                <Text style={[styles.openMatchTimeLabelText, { color: '#fff' }]}>{timeLeftText}</Text>
              </View>
            )}
          </View>
        </View>
        {match.booking?.campo?.struttura?.location?.address && (
          <Text style={styles.openMatchSubtitle} numberOfLines={1}>
            {match.booking.campo.struttura.location.address}, {match.booking.campo.struttura.location.city}
          </Text>
        )}
      </View>

      <View style={styles.openMatchInfo}>
        <View style={styles.openMatchInfoRow}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.openMatchInfoText}>
            {match.booking?.date ? new Date(match.booking.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Data da definire'}
          </Text>
        </View>
        <View style={styles.openMatchInfoRow}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.openMatchInfoText}>
            {match.booking?.startTime || '--:--'}
            {match.booking?.endTime ? `-${match.booking.endTime}` : ''}
          </Text>
        </View>
        <View style={styles.openMatchInfoRow}>
          <SportIcon sport={match.booking?.sport || 'beach_volleyball'} size={14} color="#2196F3" />
          <Text style={[styles.openMatchInfoText, { color: '#2196F3', fontWeight: '600' }]}>
            {formatSportName(match.booking?.sport || 'beach_volleyball')}
          </Text>
        </View>
      </View>

      {/* Visualizzazione Team Grafica */}
      {maxPlayers > 2 && (
        <View style={styles.openMatchTeams}>
          {/* Team A */}
          <View style={styles.openMatchTeamContainer}>
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
                      <Avatar
                        name={player.user.name}
                        surname={player.user.surname}
                        avatarUrl={player.user.avatarUrl}
                        size={24}
                        backgroundColor="#E3F2FD"
                        textColor="#333"
                      />
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
          <View style={styles.openMatchTeamContainer}>
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
                      <Avatar
                        name={player.user.name}
                        surname={player.user.surname}
                        avatarUrl={player.user.avatarUrl}
                        size={24}
                        backgroundColor="#FFEBEE"
                        textColor="#333"
                      />
                    ) : (
                      <Ionicons name="person-outline" size={12} color="#ccc" />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
};

export default OpenMatchCard;
