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
  isOrganizer?: boolean; // Indica se il giocatore è l'organizzatore (mostra badge)
  teamACount?: number;
  teamBCount?: number;
  maxPlayersPerTeam?: number;
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
  isOrganizer = false, // Valore di default
  teamACount = 0,
  teamBCount = 0,
  maxPlayersPerTeam = 2,
}) => {
  const isCurrentUser = player?.user?._id === currentUserId;
  const isConfirmed = player?.status === "confirmed";
  const isDeclined = player?.status === "declined";
  
  // Per l'owner, permetti di invitare se è il creatore
  const canChangeTeam = false;
  const canRemove = isCreator && player && matchStatus !== "completed" && matchStatus !== "cancelled" && matchStatus !== "in_progress";
  const canLeave = false;
  const canInvite = isCreator && matchStatus !== "completed" && matchStatus !== "cancelled";

  // Se è uno slot vuoto
  if (isEmptySlot) {
    if (canInvite && onInviteToSlot) {
      return (
        <Pressable 
          style={[styles.playerSlot, styles.emptySlotInvite]} 
          onPress={onInviteToSlot}
        >
          <View style={[styles.playerAvatarCircle, styles.inviteAvatarCircle]}>
            <Ionicons name="person-add" size={24} color="#2196F3" />
          </View>
          <View style={styles.playerInfoSlot}>
            <Text style={[styles.playerNameSlot, { color: "#2196F3" }]}>
              Invita giocatore
            </Text>
            <Text style={[styles.playerUsernameSlot, { color: "#2196F3" }]}>
              Slot {slotNumber}
            </Text>
          </View>
          <Ionicons name="add-circle" size={24} color="#2196F3" />
        </Pressable>
      );
    }
    
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
          {isOrganizer && (
            <Text style={styles.organizerIndicator}> (organizzatore)</Text>
          )}
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

      {/* Remove Button */}
      {canRemove && (
        <Pressable
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 8,
          }}
          onPress={onRemove}
          hitSlop={10}
        >
          <Ionicons
            name="close-circle"
            size={22}
            color="#F44336"
          />
        </Pressable>
      )}
    </Pressable>
  );
};

export default PlayerCardWithTeam;
