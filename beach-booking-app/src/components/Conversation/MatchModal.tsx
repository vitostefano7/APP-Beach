import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { styles } from "../../styles/ConversationScreen.styles";

interface MatchModalProps {
  visible: boolean;
  onRequestClose: () => void;
  matches: any[];
  loading: boolean;
  onSelectMatch: (match: any) => void;
  emptyText?: string;
}

const MatchModal: React.FC<MatchModalProps> = ({
  visible,
  onRequestClose,
  matches,
  loading,
  onSelectMatch,
  emptyText = "Non ci sono partite future nelle strutture che segui",
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onRequestClose}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onRequestClose}
      >
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Contatta le prossime partite</Text>
            <Pressable onPress={onRequestClose} hitSlop={10}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2979ff" />
              <Text style={styles.loadingText}>Caricamento partite...</Text>
            </View>
          ) : matches.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="volleyball-ball" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Nessuna partita futura</Text>
              <Text style={styles.emptyText}>
                {emptyText}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.modalList}>
              {matches.map((match) => {
                const booking = match.booking;
                const struttura = booking?.campo?.struttura;
                const date = booking?.date ? new Date(booking.date) : null;
                const time = booking?.startTime;
                const sport = booking?.campo?.sport || "Sport";

                return (
                  <Pressable
                    key={match._id}
                    style={styles.modalItem}
                    onPress={() => onSelectMatch(match)}
                  >
                    <View style={styles.modalItemLeft}>
                      <View style={styles.modalItemIcon}>
                        <FontAwesome5
                          name="volleyball-ball"
                          size={20}
                          color="#4CAF50"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={styles.modalItemText}>
                            📅 {date ? date.toLocaleDateString("it-IT") : "Data non disponibile"}
                          </Text>
                          <Text style={[styles.modalItemText, { marginLeft: 8 }]}>
                            🕒 {time || "N/A"}
                          </Text>
                        </View>
                        <Text style={styles.modalItemSubtext}>
                          {`${struttura?.name || "Struttura"} - ${booking?.campo?.name || "Campo"}`}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chatbubble-ellipses-outline" size={24} color="#2196F3" />
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default MatchModal;