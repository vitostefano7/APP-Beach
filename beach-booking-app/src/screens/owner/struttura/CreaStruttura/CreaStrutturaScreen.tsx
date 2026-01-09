import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Switch,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useContext } from "react";

import { AuthContext } from "../../../../context/AuthContext";
import { styles } from "./styles/CreaStruttura.styles";
import PricingModal from "./components/pricingModal";

import { useCreaStruttura } from "./hooks/CreaStruttura.hooks";
import {
  pickImages,
  moveImageUp,
  removeImage,
  searchAddress,
  uploadImages,
} from "./utils/CreaStruttura.utils";

import {
  createStruttura,
  createCampi,
} from "./api/CreaStruttura.api";

import { Campo } from "./types/CreaStruttura.types";

/* =======================
   CONSTANTS
======================= */

const DAYS = [
  { key: "monday", label: "Lunedì" },
  { key: "tuesday", label: "Martedì" },
  { key: "wednesday", label: "Mercoledì" },
  { key: "thursday", label: "Giovedì" },
  { key: "friday", label: "Venerdì" },
  { key: "saturday", label: "Sabato" },
  { key: "sunday", label: "Domenica" },
];

const AVAILABLE_AMENITIES = [
  { key: "toilets", label: "Bagni", icon: "water" },
  { key: "lockerRoom", label: "Spogliatoi", icon: "shirt" },
  { key: "showers", label: "Docce", icon: "rainy" },
  { key: "parking", label: "Parcheggio", icon: "car" },
  { key: "restaurant", label: "Ristorante", icon: "restaurant" },
  { key: "bar", label: "Bar", icon: "beer" },
];

const DAYS_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

/* =======================
   SCREEN
======================= */

