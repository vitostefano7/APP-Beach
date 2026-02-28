import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useCallback, useEffect, useRef } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useRoute, useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import API_URL from "../../../config/api";
import SportIcon from "../../../components/SportIcon";
import FilterModal from "../../../components/FilterModal";
import { getCachedData, setCachedData } from "../../../components/cache/cacheStorage";
import { BookingCard } from "./Booking/BookingCard";
import { styles } from "./Booking/styles";
import { Booking, OwnerBookingsCacheEntry, OwnerPaginatedBookingsResponse } from "./Booking/types";

/* =========================
   MAIN SCREEN
========================= */
export default function OwnerBookingsScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [counts, setCounts] = useState({ all: 0, upcoming: 0, past: 0, ongoing: 0 });
  const [pagination, setPagination] = useState({ page: 1, hasNext: false, total: 0 });
  const isFetchingRef = useRef(false);
  const hasFocusedOnceRef = useRef(false);
  const PAGE_SIZE = 15;
  const PREFETCH_SCROLL_RATIO = 0.8;
  const CACHE_TTL_MS = 2 * 60 * 1000;
  const lastPrefetchPageRef = useRef(0);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past" | "ongoing">(route.params?.filterDate ? "all" : "upcoming");
  
  const [filterUsername, setFilterUsername] = useState("");
  const [filterStruttura, setFilterStruttura] = useState(route.params?.filterStrutturaId || "");
  const [filterCampo, setFilterCampo] = useState(route.params?.filterCampoId || "");
  const [filterSport, setFilterSport] = useState("");
  const [filterPaymentMode, setFilterPaymentMode] = useState<"" | "full" | "split">("");
  const [filterDate, setFilterDate] = useState(route.params?.filterDate || "");
  
  const [strutture, setStrutture] = useState<Array<{ _id: string; name: string }>>([]);
  const [campi, setCampi] = useState<Array<{ _id: string; name: string; strutturaId: string }>>([]);
  const [sports, setSports] = useState<Array<{ _id: string; name: string; code: string }>>([]);
  
  const [showStrutturaModal, setShowStrutturaModal] = useState(false);
  const [showCampoModal, setShowCampoModal] = useState(false);
  const [showSportModal, setShowSportModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  /* =========================
     LOAD DATA
  ========================= */
  const loadOwnerData = useCallback(async () => {
    if (!token) return;

    try {
      const struttureRes = await fetch(`${API_URL}/strutture/owner/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!struttureRes.ok) throw new Error(`HTTP ${struttureRes.status}`);
      const struttureData = await struttureRes.json();
      setStrutture(struttureData.map((s: any) => ({ _id: s._id, name: s.name })));

      const allCampi: Array<{ _id: string; name: string; strutturaId: string }> = [];

      for (const struttura of struttureData) {
        try {
          const campiRes = await fetch(`${API_URL}/campi/owner/struttura/${struttura._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (campiRes.ok) {
            const campiData = await campiRes.json();
            campiData.forEach((campo: any) => {
              allCampi.push({
                _id: campo._id,
                name: campo.name,
                strutturaId: struttura._id,
              });
            });
          }
        } catch (err) {
          console.log(`⚠️ Errore caricamento campi per struttura ${struttura._id}`);
        }
      }

      setCampi(allCampi);

      // Carica gli sport
      try {
        const sportsRes = await fetch(`${API_URL}/sports`);
        if (sportsRes.ok) {
          const sportsData = await sportsRes.json();
          setSports(sportsData.data || []);
        }
      } catch (err) {
        console.log("⚠️ Errore caricamento sport");
      }
    } catch (err) {
      console.log("❌ Errore caricamento dati owner");
    }
  }, [token]);

  const loadBookings = useCallback(async ({
    page = 1,
    force = false,
  }: {
    page?: number;
    force?: boolean;
  } = {}) => {
    if (!token) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;

    try {
      const normalizedUsername = filterUsername.trim().toLowerCase();
      const cacheKey = `owner:bookings:paginated:${JSON.stringify({
        filter,
        username: normalizedUsername,
        strutturaId: filterStruttura || "",
        campoId: filterCampo || "",
        sport: filterSport || "",
        paymentMode: filterPaymentMode || "",
        date: filterDate || "",
      })}`;

      if (page === 1 && !force) {
        try {
          const cached = await getCachedData<OwnerBookingsCacheEntry["data"]>(cacheKey, CACHE_TTL_MS);
          if (cached) {
            lastPrefetchPageRef.current = 0;
            setCounts(cached.counts);
            setPagination(cached.pagination);
            setBookings(cached.items);
            return;
          }
        } catch {
          // noop
        }
      }

      if (page === 1) {
        if (force) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      } else {
        setLoadingMore(true);
      }

      const query = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        timeFilter: filter,
      });

      if (filterUsername.trim()) query.append("username", filterUsername.trim());
      if (filterStruttura) query.append("strutturaId", filterStruttura);
      if (filterCampo) query.append("campoId", filterCampo);
      if (filterSport) query.append("sport", filterSport);
      if (filterPaymentMode) query.append("paymentMode", filterPaymentMode);
      if (filterDate) query.append("date", filterDate);

      const res = await fetch(`${API_URL}/bookings/owner/paginated?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: OwnerPaginatedBookingsResponse = await res.json();

      setCounts(data.counts);
      setPagination({
        page: data.pagination.page,
        hasNext: data.pagination.hasNext,
        total: data.pagination.total,
      });

      if (page === 1) {
        lastPrefetchPageRef.current = 0;
        setBookings(data.items);

        try {
          await setCachedData(cacheKey, {
            items: data.items,
            counts: data.counts,
            pagination: {
              page: data.pagination.page,
              hasNext: data.pagination.hasNext,
              total: data.pagination.total,
            },
          });
        } catch {
          // noop
        }
      } else {
        setBookings((prev) => {
          const prevIds = new Set(prev.map((b) => b._id));
          const dedupedNew = data.items.filter((b) => !prevIds.has(b._id));
          return [...prev, ...dedupedNew];
        });
      }

      setLoading(false);
    } catch (err) {
      console.log("❌ Errore fetch owner bookings");
      setLoading(false);
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [token, filter, filterUsername, filterStruttura, filterCampo, filterSport, filterPaymentMode, filterDate]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        hasFocusedOnceRef.current = true;
        await loadOwnerData();
        await loadBookings({ page: 1 });
      };
      loadData();
    }, [loadOwnerData, loadBookings])
  );

  useEffect(() => {
    if (!hasFocusedOnceRef.current) return;
    loadBookings({ page: 1 });
  }, [filter, filterUsername, filterStruttura, filterCampo, filterSport, filterPaymentMode, filterDate, loadBookings]);

  const handleLoadMore = useCallback(() => {
    if (loading || refreshing || loadingMore || !pagination.hasNext) return;
    loadBookings({ page: pagination.page + 1 });
  }, [loading, refreshing, loadingMore, pagination, loadBookings]);

  const handleScrollPrefetch = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (loading || refreshing || loadingMore || !pagination.hasNext) return;
      if (pagination.page <= lastPrefetchPageRef.current) return;

      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      if (!contentSize.height) return;

      const scrollProgress = (contentOffset.y + layoutMeasurement.height) / contentSize.height;
      if (scrollProgress >= PREFETCH_SCROLL_RATIO) {
        lastPrefetchPageRef.current = pagination.page;
        handleLoadMore();
      }
    },
    [loading, refreshing, loadingMore, pagination, handleLoadMore]
  );

  /* =========================
     FILTERS
  ========================= */
  const getFilteredCount = (timeFilter: "all" | "upcoming" | "past" | "ongoing") => {
    if (timeFilter === "upcoming") return counts.upcoming;
    if (timeFilter === "ongoing") return counts.ongoing;
    if (timeFilter === "past") return counts.past;
    return counts.all;
  };

  const sortedBookings = bookings;

  const campiFiltered = filterStruttura
    ? campi.filter((c) => c.strutturaId === filterStruttura)
    : campi;

  const clearFilters = () => {
    setFilterUsername("");
    setFilterStruttura("");
    setFilterCampo("");
    setFilterSport("");
    setFilterPaymentMode("");
    setFilterDate("");
  };

  const hasActiveFilters = filterUsername || filterStruttura || filterCampo || filterSport || filterPaymentMode || filterDate;
  const hasOngoingBookings = counts.ongoing > 0;

  useEffect(() => {
    if (filter === "ongoing" && !hasOngoingBookings) {
      setFilter("upcoming");
    }
  }, [filter, hasOngoingBookings]);

  /* =========================
     RENDER
  ========================= */
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              {(route.params?.fromDashboard || route.params?.filterCampoId || route.params?.filterStrutturaId || route.params?.filterDate) && (
                <Pressable
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color="#2196F3" />
                </Pressable>
              )}
              {!(route.params?.filterCampoId || route.params?.filterStrutturaId || route.params?.filterDate) && (
                <View style={styles.headerIconContainer}>
                  <Ionicons name="calendar" size={26} color="#2196F3" />
                </View>
              )}
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.title}>Prenotazioni</Text>
            </View>
          </View>

          {/* FILTER TABS - ORIZZONTALI E COMPATTI */}
          <View style={styles.filterTabsWrapperCompact}>
            {hasOngoingBookings && (
              <Pressable
                style={[styles.filterTabCompact, filter === "ongoing" && styles.filterTabOngoing]}
                onPress={() => setFilter("ongoing")}
              >
                <Text style={[styles.filterTabTextCompact, filter === "ongoing" && styles.filterTabTextActive]}>
                  In corso
                </Text>
                <View style={[styles.filterBadgeCompact, filter === "ongoing" && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeTextCompact, filter === "ongoing" && styles.filterBadgeTextActive]}>
                    {getFilteredCount("ongoing")}
                  </Text>
                </View>
              </Pressable>
            )}
            <Pressable
              style={[styles.filterTabCompact, filter === "upcoming" && styles.filterTabActive]}
              onPress={() => setFilter("upcoming")}
            >
              <Text style={[styles.filterTabTextCompact, filter === "upcoming" && styles.filterTabTextActive]}>
                Prossime
              </Text>
              <View style={[styles.filterBadgeCompact, filter === "upcoming" && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeTextCompact, filter === "upcoming" && styles.filterBadgeTextActive]}>
                  {getFilteredCount("upcoming")}
                </Text>
              </View>
            </Pressable>
            <Pressable
              style={[styles.filterTabCompact, filter === "past" && styles.filterTabActive]}
              onPress={() => setFilter("past")}
            >
              <Text style={[styles.filterTabTextCompact, filter === "past" && styles.filterTabTextActive]}>
                Concluse
              </Text>
              <View style={[styles.filterBadgeCompact, filter === "past" && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeTextCompact, filter === "past" && styles.filterBadgeTextActive]}>
                  {getFilteredCount("past")}
                </Text>
              </View>
            </Pressable>
            <Pressable
              style={[styles.filterTabCompact, filter === "all" && styles.filterTabActive]}
              onPress={() => setFilter("all")}
            >
              <Text style={[styles.filterTabTextCompact, filter === "all" && styles.filterTabTextActive]}>
                Tutte
              </Text>
              <View style={[styles.filterBadgeCompact, filter === "all" && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeTextCompact, filter === "all" && styles.filterBadgeTextActive]}>
                  {getFilteredCount("all")}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* ADDITIONAL FILTERS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filtersScrollContent}
          >
            {/* CHIP RICERCA NOME - PRIMO CHIP */}
            <Pressable
              style={[styles.filterChip, filterUsername && styles.filterChipActive]}
              onPress={() => setShowSearchModal(true)}
            >
              <Ionicons
                name="search"
                size={16}
                color={filterUsername ? "white" : "#666"}
              />
              <Text style={[styles.filterChipText, filterUsername && styles.filterChipTextActive]}>
                {filterUsername ? filterUsername : "Cliente"}
              </Text>
              {filterUsername.length > 0 && (
                <Pressable onPress={() => setFilterUsername("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={filterUsername ? "white" : "#999"} />
                </Pressable>
              )}
            </Pressable>

            {/* CHIP DATA */}
            <Pressable
              style={[styles.filterChip, filterDate && styles.filterChipActive]}
              onPress={() => setShowCalendarModal(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={filterDate ? "white" : "#666"}
              />
              <Text style={[styles.filterChipText, filterDate && styles.filterChipTextActive]}>
                {filterDate
                  ? new Date(filterDate + "T12:00:00").toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Data"}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterChip, filterStruttura && styles.filterChipActive]}
              onPress={() => setShowStrutturaModal(true)}
            >
              <Ionicons
                name="business-outline"
                size={16}
                color={filterStruttura ? "white" : "#666"}
              />
              <Text style={[styles.filterChipText, filterStruttura && styles.filterChipTextActive]}>
                {filterStruttura
                  ? strutture.find((s) => s._id === filterStruttura)?.name || "Struttura"
                  : "Struttura"}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterChip, filterSport && styles.filterChipActive]}
              onPress={() => setShowSportModal(true)}
            >
              <Ionicons
                name="football-outline"
                size={16}
                color={filterSport ? "white" : "#666"}
              />
              <Text style={[styles.filterChipText, filterSport && styles.filterChipTextActive]}>
                {filterSport
                  ? sports.find((s) => s.code === filterSport)?.name || "Sport"
                  : "Sport"}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.filterChip, filterPaymentMode && styles.filterChipActive]}
              onPress={() => setShowPaymentModal(true)}
            >
              <Ionicons
                name="card-outline"
                size={16}
                color={filterPaymentMode ? "white" : "#666"}
              />
              <Text style={[styles.filterChipText, filterPaymentMode && styles.filterChipTextActive]}>
                {filterPaymentMode
                  ? filterPaymentMode === "split"
                    ? "Costo diviso"
                    : "Intero"
                  : "Pagamento"}
              </Text>
            </Pressable>

            {filterStruttura && campiFiltered.length > 0 && (
              <Pressable
                style={[styles.filterChip, filterCampo && styles.filterChipActive]}
                onPress={() => setShowCampoModal(true)}
              >
                <Ionicons
                  name="grid"
                  size={16}
                  color={filterCampo ? "white" : "#666"}
                />
                <Text style={[styles.filterChipText, filterCampo && styles.filterChipTextActive]}>
                  {filterCampo
                    ? campiFiltered.find((c) => c._id === filterCampo)?.name || "Campo"
                    : "Campo"}
                </Text>
              </Pressable>
            )}

            {hasActiveFilters && (
              <Pressable style={styles.filterChipReset} onPress={clearFilters}>
                <Ionicons name="close" size={16} color="#E53935" />
                <Text style={styles.filterChipResetText}>Reset</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>

        {/* MODAL RICERCA NOME CLIENTE - CENTRATO */}
        <Modal visible={showSearchModal} animationType="fade" transparent>
          <Pressable style={styles.modalOverlayCenter} onPress={() => setShowSearchModal(false)}>
            <Pressable style={styles.modalContentCenter} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cerca per nome cliente</Text>
                <Pressable onPress={() => setShowSearchModal(false)} hitSlop={10}>
                  <Ionicons name="close" size={24} color="#999" />
                </Pressable>
              </View>
              <TextInput
                style={styles.searchInputModal}
                placeholder="Nome o cognome..."
                placeholderTextColor="#999"
                value={filterUsername}
                onChangeText={setFilterUsername}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => setShowSearchModal(false)}
              />
              {filterUsername.length > 0 && (
                <Pressable onPress={() => setFilterUsername("")} style={{ marginTop: 12, alignSelf: 'flex-end' }}>
                  <Ionicons name="close-circle" size={22} color="#E53935" />
                </Pressable>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* LIST */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Caricamento...</Text>
          </View>
        ) : (
          <FlatList
            data={sortedBookings}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <BookingCard
                item={item}
                onPress={() =>
                  navigation.navigate("OwnerDettaglioPrenotazione", {
                    bookingId: item._id,
                  })
                }
              />
            )}
            showsVerticalScrollIndicator={false}
            onRefresh={async () => {
              await loadOwnerData();
              await loadBookings({ page: 1, force: true });
            }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.8}
            onScroll={handleScrollPrefetch}
            scrollEventThrottle={16}
            refreshing={refreshing}
            contentContainerStyle={styles.listContent}
            ListFooterComponent={null}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>Nessuna prenotazione</Text>
                <Text style={styles.emptyText}>
                  {hasActiveFilters
                    ? "Prova a modificare i filtri"
                    : filter === "ongoing"
                    ? "Non hai prenotazioni in corso"
                    : filter === "upcoming"
                    ? "Non hai prenotazioni in arrivo"
                    : filter === "past"
                    ? "Non hai prenotazioni concluse"
                    : "Non hai ancora prenotazioni"}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* STRUTTURA MODAL */}
      <FilterModal
        visible={showStrutturaModal}
        title="Seleziona Struttura"
        onClose={() => setShowStrutturaModal(false)}
        contentScrollable
        searchable
        searchPlaceholder="Cerca struttura..."
      >
        {(search) => (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.filterModalOption,
                styles.filterModalOptionWithBorder,
                pressed && { backgroundColor: "#E3F2FD" }
              ]}
              onPress={() => {
                setFilterStruttura("");
                setFilterCampo("");
                setShowStrutturaModal(false);
              }}
            >
              <Text style={styles.filterModalOptionText}>✨ Tutte le strutture</Text>
            </Pressable>
            {strutture.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map((struttura, index) => (
              <Pressable
                key={struttura._id}
                style={({ pressed }) => [
                  styles.filterModalOption,
                  index < strutture.length - 1 && styles.filterModalOptionWithBorder,
                  pressed && { backgroundColor: "#E3F2FD" }
                ]}
                onPress={() => {
                  setFilterStruttura(struttura._id);
                  setFilterCampo("");
                  setShowStrutturaModal(false);
                }}
              >
                <Ionicons name="business-outline" size={16} color="#2196F3" />
                <Text style={[styles.filterModalOptionText, { marginLeft: 12 }]}> 
                  {struttura.name}
                </Text>
              </Pressable>
            ))}
          </>
        )}
      </FilterModal>

      {/* CAMPO MODAL */}
      <FilterModal
        visible={showCampoModal}
        title="Seleziona Campo"
        onClose={() => setShowCampoModal(false)}
        contentScrollable
        searchable
        searchPlaceholder="Cerca campo..."
      >
        {(search) => (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.filterModalOption,
                styles.filterModalOptionWithBorder,
                pressed && { backgroundColor: "#E3F2FD" }
              ]}
              onPress={() => {
                setFilterCampo("");
                setShowCampoModal(false);
              }}
            >
              <Text style={styles.filterModalOptionText}>✨ Tutti i campi</Text>
            </Pressable>
            {campiFiltered.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map((campo, index) => (
              <Pressable
                key={campo._id}
                style={({ pressed }) => [
                  styles.filterModalOption,
                  index < campiFiltered.length - 1 && styles.filterModalOptionWithBorder,
                  pressed && { backgroundColor: "#E3F2FD" }
                ]}
                onPress={() => {
                  setFilterCampo(campo._id);
                  setShowCampoModal(false);
                }}
              >
                <Ionicons name="grid" size={16} color="#2196F3" />
                <Text style={[styles.filterModalOptionText, { marginLeft: 12 }]}> 
                  {campo.name}
                </Text>
              </Pressable>
            ))}
          </>
        )}
      </FilterModal>

      {/* SPORT MODAL */}
      <FilterModal
        visible={showSportModal}
        title="Seleziona Sport"
        onClose={() => setShowSportModal(false)}
        contentScrollable
        searchable
        searchPlaceholder="Cerca sport..."
      >
        {(search) => (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.filterModalOption,
                styles.filterModalOptionWithBorder,
                pressed && { backgroundColor: "#E3F2FD" }
              ]}
              onPress={() => {
                setFilterSport("");
                setShowSportModal(false);
              }}
            >
              <Text style={styles.filterModalOptionText}>✨ Tutti gli sport</Text>
            </Pressable>
            {sports.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map((sport, index) => (
              <Pressable
                key={sport._id}
                style={({ pressed }) => [
                  styles.filterModalOption,
                  index < sports.length - 1 && styles.filterModalOptionWithBorder,
                  pressed && { backgroundColor: "#E3F2FD" }
                ]}
                onPress={() => {
                  setFilterSport(sport.code);
                  setShowSportModal(false);
                }}
              >
                <SportIcon sport={sport.code} size={16} color="#2196F3" />
                <Text style={[styles.filterModalOptionText, { marginLeft: 12 }]}> 
                  {sport.name}
                </Text>
              </Pressable>
            ))}
          </>
        )}
      </FilterModal>

      {/* PAYMENT MODAL */}
      <FilterModal
        visible={showPaymentModal}
        title="Tipo pagamento"
        onClose={() => setShowPaymentModal(false)}
      >
        <>
          <Pressable
            style={({ pressed }) => [
              styles.filterModalOption,
              styles.filterModalOptionWithBorder,
              pressed && { backgroundColor: "#E3F2FD" }
            ]}
            onPress={() => {
              setFilterPaymentMode("");
              setShowPaymentModal(false);
            }}
          >
            <Text style={styles.filterModalOptionText}>✨ Tutti i pagamenti</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.filterModalOption,
              styles.filterModalOptionWithBorder,
              pressed && { backgroundColor: "#E3F2FD" }
            ]}
            onPress={() => {
              setFilterPaymentMode("split");
              setShowPaymentModal(false);
            }}
          >
            <Ionicons name="people-outline" size={16} color="#2196F3" />
            <Text style={[styles.filterModalOptionText, { marginLeft: 12 }]}>Costo diviso</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.filterModalOption,
              pressed && { backgroundColor: "#E3F2FD" }
            ]}
            onPress={() => {
              setFilterPaymentMode("full");
              setShowPaymentModal(false);
            }}
          >
            <Ionicons name="card-outline" size={16} color="#2196F3" />
            <Text style={[styles.filterModalOptionText, { marginLeft: 12 }]}>Intero</Text>
          </Pressable>
        </>
      </FilterModal>

      {/* CALENDAR MODAL */}
      <FilterModal
        visible={showCalendarModal}
        title="Seleziona Data"
        onClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={(day) => {
              setFilterDate(day.dateString);
              setShowCalendarModal(false);
            }}
            markedDates={{
              [filterDate]: {
                selected: true,
                selectedColor: "#2196F3",
              },
            }}
            theme={{
              selectedDayBackgroundColor: "#2196F3",
              todayTextColor: "#2196F3",
              arrowColor: "#2196F3",
              monthTextColor: "#333",
              textMonthFontSize: 18,
              textDayFontSize: 16,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
          />

          {filterDate && (
            <Pressable
              style={styles.clearDateButton}
              onPress={() => {
                setFilterDate("");
                setShowCalendarModal(false);
              }}
            >
              <Text style={styles.clearDateText}>Rimuovi filtro data</Text>
            </Pressable>
          )}
        </View>
      </FilterModal>
    </SafeAreaView>
  );
}
