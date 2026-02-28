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
import { useContext, useState, useEffect, useMemo, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import API_URL from "../../config/api";
import { PieChart } from "react-native-chart-kit";
import { BarChart } from "react-native-gifted-charts";
import FilterModal from "../../components/FilterModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Earning {
  type: "booking" | "refund" | "cancellation_penalty";
  amount: number;
  description?: string;
  createdAt?: string;
  date?: string;
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

interface ResolvedStruttura {
  id: string;
  name: string;
  address?: string;
}

interface OwnerStrutturaOption {
  id: string;
  name: string;
}

interface OwnerBooking {
  id?: string;
  _id?: string;
  status?: string;
  price?: number;
  startTime?: string;
  endTime?: string;
  ownerEarnings?: number;
  refundAmount?: number;
  refundedAt?: string;
  date?: string;
  startDate?: string;
  bookingDate?: string;
  createdAt?: string;
  user?: {
    name?: string;
    surname?: string;
    username?: string;
  };
  payments?: Array<{ status?: string }>;
  campo?: {
    name?: string;
    struttura?:
      | string
      | {
          id?: string;
          _id?: string;
          name?: string;
          address?: string;
        };
  };
}

export default function EarningsStatsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { token } = useContext(AuthContext);
  const periodOptions = [7, 14, 30, 60, 90] as const;

  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "booking" | "refund">("all");
  const [selectedStruttura, setSelectedStruttura] = useState<string | null>(null);
  const [selectedPeriodDays, setSelectedPeriodDays] = useState<(typeof periodOptions)[number]>(30);
  const [showCharts, setShowCharts] = useState(true);
  const [showTransactions, setShowTransactions] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState<"struttura" | "periodo" | null>(null);
  const [ownerStrutture, setOwnerStrutture] = useState<OwnerStrutturaOption[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<OwnerBooking[]>([]);

  const resolveStruttura = useCallback((earning: any): ResolvedStruttura | null => {
    const raw = earning?.bookingDetails?.struttura;
    if (!raw) return null;

    if (typeof raw === "string") {
      return {
        id: raw,
        name: earning?.bookingDetails?.strutturaName || "Struttura",
      };
    }

    if (typeof raw === "object") {
      const rawId = raw.id ?? raw._id;
      if (!rawId) return null;

      const rawName =
        raw.name ??
        raw.strutturaName ??
        earning?.bookingDetails?.strutturaName ??
        "Struttura";

      return {
        id: String(rawId),
        name: String(rawName),
        address: raw.address,
      };
    }

    return null;
  }, []);

  const normalizeEarningsData = (payload: any): EarningsData => {
    const direct = payload && typeof payload === "object" ? payload : {};
    const nested = direct.data && typeof direct.data === "object" ? direct.data : {};

    const totalRaw =
      direct.totalEarnings ??
      nested.totalEarnings ??
      direct.total ??
      nested.total ??
      0;

    const rawEarnings =
      direct.earnings ??
      nested.earnings ??
      direct.transactions ??
      nested.transactions ??
      [];

    const earningsArray = Array.isArray(rawEarnings)
      ? rawEarnings
          .filter((item: any) => item != null && typeof item === "object")
          .map((item: any) => {
            const strutturaRaw = item?.bookingDetails?.struttura;
            const normalizedStruttura =
              typeof strutturaRaw === "object" && strutturaRaw
                ? {
                    ...strutturaRaw,
                    id: String(strutturaRaw?.id ?? strutturaRaw?._id ?? ""),
                    name:
                      strutturaRaw?.name ??
                      strutturaRaw?.strutturaName ??
                      item?.bookingDetails?.strutturaName ??
                      "Struttura",
                  }
                : strutturaRaw;

            return {
              ...item,
              amount: Number(item?.amount ?? 0) || 0,
              bookingDetails: item?.bookingDetails
                ? {
                    ...item.bookingDetails,
                    struttura: normalizedStruttura,
                  }
                : item?.bookingDetails,
            };
          })
      : [];

    return {
      totalEarnings: Number(totalRaw ?? 0) || 0,
      earnings: earningsArray,
    };
  };

  const parseEarningDate = useCallback((earning: Earning): Date | null => {
    const candidates = [
      earning?.createdAt,
      earning?.bookingDetails?.date,
      earning?.date,
    ].filter(Boolean) as string[];

    for (const raw of candidates) {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  }, []);

  useEffect(() => {
    const routeEarnings = route?.params?.earnings;
    if (routeEarnings) {
      setEarningsData(normalizeEarningsData(routeEarnings));
      setLoading(false);
    }

    if (!token) {
      setLoading(false);
      return;
    }

    loadOwnerStrutture();
    loadOwnerBookings();
    loadEarnings();
  }, [token, route?.params?.earnings]);

  const loadOwnerBookings = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/bookings/owner`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error loading owner bookings:", res.status, errorText);
        return;
      }

      const data = await res.json();
      setOwnerBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading owner bookings:", error);
    }
  };

  const loadOwnerStrutture = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/strutture/owner/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error loading owner strutture:", res.status, errorText);
        return;
      }

      const data = await res.json();
      const normalized = Array.isArray(data)
        ? data
            .filter((item: any) => item && typeof item === "object")
            .map((item: any) => {
              const rawId = item.id ?? item._id;
              const rawName = item.name ?? item.title ?? "Struttura";
              return {
                id: String(rawId ?? ""),
                name: String(rawName),
              };
            })
            .filter((item) => item.id)
            .sort((a, b) => a.name.localeCompare(b.name, "it"))
        : [];

      setOwnerStrutture(normalized);
    } catch (error) {
      console.error("Error loading owner strutture:", error);
    }
  };

  const loadEarnings = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/users/me/earnings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setEarningsData(normalizeEarningsData(data));
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

  const allEarnings = useMemo(
    () => (Array.isArray(earningsData?.earnings) ? earningsData.earnings : []),
    [earningsData]
  );

  const safeAllEarnings = useMemo(() => (Array.isArray(allEarnings) ? allEarnings : []), [allEarnings]);

  const periodStart = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - (selectedPeriodDays - 1));
    return start;
  }, [selectedPeriodDays]);

  const baseFilteredEarnings = useMemo(() => {
    const now = new Date();
    const periodFiltered = safeAllEarnings.filter((earning) => {
      const earningDate = parseEarningDate(earning);
      if (!earningDate) return false;
      return earningDate >= periodStart && earningDate <= now;
    });

    if (!selectedStruttura) return periodFiltered;

    return periodFiltered.filter((earning) => {
      const struttura = resolveStruttura(earning);
      return struttura?.id === selectedStruttura;
    });
  }, [safeAllEarnings, periodStart, selectedStruttura, resolveStruttura, parseEarningDate]);

  const safeBaseFilteredEarnings = useMemo(
    () => (Array.isArray(baseFilteredEarnings) ? baseFilteredEarnings : []),
    [baseFilteredEarnings]
  );

  const parseBookingDate = useCallback((booking: OwnerBooking): Date | null => {
    const rawDate = booking.date || booking.startDate || booking.bookingDate || booking.createdAt;
    if (!rawDate) return null;

    if (typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      const [year, month, day] = rawDate.split("-").map(Number);
      return new Date(year, month - 1, day);
    }

    const parsed = new Date(rawDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, []);

  const resolveBookingStrutturaId = useCallback((booking: OwnerBooking): string | null => {
    const raw = booking?.campo?.struttura;
    if (!raw) return null;
    if (typeof raw === "string") return raw;
    return String(raw.id ?? raw._id ?? "") || null;
  }, []);

  const getBookingAmount = useCallback(
    (booking: OwnerBooking): number => Number(booking.ownerEarnings ?? booking.price ?? 0) || 0,
    []
  );

  const getRefundAmount = useCallback(
    (booking: OwnerBooking): number => {
      if (typeof booking.refundAmount === "number") {
        return Math.max(0, booking.refundAmount);
      }
      return getBookingAmount(booking);
    },
    [getBookingAmount]
  );

  const isRefundedBooking = useCallback((booking: OwnerBooking): boolean => {
    const status = String(booking.status || "").toLowerCase();
    const payments = Array.isArray(booking.payments) ? booking.payments : [];
    const hasRefundedPayment = payments.some((payment: any) => {
      const paymentStatus = String(payment?.status || "").toLowerCase();
      return paymentStatus === "refunded" || paymentStatus === "partial_refunded";
    });

    return (
      status === "cancelled" ||
      status === "canceled" ||
      hasRefundedPayment ||
      booking.refundedAt != null ||
      booking.refundAmount != null
    );
  }, []);

  const periodFinancialStats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const periodBookings = ownerBookings.filter((booking) => {
      const bookingDate = parseBookingDate(booking);
      if (!bookingDate) return false;
      const inRange = bookingDate >= periodStart && bookingDate < tomorrow;
      if (!inRange) return false;

      if (!selectedStruttura) return true;
      return resolveBookingStrutturaId(booking) === selectedStruttura;
    });

    let grossIncome = 0;
    let refunds = 0;
    let refundCount = 0;
    let incomeCount = 0;

    for (const booking of periodBookings) {
      const status = String(booking.status || "").toLowerCase();
      if (status !== "cancelled" && status !== "canceled") {
        grossIncome += getBookingAmount(booking);
        incomeCount++;
      }

      if (isRefundedBooking(booking)) {
        refunds += getRefundAmount(booking);
        refundCount++;
      }
    }

    return {
      grossIncome,
      refunds,
      netIncome: grossIncome - refunds,
      refundCount,
      incomeCount,
    };
  }, [
    ownerBookings,
    parseBookingDate,
    periodStart,
    selectedStruttura,
    resolveBookingStrutturaId,
    getBookingAmount,
    isRefundedBooking,
    getRefundAmount,
  ]);

  const availableStrutture = useMemo(() => {
    if (ownerStrutture.length > 0) {
      return ownerStrutture;
    }

    const map = new Map<string, string>();

    for (const earning of safeAllEarnings) {
      const struttura = resolveStruttura(earning);
      if (struttura?.id) {
        map.set(struttura.id, struttura.name);
      }
    }

    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "it"));
  }, [ownerStrutture, safeAllEarnings, resolveStruttura]);

  const selectedStrutturaLabel = useMemo(() => {
    if (!selectedStruttura) return "Tutte";
    return availableStrutture.find((item) => item.id === selectedStruttura)?.name || "Tutte";
  }, [selectedStruttura, availableStrutture]);

  const selectedPeriodLabel = useMemo(() => `Ultimi ${selectedPeriodDays} giorni`, [selectedPeriodDays]);

  const bookingTransactions = useMemo((): Earning[] => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const transactions: Earning[] = [];

    for (const booking of ownerBookings) {
      const bookingDate = parseBookingDate(booking);
      if (!bookingDate) continue;

      const inRange = bookingDate >= periodStart && bookingDate < tomorrow;
      if (!inRange) continue;

      const strutturaId = resolveBookingStrutturaId(booking);
      if (selectedStruttura && strutturaId !== selectedStruttura) continue;

      const rawStruttura = booking?.campo?.struttura;
      const strutturaObj =
        rawStruttura && typeof rawStruttura === "object"
          ? {
              id: String(rawStruttura.id ?? rawStruttura._id ?? ""),
              name: rawStruttura.name || "Struttura",
              address: rawStruttura.address || "",
            }
          : undefined;

      const bookingDetails = {
        date:
          booking.date ||
          booking.startDate ||
          booking.bookingDate ||
          bookingDate.toISOString().slice(0, 10),
        startTime: booking.startTime || "--:--",
        endTime: booking.endTime || "--:--",
        price: Number(booking.price ?? booking.ownerEarnings ?? 0) || 0,
        status: booking.status || "unknown",
        campo: booking.campo?.name || "Campo",
        struttura: strutturaObj && strutturaObj.id ? strutturaObj : undefined,
        user: {
          name: booking.user?.name || "Utente",
          surname: booking.user?.surname || "",
          username: booking.user?.username || "",
        },
      };

      const status = String(booking.status || "").toLowerCase();
      const grossAmount = status !== "cancelled" && status !== "canceled" ? getBookingAmount(booking) : 0;
      const refundAmount = isRefundedBooking(booking) ? getRefundAmount(booking) : 0;
      const netAmount = Math.max(0, grossAmount - refundAmount);

      if (netAmount > 0) {
        transactions.push({
          type: "booking",
          amount: netAmount,
          description: "Incasso netto prenotazione",
          createdAt: booking.createdAt || bookingDate.toISOString(),
          bookingDetails,
        });
      }

      if (refundAmount > 0) {
        transactions.push({
          type: "refund",
          amount: -refundAmount,
          description: "Rimborso prenotazione",
          createdAt: booking.createdAt || bookingDate.toISOString(),
          bookingDetails,
        });
      }
    }

    return transactions.sort((a, b) => {
      const aTs = parseEarningDate(a)?.getTime() ?? 0;
      const bTs = parseEarningDate(b)?.getTime() ?? 0;
      return bTs - aTs;
    });
  }, [
    ownerBookings,
    parseBookingDate,
    periodStart,
    selectedStruttura,
    resolveBookingStrutturaId,
    getBookingAmount,
    isRefundedBooking,
    getRefundAmount,
    parseEarningDate,
  ]);

  // Calcola storico transazioni filtrate per tipo
  const filteredEarnings = useMemo(() => {
    if (filter === "all") return [...bookingTransactions];
    return bookingTransactions.filter((e) => e.type === filter);
  }, [bookingTransactions, filter]);

  // Calcola dati grafico incassi giornalieri nel periodo selezionato
  const weeklyData = useMemo((): WeeklyData => {
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const start = new Date(end);
    start.setDate(start.getDate() - (selectedPeriodDays - 1));

    const dailyTotals = new Map<string, number>();
    const labels: string[] = [];

    for (let i = 0; i < selectedPeriodDays; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(
        current.getDate()
      ).padStart(2, "0")}`;
      dailyTotals.set(key, 0);
      labels.push(
        current.toLocaleDateString("it-IT", {
          day: "2-digit",
          month: "2-digit",
        })
      );
    }

    for (const booking of ownerBookings) {
      const bookingDate = parseBookingDate(booking);
      if (!bookingDate) continue;

      const bookingDay = new Date(
        bookingDate.getFullYear(),
        bookingDate.getMonth(),
        bookingDate.getDate()
      );

      if (bookingDay < start || bookingDay > end) continue;

      if (selectedStruttura && resolveBookingStrutturaId(booking) !== selectedStruttura) continue;

      const status = String(booking.status || "").toLowerCase();
      if (status === "cancelled" || status === "canceled") continue;

      const dayKey = `${bookingDay.getFullYear()}-${String(bookingDay.getMonth() + 1).padStart(2, "0")}-${String(
        bookingDay.getDate()
      ).padStart(2, "0")}`;

      const currentTotal = dailyTotals.get(dayKey) ?? 0;
      dailyTotals.set(dayKey, currentTotal + getBookingAmount(booking));
    }

    return {
      labels,
      values: Array.from(dailyTotals.values()),
    };
  }, [
    selectedPeriodDays,
    ownerBookings,
    parseBookingDate,
    selectedStruttura,
    resolveBookingStrutturaId,
    getBookingAmount,
  ]);

  const WEEKLY_BAR_WIDTH = 20;
  const WEEKLY_SPACING = 18;
  const WEEKLY_NO_OF_SECTIONS = 5;
  const WEEKLY_CHART_HEIGHT = 200;

  const weeklyMaxValue = useMemo(
    () => weeklyData.values.reduce((max, value) => Math.max(max, value), 0),
    [weeklyData.values]
  );

  const weeklyAxisMax = useMemo(() => {
    if (weeklyMaxValue <= 0) return WEEKLY_NO_OF_SECTIONS;
    return Math.ceil(weeklyMaxValue / WEEKLY_NO_OF_SECTIONS) * WEEKLY_NO_OF_SECTIONS;
  }, [weeklyMaxValue]);

  const weeklyYAxisLabels = useMemo(() => {
    const step = weeklyAxisMax / WEEKLY_NO_OF_SECTIONS;
    return Array.from({ length: WEEKLY_NO_OF_SECTIONS + 1 }, (_, index) =>
      Math.round(weeklyAxisMax - step * index)
    );
  }, [weeklyAxisMax]);

  const weeklyViewportWidth = SCREEN_WIDTH - 120;
  const weeklyContentWidth = weeklyData.values.length * (WEEKLY_BAR_WIDTH + WEEKLY_SPACING) + 24;
  const weeklyChartWidth = Math.max(weeklyViewportWidth + 24, weeklyContentWidth);

  const weeklyChartKey = useMemo(
    () => `${selectedPeriodDays}-${selectedStruttura ?? "all"}-${weeklyData.values.join("|")}`,
    [selectedPeriodDays, selectedStruttura, weeklyData.values]
  );

  const weeklyChartData = useMemo(
    () =>
      weeklyData.values
        .map((value, index) => ({
          value,
          label: weeklyData.labels[index],
        }))
        .filter((item) => item.value > 0),
    [weeklyData.values, weeklyData.labels]
  );

  // Calcola statistiche per struttura
  const struttureStats = useMemo((): StrutturaStats[] => {
    const struttureMap: { [id: string]: StrutturaStats } = {};
    const colors = ["#2196F3", "#4CAF50", "#FF9800", "#9C27B0", "#F44336", "#00BCD4", "#FFC107"];
    let colorIndex = 0;

    for (const earning of safeBaseFilteredEarnings) {
      const struttura = resolveStruttura(earning);
      if (struttura && struttura.id && earning.type === "booking") {
        const { id, name } = struttura;
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
    }

    return Object.values(struttureMap).sort((a, b) => b.total - a.total);
  }, [safeBaseFilteredEarnings, resolveStruttura]);

  const totalFiltered = useMemo(
    () => filteredEarnings.reduce((sum, e) => sum + e.amount, 0),
    [filteredEarnings]
  );

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
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filtri</Text>
          <View style={styles.singleFiltersRow}>
            <Pressable
              style={({ pressed }) => [
                styles.singleFilterChip,
                selectedStruttura && styles.filterChipActive,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => {
                setActiveFilterType("struttura");
                setFilterModalVisible(true);
              }}
            >
              <View style={styles.singleFilterChipLeft}>
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={selectedStruttura ? "white" : "#2196F3"}
                />
                <Text
                  style={[
                    styles.singleFilterChipText,
                    selectedStruttura && styles.filterChipTextActive,
                  ]}
                >
                  Struttura: {selectedStrutturaLabel}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={18}
                color={selectedStruttura ? "white" : "#2196F3"}
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.singleFilterChip,
                selectedPeriodDays !== 30 && styles.filterChipActive,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => {
                setActiveFilterType("periodo");
                setFilterModalVisible(true);
              }}
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

        {/* Summary Tiles */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryTile}>
            <View style={styles.summaryTileHeader}>
              <Ionicons name="trending-up" size={18} color="#4CAF50" />
              <Text style={styles.summaryTileLabel}>Incassi</Text>
            </View>
            <Text style={[styles.summaryTileValue, { color: "#4CAF50" }]}>
              € {periodFinancialStats.netIncome.toFixed(2)}
            </Text>
            <Text style={styles.summaryTileSubtext}>
              Netti (lordi € {periodFinancialStats.grossIncome.toFixed(2)} - rimborsi)
            </Text>
          </View>

          <View style={styles.summaryTile}>
            <View style={styles.summaryTileHeader}>
              <Ionicons name="return-down-back" size={18} color="#F44336" />
              <Text style={styles.summaryTileLabel}>Rimborsi</Text>
            </View>
            <Text style={[styles.summaryTileValue, { color: "#F44336" }]}>
              € {periodFinancialStats.refunds.toFixed(2)}
            </Text>
            <Text style={styles.summaryTileSubtext}>
              {periodFinancialStats.refundCount} rimborsi nel periodo
            </Text>
          </View>
        </View>

        {/* Grafici Section */}
        <View style={styles.accordionCard}>
          <Pressable
            style={({ pressed }) => [
              styles.accordionHeader,
              showCharts && styles.accordionHeaderExpanded,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => setShowCharts((prev) => !prev)}
            hitSlop={6}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="bar-chart" size={20} color="#2196F3" />
              <Text style={styles.sectionTitle}>Grafici e Statistiche</Text>
            </View>
            <Ionicons
              name={showCharts ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </Pressable>

          {showCharts && (
            <View style={styles.accordionContent}>
            {/* Grafico Andamento Settimanale */}
            {weeklyData.labels.length > 0 && (
              <View style={styles.chartSectionLikeOwnerStats}>
                <Text style={styles.chartTitleLikeOwnerStats}>Andamento Settimanale</Text>
                <Text style={styles.chartSubtitleLikeOwnerStats}>Distribuzione settimanale • {selectedPeriodLabel}</Text>

                {weeklyData.values.some((v) => v > 0) ? (
                  <View style={styles.giftedChartContainerLikeOwnerStats}>
                    <View style={styles.hourlyChartRowLikeOwnerStats}>
                      <View style={styles.hourlyYAxisColumnLikeOwnerStats}>
                        <View style={[styles.hourlyYAxisLabelsContainerLikeOwnerStats, { height: WEEKLY_CHART_HEIGHT }]}> 
                          {weeklyYAxisLabels.map((tick, index) => (
                            <Text key={`weekly-tick-${index}`} style={styles.hourlyYAxisLabelLikeOwnerStats}>
                              €{tick}
                            </Text>
                          ))}
                        </View>
                        <View style={styles.hourlyXAxisSpacerLikeOwnerStats} />
                      </View>

                      <View style={styles.hourlyScrollableAreaLikeOwnerStats}>
                        <ScrollView
                          horizontal
                          nestedScrollEnabled
                          directionalLockEnabled
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.weeklyChartScrollContentLikeOwnerStats}
                        >
                          <BarChart
                            key={weeklyChartKey}
                            data={weeklyChartData.map((item) => ({
                              value: item.value,
                              label: item.label,
                              frontColor: "#2196F3",
                            }))}
                            width={weeklyChartWidth}
                            height={WEEKLY_CHART_HEIGHT}
                            barWidth={WEEKLY_BAR_WIDTH}
                            spacing={WEEKLY_SPACING}
                            maxValue={weeklyAxisMax}
                            noOfSections={WEEKLY_NO_OF_SECTIONS}
                            yAxisThickness={0}
                            yAxisLabelWidth={0}
                            xAxisThickness={1}
                            xAxisColor="#E0E0E0"
                            xAxisLabelTextStyle={{ color: "#666", fontSize: 11, fontWeight: "600" }}
                            isAnimated
                            animationDuration={300}
                            showGradient={false}
                            roundedTop
                            hideRules
                            disableScroll
                          />
                        </ScrollView>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyChartLikeOwnerStats}>
                    <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyChartTextLikeOwnerStats}>Nessun dato disponibile</Text>
                  </View>
                )}
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
            </View>
          )}
        </View>

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
        <View style={styles.accordionCard}>
          <Pressable
            style={({ pressed }) => [
              styles.accordionHeader,
              showTransactions && styles.accordionHeaderExpanded,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => setShowTransactions((prev) => !prev)}
            hitSlop={6}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="list" size={20} color="#2196F3" />
              <Text style={styles.sectionTitle}>Storico Transazioni</Text>
            </View>
            <Ionicons
              name={showTransactions ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </Pressable>

          {showTransactions && (
            <View style={styles.accordionContent}>
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
            </View>
          )}
          </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <FilterModal
        visible={filterModalVisible}
        title={activeFilterType === "struttura" ? "Seleziona Struttura" : "Seleziona Periodo"}
        onClose={() => setFilterModalVisible(false)}
        contentScrollable
        searchable={activeFilterType === "struttura"}
        searchPlaceholder={activeFilterType === "struttura" ? "Cerca struttura..." : ""}
      >
        {(search) => (
          <>
            {activeFilterType === "struttura" && (
              <Pressable
                style={({ pressed }) => [
                  styles.filterModalOption,
                  styles.filterModalOptionWithBorder,
                  pressed && { backgroundColor: "#E3F2FD" },
                ]}
                onPress={() => {
                  setSelectedStruttura(null);
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.filterModalOptionText}>✨ Tutte</Text>
              </Pressable>
            )}

            {activeFilterType === "struttura"
              ? availableStrutture
                  .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
                  .map((item, index, arr) => (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [
                        styles.filterModalOption,
                        index < arr.length - 1 && styles.filterModalOptionWithBorder,
                        pressed && { backgroundColor: "#E3F2FD" },
                      ]}
                      onPress={() => {
                        setSelectedStruttura(item.id);
                        setFilterModalVisible(false);
                      }}
                    >
                      <View style={styles.filterModalRow}>
                        <Ionicons name="business-outline" size={16} color="#2196F3" />
                        <Text style={styles.filterModalOptionText}>{item.name}</Text>
                      </View>
                    </Pressable>
                  ))
              : periodOptions.map((days, index) => (
                  <Pressable
                    key={days}
                    style={({ pressed }) => [
                      styles.filterModalOption,
                      index < periodOptions.length - 1 && styles.filterModalOptionWithBorder,
                      pressed && { backgroundColor: "#E3F2FD" },
                    ]}
                    onPress={() => {
                      setSelectedPeriodDays(days);
                      setFilterModalVisible(false);
                    }}
                  >
                    <View style={styles.filterModalRow}>
                      <Ionicons name="calendar-outline" size={16} color="#2196F3" />
                      <Text style={styles.filterModalOptionText}>Ultimi {days} giorni</Text>
                    </View>
                  </Pressable>
                ))}
          </>
        )}
      </FilterModal>
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

  summaryGrid: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    flexDirection: "row",
    gap: 12,
  },

  summaryTile: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  summaryTileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },

  summaryTileLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "700",
  },

  summaryTileValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },

  summaryTileSubtext: {
    fontSize: 11,
    color: "#999",
    lineHeight: 15,
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

  section: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  accordionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },

  accordionHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  accordionContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    marginBottom: 12,
    padding: 0,
    borderRadius: 16,
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

  chartSectionLikeOwnerStats: {
    marginTop: 4,
    marginBottom: 8,
  },

  chartTitleLikeOwnerStats: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },

  chartSubtitleLikeOwnerStats: {
    fontSize: 13,
    color: "#666",
    marginBottom: 16,
    fontWeight: "500",
  },

  giftedChartContainerLikeOwnerStats: {
    backgroundColor: "white",
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 20,
    paddingHorizontal: 10,
    overflow: "hidden",
  },

  weeklyChartScrollContentLikeOwnerStats: {
    paddingRight: 0,
  },

  hourlyChartRowLikeOwnerStats: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  hourlyYAxisColumnLikeOwnerStats: {
    width: 36,
    marginRight: 8,
  },

  hourlyYAxisLabelsContainerLikeOwnerStats: {
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 4,
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
  },

  hourlyYAxisLabelLikeOwnerStats: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },

  hourlyXAxisSpacerLikeOwnerStats: {
    height: 22,
  },

  hourlyScrollableAreaLikeOwnerStats: {
    flex: 1,
  },

  emptyChartLikeOwnerStats: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyChartTextLikeOwnerStats: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
    fontWeight: "600",
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

  filterChipActive: {
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

  filterChipTextActive: {
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
    paddingHorizontal: 0,
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

  filterModalOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "white",
  },

  filterModalOptionWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  filterModalOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },

  filterModalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
