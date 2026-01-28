import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../config/api";

/* =======================
   INTERFACES
======================= */

interface Booking {
  id: number;
  userId: number;
  userName: string;
  userPhone?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalPrice: number;
  status: string;
}

interface TimeSlot {
  time: string;
  status: "available" | "booked" | "closed";
  booking?: Booking;
}

interface DayData {
  date: string;
  slots: TimeSlot[];
  bookingsCount: number;
  closedSlotsCount: number;
}

const DAYS_SHORT = ["D", "L", "M", "M", "G", "V", "S"];
const MONTHS_FULL = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

/* =======================
   COMPONENT
======================= */

export default function CampoCalendarioGestioneScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { campoId, campoName, strutturaId } = route.params;

  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthData, setMonthData] = useState<Map<string, DayData>>(new Map());
  const [editMode, setEditMode] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [bookingDetailModal, setBookingDetailModal] = useState<Booking | null>(null);

  /* =======================
     LOAD DATA
  ======================= */

  const loadMonthData = useCallback(async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, "0");

      // Carica calendario + prenotazioni del mese
      const [calendarRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/calendar/campo/${campoId}?month=${year}-${month}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/owner/bookings?campoId=${campoId}&month=${year}-${month}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!calendarRes.ok || !bookingsRes.ok) {
        throw new Error("Errore nel caricamento dati");
      }

      const calendar = await calendarRes.json();
      const bookings: Booking[] = await bookingsRes.json();

      // Costruisci mappa dei dati
      const dataMap = new Map<string, DayData>();

      calendar.forEach((day: any) => {
        const slots: TimeSlot[] = day.slots.map((s: any) => ({
          time: s.time,
          status: s.enabled ? "available" : "closed",
        }));

        // Aggiungi prenotazioni
        const dayBookings = bookings.filter((b) => b.date === day.date);
        dayBookings.forEach((booking) => {
          const slotIndex = slots.findIndex((s) => s.time === booking.startTime);
          if (slotIndex >= 0) {
            slots[slotIndex] = {
              time: booking.startTime,
              status: "booked",
              booking,
            };
          }
        });

        dataMap.set(day.date, {
          date: day.date,
          slots,
          bookingsCount: dayBookings.length,
          closedSlotsCount: slots.filter((s) => s.status === "closed").length,
        });
      });

      setMonthData(dataMap);
    } catch (err) {
      console.error("Errore caricamento:", err);
      Alert.alert("Errore", "Impossibile caricare i dati del calendario");
    } finally {
      setLoading(false);
    }
  }, [campoId, currentMonth, token]);

  useFocusEffect(
    useCallback(() => {
      loadMonthData();
    }, [loadMonthData])
  );

  /* =======================
     CALENDAR LOGIC
  ======================= */

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

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDayStatus = (dateStr: string) => {
    const data = monthData.get(dateStr);
    if (!data) return "unknown";

    const { bookingsCount, closedSlotsCount, slots } = data;
    const totalSlots = slots.length;

    if (closedSlotsCount === totalSlots) return "closed";
    if (bookingsCount > 0) return "booked";
    return "available";
  };

  /* =======================
     SLOT MANAGEMENT
  ======================= */

  const toggleSlotSelection = (dateStr: string, time: string) => {
    const key = `${dateStr}|${time}`;
    const newSet = new Set(selectedSlots);
    
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    
    setSelectedSlots(newSet);
  };

  const closeSelectedSlots = async () => {
    if (selectedSlots.size === 0) {
      Alert.alert("Attenzione", "Seleziona almeno uno slot da chiudere");
      return;
    }

    Alert.alert(
      "Conferma Chiusura",
      `Vuoi chiudere ${selectedSlots.size} slot selezionati?\n\nLe eventuali prenotazioni esistenti verranno cancellate.`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Chiudi",
          style: "destructive",
          onPress: async () => {
            try {
              const promises = Array.from(selectedSlots).map((key) => {
                const [date, time] = key.split("|");
                return fetch(`${API_URL}/calendar/campo/${campoId}/date/${date}/slot`, {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ time, enabled: false }),
                });
              });

              await Promise.all(promises);
              
              Alert.alert("✅ Successo", "Slot chiusi con successo");
              setSelectedSlots(new Set());
              setEditMode(false);
              loadMonthData();
            } catch (err) {
              Alert.alert("Errore", "Impossibile chiudere gli slot selezionati");
            }
          },
        },
      ]
    );
  };

  const handleSlotPress = (dateStr: string, slot: TimeSlot) => {
    if (editMode) {
      // Modalità modifica: seleziona/deseleziona per chiusura
      if (slot.status === "available" || slot.status === "closed") {
        toggleSlotSelection(dateStr, slot.time);
      }
    } else {
      // Modalità visualizzazione: mostra dettagli prenotazione
      if (slot.status === "booked" && slot.booking) {
        setBookingDetailModal(slot.booking);
      }
    }
  };

  const navigateToBookingDetail = () => {
    if (!bookingDetailModal) return;
    
    setBookingDetailModal(null);
    navigation.navigate("BookingDetail", { bookingId: bookingDetailModal.id });
  };

  /* =======================
     RENDER
  ======================= */

  const selectedDayData = selectedDate ? monthData.get(selectedDate) : null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{campoName}</Text>
          <Text style={styles.headerSubtitle}>Gestione Calendario</Text>
        </View>
        <Pressable
          onPress={() => {
            setEditMode(!editMode);
            if (editMode) setSelectedSlots(new Set());
          }}
          style={[styles.editModeBtn, editMode && styles.editModeBtnActive]}
        >
          <Text style={[styles.editModeText, editMode && styles.editModeTextActive]}>
            {editMode ? "Fine" : "Modifica"}
          </Text>
        </Pressable>
      </View>

      {/* EDIT MODE BANNER */}
      {editMode && (
        <View style={styles.editBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.editBannerTitle}>
              ✏️ Modalità Chiusura Slot
            </Text>
            <Text style={styles.editBannerText}>
              Seleziona più slot contemporaneamente per chiuderli
            </Text>
          </View>
          {selectedSlots.size > 0 && (
            <Pressable style={styles.closeSelectedBtn} onPress={closeSelectedSlots}>
              <Text style={styles.closeSelectedText}>
                Chiudi {selectedSlots.size}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      <ScrollView style={styles.container}>
        {/* MONTH SELECTOR */}
        <View style={styles.monthSelector}>
          <Pressable
            onPress={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
              )
            }
            style={styles.monthArrow}
          >
            <Ionicons name="chevron-back" size={28} color="#2196F3" />
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.monthText}>
              {MONTHS_FULL[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            {!loading && (
              <Text style={styles.monthSubtext}>
                {monthData.size} giorni nel calendario
              </Text>
            )}
          </View>
          <Pressable
            onPress={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
              )
            }
            style={styles.monthArrow}
          >
            <Ionicons name="chevron-forward" size={28} color="#2196F3" />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* CALENDAR */}
            <View style={styles.calendarCard}>
              {/* Week days */}
              <View style={styles.weekDays}>
                {DAYS_SHORT.map((day, i) => (
                  <Text key={i} style={styles.weekDay}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Days grid */}
              <View style={styles.daysGrid}>
                {getDaysInMonth().map((date, index) => {
                  if (!date) {
                    return <View key={`empty-${index}`} style={styles.dayCell} />;
                  }

                  const dateStr = formatDate(date);
                  const status = getDayStatus(dateStr);
                  const isSelected = selectedDate === dateStr;
                  const dayData = monthData.get(dateStr);

                  const isToday = formatDate(new Date()) === dateStr;

                  return (
                    <Pressable
                      key={dateStr}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        isToday && !isSelected && styles.dayCellToday,
                      ]}
                      onPress={() => setSelectedDate(dateStr)}
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

                      {/* Status indicators */}
                      {dayData && (
                        <View style={styles.dayIndicators}>
                          {dayData.bookingsCount > 0 && (
                            <View style={[styles.indicator, styles.indicatorBooked]}>
                              <Text style={styles.indicatorText}>{dayData.bookingsCount}</Text>
                            </View>
                          )}
                          {dayData.closedSlotsCount > 0 && (
                            <View style={[styles.indicator, styles.indicatorClosed]}>
                              <Ionicons name="lock-closed" size={8} color="#fff" />
                            </View>
                          )}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* DAY DETAIL - SLOT LIST */}
            {selectedDate && selectedDayData && (
              <View style={styles.dayDetailCard}>
                <View style={styles.dayDetailHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dayDetailDate}>
                      {new Date(selectedDate + "T12:00:00").toLocaleDateString("it-IT", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </Text>
                    <Text style={styles.dayDetailStats}>
                      {selectedDayData.bookingsCount} prenotazioni • {selectedDayData.closedSlotsCount} slot chiusi
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelectedDate(null)}>
                    <Ionicons name="close" size={24} color="#999" />
                  </Pressable>
                </View>

                {/* SLOTS LIST */}
                <ScrollView style={styles.slotsList} showsVerticalScrollIndicator={false}>
                  {selectedDayData.slots.map((slot, index) => {
                    const isSelected = selectedSlots.has(`${selectedDate}|${slot.time}`);

                    return (
                      <Pressable
                        key={index}
                        style={[
                          styles.slotCard,
                          slot.status === "booked" && styles.slotCardBooked,
                          slot.status === "closed" && styles.slotCardClosed,
                          isSelected && styles.slotCardSelected,
                        ]}
                        onPress={() => handleSlotPress(selectedDate, slot)}
                      >
                        <View style={styles.slotLeft}>
                          <View style={styles.slotTimeContainer}>
                            <Ionicons
                              name="time-outline"
                              size={18}
                              color={
                                slot.status === "booked"
                                  ? "#2196F3"
                                  : slot.status === "closed"
                                  ? "#999"
                                  : "#4CAF50"
                              }
                            />
                            <Text style={styles.slotTime}>{slot.time}</Text>
                          </View>

                          {slot.status === "booked" && slot.booking && (
                            <View style={styles.slotBookingInfo}>
                              <Text style={styles.slotBookingUser}>
                                <Ionicons name="person" size={12} /> {slot.booking.userName}
                              </Text>
                              <Text style={styles.slotBookingDetails}>
                                {slot.booking.startTime} - {slot.booking.endTime} • €{slot.booking.totalPrice}
                              </Text>
                            </View>
                          )}

                          {slot.status === "closed" && (
                            <Text style={styles.slotClosedText}>Slot chiuso</Text>
                          )}

                          {slot.status === "available" && (
                            <Text style={styles.slotAvailableText}>Disponibile</Text>
                          )}
                        </View>

                        <View style={styles.slotRight}>
                          {editMode && (slot.status === "available" || slot.status === "closed") && (
                            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                              {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                          )}

                          {!editMode && slot.status === "booked" && (
                            <Ionicons name="chevron-forward" size={20} color="#2196F3" />
                          )}

                          {!editMode && slot.status === "closed" && (
                            <Ionicons name="lock-closed" size={18} color="#999" />
                          )}

                          {!editMode && slot.status === "available" && (
                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* BOOKING DETAIL MODAL */}
      <Modal
        visible={!!bookingDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setBookingDetailModal(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setBookingDetailModal(null)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 Dettagli Prenotazione</Text>
              <Pressable onPress={() => setBookingDetailModal(null)}>
                <Ionicons name="close" size={28} color="#999" />
              </Pressable>
            </View>

            {bookingDetailModal && (
              <>
                <View style={styles.modalRow}>
                  <Ionicons name="person" size={20} color="#2196F3" />
                  <Text style={styles.modalLabel}>Cliente</Text>
                  <Text style={styles.modalValue}>{bookingDetailModal.userName}</Text>
                </View>

                {bookingDetailModal.userPhone && (
                  <View style={styles.modalRow}>
                    <Ionicons name="call" size={20} color="#2196F3" />
                    <Text style={styles.modalLabel}>Telefono</Text>
                    <Text style={styles.modalValue}>{bookingDetailModal.userPhone}</Text>
                  </View>
                )}

                <View style={styles.modalRow}>
                  <Ionicons name="calendar" size={20} color="#2196F3" />
                  <Text style={styles.modalLabel}>Data</Text>
                  <Text style={styles.modalValue}>
                    {new Date(bookingDetailModal.date + "T12:00:00").toLocaleDateString("it-IT")}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Ionicons name="time" size={20} color="#2196F3" />
                  <Text style={styles.modalLabel}>Orario</Text>
                  <Text style={styles.modalValue}>
                    {bookingDetailModal.startTime} - {bookingDetailModal.endTime}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Ionicons name="timer" size={20} color="#2196F3" />
                  <Text style={styles.modalLabel}>Durata</Text>
                  <Text style={styles.modalValue}>{bookingDetailModal.duration}h</Text>
                </View>

                <View style={styles.modalRow}>
                  <Ionicons name="cash" size={20} color="#2196F3" />
                  <Text style={styles.modalLabel}>Totale</Text>
                  <Text style={styles.modalValueBold}>€{bookingDetailModal.totalPrice}</Text>
                </View>

                <Pressable style={styles.modalDetailBtn} onPress={navigateToBookingDetail}>
                  <Text style={styles.modalDetailBtnText}>Vedi Dettaglio Completo</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* =======================
   STYLES
======================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f9fa" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
  headerSubtitle: { fontSize: 13, color: "#666", marginTop: 2 },
  editModeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  editModeBtnActive: {
    backgroundColor: "#FF5722",
    borderColor: "#FF5722",
  },
  editModeText: { fontSize: 14, fontWeight: "700", color: "#2196F3" },
  editModeTextActive: { color: "white" },

  editBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE0B2",
    gap: 12,
  },
  editBannerTitle: { fontSize: 14, fontWeight: "700", color: "#E65100" },
  editBannerText: { fontSize: 12, color: "#F57C00", marginTop: 2 },
  closeSelectedBtn: {
    backgroundColor: "#FF5722",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeSelectedText: { fontSize: 13, fontWeight: "700", color: "white" },

  container: { flex: 1 },

  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthArrow: { padding: 8 },
  monthText: { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
  monthSubtext: { fontSize: 12, color: "#666", marginTop: 4 },

  calendarCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekDays: { flexDirection: "row", marginBottom: 12 },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#999",
  },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dayCellSelected: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: "#2196F3",
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  dayNumberSelected: { color: "white", fontWeight: "700" },
  dayNumberToday: { color: "#2196F3", fontWeight: "700" },
  dayIndicators: {
    position: "absolute",
    bottom: 2,
    flexDirection: "row",
    gap: 2,
  },
  indicator: {
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  indicatorBooked: { backgroundColor: "#2196F3" },
  indicatorClosed: { backgroundColor: "#999" },
  indicatorText: { fontSize: 9, fontWeight: "700", color: "white" },

  dayDetailCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  dayDetailDate: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
    textTransform: "capitalize",
  },
  dayDetailStats: { fontSize: 12, color: "#666", marginTop: 4 },

  slotsList: { maxHeight: 400 },
  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  slotCardBooked: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  slotCardClosed: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  slotCardSelected: {
    borderColor: "#FF5722",
    backgroundColor: "#FFF3E0",
  },
  slotLeft: { flex: 1 },
  slotRight: { marginLeft: 12 },
  slotTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  slotTime: { fontSize: 16, fontWeight: "800", color: "#1a1a1a" },
  slotBookingInfo: { marginTop: 4 },
  slotBookingUser: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2196F3",
    marginBottom: 2,
  },
  slotBookingDetails: { fontSize: 12, color: "#666" },
  slotClosedText: { fontSize: 13, color: "#999", fontWeight: "600" },
  slotAvailableText: { fontSize: 13, color: "#4CAF50", fontWeight: "600" },

  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#FF5722",
    borderColor: "#FF5722",
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1a1a1a" },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  modalLabel: { fontSize: 14, color: "#666", flex: 1 },
  modalValue: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  modalValueBold: { fontSize: 18, fontWeight: "800", color: "#4CAF50" },
  modalDetailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  modalDetailBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
});
