import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PlayerCardWithTeam from "./DettaglioPrenotazione.components";
import styles from "../styles/DettaglioPrenotazione.styles";
import { Player } from "../types/DettaglioPrenotazione.types";
import { getTeamFormationLabel } from "../../../../../utils/matchSportRules";

// Import componenti gradients
import { TeamAGradient, TeamBGradient } from "./GradientComponents";

interface TeamSectionProps {
  team: "A" | "B";
  players: Player[];
  isCreator: boolean;
  currentUserId?: string;
  onRemovePlayer: (playerId: string) => void;
  onAssignTeam: (playerId: string, team: "A" | "B" | null) => void;
  maxPlayersPerTeam: number;
  maxPlayers: number; // Aggiunto per calcolare la formazione
  onInviteToTeam: (team: "A" | "B", slotNumber: number) => void;
  matchStatus: string; // Aggiunto per passare lo stato del match
  organizerId?: string; // Aggiunto per identificare l'organizzatore
  teamACount?: number;
  teamBCount?: number;
}

const TeamSection: React.FC<TeamSectionProps> = ({
  team,
  players,
  isCreator,
  currentUserId,
  onRemovePlayer,
  onAssignTeam,
  maxPlayersPerTeam,
  maxPlayers,
  onInviteToTeam,
  matchStatus,
  organizerId,
  teamACount = 0,
  teamBCount = 0,
}) => {
  const teamColor = team === "A" ? "#2196F3" : "#F44336";
  const teamIcon = team === "A" ? "people-circle" : "people-circle";
  
  // Calcola l'etichetta della formazione (es. "2v2", "5v5")
  const formationLabel = getTeamFormationLabel(maxPlayers);

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
          <Text style={[styles.teamTitle, { color: "white" }]}>Team {team} ({formationLabel})</Text>
          <View style={styles.teamHeaderRight}>
            <Text style={[styles.teamCount, { color: "white" }]}>
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
          <Text style={[styles.teamTitle, { color: "white" }]}>Team {team} ({formationLabel})</Text>
          <View style={styles.teamHeaderRight}>
            <Text style={[styles.teamCount, { color: "white" }]}>
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
                onLeave={() => {
                  // Lascia il match (gestito dal componente genitore)
                  // Qui passeremo una funzione se serve
                }}
                currentTeam={team}
                isPending={slotPlayer.status === "pending"}
                slotNumber={slotNumber}
                matchStatus={matchStatus}
                isOrganizer={slotPlayer?.user?._id === organizerId}
                teamACount={teamACount}
                teamBCount={teamBCount}
                maxPlayersPerTeam={maxPlayersPerTeam}
              />
            );
          } else {
            // Slot vuoto - solo se si possono fare modifiche
            return (
              <PlayerCardWithTeam
                key={`empty-slot-${team}-${slotNumber}`}
                isEmptySlot={true}
                isCreator={isCreator}
                currentUserId={currentUserId}
                onInviteToSlot={() => onInviteToTeam(team, slotNumber)}
                slotNumber={slotNumber}
                maxSlotsPerTeam={maxPlayersPerTeam}
                matchStatus={matchStatus}
                teamACount={teamACount}
                teamBCount={teamBCount}
                maxPlayersPerTeam={maxPlayersPerTeam}
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