import React, { useState } from "react";
import { View, Text, Pressable, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import API_URL from "../../../../../config/api";
import { Player } from "../types/DettaglioPrenotazione.types";
import styles from "../styles/DettaglioPrenotazione.styles";
import TeamChangeModal from "./TeamChangeModal";

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

interface PlayerCardWithTeamProps {
  player?: Player;
  isCreator: boolean;
  currentUserId?: string;
  onRemove: () => void;
  onChangeTeam: (team: "A" | "B" | null) => void;
  onLeave?: () => void; // Nuova prop per annullare la presenza
  currentTeam?: "A" | "B" | null;
  isPending?: boolean;
  isEmptySlot?: boolean;
  onInviteToSlot?: () => void;
  slotNumber?: number;
  maxSlotsPerTeam?: number;
  matchStatus?: string; // Aggiunto per controllare se il match è ancora modificabile
}

const PlayerCardWithTeam: React.FC<PlayerCardWithTeamProps> = ({
  player,
  isCreator,
  currentUserId,
  onRemove,
  onChangeTeam,
  onLeave, // Nuova prop
  currentTeam,
  isPending = false,
  isEmptySlot = false,
  onInviteToSlot,
  slotNumber,
  maxSlotsPerTeam,
  matchStatus = "open", // Valore di default
}) => {
  const [leaving, setLeaving] = useState(false);
  const [showTeamChangeModal, setShowTeamChangeModal] = useState(false);

  const isCurrentUser = player?.user?._id === currentUserId;
  const isConfirmed = player?.status === "confirmed";
  const isDeclined = player?.status === "declined";
  
  // DEBUG: Log per capire perché non funziona
  console.log('PlayerCard Debug:', {
    playerUserId: player?.user?._id,
    currentUserId,
    isCurrentUser,
    isCreator,
    isConfirmed,
    matchStatus,
    playerStatus: player?.status
  });
  
  // Il giocatore può cambiare il proprio team, o il creatore può cambiare qualsiasi team
  // Ma NON se il match è in corso, completato o cancellato
  const canChangeTeam = (isCurrentUser || isCreator) && isConfirmed && 
    matchStatus !== "completed" && 
    matchStatus !== "cancelled" && 
    matchStatus !== "in_progress";
  const canRemove = isCreator && player?.user?._id !== currentUserId && 
    matchStatus !== "completed" && 
    matchStatus !== "cancelled" && 
    matchStatus !== "in_progress";
  
  // L'utente può annullare la propria presenza solo se:
  // 1. È l'utente corrente
  // 2. È confermato (non in attesa)
  // 3. Non è il creatore del match
  // 4. Il match non è completato o cancellato
  const canLeave = isCurrentUser && isConfirmed && !isCreator && matchStatus !== "completed" && matchStatus !== "cancelled";

  const getButtonColor = () => {
    if (currentTeam === "A") return "#2196F3";
    if (currentTeam === "B") return "#F44336";
    return "#666";
  };

  const handleTeamChange = (team: "A" | "B" | null) => {
    onChangeTeam(team);
  };

  const handleLeaveMatch = () => {
    if (!onLeave) return;
    
    Alert.alert(
      "Abbandona il match",
      "Sei sicuro di voler abbandonare questo match?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Abbandona",
          style: "destructive",
          onPress: async () => {
            try {
              setLeaving(true);
              await onLeave();
            } catch (error) {
              Alert.alert("Errore", "Impossibile abbandonare il match");
            } finally {
              setLeaving(false);
            }
          }
        }
      ]
    );
  };

  // Se è uno slot vuoto
  if (isEmptySlot) {
    return (
      <Pressable 
        style={[styles.playerCard, styles.emptySlotCard]}
        onPress={onInviteToSlot}
      >
        <View style={styles.emptySlotContent}>
          <View style={styles.emptySlotIconContainer}>
            <Ionicons name="person-add-outline" size={24} color="#999" />
          </View>
          <View style={styles.emptySlotInfo}>
            <Text style={styles.emptySlotText}>Slot {slotNumber}</Text>
            <Text style={styles.emptySlotSubtext}>Disponibile</Text>
          </View>
          {isCreator && matchStatus !== "completed" && matchStatus !== "cancelled" && matchStatus !== "in_progress" && (
            <Pressable 
              style={styles.inviteSlotButton}
              onPress={onInviteToSlot}
            >
              <Ionicons name="add-circle" size={22} color="#4CAF50" />
            </Pressable>
          )}
        </View>
      </Pressable>
    );
  }

  // Se c'è un giocatore
  if (!player) {
    return null;
  }

  return (
    <View style={[
      styles.playerCard, 
      isPending && styles.playerCardPending,
      isCurrentUser && styles.currentUserCard,
      isDeclined && styles.declinedUserCard
    ]}>
      {/* Pulsante Abbandona per l'utente corrente */}
      {canLeave && (
        <Pressable 
          style={styles.leaveButton}
          onPress={handleLeaveMatch}
          disabled={leaving}
        >
          {leaving ? (
            <Ionicons name="ellipsis-horizontal" size={14} color="#FFF" />
          ) : (
            <Ionicons name="exit-outline" size={14} color="#FFF" />
          )}
        </Pressable>
      )}

      {/* LEFT */}
      <View style={styles.playerLeft}>
        {player.user?.avatarUrl ? (
          <Image
            source={{ uri: `${API_URL}${player.user.avatarUrl}` }}
            style={styles.playerAvatar}
          />
        ) : (
          <View style={[
            styles.playerAvatarPlaceholder,
            currentTeam === "A" ? styles.avatarTeamA : 
            currentTeam === "B" ? styles.avatarTeamB : 
            styles.avatarNoTeam
          ]}>
            <Text style={styles.avatarInitials}>
              {getInitials(player.user?.name, player.user?.surname)}
            </Text>
          </View>
        )}

        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>
            {player.user?.name && player.user?.surname 
              ? `${player.user.name} ${player.user.surname}`
              : player.user?.name || "Giocatore"}
            {isCurrentUser && (
              <Text style={styles.currentUserIndicator}> (Tu)</Text>
            )}
          </Text>
          <Text style={styles.playerUsername}>
            @{player.user?.username || "unknown"}
          </Text>
        </View>
      </View>

      {/* RIGHT */}
      <View style={styles.playerRight}>
        {/* Status Icon - Compatto */}
        <View
          style={[
            styles.playerStatusIcon,
            isConfirmed
              ? styles.playerStatusConfirmed
              : isPending
              ? styles.playerStatusPending
              : styles.playerStatusDeclined,
          ]}
        >
          <Ionicons
            name={
              isConfirmed ? "checkmark-circle" : 
              isPending ? "time" : 
              "close-circle"
            }
            size={18}
            color={
              isConfirmed ? "#4CAF50" : 
              isPending ? "#FF9800" : 
              "#F44336"
            }
          />
        </View>

        {canChangeTeam && (
          <Pressable
            style={styles.dragIndicator}
            onPress={() => setShowTeamChangeModal(true)}
            hitSlop={10}
          >
            <Ionicons
              name="swap-horizontal"
              size={20}
              color={getButtonColor()}
            />
          </Pressable>
        )}

        {canRemove && (
          <Pressable
            style={styles.removeButton}
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
      </View>

      {/* Team Change Modal */}
      <TeamChangeModal
        visible={showTeamChangeModal}
        onClose={() => setShowTeamChangeModal(false)}
        onSelectTeam={handleTeamChange}
        currentTeam={currentTeam}
        isCreator={isCreator}
      />
    </View>
  );
};

export default PlayerCardWithTeam;