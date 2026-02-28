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
import { useContext, useState, useCallback, useEffect, useMemo } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { BarChart } from "react-native-gifted-charts";
import API_URL from "../../../config/api";
import { useOwnerDashboardStats } from "../../../hooks/useOwnerDashboardStats";
import FilterModal from "../../../components/FilterModal";
import SportIcon from "../../../components/SportIcon";
import { OwnerStatsHeader } from "./components/OwnerStatsHeader";
import { OwnerStatsFilters } from "./components/OwnerStatsFilters";
import { OwnerStatsSummaryCards } from "./components/OwnerStatsSummaryCards";
import { OwnerStatsTopHoursSection } from "./components/OwnerStatsTopHoursSection";
import { OwnerStatsTopUsersSection } from "./components/OwnerStatsTopUsersSection";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface Booking {
  _id?: string;
  id?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  duration?: number;
  price?: number;
  user?: {
    _id: string;
    name: string;
    surname?: string;
    avatarUrl?: string;
  };
  campo?: {
    struttura?: {
      _id?: string;
      name?: string;
    };
  };
}

interface Struttura {
  _id: string;
  name: string;
}

interface Campo {
  _id: string;
  name: string;
  struttura: string;
  sport?: string | { _id: string; name: string; [key: string]: any };
  type?: string | { _id: string; name: string; [key: string]: any };
  weeklySchedule?: any;
}

interface User {
  _id: string;
  name: string;
  surname?: string;
  avatarUrl?: string;
}

type DurationFilter = "all" | 1 | 1.5;

