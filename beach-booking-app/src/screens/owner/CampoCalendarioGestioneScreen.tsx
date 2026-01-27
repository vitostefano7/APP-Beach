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

interface Booking {
  _id?: string;
  id?: string;
  user?: { name?: string; surname?: string; email?: string; phone?: string } | null;
  userName?: string;
  userSurname?: string;
  userEmail?: string;
  userPhone?: string;
  startTime: string;
  endTime: string;
  date: string;
  duration?: number;
  totalPrice?: number;
  status?: string;
} 

interface CalendarDay {
  _id: string;
  campo: string;
  date: string;
  slots: Slot[];
  isClosed: boolean;
  bookingAction?: "cancelled" | null;
}

const MONTHS_FULL = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const DAYS_SHORT = ["D", "L", "M", "M", "G", "V", "S"];

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
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

  /* =====================================================
     LOAD CALENDAR
  ===================================================== */
  useEffect(() => {
    const loadCalendar = async () => {
      try {
        setLoading(true);
        const month = getMonthStr(currentMonth);

        console.log("📅 Caricamento calendario per:", month);

        // ✅ CARICA INFO CAMPO + STRUTTURA
        const campoRes = await fetch(`${API_URL}/campi/${campoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const campoData = await campoRes.json();
        
        console.log("=== DEBUG CAMPO ===");
        console.log("📋 Campo:", campoData.name);
        console.log("🏟️ Struttura:", campoData.struttura?.name);
        console.log("📆 WeeklySchedule del campo:");
        console.log(JSON.stringify(campoData.weeklySchedule, null, 2));
        console.log("🕒 OpeningHours della struttura:");
        console.log(JSON.stringify(campoData.struttura?.openingHours, null, 2));

        // ✅ ENDPOINT CORRETTO: GET /calendar/campo/:id
        const res = await fetch(
          `${API_URL}/calendar/campo/${campoId}?month=${month}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) {
          console.error("❌ HTTP Error:", res.status);
          throw new Error(`HTTP ${res.status}`);
        }
        
        const data = await res.json();

        console.log(`✅ ${data.length} giorni caricati per ${month}`);
        
        // ✅ DEBUG PRIMI 3 GIORNI
        console.log("=== DEBUG CALENDARIO ===");
        data.slice(0, 3).forEach((day: CalendarDay) => {
          const dateObj = new Date(day.date + "T12:00:00");
          const dayName = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"][dateObj.getDay()];
          
          console.log(`📅 ${day.date} (${dayName})`);
          console.log(`   Chiuso: ${day.isClosed}`);
          console.log(`   Slots (${day.slots.length}):`, day.slots.map(s => s.time).join(", "));
        });
        console.log("==================");

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
     LOAD BOOKINGS FOR SELECTED DAY
  ===================================================== */
  useEffect(() => {
    const loadDayBookings = async () => {
      if (!selectedDate) {
        setDayBookings([]);
        return;
      }

      try {
        console.log("📅 Caricamento prenotazioni per:", selectedDate);
        const res = await fetch(
          `${API_URL}/owner/bookings?campoId=${campoId}&date=${selectedDate}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.ok) {
          const bookings = await res.json();
          console.log("✅ Prenotazioni caricate:", bookings.length);
          console.log("📋 Dettaglio prenotazioni:", JSON.stringify(bookings, null, 2));
          setDayBookings(bookings);
        } else {
          console.error("❌ Errore HTTP:", res.status);
        }
      } catch (err) {
        console.error("❌ Errore caricamento prenotazioni:", err);
      }
    };

    loadDayBookings();
  }, [selectedDate, campoId, token]);

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
      console.log("🔄 Toggle slot:", { date, time, newEnabled });
      
      // ✅ ENDPOINT CORRETTO: PUT /calendar/campo/:campoId/date/:date/slot
      const endpoint = `${API_URL}/calendar/campo/${campoId}/date/${date}/slot`;
      console.log("📡 Endpoint:", endpoint);

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ time, enabled: newEnabled }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Response:", res.status, errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const updatedDay = await res.json();

      setCalendarDays((prev) =>
        prev.map((day) => (day.date === date ? updatedDay : day))
      );

      if (updatedDay?.bookingAction === "cancelled") {
        Alert.alert(
          "Prenotazione cancellata",
          "Lo slot è stato disabilitato e la prenotazione è stata cancellata."
        );
      }
    } catch (err: any) {
      console.error("❌ Errore toggle slot:", err);
      Alert.alert("Errore", err.message || "Impossibile aggiornare lo slot");
    }
  };

  const toggleSlot = async (date: string, time: string, currentEnabled: boolean) => {
    if (!editMode) return;

    const newEnabled = !currentEnabled;

    // ✅ LOGICA CORRETTA: Alert solo quando DISABILITI uno slot (che potrebbe avere prenotazioni)
    if (!newEnabled && currentEnabled) {
      Alert.alert(
        "Conferma",
        "Disabilitando questo slot, eventuali prenotazioni esistenti verranno cancellate. Continuare?",
        [
          { text: "Annulla", style: "cancel" },
          {
            text: "Disabilita",
            style: "destructive",
            onPress: () => executeToggleSlot(date, time, newEnabled),
          },
        ]
      );
    } else {
      // Riabilitare uno slot non causa problemi
      executeToggleSlot(date, time, newEnabled);
    }
  };

  const handleSlotClick = (date: string, time: string, slotEnabled: boolean) => {
    if (editMode) {
      // In modalità modifica, seleziona/deseleziona lo slot
      // Ma NON permettere la selezione di slot con prenotazione
      const booking = dayBookings.find(b => b.startTime === time);
      if (booking) {
        Alert.alert("Non selezionabile", "Non puoi chiudere uno slot con una prenotazione attiva. Devi prima cancellare la prenotazione.");
        return;
      }
      
      const slotKey = `${date}|${time}`;
      setSelectedSlots(prev => {
        const newSet = new Set(prev);
        if (newSet.has(slotKey)) {
          newSet.delete(slotKey);
        } else {
          newSet.add(slotKey);
        }
        return newSet;
      });
    } else {
      // Trova la prenotazione per questo slot
      const booking = dayBookings.find(b => b.startTime === time);
      if (booking) {
        // Naviga al dettaglio prenotazione (usa _id se presente)
        const bookingId = booking._id ?? booking.id;
        if (bookingId) {
          navigation.navigate("OwnerDettaglioPrenotazione", { bookingId });
        } else {
          console.warn("Booking senza id:", booking);
          Alert.alert("Errore", "ID prenotazione non disponibile");
        }
      } else if (!slotEnabled) {
        // Se è inattivo ma non c'è prenotazione, mostra info
        navigation.navigate("OwnerBookings", {
          filterDate: date,
          filterCampoId: campoId,
          filterStrutturaId: strutturaId,
        });
      }
    }
  };

  // Determina se gli slot selezionati sono chiusi o aperti
  const getSelectedSlotsState = () => {
    if (!selectedDate || selectedSlots.size === 0) return null;
    
    const currentDay = calendarDays.find((d) => d.date === selectedDate);
    if (!currentDay) return null;
    
    let allClosed = true;
    let allOpen = true;
    
    for (const slotKey of Array.from(selectedSlots)) {
      const [, time] = slotKey.split("|");
      const slot = currentDay.slots.find((s) => s.time === time);
      if (slot) {
        if (slot.enabled) allClosed = false;
        if (!slot.enabled) allOpen = false;
      }
    }
    
    if (allClosed) return "closed";
    if (allOpen) return "open";
    return "mixed";
  };

  const toggleSelectedSlots = async () => {
    if (selectedSlots.size === 0) {
      Alert.alert("Attenzione", "Seleziona almeno uno slot");
      return;
    }

    const slotsState = getSelectedSlotsState();
    const willClose = slotsState === "open" || slotsState === "mixed";
    const newEnabledState = !willClose;
    
    const action = willClose ? "chiudere" : "aprire";
    const actionPast = willClose ? "chiusi" : "aperti";
    const actionIcon = willClose ? "🔒" : "🔓";

    Alert.alert(
      willClose ? "Conferma Chiusura" : "Conferma Apertura",
      willClose
        ? `Vuoi chiudere ${selectedSlots.size} slot selezionati?\n\nLe eventuali prenotazioni esistenti verranno cancellate.`
        : `Vuoi aprire ${selectedSlots.size} slot selezionati?`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: willClose ? "Chiudi" : "Apri",
          style: willClose ? "destructive" : "default",
          onPress: async () => {
            try {
              console.log(`${actionIcon} ${action.charAt(0).toUpperCase() + action.slice(1)}`, selectedSlots.size, "slot selezionati");
              
              let success = 0;
              let failed = 0;
              
              for (const slotKey of Array.from(selectedSlots)) {
                try {
                  const [date, time] = slotKey.split("|");
                  console.log(`  - ${action} slot:`, date, time);
                  await executeToggleSlot(date, time, newEnabledState);
                  success++;
                } catch (error) {
                  console.error("  ❌ Errore slot:", slotKey, error);
                  failed++;
                }
              }
              
              console.log(`✅ Risultato: ${success} ${actionPast}, ${failed} falliti`);
              
              setSelectedSlots(new Set());
              
              if (failed > 0) {
                Alert.alert("Completato con errori", `${success} slot ${actionPast}, ${failed} falliti`);
              } else {
                Alert.alert("✅ Successo", `${success} slot ${actionPast} con successo`);
              }
            } catch (err) {
              console.error("❌ Errore generale:", err);
              Alert.alert("Errore", `Impossibile ${action} alcuni slot`);
            }
          },
        },
      ]
    );
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
              console.log("🔒 Chiudo giornata:", date);
              
              // ✅ ENDPOINT CORRETTO: DELETE /calendar/campo/:campoId/date/:date
              const endpoint = `${API_URL}/calendar/campo/${campoId}/date/${date}`;
              console.log("📡 Endpoint:", endpoint);

              const res = await fetch(endpoint, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              if (!res.ok) {
                const errorText = await res.text();
                console.error("❌ Response:", res.status, errorText);
                throw new Error(`HTTP ${res.status}: ${errorText}`);
              }
              
              const result = await res.json();
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
            } catch (err: any) {
              console.error("❌ Errore chiusura:", err);
              Alert.alert("Errore", err.message || "Impossibile chiudere la giornata");
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
              console.log("🔓 Riapro giornata:", date);
              
              // ✅ ENDPOINT CORRETTO: POST /calendar/campo/:campoId/date/:date/reopen
              const endpoint = `${API_URL}/calendar/campo/${campoId}/date/${date}/reopen`;
              console.log("📡 Endpoint:", endpoint);

              const res = await fetch(endpoint, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
              });

              if (!res.ok) {
                const errorText = await res.text();
                console.error("❌ Response:", res.status, errorText);
                throw new Error(`HTTP ${res.status}: ${errorText}`);
              }
              
              const updatedDay = await res.json();

              setCalendarDays((prev) =>
                prev.map((day) => (day.date === date ? updatedDay : day))
              );

              Alert.alert("Successo", "Giornata riaperta");
            } catch (err: any) {
              console.error("❌ Errore riapertura:", err);
              Alert.alert("Errore", err.message || "Impossibile riaprire la giornata");
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
        {editMode && selectedSlots.size > 0 ? (
          <Pressable
            onPress={toggleSelectedSlots}
            style={styles.closeSlotButton}
          >
            <Text style={styles.closeSlotsText}>
              {getSelectedSlotsState() === "closed" ? "🔓 Apri" : "🔒 Chiudi"} ({selectedSlots.size})
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => {
            setEditMode(!editMode);
            setSelectedSlots(new Set());
          }}>
            <Text style={[styles.editBtn, editMode && styles.editBtnActive]}>
              {editMode ? "Fine" : "Modifica"}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.container}>
        {/* SELETTORE MESE */}
        <View style={styles.monthSelector}>
          <Pressable onPress={goToPrevMonth} style={styles.monthBtn} hitSlop={10}>
            <Text style={styles.monthBtnText}>◀</Text>
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.monthText}>
              {MONTHS_FULL[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            {!loading && calendarDays.length > 0 && (
              <Text style={styles.monthSubtext}>✓ {calendarDays.length} giorni</Text>
            )}
            {!loading && calendarDays.length === 0 && (
              <Text style={styles.monthSubtextWarning}>⚠️ Nessun dato</Text>
            )}
          </View>
          <Pressable onPress={goToNextMonth} style={styles.monthBtn} hitSlop={10}>
            <Text style={styles.monthBtnText}>▶</Text>
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
                        !isSelected && dayData && (
                          status === "available" ? styles.dayCellAvailable :
                          status === "partial" ? styles.dayCellPartial :
                          status === "full" ? styles.dayCellFull :
                          status === "closed" ? styles.dayCellClosed : null
                        ),
                      ]}
                      onPress={() => setSelectedDate(dateStr)}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          isSelected && styles.dayNumberSelected,
                          isToday && !isSelected && styles.dayNumberToday,
                          !isSelected && dayData && styles.dayNumberOnColored,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
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
                      {selectedDayData.slots.map((slot, i) => {
                        // Trova se c'è una prenotazione per questo slot
                        const booking = dayBookings.find(b => b.startTime === slot.time);
                        
                        // DEBUG
                        if (i === 0) {
                          console.log("🔍 DEBUG Slot Matching:");
                          console.log("  Total bookings:", dayBookings.length);
                          console.log("  Slot time:", slot.time);
                          console.log("  Booking found:", !!booking);
                          console.log("  Slot enabled:", slot.enabled);
                          if (dayBookings.length > 0) {
                            console.log("  Booking times:", dayBookings.map(b => b.startTime).join(", "));
                          }
                        }
                        
                        const isBooked = !!booking; // Se c'è booking, è prenotato
                        const isInactive = !slot.enabled && !booking; // Se disabled ma NO booking, è inattivo
                        const isAvailable = slot.enabled; // Se enabled, è disponibile
                        const slotKey = `${selectedDate}|${slot.time}`;
                        const isSelected = selectedSlots.has(slotKey);

                        return (
                          <Pressable
                            key={i}
                            style={[
                              styles.slotItem,
                              isAvailable && styles.slotEnabled,
                              (isBooked || isInactive) && styles.slotDisabled,
                              editMode && styles.slotItemEditable,
                              isSelected && styles.slotSelected,
                            ]}
                            onPress={() => handleSlotClick(selectedDate, slot.time, slot.enabled)}
                          >
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                <Text
                                  style={[
                                    styles.slotTime,
                                    (isBooked || isInactive) && styles.slotTimeDisabled,
                                  ]}
                                >
                                  ⏰ {slot.time}
                                </Text>
                                {isBooked && (
                                  <Text style={[styles.slotLabel, { color: "#F44336" }]}>• Prenotato</Text>
                                )}
                                {isInactive && !isBooked && (
                                  <Text style={styles.slotLabel}>• Inattivo</Text>
                                )}
                                {isAvailable && !isBooked && (
                                  <Text style={[styles.slotLabel, { color: "#4CAF50" }]}>• Disponibile</Text>
                                )}
                                {editMode && isSelected && (
                                  <Text style={[styles.slotLabel, { color: "#FF5722" }]}>• Selezionato</Text>
                                )}
                              </View>
                              {isBooked && booking && (
                                <Text style={styles.slotBookingUser}>
                                  👤 {booking.user?.name ?? booking.userName ?? ""} {booking.user?.surname ?? booking.userSurname ?? ""}
                                </Text>
                              )}
                            </View>
                            {editMode ? (
                              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                {isSelected && <Text style={{ color: "white", fontWeight: "800" }}>✓</Text>}
                              </View>
                            ) : (
                              isBooked && <Text style={{ fontSize: 16 }}>▶</Text>
                            )}
                          </Pressable>
                        );
                      })}
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
  safe: { flex: 1, backgroundColor: "#f0f2f5" },
  header: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  back: { fontSize: 20, fontWeight: "800" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#1a1a1a" },
  headerSubtitle: { fontSize: 12, color: "#666", marginTop: 2 },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  editButtonActive: {
    backgroundColor: "#FF5722",
  },
  editBtn: {
    fontSize: 14,
    fontWeight: "700",
    color: "#007AFF",
  },
  editBtnActive: { color: "white" },

  container: { flex: 1 },

  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    backgroundColor: "white",
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  monthBtn: {
    padding: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f2f5",
    alignItems: "center",
    justifyContent: "center",
  },
  monthBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
  },
  monthText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  monthSubtext: {
    fontSize: 12,
    color: "#4CAF50",
    marginTop: 4,
    fontWeight: "600",
  },
  monthSubtextWarning: {
    fontSize: 12,
    color: "#FF5722",
    marginTop: 4,
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
    gap: 14,
    padding: 16,
    marginHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: "#555",
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

  // Colored backgrounds for day states
  dayCellAvailable: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
  },
  dayCellPartial: {
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
  },
  dayCellFull: {
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
  },
  dayCellClosed: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },

  dayNumberOnColored: {
    color: "#333",
    fontWeight: "700",
  },

  dayIndicator: {
    position: "absolute",
    bottom: 1,
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
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  dayDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dayDetailTitle: {
    fontSize: 17,
    fontWeight: "800",
    textTransform: "capitalize",
    flex: 1,
    color: "#1a1a1a",
  },
  closeBtn: { fontSize: 24, color: "#999", fontWeight: "700" },

  closedBox: {
    padding: 16,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    alignItems: "center",
  },
  closedText: { fontSize: 14, fontWeight: "600", color: "#C62828" },

  // ✅ SLOT IN LISTA VERTICALE
  slotsGrid: { flexDirection: "column", gap: 8 },
  slotItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  slotItemEditable: {
    borderWidth: 2.5,
  },
  slotEnabled: { backgroundColor: "#E8F5E9", borderColor: "#4CAF50" },
  slotDisabled: { backgroundColor: "#FFEBEE", borderColor: "#F44336" },
  slotSelected: {
    backgroundColor: "#FFE0B2",
    borderColor: "#FF5722",
    borderWidth: 3,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#FF9800",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#FF5722",
    borderColor: "#FF5722",
  },
  closeSlotButton: {
    backgroundColor: "#FF5722",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeSlotsText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  slotTime: { fontSize: 15, fontWeight: "800", color: "#2E7D32" },
  slotTimeDisabled: { color: "#C62828" },
  slotLabel: { fontSize: 11, color: "#999", fontWeight: "600" },
  slotBookingUser: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    marginLeft: 28,
  },

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