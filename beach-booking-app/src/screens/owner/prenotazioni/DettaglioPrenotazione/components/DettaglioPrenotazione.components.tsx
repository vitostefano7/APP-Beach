import React, { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import API_URL from "../../../../../config/api";
import { styles } from "../../../styles/DettaglioPrenotazioneOwnerScreen.styles";

const getInitials = (name?: string, surname?: string): string => {
  if (!name) return "??";
  if (surname) {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  }
  const parts = name.trim().split(" ");
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

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
      <View style={styles.playerAvatarCircle}>
        {player.user?.avatarUrl ? (
          <Image
            source={{ uri: `${API_URL}${player.user.avatarUrl}` }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
        ) : (
          <Text style={styles.playerInitials}>
            {getInitials(player.user?.name, player.user?.surname)}
          </Text>
        )}
      </View>

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
