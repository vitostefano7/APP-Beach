import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import SportIcon from "../../../../components/SportIcon";
import { styles } from "../styles/OwnerDashboardScreen.styles";

type MatchCardProps = {
  match: {
    _id: string;
    booking: {
      date: string;
      startTime: string;
      endTime: string;
      campo: {
        name: string;
        sport: string | { _id: string; name: string };
        struttura: {
          _id: string;
          name: string;
        };
      };
    };
    createdBy: {
      _id: string;
      name: string;
      surname: string;
      avatarUrl?: string;
    };
    players: Array<{
      user: {
        _id: string;
        name: string;
        avatarUrl?: string;
      };
      team: "A" | "B";
      status: string;
    }>;
    maxPlayers: number;
    isPublic: boolean;
    status: string;
  };
  onPress: () => void;
};

export default function MatchCard({ match, onPress }: MatchCardProps) {
  const { booking, players, maxPlayers, status, isPublic, createdBy } = match;

  const renderTeamAvatars = (
    teamPlayers: Array<{
      user: {
        _id: string;
        name: string;
        avatarUrl?: string;
      };
      team: "A" | "B";
      status: string;
    }>,
    borderColor: string
  ) => {
    if (teamPlayers.length <= 3) {
      return teamPlayers.slice(0, 3).map((player) => (
        <View key={player.user._id} style={[styles.matchPlayerAvatar, { borderColor }]}> 
          {player.user.avatarUrl ? (
            <Image
              source={{ uri: player.user.avatarUrl }}
              style={styles.matchPlayerAvatarImage}
            />
          ) : (
            <View style={styles.matchPlayerAvatarPlaceholder}>
              <Ionicons name="person" size={12} color={borderColor} />
            </View>
          )}
        </View>
      ));
    }

    return [
      ...teamPlayers.slice(0, 2).map((player) => (
        <View key={player.user._id} style={[styles.matchPlayerAvatar, { borderColor }]}> 
          {player.user.avatarUrl ? (
            <Image
              source={{ uri: player.user.avatarUrl }}
              style={styles.matchPlayerAvatarImage}
            />
          ) : (
            <View style={styles.matchPlayerAvatarPlaceholder}>
              <Ionicons name="person" size={12} color={borderColor} />
            </View>
          )}
        </View>
      )),
      <View
        key={`more-${borderColor}`}
        style={[
          styles.matchPlayerAvatar,
          styles.matchPlayerAvatarMore,
          { borderColor },
        ]}
      >
        <Text style={[styles.matchPlayerAvatarMoreText, { color: borderColor }]}>+{teamPlayers.length - 2}</Text>
      </View>,
    ];
  };

  // Verifica che booking sia valido
  if (!booking || !booking.campo || !booking.campo.struttura) {
    return null;
  }

  // Formatta la data
  const matchDate = new Date(booking.date);
  const dateStr = matchDate.toLocaleDateString("it-IT", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  // Determina se la partita è oggi o domani
  const bookingDate = new Date(booking.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  bookingDate.setHours(0, 0, 0, 0);

  const isToday = bookingDate.getTime() === today.getTime();
  const isTomorrow = bookingDate.getTime() === today.getTime() + 86400000;

  // Calcola stato temporale
  const now = new Date();
  const [startHour, startMin] = booking.startTime.split(":").map(Number);
  const [endHour, endMin] = booking.endTime.split(":").map(Number);

  const startDateTime = new Date(booking.date);
  startDateTime.setHours(startHour, startMin, 0, 0);

  const endDateTime = new Date(booking.date);
  endDateTime.setHours(endHour, endMin, 0, 0);

  let timeStatus = "";
  let timeStatusColor = "#666";

  if (isToday) {
    if (now >= startDateTime && now <= endDateTime) {
      timeStatus = "IN CORSO";
      timeStatusColor = "#4CAF50";
    } else if (now < startDateTime) {
      const diffMs = startDateTime.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);

      if (diffHours > 0) {
        timeStatus = `Tra ${diffHours}h`;
      } else {
        timeStatus = `Tra ${diffMinutes}m`;
      }
      timeStatusColor = "#FF9800";
    }
  } else if (isTomorrow) {
    timeStatus = "Domani";
    timeStatusColor = "#2196F3";
  }

  // Conta giocatori per team
  const teamA = players.filter((p) => p.team === "A" && p.status === "confirmed");
  const teamB = players.filter((p) => p.team === "B" && p.status === "confirmed");
  const playersPerTeam = maxPlayers / 2;

  const getSportValue = () => {
    if (typeof booking.campo.sport === "string") {
      return booking.campo.sport;
    }
    return (booking.campo.sport as any)?.code || (booking.campo.sport as any)?.name || "";
  };

  // Ottiene il nome dello sport da visualizzare
  const getSportName = () => {
    if (typeof booking.campo.sport === 'string') {
      return booking.campo.sport;
    }
    return (booking.campo.sport as any)?.name || 'Sport';
  };

  const sportValue = getSportValue();

  return (
    <Pressable style={styles.matchCard} onPress={onPress}>
      {/* Header con Gradiente Blu */}
      <LinearGradient
        colors={["#2196F3", "#1976D2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.matchGradientHeader}
      >
        {/* Data e Ora */}
        <View style={styles.matchDateTimeRow}>
          <View style={styles.matchDateBadge}>
            <Ionicons name="calendar-outline" size={14} color="#fff" />
            <Text style={styles.matchDateText}>{dateStr}</Text>
          </View>
          <View style={styles.matchTimeBadge}>
            <Ionicons name="time-outline" size={14} color="#fff" />
            <Text style={styles.matchTimeWhite}>
              {booking.startTime} - {booking.endTime}
            </Text>
          </View>
        </View>

      </LinearGradient>

      {/* Content */}
      <View style={styles.matchCardContent}>
        {/* Organizzatore */}
        <View style={styles.matchOrganizerRow}>
          <View style={styles.matchOrganizerAvatar}>
            {createdBy.avatarUrl ? (
              <Image source={{ uri: createdBy.avatarUrl }} style={styles.matchOrganizerAvatarImage} />
            ) : (
              <View style={styles.matchOrganizerAvatarPlaceholder}>
                <Ionicons name="person" size={16} color="#2196F3" />
              </View>
            )}
          </View>
          <View style={styles.matchOrganizerInfo}>
            <Text style={styles.matchOrganizerLabel}>Organizzata da</Text>
            <Text style={styles.matchOrganizerName}>
              {createdBy.name} {createdBy.surname}
            </Text>
          </View>
        </View>

        {/* Struttura */}
        <View style={styles.matchLocationContainerEnhanced}>
          <View style={styles.matchLocationIcon}>
            <Ionicons name="business" size={14} color="#2196F3" />
          </View>
          <Text style={styles.matchLocationTextBold} numberOfLines={1}>
            {booking.campo.struttura.name}
          </Text>
        </View>

        {/* Campo */}
        <View style={styles.matchLocationContainerEnhanced}>
          <View style={styles.matchLocationIcon}>
            <Ionicons name="location" size={14} color="#2196F3" />
          </View>
          <Text style={styles.matchLocationTextBold} numberOfLines={1}>
            {booking.campo.name}
          </Text>
        </View>

        {/* Teams */}
        <View style={styles.matchTeamsContainer}>
          <View style={styles.matchTeam}>
            <View style={[styles.matchTeamLabelBadge, { backgroundColor: "#FFEBEE" }]}>
              <Text style={[styles.matchTeamLabel, { color: "#F44336" }]}>Team A</Text>
            </View>
            <View style={styles.matchPlayersRow}>
              {renderTeamAvatars(teamA, "#F44336")}
              <Text style={styles.matchPlayersCount}>
                {teamA.length}/{playersPerTeam}
              </Text>
            </View>
          </View>

          <View style={styles.matchVsCircle}>
            <Text style={styles.matchVs}>VS</Text>
          </View>

          <View style={styles.matchTeam}>
            <View style={[styles.matchTeamLabelBadge, { backgroundColor: "#E3F2FD" }]}>
              <Text style={[styles.matchTeamLabel, { color: "#2196F3" }]}>Team B</Text>
            </View>
            <View style={styles.matchPlayersRow}>
              {renderTeamAvatars(teamB, "#2196F3")}
              <Text style={styles.matchPlayersCount}>
                {teamB.length}/{playersPerTeam}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.matchCardFooter}>
          <View style={styles.matchVisibilityBadge}>
            <Ionicons
              name={isPublic ? "globe-outline" : "lock-closed-outline"}
              size={12}
              color="#666"
            />
            <Text style={styles.matchVisibilityText}>
              {isPublic ? "Pubblica" : "Privata"}
            </Text>
          </View>
          <View style={styles.matchVisibilityBadge}>
            <SportIcon sport={sportValue} size={12} color="#2196F3" />
            <Text style={styles.matchVisibilityText}>
              {getSportName()}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
