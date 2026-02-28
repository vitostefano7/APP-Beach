import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface OwnerStatsHeaderProps {
  onBack: () => void;
}

export function OwnerStatsHeader({ onBack }: OwnerStatsHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color="#2196F3" />
      </Pressable>
      <Text style={styles.headerTitle}>Statistiche Dettagliate</Text>
      <View style={styles.rightSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  rightSpacer: {
    width: 40,
  },
});