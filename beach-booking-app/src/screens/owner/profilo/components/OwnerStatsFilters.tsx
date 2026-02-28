import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SportIcon from "../../../../components/SportIcon";

type FilterType = "struttura" | "cliente" | "periodo" | "sport";

interface OwnerStatsFiltersProps {
  selectedStruttura: string;
  selectedUser: string;
  selectedSport: string;
  selectedPeriodDays: number;
  selectedStrutturaLabel: string;
  selectedUserLabel: string;
  selectedSportLabel: string;
  selectedPeriodLabel: string;
  availableSports: string[];
  onOpenFilter: (type: FilterType) => void;
}

export function OwnerStatsFilters({
  selectedStruttura,
  selectedUser,
  selectedSport,
  selectedPeriodDays,
  selectedStrutturaLabel,
  selectedUserLabel,
  selectedSportLabel,
  selectedPeriodLabel,
  availableSports,
  onOpenFilter,
}: OwnerStatsFiltersProps) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterLabel}>Filtri</Text>
      <View style={styles.singleFiltersRow}>
        <Pressable
          style={({ pressed }) => [
            styles.singleFilterChip,
            selectedStruttura !== "all" && styles.filterChipActive,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => onOpenFilter("struttura")}
        >
          <View style={styles.singleFilterChipLeft}>
            <Ionicons
              name="business-outline"
              size={16}
              color={selectedStruttura !== "all" ? "white" : "#2196F3"}
            />
            <Text
              style={[
                styles.singleFilterChipText,
                selectedStruttura !== "all" && styles.filterChipTextActive,
              ]}
            >
              Struttura: {selectedStrutturaLabel}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={18}
            color={selectedStruttura !== "all" ? "white" : "#2196F3"}
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.singleFilterChip,
            selectedUser !== "all" && styles.filterChipActive,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => onOpenFilter("cliente")}
        >
          <View style={styles.singleFilterChipLeft}>
            <Ionicons
              name="person-outline"
              size={16}
              color={selectedUser !== "all" ? "white" : "#2196F3"}
            />
            <Text
              style={[
                styles.singleFilterChipText,
                selectedUser !== "all" && styles.filterChipTextActive,
              ]}
            >
              Cliente: {selectedUserLabel}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={18}
            color={selectedUser !== "all" ? "white" : "#2196F3"}
          />
        </Pressable>

        {availableSports.length > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.singleFilterChip,
              selectedSport !== "all" && styles.filterChipActive,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => onOpenFilter("sport")}
          >
            <View style={styles.singleFilterChipLeft}>
              <SportIcon
                sport={selectedSport === "all" ? undefined : selectedSport}
                size={16}
                color={selectedSport !== "all" ? "white" : "#2196F3"}
              />
              <Text
                style={[
                  styles.singleFilterChipText,
                  selectedSport !== "all" && styles.filterChipTextActive,
                ]}
              >
                Sport: {selectedSportLabel}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={18}
              color={selectedSport !== "all" ? "white" : "#2196F3"}
            />
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.singleFilterChip,
            selectedPeriodDays !== 30 && styles.filterChipActive,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => onOpenFilter("periodo")}
        >
          <View style={styles.singleFilterChipLeft}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={selectedPeriodDays !== 30 ? "white" : "#2196F3"}
            />
            <Text
              style={[
                styles.singleFilterChipText,
                selectedPeriodDays !== 30 && styles.filterChipTextActive,
              ]}
            >
              Periodo: {selectedPeriodLabel}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={18}
            color={selectedPeriodDays !== 30 ? "white" : "#2196F3"}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  singleFiltersRow: {
    gap: 10,
  },
  singleFilterChip: {
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  singleFilterChipLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  singleFilterChipText: {
    color: "#1a1a1a",
    fontSize: 14,
    fontWeight: "600",
  },
  filterChipActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  filterChipTextActive: {
    color: "white",
  },
});