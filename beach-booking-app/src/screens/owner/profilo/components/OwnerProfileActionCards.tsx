import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface OwnerProfileActionCardsProps {
  struttureCount: number;
  prenotazioniCount: number;
  onOpenStrutture: () => void;
  onOpenBookings: () => void;
}

export function OwnerProfileActionCards({
  struttureCount,
  prenotazioniCount,
  onOpenStrutture,
  onOpenBookings,
}: OwnerProfileActionCardsProps) {
  return (
    <View style={styles.actionCardsContainer}>
      <Pressable style={styles.actionCard} onPress={onOpenStrutture}>
        <Ionicons name="business" size={32} color="white" />
        <Text style={styles.actionCardTitle}>Strutture</Text>
        <Text style={styles.actionCardSubtitle}>{struttureCount} Centri</Text>
      </Pressable>

      <Pressable style={styles.actionCard} onPress={onOpenBookings}>
        <Ionicons name="calendar" size={32} color="white" />
        <Text style={styles.actionCardTitle}>Prenotazioni</Text>
        <Text style={styles.actionCardSubtitle}>{prenotazioniCount} Totali</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionCardsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#3c8fd3",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionCardTitle: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
  },
  actionCardSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});
