import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Avatar from '../../../../components/Avatar/Avatar';
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

  // Get sport icon
  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'beach_volleyball':
        return 'volleyball-ball';
      case 'volleyball':
        return 'volleyball-ball';
      case 'padel':
        return 'tennisball';
      case 'tennis':
        return 'tennisball';
      default:
        return 'football';
    }
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
    <Pressable style={styles.openMatchCard} onPress={onPress}>
      <View style={styles.openMatchHeader}>
        <View style={styles.openMatchTitleRow}>
          <Text style={styles.openMatchTitle} numberOfLines={1}>
            {match.booking?.campo?.struttura?.name || 'Struttura'}
          </Text>
          <View style={styles.openMatchBadge}>
            <Text style={styles.openMatchBadgeText}>{available} {available === 1 ? 'posto' : 'posti'}</Text>
          </View>
        </View>
        {match.booking?.campo?.struttura?.location?.city && (
          <Text style={styles.openMatchSubtitle} numberOfLines={1}>
            {match.booking.campo.struttura.location.city}
          </Text>
        )}
      </View>

      <View style={styles.openMatchInfo}>
        <View style={styles.openMatchInfoRow}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.openMatchInfoText}>
            {match.booking?.date || 'Data da definire'}
          </Text>
        </View>
        <View style={styles.openMatchInfoRow}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.openMatchInfoText}>
            {match.booking?.startTime || '--:--'}
          </Text>
        </View>
        <View style={styles.openMatchInfoRow}>
          {(match.booking?.sport === 'beach_volleyball' || match.booking?.sport === 'volleyball') ? (
            <FontAwesome5 name="volleyball-ball" size={14} color="#2196F3" />
          ) : (
            <Ionicons name={getSportIcon(match.booking?.sport || 'beach_volleyball')} size={14} color="#2196F3" />
          )}
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
              <Ionicons name="shield" size={12} color="white" />
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
