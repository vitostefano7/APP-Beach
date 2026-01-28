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
import { useContext, useState, useCallback, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { BarChart, LineChart } from "react-native-gifted-charts";
import { Picker } from '@react-native-picker/picker';
import { Platform } from 'react-native';
import API_URL from "../../config/api";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface Booking {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  user: {
    _id: string;
    name: string;
    surname?: string;
  };
  campo: {
    struttura: {
      _id: string;
      name: string;
    };
  };
}

interface Struttura {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  name: string;
  surname?: string;
}

export default function OwnerStatisticsScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [strutture, setStrutture] = useState<Struttura[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [selectedStruttura, setSelectedStruttura] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");

  // Carica dati
  const loadData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      const [bookingsRes, struttureRes] = await Promise.all([
        fetch(`${API_URL}/bookings/owner`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/strutture/owner/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (bookingsRes.ok && struttureRes.ok) {
        const bookingsData = await bookingsRes.json();
        const struttureData = await struttureRes.json();

        setBookings(bookingsData);
        setStrutture(struttureData);

        // Estrai utenti unici dalle prenotazioni
        const uniqueUsers = Array.from(
          new Map(
            bookingsData
              .filter((b: Booking) => b.user)
              .map((b: Booking) => [b.user._id, b.user])
          ).values()
        ) as User[];

        setUsers(uniqueUsers);
      }
    } catch (err) {
      console.error("Errore caricamento statistiche:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtra prenotazioni
  const filteredBookings = bookings.filter((b) => {
    if (selectedStruttura !== "all" && b.campo?.struttura?._id !== selectedStruttura) {
      return false;
    }
    if (selectedUser !== "all" && b.user?._id !== selectedUser) {
      return false;
    }
    return true;
  });

  // Calcola statistiche orarie per settimana
  const getHourlyStats = () => {
    const hourlyData = new Array(24).fill(0);

    filteredBookings.forEach((booking) => {
      try {
        const hour = parseInt(booking.startTime.split(":")[0]);
        if (hour >= 0 && hour < 24) {
          hourlyData[hour]++;
        }
      } catch (e) {
        console.log("Errore parsing ora:", e);
      }
    });

    return hourlyData;
  };

  // Calcola statistiche giornaliere per settimana
  const getWeeklyStats = () => {
    const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
    const weeklyData = new Array(7).fill(0);

    filteredBookings.forEach((booking) => {
      try {
        const date = new Date(booking.date + "T12:00:00");
        const dayOfWeek = (date.getDay() + 6) % 7; // Lunedì = 0
        weeklyData[dayOfWeek]++;
      } catch (e) {
        console.log("Errore parsing data:", e);
      }
    });

    return { labels: weekDays, data: weeklyData };
  };

  const hourlyStats = getHourlyStats();
  const weeklyStats = getWeeklyStats();

  // Top 5 ore più prenotate
  const topHours = hourlyStats
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento statistiche...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2196F3" />
          </Pressable>
          <Text style={styles.headerTitle}>Statistiche Dettagliate</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* FILTRO STRUTTURE */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filtra per Struttura</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <Pressable
              style={[
                styles.filterChip,
                selectedStruttura === "all" && styles.filterChipActive,
              ]}
              onPress={() => setSelectedStruttura("all")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStruttura === "all" && styles.filterChipTextActive,
                ]}
              >
                Tutte
              </Text>
            </Pressable>

            {strutture.map((struttura) => (
              <Pressable
                key={struttura._id}
                style={[
                  styles.filterChip,
                  selectedStruttura === struttura._id && styles.filterChipActive,
                ]}
                onPress={() => setSelectedStruttura(struttura._id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStruttura === struttura._id &&
                      styles.filterChipTextActive,
                  ]}
                >
                  {struttura.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* FILTRO UTENTI (DROPDOWN) */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filtra per Cliente</Text>
          <View style={styles.pickerModernWrapper}>
            <Picker
              selectedValue={selectedUser}
              onValueChange={(itemValue) => setSelectedUser(itemValue)}
              style={styles.pickerModern}
              dropdownIconColor="#2196F3"
              mode="dropdown"
              itemStyle={{ fontWeight: '600' }}
            >
              <Picker.Item label="Tutti" value="all" color="#2196F3" style={{fontWeight:'700'}} />
                {users.map((user) => {
                  let label = `${user.name}${user.surname ? ' ' + user.surname : ''}`;
                  if (label.length > 28) label = label.slice(0, 25) + '...';
                  return (
                    <Picker.Item
                      key={user._id}
                      label={label}
                      value={user._id}
                      color="#1a1a1a"
                    />
                  );
                })}
            </Picker>
            <Ionicons name="chevron-down" size={20} color="#2196F3" style={styles.pickerIcon} pointerEvents="none" />
          </View>
        </View>

        {/* STATISTICHE TOTALI */}
        <View style={styles.statsCards}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={28} color="#2196F3" />
            <Text style={styles.statValue}>{filteredBookings.length}</Text>
            <Text style={styles.statLabel}>Prenotazioni</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="time" size={28} color="#4CAF50" />
            <Text style={styles.statValue}>
              {topHours[0]?.count || 0}
            </Text>
            <Text style={styles.statLabel}>Ora di punta</Text>
          </View>
        </View>

        {/* GRAFICO SETTIMANALE */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Prenotazioni per Giorno</Text>
          <Text style={styles.chartSubtitle}>Distribuzione settimanale</Text>

          {weeklyStats.data.some((v) => v > 0) ? (
            <View style={styles.giftedChartContainer}>
              <BarChart
                data={weeklyStats.data.map((value, index) => ({
                  value,
                  label: weeklyStats.labels[index],
                  frontColor: "#2196F3",
                  topLabelComponent: () => (
                    <Text style={{ fontSize: 11, color: "#2196F3", fontWeight: "700" }}>
                      {value}
                    </Text>
                  ),
                }))}
                width={SCREEN_WIDTH - 80}
                height={200}
                barWidth={32}
                spacing={18}
                noOfSections={5}
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor="#E0E0E0"
                yAxisTextStyle={{ color: "#666", fontSize: 11 }}
                xAxisLabelTextStyle={{ color: "#666", fontSize: 11, fontWeight: "600" }}
                isAnimated
                animationDuration={300}
                showGradient={false}
                roundedTop
                hideRules
              />
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
              <Text style={styles.emptyChartText}>Nessun dato disponibile</Text>
            </View>
          )}
        </View>

        {/* GRAFICO ORARIO */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Prenotazioni per Ora</Text>
          <Text style={styles.chartSubtitle}>Distribuzione nelle 24 ore</Text>

          {hourlyStats.some((v) => v > 0) ? (
            <View style={styles.giftedChartContainer}>
              <LineChart
                data={hourlyStats.map((value, hour) => ({
                  value,
                  label: hour % 4 === 0 ? hour.toString() : "",
                }))}
                width={SCREEN_WIDTH - 80}
                height={200}
                spacing={14}
                color="#4CAF50"
                thickness={3}
                noOfSections={5}
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor="#E0E0E0"
                yAxisTextStyle={{ color: "#666", fontSize: 11 }}
                xAxisLabelTextStyle={{ color: "#666", fontSize: 11 }}
                isAnimated
                animationDuration={500}
                curved
                hideRules
                dataPointsColor="#4CAF50"
                dataPointsRadius={4}
                startFillColor="rgba(76, 175, 80, 0.2)"
                endFillColor="rgba(76, 175, 80, 0.05)"
                startOpacity={0.9}
                endOpacity={0.2}
                areaChart
              />
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="stats-chart-outline" size={48} color="#ccc" />
              <Text style={styles.emptyChartText}>Nessun dato disponibile</Text>
            </View>
          )}
        </View>

        {/* TOP 5 ORE */}
        <View style={styles.topSection}>
          <Text style={styles.topTitle}>Top 5 Fasce Orarie</Text>
          {topHours.map((item, index) => (
            <View key={index} style={styles.topItem}>
              <View style={styles.topRank}>
                <Text style={styles.topRankText}>{index + 1}</Text>
              </View>
              <Text style={styles.topHour}>
                {item.hour.toString().padStart(2, "0")}:00 - {(item.hour + 1).toString().padStart(2, "0")}:00
              </Text>
              <Text style={styles.topCount}>{item.count} prenotazioni</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },

  loadingText: {
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

  filterScroll: {
    flexDirection: "row",
  },

  filterChip: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },

  filterChipActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },

  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },

  filterChipTextActive: {
    color: "white",
  },

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

  chartSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },

  chartTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },

  chartSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 16,
    fontWeight: "500",
  },

  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },

  giftedChartContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    marginVertical: 8,
    paddingVertical: 20,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  victoryChartContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  pickerModernWrapper: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B3D7F6',
    marginTop: 4,
    marginBottom: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 2 : 0,
    minWidth: 220,
    width: '100%',
    maxWidth: 500,
  },
  pickerModern: {
    flex: 1,
    height: 48,
    color: '#1a1a1a',
    fontWeight: '600',
    backgroundColor: 'transparent',
    fontSize: 17,
    paddingLeft: 8,
    marginLeft: 0,
    minWidth: 180,
    maxWidth: 400,
  },
  pickerIcon: {
    marginLeft: -24,
    marginRight: 4,
    position: 'absolute',
    right: 8,
    top: 12,
    zIndex: 1,
    pointerEvents: 'none',
  },
  emptyChart: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyChartText: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
    fontWeight: "600",
  },

  topSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },

  topTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 12,
  },

  topItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  topRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  topRankText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },

  topHour: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  topCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
});
