import React, { useState } from "react";
import { View, Text, Pressable, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import API_URL from "../../../../../config/api";
import { Player } from "../types/DettaglioPrenotazione.types";
import styles from "../styles/DettaglioPrenotazione.styles";

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
  const [showTeamMenu, setShowTeamMenu] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const isCurrentUser = player?.user?._id === currentUserId;
  const isConfirmed = player?.status === "confirmed";
  const isDeclined = player?.status === "declined";
  const canChangeTeam = isCreator && isConfirmed && matchStatus !== "completed" && matchStatus !== "cancelled";
  const canRemove = isCreator && player?.user?._id !== currentUserId && matchStatus !== "completed" && matchStatus !== "cancelled";
  
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
    setShowTeamMenu(false);
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

  const teamMenuItems = [
    {
      team: "A" as const,
      label: "Team A",
      color: "#2196F3",
      style: styles.teamMenuItemA,
      showCheck: currentTeam === "A",
    },
    {
      team: "B" as const,
      label: "Team B",
      color: "#F44336",
      style: styles.teamMenuItemB,
      showCheck: currentTeam === "B",
    },
    ...(currentTeam
      ? [
          {
            team: null,
            label: "Rimuovi da team",
            color: "#F44336",
            style: styles.teamMenuItemRemove,
            showCheck: false,
          },
        ]
      : []),
  ];

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
          {isCreator && matchStatus !== "completed" && matchStatus !== "cancelled" && (
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
          <View style={styles.playerAvatarPlaceholder}>
            <Ionicons name="person" size={20} color="#999" />
          </View>
        )}

        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>
            {player.user?.name || "Giocatore"}
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
        {player.team && (
          <View
            style={[
              styles.teamBadge,
              player.team === "A"
                ? styles.teamBadgeA
                : styles.teamBadgeB,
            ]}
          >
            <Text style={styles.teamBadgeText}>
              Team {player.team}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.playerStatusBadge,
            isConfirmed
              ? styles.playerStatusConfirmed
              : isPending
              ? styles.playerStatusPending
              : styles.playerStatusDeclined,
          ]}
        >
          <Text style={styles.playerStatusText}>
            {isConfirmed ? "Confermato" : 
             isPending ? "In attesa" : 
             "Rifiutato"}
          </Text>
        </View>

        {canChangeTeam && (
          <View style={styles.teamControlContainer}>
            <Pressable
              style={[
                styles.teamButton,
                currentTeam === "A" && styles.teamButtonActiveA,
                currentTeam === "B" && styles.teamButtonActiveB,
              ]}
              onPress={() => setShowTeamMenu(!showTeamMenu)}
            >
              <Ionicons
                name="swap-horizontal"
                size={18}
                color={getButtonColor()}
              />
            </Pressable>

            {showTeamMenu && (
              <>
                <Pressable
                  style={styles.teamMenuOverlay}
                  onPress={() => setShowTeamMenu(false)}
                />

                <View style={styles.teamMenu}>
                  <Text style={styles.teamMenuTitle}>Assegna a:</Text>

                  {teamMenuItems.map((item, index) => (
                    <Pressable
                      key={index}
                      style={[styles.teamMenuItem, item.style]}
                      onPress={() => handleTeamChange(item.team)}
                    >
                      <Ionicons
                        name="shield"
                        size={16}
                        color={item.color}
                      />
                      <Text style={styles.teamMenuText}>
                        {item.label}
                      </Text>
                      {item.showCheck && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={item.color}
                        />
                      )}
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>
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
    </View>
  );
};

export default PlayerCardWithTeam;