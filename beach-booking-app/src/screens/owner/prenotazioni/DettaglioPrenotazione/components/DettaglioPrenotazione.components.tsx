import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Avatar } from "../../../../../components/Avatar";
import { styles } from "../../../styles/DettaglioPrenotazioneOwnerScreen.styles";

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

interface PlayerCardWithTeamProps {
  player?: Player;
  isCreator: boolean;
  currentUserId?: string;
  onRemove: () => void;
  onChangeTeam: (team: "A" | "B" | null) => void;
  onLeave?: () => void;
  currentTeam?: "A" | "B" | null;
  isPending?: boolean;
  isEmptySlot?: boolean;
  onInviteToSlot?: () => void;
  slotNumber?: number;
  maxSlotsPerTeam?: number;
  matchStatus?: string;
  onPlayerPress?: (player: Player) => void;
}

const PlayerCardWithTeam: React.FC<PlayerCardWithTeamProps> = ({
  player,
  isCreator,
  currentUserId,
  onPlayerPress,
  onRemove,
  onChangeTeam,
  onLeave,
  currentTeam,
  isPending = false,
  isEmptySlot = false,
  onInviteToSlot,
  slotNumber,
  maxSlotsPerTeam,
  matchStatus = "open",
}) => {
  const isCurrentUser = player?.user?._id === currentUserId;
  const isConfirmed = player?.status === "confirmed";
  const isDeclined = player?.status === "declined";
  
  // Per l'owner, nessuna azione è consentita (solo visualizzazione)
  const canChangeTeam = false;
  const canRemove = false;
  const canLeave = false;

  // Se è uno slot vuoto
  if (isEmptySlot) {
    return (
      <View style={[styles.playerSlot, { opacity: 0.5 }]}>
        <View style={styles.playerAvatarCircle}>
          <Ionicons name="person-add-outline" size={20} color="#999" />
        </View>
        <View style={styles.playerInfoSlot}>
          <Text style={[styles.playerNameSlot, { color: "#999" }]}>
            Slot {slotNumber}
          </Text>
          <Text style={styles.playerUsernameSlot}>Disponibile</Text>
        </View>
      </View>
    );
  }

  // Se c'è un giocatore
  if (!player) {
    return null;
  }

  return (
    <Pressable 
      style={[
        styles.playerSlot,
        isPending && { opacity: 0.7 },
        isDeclined && { opacity: 0.5 }
      ]}
      onPress={() => onPlayerPress?.(player)}
      disabled={!onPlayerPress}
    >
      {/* LEFT */}
      <Avatar
        name={player.user?.name}
        surname={player.user?.surname}
        avatarUrl={player.user?.avatarUrl}
        size="small"
        teamColor={currentTeam || 'none'}
      />

      <View style={styles.playerInfoSlot}>
        <Text style={styles.playerNameSlot}>
          {player.user?.name && player.user?.surname 
            ? `${player.user.name} ${player.user.surname}`
            : player.user?.name || "Giocatore"}
        </Text>
        <Text style={styles.playerUsernameSlot}>
          @{player.user?.username || "unknown"}
        </Text>
      </View>

      {/* Status Icon */}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={
            isConfirmed ? "checkmark-circle" : 
            isPending ? "time" : 
            "close-circle"
          }
          size={20}
          color={
            isConfirmed ? "#4CAF50" : 
            isPending ? "#FF9800" : 
            "#F44336"
          }
        />
      </View>
    </Pressable>
  );
};

export default PlayerCardWithTeam;
