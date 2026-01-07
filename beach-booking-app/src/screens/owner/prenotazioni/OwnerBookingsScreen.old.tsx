import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useCallback } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useRoute, useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import API_URL from "../../../config/api";

/* =========================
   UTILITY: Controlla se una prenotazione è conclusa
========================= */
function isBookingCompleted(date: string, endTime: string): boolean {
  const now = new Date();
  const bookingDate = new Date(date + "T" + endTime);
  return bookingDate < now;
}

/* =========================
   CARD PRENOTAZIONE
========================= */
function BookingCard({ item, onPress }: { item: any; onPress: () => void }) {
  const cancelled = item.status === "cancelled";
  
  // ✅ Una prenotazione è conclusa se l'orario di fine è passato
  const isCompleted = isBookingCompleted(item.date, item.endTime);

  const strutturaName = item.campo?.struttura?.name ?? "Struttura sconosciuta";
  const campoName = item.campo?.name ?? "Campo";
  const playerName = item.user?.name ?? "Utente";
  const sport = item.campo?.sport ?? "";

  const getSportIcon = () => {
    switch (sport) {
      case "beach_volley":
        return "fitness";
      case "volley":
        return "basketball";
      default:
        return "football";
    }
  };

  const getStatusBadge = () => {
    if (cancelled) {
      return {
        text: "CANCELLATA",
        color: "#E53935",
        bg: "#FFEBEE",
        icon: "close-circle",
      };
    }
    if (isCompleted) {
      return {
        text: "CONCLUSA",
        color: "#757575",
        bg: "#F5F5F5",
        icon: "checkmark-circle",
      };
    }
    return {
      text: "CONFERMATA",
      color: "#4CAF50",
      bg: "#E8F5E9",
      icon: "checkmark-circle",
    };
  };

  const status = getStatusBadge();

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.sportIcon}>
            <Ionicons name={getSportIcon() as any} size={20} color="#2196F3" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.struttura}>{strutturaName}</Text>
            <Text style={styles.campo}>{campoName}</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon as any} size={12} color={status.color} />
          <Text style={[styles.badgeText, { color: status.color }]}>
            {status.text}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.date}>
            {new Date(item.date + "T12:00:00").toLocaleDateString("it-IT", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.time}>
            {item.startTime} - {item.endTime}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.player}>{playerName}</Text>
        </View>

        {item.match && (
          <View style={styles.resultBox}>
            <Ionicons name="trophy" size={14} color="#FFC107" />
            <Text
              style={[
                styles.resultText,
                item.match.winner === "A" ? styles.win : styles.lose,
              ]}
            >
              {item.match.winner === "A" ? "Vittoria Team A" : "Vittoria Team B"}
            </Text>
            <Text style={styles.setsCount}>
              ({item.match.sets.length} set)
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Incasso</Text>
          <Text style={styles.price}>€{item.price}</Text>
        </View>
        <View style={styles.viewDetailsHint}>
          <Text style={styles.viewDetailsText}>Dettagli</Text>
          <Ionicons name="chevron-forward" size={16} color="#2196F3" />
        </View>
      </View>
    </Pressable>
  );
}

