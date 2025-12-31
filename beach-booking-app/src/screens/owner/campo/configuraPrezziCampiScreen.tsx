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
}

interface PricingRules {
  mode: "flat" | "advanced";
  flatPrices: DurationPrice;
  basePrices: DurationPrice;
  timeSlotPricing: {
    enabled: boolean;
    slots: TimeSlot[];
  };
}

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
  const [pricing, setPricing] = useState<PricingRules>({
    mode: "flat",
    flatPrices: { oneHour: 20, oneHourHalf: 28 },
    basePrices: { oneHour: 20, oneHourHalf: 28 },
    timeSlotPricing: { enabled: false, slots: [] },
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
      });
    } catch {
      Alert.alert("Errore", "Impossibile caricare i prezzi");
    } finally {
      setLoading(false);
    }
  }, [campoId, token]);

  // ✅ Ricarica quando la schermata torna in focus
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
     HANDLERS
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
            prices: { oneHour: 15, oneHourHalf: 21 },
          },
        ],
      },
    }));
  };

  const updateTimeSlot = (index: number, field: string, value: any) => {
    setPricing((prev) => {
      const newSlots = [...(prev.timeSlotPricing?.slots || [])];
      
      if (!newSlots[index]) {
        return prev;
      }
      
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

  /* =======================
     SIMULAZIONE
  ======================= */

  const renderSimulation = () => {
    if (pricing.mode === "flat") {
      const oneHour = pricing.flatPrices?.oneHour || 20;
      const oneHourHalf = pricing.flatPrices?.oneHourHalf || 28;
      
      return (
        <View style={styles.simulationContent}>
          <Text style={styles.simulationScenario}>Tariffa Fissa</Text>
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

    // ADVANCED
    const hasTimeSlots = pricing.timeSlotPricing?.enabled && pricing.timeSlotPricing.slots?.length > 0;

    if (!hasTimeSlots) {
      const oneHour = pricing.basePrices?.oneHour || 20;
      const oneHourHalf = pricing.basePrices?.oneHourHalf || 28;
      
      return (
        <View style={styles.simulationContent}>
          <Text style={styles.simulationScenario}>Prezzo Base</Text>
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

    // Con fasce orarie - mostra esempio sera
    const eveningSlot = pricing.timeSlotPricing.slots.find((s) =>
      s.label.toLowerCase().includes("sera")
    ) || pricing.timeSlotPricing.slots[pricing.timeSlotPricing.slots.length - 1];

    return (
      <View style={styles.simulationContent}>
        <Text style={styles.simulationScenario}>{eveningSlot.label}</Text>
        <View style={styles.simRow}>
          <Text style={styles.simLabel}>1 ora:</Text>
          <Text style={styles.simPrice}>€{(eveningSlot.prices?.oneHour || 20).toFixed(2)}</Text>
        </View>
        <View style={styles.simRow}>
          <Text style={styles.simLabel}>1.5 ore:</Text>
          <Text style={styles.simPrice}>€{(eveningSlot.prices?.oneHourHalf || 28).toFixed(2)}</Text>
        </View>
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
                Prezzi variabili per fascia oraria
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
                Usati quando non c'è una fascia oraria specifica
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

            {/* FASCE ORARIE */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>⏰ Fasce Orarie</Text>
                <Switch
                  value={pricing.timeSlotPricing.enabled}
                  onValueChange={toggleTimeSlot}
                />
              </View>

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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerSubtitle: { fontSize: 14, color: "#666", marginTop: 2 },
  container: { padding: 16 },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  cardDescription: { fontSize: 13, color: "#666", marginBottom: 12 },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  radioOptionActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
  radioLabel: { fontSize: 15, fontWeight: "600" },
  radioDescription: { fontSize: 13, color: "#666", marginTop: 2 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceLabel: { fontSize: 15, fontWeight: "600" },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
    minWidth: 100,
  },
  euroSign: { fontSize: 16, fontWeight: "600", marginRight: 4, color: "#666" },
  priceInputField: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  configContent: { marginTop: 12 },
  timeSlotCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  timeSlotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timeSlotLabelInput: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  timeSlotTimeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  timeInputWrapper: { flex: 1 },
  timeLabel: { fontSize: 12, color: "#666", marginBottom: 4, fontWeight: "600" },
  timeInput: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
    fontWeight: "600",
  },
  slotPriceRow: {
    flexDirection: "row",
    gap: 8,
  },
  slotPriceLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#2196F3",
    borderStyle: "dashed",
  },
  addButtonText: { fontSize: 14, fontWeight: "600", color: "#2196F3" },
  simulationCard: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  simulationContent: {
    gap: 8,
  },
  simulationScenario: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 8,
  },
  simRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#C8E6C9",
  },
  simLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
  },
  simPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1B5E20",
  },
  saveButton: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: "white", fontSize: 18, fontWeight: "700" },
});