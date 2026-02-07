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
}

const DAYS_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

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

    // Livello 5: Base price
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
          <Ionicons name="arrow-back" size={22} color="#333" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gestisci Prezzi</Text>
          <Text style={styles.headerSubtitle}>{campoName}</Text>
        </View>
        <Pressable
          style={[styles.headerSaveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="checkmark" size={22} color="white" />
          )}
        </Pressable>
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
          </>
        )}

        {/* SIMULAZIONE */}
        <View style={[styles.card, styles.simulationCard]}>
          <Text style={styles.cardTitle}>📊 Simulazione Prezzi</Text>
          {renderSimulation()}
        </View>

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
    padding: 16,
    backgroundColor: "#ffffff",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSaveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: "#1a1a1a",
    textAlign: "center",
  },
  headerSubtitle: { 
    fontSize: 13, 
    color: "#666", 
    marginTop: 2,
    fontWeight: "400",
    textAlign: "center",
  },
  container: { padding: 16 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: { 
    fontSize: 15, 
    fontWeight: "600", 
    marginBottom: 8, 
    color: "#1a1a1a",
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
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  radioOptionActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2196F3",
  },
  radioLabel: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: "#1a1a1a",
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
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
  },
  priceLabel: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: "#333",
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    minWidth: 100,
  },
  euroSign: { 
    fontSize: 15, 
    fontWeight: "600", 
    marginRight: 6, 
    color: "#2196F3",
  },
  priceInputField: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    color: "#333",
  },
  configContent: { marginTop: 12 },
  timeSlotCard: {
    backgroundColor: "#fafafa",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  timeSlotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  timeSlotLabelInput: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    color: "#333",
  },
  daysSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  daysSelectorText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#2196F3",
    flex: 1,
  },
  timeSlotTimeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  timeInputWrapper: { flex: 1 },
  timeLabel: { 
    fontSize: 12, 
    color: "#666", 
    marginBottom: 6, 
    fontWeight: "500",
  },
  timeInput: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    fontWeight: "500",
    color: "#333",
  },
  slotPriceRow: {
    flexDirection: "row",
    gap: 10,
  },
  slotPriceLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
    fontWeight: "500",
  },
  overrideCard: {
    backgroundColor: "#fafafa",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  overrideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  overrideLabelInput: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    color: "#333",
  },
  dateInput: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    fontWeight: "500",
    marginBottom: 12,
    color: "#333",
  },
  dateInputPressable: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateInputText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  dateLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
    fontWeight: "500",
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
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#2196F3",
  },
  addButtonText: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "white",
  },
  simulationCard: {
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  simulationContent: {
    gap: 10,
  },
  simulationHeader: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 12,
  },
  simulationScenario: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 10,
  },
  simRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 6,
  },
  simLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  simPrice: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1976D2",
  },
  simCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  simCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 4,
  },
  simCardSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    fontWeight: "400",
  },
  simCardPrices: {
    flexDirection: "row",
    gap: 16,
  },
  simCardPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1976D2",
  },
  simulationNote: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 10,
    fontStyle: "italic",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { 
    color: "white", 
    fontSize: 15, 
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
    fontWeight: "400",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  dayChipSelected: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  dayChipTextSelected: {
    color: "white",
  },
  modalCloseButton: {
    backgroundColor: "#2196F3",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  calendarMonthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  calendarMonthBtn: {
    padding: 8,
    backgroundColor: "white",
    borderRadius: 8,
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
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
    fontWeight: "600",
    color: "#2196F3",
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
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#eee",
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
});