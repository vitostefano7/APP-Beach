import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";

import API_URL from "../../config/api";

interface Slot {
  time: string;
  enabled: boolean;
  _id?: string;
}

interface CalendarDay {
  _id: string;
  campo: string;
  date: string;
  slots: Slot[];
  isClosed: boolean;
  bookingAction?: "cancelled" | null; // legacy: può non arrivare più dal backend
}

const MONTHS_FULL = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const DAYS_SHORT = ["D", "L", "M", "M", "G", "V", "S"];

/**
 * ✅ FIX: mese in formato locale (evita bug UTC / gennaio)
 */
const getMonthStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

export default function CampoCalendarioGestioneScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { campoId, campoName, strutturaId } = route.params;

  const [loading, setLoading] = useState(true);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editMode, setEditMode] = useState(false);

  // ✅ non esistono più /calendar/years e /calendar/generate nel backend nuovo
  // quindi rimuoviamo stati e logiche che chiamavano quei path:
  // const [availableYears, setAvailableYears] = useState<Array<{ year: number; daysCount: number }>>([]);

  /* =====================================================
     LOAD CALENDAR (quando cambia mese)
  ===================================================== */
  useEffect(() => {
    const loadCalendar = async () => {
      try {
        setLoading(true);

        // ✅ FIX: locale
        const month = getMonthStr(currentMonth);

        console.log("📅 Caricamento calendario per:", month);

        // ✅ NUOVO ENDPOINT (routes: /calendar/campo/:id?month=YYYY-MM)
        const res = await fetch(
          `${API_URL}/campi/${campoId}/calendar?month=${month}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        console.log(`✅ ${data.length} giorni caricati per ${month}`);
        console.log(
          "📊 Primi 3 giorni:",
          data.slice(0, 3).map((d: any) => ({ date: d.date, slots: d.slots?.length ?? 0 }))
        );

        setCalendarDays(data);
      } catch (err) {
        console.error("❌ Errore calendario:", err);
        Alert.alert("Errore", "Impossibile caricare il calendario");
      } finally {
        setLoading(false);
      }
    };

    loadCalendar();
  }, [currentMonth, campoId, token]);

  /* =====================================================
     LOGICA CALENDARIO
  ===================================================== */
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

  const getDayData = (date: Date | null): CalendarDay | null => {
    if (!date) return null;

    // formato locale YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    return calendarDays.find((d) => d.date === dateStr) || null;
  };

  const getDayStatus = (dayData: CalendarDay | null) => {
    if (!dayData) return "unknown";
    if (dayData.isClosed || dayData.slots.length === 0) return "closed";

    const enabled = dayData.slots.filter((s) => s.enabled).length;
    const total = dayData.slots.length;

    if (enabled === 0) return "full";
    if (enabled === total) return "available";
    return "partial";
  };

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  /* =====================================================
     LOGICA SLOT
  ===================================================== */

  const executeToggleSlot = async (date: string, time: string, newEnabled: boolean) => {
    try {
      // ✅ NUOVO ENDPOINT:
      // PUT /calendar/campo/:campoId/date/:date/slot
      const res = await fetch(
        `${API_URL}/calendar/campo/${campoId}/date/${date}/slot`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ time, enabled: newEnabled }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updatedDay = await res.json();

      setCalendarDays((prev) =>
        prev.map((day) => (day.date === date ? updatedDay : day))
      );

      // bookingAction potrebbe non arrivare più: lo lasciamo safe
      if (updatedDay?.bookingAction === "cancelled") {
        Alert.alert(
          "Prenotazione cancellata",
          "Lo slot è stato riabilitato e la prenotazione è stata cancellata."
        );
      }
    } catch (err) {
      console.error("❌ Errore toggle slot:", err);
      Alert.alert("Errore", "Impossibile aggiornare lo slot");
    }
  };

  const toggleSlot = async (date: string, time: string, currentEnabled: boolean) => {
    if (!editMode) return;

    const newEnabled = !currentEnabled;

    if (newEnabled && !currentEnabled) {
      Alert.alert(
        "Conferma",
        "Riabilitando questo slot, la prenotazione esistente verrà cancellata. Continuare?",
        [
          { text: "Annulla", style: "cancel" },
          {
            text: "Riabilita",
            style: "destructive",
            onPress: () => executeToggleSlot(date, time, newEnabled),
          },
        ]
      );
    } else {
      executeToggleSlot(date, time, newEnabled);
    }
  };

  const handleSlotClick = (date: string, time: string, slotEnabled: boolean) => {
    if (editMode) {
      toggleSlot(date, time, slotEnabled);
    } else {
      // Se slot disabilitato => in app tua logica: vedere prenotazioni
      if (!slotEnabled) {
        navigation.navigate("OwnerBookings", {
          filterDate: date,
          filterCampoId: campoId,
          filterStrutturaId: strutturaId,
        });
      }
    }
  };

  const closeDay = async (date: string) => {
    if (!editMode) return;

    Alert.alert(
      "Chiudi giornata",
      `Chiudendo questa giornata:\n• Tutti gli slot saranno disabilitati\n• Le prenotazioni esistenti verranno cancellate\n\nContinuare?`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Chiudi giornata",
          style: "destructive",
          onPress: async () => {
            try {
              // ✅ NUOVO ENDPOINT:
              // DELETE /calendar/campo/:campoId/date/:date
              const res = await fetch(
                `${API_URL}/calendar/campo/${campoId}/date/${date}`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const result = await res.json();

              // Nel nuovo controller: ritorna { message, cancelledBookings, calendarDay }
              const updatedDay = result.calendarDay ?? result;

              setCalendarDays((prev) =>
                prev.map((day) => (day.date === date ? updatedDay : day))
              );

              const cancelled = result.cancelledBookings ?? 0;

              const msg =
                cancelled > 0
                  ? `Giornata chiusa. ${cancelled} prenotazioni cancellate.`
                  : "Giornata chiusa con successo";

              Alert.alert("Successo", msg);
            } catch (err) {
              console.error("❌ Errore chiusura:", err);
              Alert.alert("Errore", "Impossibile chiudere la giornata");
            }
          },
        },
      ]
    );
  };

  const reopenDay = async (date: string) => {
    if (!editMode) return;

    Alert.alert(
      "Riapri giornata",
      "Vuoi riaprire questa giornata? Verranno creati gli slot di default.",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Riapri",
          onPress: async () => {
            try {
              // ✅ NUOVO ENDPOINT:
              // POST /calendar/campo/:campoId/date/:date/reopen
              const res = await fetch(
                `${API_URL}/calendar/campo/${campoId}/date/${date}/reopen`,
                {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const updatedDay = await res.json();

              setCalendarDays((prev) =>
                prev.map((day) => (day.date === date ? updatedDay : day))
              );

              Alert.alert("Successo", "Giornata riaperta");
            } catch (err) {
              console.error("❌ Errore riapertura:", err);
              Alert.alert("Errore", "Impossibile riaprire la giornata");
            }
          },
        },
      ]
    );
  };

  const selectedDayData = selectedDate
    ? calendarDays.find((d) => d.date === selectedDate)
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{campoName}</Text>
          <Text style={styles.headerSubtitle}>Calendario Annuale</Text>
        </View>
        <Pressable onPress={() => setEditMode(!editMode)}>
          <Text style={[styles.editBtn, editMode && styles.editBtnActive]}>
            {editMode ? "Fine" : "Modifica"}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.container}>
        {/* SELETTORE MESE */}
        <View style={styles.monthSelector}>
          <Pressable onPress={goToPrevMonth} style={styles.monthBtn} hitSlop={10}>
            <Text style={styles.monthBtnText}>‹</Text>
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.monthText}>
              {MONTHS_FULL[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            {!loading && calendarDays.length > 0 && (
              <Text style={styles.monthSubtext}>{calendarDays.length} giorni disponibili</Text>
            )}
            {!loading && calendarDays.length === 0 && (
              <Text style={styles.monthSubtextWarning}>Nessun dato</Text>
            )}
          </View>
          <Pressable onPress={goToNextMonth} style={styles.monthBtn} hitSlop={10}>
            <Text style={styles.monthBtnText}>›</Text>
          </Pressable>
        </View>

        {editMode && (
          <View style={styles.editBanner}>
            <Text style={styles.editBannerText}>
              ✏️ Modalità modifica attiva - Tocca uno slot per modificarlo
            </Text>
          </View>
        )}

        {!editMode && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              💡 Tocca uno slot prenotato per vedere i dettagli
            </Text>
          </View>
        )}

        {/* LEGENDA */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#4CAF50" }]} />
            <Text style={styles.legendText}>Disponibile</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF9800" }]} />
            <Text style={styles.legendText}>Parziale</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#F44336" }]} />
            <Text style={styles.legendText}>Pieno</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#999" }]} />
            <Text style={styles.legendText}>Chiuso</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
        ) : calendarDays.length === 0 ? (
          /**
           * ✅ In teoria col backend rolling non dovrebbe quasi mai essere vuoto.
           * Però lasciamo un empty state "safe" senza bottoni che chiamano API rimosse.
           */
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Nessun dato disponibile</Text>
            <Text style={styles.emptyText}>
              Il calendario per {MONTHS_FULL[currentMonth.getMonth()]} {currentMonth.getFullYear()} non è disponibile.
              {"\n"}Riprova tra poco o verifica la connessione.
            </Text>

            <Pressable
              style={styles.generateButton}
              onPress={() => {
                // refresh semplice: ritriggera useEffect cambiando month "a se stesso"
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
              }}
            >
              <Text style={styles.generateButtonText}>Ricarica</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* CALENDARIO INLINE */}
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
                    return <View key={`empty-${index}`} style={styles.dayCell} />;
                  }

                  // formato locale YYYY-MM-DD
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");
                  const dateStr = `${year}-${month}-${day}`;

                  const dayData = getDayData(date);
                  const status = getDayStatus(dayData);
                  const isSelected = selectedDate === dateStr;

                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
                    2,
                    "0"
                  )}-${String(today.getDate()).padStart(2, "0")}`;
                  const isToday = dateStr === todayStr;

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

                      {dayData && (
                        <View
                          style={[
                            styles.dayIndicator,
                            status === "available" && styles.indicatorAvailable,
                            status === "partial" && styles.indicatorPartial,
                            status === "full" && styles.indicatorFull,
                            status === "closed" && styles.indicatorClosed,
                          ]}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* DETTAGLIO GIORNO SELEZIONATO */}
            {selectedDate && selectedDayData && (
              <View style={styles.dayDetail}>
                <View style={styles.dayDetailHeader}>
                  <Text style={styles.dayDetailTitle}>
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("it-IT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </Text>
                  <Pressable onPress={() => setSelectedDate(null)}>
                    <Text style={styles.closeBtn}>✕</Text>
                  </Pressable>
                </View>

                {selectedDayData.isClosed ? (
                  <>
                    <View style={styles.closedBox}>
                      <Text style={styles.closedText}>🔒 Giornata chiusa</Text>
                    </View>
                    {editMode && (
                      <Pressable style={styles.reopenBtn} onPress={() => reopenDay(selectedDate)}>
                        <Text style={styles.reopenBtnText}>🔓 Riapri giornata</Text>
                      </Pressable>
                    )}
                  </>
                ) : (
                  <>
                    <View style={styles.slotsGrid}>
                      {selectedDayData.slots.map((slot, i) => (
                        <Pressable
                          key={i}
                          style={[
                            styles.slotItem,
                            slot.enabled ? styles.slotEnabled : styles.slotDisabled,
                            editMode && styles.slotItemEditable,
                          ]}
                          onPress={() => handleSlotClick(selectedDate, slot.time, slot.enabled)}
                        >
                          <Text
                            style={[
                              styles.slotTime,
                              !slot.enabled && styles.slotTimeDisabled,
                            ]}
                          >
                            {slot.time}
                          </Text>
                          {!slot.enabled && !editMode && (
                            <Text style={styles.slotLabel}>👆 Dettagli</Text>
                          )}
                        </Pressable>
                      ))}
                    </View>

                    {editMode && (
                      <Pressable style={styles.closeDayBtn} onPress={() => closeDay(selectedDate)}>
                        <Text style={styles.closeDayBtnText}>🔒 Chiudi giornata</Text>
                      </Pressable>
                    )}
                  </>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7f9" },
  header: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  back: { fontSize: 20, fontWeight: "800", width: 50 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSubtitle: { fontSize: 12, color: "#666", marginTop: 2 },
  editBtn: {
    fontSize: 16,
    fontWeight: "700",
    color: "#007AFF",
    width: 70,
    textAlign: "right",
  },
  editBtnActive: { color: "#FF5722" },

  container: { flex: 1 },

  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  monthBtn: {
    padding: 8,
    width: 40,
    alignItems: "center",
  },
  monthBtnText: {
    fontSize: 28,
    fontWeight: "300",
    color: "#007AFF",
  },
  monthText: {
    fontSize: 16,
    fontWeight: "700",
  },
  monthSubtext: {
    fontSize: 11,
    color: "#4CAF50",
    marginTop: 2,
    fontWeight: "600",
  },
  monthSubtextWarning: {
    fontSize: 11,
    color: "#FF5722",
    marginTop: 2,
    fontWeight: "600",
  },

  editBanner: {
    backgroundColor: "#FFF3E0",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  editBannerText: { fontSize: 13, color: "#E65100", fontWeight: "600" },

  infoBanner: {
    backgroundColor: "#E3F2FD",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  infoBannerText: { fontSize: 13, color: "#1565C0", fontWeight: "600" },

  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 16,
    marginHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },

  calendar: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
    position: "relative",
  },
  dayCellSelected: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  dayNumberSelected: {
    color: "white",
    fontWeight: "700",
  },
  dayNumberToday: {
    color: "#007AFF",
    fontWeight: "700",
  },
  dayIndicator: {
    position: "absolute",
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorAvailable: { backgroundColor: "#4CAF50" },
  indicatorPartial: { backgroundColor: "#FF9800" },
  indicatorFull: { backgroundColor: "#F44336" },
  indicatorClosed: { backgroundColor: "#999" },

  dayDetail: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dayDetailTitle: {
    fontSize: 16,
    fontWeight: "700",
    textTransform: "capitalize",
    flex: 1,
  },
  closeBtn: { fontSize: 20, color: "#999", fontWeight: "700" },

  closedBox: {
    padding: 16,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    alignItems: "center",
  },
  closedText: { fontSize: 14, fontWeight: "600", color: "#C62828" },

  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    minWidth: 80,
    alignItems: "center",
  },
  slotItemEditable: {
    borderWidth: 2,
  },
  slotEnabled: { backgroundColor: "#E8F5E9", borderColor: "#4CAF50" },
  slotDisabled: { backgroundColor: "#FFEBEE", borderColor: "#F44336" },
  slotTime: { fontSize: 14, fontWeight: "700", color: "#2E7D32" },
  slotTimeDisabled: { color: "#C62828" },
  slotLabel: { fontSize: 9, color: "#999", marginTop: 2, textAlign: "center" },

  closeDayBtn: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F44336",
  },
  closeDayBtnText: { fontSize: 14, fontWeight: "600", color: "#C62828" },

  reopenBtn: {
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  reopenBtnText: { fontSize: 14, fontWeight: "600", color: "#2E7D32" },

  // EMPTY STATE
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
    backgroundColor: "white",
    marginHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },

  // Re-used button style (prima era "Genera anno", ora è "Ricarica")
  generateButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  generateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
