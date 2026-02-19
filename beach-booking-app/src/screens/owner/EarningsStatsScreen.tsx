import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import API_URL from "../../config/api";
import { LineChart, PieChart } from "react-native-chart-kit";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
    struttura?: {
      id: string;
      name: string;
      address: string;
    };
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

interface WeeklyData {
  labels: string[];
  values: number[];
}

interface StrutturaStats {
  id: string;
  name: string;
  total: number;
  count: number;
  color: string;
}

export default function EarningsStatsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { token } = useContext(AuthContext);

  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "booking" | "refund">("all");
  const [selectedStruttura, setSelectedStruttura] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState(true);
  const [showTransactions, setShowTransactions] = useState(true);

  useEffect(() => {
    if (!token) return;
    loadEarnings();
  }, [token]);

  const loadEarnings = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/users/me/earnings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setEarningsData(data);
      } else {
        const errorText = await res.text();
        console.error("Error loading earnings:", res.status, errorText);
      }
    } catch (error) {
      console.error("Error loading earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEarnings = () => {
    if (!earningsData) return [];
    let filtered = earningsData.earnings;

    // Filtra per tipo
    if (filter !== "all") {
      filtered = filtered.filter((e) => e.type === filter);
    }

    // Filtra per struttura
    if (selectedStruttura) {
      filtered = filtered.filter(
        (e) => e.bookingDetails?.struttura?.id === selectedStruttura
      );
    }

    return filtered;
  };

  // Calcola dati per grafico settimanale
  const getWeeklyData = (): WeeklyData => {
    if (!earningsData) return { labels: [], values: [] };

    const now = new Date();
    const weeklyTotals: { [key: string]: number } = {};

    // Ultime 7 settimane
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i * 7);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      weeklyTotals[key] = 0;
    }

    // Aggrega guadagni per settimana
    earningsData.earnings.forEach((earning) => {
      const date = new Date(earning.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      
      if (key in weeklyTotals) {
        weeklyTotals[key] += earning.amount;
      }
    });

    return {
      labels: Object.keys(weeklyTotals),
      values: Object.values(weeklyTotals),
    };
  };

  // Calcola statistiche per struttura
  const getStruttureStats = (): StrutturaStats[] => {
    if (!earningsData) return [];

    const struttureMap: { [id: string]: StrutturaStats } = {};
    const colors = ["#2196F3", "#4CAF50", "#FF9800", "#9C27B0", "#F44336", "#00BCD4", "#FFC107"];
    let colorIndex = 0;

    earningsData.earnings.forEach((earning) => {
      if (earning.bookingDetails?.struttura && earning.type === "booking") {
        const { id, name } = earning.bookingDetails.struttura;
        
        if (!struttureMap[id]) {
          struttureMap[id] = {
            id,
            name,
            total: 0,
            count: 0,
            color: colors[colorIndex % colors.length],
          };
          colorIndex++;
        }
        
        struttureMap[id].total += earning.amount;
        struttureMap[id].count++;
      }
    });

    return Object.values(struttureMap).sort((a, b) => b.total - a.total);
  };

  const struttureStats = getStruttureStats();

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
  const weeklyData = getWeeklyData();

  // Prepara dati per grafico a torta
  const pieData = struttureStats.map((struttura) => ({
    name: struttura.name,
    population: struttura.total,
    color: struttura.color,
    legendFontColor: "#333",
    legendFontSize: 12,
  }));

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
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="wallet" size={32} color="#2196F3" />
            </View>
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryLabel}>Bilancio Totale</Text>
              <Text style={styles.summaryValue}>
                €{earningsData?.totalEarnings.toFixed(2) || "0.00"}
              </Text>
              <Text style={styles.summarySubtext}>
                {earningsData?.earnings.length || 0} transazioni totali
              </Text>
            </View>
          </View>
        </View>

        {/* Grafici Section */}
        <Pressable
          style={styles.section}
          onPress={() => setShowCharts(!showCharts)}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="bar-chart" size={20} color="#2196F3" />
              <Text style={styles.sectionTitle}>Grafici e Statistiche</Text>
            </View>
            <Ionicons
              name={showCharts ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </View>
        </Pressable>

        {showCharts && (
          <>
            {/* Grafico Andamento Settimanale */}
            {weeklyData.labels.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>📈 Andamento Settimanale</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart
                    data={{
                      labels: weeklyData.labels,
                      datasets: [
                        {
                          data: weeklyData.values.length > 0 ? weeklyData.values : [0],
                        },
                      ],
                    }}
                    width={Math.max(SCREEN_WIDTH - 32, weeklyData.labels.length * 60)}
                    height={220}
                    chartConfig={{
                      backgroundColor: "#ffffff",
                      backgroundGradientFrom: "#ffffff",
                      backgroundGradientTo: "#f8f9fa",
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForDots: {
                        r: "5",
                        strokeWidth: "2",
                        stroke: "#2196F3",
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: "",
                        stroke: "#e0e0e0",
                        strokeWidth: 1,
                      },
                    }}
                    bezier
                    style={styles.chart}
                    formatYLabel={(value) => `€${value}`}
                  />
                </ScrollView>
              </View>
            )}

            {/* Grafico Distribuzione per Struttura */}
            {pieData.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>🏟️ Distribuzione per Struttura</Text>
                <PieChart
                  data={pieData}
                  width={SCREEN_WIDTH - 32}
                  height={220}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  hasLegend={true}
                />
                
                {/* Lista Strutture con Stats */}
                <View style={styles.struttureList}>
                  {struttureStats.map((struttura) => (
                    <Pressable
                      key={struttura.id}
                      style={[
                        styles.strutturaItem,
                        selectedStruttura === struttura.id && styles.strutturaItemActive,
                      ]}
                      onPress={() =>
                        setSelectedStruttura(
                          selectedStruttura === struttura.id ? null : struttura.id
                        )
                      }
                    >
                      <View style={styles.strutturaInfo}>
                        <View
                          style={[styles.colorDot, { backgroundColor: struttura.color }]}
                        />
                        <View style={styles.strutturaText}>
                          <Text style={styles.strutturaNome}>{struttura.name}</Text>
                          <Text style={styles.strutturaCount}>
                            {struttura.count} prenotazioni
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.strutturaTotal}>
                        €{struttura.total.toFixed(2)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* Filters per Tipo */}
        <View style={styles.filtersSection}>
          <Text style={styles.filtersSectionTitle}>Tipo Transazione</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersContainer}>
              <Pressable
                style={[
                  styles.filterButton,
                  filter === "all" && styles.filterButtonActive,
                ]}
                onPress={() => setFilter("all")}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === "all" && styles.filterTextActive,
                  ]}
                >
                  Tutte
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.filterButton,
                  filter === "booking" && styles.filterButtonActive,
                ]}
                onPress={() => setFilter("booking")}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === "booking" && styles.filterTextActive,
                  ]}
                >
                  💰 Guadagni
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.filterButton,
                  filter === "refund" && styles.filterButtonActive,
                ]}
                onPress={() => setFilter("refund")}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === "refund" && styles.filterTextActive,
                  ]}
                >
                  💸 Rimborsi
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>

        {/* Filters per Struttura */}
        {struttureStats.length > 0 && (
          <View style={styles.filtersSection}>
            <View style={styles.filtersSectionHeader}>
              <Text style={styles.filtersSectionTitle}>Filtra per Struttura</Text>
              {selectedStruttura && (
                <Pressable
                  style={styles.clearFilterButton}
                  onPress={() => setSelectedStruttura(null)}
                >
                  <Text style={styles.clearFilterText}>Cancella filtro</Text>
                  <Ionicons name="close-circle" size={16} color="#F44336" />
                </Pressable>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filtersContainer}>
                {struttureStats.map((struttura) => (
                  <Pressable
                    key={struttura.id}
                    style={[
                      styles.strutturaFilterButton,
                      selectedStruttura === struttura.id && {
                        backgroundColor: struttura.color,
                        borderColor: struttura.color,
                      },
                    ]}
                    onPress={() =>
                      setSelectedStruttura(
                        selectedStruttura === struttura.id ? null : struttura.id
                      )
                    }
                  >
                    <View
                      style={[
                        styles.strutturaFilterDot,
                        { backgroundColor: struttura.color },
                        selectedStruttura === struttura.id && { backgroundColor: "white" },
                      ]}
                    />
                    <Text
                      style={[
                        styles.strutturaFilterText,
                        selectedStruttura === struttura.id && styles.strutturaFilterTextActive,
                      ]}
                    >
                      {struttura.name}
                    </Text>
                    <View
                      style={[
                        styles.strutturaFilterBadge,
                        selectedStruttura === struttura.id && styles.strutturaFilterBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.strutturaFilterBadgeText,
                          selectedStruttura === struttura.id &&
                            styles.strutturaFilterBadgeTextActive,
                        ]}
                      >
                        €{struttura.total.toFixed(0)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Active Filters Display */}
        {(selectedStruttura || filter !== "all") && (
          <View style={styles.activeFilters}>
            <Text style={styles.activeFiltersLabel}>Filtri attivi:</Text>
            <View style={styles.activeFiltersChips}>
              {selectedStruttura && (
                <Pressable
                  style={styles.filterChip}
                  onPress={() => setSelectedStruttura(null)}
                >
                  <Text style={styles.filterChipText}>
                    {struttureStats.find((s) => s.id === selectedStruttura)?.name}
                  </Text>
                  <Ionicons name="close-circle" size={16} color="#2196F3" />
                </Pressable>
              )}
              {filter !== "all" && (
                <Pressable
                  style={styles.filterChip}
                  onPress={() => setFilter("all")}
                >
                  <Text style={styles.filterChipText}>
                    {filter === "booking" ? "Guadagni" : "Rimborsi"}
                  </Text>
                  <Ionicons name="close-circle" size={16} color="#2196F3" />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Filtered Summary */}
        {(filter !== "all" || selectedStruttura) && (
          <View style={styles.filteredSummary}>
            <Text style={styles.filteredLabel}>Totale filtrato:</Text>
            <Text
              style={[
                styles.filteredValue,
                { color: totalFiltered >= 0 ? "#4CAF50" : "#F44336" },
              ]}
            >
              €{totalFiltered.toFixed(2)}
            </Text>
            <Text style={styles.filteredCount}>
              {filteredEarnings.length} transazioni
            </Text>
          </View>
        )}

        {/* Transactions List */}
        <Pressable
          style={styles.section}
          onPress={() => setShowTransactions(!showTransactions)}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="list" size={20} color="#2196F3" />
              <Text style={styles.sectionTitle}>Storico Transazioni</Text>
            </View>
            <Ionicons
              name={showTransactions ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </View>
        </Pressable>

        {showTransactions && (
          <View style={styles.transactionsContainer}>
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
                      <Text style={styles.transactionType}>
                        {getTypeLabel(earning.type)}
                      </Text>
                      <Text style={styles.transactionDescription}>
                        {earning.description || "Nessuna descrizione"}
                      </Text>
                      {earning.bookingDetails && (
                        <View style={styles.bookingDetails}>
                          {earning.bookingDetails.struttura && (
                            <View style={styles.bookingDetailRow}>
                              <Ionicons name="business" size={12} color="#666" />
                              <Text style={styles.bookingDetailText}>
                                {earning.bookingDetails.struttura.name}
                              </Text>
                            </View>
                          )}
                          <View style={styles.bookingDetailRow}>
                            <Ionicons name="location" size={12} color="#666" />
                            <Text style={styles.bookingDetailText}>
                              {earning.bookingDetails.campo}
                            </Text>
                          </View>
                          <View style={styles.bookingDetailRow}>
                            <Ionicons name="calendar" size={12} color="#666" />
                            <Text style={styles.bookingDetailText}>
                              {earning.bookingDetails.date} • {earning.bookingDetails.startTime}
                            </Text>
                          </View>
                          <View style={styles.bookingDetailRow}>
                            <Ionicons name="person" size={12} color="#666" />
                            <Text style={styles.bookingDetailText}>
                              {earning.bookingDetails.user?.name}{" "}
                              {earning.bookingDetails.user?.surname}
                            </Text>
                          </View>
                        </View>
                      )}
                      <Text style={styles.transactionDate}>
                        {formatDate(earning.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      { color: earning.amount >= 0 ? "#4CAF50" : "#F44336" },
                    ]}
                  >
                    {earning.amount >= 0 ? "+" : ""}€
                    {Math.abs(earning.amount).toFixed(2)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

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
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  summaryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  summaryTextContainer: {
    flex: 1,
  },

  summaryLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
    fontWeight: "600",
  },

  summaryValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2196F3",
    marginBottom: 2,
  },

  summarySubtext: {
    fontSize: 12,
    color: "#999",
  },

  section: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
  },

  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  chartCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
  },

  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },

  struttureList: {
    marginTop: 16,
  },

  strutturaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },

  strutturaItemActive: {
    borderColor: "#2196F3",
    backgroundColor: "#E3F2FD",
  },

  strutturaInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },

  strutturaText: {
    flex: 1,
  },

  strutturaNome: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },

  strutturaCount: {
    fontSize: 11,
    color: "#666",
  },

  strutturaTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2196F3",
  },

  filtersSection: {
    marginBottom: 16,
  },

  filtersSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  filtersSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a1a1a",
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  clearFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  clearFilterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F44336",
  },

  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
  },

  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  filterButtonActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },

  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },

  filterTextActive: {
    color: "white",
  },

  strutturaFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    gap: 8,
  },

  strutturaFilterDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  strutturaFilterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },

  strutturaFilterTextActive: {
    color: "white",
  },

  strutturaFilterBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  strutturaFilterBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },

  strutturaFilterBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
  },

  strutturaFilterBadgeTextActive: {
    color: "white",
  },

  activeFilters: {
    backgroundColor: "#E3F2FD",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
  },

  activeFiltersLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 8,
  },

  activeFiltersChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },

  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2196F3",
  },

  filteredSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 12,
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

  filteredCount: {
    fontSize: 12,
    color: "#999",
  },

  transactionsContainer: {
    paddingHorizontal: 16,
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
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    gap: 4,
  },

  bookingDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  bookingDetailText: {
    fontSize: 11,
    color: "#666",
    flex: 1,
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
