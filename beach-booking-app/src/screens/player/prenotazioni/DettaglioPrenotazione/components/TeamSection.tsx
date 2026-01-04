import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PlayerCardWithTeam from "./DettaglioPrenotazione.components";
import styles from "../styles/DettaglioPrenotazione.styles";
import { Player } from "../types/DettaglioPrenotazione.types";

interface TeamSectionProps {
  team: "A" | "B";
  players: Player[];
  isCreator: boolean;
  currentUserId?: string;
  onRemovePlayer: (playerId: string) => void;
  onAssignTeam: (playerId: string, team: "A" | "B" | null) => void;
  maxPlayersPerTeam: number;
  onInviteToTeam: (team: "A" | "B", slotNumber: number) => void;
  onInviteToSlot?: () => void;
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
}) => {
  const teamColor = team === "A" ? "#2196F3" : "#F44336";
  const teamIcon = team === "A" ? "people-circle" : "people";

  // Crea array di slot (pieni e vuoti)
  const slots = Array(maxPlayersPerTeam).fill(null);
  
  // Popola gli slot con i giocatori
  players.forEach((player, index) => {
    if (index < maxPlayersPerTeam) {
      slots[index] = player;
    }
  });

  return (
    <View style={styles.teamSection}>
      <View style={[styles.teamHeader, team === "A" ? styles.teamAHeader : styles.teamBHeader]}>
        <Ionicons name={teamIcon} size={20} color={teamColor} />
        <Text style={styles.teamTitle}>Team {team}</Text>
        <View style={styles.teamHeaderRight}>
          <Text style={styles.teamCount}>
            {players.length}/{maxPlayersPerTeam}
          </Text>
          {players.length === maxPlayersPerTeam && (
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          )}
        </View>
      </View>

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
                currentTeam={team}
                isPending={slotPlayer.status === "pending"}
                slotNumber={slotNumber}
              />
            );
          } else {
            // Slot vuoto
            return (
              <PlayerCardWithTeam
                key={`empty-slot-${team}-${slotNumber}`}
                isEmptySlot={true}
                isCreator={isCreator}
                onInviteToSlot={() => onInviteToTeam(team, slotNumber)}
                slotNumber={slotNumber}
                maxSlotsPerTeam={maxPlayersPerTeam}
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
            style={styles.emptyTeamIcon}
          />
          <Text style={styles.emptyTeamText}>Nessun giocatore</Text>
          {isCreator && (
            <Text style={styles.emptyTeamHint}>
              Premi "+ Invita" per aggiungere giocatori
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

export default TeamSection;