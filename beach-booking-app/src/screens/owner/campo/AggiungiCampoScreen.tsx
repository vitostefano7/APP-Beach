import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons, FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { sportIcons } from "../../../utils/sportIcons";

import API_URL from "../../../config/api";
import { useAlert } from "../../../context/AlertContext";

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

interface SportData {
  _id: string;
  name: string;
  code: string;
  minPlayers: number;
  maxPlayers: number;
  allowsIndoor: boolean;
  allowsOutdoor: boolean;
  recommendedSurfaces?: {
    indoor?: string[];
    outdoor?: string[];
    any?: string[];
  };
  isActive: boolean;
}

const SURFACE_LABELS: Record<string, string> = {
  sand: "Sabbia",
  cement: "Cemento",
  pvc: "PVC",
  synthetic: "Sintetico",
  clay: "Terra Battuta",
  grass: "Erba",
  resin: "Resina",
  parquet: "Parquet",
  tartan: "Tartan",
};

/* =======================
   COMPONENT
======================= */

export default function AggiungiCampoScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { strutturaId } = route.params;
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(false);
  const [loadingSports, setLoadingSports] = useState(true);
  const [sports, setSports] = useState<SportData[]>([]);
  const [name, setName] = useState("");
  const [sport, setSport] = useState<string>("");
  const [surface, setSurface] = useState<string>("");
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
  const [isPricingConfigured, setIsPricingConfigured] = useState(false);
  const isSubmittingRef = useRef(false);

  /* =======================
     CARICAMENTO SPORT DAL BACKEND
  ======================= */
  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await fetch(`${API_URL}/sports`);
        const data = await response.json();
        
        if (data.success) {
          setSports(data.data);
        } else {
          showAlert({ type: 'error', title: 'Errore', message: 'Impossibile caricare gli sport' });
        }
      } catch (error) {
        console.error('Errore caricamento sport:', error);
        showAlert({ type: 'error', title: 'Errore', message: 'Errore nel caricamento degli sport' });
      } finally {
        setLoadingSports(false);
      }
    };

    fetchSports();
  }, []);

  /* =======================
     LOGICA SUPERFICIE E MAX PLAYERS
  ======================= */
  useEffect(() => {
    const selectedSport = sports.find((item) => item.code === sport);
    if (!selectedSport) {
      setSurface("");
      setMaxPlayers("4");
      return;
    }

    if (indoor && !selectedSport.allowsIndoor && selectedSport.allowsOutdoor) {
      setIndoor(false);
      return;
    }

    if (!indoor && !selectedSport.allowsOutdoor && selectedSport.allowsIndoor) {
      setIndoor(true);
      return;
    }

    const newSurface = getSurfaceBySportAndEnvironment(selectedSport, indoor, surface);
    if (newSurface) {
      setSurface(newSurface);
    }

    setMaxPlayers(selectedSport.maxPlayers.toString());
  }, [sport, indoor, sports]);

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

  const validatePricing = (): string | null => {
    const isPositivePrice = (value: number) => Number.isFinite(value) && value > 0;

    if (pricing.mode === "flat") {
      if (!isPositivePrice(pricing.flatPrices.oneHour) || !isPositivePrice(pricing.flatPrices.oneHourHalf)) {
        return "Inserisci prezzi validi (> 0) per 1 ora e 1.5 ore";
      }
      return null;
    }

    if (!isPositivePrice(pricing.basePrices.oneHour) || !isPositivePrice(pricing.basePrices.oneHourHalf)) {
      return "Inserisci prezzi base validi (> 0) per 1 ora e 1.5 ore";
    }

    if (pricing.timeSlotPricing.enabled) {
      if (pricing.timeSlotPricing.slots.length === 0) {
        return "Aggiungi almeno una fascia oraria o disattiva le fasce";
      }

      const hasInvalidSlot = pricing.timeSlotPricing.slots.some((slot) => {
        return (
          !slot.label.trim() ||
          !slot.start.trim() ||
          !slot.end.trim() ||
          !isPositivePrice(slot.prices.oneHour) ||
          !isPositivePrice(slot.prices.oneHourHalf)
        );
      });

      if (hasInvalidSlot) {
        return "Completa tutte le fasce orarie con orari, nome e prezzi validi (> 0)";
      }
    }

    return null;
  };

  const handleSavePricing = () => {
    const pricingError = validatePricing();
    if (pricingError) {
      showAlert({ type: "error", title: "Prezzi non validi", message: pricingError });
      return;
    }

    setIsPricingConfigured(true);
    setShowPricingModal(false);
  };

  /* =======================
     CREATE CAMPO
  ======================= */
  const handleCreate = async () => {
    if (isSubmittingRef.current || loading) {
      return;
    }

    if (loadingSports) {
      showAlert({ type: 'info', title: 'Attendi', message: 'Caricamento sport in corso' });
      return;
    }

    if (!name.trim()) {
      showAlert({ type: 'error', title: 'Errore', message: 'Il nome del campo è obbligatorio' });
      return;
    }
    if (!sport) {
      showAlert({ type: 'error', title: 'Errore', message: 'Seleziona uno sport' });
      return;
    }

    if (!surface) {
      showAlert({ type: 'error', title: 'Errore', message: 'Seleziona una superficie valida' });
      return;
    }

    if (!selectedSportData?._id) {
      showAlert({ type: 'error', title: 'Errore', message: 'Sport non valido, seleziona nuovamente lo sport' });
      return;
    }

    if (availableSurfaces.length > 0 && !availableSurfaces.includes(surface)) {
      showAlert({ type: 'error', title: 'Errore', message: 'La superficie selezionata non è valida per sport e ambiente scelti' });
      return;
    }

    if (!isPricingConfigured) {
      showAlert({
        type: 'error',
        title: 'Prezzi mancanti',
        message: 'Configura e salva i prezzi prima di confermare la creazione del campo',
      });
      return;
    }

    const pricingValidationError = validatePricing();
    if (pricingValidationError) {
      showAlert({ type: 'error', title: 'Prezzi non validi', message: pricingValidationError });
      return;
    }

    const campoData = {
      name,
      sport: selectedSportData._id,
      surface,
      maxPlayers: selectedSportData?.maxPlayers || parseInt(maxPlayers) || 4,
      indoor,
      pricePerHour: pricing.flatPrices.oneHour,
      pricingRules: pricing,
    };

    setLoading(true);
    isSubmittingRef.current = true;

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

      let result: any = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (response.ok) {
        showAlert({
          type: 'success',
          title: 'Successo',
          message: 'Campo aggiunto con successo!',
          onConfirm: () => navigation.goBack(),
        });
      } else {
        showAlert({ type: 'error', title: 'Errore', message: result?.message || "Impossibile aggiungere il campo" });
      }
    } catch (error) {
      showAlert({ type: 'error', title: 'Errore', message: 'Errore di connessione' });
      console.error(error);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  /* =======================
     LABEL HELPERS
  ======================= */
  const renderSportIcon = (sportValue: string, isActive: boolean) => {
    const iconConfig = sportIcons[sportValue];
    if (!iconConfig) {
      return <Ionicons name="fitness-outline" size={16} color={isActive ? "white" : "#999"} />;
    }

    const iconColor = isActive ? "white" : "#999";
    const IconComponent = iconConfig.library === "FontAwesome5" 
      ? FontAwesome5 
      : iconConfig.library === "FontAwesome6" 
      ? FontAwesome6 
      : Ionicons;

    return <IconComponent name={iconConfig.name as any} size={16} color={iconColor} />;
  };

  const getSurfaceBySportAndEnvironment = (sportData: SportData, isIndoor: boolean, currentSurface: string): string => {
    const recommended =
      sportData.recommendedSurfaces?.any?.length
        ? sportData.recommendedSurfaces.any
        : isIndoor
        ? sportData.recommendedSurfaces?.indoor || []
        : sportData.recommendedSurfaces?.outdoor || [];

    if (!recommended.length) {
      return currentSurface;
    }

    if (currentSurface && recommended.includes(currentSurface)) {
      return currentSurface;
    }

    return recommended[0];
  };

  const getAvailableSurfaces = (sportData?: SportData, isIndoorEnvironment?: boolean): string[] => {
    if (!sportData) return [];
    if (sportData.recommendedSurfaces?.any?.length) return sportData.recommendedSurfaces.any;
    if (isIndoorEnvironment) return sportData.recommendedSurfaces?.indoor || [];
    return sportData.recommendedSurfaces?.outdoor || [];
  };

  const getSurfaceLabel = () => {
    return SURFACE_LABELS[surface] || (surface ? surface.charAt(0).toUpperCase() + surface.slice(1) : "Superficie");
  };

  const selectedSportData = sports.find((item) => item.code === sport);
  const canSelectIndoor = !selectedSportData || selectedSportData.allowsIndoor;
  const canSelectOutdoor = !selectedSportData || selectedSportData.allowsOutdoor;
  const availableSurfaces = getAvailableSurfaces(selectedSportData, indoor);
  const canChooseSurface = availableSurfaces.length > 1;

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
          <Pressable onPress={handleSavePricing} style={styles.saveModalButton}>
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
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Aggiungi Campo</Text>
        <View style={{ width: 68 }} />
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            Copertura e superficie seguono le opzioni disponibili per lo sport selezionato
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Nome del Campo *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Es. Campo 1"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Sport *</Text>
          {loadingSports ? (
            <View style={styles.sportsLoadingContainer}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.loadingText}>Caricamento sport...</Text>
            </View>
          ) : (
            <View style={styles.chipContainer}>
              {sports.map((item) => (
                <Pressable
                  key={item.code}
                  style={[styles.chip, sport === item.code && styles.chipActive]}
                  onPress={() => setSport(item.code)}
                >
                  {sport === item.code ? (
                    <LinearGradient
                      colors={["#2196F3", "#1976D2"]}
                      style={styles.chipGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {renderSportIcon(item.code, true)}
                      <Text style={[styles.chipText, styles.chipTextActive]}>{item.name}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.chipInner}>
                      {renderSportIcon(item.code, false)}
                      <Text style={styles.chipText}>{item.name}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {sport && (
          <View style={styles.section}>
            <Text style={styles.label}>Copertura campo</Text>
            <View style={styles.environmentChipsContainer}>
              <Pressable
                onPress={() => canSelectIndoor && setIndoor(true)}
                disabled={!canSelectIndoor}
                style={[
                  styles.environmentChip,
                  indoor && styles.environmentChipSelected,
                  !canSelectIndoor && styles.environmentChipDisabled,
                ]}
              >
                <Ionicons name="home-outline" size={16} color={indoor ? "#fff" : "#2196F3"} />
                <Text style={[styles.environmentChipText, indoor && styles.environmentChipTextSelected]}>Indoor</Text>
              </Pressable>

              <Pressable
                onPress={() => canSelectOutdoor && setIndoor(false)}
                disabled={!canSelectOutdoor}
                style={[
                  styles.environmentChip,
                  !indoor && styles.environmentChipSelected,
                  !canSelectOutdoor && styles.environmentChipDisabled,
                ]}
              >
                <Ionicons name="sunny-outline" size={16} color={!indoor ? "#fff" : "#2196F3"} />
                <Text style={[styles.environmentChipText, !indoor && styles.environmentChipTextSelected]}>Outdoor</Text>
              </Pressable>
            </View>
          </View>
        )}

        {sport && (
          <View style={styles.section}>
            <Text style={styles.label}>Superficie</Text>
            {availableSurfaces.length > 0 ? (
              <View style={styles.surfaceChoicesContainer}>
                {availableSurfaces.map((surfaceCode) => {
                  const isSelected = surface === surfaceCode;
                  return (
                    <Pressable
                      key={surfaceCode}
                      onPress={() => canChooseSurface && setSurface(surfaceCode)}
                      style={[styles.surfaceChoiceChip, isSelected && styles.surfaceChoiceChipSelected]}
                    >
                      <Text style={[styles.surfaceChoiceChipText, isSelected && styles.surfaceChoiceChipTextSelected]}>
                        {SURFACE_LABELS[surfaceCode] || surfaceCode}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.noSurfaceContainer}>
                <Text style={styles.noSurfaceText}>Superficie corrente: {getSurfaceLabel()}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Max giocatori</Text>
          <View style={styles.readOnlyCard}>
            <Text style={styles.readOnlyValue}>{maxPlayers}</Text>
          </View>
        </View>

        <Pressable
          style={[styles.configurePricingButton, loading && styles.configurePricingButtonDisabled]}
          onPress={() => {
            setIsPricingConfigured(false);
            setShowPricingModal(true);
          }}
          disabled={loading}
        >
          <View style={styles.configurePricingButtonContent}>
            <Ionicons name="cash-outline" size={18} color="#1976D2" />
            <Text style={styles.configurePricingButtonText}>
              {loading ? "Attendere..." : "Step successivo: Configura Prezzi"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#1976D2" />
          </View>
        </Pressable>

        <Pressable
          style={[styles.confirmCreateButton, loading && styles.confirmCreateButtonDisabled]}
          onPress={() => handleCreate()}
          disabled={loading}
        >
          <View style={styles.confirmCreateButtonContent}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.confirmCreateButtonText}>
              {loading ? "Aggiunta in corso..." : "Conferma e chiudi"}
            </Text>
          </View>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

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
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
    zIndex: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#EAF4FF",
    padding: 14,
    borderRadius: 18,
    marginTop: 12,
    marginBottom: 20,
    elevation: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1976D2",
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    color: "#1a1a1a",
  },
  input: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    elevation: 3,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  sportsLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 3,
  },
  loadingText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  chip: {
    width: "48.5%",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "white",
    elevation: 3,
    marginBottom: 10,
  },
  chipActive: {
  },
  chipGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 46,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  chipInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 46,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#999",
    flexShrink: 1,
    textAlign: "center",
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
    borderRadius: 18,
    elevation: 3,
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
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  switchCardSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  environmentChipsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  environmentChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#BBDEFB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    elevation: 2,
  },
  environmentChipSelected: {
    backgroundColor: "#2196F3",
    borderColor: "#1976D2",
  },
  environmentChipDisabled: {
    opacity: 0.45,
  },
  environmentChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1976D2",
  },
  environmentChipTextSelected: {
    color: "#fff",
  },
  surfaceChoicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  surfaceChoiceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 46,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BBDEFB",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  surfaceChoiceChipSelected: {
    backgroundColor: "#2196F3",
    borderColor: "#1976D2",
  },
  surfaceChoiceChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1976D2",
  },
  surfaceChoiceChipTextSelected: {
    color: "#fff",
  },
  noSurfaceContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 2,
  },
  noSurfaceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  readOnlyCard: {
    backgroundColor: "white",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 3,
  },
  readOnlyValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  readOnlySubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
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
  surfaceInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#E8F5E9",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  surfaceInfoText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2E7D32",
  },
  configurePricingButton: {
    backgroundColor: "#EAF4FF",
    borderWidth: 1,
    borderColor: "#BBDEFB",
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    elevation: 4,
  },
  configurePricingButtonDisabled: {
    opacity: 0.5,
  },
  configurePricingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  configurePricingButtonText: {
    color: "#1976D2",
    fontSize: 14,
    fontWeight: "700",
  },
  confirmCreateButton: {
    backgroundColor: "#2196F3",
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    elevation: 4,
  },
  confirmCreateButtonDisabled: {
    opacity: 0.5,
  },
  confirmCreateButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmCreateButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  // MODAL STYLES
  modalSafe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: "600",
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
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  modalCardTitle: {
    fontSize: 15,
    fontWeight: "600",
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
    borderRadius: 14,
    backgroundColor: "#fff",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#BBDEFB",
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
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#BBDEFB",
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
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#BBDEFB",
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
    borderColor: "#BBDEFB",
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