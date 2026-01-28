import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PlayerCardWithTeam from "./DettaglioPrenotazione.components";
import { styles } from "../../../styles/DettaglioPrenotazioneOwnerScreen.styles";

// Import componenti gradients
import { TeamAGradient, TeamBGradient } from "./GradientComponents";

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
  onPlayerPress,
}) => {
  const teamIcon = team === "A" ? "people-circle" : "people";

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
    <View style={styles.teamSectionPlayer}>
      {/* Header con gradient */}
      {team === "A" ? (
        <TeamAGradient style={styles.teamHeaderPlayer}>
          <Ionicons name={teamIcon} size={20} color="white" />
          <Text style={[styles.teamTitlePlayer, { color: "white" }]}>Team {team}</Text>
          <View style={styles.teamHeaderRight}>
            <Text style={[styles.teamCountPlayer, { color: "white" }]}>
              {players.length}/{maxPlayersPerTeam}
            </Text>
            {players.length === maxPlayersPerTeam && (
              <Ionicons name="checkmark-circle" size={16} color="white" />
            )}
          </View>
        </TeamAGradient>
      ) : (
        <TeamBGradient style={styles.teamHeaderPlayer}>
          <Ionicons name={teamIcon} size={20} color="white" />
          <Text style={[styles.teamTitlePlayer, { color: "white" }]}>Team {team}</Text>
          <View style={styles.teamHeaderRight}>
            <Text style={[styles.teamCountPlayer, { color: "white" }]}>
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
                onLeave={() => {}}
                currentTeam={team}
                isPending={slotPlayer.status === "pending"}
                slotNumber={slotNumber}
                matchStatus={matchStatus}
                onPlayerPress={onPlayerPress}
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
                onInviteToSlot={() => onInviteToTeam(team, slotNumber)}
                slotNumber={slotNumber}
                maxSlotsPerTeam={maxPlayersPerTeam}
                matchStatus={matchStatus}
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
