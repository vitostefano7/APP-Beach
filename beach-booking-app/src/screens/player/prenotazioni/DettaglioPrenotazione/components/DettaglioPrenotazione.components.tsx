import React, { useState, Fragment } from "react";
import { View, Text, Pressable, Alert, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { Avatar } from "../../../../../components/Avatar";
import { Player } from "../types/DettaglioPrenotazione.types";
import styles from "../styles/DettaglioPrenotazione.styles";
import TeamChangeModal from "./TeamChangeModal";

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
  isOrganizer?: boolean; // Aggiunto per indicare se il giocatore è l'organizzatore
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
  isOrganizer = false, // Valore di default
}) => {
  const navigation = useNavigation<any>();
  const [leaving, setLeaving] = useState(false);
  const [showTeamChangeModal, setShowTeamChangeModal] = useState(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);

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
  
  console.log('canLeave check:', {
    isCurrentUser,
    isConfirmed,
    isCreator,
    matchStatus,
    canLeave
  });

  const getButtonColor = () => {
    if (currentTeam === "A") return "#2196F3";
    if (currentTeam === "B") return "#F44336";
    return "#666";
  };

  const openUserProfile = (userId?: string) => {
    if (!userId || userId === currentUserId) return;
    navigation.navigate("ProfiloUtente", { userId });
  };

  const handleTeamChange = (team: "A" | "B" | null) => {
    onChangeTeam(team);
  };

  const handleLeaveMatch = () => {
    if (!onLeave) return;
    setShowLeaveConfirmModal(true);
  };

  const confirmLeaveMatch = async () => {
    try {
      setLeaving(true);
      setShowLeaveConfirmModal(false);
      await onLeave();
    } catch (error) {
      Alert.alert("Errore", "Impossibile abbandonare il match");
    } finally {
      setLeaving(false);
    }
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
    <Fragment>
      <View style={[
        styles.playerCard, 
        isPending && styles.playerCardPending,
        isCurrentUser && styles.currentUserCard,
        isDeclined && styles.declinedUserCard
      ]}>
        {/* LEFT */}
        <View style={styles.playerLeft}>
          <Pressable onPress={() => openUserProfile(player.user?._id)}>
            <Avatar
              name={player.user?.name}
              surname={player.user?.surname}
              avatarUrl={player.user?.avatarUrl}
              size={48}
              teamColor={currentTeam || 'none'}
            />
          </Pressable>

          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>
              {player.user?.name && player.user?.surname 
                ? `${player.user.name} ${player.user.surname}`
                : player.user?.name || "Giocatore"}
              {isCurrentUser && (
                <Text style={styles.currentUserIndicator}> (Tu)</Text>
              )}
              {isOrganizer && (
                <Text style={styles.organizerIndicator}> (organizzatore)</Text>
              )}
            </Text>
            <Text style={styles.playerUsername}>
              @{player.user?.username || "unknown"}
            </Text>
          </View>
        </View>

        {/* RIGHT */}
        <View style={styles.playerRight}>
          {/* Status Icon - Solo per altri giocatori */}
          {!isCurrentUser && (
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
          )}

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

          {canLeave && (
            <Pressable 
              style={styles.leaveButtonInline}
              onPress={handleLeaveMatch}
              disabled={leaving}
            >
              {leaving ? (
                <Ionicons name="ellipsis-horizontal" size={20} color="#F44336" />
              ) : (
                <Ionicons name="exit-outline" size={20} color="#F44336" />
              )}
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

      {/* Leave Confirm Modal */}
      <Modal
        visible={showLeaveConfirmModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLeaveConfirmModal(false)}
      >
        <View style={styles.centeredModalOverlay}>
          <View style={styles.leaveConfirmModal}>
            <View style={styles.leaveConfirmHeader}>
              <Ionicons name="exit-outline" size={48} color="#F44336" />
              <Text style={styles.leaveConfirmTitle}>Abbandona Match</Text>
            </View>
            
            <Text style={styles.leaveConfirmMessage}>
              Sei sicuro di voler abbandonare questo match? Questa azione non può essere annullata.
            </Text>
            
            <View style={styles.leaveConfirmActions}>
              <Pressable
                style={styles.leaveConfirmCancelButton}
                onPress={() => setShowLeaveConfirmModal(false)}
              >
                <Text style={styles.leaveConfirmCancelText}>Annulla</Text>
              </Pressable>
              
              <Pressable
                style={styles.leaveConfirmConfirmButton}
                onPress={confirmLeaveMatch}
                disabled={leaving}
              >
                {leaving ? (
                  <Ionicons name="ellipsis-horizontal" size={20} color="white" />
                ) : (
                  <>
                    <Ionicons name="exit-outline" size={20} color="white" />
                    <Text style={styles.leaveConfirmConfirmText}>Abbandona</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Fragment>
  );
};

export default PlayerCardWithTeam;