export default function OwnerStatisticsScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const periodOptions = [7, 14, 30, 60, 90] as const;
  const routeStrutturaId = route?.params?.strutturaId as string | undefined;

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [strutture, setStrutture] = useState<Struttura[]>([]);
  const [campi, setCampi] = useState<Campo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [selectedStruttura, setSelectedStruttura] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedPeriodDays, setSelectedPeriodDays] = useState<(typeof periodOptions)[number]>(30);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState<"struttura" | "cliente" | "periodo" | "sport" | null>(null);
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("all");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [expandedSlots, setExpandedSlots] = useState<Record<string, boolean>>({});
  const [expandedTopUsers, setExpandedTopUsers] = useState<Record<string, boolean>>({});
  const [topDurationFilter, setTopDurationFilter] = useState<1 | 1.5>(1);
  const [routeFilterApplied, setRouteFilterApplied] = useState(false);

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

        // Carica campi per ogni struttura in parallelo (necessari per calcolo tasso occupazione)
        const campiChunks = await Promise.all(
          struttureData.map(async (struttura: Struttura) => {
            try {
              const campiRes = await fetch(
                `${API_URL}/campi/owner/struttura/${struttura._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );

              if (!campiRes.ok) return [] as Campo[];
              const campiData = await campiRes.json();
              return Array.isArray(campiData) ? (campiData as Campo[]) : [];
            } catch (err) {
              console.warn(`⚠️ Errore caricamento campi struttura ${struttura._id}:`, err);
              return [] as Campo[];
            }
          })
        );

        const allCampi = campiChunks.flat();
        setCampi(allCampi);

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

  useEffect(() => {
    if (routeFilterApplied) return;
    if (!routeStrutturaId) {
      setRouteFilterApplied(true);
      return;
    }
    if (strutture.length === 0) return;

    if (strutture.some((s) => s._id === routeStrutturaId)) {
      setSelectedStruttura(routeStrutturaId);
    }
    setRouteFilterApplied(true);
  }, [routeFilterApplied, routeStrutturaId, strutture]);

  useEffect(() => {
    if (durationFilter === 1 || durationFilter === 1.5) {
      setTopDurationFilter(durationFilter);
    }
  }, [durationFilter]);

  // Filtra strutture e campi in base ai filtri selezionati
  const dashboardStats = useOwnerDashboardStats({
    bookings,
    strutture,
    campi,
    selectedStruttura,
    selectedUser,
    selectedPeriodDays,
    durationFilter,
    selectedSport,
  });

  const filteredStrutture = Array.isArray(dashboardStats?.filteredStrutture)
    ? dashboardStats.filteredStrutture
    : [];
  const filteredCampi = Array.isArray(dashboardStats?.filteredCampi)
    ? dashboardStats.filteredCampi
    : [];
  const periodFilteredBookings = Array.isArray(dashboardStats?.periodFilteredBookings)
    ? dashboardStats.periodFilteredBookings
    : [];
  const hourlyStats = Array.isArray(dashboardStats?.hourlyStats)
    ? dashboardStats.hourlyStats
    : [];
  const weeklyStats = {
    labels: Array.isArray(dashboardStats?.weeklyStats?.labels)
      ? dashboardStats.weeklyStats.labels
      : [],
    data: Array.isArray(dashboardStats?.weeklyStats?.data)
      ? dashboardStats.weeklyStats.data
      : [],
  };
  const struttureStats = Array.isArray(dashboardStats?.struttureStats)
    ? dashboardStats.struttureStats
    : [];
  const stats = dashboardStats?.ownerStats || {
    tassoOccupazione: 0,
  };


  const selectedUserLabel = useMemo(() => {
    if (selectedUser === "all") return "Tutti";
    const user = users.find((u) => u._id === selectedUser);
    if (!user) return "Tutti";

    const fullName = `${user.name}${user.surname ? " " + user.surname : ""}`;
    return fullName.length > 28 ? `${fullName.slice(0, 25)}...` : fullName;
  }, [selectedUser, users]);

  const selectedStrutturaLabel = useMemo(() => {
    if (selectedStruttura === "all") return "Tutte";
    return strutture.find((s) => s._id === selectedStruttura)?.name || "Tutte";
  }, [selectedStruttura, strutture]);

  const selectedPeriodLabel = useMemo(() => {
    return `Ultimi ${selectedPeriodDays} giorni`;
  }, [selectedPeriodDays]);

  const getSportName = (sport: any): string | undefined => {
    if (!sport) return undefined;
    if (typeof sport === "string") return sport;
    if (typeof sport === "object") return sport.name || sport._id;
    return undefined;
  };

  const availableSports = useMemo(() => {
    const sportsSet = new Set<string>();
    campi.forEach((c) => {
      const s = getSportName(c.sport) ?? getSportName(c.type);
      if (s) sportsSet.add(s);
    });
    return Array.from(sportsSet).sort();
  }, [campi]);

  const selectedSportLabel = useMemo(() => {
    if (selectedSport === "all") return "Tutti";
    return selectedSport.length > 20 ? `${selectedSport.slice(0, 17)}...` : selectedSport;
  }, [selectedSport]);

  const selectedDurationHours: number = topDurationFilter;

  const getBookingDurationHours = (booking: Booking): number => {
    const directDuration = Number(booking.duration);
    if (Number.isFinite(directDuration) && directDuration > 0) return directDuration;

    if (booking.startTime && booking.endTime) {
      const [startH, startM] = booking.startTime.split(":").map(Number);
      const [endH, endM] = booking.endTime.split(":").map(Number);
      const calc = (endH + endM / 60) - (startH + startM / 60);
      if (calc > 0) return Math.round(calc * 100) / 100;
    }

    return 1;
  };

  const durationFilteredPeriodBookings = useMemo(() => {
    if (durationFilter === "all") return periodFilteredBookings;

    return periodFilteredBookings.filter((booking) => {
      const duration = getBookingDurationHours(booking);
      return Math.abs(duration - durationFilter) < 0.01;
    });
  }, [periodFilteredBookings, durationFilter]);

  const topDurationFilteredPeriodBookings = useMemo(() => {
    return periodFilteredBookings.filter((booking) => {
      const duration = getBookingDurationHours(booking);
      return Math.abs(duration - topDurationFilter) < 0.01;
    });
  }, [periodFilteredBookings, topDurationFilter]);

  const { topHours, topUsersBySlot } = useMemo(() => {
    const slotSize = topDurationFilter;
    const slotForBooking = (booking: Booking, size: number) => {
      try {
        const timeParts = (booking.startTime || "").split(":");
        const h = parseInt(timeParts[0]);
        const m = parseInt(timeParts[1] || "0");
        if (!Number.isFinite(h)) return undefined;
        const decimalHour = h + (m || 0) / 60;
        return Math.floor(decimalHour / size) * size;
      } catch { return undefined; }
    };
    const slotCountMap = new Map<number, number>();
    const slotUserMap = new Map<number, Map<string, { name: string; count: number }>>();
    topDurationFilteredPeriodBookings.forEach((booking) => {
      const slot = slotForBooking(booking, slotSize);
      if (slot === undefined) return;
      slotCountMap.set(slot, (slotCountMap.get(slot) || 0) + 1);
      const userId = booking.user?._id || "unknown";
      const userName = booking.user
        ? `${booking.user.name}${booking.user.surname ? " " + booking.user.surname : ""}`
        : "Anonimo";
      if (!slotUserMap.has(slot)) slotUserMap.set(slot, new Map());
      const userMap = slotUserMap.get(slot)!;
      const existing = userMap.get(userId);
      userMap.set(userId, { name: userName, count: (existing ? existing.count : 0) + 1 });
    });
    const topHoursArr = Array.from(slotCountMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const topUsersBySlotObj: Record<number, Array<{ userId: string; name: string; count: number }>> = {};
    slotUserMap.forEach((userMap, slot) => {
      topUsersBySlotObj[slot] = Array.from(userMap.entries())
        .map(([userId, info]) => ({ userId, name: info.name, count: info.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    });
    return { topHours: topHoursArr, topUsersBySlot: topUsersBySlotObj };
  }, [topDurationFilteredPeriodBookings, topDurationFilter]);

  const completedDurationFilteredBookings = useMemo(
    () =>
      durationFilteredPeriodBookings.filter((booking) => {
        if (!booking.date || !booking.endTime) return false;
        const bookingEnd = new Date(`${booking.date}T${booking.endTime}`);
        return bookingEnd < new Date();
      }).length,
    [durationFilteredPeriodBookings]
  );

  const sportBookingsStats = useMemo(() => {
    const sportCountMap = new Map<string, number>();

    durationFilteredPeriodBookings.forEach((booking) => {

      const bookingCampo: any = booking.campo;
      const bookingCampoId =
        typeof bookingCampo === "string"
          ? bookingCampo
          : bookingCampo?._id || bookingCampo?.id;

      const campoFromList = campi.find((c) => c._id === bookingCampoId);
      const sportName =
        getSportName(campoFromList?.sport) ||
        getSportName(campoFromList?.type) ||
        getSportName((bookingCampo as any)?.sport) ||
        getSportName((bookingCampo as any)?.type);

      const normalizedSport = sportName || "Non specificato";
      sportCountMap.set(normalizedSport, (sportCountMap.get(normalizedSport) || 0) + 1);
    });

    return Array.from(sportCountMap.entries())
      .map(([sport, count]) => ({ sport, count }))
      .sort((a, b) => b.count - a.count);
  }, [durationFilteredPeriodBookings, campi]);

  const maxSportBookings = useMemo(
    () => sportBookingsStats.reduce((max, item) => Math.max(max, item.count), 0),
    [sportBookingsStats]
  );

  const topUsers = useMemo(() => {
    const usersMap = new Map<string, { id: string; fullName: string; count: number }>();

    periodFilteredBookings.forEach((booking) => {
      const user = booking.user;
      if (!user?._id) return;

      const fullName = `${user.name}${user.surname ? ` ${user.surname}` : ""}`.trim() || "Utente";
      const existing = usersMap.get(user._id);

      if (existing) {
        existing.count += 1;
      } else {
        usersMap.set(user._id, {
          id: user._id,
          fullName,
          count: 1,
        });
      }
    });

    return Array.from(usersMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [periodFilteredBookings]);

  const topUserSportsByUser = useMemo(() => {
    const userSportCountMap = new Map<string, Map<string, number>>();

    periodFilteredBookings.forEach((booking) => {
      const userId = booking.user?._id;
      if (!userId) return;

      const bookingCampo: any = booking.campo;
      const bookingCampoId =
        typeof bookingCampo === "string"
          ? bookingCampo
          : bookingCampo?._id || bookingCampo?.id;

      const campoFromList = campi.find((c) => c._id === bookingCampoId);
      const sportName =
        getSportName(campoFromList?.sport) ||
        getSportName(campoFromList?.type) ||
        getSportName((bookingCampo as any)?.sport) ||
        getSportName((bookingCampo as any)?.type) ||
        "Non specificato";

      if (!userSportCountMap.has(userId)) {
        userSportCountMap.set(userId, new Map<string, number>());
      }

      const sportsMap = userSportCountMap.get(userId)!;
      sportsMap.set(sportName, (sportsMap.get(sportName) || 0) + 1);
    });

    const result: Record<string, Array<{ sport: string; count: number }>> = {};
    userSportCountMap.forEach((sportsMap, userId) => {
      result[userId] = Array.from(sportsMap.entries())
        .map(([sport, count]) => ({ sport, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    });

    return result;
  }, [periodFilteredBookings, campi]);



  // Debug logs disabled to reduce console noise (previously printed detailed occupazione per struttura)
  useEffect(() => {
    // intentionally left empty
  }, [struttureStats, stats.tassoOccupazione, selectedStruttura, strutture]);

  const WEEKLY_BAR_WIDTH = 25;
  const WEEKLY_SPACING = 15;
  const WEEKLY_NO_OF_SECTIONS = 5;
  const WEEKLY_CHART_HEIGHT = 200;
  const WEEKLY_Y_AXIS_WIDTH = 35;

  const weeklyMaxValue = useMemo(
    () => weeklyStats.data.reduce((max, value) => Math.max(max, value), 0),
    [weeklyStats.data]
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

  const weeklyViewportWidth = SCREEN_WIDTH - 104;
  const weeklyContentWidth =
    weeklyStats.data.length * (WEEKLY_BAR_WIDTH + WEEKLY_SPACING) + 8;
  const weeklyChartWidth = Math.max(weeklyViewportWidth, weeklyContentWidth);

  const hourlyChartData = useMemo(
    () =>
      hourlyStats
        .map((value, hour) => ({ hour, value }))
        .filter((item) => item.value > 0),
    [hourlyStats]
  );

  const HOURLY_NO_OF_SECTIONS = 5;
  const HOURLY_CHART_HEIGHT = 200;
  const HOURLY_BAR_WIDTH = 14;
  const HOURLY_SPACING = 12;

  const hourlyMaxValue = useMemo(
    () => hourlyChartData.reduce((max, item) => Math.max(max, item.value), 0),
    [hourlyChartData]
  );

  const hourlyAxisMax = useMemo(() => {
    if (hourlyMaxValue <= 0) return HOURLY_NO_OF_SECTIONS;
    return Math.ceil(hourlyMaxValue / HOURLY_NO_OF_SECTIONS) * HOURLY_NO_OF_SECTIONS;
  }, [hourlyMaxValue]);

  const hourlyYAxisLabels = useMemo(() => {
    const step = hourlyAxisMax / HOURLY_NO_OF_SECTIONS;
    return Array.from({ length: HOURLY_NO_OF_SECTIONS + 1 }, (_, index) =>
      Math.round(hourlyAxisMax - step * index)
    );
  }, [hourlyAxisMax]);

  const hourlyViewportWidth = SCREEN_WIDTH - 120;
  const hourlyContentWidth =
    hourlyChartData.length * (HOURLY_BAR_WIDTH + HOURLY_SPACING) + 24;
  const hourlyChartWidth = Math.max(
    hourlyViewportWidth + 24,
    hourlyContentWidth
  );

  const formatSlotTime = (decimalHour: number) => {
    const h = Math.floor(decimalHour);
    const m = Math.round((decimalHour - h) * 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const weeklyChartKey = useMemo(
    () => `weekly-${selectedStruttura}-${selectedUser}-${selectedPeriodDays}-${weeklyStats.data.join("-")}`,
    [selectedStruttura, selectedUser, selectedPeriodDays, weeklyStats.data]
  );

  const hourlyChartKey = useMemo(
    () => `hourly-${selectedStruttura}-${selectedUser}-${selectedPeriodDays}-${durationFilter}-${hourlyStats.join("-")}`,
    [selectedStruttura, selectedUser, selectedPeriodDays, durationFilter, hourlyStats]
  );

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <OwnerStatsHeader onBack={() => navigation.goBack()} />

        <OwnerStatsFilters
          selectedStruttura={selectedStruttura}
          selectedUser={selectedUser}
          selectedSport={selectedSport}
          selectedPeriodDays={selectedPeriodDays}
          selectedStrutturaLabel={selectedStrutturaLabel}
          selectedUserLabel={selectedUserLabel}
          selectedSportLabel={selectedSportLabel}
          selectedPeriodLabel={selectedPeriodLabel}
          availableSports={availableSports}
          onOpenFilter={(type) => {
            setActiveFilterType(type);
            setFilterModalVisible(true);
          }}
        />

        <OwnerStatsSummaryCards
          completedBookings={completedDurationFilteredBookings}
          totalBookings={durationFilteredPeriodBookings.length}
          topHour={topHours[0]}
          tassoOccupazione={stats.tassoOccupazione}
          showOccupancy={selectedUser === "all"}
          formatSlotTime={formatSlotTime}
        />



        {/* GRAFICO SETTIMANALE */}
        <View style={styles.chartSection}>
          <View style={styles.topTitleRow}>
            <Text style={styles.chartTitle}>Prenotazioni per Giorno</Text>
            <View style={styles.slotToggle}>
              <Pressable
                style={[styles.slotToggleBtn, durationFilter === "all" && styles.slotToggleBtnActive]}
                onPress={() => setDurationFilter("all")}
              >
                <Text style={[styles.slotToggleBtnText, durationFilter === "all" && styles.slotToggleBtnTextActive]}>Tutte</Text>
              </Pressable>
              <Pressable
                style={[styles.slotToggleBtn, durationFilter === 1 && styles.slotToggleBtnActive]}
                onPress={() => setDurationFilter(1)}
              >
                <Text style={[styles.slotToggleBtnText, durationFilter === 1 && styles.slotToggleBtnTextActive]}>1h</Text>
              </Pressable>
              <Pressable
                style={[styles.slotToggleBtn, durationFilter === 1.5 && styles.slotToggleBtnActive]}
                onPress={() => setDurationFilter(1.5)}
              >
                <Text style={[styles.slotToggleBtnText, durationFilter === 1.5 && styles.slotToggleBtnTextActive]}>1.5h</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.chartSubtitle}>Distribuzione settimanale • {selectedPeriodLabel}</Text>

          {weeklyStats.data.some((v) => v > 0) ? (
            <View style={styles.giftedChartContainer}>
              <View style={styles.hourlyChartRow}>
                <View style={[styles.hourlyYAxisColumn, { width: WEEKLY_Y_AXIS_WIDTH, marginRight: 7 }]}>
                  <View style={[styles.hourlyYAxisLabelsContainer, { height: WEEKLY_CHART_HEIGHT }]}>
                    {weeklyYAxisLabels.map((tick, index) => (
                      <Text key={`weekly-tick-${index}`} style={[styles.hourlyYAxisLabel, { fontSize: 11 }]}>
                        {tick}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.hourlyXAxisSpacer} />
                </View>

                <View style={styles.hourlyScrollableArea}>
                  <ScrollView
                    horizontal
                    nestedScrollEnabled
                    directionalLockEnabled
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.weeklyChartScrollContent}
                  >
                    <BarChart
                      key={weeklyChartKey}
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
            <View style={styles.emptyChart}>
              <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
              <Text style={styles.emptyChartText}>Nessun dato disponibile</Text>
            </View>
          )}
        </View>

        {/* GRAFICO ORARIO */}
        <View style={styles.chartSection}>
          <View style={styles.topTitleRow}>
            <Text style={styles.chartTitle}>Prenotazioni per Ora</Text>
            <View style={styles.slotToggle}>
              <Pressable
                style={[styles.slotToggleBtn, durationFilter === "all" && styles.slotToggleBtnActive]}
                onPress={() => setDurationFilter("all")}
              >
                <Text style={[styles.slotToggleBtnText, durationFilter === "all" && styles.slotToggleBtnTextActive]}>Tutte</Text>
              </Pressable>
              <Pressable
                style={[styles.slotToggleBtn, durationFilter === 1 && styles.slotToggleBtnActive]}
                onPress={() => setDurationFilter(1)}
              >
                <Text style={[styles.slotToggleBtnText, durationFilter === 1 && styles.slotToggleBtnTextActive]}>1h</Text>
              </Pressable>
              <Pressable
                style={[styles.slotToggleBtn, durationFilter === 1.5 && styles.slotToggleBtnActive]}
                onPress={() => setDurationFilter(1.5)}
              >
                <Text style={[styles.slotToggleBtnText, durationFilter === 1.5 && styles.slotToggleBtnTextActive]}>1.5h</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.chartSubtitle}>Distribuzione nelle 24 ore • {selectedPeriodLabel}</Text>

          {hourlyStats.some((v) => v > 0) ? (
            <View style={styles.giftedChartContainer}>
              <View style={styles.hourlyChartRow}>
                <View style={styles.hourlyYAxisColumn}>
                  <View style={[styles.hourlyYAxisLabelsContainer, { height: HOURLY_CHART_HEIGHT }]}>
                    {hourlyYAxisLabels.map((tick, index) => (
                      <Text key={`hourly-tick-${index}`} style={styles.hourlyYAxisLabel}>
                        {tick}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.hourlyXAxisSpacer} />
                </View>

                <View style={styles.hourlyScrollableArea}>
                  <ScrollView
                    horizontal
                    nestedScrollEnabled
                    directionalLockEnabled
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.hourlyChartScrollContent}
                  >
                    <BarChart
                      key={hourlyChartKey}
                      data={hourlyChartData.map(({ value, hour }) => ({
                        value,
                        label: hour.toString().padStart(2, "0"),
                        frontColor: "#2196F3",
                        topLabelComponent: () => (
                          <Text style={{ fontSize: 10, color: "#2196F3", fontWeight: "700" }}>
                            {value}
                          </Text>
                        ),
                      }))}
                      width={hourlyChartWidth}
                      height={HOURLY_CHART_HEIGHT}
                      barWidth={HOURLY_BAR_WIDTH}
                      spacing={HOURLY_SPACING}
                      maxValue={hourlyAxisMax}
                      noOfSections={HOURLY_NO_OF_SECTIONS}
                      yAxisThickness={0}
                      yAxisLabelWidth={0}
                      xAxisThickness={1}
                      xAxisColor="#E0E0E0"
                      xAxisLabelTextStyle={{ color: "#666", fontSize: 10 }}
                      isAnimated
                      animationDuration={400}
                      hideRules
                      roundedTop
                      disableScroll
                    />
                  </ScrollView>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="stats-chart-outline" size={48} color="#ccc" />
              <Text style={styles.emptyChartText}>Nessun dato disponibile</Text>
            </View>
          )}
        </View>

        {selectedSport === "all" && (
          <View style={styles.chartSection}>
            <View style={styles.topTitleRow}>
              <Text style={styles.chartTitle}>Prenotazioni per Sport</Text>
              <View style={styles.slotToggle}>
                <Pressable
                  style={[styles.slotToggleBtn, durationFilter === "all" && styles.slotToggleBtnActive]}
                  onPress={() => setDurationFilter("all")}
                >
                  <Text style={[styles.slotToggleBtnText, durationFilter === "all" && styles.slotToggleBtnTextActive]}>Tutte</Text>
                </Pressable>
                <Pressable
                  style={[styles.slotToggleBtn, durationFilter === 1 && styles.slotToggleBtnActive]}
                  onPress={() => setDurationFilter(1)}
                >
                  <Text style={[styles.slotToggleBtnText, durationFilter === 1 && styles.slotToggleBtnTextActive]}>1h</Text>
                </Pressable>
                <Pressable
                  style={[styles.slotToggleBtn, durationFilter === 1.5 && styles.slotToggleBtnActive]}
                  onPress={() => setDurationFilter(1.5)}
                >
                  <Text style={[styles.slotToggleBtnText, durationFilter === 1.5 && styles.slotToggleBtnTextActive]}>1.5h</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.chartSubtitle}>Distribuzione per sport • {selectedPeriodLabel}</Text>

            {sportBookingsStats.length > 0 ? (
              <View style={styles.giftedChartContainer}>
                {sportBookingsStats.map((item) => {
                  const ratio = maxSportBookings > 0 ? item.count / maxSportBookings : 0;
                  const barWidth = `${Math.max(8, Math.round(ratio * 100))}%` as `${number}%`;

                  return (
                    <View key={item.sport} style={styles.sportRow}>
                      <View style={styles.sportRowHeader}>
                        <Text style={styles.sportRowLabel} numberOfLines={1}>
                          {item.sport}
                        </Text>
                        <Text style={styles.sportRowValue}>{item.count}</Text>
                      </View>
                      <View style={styles.sportRowTrack}>
                        <View style={[styles.sportRowBar, { width: barWidth }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
                <Text style={styles.emptyChartText}>Nessun dato disponibile</Text>
              </View>
            )}
          </View>
        )}

        <OwnerStatsTopHoursSection
          topHours={topHours}
          topUsersBySlot={topUsersBySlot}
          users={users}
          expandedSlots={expandedSlots}
          selectedDurationHours={selectedDurationHours}
          topDurationFilter={topDurationFilter}
          onSetTopDurationFilter={setTopDurationFilter}
          onToggleSlot={(slotKey) =>
            setExpandedSlots((prev) => ({ ...prev, [slotKey]: !prev[slotKey] }))
          }
          onOpenUserProfile={(userId) => {
            if (userId && userId !== "unknown") {
              navigation.navigate("ProfiloUtente", { userId });
            }
          }}
          formatSlotTime={formatSlotTime}
        />

        <OwnerStatsTopUsersSection
          topUsers={topUsers}
          users={users}
          expandedTopUsers={expandedTopUsers}
          topUserSportsByUser={topUserSportsByUser}
          onToggleUser={(userId) =>
            setExpandedTopUsers((prev) => ({ ...prev, [userId]: !prev[userId] }))
          }
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      <FilterModal
        visible={filterModalVisible}
        title={
          activeFilterType === "struttura"
            ? "Seleziona Struttura"
            : activeFilterType === "cliente"
              ? "Seleziona Cliente"
              : activeFilterType === "sport"
                ? "Seleziona Sport"
                : "Seleziona Periodo"
        }
        onClose={() => setFilterModalVisible(false)}
        contentScrollable
        searchable={activeFilterType !== "periodo"}
        searchPlaceholder={
          activeFilterType === "struttura" ? "Cerca struttura..." :
          activeFilterType === "cliente" ? "Cerca cliente..." :
          activeFilterType === "sport" ? "Cerca sport..." : ""
        }
      >
        {(search) => (
          <>
            {activeFilterType !== "periodo" && (
              <Pressable
                style={({ pressed }) => [
                  styles.filterModalOption,
                  styles.filterModalOptionWithBorder,
                  pressed && { backgroundColor: "#E3F2FD" },
                ]}
                onPress={() => {
                  if (activeFilterType === "struttura") setSelectedStruttura("all");
                  else if (activeFilterType === "cliente") setSelectedUser("all");
                  else if (activeFilterType === "sport") setSelectedSport("all");
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.filterModalOptionText}>✨ Tutti</Text>
              </Pressable>
            )}

            {activeFilterType === "struttura"
              ? strutture.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map((struttura, index) => (
                  <Pressable
                    key={struttura._id}
                    style={({ pressed }) => [
                      styles.filterModalOption,
                      index < strutture.length - 1 && styles.filterModalOptionWithBorder,
                      pressed && { backgroundColor: "#E3F2FD" },
                    ]}
                    onPress={() => {
                      setSelectedStruttura(struttura._id);
                      setFilterModalVisible(false);
                    }}
                  >
                    <View style={styles.filterModalRow}>
                      <Ionicons name="business-outline" size={16} color="#2196F3" />
                      <Text style={styles.filterModalOptionText}>{struttura.name}</Text>
                    </View>
                  </Pressable>
                ))
              : activeFilterType === "cliente"
                ? users.filter(u => `${u.name}${u.surname ? " " + u.surname : ""}`.toLowerCase().includes(search.toLowerCase())).map((user, index) => {
                    const fullName = `${user.name}${user.surname ? " " + user.surname : ""}`;
                    return (
                      <Pressable
                        key={user._id}
                        style={({ pressed }) => [
                          styles.filterModalOption,
                          index < users.length - 1 && styles.filterModalOptionWithBorder,
                          pressed && { backgroundColor: "#E3F2FD" },
                        ]}
                        onPress={() => {
                          setSelectedUser(user._id);
                          setFilterModalVisible(false);
                        }}
                      >
                        <View style={styles.filterModalRow}>
                          <Ionicons name="person-outline" size={16} color="#2196F3" />
                          <Text style={styles.filterModalOptionText}>{fullName}</Text>
                        </View>
                      </Pressable>
                    );
                  })
                : activeFilterType === "sport"
                  ? availableSports.filter(s => s.toLowerCase().includes(search.toLowerCase())).map((sport, index) => (
                      <Pressable
                        key={sport}
                        style={({ pressed }) => [
                          styles.filterModalOption,
                          index < availableSports.length - 1 && styles.filterModalOptionWithBorder,
                          pressed && { backgroundColor: "#E3F2FD" },
                        ]}
                        onPress={() => {
                          setSelectedSport(sport);
                          setFilterModalVisible(false);
                        }}
                      >
                        <View style={styles.filterModalRow}>
                          <SportIcon sport={sport} size={16} color="#2196F3" />
                          <Text style={styles.filterModalOptionText}>{sport}</Text>
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

  dashboardPeriodSection: {
    paddingHorizontal: 16,
    marginTop: 14,
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
    overflow: "hidden",
  },

  chartScrollContent: {
    paddingRight: 8,
  },

  weeklyChartScrollContent: {
    paddingRight: 0,
  },

  hourlyChartScrollContent: {
    paddingRight: 0,
  },

  hourlyChartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  hourlyYAxisColumn: {
    width: 36,
    marginRight: 8,
  },

  hourlyYAxisLabelsContainer: {
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 4,
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
  },

  hourlyYAxisLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },

  hourlyXAxisSpacer: {
    height: 22,
  },

  hourlyScrollableArea: {
    flex: 1,
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

  topTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  slotToggle: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 14,
    padding: 1,
  },

  slotToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  slotToggleBtnActive: {
    backgroundColor: "#2196F3",
  },

  slotToggleBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
  },

  slotToggleBtnTextActive: {
    color: "white",
  },

  topTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
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

  topItemOpen: {
    marginBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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

  topUserName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  topCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },

  topItemRightMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },

  expandedPanel: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
    marginTop: 0,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },

  expandedUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },

  expandedUserName: {
    flex: 1,
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "700",
  },

  expandedUserCount: {
    fontSize: 13,
    color: "#666",
    fontWeight: "700",
  },

  expandedEmpty: {
    fontSize: 13,
    color: "#999",
    fontWeight: "600",
    paddingVertical: 8,
  },

  expandedSportRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 6,
  },

  expandedSportLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  expandedSportName: {
    flex: 1,
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "700",
  },

  expandedSportCount: {
    fontSize: 13,
    color: "#666",
    fontWeight: "700",
  },

  sportRow: {
    marginBottom: 14,
  },

  sportRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 12,
  },

  sportRowLabel: {
    flex: 1,
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "700",
  },

  sportRowValue: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "800",
  },

  sportRowTrack: {
    width: "100%",
    height: 10,
    backgroundColor: "#EAF3FF",
    borderRadius: 999,
    overflow: "hidden",
  },

  sportRowBar: {
    height: "100%",
    backgroundColor: "#2196F3",
    borderRadius: 999,
  },
});
