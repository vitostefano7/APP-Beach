import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PlayerCardWithTeam from "./PlayerCardWithTeam";
import { createTeamSectionStyles } from "../styles/TeamSection.styles";

// Import componenti gradients
import { TeamAGradient, TeamBGradient } from "./AnimatedComponents";

interface Player {
  user: {
    _id: string;
    name: string;
    surname?: string;
    username: string;
    avatarUrl?: string;
  };
  team?: "A" | "B" | null;
  status: "confirmed" | "pending" | "declined";
}

interface TeamSectionProps {
  team: "A" | "B";
  players: Player[];
  isCreator: boolean;
  currentUserId?: string;
  onRemovePlayer: (playerId: string) => void;
  onAssignTeam: (playerId: string, team: "A" | "B" | null) => void;
  maxPlayersPerTeam: number;
  onInviteToTeam: (team: "A" | "B", slotNumber: number) => void;
  matchStatus: string;
  variant: 'owner' | 'player';
  // Optional for player
  maxPlayers?: number;
  organizerId?: string;
  teamACount?: number;
  teamBCount?: number;
  showFormation?: boolean;
  onEmptySlotPress?: (team: "A" | "B", slotNumber: number) => void; // For player joining
  onLeave?: () => void; // For player leaving
  // Optional for owner
  onPlayerPress?: (player: Player) => void;
}

const TeamSection: React.FC<TeamSectionProps> = ({
  team,
  players,
  isCreator,
  currentUserId,
  onRemovePlayer,
  onAssignTeam,
  maxPlayersPerTeam,
  onInviteToTeam,
  matchStatus,
  variant,
  maxPlayers,
  organizerId,
  teamACount = 0,
  teamBCount = 0,
  showFormation = false,
  onEmptySlotPress,
  onLeave,
  onPlayerPress,
}) => {
  const styles = createTeamSectionStyles(variant);

  const teamIcon = "people-circle";

  // Calculate formation label if needed
  const formationLabel = showFormation && maxPlayers ? ` (${Math.floor(maxPlayers / 2)}v${Math.floor(maxPlayers / 2)})` : '';

  // Crea array di slot (pieni e vuoti)
  const slots = Array(maxPlayersPerTeam).fill(null);

  // Popola gli slot con i giocatori
  players.forEach((player, index) => {
    if (index < maxPlayersPerTeam) {
      slots[index] = player;
    }
  });

  // Determina se il match permette modifiche
  const canModify = matchStatus !== "completed" && matchStatus !== "cancelled";

  return (
    <View style={styles.teamSection}>
      {/* Header con gradient */}
      {team === "A" ? (
        <TeamAGradient style={styles.teamHeader}>
          <Ionicons name={teamIcon} size={20} color="white" />
          <Text style={styles.teamTitle}>Team {team}{formationLabel}</Text>
          <View style={styles.teamHeaderRight}>
            <Text style={styles.teamCount}>
              {players.length}/{maxPlayersPerTeam}
            </Text>
            {players.length === maxPlayersPerTeam && (
              <Ionicons name="checkmark-circle" size={16} color="white" />
            )}
          </View>
        </TeamAGradient>
      ) : (
        <TeamBGradient style={styles.teamHeader}>
          <Ionicons name={teamIcon} size={20} color="white" />
          <Text style={styles.teamTitle}>Team {team}{formationLabel}</Text>
          <View style={styles.teamHeaderRight}>
            <Text style={styles.teamCount}>
              {players.length}/{maxPlayersPerTeam}
            </Text>
            {players.length === maxPlayersPerTeam && (
              <Ionicons name="checkmark-circle" size={16} color="white" />
            )}
          </View>
        </TeamBGradient>
      )}

      <View style={styles.teamSlotsContainer}>
        {slots.map((slotPlayer, index) => {
          const slotNumber = index + 1;

          if (slotPlayer) {
            // Slot con giocatore
            return (
              <PlayerCardWithTeam
                key={slotPlayer.user._id}
                player={slotPlayer}
                isCreator={isCreator}
                currentUserId={currentUserId}
                onRemove={() => onRemovePlayer(slotPlayer.user._id)}
                onChangeTeam={(newTeam) => onAssignTeam(slotPlayer.user._id, newTeam)}
                onLeave={onLeave}
                currentTeam={team}
                isPending={slotPlayer.status === "pending"}
                slotNumber={slotNumber}
                matchStatus={matchStatus}
                onPlayerPress={onPlayerPress}
                isOrganizer={slotPlayer.user._id === organizerId}
                teamACount={teamACount}
                teamBCount={teamBCount}
                maxPlayersPerTeam={maxPlayersPerTeam}
                variant={variant}
              />
            );
          } else {
            // Slot vuoto
            return (
              <PlayerCardWithTeam
                key={`empty-slot-${team}-${slotNumber}`}
                isEmptySlot={true}
                isCreator={isCreator}
                currentUserId={currentUserId}
                onRemove={() => {}}
                onChangeTeam={() => {}}
                onInviteToSlot={() => onEmptySlotPress ? onEmptySlotPress(team, slotNumber) : onInviteToTeam(team, slotNumber)}
                slotNumber={slotNumber}
                maxSlotsPerTeam={maxPlayersPerTeam}
                matchStatus={matchStatus}
                variant={variant}
              />
            );
          }
        })}
      </View>

      {players.length === 0 && (
        <View style={styles.emptyTeamCard}>
          <Ionicons
            name="person-add"
            size={32}
            color="#ccc"
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTeamText}>Nessun giocatore</Text>
          {isCreator && canModify && (
            <Text style={styles.emptyTeamHint}>
              Premi "+ Invita" per aggiungere giocatori
            </Text>
          )}
          {(!isCreator || !canModify) && (
            <Text style={styles.emptyTeamHint}>
              Il team è attualmente vuoto
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

export default TeamSection;