/* =========================
   MODALE SELEZIONE STATO
========================= */
function StatoModal({
  visible,
  onClose,
  selectedStatus,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  selectedStatus: "active" | "cancelled" | "completed";
  onSelect: (status: "active" | "cancelled" | "completed") => void;
}) {
  const options = [
    { value: "active", label: "Attive", icon: "checkmark-circle-outline" },
    { value: "cancelled", label: "Cancellate", icon: "close-circle-outline" },
    { value: "completed", label: "Concluse", icon: "flag-outline" },
  ] as const;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Stato Prenotazioni</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color="#999" />
            </Pressable>
          </View>

          <View style={styles.optionsList}>
            {options.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.optionItem,
                  selectedStatus === option.value && styles.optionItemSelected,
                ]}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <View style={styles.optionItemLeft}>
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={selectedStatus === option.value ? "#2196F3" : "#666"}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      selectedStatus === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {selectedStatus === option.value && (
                  <Ionicons name="checkmark" size={20} color="#2196F3" />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* =========================
   MODALE SELEZIONE STRUTTURA
========================= */
function StrutturaModal({
  visible,
  onClose,
  strutture,
  selectedId,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  strutture: Array<{ _id: string; name: string }>;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleziona Struttura</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color="#999" />
            </Pressable>
          </View>

          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            <Pressable
              style={[styles.optionItem, !selectedId && styles.optionItemSelected]}
              onPress={() => {
                onSelect("");
                onClose();
              }}
            >
              <Text style={[styles.optionText, !selectedId && styles.optionTextSelected]}>
                Tutte le strutture
              </Text>
              {!selectedId && <Ionicons name="checkmark" size={20} color="#2196F3" />}
            </Pressable>

            {strutture.map((struttura) => (
              <Pressable
                key={struttura._id}
                style={[
                  styles.optionItem,
                  selectedId === struttura._id && styles.optionItemSelected,
                ]}
                onPress={() => {
                  onSelect(struttura._id);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedId === struttura._id && styles.optionTextSelected,
                  ]}
                >
                  {struttura.name}
                </Text>
                {selectedId === struttura._id && (
                  <Ionicons name="checkmark" size={20} color="#2196F3" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* =========================
   MODALE SELEZIONE CAMPO
========================= */
function CampoModal({
  visible,
  onClose,
  campi,
  selectedId,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  campi: Array<{ _id: string; name: string }>;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleziona Campo</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color="#999" />
            </Pressable>
          </View>

          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            <Pressable
              style={[styles.optionItem, !selectedId && styles.optionItemSelected]}
              onPress={() => {
                onSelect("");
                onClose();
              }}
            >
              <Text style={[styles.optionText, !selectedId && styles.optionTextSelected]}>
                Tutti i campi
              </Text>
              {!selectedId && <Ionicons name="checkmark" size={20} color="#2196F3" />}
            </Pressable>

            {campi.map((campo) => (
              <Pressable
                key={campo._id}
                style={[
                  styles.optionItem,
                  selectedId === campo._id && styles.optionItemSelected,
                ]}
                onPress={() => {
                  onSelect(campo._id);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedId === campo._id && styles.optionTextSelected,
                  ]}
                >
                  {campo.name}
                </Text>
                {selectedId === campo._id && (
                  <Ionicons name="checkmark" size={20} color="#2196F3" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* =========================
   CALENDARIO MODALE
========================= */
function CalendarModal({
  visible,
  onClose,
  onSelectDate,
  selectedDate,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  selectedDate: string;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const MONTHS = [
    "Gen",
    "Feb",
    "Mar",
    "Apr",
    "Mag",
    "Giu",
    "Lug",
    "Ago",
    "Set",
    "Ott",
    "Nov",
    "Dic",
  ];

  const DAYS_SHORT = ["D", "L", "M", "M", "G", "V", "S"];

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  const toLocalDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const todayStr = toLocalDateString(new Date());

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleziona Data</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color="#999" />
            </Pressable>
          </View>

          <View style={styles.monthSelector}>
            <Pressable onPress={goToPrevMonth} style={styles.monthBtn} hitSlop={10}>
              <Ionicons name="chevron-back" size={24} color="#2196F3" />
            </Pressable>
            <Text style={styles.monthText}>
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <Pressable onPress={goToNextMonth} style={styles.monthBtn} hitSlop={10}>
              <Ionicons name="chevron-forward" size={24} color="#2196F3" />
            </Pressable>
          </View>

          <View style={styles.calendar}>
            <View style={styles.weekHeader}>
              {DAYS_SHORT.map((day, idx) => (
                <Text key={`${day}-${idx}`} style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {getDaysInMonth().map((date, index) => {
                if (!date) {
                  return (
                    <View key={`empty-${index}`} style={styles.dayCol}>
                      <View style={styles.dayCell} />
                    </View>
                  );
                }

                const dateStr = toLocalDateString(date);
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === todayStr;

                return (
                  <View key={dateStr} style={styles.dayCol}>
                    <Pressable
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        isToday && !isSelected && styles.dayCellToday,
                      ]}
                      onPress={() => {
                        onSelectDate(dateStr);
                        onClose();
                      }}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          isSelected && styles.dayNumberSelected,
                          isToday && !isSelected && styles.dayNumberToday,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>

          <Pressable
            style={styles.todayButton}
            onPress={() => {
              onSelectDate(todayStr);
              onClose();
            }}
          >
            <Text style={styles.todayButtonText}>Oggi</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* =========================
   SCREEN
========================= */
export default function OwnerBookingsScreen() {
  const { token } = useContext(AuthContext);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [strutture, setStrutture] = useState<Array<{ _id: string; name: string }>>([]);
  const [campi, setCampi] = useState<Array<{ _id: string; name: string; strutturaId: string }>>([]);

  const [filterDate, setFilterDate] = useState(route.params?.filterDate || "");
  const [filterCampo, setFilterCampo] = useState(route.params?.filterCampoId || "");
  const [filterStruttura, setFilterStruttura] = useState(route.params?.filterStrutturaId || "");
  const [filterUsername, setFilterUsername] = useState(""); // ✅ NUOVO
  const [statusFilter, setStatusFilter] = useState<"active" | "cancelled" | "completed">("active");

  const [showCalendar, setShowCalendar] = useState(false);
  const [showStatoModal, setShowStatoModal] = useState(false);
  const [showStrutturaModal, setShowStrutturaModal] = useState(false);
  const [showCampoModal, setShowCampoModal] = useState(false);

  const loadOwnerData = async () => {
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
          console.log(`⚠️ Errore caricamento campi per struttura ${struttura._id}`, err);
        }
      }

      setCampi(allCampi);
    } catch (err) {
      console.log("❌ Errore caricamento dati owner", err);
    }
  };

  const loadBookings = async () => {
    if (!token) return;

    try {
      setRefreshing(true);

      const res = await fetch(`${API_URL}/bookings/owner`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setBookings(data);
      setLoading(false);
    } catch (err) {
      console.log("❌ Errore fetch owner bookings", err);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await loadOwnerData();
        await loadBookings();
      };

      loadData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])
  );

  const applyFilters = useCallback(() => {
    let result = bookings;

    // ✅ Filtro per stato (considerando l'orario di fine)
    if (statusFilter === "active") {
      result = result.filter((b) => {
        return b.status === "confirmed" && !isBookingCompleted(b.date, b.endTime);
      });
    } else if (statusFilter === "cancelled") {
      result = result.filter((b) => b.status === "cancelled");
    } else if (statusFilter === "completed") {
      result = result.filter((b) => {
        return b.status === "confirmed" && isBookingCompleted(b.date, b.endTime);
      });
    }

    if (filterDate) {
      result = result.filter((b) => b.date === filterDate);
    }

    if (filterStruttura) {
      result = result.filter((b) => b.campo?.struttura?._id === filterStruttura);
    }

    if (filterCampo) {
      result = result.filter((b) => b.campo?._id === filterCampo);
    }

    // ✅ Filtro per nome utente
    if (filterUsername.trim()) {
      const searchLower = filterUsername.toLowerCase().trim();
      result = result.filter((b) => {
        const userName = b.user?.name?.toLowerCase() || "";
        return userName.includes(searchLower);
      });
    }

    setFilteredBookings(result);
  }, [bookings, filterDate, filterCampo, filterStruttura, filterUsername, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      applyFilters();
    }, [applyFilters])
  );

  const campiFiltered = filterStruttura
    ? campi.filter((c) => c.strutturaId === filterStruttura)
    : campi;

  const clearFilters = () => {
    setFilterDate("");
    setFilterCampo("");
    setFilterStruttura("");
    setFilterUsername(""); // ✅ Reset ricerca
  };

  const hasActiveFilters = filterDate || filterCampo || filterStruttura || filterUsername;

  const handleBookingPress = (booking: any) => {
    navigation.navigate("OwnerDettaglioPrenotazione", {
      bookingId: booking._id,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="calendar" size={26} color="#2196F3" />
            </View>
            <View>
              <Text style={styles.title}>Prenotazioni</Text>
              <Text style={styles.subtitle}>
                {filteredBookings.length}{" "}
                {filteredBookings.length === 1 ? "prenotazione" : "prenotazioni"}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={async () => {
              await loadOwnerData();
              await loadBookings();
            }}
            disabled={refreshing}
            style={styles.refreshButton}
          >
            <Ionicons
              name={refreshing ? "hourglass-outline" : "refresh"}
              size={24}
              color="#2196F3"
            />
          </Pressable>
        </View>

        {/* ✅ BARRA DI RICERCA */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca per nome utente..."
            placeholderTextColor="#999"
            value={filterUsername}
            onChangeText={setFilterUsername}
          />
          {filterUsername.length > 0 && (
            <Pressable onPress={() => setFilterUsername("")} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </Pressable>
          )}
        </View>

        {/* FILTRI COMPATTI */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {/* 1. Data */}
          <Pressable
            style={[styles.filterChip, filterDate && styles.filterChipActive]}
            onPress={() => setShowCalendar(true)}
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

          {/* 2. Struttura */}
          <Pressable
            style={[styles.filterChip, filterStruttura && styles.filterChipActive]}
            onPress={() => setShowStrutturaModal(true)}
          >
            <Ionicons
              name="business-outline"
              size={16}
              color={filterStruttura ? "white" : "#666"}
            />
            <Text
              style={[styles.filterChipText, filterStruttura && styles.filterChipTextActive]}
            >
              {filterStruttura
                ? strutture.find((s) => s._id === filterStruttura)?.name || "Struttura"
                : "Struttura"}
            </Text>
          </Pressable>

          {/* 3. Campo (solo se struttura selezionata) */}
          {filterStruttura && campiFiltered.length > 0 && (
            <Pressable
              style={[styles.filterChip, filterCampo && styles.filterChipActive]}
              onPress={() => setShowCampoModal(true)}
            >
              <Ionicons
                name="basketball-outline"
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

          {/* 4. Stato */}
          <Pressable
            style={[styles.filterChip, styles.filterChipActive]}
            onPress={() => setShowStatoModal(true)}
          >
            <Ionicons
              name={
                statusFilter === "active"
                  ? "checkmark-circle-outline"
                  : statusFilter === "cancelled"
                  ? "close-circle-outline"
                  : "flag-outline"
              }
              size={16}
              color="white"
            />
            <Text style={[styles.filterChipText, styles.filterChipTextActive]}>
              {statusFilter === "active"
                ? "Attive"
                : statusFilter === "cancelled"
                ? "Cancellate"
                : "Concluse"}
            </Text>
          </Pressable>

          {/* Reset (solo se ci sono altri filtri attivi) */}
          {hasActiveFilters && (
            <Pressable style={styles.filterChipReset} onPress={clearFilters}>
              <Ionicons name="close" size={16} color="#E53935" />
              <Text style={styles.filterChipResetText}>Reset</Text>
            </Pressable>
          )}
        </ScrollView>

        {/* LISTA */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Caricamento...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBookings}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <BookingCard item={item} onPress={() => handleBookingPress(item)} />
            )}
            showsVerticalScrollIndicator={false}
            onRefresh={async () => {
              await loadOwnerData();
              await loadBookings();
            }}
            refreshing={refreshing}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>Nessuna prenotazione</Text>
                <Text style={styles.emptyText}>
                  {hasActiveFilters
                    ? "Prova a modificare i filtri"
                    : statusFilter === "active"
                    ? "Non hai prenotazioni attive"
                    : statusFilter === "cancelled"
                    ? "Non hai prenotazioni cancellate"
                    : "Non hai prenotazioni concluse"}
                </Text>
              </View>
            }
          />
        )}
      </View>

      <StatoModal
        visible={showStatoModal}
        onClose={() => setShowStatoModal(false)}
        selectedStatus={statusFilter}
        onSelect={(status) => setStatusFilter(status)}
      />

      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onSelectDate={(date) => {
          setFilterDate(date);
          setShowCalendar(false);
        }}
        selectedDate={filterDate}
      />

      <StrutturaModal
        visible={showStrutturaModal}
        onClose={() => setShowStrutturaModal(false)}
        strutture={strutture}
        selectedId={filterStruttura}
        onSelect={(id) => {
          setFilterStruttura(id);
          setFilterCampo("");
        }}
      />

      <CampoModal
        visible={showCampoModal}
        onClose={() => setShowCampoModal(false)}
        campi={campiFiltered}
        selectedId={filterCampo}
        onSelect={(id) => {
          setFilterCampo(id);
        }}
      />
    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  container: {
    flex: 1,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  subtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
    fontWeight: "600",
  },

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  // ✅ BARRA RICERCA
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e9ecef",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },

  // FILTRI SCROLL
  filtersScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 60,
    marginBottom: 16,
  },

  filtersScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 8,
    alignItems: "flex-start",
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#e9ecef",
    gap: 8,
    height: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  filterChipActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },

  filterChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    lineHeight: 16,
  },

  filterChipTextActive: {
    color: "white",
  },

  filterChipReset: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#E53935",
    gap: 8,
    height: 44,
    shadowColor: "#E53935",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  filterChipResetText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#E53935",
    lineHeight: 16,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    gap: 16,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#333",
  },

  emptyText: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 22,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f5f5f5",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },

  sportIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  cardBody: {
    gap: 8,
    marginBottom: 12,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  struttura: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  campo: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    marginTop: 2,
  },

  date: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
    textTransform: "capitalize",
  },

  time: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },

  player: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  resultBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF3E0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  resultText: {
    fontSize: 13,
    fontWeight: "700",
  },

  win: {
    color: "#4CAF50",
  },

  lose: {
    color: "#F44336",
  },

  setsCount: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },

  priceBox: {
    gap: 2,
  },

  priceLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
  },

  price: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4CAF50",
  },

  viewDetailsHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  viewDetailsText: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1a1a1a",
  },

  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 14,
  },

  monthBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  monthText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  calendar: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 12,
  },

  weekHeader: {
    flexDirection: "row",
    marginBottom: 10,
  },

  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
    color: "#999",
    letterSpacing: 0.5,
  },

  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  dayCol: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 3,
  },

  dayCell: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "white",
  },

  dayCellSelected: {
    backgroundColor: "#2196F3",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  dayCellToday: {
    borderWidth: 2.5,
    borderColor: "#2196F3",
  },

  dayNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },

  dayNumberSelected: {
    color: "white",
    fontWeight: "900",
  },

  dayNumberToday: {
    color: "#2196F3",
    fontWeight: "900",
  },

  todayButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 18,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  todayButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },

  optionsList: {
    maxHeight: 400,
  },

  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "white",
  },

  optionItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  optionItemSelected: {
    backgroundColor: "#E3F2FD",
  },

  optionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },

  optionTextSelected: {
    color: "#2196F3",
    fontWeight: "800",
  },
});