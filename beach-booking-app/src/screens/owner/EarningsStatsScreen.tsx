import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import API_URL from "../../config/api";

interface Earning {
  type: "booking" | "refund" | "cancellation_penalty";
  amount: number;
  description?: string;
  createdAt: string;
  bookingDetails?: {
    date: string;
    startTime: string;
    endTime: string;
    price: number;
    status: string;
    campo: string;
    user: {
      name: string;
      surname: string;
      username: string;
    };
  };
}

interface EarningsData {
  totalEarnings: number;
  earnings: Earning[];
}

export default function EarningsStatsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { token } = useContext(AuthContext);

  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "booking" | "refund">("all");

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/users/me/earnings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setEarningsData(data);
      }
    } catch (error) {
      console.error("Error loading earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEarnings = () => {
    if (!earningsData) return [];
    if (filter === "all") return earningsData.earnings;
    return earningsData.earnings.filter((e) => e.type === filter);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "booking":
        return "Guadagno";
      case "refund":
        return "Rimborso";
      case "cancellation_penalty":
        return "Penale";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "booking":
        return "#4CAF50";
      case "refund":
        return "#F44336";
      case "cancellation_penalty":
        return "#FF9800";
      default:
        return "#999";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "booking":
        return "arrow-up-circle";
      case "refund":
        return "arrow-down-circle";
      case "cancellation_penalty":
        return "alert-circle";
      default:
        return "help-circle";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredEarnings = getFilteredEarnings();
  const totalFiltered = filteredEarnings.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Statistiche Guadagni</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="wallet" size={40} color="#2196F3" />
          </View>
          <Text style={styles.summaryLabel}>Bilancio Totale</Text>
          <Text style={styles.summaryValue}>
            €{earningsData?.totalEarnings.toFixed(2) || "0.00"}
          </Text>
          <Text style={styles.summarySubtext}>
            {earningsData?.earnings.length || 0} transazioni totali
          </Text>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <Pressable
            style={[styles.filterButton, filter === "all" && styles.filterButtonActive]}
            onPress={() => setFilter("all")}
          >
            <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>
              Tutte
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterButton, filter === "booking" && styles.filterButtonActive]}
            onPress={() => setFilter("booking")}
          >
            <Text style={[styles.filterText, filter === "booking" && styles.filterTextActive]}>
              Guadagni
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterButton, filter === "refund" && styles.filterButtonActive]}
            onPress={() => setFilter("refund")}
          >
            <Text style={[styles.filterText, filter === "refund" && styles.filterTextActive]}>
              Rimborsi
            </Text>
          </Pressable>
        </View>

        {/* Filtered Summary */}
        {filter !== "all" && (
          <View style={styles.filteredSummary}>
            <Text style={styles.filteredLabel}>Totale filtrato:</Text>
            <Text style={[styles.filteredValue, { color: totalFiltered >= 0 ? "#4CAF50" : "#F44336" }]}>
              €{totalFiltered.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Transactions List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storico Transazioni</Text>

          {filteredEarnings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Nessuna transazione trovata</Text>
            </View>
          ) : (
            filteredEarnings.map((earning, index) => (
              <View key={index} style={styles.transactionCard}>
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: getTypeColor(earning.type) + "20" },
                    ]}
                  >
                    <Ionicons
                      name={getTypeIcon(earning.type) as any}
                      size={24}
                      color={getTypeColor(earning.type)}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionType}>{getTypeLabel(earning.type)}</Text>
                    <Text style={styles.transactionDescription}>
                      {earning.description || "Nessuna descrizione"}
                    </Text>
                    {earning.bookingDetails && (
                      <View style={styles.bookingDetails}>
                        <Text style={styles.bookingDetailText}>
                          📍 {earning.bookingDetails.campo}
                        </Text>
                        <Text style={styles.bookingDetailText}>
                          📅 {earning.bookingDetails.date} alle {earning.bookingDetails.startTime}
                        </Text>
                        <Text style={styles.bookingDetailText}>
                          👤 {earning.bookingDetails.user?.name} {earning.bookingDetails.user?.surname}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.transactionDate}>{formatDate(earning.createdAt)}</Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: earning.amount >= 0 ? "#4CAF50" : "#F44336" },
                  ]}
                >
                  {earning.amount >= 0 ? "+" : ""}€{Math.abs(earning.amount).toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  summaryCard: {
    backgroundColor: "white",
    margin: 16,
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },

  summaryIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  summaryLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "600",
  },

  summaryValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#2196F3",
    marginBottom: 4,
  },

  summarySubtext: {
    fontSize: 13,
    color: "#999",
  },

  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },

  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "white",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  filterButtonActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },

  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },

  filterTextActive: {
    color: "white",
  },

  filteredSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },

  filteredLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  filteredValue: {
    fontSize: 20,
    fontWeight: "800",
  },

  section: {
    paddingHorizontal: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
  },

  transactionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  transactionLeft: {
    flexDirection: "row",
    flex: 1,
    marginRight: 12,
  },

  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  transactionInfo: {
    flex: 1,
  },

  transactionType: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },

  transactionDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    lineHeight: 18,
  },

  bookingDetails: {
    backgroundColor: "#f9f9f9",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },

  bookingDetailText: {
    fontSize: 11,
    color: "#666",
    marginBottom: 2,
  },

  transactionDate: {
    fontSize: 11,
    color: "#999",
  },

  transactionAmount: {
    fontSize: 18,
    fontWeight: "800",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    backgroundColor: "white",
    borderRadius: 12,
  },

  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: "#999",
    fontWeight: "600",
  },
});
