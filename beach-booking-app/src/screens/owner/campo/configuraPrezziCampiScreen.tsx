import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Switch,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useCallback } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../../config/api";

/* =======================
   INTERFACES
======================= */

interface DurationPrice {
  oneHour: number;
  oneHourHalf: number;
}

interface TimeSlot {
  start: string;
  end: string;
  label: string;
  prices: DurationPrice;
  daysOfWeek?: number[]; // 🆕 0=dom, 1=lun, ..., 6=sab
}

interface DateOverride {
  date: string; // YYYY-MM-DD
  label: string;
  prices: DurationPrice;
}

interface PeriodOverride {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  label: string;
  prices: DurationPrice;
}

interface PlayerCountPrice {
  count: number;
  label: string;
  prices: DurationPrice;
}

interface PricingRules {
  mode: "flat" | "advanced";
  flatPrices: DurationPrice;
  basePrices: DurationPrice;
  timeSlotPricing: {
    enabled: boolean;
    slots: TimeSlot[];
  };
  dateOverrides: {
    enabled: boolean;
    dates: DateOverride[];
  };
  periodOverrides: {
    enabled: boolean;
    periods: PeriodOverride[];
  };
  playerCountPricing: {
    enabled: boolean;
    prices: PlayerCountPrice[];
  };
}

const DAYS_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const PLAYER_COUNTS = [4, 6, 8];

/* =======================
   COMPONENT
======================= */

export default function ConfiguraPrezziCampoScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { campoId, campoName, campoSport } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDaysModal, setShowDaysModal] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<"date" | "period-start" | "period-end">("date");
  const [editingDateIndex, setEditingDateIndex] = useState<number | null>(null);
  const [editingPeriodIndex, setEditingPeriodIndex] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const [pricing, setPricing] = useState<PricingRules>({
    mode: "flat",
    flatPrices: { oneHour: 20, oneHourHalf: 28 },
    basePrices: { oneHour: 20, oneHourHalf: 28 },
    timeSlotPricing: { enabled: false, slots: [] },
    dateOverrides: { enabled: false, dates: [] },
    periodOverrides: { enabled: false, periods: [] },
    playerCountPricing: { enabled: false, prices: [] },
  });

  /* =======================
     LOAD & SAVE
  ======================= */

  const loadPricing = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/campi/${campoId}/pricing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      
      const rules = data.pricingRules || {};
      
      setPricing({
        mode: rules.mode || "flat",
        flatPrices: rules.flatPrices || { oneHour: 20, oneHourHalf: 28 },
        basePrices: rules.basePrices || { oneHour: 20, oneHourHalf: 28 },
        timeSlotPricing: rules.timeSlotPricing || { enabled: false, slots: [] },
        dateOverrides: rules.dateOverrides || { enabled: false, dates: [] },
        periodOverrides: rules.periodOverrides || { enabled: false, periods: [] },
        playerCountPricing: rules.playerCountPricing || { enabled: false, prices: [] },
      });
    } catch {
      Alert.alert("Errore", "Impossibile caricare i prezzi");
    } finally {
      setLoading(false);
    }
  }, [campoId, token]);

  useFocusEffect(
    useCallback(() => {
      loadPricing();
    }, [loadPricing])
  );

  const handleSave = async () => {
    const flatOneHour = pricing.flatPrices?.oneHour || 0;
    const baseOneHour = pricing.basePrices?.oneHour || 0;
    
    if (flatOneHour <= 0 || baseOneHour <= 0) {
      Alert.alert("Errore", "I prezzi devono essere maggiori di 0");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/campi/${campoId}/pricing`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pricingRules: pricing }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Errore");
      }

      Alert.alert("✅ Successo", "Prezzi aggiornati correttamente", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert("Errore", err.message || "Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  /* =======================
     HANDLERS - BASE
  ======================= */

  const updateFlatPrice = (type: "oneHour" | "oneHourHalf", value: string) => {
    const num = parseFloat(value) || 0;
    setPricing((prev) => ({
      ...prev,
      flatPrices: {
        oneHour: prev.flatPrices?.oneHour || 20,
        oneHourHalf: prev.flatPrices?.oneHourHalf || 28,
        [type]: num,
      },
    }));
  };

  const updateBasePrice = (type: "oneHour" | "oneHourHalf", value: string) => {
    const num = parseFloat(value) || 0;
    setPricing((prev) => ({
      ...prev,
      basePrices: {
        oneHour: prev.basePrices?.oneHour || 20,
        oneHourHalf: prev.basePrices?.oneHourHalf || 28,
        [type]: num,
      },
    }));
  };

  /* =======================
     HANDLERS - PLAYER COUNT
  ======================= */

  const togglePlayerCountPricing = () => {
    setPricing((prev) => ({
      ...prev,
      playerCountPricing: {
        ...prev.playerCountPricing,
        enabled: !prev.playerCountPricing.enabled,
      },
    }));
  };

  const addPlayerCountPrice = () => {
    // Trova il primo numero di giocatori non ancora configurato
    const existingCounts = pricing.playerCountPricing.prices.map(p => p.count);
    const availableCount = PLAYER_COUNTS.find(c => !existingCounts.includes(c));
    
    if (!availableCount) {
      Alert.alert("Attenzione", "Hai già configurato tutti i numeri di giocatori disponibili");
      return;
    }

    const labels: { [key: number]: string } = {
      4: "4 giocatori (2 vs 2)",
      6: "6 giocatori (3 vs 3)",
      8: "8 giocatori (4 vs 4)",
    };

    setPricing((prev) => ({
      ...prev,
      playerCountPricing: {
        ...prev.playerCountPricing,
        prices: [
          ...prev.playerCountPricing.prices,
          {
            count: availableCount,
            label: labels[availableCount],
            prices: { oneHour: 30, oneHourHalf: 42 },
          },
        ],
      },
    }));
  };

  const updatePlayerCountPrice = (index: number, field: string, value: any) => {
    setPricing((prev) => {
      const newPrices = [...prev.playerCountPricing.prices];
      
      if (field === "count") {
        newPrices[index] = {
          ...newPrices[index],
          count: parseInt(value) || 4,
        };
      } else if (field === "label") {
        newPrices[index] = {
          ...newPrices[index],
          label: value,
        };
      } else if (field === "prices.oneHour" || field === "prices.oneHourHalf") {
        const priceField = field.split(".")[1] as "oneHour" | "oneHourHalf";
        newPrices[index] = {
          ...newPrices[index],
          prices: {
            ...newPrices[index].prices,
            [priceField]: parseFloat(value) || 0,
          },
        };
      }
      
      return {
        ...prev,
        playerCountPricing: {
          ...prev.playerCountPricing,
          prices: newPrices,
        },
      };
    });
  };

  const removePlayerCountPrice = (index: number) => {
    setPricing((prev) => ({
      ...prev,
      playerCountPricing: {
        ...prev.playerCountPricing,
        prices: prev.playerCountPricing.prices.filter((_, i) => i !== index),
      },
    }));
  };

  /* =======================
     HANDLERS - TIME SLOTS
  ======================= */

  const toggleTimeSlot = () => {
    setPricing((prev) => ({
      ...prev,
      timeSlotPricing: {
        ...prev.timeSlotPricing,
        enabled: !prev.timeSlotPricing.enabled,
      },
    }));
  };

  const addTimeSlot = () => {
    setPricing((prev) => ({
      ...prev,
      timeSlotPricing: {
        ...prev.timeSlotPricing,
        slots: [
          ...prev.timeSlotPricing.slots,
          {
            start: "09:00",
            end: "13:00",
            label: "Mattina",
            prices: { oneHour: 30, oneHourHalf: 42 },
          },
        ],
      },
    }));
  };

  const updateTimeSlot = (index: number, field: string, value: any) => {
    setPricing((prev) => {
      const newSlots = [...(prev.timeSlotPricing?.slots || [])];
      
      if (!newSlots[index]) return prev;
      
      if (field === "prices.oneHour" || field === "prices.oneHourHalf") {
        const priceField = field.split(".")[1] as "oneHour" | "oneHourHalf";
        newSlots[index] = {
          ...newSlots[index],
          prices: {
            oneHour: newSlots[index].prices?.oneHour || 20,
            oneHourHalf: newSlots[index].prices?.oneHourHalf || 28,
            [priceField]: parseFloat(value) || 0,
          },
        };
      } else {
        newSlots[index] = {
          ...newSlots[index],
          [field]: value,
        };
      }
      
      return {
        ...prev,
        timeSlotPricing: { 
          ...prev.timeSlotPricing, 
          enabled: prev.timeSlotPricing?.enabled || false,
          slots: newSlots 
        },
      };
    });
  };

  const removeTimeSlot = (index: number) => {
    setPricing((prev) => ({
      ...prev,
      timeSlotPricing: {
        ...prev.timeSlotPricing,
        slots: prev.timeSlotPricing.slots.filter((_, i) => i !== index),
      },
    }));
  };

  const openDaysModal = (index: number) => {
    setEditingSlotIndex(index);
    setShowDaysModal(true);
  };

  const toggleDay = (day: number) => {
    if (editingSlotIndex === null) return;
    
    setPricing((prev) => {
      const newSlots = [...prev.timeSlotPricing.slots];
      const slot = newSlots[editingSlotIndex];
      
      const currentDays = slot.daysOfWeek || [];
      const hasDayIndex = currentDays.indexOf(day);
      
      if (hasDayIndex >= 0) {
        // Rimuovi il giorno
        slot.daysOfWeek = currentDays.filter((d) => d !== day);
      } else {
        // Aggiungi il giorno
        slot.daysOfWeek = [...currentDays, day].sort();
      }
      
      // Se non ci sono giorni, rimuovi l'array
      if (slot.daysOfWeek.length === 0) {
        delete slot.daysOfWeek;
      }
      
      return {
        ...prev,
        timeSlotPricing: { ...prev.timeSlotPricing, slots: newSlots },
      };
    });
  };

  /* =======================
     HANDLERS - DATE OVERRIDES
  ======================= */

  const toggleDateOverrides = () => {
    setPricing((prev) => ({
      ...prev,
      dateOverrides: {
        ...prev.dateOverrides,
        enabled: !prev.dateOverrides.enabled,
      },
    }));
  };

  const addDateOverride = () => {
    const today = new Date().toISOString().split("T")[0];
    setPricing((prev) => ({
      ...prev,
      dateOverrides: {
        ...prev.dateOverrides,
        dates: [
          ...prev.dateOverrides.dates,
          {
            date: today,
            label: "Evento speciale",
            prices: { oneHour: 50, oneHourHalf: 70 },
          },
        ],
      },
    }));
  };

  const openDatePicker = (index: number) => {
    setEditingDateIndex(index);
    setDatePickerMode("date");
    const currentDate = pricing.dateOverrides.dates[index]?.date;
    if (currentDate) {
      const [y, m] = currentDate.split("-").map(Number);
      setSelectedMonth(new Date(y, m - 1, 1));
    }
    setShowDatePicker(true);
  };

  const handleDateSelect = (dateStr: string) => {
    if (editingDateIndex !== null && datePickerMode === "date") {
      updateDateOverride(editingDateIndex, "date", dateStr);
    } else if (editingPeriodIndex !== null) {
      if (datePickerMode === "period-start") {
        updatePeriodOverride(editingPeriodIndex, "startDate", dateStr);
      } else if (datePickerMode === "period-end") {
        updatePeriodOverride(editingPeriodIndex, "endDate", dateStr);
      }
    }
    setShowDatePicker(false);
  };

  const updateDateOverride = (index: number, field: string, value: any) => {
    setPricing((prev) => {
      const newDates = [...prev.dateOverrides.dates];
      
      if (field === "prices.oneHour" || field === "prices.oneHourHalf") {
        const priceField = field.split(".")[1] as "oneHour" | "oneHourHalf";
        newDates[index] = {
          ...newDates[index],
          prices: {
            ...newDates[index].prices,
            [priceField]: parseFloat(value) || 0,
          },
        };
      } else {
        newDates[index] = {
          ...newDates[index],
          [field]: value,
        };
      }
      
      return {
        ...prev,
        dateOverrides: { ...prev.dateOverrides, dates: newDates },
      };
    });
  };

  const removeDateOverride = (index: number) => {
    setPricing((prev) => ({
      ...prev,
      dateOverrides: {
        ...prev.dateOverrides,
        dates: prev.dateOverrides.dates.filter((_, i) => i !== index),
      },
    }));
  };

  /* =======================
     HANDLERS - PERIOD OVERRIDES
  ======================= */

  const togglePeriodOverrides = () => {
    setPricing((prev) => ({
      ...prev,
      periodOverrides: {
        ...prev.periodOverrides,
        enabled: !prev.periodOverrides.enabled,
      },
    }));
  };

  const addPeriodOverride = () => {
    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    
    setPricing((prev) => ({
      ...prev,
      periodOverrides: {
        ...prev.periodOverrides,
        periods: [
          ...prev.periodOverrides.periods,
          {
            startDate,
            endDate,
            label: "Periodo speciale",
            prices: { oneHour: 40, oneHourHalf: 56 },
          },
        ],
      },
    }));
  };

  const openPeriodPicker = (index: number, mode: "start" | "end") => {
    setEditingPeriodIndex(index);
    setDatePickerMode(mode === "start" ? "period-start" : "period-end");
    const period = pricing.periodOverrides.periods[index];
    const dateStr = mode === "start" ? period.startDate : period.endDate;
    if (dateStr) {
      const [y, m] = dateStr.split("-").map(Number);
      setSelectedMonth(new Date(y, m - 1, 1));
    }
    setShowDatePicker(true);
  };

  const updatePeriodOverride = (index: number, field: string, value: any) => {
    setPricing((prev) => {
      const newPeriods = [...prev.periodOverrides.periods];
      
      if (field === "prices.oneHour" || field === "prices.oneHourHalf") {
        const priceField = field.split(".")[1] as "oneHour" | "oneHourHalf";
        newPeriods[index] = {
          ...newPeriods[index],
          prices: {
            ...newPeriods[index].prices,
            [priceField]: parseFloat(value) || 0,
          },
        };
      } else {
        newPeriods[index] = {
          ...newPeriods[index],
          [field]: value,
        };
      }
      
      return {
        ...prev,
        periodOverrides: { ...prev.periodOverrides, periods: newPeriods },
      };
    });
  };

  const removePeriodOverride = (index: number) => {
    setPricing((prev) => ({
      ...prev,
      periodOverrides: {
        ...prev.periodOverrides,
        periods: prev.periodOverrides.periods.filter((_, i) => i !== index),
      },
    }));
  };

  /* =======================
     RENDER HELPERS
  ======================= */

  const renderDaysOfWeek = (slot: TimeSlot, index: number) => {
    const selectedDays = slot.daysOfWeek || [];
    const isGeneric = selectedDays.length === 0;
    
    return (
      <Pressable
        style={styles.daysSelector}
        onPress={() => openDaysModal(index)}
      >
        <Ionicons name="calendar-outline" size={16} color="#666" />
        <Text style={styles.daysSelectorText}>
          {isGeneric
            ? "Tutti i giorni"
            : selectedDays.map((d) => DAYS_LABELS[d]).join(", ")}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </Pressable>
    );
  };

  const renderSimulation = () => {
    if (pricing.mode === "flat") {
      const oneHour = pricing.flatPrices?.oneHour || 20;
      const oneHourHalf = pricing.flatPrices?.oneHourHalf || 28;
      
      return (
        <View style={styles.simulationContent}>
          <Text style={styles.simulationScenario}>💵 Tariffa Fissa</Text>
          <View style={styles.simRow}>
            <Text style={styles.simLabel}>1 ora:</Text>
            <Text style={styles.simPrice}>€{oneHour.toFixed(2)}</Text>
          </View>
          <View style={styles.simRow}>
            <Text style={styles.simLabel}>1.5 ore:</Text>
            <Text style={styles.simPrice}>€{oneHourHalf.toFixed(2)}</Text>
          </View>
        </View>
      );
    }

    // ADVANCED - mostra gerarchia
    const simulations = [];

    // Livello 1: Date override
    if (pricing.dateOverrides.enabled && pricing.dateOverrides.dates.length > 0) {
      const dateEx = pricing.dateOverrides.dates[0];
      simulations.push({
        emoji: "📅",
        title: `Data: ${dateEx.label}`,
        subtitle: dateEx.date,
        oneHour: dateEx.prices.oneHour,
        oneHourHalf: dateEx.prices.oneHourHalf,
      });
    }

    // Livello 2: Period override
    if (pricing.periodOverrides.enabled && pricing.periodOverrides.periods.length > 0) {
      const periodEx = pricing.periodOverrides.periods[0];
      simulations.push({
        emoji: "📆",
        title: `Periodo: ${periodEx.label}`,
        subtitle: `${periodEx.startDate} → ${periodEx.endDate}`,
        oneHour: periodEx.prices.oneHour,
        oneHourHalf: periodEx.prices.oneHourHalf,
      });
    }

    // Livello 3: Time slot con giorno
    if (pricing.timeSlotPricing.enabled && pricing.timeSlotPricing.slots.length > 0) {
      const slotWithDay = pricing.timeSlotPricing.slots.find((s) => s.daysOfWeek && s.daysOfWeek.length > 0);
      if (slotWithDay) {
        const days = slotWithDay.daysOfWeek!.map((d) => DAYS_LABELS[d]).join(", ");
        simulations.push({
          emoji: "⏰",
          title: `${slotWithDay.label} (${days})`,
          subtitle: `${slotWithDay.start} - ${slotWithDay.end}`,
          oneHour: slotWithDay.prices.oneHour,
          oneHourHalf: slotWithDay.prices.oneHourHalf,
        });
      }
    }

    // Livello 4: Time slot generico
    if (pricing.timeSlotPricing.enabled && pricing.timeSlotPricing.slots.length > 0) {
      const genericSlot = pricing.timeSlotPricing.slots.find((s) => !s.daysOfWeek || s.daysOfWeek.length === 0);
      if (genericSlot) {
        simulations.push({
          emoji: "⏰",
          title: genericSlot.label,
          subtitle: `${genericSlot.start} - ${genericSlot.end} (tutti i giorni)`,
          oneHour: genericSlot.prices.oneHour,
          oneHourHalf: genericSlot.prices.oneHourHalf,
        });
      }
    }

    // Livello 5: Player count pricing (solo per Beach Volley)
    if (campoSport === "beach_volley" && pricing.playerCountPricing.enabled && pricing.playerCountPricing.prices.length > 0) {
      pricing.playerCountPricing.prices
        .sort((a, b) => a.count - b.count)
        .forEach((pc) => {
          simulations.push({
            emoji: "👥",
            title: pc.label,
            subtitle: `Prezzo per ${pc.count} partecipanti`,
            oneHour: pc.prices.oneHour,
            oneHourHalf: pc.prices.oneHourHalf,
          });
        });
    }

    // Livello 6: Base price
    simulations.push({
      emoji: "💵",
      title: "Prezzo Base",
      subtitle: "Fallback finale quando nessuna altra regola si applica",
      oneHour: pricing.basePrices.oneHour,
      oneHourHalf: pricing.basePrices.oneHourHalf,
    });

    return (
      <View style={styles.simulationContent}>
        <Text style={styles.simulationHeader}>
          🎯 Gerarchia Prezzi (dalla più alta alla più bassa):
        </Text>
        {simulations.map((sim, idx) => (
          <View key={idx} style={styles.simCard}>
            <Text style={styles.simCardTitle}>
              {sim.emoji} {sim.title}
            </Text>
            <Text style={styles.simCardSubtitle}>{sim.subtitle}</Text>
            <View style={styles.simCardPrices}>
              <Text style={styles.simCardPrice}>1h: €{sim.oneHour}</Text>
              <Text style={styles.simCardPrice}>1.5h: €{sim.oneHourHalf}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  /* =======================
     RENDER
  ======================= */

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Gestisci Prezzi</Text>
          <Text style={styles.headerSubtitle}>{campoName}</Text>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* MODALITÀ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Modalità Pricing</Text>

          <Pressable
            style={[
              styles.radioOption,
              pricing.mode === "flat" && styles.radioOptionActive,
            ]}
            onPress={() => setPricing((p) => ({ ...p, mode: "flat" }))}
          >
            <View style={styles.radioCircle}>
              {pricing.mode === "flat" && <View style={styles.radioCircleInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.radioLabel}>Prezzo Fisso</Text>
              <Text style={styles.radioDescription}>
                Prezzi uguali per tutte le fasce orarie
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.radioOption,
              pricing.mode === "advanced" && styles.radioOptionActive,
            ]}
            onPress={() => setPricing((p) => ({ ...p, mode: "advanced" }))}
          >
            <View style={styles.radioCircle}>
              {pricing.mode === "advanced" && <View style={styles.radioCircleInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.radioLabel}>Pricing Dinamico</Text>
              <Text style={styles.radioDescription}>
                Prezzi variabili per fascia oraria, data o periodo
              </Text>
            </View>
          </Pressable>
        </View>

        {/* FLAT MODE */}
        {pricing.mode === "flat" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💵 Prezzi Fissi</Text>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>1 ora</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.euroSign}>€</Text>
                <TextInput
                  style={styles.priceInputField}
                  value={(pricing.flatPrices?.oneHour || 20).toString()}
                  onChangeText={(v) => updateFlatPrice("oneHour", v)}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>1.5 ore</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.euroSign}>€</Text>
                <TextInput
                  style={styles.priceInputField}
                  value={(pricing.flatPrices?.oneHourHalf || 28).toString()}
                  onChangeText={(v) => updateFlatPrice("oneHourHalf", v)}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        )}

        {/* ADVANCED MODE */}
        {pricing.mode === "advanced" && (
          <>
            {/* PREZZI BASE */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💵 Prezzi Base</Text>
              <Text style={styles.cardDescription}>
                Usati quando nessuna regola specifica si applica
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>1 ora</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.euroSign}>€</Text>
                  <TextInput
                    style={styles.priceInputField}
                    value={(pricing.basePrices?.oneHour || 20).toString()}
                    onChangeText={(v) => updateBasePrice("oneHour", v)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>1.5 ore</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.euroSign}>€</Text>
                  <TextInput
                    style={styles.priceInputField}
                    value={(pricing.basePrices?.oneHourHalf || 28).toString()}
                    onChangeText={(v) => updateBasePrice("oneHourHalf", v)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            {/* DATE SPECIALI */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>📅 Date Speciali</Text>
                <Switch
                  value={pricing.dateOverrides.enabled}
                  onValueChange={toggleDateOverrides}
                />
              </View>
              <Text style={styles.cardDescription}>
                Prezzi per date specifiche (es. Natale, Capodanno) - Priorità massima
              </Text>

              {pricing.dateOverrides.enabled && (
                <View style={styles.configContent}>
                  {pricing.dateOverrides.dates.map((dateOv, index) => (
                    <View key={index} style={styles.overrideCard}>
                      <View style={styles.overrideHeader}>
                        <TextInput
                          style={styles.overrideLabelInput}
                          value={dateOv.label}
                          onChangeText={(v) => updateDateOverride(index, "label", v)}
                          placeholder="Nome evento"
                        />
                        <Pressable onPress={() => removeDateOverride(index)}>
                          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </Pressable>
                      </View>

                      <Pressable
                        style={styles.dateInputPressable}
                        onPress={() => openDatePicker(index)}
                      >
                        <Text style={styles.dateInputText}>{dateOv.date}</Text>
                        <Ionicons name="calendar-outline" size={18} color="#2196F3" />
                      </Pressable>

                      <View style={styles.slotPriceRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.slotPriceLabel}>1h</Text>
                          <View style={styles.priceInputContainer}>
                            <Text style={styles.euroSign}>€</Text>
                            <TextInput
                              style={styles.priceInputField}
                              value={dateOv.prices.oneHour.toString()}
                              onChangeText={(v) =>
                                updateDateOverride(index, "prices.oneHour", v)
                              }
                              keyboardType="decimal-pad"
                            />
                          </View>
                        </View>

                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.slotPriceLabel}>1.5h</Text>
                          <View style={styles.priceInputContainer}>
                            <Text style={styles.euroSign}>€</Text>
                            <TextInput
                              style={styles.priceInputField}
                              value={dateOv.prices.oneHourHalf.toString()}
                              onChangeText={(v) =>
                                updateDateOverride(index, "prices.oneHourHalf", v)
                              }
                              keyboardType="decimal-pad"
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}

                  <Pressable style={styles.addButton} onPress={addDateOverride}>
                    <Ionicons name="add-circle" size={20} color="#2196F3" />
                    <Text style={styles.addButtonText}>Aggiungi data speciale</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* PERIODI SPECIALI */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>📆 Periodi Speciali</Text>
                <Switch
                  value={pricing.periodOverrides.enabled}
                  onValueChange={togglePeriodOverrides}
                />
              </View>
              <Text style={styles.cardDescription}>
                Prezzi per periodi (es. Estate, Natale) - Alta priorità
              </Text>

              {pricing.periodOverrides.enabled && (
                <View style={styles.configContent}>
                  {pricing.periodOverrides.periods.map((period, index) => (
                    <View key={index} style={styles.overrideCard}>
                      <View style={styles.overrideHeader}>
                        <TextInput
                          style={styles.overrideLabelInput}
                          value={period.label}
                          onChangeText={(v) => updatePeriodOverride(index, "label", v)}
                          placeholder="Nome periodo"
                        />
                        <Pressable onPress={() => removePeriodOverride(index)}>
                          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </Pressable>
                      </View>

                      <View style={styles.periodDatesRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.dateLabel}>Dal</Text>
                          <Pressable
                            style={styles.dateInputPressable}
                            onPress={() => openPeriodPicker(index, "start")}
                          >
                            <Text style={styles.dateInputText}>{period.startDate}</Text>
                            <Ionicons name="calendar-outline" size={16} color="#2196F3" />
                          </Pressable>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.dateLabel}>Al</Text>
                          <Pressable
                            style={styles.dateInputPressable}
                            onPress={() => openPeriodPicker(index, "end")}
                          >
                            <Text style={styles.dateInputText}>{period.endDate}</Text>
                            <Ionicons name="calendar-outline" size={16} color="#2196F3" />
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.slotPriceRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.slotPriceLabel}>1h</Text>
                          <View style={styles.priceInputContainer}>
                            <Text style={styles.euroSign}>€</Text>
                            <TextInput
                              style={styles.priceInputField}
                              value={period.prices.oneHour.toString()}
                              onChangeText={(v) =>
                                updatePeriodOverride(index, "prices.oneHour", v)
                              }
                              keyboardType="decimal-pad"
                            />
                          </View>
                        </View>

                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.slotPriceLabel}>1.5h</Text>
                          <View style={styles.priceInputContainer}>
                            <Text style={styles.euroSign}>€</Text>
                            <TextInput
                              style={styles.priceInputField}
                              value={period.prices.oneHourHalf.toString()}
                              onChangeText={(v) =>
                                updatePeriodOverride(index, "prices.oneHourHalf", v)
                              }
                              keyboardType="decimal-pad"
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}

                  <Pressable style={styles.addButton} onPress={addPeriodOverride}>
                    <Ionicons name="add-circle" size={20} color="#2196F3" />
                    <Text style={styles.addButtonText}>Aggiungi periodo</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* FASCE ORARIE */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>⏰ Fasce Orarie</Text>
                <Switch
                  value={pricing.timeSlotPricing.enabled}
                  onValueChange={toggleTimeSlot}
                />
              </View>
              <Text style={styles.cardDescription}>
                Prezzi per fasce orarie, opzionalmente per giorni specifici
              </Text>

              {pricing.timeSlotPricing.enabled && (
                <View style={styles.configContent}>
                  {(pricing.timeSlotPricing.slots || []).map((slot, index) => (
                    <View key={index} style={styles.timeSlotCard}>
                      <View style={styles.timeSlotHeader}>
                        <TextInput
                          style={styles.timeSlotLabelInput}
                          value={slot.label || ""}
                          onChangeText={(v) => updateTimeSlot(index, "label", v)}
                          placeholder="Nome fascia"
                        />
                        <Pressable onPress={() => removeTimeSlot(index)}>
                          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </Pressable>
                      </View>

                      {renderDaysOfWeek(slot, index)}

                      <View style={styles.timeSlotTimeRow}>
                        <View style={styles.timeInputWrapper}>
                          <Text style={styles.timeLabel}>Dalle</Text>
                          <TextInput
                            style={styles.timeInput}
                            value={slot.start || ""}
                            onChangeText={(v) => updateTimeSlot(index, "start", v)}
                            placeholder="09:00"
                          />
                        </View>

                        <View style={styles.timeInputWrapper}>
                          <Text style={styles.timeLabel}>Alle</Text>
                          <TextInput
                            style={styles.timeInput}
                            value={slot.end || ""}
                            onChangeText={(v) => updateTimeSlot(index, "end", v)}
                            placeholder="13:00"
                          />
                        </View>
                      </View>

                      <View style={styles.slotPriceRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.slotPriceLabel}>1h</Text>
                          <View style={styles.priceInputContainer}>
                            <Text style={styles.euroSign}>€</Text>
                            <TextInput
                              style={styles.priceInputField}
                              value={(slot.prices?.oneHour || 20).toString()}
                              onChangeText={(v) =>
                                updateTimeSlot(index, "prices.oneHour", v)
                              }
                              keyboardType="decimal-pad"
                            />
                          </View>
                        </View>

                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.slotPriceLabel}>1.5h</Text>
                          <View style={styles.priceInputContainer}>
                            <Text style={styles.euroSign}>€</Text>
                            <TextInput
                              style={styles.priceInputField}
                              value={(slot.prices?.oneHourHalf || 28).toString()}
                              onChangeText={(v) =>
                                updateTimeSlot(index, "prices.oneHourHalf", v)
                              }
                              keyboardType="decimal-pad"
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}

                  <Pressable style={styles.addButton} onPress={addTimeSlot}>
                    <Ionicons name="add-circle" size={20} color="#2196F3" />
                    <Text style={styles.addButtonText}>Aggiungi fascia oraria</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* PREZZI PER NUMERO GIOCATORI - Solo per Beach Volley */}
            {campoSport === "beach_volley" && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>👥 Prezzi per Numero Giocatori</Text>
                  <Switch
                    value={pricing.playerCountPricing.enabled}
                    onValueChange={togglePlayerCountPricing}
                  />
                </View>
                <Text style={styles.cardDescription}>
                  Prezzi specifici per numero di partecipanti - Si applicano quando nessuna regola di date, periodi o fasce orarie è attiva (priorità appena sopra il prezzo base)
                </Text>

                {pricing.playerCountPricing.enabled && (
                  <View style={styles.configContent}>
                    {pricing.playerCountPricing.prices
                      .sort((a, b) => a.count - b.count)
                      .map((playerPrice, index) => {
                        const actualIndex = pricing.playerCountPricing.prices.indexOf(playerPrice);
                        return (
                          <View key={actualIndex} style={styles.playerCountCard}>
                            <View style={styles.overrideHeader}>
                              <View style={styles.playerCountSelector}>
                                <Ionicons name="people" size={20} color="#2196F3" />
                                <Text style={styles.playerCountText}>
                                  {playerPrice.count} giocatori
                                </Text>
                              </View>
                              <Pressable onPress={() => removePlayerCountPrice(actualIndex)}>
                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                              </Pressable>
                            </View>

                            <TextInput
                              style={styles.playerCountLabelInput}
                              value={playerPrice.label}
                              onChangeText={(v) => updatePlayerCountPrice(actualIndex, "label", v)}
                              placeholder="Descrizione (es. 2 vs 2)"
                            />

                            <View style={styles.slotPriceRow}>
                              <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.slotPriceLabel}>1h</Text>
                                <View style={styles.priceInputContainer}>
                                  <Text style={styles.euroSign}>€</Text>
                                  <TextInput
                                    style={styles.priceInputField}
                                    value={playerPrice.prices.oneHour.toString()}
                                    onChangeText={(v) =>
                                      updatePlayerCountPrice(actualIndex, "prices.oneHour", v)
                                    }
                                    keyboardType="decimal-pad"
                                  />
                                </View>
                              </View>

                              <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={styles.slotPriceLabel}>1.5h</Text>
                                <View style={styles.priceInputContainer}>
                                  <Text style={styles.euroSign}>€</Text>
                                  <TextInput
                                    style={styles.priceInputField}
                                    value={playerPrice.prices.oneHourHalf.toString()}
                                    onChangeText={(v) =>
                                      updatePlayerCountPrice(actualIndex, "prices.oneHourHalf", v)
                                    }
                                    keyboardType="decimal-pad"
                                  />
                                </View>
                              </View>
                            </View>
                          </View>
                        );
                      })}

                    <Pressable style={styles.addButton} onPress={addPlayerCountPrice}>
                      <Ionicons name="add-circle" size={20} color="#2196F3" />
                      <Text style={styles.addButtonText}>Aggiungi configurazione giocatori</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* SIMULAZIONE */}
        <View style={[styles.card, styles.simulationCard]}>
          <Text style={styles.cardTitle}>📊 Simulazione Prezzi</Text>
          {renderSimulation()}
        </View>

        {/* SAVE */}
        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Salvataggio..." : "💾 Salva Configurazione"}
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL GIORNI */}
      <Modal
        visible={showDaysModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDaysModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDaysModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleziona Giorni</Text>
            <Text style={styles.modalDescription}>
              Lascia vuoto per applicare la fascia a tutti i giorni
            </Text>

            <View style={styles.daysGrid}>
              {DAYS_LABELS.map((day, index) => {
                const slot = pricing.timeSlotPricing.slots[editingSlotIndex || 0];
                const isSelected = slot?.daysOfWeek?.includes(index) || false;

                return (
                  <Pressable
                    key={index}
                    style={[
                      styles.dayChip,
                      isSelected && styles.dayChipSelected,
                    ]}
                    onPress={() => toggleDay(index)}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        isSelected && styles.dayChipTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setShowDaysModal(false)}
            >
              <Text style={styles.modalCloseText}>Chiudi</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* MODAL DATE PICKER */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>
              {datePickerMode === "date"
                ? "Seleziona Data"
                : datePickerMode === "period-start"
                ? "Data Inizio"
                : "Data Fine"}
            </Text>

            {/* Month selector */}
            <View style={styles.calendarMonthSelector}>
              <Pressable
                onPress={() => {
                  const newMonth = new Date(selectedMonth);
                  newMonth.setMonth(newMonth.getMonth() - 1);
                  setSelectedMonth(newMonth);
                }}
                style={styles.calendarMonthBtn}
              >
                <Ionicons name="chevron-back" size={24} color="#2196F3" />
              </Pressable>

              <Text style={styles.calendarMonthText}>
                {selectedMonth.toLocaleDateString("it-IT", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>

              <Pressable
                onPress={() => {
                  const newMonth = new Date(selectedMonth);
                  newMonth.setMonth(newMonth.getMonth() + 1);
                  setSelectedMonth(newMonth);
                }}
                style={styles.calendarMonthBtn}
              >
                <Ionicons name="chevron-forward" size={24} color="#2196F3" />
              </Pressable>
            </View>

            {/* Calendar grid */}
            <View style={styles.calendarGrid}>
              {/* Week days header */}
              <View style={styles.calendarWeekHeader}>
                {["D", "L", "M", "M", "G", "V", "S"].map((day, i) => (
                  <Text key={i} style={styles.calendarWeekDay}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Days */}
              <View style={styles.calendarDays}>
                {(() => {
                  const year = selectedMonth.getFullYear();
                  const month = selectedMonth.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();

                  const days = [];

                  // Empty cells before month start
                  for (let i = 0; i < firstDay; i++) {
                    days.push(
                      <View key={`empty-${i}`} style={styles.calendarDayCell} />
                    );
                  }

                  // Days of month
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${year}-${String(month + 1).padStart(
                      2,
                      "0"
                    )}-${String(day).padStart(2, "0")}`;

                    days.push(
                      <Pressable
                        key={day}
                        style={styles.calendarDayCell}
                        onPress={() => handleDateSelect(dateStr)}
                      >
                        <View style={styles.calendarDayInner}>
                          <Text style={styles.calendarDayText}>{day}</Text>
                        </View>
                      </Pressable>
                    );
                  }

                  return days;
                })()}
              </View>
            </View>

            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.modalCloseText}>Chiudi</Text>
            </Pressable>
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
  safe: { 
    flex: 1, 
    backgroundColor: "#f5f7fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    backgroundColor: "#ffffff",
    gap: 12,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "800", 
    color: "#1f2937",
  },
  headerSubtitle: { 
    fontSize: 13, 
    color: "#667eea", 
    marginTop: 2,
    fontWeight: "600",
  },
  container: { padding: 16 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: { 
    fontSize: 17, 
    fontWeight: "800", 
    marginBottom: 8, 
    color: "#1f2937",
  },
  cardDescription: { 
    fontSize: 13, 
    color: "#6b7280", 
    marginBottom: 14, 
    lineHeight: 20,
    fontWeight: "500",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  radioOptionActive: {
    backgroundColor: "#eef2ff",
    borderColor: "#667eea",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#667eea",
  },
  radioLabel: { 
    fontSize: 15, 
    fontWeight: "700", 
    color: "#1f2937",
  },
  radioDescription: { 
    fontSize: 12, 
    color: "#6b7280", 
    marginTop: 3,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
  },
  priceLabel: { 
    fontSize: 15, 
    fontWeight: "700", 
    color: "#1f2937",
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    minWidth: 100,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  euroSign: { 
    fontSize: 16, 
    fontWeight: "800", 
    marginRight: 6, 
    color: "#667eea",
  },
  priceInputField: {
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
    textAlign: "right",
    color: "#1f2937",
  },
  configContent: { marginTop: 12 },
  timeSlotCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#e0e7ff",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  timeSlotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e7ff",
  },
  timeSlotLabelInput: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    color: "#1f2937",
  },
  daysSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0f4ff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  daysSelectorText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#667eea",
    flex: 1,
  },
  timeSlotTimeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  timeInputWrapper: { flex: 1 },
  timeLabel: { 
    fontSize: 11, 
    color: "#667eea", 
    marginBottom: 6, 
    fontWeight: "700",
  },
  timeInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    textAlign: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    fontWeight: "700",
    color: "#1f2937",
  },
  slotPriceRow: {
    flexDirection: "row",
    gap: 10,
  },
  slotPriceLabel: {
    fontSize: 11,
    color: "#667eea",
    marginBottom: 6,
    fontWeight: "700",
  },
  overrideCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#fce7f3",
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  overrideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#fce7f3",
  },
  overrideLabelInput: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    color: "#1f2937",
  },
  dateInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    textAlign: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    fontWeight: "700",
    marginBottom: 12,
    color: "#1f2937",
  },
  dateInputPressable: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateInputText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  dateLabel: {
    fontSize: 11,
    color: "#667eea",
    marginBottom: 6,
    fontWeight: "700",
  },
  periodDatesRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#667eea",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: "white",
  },
  simulationCard: {
    backgroundColor: "#f0fdf4",
    borderWidth: 2,
    borderColor: "#86efac",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  simulationContent: {
    gap: 10,
  },
  simulationHeader: {
    fontSize: 15,
    fontWeight: "800",
    color: "#16a34a",
    marginBottom: 12,
  },
  simulationScenario: {
    fontSize: 16,
    fontWeight: "800",
    color: "#16a34a",
    marginBottom: 10,
  },
  simRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 6,
  },
  simLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#15803d",
  },
  simPrice: {
    fontSize: 20,
    fontWeight: "900",
    color: "#166534",
  },
  simCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#bbf7d0",
  },
  simCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#16a34a",
    marginBottom: 4,
  },
  simCardSubtitle: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 8,
    fontWeight: "500",
  },
  simCardPrices: {
    flexDirection: "row",
    gap: 16,
  },
  simCardPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#166534",
  },
  simulationNote: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 10,
    fontStyle: "italic",
    fontWeight: "500",
  },
  playerCountCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#dbeafe",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  playerCountSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playerCountText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#667eea",
  },
  playerCountLabelInput: {
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    color: "#1f2937",
  },
  saveButton: {
    backgroundColor: "#667eea",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { 
    color: "white", 
    fontSize: 17, 
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(102, 126, 234, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
    color: "#1f2937",
  },
  modalDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
    lineHeight: 20,
    fontWeight: "500",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  dayChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  dayChipSelected: {
    backgroundColor: "#667eea",
    borderColor: "#667eea",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
  },
  dayChipTextSelected: {
    color: "white",
  },
  modalCloseButton: {
    backgroundColor: "#667eea",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalCloseText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  calendarMonthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
  },
  calendarMonthBtn: {
    padding: 8,
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  calendarMonthText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1f2937",
  },
  calendarGrid: {
    marginBottom: 20,
  },
  calendarWeekHeader: {
    flexDirection: "row",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  calendarWeekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
    color: "#667eea",
  },
  calendarDays: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
  },
  calendarDayInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
});