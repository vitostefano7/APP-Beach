import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import API_URL from "../../config/api";

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

export default function AggiungiCampoScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { strutturaId } = route.params;

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [sport, setSport] = useState<"beach_volley" | "volley" | "">("");
  const [surface, setSurface] = useState<"sand" | "cement" | "pvc" | "">("");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [indoor, setIndoor] = useState(false);

  // Pricing
  const [pricing, setPricing] = useState<PricingRules>({
    mode: "flat",
    flatPrices: { oneHour: 20, oneHourHalf: 28 },
    basePrices: { oneHour: 20, oneHourHalf: 28 },
    timeSlotPricing: { enabled: false, slots: [] },
  });

  const [showPricingModal, setShowPricingModal] = useState(false);

  /* =======================
     LOGICA SUPERFICIE
  ======================= */
  useEffect(() => {
    if (sport === "beach_volley") {
      setSurface("sand");
    } else if (sport === "volley") {
      setSurface(indoor ? "pvc" : "cement");
    } else {
      setSurface("");
    }
  }, [sport, indoor]);

  /* =======================
     PRICING HANDLERS
  ======================= */

  const updatePricingFlat = (type: "oneHour" | "oneHourHalf", value: string) => {
    const num = parseFloat(value) || 0;
    setPricing(prev => ({
      ...prev,
      flatPrices: { ...prev.flatPrices, [type]: num },
    }));
  };

  const updatePricingBase = (type: "oneHour" | "oneHourHalf", value: string) => {
    const num = parseFloat(value) || 0;
    setPricing(prev => ({
      ...prev,
      basePrices: { ...prev.basePrices, [type]: num },
    }));
  };

  const toggleTimeSlot = () => {
    setPricing(prev => ({
      ...prev,
      timeSlotPricing: {
        ...prev.timeSlotPricing,
        enabled: !prev.timeSlotPricing.enabled,
      },
    }));
  };

  const addTimeSlot = () => {
    setPricing(prev => ({
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
    setPricing(prev => {
      const newSlots = [...prev.timeSlotPricing.slots];
      if (!newSlots[index]) return prev;
      
      if (field === "prices.oneHour" || field === "prices.oneHourHalf") {
        const priceField = field.split(".")[1] as "oneHour" | "oneHourHalf";
        newSlots[index] = {
          ...newSlots[index],
          prices: {
            ...newSlots[index].prices,
            [priceField]: parseFloat(value) || 0,
          },
        };
      } else {
        newSlots[index] = { ...newSlots[index], [field]: value };
      }
      
      return {
        ...prev,
        timeSlotPricing: {
          ...prev.timeSlotPricing,
          slots: newSlots,
        },
      };
    });
  };

  const removeTimeSlot = (index: number) => {
    setPricing(prev => ({
      ...prev,
      timeSlotPricing: {
        ...prev.timeSlotPricing,
        slots: prev.timeSlotPricing.slots.filter((_, i) => i !== index),
      },
    }));
  };

  /* =======================
     CREATE CAMPO
  ======================= */
  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Errore", "Il nome del campo è obbligatorio");
      return;
    }
    if (!sport) {
      Alert.alert("Errore", "Seleziona uno sport");
      return;
    }

    const campoData = {
      name,
      sport,
      surface,
      maxPlayers: parseInt(maxPlayers) || 4,
      indoor,
      pricePerHour: pricing.flatPrices.oneHour,
      pricingRules: pricing,
    };

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/campi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          strutturaId,
          campi: [campoData],
        }),
      });

      if (response.ok) {
        Alert.alert("Successo", "Campo aggiunto con successo!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        const error = await response.json();
        Alert.alert("Errore", error.message || "Impossibile aggiungere il campo");
      }
    } catch (error) {
      Alert.alert("Errore", "Errore di connessione");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     LABEL HELPERS
  ======================= */
  const getSurfaceLabel = () => {
    if (sport === "beach_volley") {
      return indoor ? "Sabbia (Indoor)" : "Sabbia (Outdoor)";
    }
    if (sport === "volley") {
      return indoor ? "PVC (Indoor)" : "Cemento (Outdoor)";
    }
    return "Superficie";
  };

  const getPricingLabel = () => {
    if (pricing.mode === "flat") {
      return `€${pricing.flatPrices.oneHour}/h`;
    }
    const hasSlots = pricing.timeSlotPricing.enabled && 
                    pricing.timeSlotPricing.slots.length > 0;
    return hasSlots ? "Prezzi dinamici" : `€${pricing.basePrices.oneHour}/h`;
  };

  /* =======================
     PRICING MODAL
  ======================= */
  const renderPricingModal = () => (
    <Modal visible={showPricingModal} animationType="slide">
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Pressable onPress={() => setShowPricingModal(false)}>
            <Ionicons name="close" size={28} color="#333" />
          </Pressable>
          <Text style={styles.modalHeaderTitle}>Configura Prezzi</Text>
          <Pressable onPress={() => setShowPricingModal(false)} style={styles.saveModalButton}>
            <Text style={styles.saveModalButtonText}>Salva</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* MODE */}
          <View style={styles.modalCard}>
            <Text style={styles.modalCardTitle}>💰 Modalità Pricing</Text>

            <Pressable
              style={[
                styles.radioOption,
                pricing.mode === "flat" && styles.radioOptionActive,
              ]}
              onPress={() => setPricing({ ...pricing, mode: "flat" })}
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
              onPress={() => setPricing({ ...pricing, mode: "advanced" })}
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
            <View style={styles.modalCard}>
              <Text style={styles.modalCardTitle}>💵 Prezzi Fissi</Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>1 ora</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.euroSign}>€</Text>
                  <TextInput
                    style={styles.priceInputField}
                    value={pricing.flatPrices.oneHour.toString()}
                    onChangeText={(v) => updatePricingFlat("oneHour", v)}
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
                    value={pricing.flatPrices.oneHourHalf.toString()}
                    onChangeText={(v) => updatePricingFlat("oneHourHalf", v)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
          )}

          {/* ADVANCED MODE */}
          {pricing.mode === "advanced" && (
            <>
              <View style={styles.modalCard}>
                <Text style={styles.modalCardTitle}>💵 Prezzi Base</Text>
                <Text style={styles.cardDescription}>
                  Usati quando non c'è una fascia oraria specifica
                </Text>

                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>1 ora</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.euroSign}>€</Text>
                    <TextInput
                      style={styles.priceInputField}
                      value={pricing.basePrices.oneHour.toString()}
                      onChangeText={(v) => updatePricingBase("oneHour", v)}
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
                      value={pricing.basePrices.oneHourHalf.toString()}
                      onChangeText={(v) => updatePricingBase("oneHourHalf", v)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>

              {/* TIME SLOTS */}
              <View style={styles.modalCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.modalCardTitle}>⏰ Fasce Orarie</Text>
                  <Switch
                    value={pricing.timeSlotPricing.enabled}
                    onValueChange={toggleTimeSlot}
                  />
                </View>

                {pricing.timeSlotPricing.enabled && (
                  <>
                    {pricing.timeSlotPricing.slots.map((slot, index) => (
                      <View key={index} style={styles.timeSlotCard}>
                        <View style={styles.timeSlotHeader}>
                          <TextInput
                            style={styles.timeSlotLabelInput}
                            value={slot.label}
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
                              style={styles.timeInputModal}
                              value={slot.start}
                              onChangeText={(v) => updateTimeSlot(index, "start", v)}
                              placeholder="09:00"
                            />
                          </View>

                          <View style={styles.timeInputWrapper}>
                            <Text style={styles.timeLabel}>Alle</Text>
                            <TextInput
                              style={styles.timeInputModal}
                              value={slot.end}
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
                                value={slot.prices.oneHour.toString()}
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
                                value={slot.prices.oneHourHalf.toString()}
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
                  </>
                )}
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Aggiungi Campo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* INFO */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            La superficie viene impostata automaticamente in base allo sport e al
            tipo di campo
          </Text>
        </View>

        {/* NOME */}
        <View style={styles.section}>
          <Text style={styles.label}>Nome campo *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Es. Campo 1"
            placeholderTextColor="#999"
          />
        </View>

        {/* SPORT */}
        <View style={styles.section}>
          <Text style={styles.label}>Sport *</Text>
          <View style={styles.chipContainer}>
            {[
              { value: "beach_volley", label: "Beach Volley", icon: "fitness" },
              { value: "volley", label: "Volley", icon: "basketball" },
            ].map((item) => (
              <Pressable
                key={item.value}
                style={[
                  styles.chip,
                  sport === item.value && styles.chipActive,
                ]}
                onPress={() => setSport(item.value as any)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={sport === item.value ? "white" : "#666"}
                />
                <Text
                  style={[
                    styles.chipText,
                    sport === item.value && styles.chipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* INDOOR / OUTDOOR */}
        {sport && (
          <View style={styles.section}>
            <View style={styles.switchCard}>
              <View style={styles.switchCardLeft}>
                <Ionicons
                  name={indoor ? "business" : "sunny"}
                  size={24}
                  color={indoor ? "#2196F3" : "#FF9800"}
                />
                <View style={styles.switchCardText}>
                  <Text style={styles.switchCardTitle}>
                    {indoor
                      ? "Campo coperto (Indoor)"
                      : "Campo scoperto (Outdoor)"}
                  </Text>
                  <Text style={styles.switchCardSubtitle}>
                    {sport === "beach_volley"
                      ? "Superficie: Sabbia"
                      : indoor
                      ? "Superficie: PVC"
                      : "Superficie: Cemento"}
                  </Text>
                </View>
              </View>
              <Switch
                value={indoor}
                onValueChange={setIndoor}
                trackColor={{ false: "#e9ecef", true: "#2196F3" }}
                thumbColor="white"
              />
            </View>
          </View>
        )}

        {/* SUPERFICIE */}
        {sport && (
          <View style={styles.section}>
            <Text style={styles.label}>Superficie</Text>
            <View style={styles.surfaceDisplay}>
              <Ionicons
                name={
                  surface === "sand"
                    ? "beach"
                    : surface === "pvc"
                    ? "layers"
                    : "construct"
                }
                size={20}
                color="#4CAF50"
              />
              <Text style={styles.surfaceDisplayText}>
                {getSurfaceLabel()}
              </Text>
            </View>
          </View>
        )}

        {/* MAX GIOCATORI */}
        <View style={styles.section}>
          <Text style={styles.label}>Max giocatori</Text>
          <TextInput
            style={styles.input}
            value={maxPlayers}
            onChangeText={setMaxPlayers}
            placeholder="4"
            placeholderTextColor="#999"
            keyboardType="number-pad"
          />
        </View>

        {/* PRICING BUTTON */}
        <Pressable
          style={styles.pricingButton}
          onPress={() => setShowPricingModal(true)}
        >
          <View style={styles.pricingButtonLeft}>
            <Ionicons name="cash-outline" size={20} color="#2196F3" />
            <View>
              <Text style={styles.pricingButtonTitle}>Configura Prezzi</Text>
              <Text style={styles.pricingButtonSubtitle}>{getPricingLabel()}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </Pressable>

        {/* SUBMIT */}
        <Pressable
          style={[
            styles.createButton,
            loading && styles.createButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? "Aggiunta in corso..." : "Aggiungi campo"}
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* PRICING MODAL */}
      {renderPricingModal()}
    </SafeAreaView>
  );
}

/* =======================
   STYLES
======================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#E3F2FD",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1976D2",
    fontWeight: "500",
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontWeight: "500",
  },
  chipContainer: {
    flexDirection: "row",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  chipActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  chipText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "white",
  },
  switchCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  switchCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  switchCardText: {
    flex: 1,
  },
  switchCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  switchCardSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  surfaceDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#E8F5E9",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  surfaceDisplayText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E7D32",
  },
  pricingButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  pricingButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  pricingButtonTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1976D2",
  },
  pricingButtonSubtitle: {
    fontSize: 13,
    color: "#1976D2",
    marginTop: 2,
  },
  createButton: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  // MODAL STYLES
  modalSafe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  saveModalButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveModalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  modalCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
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
  timeInputModal: {
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
    marginTop: 8,
  },
  addButtonText: { fontSize: 14, fontWeight: "600", color: "#2196F3" },
});