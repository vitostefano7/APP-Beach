import React from "react";
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface TeamChangeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTeam: (team: "A" | "B" | null) => void;
  currentTeam?: "A" | "B" | null;
  isCreator: boolean;
}

const TeamChangeModal: React.FC<TeamChangeModalProps> = ({
  visible,
  onClose,
  onSelectTeam,
  currentTeam,
  isCreator,
}) => {
  const handleSelect = (team: "A" | "B" | null) => {
    onSelectTeam(team);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Ionicons name="people" size={24} color="#1a1a1a" />
            <Text style={styles.title}>Seleziona Team</Text>
          </View>

          <View style={styles.optionsContainer}>
            {/* Team A */}
            <Pressable
              style={styles.teamOption}
              onPress={() => handleSelect("A")}
            >
              <LinearGradient
                colors={["#2196F3", "#1976D2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.teamGradient,
                  currentTeam === "A" && styles.selectedTeam,
                ]}
              >
                <View style={styles.teamIconContainer}>
                  <Ionicons name="shield" size={32} color="white" />
                </View>
                <Text style={styles.teamLabel}>Team A</Text>
                {currentTeam === "A" && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                  </View>
                )}
              </LinearGradient>
            </Pressable>

            {/* Team B */}
            <Pressable
              style={styles.teamOption}
              onPress={() => handleSelect("B")}
            >
              <LinearGradient
                colors={["#F44336", "#D32F2F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.teamGradient,
                  currentTeam === "B" && styles.selectedTeam,
                ]}
              >
                <View style={styles.teamIconContainer}>
                  <Ionicons name="shield" size={32} color="white" />
                </View>
                <Text style={styles.teamLabel}>Team B</Text>
                {currentTeam === "B" && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                  </View>
                )}
              </LinearGradient>
            </Pressable>

            {/* Rimuovi da team - solo se non è il creatore */}
            {currentTeam && !isCreator && (
              <Pressable
                style={styles.removeOption}
                onPress={() => handleSelect(null)}
              >
                <Ionicons name="close-circle" size={24} color="#F44336" />
                <Text style={styles.removeLabel}>Rimuovi da team</Text>
              </Pressable>
            )}
          </View>

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Annulla</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  teamOption: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    position: "relative",
  },
  selectedTeam: {
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  teamIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  teamLabel: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
    flex: 1,
    letterSpacing: -0.3,
  },
  checkmark: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  removeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FFEBEE",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFCDD2",
  },
  removeLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F44336",
    letterSpacing: -0.2,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    letterSpacing: -0.2,
  },
});

export default TeamChangeModal;
