import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TopHour {
  hour: number;
  count: number;
}

interface OwnerStatsSummaryCardsProps {
  completedBookings: number;
  totalBookings: number;
  topHour?: TopHour;
  tassoOccupazione: number;
  showOccupancy: boolean;
  formatSlotTime: (decimalHour: number) => string;
}

export function OwnerStatsSummaryCards({
  completedBookings,
  totalBookings,
  topHour,
  tassoOccupazione,
  showOccupancy,
  formatSlotTime,
}: OwnerStatsSummaryCardsProps) {
  return (
    <View style={styles.statsCards}>
      <View style={styles.statCard}>
        <Ionicons name="calendar" size={28} color="#2196F3" />
        <Text style={styles.statValue}>
          <Text style={{ fontSize: 22 }}>{completedBookings}</Text>
          <Text style={{ fontSize: 14, color: "#999", fontWeight: "700" }}>
            /{totalBookings}
          </Text>
        </Text>
        <Text style={styles.statLabel}>Concluse / Totali</Text>
      </View>

      <View style={styles.statCard}>
        <Ionicons name="time" size={28} color="#4CAF50" />
        <Text style={styles.statValue}>
          <Text style={{ fontSize: 22 }}>{topHour?.count || 0}</Text>
          <Text style={{ fontSize: 13, color: "#999", fontWeight: "700" }}>
            {topHour && topHour.count > 0 ? ` / ${formatSlotTime(topHour.hour)}` : ""}
          </Text>
        </Text>
        <Text style={styles.statLabel}>Max Prenotazioni / Orario</Text>
      </View>

      {showOccupancy && (
        <View style={styles.statCard}>
          <Ionicons name="pie-chart" size={28} color="#FF9800" />
          <Text style={styles.statValue}>{tassoOccupazione}%</Text>
          <Text style={styles.statLabel}>Occupazione</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statsCards: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1a1a1a",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontWeight: "600",
  },
});