export default function CreaStrutturaScreen() {
  const navigation = useNavigation<any>();
  const { token } = useContext(AuthContext);
  const s = useCreaStruttura();

  /* =======================
     ADDRESS AUTOCOMPLETE
  ======================= */

  const handleAddressChange = (text: string) => {
    s.setAddressInput(text);

    if (s.timeoutRef.current) {
      clearTimeout(s.timeoutRef.current);
    }

    s.timeoutRef.current = setTimeout(async () => {
      if (text.length < 3) {
        s.setSuggestions([]);
        s.setShowSuggestions(false);
        return;
      }

      s.setLoadingSuggestions(true);
      try {
        const res = await searchAddress(text);
        s.setSuggestions(res);
        s.setShowSuggestions(true);
      } catch {
        s.setSuggestions([]);
        s.setShowSuggestions(false);
      } finally {
        s.setLoadingSuggestions(false);
      }
    }, 700);
  };

  const selectPlace = (place: any) => {
    s.setShowSuggestions(false);
    s.setAddressInput(place.display_name);
    s.setSelectedAddress(place.display_name);
    s.setLat(place.lat);
    s.setLng(place.lon);

    const city =
      place.address?.city ||
      place.address?.town ||
      place.address?.village ||
      place.address?.municipality ||
      "";

    s.setCity(city);
  };

  /* =======================
     AMENITIES HANDLERS
  ======================= */

  const toggleAmenity = (key: string) => {
    s.setAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

  const addCustomAmenity = () => {
    const trimmed = s.customAmenityInput.trim();
    
    if (!trimmed) {
      Alert.alert("Errore", "Inserisci il nome del servizio");
      return;
    }

    if (s.customAmenities.includes(trimmed)) {
      Alert.alert("Attenzione", "Questo servizio è già presente");
      return;
    }

    s.setCustomAmenities((prev) => [...prev, trimmed]);
    s.setAmenities((prev) => [...prev, trimmed]);
    s.setCustomAmenityInput("");
    s.setShowCustomModal(false);
  };

  const removeCustomAmenity = (amenity: string) => {
    Alert.alert("Rimuovi servizio", `Vuoi rimuovere definitivamente "${amenity}"?`, [
      { text: "Annulla", style: "cancel" },
      {
        text: "Rimuovi",
        style: "destructive",
        onPress: () => {
          s.setCustomAmenities((prev) => prev.filter((a) => a !== amenity));
          s.setAmenities((prev) => prev.filter((a) => a !== amenity));
        },
      },
    ]);
  };

  /* =======================
     PRICING MODAL FUNCTIONS
  ======================= */

  const updateTempPricingFlat = (field: "oneHour" | "oneHourHalf", value: string) => {
    if (!s.tempPricing) return;
    const numValue = parseFloat(value) || 0;
    s.setTempPricing({
      ...s.tempPricing,
      flatPrices: { ...s.tempPricing.flatPrices, [field]: numValue },
    });
  };

  const updateTempPricingBase = (field: "oneHour" | "oneHourHalf", value: string) => {
    if (!s.tempPricing) return;
    const numValue = parseFloat(value) || 0;
    s.setTempPricing({
      ...s.tempPricing,
      basePrices: { ...s.tempPricing.basePrices, [field]: numValue },
    });
  };

  const toggleTempTimeSlot = () => {
    if (!s.tempPricing) return;
    s.setTempPricing({
      ...s.tempPricing,
      timeSlotPricing: {
        ...s.tempPricing.timeSlotPricing,
        enabled: !s.tempPricing.timeSlotPricing.enabled,
      },
    });
  };

  const addTempTimeSlot = () => {
    if (!s.tempPricing) return;
    s.setTempPricing({
      ...s.tempPricing,
      timeSlotPricing: {
        ...s.tempPricing.timeSlotPricing,
        slots: [
          ...s.tempPricing.timeSlotPricing.slots,
          {
            start: "09:00",
            end: "13:00",
            label: "Mattina",
            prices: { oneHour: 25, oneHourHalf: 35 },
          },
        ],
      },
    });
  };

  const updateTempTimeSlot = (index: number, field: string, value: any) => {
    if (!s.tempPricing) return;
    
    const newSlots = [...s.tempPricing.timeSlotPricing.slots];
    if (!newSlots[index]) return;
    
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
    
    s.setTempPricing({
      ...s.tempPricing,
      timeSlotPricing: {
        ...s.tempPricing.timeSlotPricing,
        slots: newSlots,
      },
    });
  };

  const removeTempTimeSlot = (index: number) => {
    if (!s.tempPricing) return;
    s.setTempPricing({
      ...s.tempPricing,
      timeSlotPricing: {
        ...s.tempPricing.timeSlotPricing,
        slots: s.tempPricing.timeSlotPricing.slots.filter((_, i) => i !== index),
      },
    });
  };

  const openDaysModal = (slotIndex: number) => {
    s.setEditingSlotIndex(slotIndex);
    s.setShowDaysModal(true);
  };

  const toggleDayInSlot = (dayIndex: number) => {
    if (!s.tempPricing || s.editingSlotIndex === null) return;
    const slot = s.tempPricing.timeSlotPricing.slots[s.editingSlotIndex];
    if (!slot) return;

    const currentDays = slot.daysOfWeek || [];
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter((d) => d !== dayIndex)
      : [...currentDays, dayIndex].sort();

    const newSlots = [...s.tempPricing.timeSlotPricing.slots];
    newSlots[s.editingSlotIndex] = { ...slot, daysOfWeek: newDays };

    s.setTempPricing({
      ...s.tempPricing,
      timeSlotPricing: {
        ...s.tempPricing.timeSlotPricing,
        slots: newSlots,
      },
    });
  };

  const toggleTempDateOverrides = () => {
    if (!s.tempPricing) return;
    s.setTempPricing({
      ...s.tempPricing,
      dateOverrides: {
        ...s.tempPricing.dateOverrides,
        enabled: !s.tempPricing.dateOverrides.enabled,
      },
    });
  };

  const addTempDateOverride = () => {
    if (!s.tempPricing) return;
    const today = new Date().toISOString().split("T")[0];
    s.setTempPricing({
      ...s.tempPricing,
      dateOverrides: {
        ...s.tempPricing.dateOverrides,
        dates: [
          ...s.tempPricing.dateOverrides.dates,
          {
            date: today,
            label: "Evento speciale",
            prices: { oneHour: 50, oneHourHalf: 70 },
          },
        ],
      },
    });
  };

  const updateTempDateOverride = (index: number, field: string, value: any) => {
    if (!s.tempPricing) return;
    
    const newDates = [...s.tempPricing.dateOverrides.dates];
    
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
    
    s.setTempPricing({
      ...s.tempPricing,
      dateOverrides: { ...s.tempPricing.dateOverrides, dates: newDates },
    });
  };

  const removeTempDateOverride = (index: number) => {
    if (!s.tempPricing) return;
    s.setTempPricing({
      ...s.tempPricing,
      dateOverrides: {
        ...s.tempPricing.dateOverrides,
        dates: s.tempPricing.dateOverrides.dates.filter((_, i) => i !== index),
      },
    });
  };

  const openDatePicker = (index: number) => {
    s.setEditingDateIndex(index);
    s.setDatePickerMode("date");
    if (s.tempPricing) {
      const currentDate = s.tempPricing.dateOverrides.dates[index]?.date;
      if (currentDate) {
        const [y, m] = currentDate.split("-").map(Number);
        s.setSelectedMonth(new Date(y, m - 1, 1));
      }
    }
    s.setShowDatePicker(true);
  };

  const toggleTempPeriodOverrides = () => {
    if (!s.tempPricing) return;
    s.setTempPricing({
      ...s.tempPricing,
      periodOverrides: {
        ...s.tempPricing.periodOverrides,
        enabled: !s.tempPricing.periodOverrides.enabled,
      },
    });
  };

  const addTempPeriodOverride = () => {
    if (!s.tempPricing) return;
    const today = new Date().toISOString().split("T")[0];
    s.setTempPricing({
      ...s.tempPricing,
      periodOverrides: {
        ...s.tempPricing.periodOverrides,
        periods: [
          ...s.tempPricing.periodOverrides.periods,
          {
            startDate: today,
            endDate: today,
            label: "Alta stagione",
            prices: { oneHour: 40, oneHourHalf: 55 },
          },
        ],
      },
    });
  };

  const updateTempPeriodOverride = (index: number, field: string, value: any) => {
    if (!s.tempPricing) return;
    
    const newPeriods = [...s.tempPricing.periodOverrides.periods];
    
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
    
    s.setTempPricing({
      ...s.tempPricing,
      periodOverrides: { ...s.tempPricing.periodOverrides, periods: newPeriods },
    });
  };

  const removeTempPeriodOverride = (index: number) => {
    if (!s.tempPricing) return;
    s.setTempPricing({
      ...s.tempPricing,
      periodOverrides: {
        ...s.tempPricing.periodOverrides,
        periods: s.tempPricing.periodOverrides.periods.filter((_, i) => i !== index),
      },
    });
  };

  const openPeriodDatePicker = (periodIndex: number, mode: "period-start" | "period-end") => {
    s.setEditingPeriodIndex(periodIndex);
    s.setDatePickerMode(mode);
    if (s.tempPricing) {
      const period = s.tempPricing.periodOverrides.periods[periodIndex];
      if (period) {
        const dateStr = mode === "period-start" ? period.startDate : period.endDate;
        const [y, m] = dateStr.split("-").map(Number);
        s.setSelectedMonth(new Date(y, m - 1, 1));
      }
    }
    s.setShowDatePicker(true);
  };

  const handleDateSelect = (dateStr: string) => {
    if (!s.tempPricing) return;

    if (s.datePickerMode === "date" && s.editingDateIndex !== null) {
      updateTempDateOverride(s.editingDateIndex, "date", dateStr);
    } else if (s.datePickerMode === "period-start" && s.editingPeriodIndex !== null) {
      updateTempPeriodOverride(s.editingPeriodIndex, "startDate", dateStr);
    } else if (s.datePickerMode === "period-end" && s.editingPeriodIndex !== null) {
      updateTempPeriodOverride(s.editingPeriodIndex, "endDate", dateStr);
    }

    s.setShowDatePicker(false);
  };

  /* =======================
     VALIDATION
  ======================= */

  const validateStep1 = () => {
    if (!s.name.trim()) {
      Alert.alert("Errore", "Il nome è obbligatorio");
      return false;
    }
    if (!s.selectedAddress || !s.city || !s.lat || !s.lng) {
      Alert.alert("Errore", "Indirizzo non valido");
      return false;
    }
    return true;
  };

  const validateStep5 = () => {
    if (s.campi.length === 0) {
      Alert.alert("Errore", "Aggiungi almeno un campo");
      return false;
    }
    for (const campo of s.campi) {
      if (!campo.name || !campo.sport) {
        Alert.alert("Errore", "Completa tutti i campi");
        return false;
      }
    }
    return true;
  };

  /* =======================
     CREATE STRUTTURA
  ======================= */

  const handleCreate = async () => {
    try {
      s.setLoading(true);

      const strutturaPayload = {
        name: s.name,
        description: s.description,
        location: {
          address: s.selectedAddress,
          city: s.city,
          lat: parseFloat(s.lat),
          lng: parseFloat(s.lng),
          coordinates: [parseFloat(s.lng), parseFloat(s.lat)],
        },
        amenities: s.amenities,
        openingHours: s.openingHours,
      };

      const { struttura } = await createStruttura(strutturaPayload, token);

      if (s.selectedImages.length > 0) {
        console.log(`📤 Caricamento di ${s.selectedImages.length} immagini...`);
        await uploadImages(
          struttura._id, 
          s.selectedImages, 
          token,
          (current, total) => {
            console.log(`📸 Upload immagine ${current} di ${total}`);
          }
        );
        console.log("✅ Tutte le immagini caricate con successo");
      }

      if (s.campi.length > 0) {
        const campiPayload = s.campi.map((c: Campo) => ({
          name: c.name,
          sport: c.sport,
          surface: c.surface,
          indoor: c.indoor,
          maxPlayers: c.maxPlayers,
          pricePerHour: 
            c.pricingRules.mode === "flat" 
              ? c.pricingRules.flatPrices.oneHour 
              : c.pricingRules.basePrices.oneHour,
          pricingRules: c.pricingRules,
        }));

        console.log("=== DEBUG CAMPI PAYLOAD ===");
        console.log("Campi completi:", JSON.stringify(s.campi, null, 2));
        console.log("Payload da inviare:", JSON.stringify(campiPayload, null, 2));
        console.log("=========================");

        await createCampi(struttura._id, campiPayload, token);
      }

      Alert.alert("Successo", "Struttura creata con successo!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert("Errore", err.message || "Errore creazione struttura");
    } finally {
      s.setLoading(false);
    }
  };

  /* =======================
     NAVIGATION
  ======================= */

  const handleNext = () => {
    if (s.currentStep === 1 && !validateStep1()) return;
    if (s.currentStep === 5 && !validateStep5()) return;

    if (s.currentStep < 5) {
      s.setCurrentStep(s.currentStep + 1);
    } else {
      handleCreate();
    }
  };

  /* =======================
     RENDER STEPS
  ======================= */

  const renderStep1 = () => (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#E3F2FD", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
          <Ionicons name="business" size={20} color="#2196F3" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Info struttura</Text>
          <Text style={{ fontSize: 13, color: "#666" }}>Dati principali della tua struttura</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="create-outline" size={16} color="#2196F3" />
          <Text style={[styles.label, { marginBottom: 0, marginLeft: 6 }]}>Nome *</Text>
        </View>
        <TextInput
          style={styles.input}
          value={s.name}
          onChangeText={s.setName}
          placeholder="Es. Beach Arena Milano"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.section}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="document-text-outline" size={16} color="#2196F3" />
          <Text style={[styles.label, { marginBottom: 0, marginLeft: 6 }]}>Descrizione</Text>
        </View>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={s.description}
          onChangeText={s.setDescription}
          multiline
          placeholder="Descrivi la tua struttura, i servizi offerti..."
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.section}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="location" size={16} color="#2196F3" />
          <Text style={[styles.label, { marginBottom: 0, marginLeft: 6 }]}>Indirizzo *</Text>
        </View>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={s.addressInput}
            onChangeText={handleAddressChange}
            placeholder="Cerca indirizzo..."
            placeholderTextColor="#999"
          />
          {s.loadingSuggestions && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2196F3" />
            </View>
          )}
        </View>

        {s.showSuggestions && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={s.suggestions}
              keyExtractor={(i) => i.place_id}
              scrollEnabled={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={styles.suggestionItem}
                  onPress={() => selectPlace(item)}
                >
                  <Ionicons name="location" size={16} color="#2196F3" style={{ marginRight: 8 }} />
                  <Text style={[styles.suggestionText, { flex: 1 }]}>
                    {item.display_name}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="business-outline" size={16} color="#666" />
          <Text style={[styles.label, { marginBottom: 0, marginLeft: 6, color: "#666" }]}>Città</Text>
        </View>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={s.city}
          editable={false}
          placeholder="Rilevata automaticamente"
          placeholderTextColor="#999"
        />
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.sectionTitle}>Immagini della struttura</Text>
      
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#2196F3" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.infoText}>
            📸 Carica fino a 10 foto
          </Text>
          <Text style={styles.infoSubtext}>
            La prima immagine sarà quella principale
          </Text>
        </View>
      </View>

      <Pressable
        style={[
          styles.addImagesButton,
          s.selectedImages.length >= 10 && styles.addImagesButtonDisabled,
        ]}
        onPress={() =>
          pickImages(s.selectedImages, s.setSelectedImages)
        }
        disabled={s.selectedImages.length >= 10}
      >
        <Ionicons 
          name="cloud-upload-outline" 
          size={24} 
          color={s.selectedImages.length >= 10 ? "#999" : "white"} 
        />
        <Text style={[
          styles.addImagesText,
          s.selectedImages.length >= 10 && styles.addImagesTextDisabled
        ]}>
          {s.selectedImages.length >= 10
            ? "Limite massimo raggiunto"
            : s.selectedImages.length === 0
            ? "Aggiungi Immagini"
            : `Aggiungi altre immagini (${s.selectedImages.length}/10)`}
        </Text>
      </Pressable>

      {s.selectedImages.length === 0 ? (
        <View style={styles.emptyImagesState}>
          <Ionicons name="images-outline" size={64} color="#ccc" />
          <Text style={styles.emptyImagesText}>Nessuna immagine</Text>
          <Text style={styles.emptyImagesSubtext}>
            Le immagini aiutano ad attirare più clienti
          </Text>
        </View>
      ) : (
        <View style={styles.imagesGrid}>
          {s.selectedImages.map((uri, index) => (
            <View key={uri} style={styles.imageCard}>
              <Image source={{ uri }} style={styles.imagePreview} />

              {index === 0 && (
                <View style={styles.mainBadge}>
                  <Ionicons name="star" size={12} color="white" />
                  <Text style={styles.mainBadgeText}>Principale</Text>
                </View>
              )}

              <View style={styles.imageActions}>
                {index > 0 && (
                  <Pressable
                    style={styles.imageActionButton}
                    onPress={() =>
                      moveImageUp(index, s.selectedImages, s.setSelectedImages)
                    }
                  >
                    <Ionicons name="arrow-up" size={18} color="white" />
                  </Pressable>
                )}
                <Pressable
                  style={[styles.imageActionButton, styles.imageActionButtonDanger]}
                  onPress={() =>
                    removeImage(uri, s.selectedImages, s.setSelectedImages)
                  }
                >
                  <Ionicons name="trash-outline" size={18} color="white" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {s.selectedImages.length > 0 && (
        <Text style={styles.imageHint}>
          💡 Usa la freccia verso l'alto per spostare un'immagine in prima posizione
        </Text>
      )}
    </>
  );

  const renderStep3 = () => (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFF3E0", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
          <Ionicons name="time" size={20} color="#FF9800" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Orari di apertura</Text>
          <Text style={{ fontSize: 13, color: "#666" }}>Imposta le fasce orarie per ogni giorno</Text>
        </View>
      </View>
      {DAYS.map(({ key, label }) => (
        <View key={key} style={styles.dayRow}>
          <View style={styles.dayHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View style={{ width: 6, height: 32, borderRadius: 3, backgroundColor: !s.openingHours[key].closed ? "#4CAF50" : "#E0E0E0", marginRight: 12 }} />
              <Text style={styles.dayLabel}>{label}</Text>
            </View>
            <Switch
              value={!s.openingHours[key].closed}
              onValueChange={() => s.toggleDayClosed(key)}
            />
          </View>
          {!s.openingHours[key].closed && (
            <View style={{ paddingLeft: 18, paddingTop: 12 }}>
              {s.openingHours[key].slots.map((slot, index) => (
                <View 
                  key={index} 
                  style={{
                    backgroundColor: "#F8F9FA",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: "#E0E0E0",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <View style={{ 
                      backgroundColor: "#2196F3", 
                      paddingHorizontal: 8, 
                      paddingVertical: 3, 
                      borderRadius: 6 
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "white" }}>
                        Fascia {index + 1}
                      </Text>
                    </View>
                    {s.openingHours[key].slots.length > 1 && (
                      <Pressable 
                        onPress={() => s.removeTimeSlot(key, index)}
                        style={{ 
                          marginLeft: "auto",
                          padding: 4,
                          backgroundColor: "#FFEBEE",
                          borderRadius: 6,
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#F44336" />
                      </Pressable>
                    )}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: "#666", marginBottom: 6, fontWeight: "600" }}>
                        Apertura
                      </Text>
                      <TextInput
                        style={[styles.timeInput, { backgroundColor: "white" }]}
                        value={slot.open}
                        onChangeText={v => s.updateTimeSlot(key, index, "open", v)}
                        placeholder="09:00"
                        placeholderTextColor="#999"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                    <Ionicons 
                      name="arrow-forward" 
                      size={18} 
                      color="#2196F3" 
                      style={{ marginHorizontal: 12 }} 
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: "#666", marginBottom: 6, fontWeight: "600" }}>
                        Chiusura
                      </Text>
                      <TextInput
                        style={[styles.timeInput, { backgroundColor: "white" }]}
                        value={slot.close}
                        onChangeText={v => s.updateTimeSlot(key, index, "close", v)}
                        placeholder="22:00"
                        placeholderTextColor="#999"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                  </View>
                </View>
              ))}
              <Pressable
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 14,
                  marginTop: 4,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: "#2196F3",
                  borderStyle: "dashed",
                  backgroundColor: "#F0F8FF",
                }}
                onPress={() => s.addTimeSlot(key)}
              >
                <Ionicons name="add-circle" size={22} color="#2196F3" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#2196F3" }}>
                  Aggiungi fascia oraria
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
    </>
  );

  const renderStep4 = () => (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#F3E5F5", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
          <Ionicons name="star" size={20} color="#9C27B0" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Servizi disponibili</Text>
          <Text style={{ fontSize: 13, color: "#666" }}>{s.amenities.length} servizi selezionati</Text>
        </View>
      </View>

      {AVAILABLE_AMENITIES.map(({ key, label, icon }) => (
        <View key={key} style={styles.amenityRow}>
          <View style={styles.amenityLeft}>
            <View style={[styles.amenityIcon, s.amenities.includes(key) && styles.amenityIconActive]}>
              <Ionicons name={icon as any} size={18} color={s.amenities.includes(key) ? "#2196F3" : "#666"} />
            </View>
            <Text style={styles.amenityLabel}>{label}</Text>
          </View>
          <Switch value={s.amenities.includes(key)} onValueChange={() => toggleAmenity(key)} />
        </View>
      ))}

      {s.customAmenities.map((customAmenity) => {
        const isActive = s.amenities.includes(customAmenity);
        
        return (
          <View key={customAmenity} style={styles.amenityRow}>
            <View style={styles.amenityLeft}>
              <View style={[styles.amenityIcon, isActive && styles.amenityIconActive]}>
                <Ionicons name="add-circle" size={18} color={isActive ? "#2196F3" : "#666"} />
              </View>
              <Text style={[styles.amenityLabel, !isActive && { color: "#999" }]}>
                {customAmenity}
              </Text>
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>Custom</Text>
              </View>
            </View>
            <View style={styles.amenityActions}>
              <Switch value={isActive} onValueChange={() => toggleAmenity(customAmenity)} />
              <Pressable onPress={() => removeCustomAmenity(customAmenity)} style={styles.deleteButton} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color="#E53935" />
              </Pressable>
            </View>
          </View>
        );
      })}

      <Pressable style={styles.addCustomButton} onPress={() => s.setShowCustomModal(true)}>
        <Ionicons name="add-circle-outline" size={18} color="#2196F3" />
        <Text style={styles.addCustomButtonText}>Aggiungi servizio personalizzato</Text>
      </Pressable>
    </>
  );

  const renderStep5 = () => (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#E8F5E9", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
          <Ionicons name="basketball" size={20} color="#4CAF50" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Campi</Text>
          <Text style={{ fontSize: 13, color: "#666" }}>{s.campi.length} {s.campi.length === 1 ? "campo" : "campi"} configurati</Text>
        </View>
      </View>

      {s.campi.map((campo: Campo, index) => (
        <View key={campo.id} style={styles.campoCard}>
          {/* Nome campo */}
          <View style={styles.section}>
            <Text style={styles.label}>Nome campo</Text>
            <TextInput
              style={styles.input}
              value={campo.name}
              placeholder={`Campo ${index + 1}`}
              onChangeText={(v) => s.updateCampo(campo.id, "name", v)}
            />
          </View>

          {/* Sport */}
          <View style={styles.section}>
            <Text style={styles.label}>Sport</Text>
            <View style={styles.sportRow}>
              <Pressable
                style={[
                  styles.sportButton,
                  campo.sport === "beach_volley" && styles.sportButtonActive,
                ]}
                onPress={() => s.updateCampo(campo.id, "sport", "beach_volley")}
              >
                <Ionicons
                  name="sunny"
                  size={20}
                  color={campo.sport === "beach_volley" ? "#2196F3" : "#666"}
                />
                <Text
                  style={[
                    styles.sportButtonText,
                    campo.sport === "beach_volley" && styles.sportButtonTextActive,
                  ]}
                >
                  Beach Volley
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.sportButton,
                  campo.sport === "volley" && styles.sportButtonActive,
                ]}
                onPress={() => s.updateCampo(campo.id, "sport", "volley")}
              >
                <Ionicons
                  name="basketball"
                  size={20}
                  color={campo.sport === "volley" ? "#2196F3" : "#666"}
                />
                <Text
                  style={[
                    styles.sportButtonText,
                    campo.sport === "volley" && styles.sportButtonTextActive,
                  ]}
                >
                  Volley
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Indoor/Outdoor (solo per volley) */}
          {campo.sport === "volley" && (
            <View style={styles.section}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Campo coperto</Text>
                <Switch
                  value={campo.indoor}
                  onValueChange={(v) => s.updateCampo(campo.id, "indoor", v)}
                />
              </View>
            </View>
          )}

          {/* Superficie */}
          <View style={styles.section}>
            <Text style={styles.label}>Superficie</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={
                campo.surface === "sand"
                  ? "Sabbia"
                  : campo.surface === "cement"
                  ? "Cemento"
                  : campo.surface === "pvc"
                  ? "PVC"
                  : ""
              }
              editable={false}
            />
          </View>

          {/* Max giocatori */}
          <View style={styles.section}>
            <Text style={styles.label}>Numero massimo giocatori</Text>
            <View style={styles.playersRow}>
              {[2, 4, 6, 8, 10, 12].map((num) => (
                <Pressable
                  key={num}
                  style={[
                    styles.playerButton,
                    campo.maxPlayers === num && styles.playerButtonActive,
                  ]}
                  onPress={() => s.updateCampo(campo.id, "maxPlayers", num)}
                >
                  <Text
                    style={[
                      styles.playerButtonText,
                      campo.maxPlayers === num && styles.playerButtonTextActive,
                    ]}
                  >
                    {num}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Pulsante prezzi */}
          <Pressable
            style={styles.pricingButton}
            onPress={() => s.openPricingModal(campo.id)}
          >
            <Text style={styles.pricingButtonText}>Configura prezzi</Text>
            <Ionicons name="chevron-forward" size={18} color="#2196F3" />
          </Pressable>

          {/* Pulsante elimina */}
          {s.campi.length > 1 && (
            <Pressable
              style={styles.removeCampoButton}
              onPress={() => s.removeCampo(campo.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
              <Text style={styles.removeCampoText}>Rimuovi campo</Text>
            </Pressable>
          )}
        </View>
      ))}

      <Pressable style={styles.addCampoButton} onPress={s.addCampo}>
        <Ionicons name="add-circle" size={18} color="white" />
        <Text style={styles.addCampoText}>Aggiungi campo</Text>
      </Pressable>
    </>
  );

  /* =======================
     MAIN RENDER
  ======================= */

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Crea struttura</Text>
        <Text style={styles.stepIndicator}>
          Step {s.currentStep}/5
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {s.currentStep === 1 && renderStep1()}
        {s.currentStep === 2 && renderStep2()}
        {s.currentStep === 3 && renderStep3()}
        {s.currentStep === 4 && renderStep4()}
        {s.currentStep === 5 && renderStep5()}
      </ScrollView>

      <View style={styles.fixedButtonContainer}>
        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.button, styles.buttonSecondary]}
            onPress={() =>
              s.currentStep === 1
                ? navigation.goBack()
                : s.setCurrentStep(s.currentStep - 1)
            }
          >
            <Text style={styles.buttonSecondaryText}>
              {s.currentStep === 1 ? "Annulla" : "Indietro"}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.button,
              styles.buttonPrimary,
              s.loading && styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={s.loading}
          >
            <Text style={styles.buttonPrimaryText}>
              {s.loading
                ? "Creazione..."
                : s.currentStep === 5
                ? "Crea struttura"
                : "Avanti"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Modal Custom Amenity */}
      <Modal visible={s.showCustomModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => {
            s.setShowCustomModal(false);
            s.setCustomAmenityInput("");
          }} />
          
          <View style={styles.modalContentBottom}>
            <View style={styles.modalHeaderBottom}>
              <Text style={styles.modalTitleBottom}>Nuovo servizio</Text>
              <Pressable onPress={() => {
                s.setShowCustomModal(false);
                s.setCustomAmenityInput("");
              }}>
                <Ionicons name="close" size={26} color="#333" />
              </Pressable>
            </View>

            <TextInput
              style={styles.modalInput}
              value={s.customAmenityInput}
              onChangeText={s.setCustomAmenityInput}
              placeholder="Es: Campo da calcetto, Spazio bimbi..."
              placeholderTextColor="#999"
              autoFocus
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => {
                  s.setShowCustomModal(false);
                  s.setCustomAmenityInput("");
                }}
              >
                <Text style={styles.modalCancelText}>Annulla</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalAddButton,
                  !s.customAmenityInput.trim() && styles.modalAddButtonDisabled,
                ]}
                onPress={addCustomAmenity}
                disabled={!s.customAmenityInput.trim()}
              >
                <Text style={styles.modalAddText}>Aggiungi</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <PricingModal
        visible={s.showPricingModal}
        pricing={s.tempPricing}
        onClose={s.closePricingModal}
        onSave={s.savePricing}
        setPricing={s.setTempPricing}
        showDaysModal={s.showDaysModal}
        setShowDaysModal={s.setShowDaysModal}
        editingSlotIndex={s.editingSlotIndex}
        showDatePicker={s.showDatePicker}
        setShowDatePicker={s.setShowDatePicker}
        selectedMonth={s.selectedMonth}
        setSelectedMonth={s.setSelectedMonth}
        datePickerMode={s.datePickerMode}
        editingDateIndex={s.editingDateIndex}
        editingPeriodIndex={s.editingPeriodIndex}
        updateTempPricingFlat={updateTempPricingFlat}
        updateTempPricingBase={updateTempPricingBase}
        toggleTempTimeSlot={toggleTempTimeSlot}
        addTempTimeSlot={addTempTimeSlot}
        updateTempTimeSlot={updateTempTimeSlot}
        removeTempTimeSlot={removeTempTimeSlot}
        openDaysModal={openDaysModal}
        toggleDayInSlot={toggleDayInSlot}
        toggleTempDateOverrides={toggleTempDateOverrides}
        addTempDateOverride={addTempDateOverride}
        updateTempDateOverride={updateTempDateOverride}
        removeTempDateOverride={removeTempDateOverride}
        openDatePicker={openDatePicker}
        toggleTempPeriodOverrides={toggleTempPeriodOverrides}
        addTempPeriodOverride={addTempPeriodOverride}
        updateTempPeriodOverride={updateTempPeriodOverride}
        removeTempPeriodOverride={removeTempPeriodOverride}
        openPeriodDatePicker={openPeriodDatePicker}
        handleDateSelect={handleDateSelect}
      />
    </SafeAreaView>
  );
}