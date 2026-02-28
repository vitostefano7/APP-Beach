import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface OwnerStatsView {
  prenotazioni: number;
  incassoTotale: number;
  incassoOggi: number;
  incassoSettimana: number;
  incassoMese: number;
  tassoOccupazione: number;
  nuoviClienti: number;
}

interface OwnerProfileStatsSectionProps {
  stats: OwnerStatsView;
  onOpenEarnings: (value: number) => void;
  onOpenBusinessStats: () => void;
}

export function OwnerProfileStatsSection({
  stats,
  onOpenEarnings,
  onOpenBusinessStats,
}: OwnerProfileStatsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Statistiche Economiche</Text>
        <Pressable style={styles.viewMoreButton} onPress={() => onOpenEarnings(stats.incassoTotale)}>
          <Text style={styles.viewMoreText}>Dettagli</Text>
          <Ionicons name="chevron-forward" size={16} color="#2196F3" />
        </Pressable>
      </View>

      <View style={styles.earningsGrid}>
        <Pressable style={styles.earningsPeriodCard} onPress={() => onOpenEarnings(stats.incassoOggi)}>
          <View style={styles.earningsPeriodHeader}>
            <Ionicons name="calendar-outline" size={24} color="#4CAF50" />
            <Text style={styles.earningsPeriodLabel}>Oggi</Text>
          </View>
          <Text style={styles.earningsPeriodValue}>€{stats.incassoOggi.toFixed(0)}</Text>
        </Pressable>

        <Pressable style={styles.earningsPeriodCard} onPress={() => onOpenEarnings(stats.incassoSettimana)}>
          <View style={styles.earningsPeriodHeader}>
            <Ionicons name="calendar" size={24} color="#2196F3" />
            <Text style={styles.earningsPeriodLabel}>Settimana</Text>
          </View>
          <Text style={styles.earningsPeriodValue}>€{stats.incassoSettimana.toFixed(0)}</Text>
        </Pressable>

        <Pressable style={styles.earningsPeriodCard} onPress={() => onOpenEarnings(stats.incassoMese)}>
          <View style={styles.earningsPeriodHeader}>
            <Ionicons name="stats-chart" size={24} color="#FF9800" />
            <Text style={styles.earningsPeriodLabel}>Mese</Text>
          </View>
          <Text style={styles.earningsPeriodValue}>€{stats.incassoMese.toFixed(0)}</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Statistiche Business</Text>
        <Pressable style={styles.viewMoreButton} onPress={onOpenBusinessStats}>
          <Text style={styles.viewMoreText}>Dettagli</Text>
          <Ionicons name="chevron-forward" size={16} color="#2196F3" />
        </Pressable>
      </View>

      <View style={styles.businessStatsCard}>
        <View style={styles.businessStat}>
          <Ionicons name="calendar" size={28} color="#4CAF50" />
          <Text style={styles.businessStatLabel}>Prenotazioni:</Text>
          <Text style={styles.businessStatValue}>{stats.prenotazioni}</Text>
        </View>
        <View style={styles.businessStat}>
          <Ionicons name="trending-up" size={28} color="#FF9800" />
          <Text style={styles.businessStatLabel}>Tasso Occupazione:</Text>
          <Text style={styles.businessStatValue}>{stats.tassoOccupazione}%</Text>
        </View>
        <View style={[styles.businessStat, styles.lastBusinessStat]}>
          <Ionicons name="people" size={28} color="#9C27B0" />
          <Text style={styles.businessStatLabel}>Clienti Unici:</Text>
          <Text style={styles.businessStatValue}>{stats.nuoviClienti}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2196F3",
  },
  earningsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  earningsPeriodCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  earningsPeriodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  earningsPeriodLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  earningsPeriodValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  businessStatsCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  businessStat: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  lastBusinessStat: {
    marginBottom: 0,
  },
  businessStatLabel: {
    fontSize: 12,
    color: "#666",
    marginLeft: 10,
    flex: 1,
  },
  businessStatValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
});
