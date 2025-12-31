import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  FlatList,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import API_URL from "../../config/api";

/* =======================
   INTERFACES
======================= */

interface PlaceSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    road?: string;
    postcode?: string;
  };
}

interface OpeningHours {
  [key: string]: { open: string; close: string; closed: boolean };
}

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

interface Campo {
  id: string;
  name: string;
  sport: "beach_volley" | "volley" | "";
  surface: "sand" | "cement" | "pvc" | "";
  maxPlayers: number;
  indoor: boolean;
  pricingRules: PricingRules;
}

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

const isCustomAmenity = (amenity: string) => {
  return !AVAILABLE_AMENITIES.find((a) => a.key === amenity);
};

/* =======================
   COMPONENT
======================= */

export default function CreaStrutturaScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Info base
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  // Autocomplete
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Step 2: Orari
  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    monday: { open: "09:00", close: "22:00", closed: false },
    tuesday: { open: "09:00", close: "22:00", closed: false },
    wednesday: { open: "09:00", close: "22:00", closed: false },
    thursday: { open: "09:00", close: "22:00", closed: false },
    friday: { open: "09:00", close: "22:00", closed: false },
    saturday: { open: "09:00", close: "22:00", closed: false },
    sunday: { open: "09:00", close: "22:00", closed: false },
  });

  // Step 3: Servizi
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAmenityInput, setCustomAmenityInput] = useState("");

  // Step 4: Campi
  const [campi, setCampi] = useState<Campo[]>([]);

  // Pricing Modal
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingCampoId, setEditingCampoId] = useState<string | null>(null);
  const [tempPricing, setTempPricing] = useState<PricingRules | null>(null);

  /* =======================
     AMENITIES HANDLERS
  ======================= */

  const toggleAmenity = (key: string) => {
    setAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenityInput.trim();
    
    if (!trimmed) {
      Alert.alert("Errore", "Inserisci il nome del servizio");
      return;
    }

    if (customAmenities.includes(trimmed)) {
      Alert.alert("Attenzione", "Questo servizio è già presente");
      return;
    }

    setCustomAmenities((prev) => [...prev, trimmed]);
    setAmenities((prev) => [...prev, trimmed]);
    setCustomAmenityInput("");
    setShowCustomModal(false);
  };

  const removeCustomAmenity = (amenity: string) => {
    Alert.alert("Rimuovi servizio", `Vuoi rimuovere definitivamente "${amenity}"?`, [
      { text: "Annulla", style: "cancel" },
      {
        text: "Rimuovi",
        style: "destructive",
        onPress: () => {
          setCustomAmenities((prev) => prev.filter((a) => a !== amenity));
          setAmenities((prev) => prev.filter((a) => a !== amenity));
        },
      },
    ]);
  };

  /* =======================
     OPENING HOURS HANDLERS
  ======================= */

  const toggleDayClosed = (day: string) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day].closed },
    }));
  };

  const updateOpeningHour = (day: string, type: "open" | "close", value: string) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: value },
    }));
  };

  /* =======================
     CAMPI HANDLERS
  ======================= */

  const addCampo = () => {
    const newCampo: Campo = {
      id: Date.now().toString(),
      name: "",
      sport: "",
      surface: "",
      maxPlayers: 4,
      indoor: false,
      pricingRules: {
        mode: "flat",
        flatPrices: { oneHour: 20, oneHourHalf: 28 },
        basePrices: { oneHour: 20, oneHourHalf: 28 },
        timeSlotPricing: { enabled: false, slots: [] },
      },
    };
    setCampi([...campi, newCampo]);
  };

  const updateCampo = (id: string, field: keyof Campo, value: any) => {
    setCampi(prev =>
      prev.map(c => {
        if (c.id !== id) return c;
        
        const newCampo = { ...c, [field]: value };
        
        // Auto-set surface based on sport and indoor
        if (field === "sport") {
          if (value === "beach_volley") {
            // Beach volley è sempre sabbia (indoor o outdoor)
            newCampo.surface = "sand";
          } else if (value === "volley") {
            // Volley: indoor = pvc, outdoor = cement
            newCampo.surface = newCampo.indoor ? "pvc" : "cement";
          }
        } else if (field === "indoor" && c.sport === "volley") {
          // Solo volley cambia superficie con indoor
          newCampo.surface = value ? "pvc" : "cement";
        }
        // Beach volley mantiene sabbia sia indoor che outdoor
        
        return newCampo;
      })
    );
  };

  const removeCampo = (id: string) => {
    Alert.alert("Elimina campo", "Sei sicuro di voler eliminare questo campo?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: () => setCampi(prev => prev.filter(c => c.id !== id)),
      },
    ]);
  };

  /* =======================
     PRICING HANDLERS
  ======================= */

  const openPricingModal = (campoId: string) => {
    const campo = campi.find(c => c.id === campoId);
    if (!campo) return;
    
    setEditingCampoId(campoId);
    setTempPricing({ ...campo.pricingRules });
    setShowPricingModal(true);
  };

  const savePricing = () => {
    if (!editingCampoId || !tempPricing) return;
    
    setCampi(prev =>
      prev.map(c =>
        c.id === editingCampoId ? { ...c, pricingRules: tempPricing } : c
      )
    );
    
    setShowPricingModal(false);
    setEditingCampoId(null);
    setTempPricing(null);
  };

  const updateTempPricingFlat = (type: "oneHour" | "oneHourHalf", value: string) => {
    if (!tempPricing) return;
    const num = parseFloat(value) || 0;
    setTempPricing({
      ...tempPricing,
      flatPrices: { ...tempPricing.flatPrices, [type]: num },
    });
  };

  const updateTempPricingBase = (type: "oneHour" | "oneHourHalf", value: string) => {
    if (!tempPricing) return;
    const num = parseFloat(value) || 0;
    setTempPricing({
      ...tempPricing,
      basePrices: { ...tempPricing.basePrices, [type]: num },
    });
  };

  const toggleTempTimeSlot = () => {
    if (!tempPricing) return;
    setTempPricing({
      ...tempPricing,
      timeSlotPricing: {
        ...tempPricing.timeSlotPricing,
        enabled: !tempPricing.timeSlotPricing.enabled,
      },
    });
  };

  const addTempTimeSlot = () => {
    if (!tempPricing) return;
    setTempPricing({
      ...tempPricing,
      timeSlotPricing: {
        ...tempPricing.timeSlotPricing,
        slots: [
          ...tempPricing.timeSlotPricing.slots,
          {
            start: "09:00",
            end: "13:00",
            label: "Mattina",
            prices: { oneHour: 15, oneHourHalf: 21 },
          },
        ],
      },
    });
  };

  const updateTempTimeSlot = (index: number, field: string, value: any) => {
    if (!tempPricing) return;
    
    const newSlots = [...tempPricing.timeSlotPricing.slots];
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
    
    setTempPricing({
      ...tempPricing,
      timeSlotPricing: {
        ...tempPricing.timeSlotPricing,
        slots: newSlots,
      },
    });
  };

  const removeTempTimeSlot = (index: number) => {
    if (!tempPricing) return;
    setTempPricing({
      ...tempPricing,
      timeSlotPricing: {
        ...tempPricing.timeSlotPricing,
        slots: tempPricing.timeSlotPricing.slots.filter((_, i) => i !== index),
      },
    });
  };

  /* =======================
     ADDRESS AUTOCOMPLETE
  ======================= */

  const searchAddress = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);

    try {
      const response = await fetch(
        `${API_URL}/strutture/search-address?query=${encodeURIComponent(input)}`
      );

      const data = await response.json();

      if (data && data.length > 0) {
        setSuggestions(data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("❌ Errore autocomplete:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddressChange = (text: string) => {
    setAddressInput(text);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchAddress(text);
    }, 800);
  };

  const selectPlace = (place: PlaceSuggestion) => {
    setShowSuggestions(false);
    setAddressInput(place.display_name);
    setSelectedAddress(place.display_name);

    setLat(place.lat);
    setLng(place.lon);

    if (place.address) {
      const cityName =
        place.address.city ||
        place.address.town ||
        place.address.village ||
        place.address.municipality ||
        "";
      setCity(cityName);
    } else {
      const parts = place.display_name.split(",");
      if (parts.length >= 2) {
        setCity(parts[parts.length - 2].trim());
      }
    }
  };

  /* =======================
     VALIDATION
  ======================= */

  const validateStep1 = () => {
    if (!name.trim()) {
      Alert.alert("Errore", "Il nome è obbligatorio");
      return false;
    }
    if (!selectedAddress || !city.trim()) {
      Alert.alert("Errore", "Seleziona un indirizzo valido");
      return false;
    }
    if (!lat || !lng) {
      Alert.alert("Errore", "Coordinate mancanti");
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (campi.length === 0) {
      Alert.alert("Attenzione", "Aggiungi almeno un campo");
      return false;
    }
    for (const campo of campi) {
      if (!campo.name.trim()) {
        Alert.alert("Errore", "Inserisci il nome del campo");
        return false;
      }
      if (!campo.sport) {
        Alert.alert("Errore", "Seleziona lo sport per tutti i campi");
        return false;
      }
    }
    return true;
  };

  /* =======================
     NAVIGATION
  ======================= */

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 4 && !validateStep4()) return;

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCreate();
    }
  };

  /* =======================
     CREATE STRUTTURA
  ======================= */

  const handleCreate = async () => {
    const strutturaData = {
      name,
      description,
      location: {
        address: selectedAddress,
        city,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        coordinates: [parseFloat(lng), parseFloat(lat)],
      },
      amenities,
      openingHours,
    };

    const campiData = campi.map(c => ({
      name: c.name,
      sport: c.sport,
      surface: c.surface,
      maxPlayers: c.maxPlayers,
      indoor: c.indoor,
      pricePerHour: c.pricingRules.flatPrices.oneHour,
      pricingRules: c.pricingRules,
    }));

    setLoading(true);

    try {
      const strutturaResponse = await fetch(`${API_URL}/strutture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(strutturaData),
      });

      if (!strutturaResponse.ok) {
        const error = await strutturaResponse.json();
        Alert.alert("Errore", error.message || "Impossibile creare la struttura");
        return;
      }

      const { struttura } = await strutturaResponse.json();
      console.log("✅ Struttura creata:", struttura._id);

      if (campiData.length > 0) {
        const campiResponse = await fetch(`${API_URL}/campi`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            strutturaId: struttura._id,
            campi: campiData,
          }),
        });

        if (!campiResponse.ok) {
          const error = await campiResponse.json();
          console.warn("⚠️ Errore creazione campi:", error.message);
          Alert.alert(
            "Attenzione",
            "Struttura creata ma errore nella creazione dei campi. Puoi aggiungerli dopo.",
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
          return;
        }

        console.log("✅ Campi creati con successo");
      }

      Alert.alert("Successo", "Struttura e campi creati con successo!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Errore", "Errore di connessione");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     RENDER STEPS
  ======================= */

  const renderStep1 = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.label}>Nome struttura *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Es. Sport Center Milano"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Descrizione</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Descrivi la tua struttura..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Indirizzo *</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={addressInput}
            onChangeText={handleAddressChange}
            placeholder="Inizia a digitare..."
            placeholderTextColor="#999"
          />
          {loadingSuggestions && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          )}
        </View>
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={item => item.place_id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.suggestionItem}
                  onPress={() => selectPlace(item)}
                >
                  <Text style={styles.suggestionText}>📍 {item.display_name}</Text>
                </Pressable>
              )}
              scrollEnabled={false}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Città</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={city}
          editable={false}
          placeholder="Auto"
          placeholderTextColor="#999"
        />
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.sectionTitle}>Orari di apertura</Text>
      {DAYS.map(({ key, label }) => (
        <View key={key} style={styles.dayRow}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayLabel}>{label}</Text>
            <Switch
              value={!openingHours[key].closed}
              onValueChange={() => toggleDayClosed(key)}
            />
          </View>
          {!openingHours[key].closed && (
            <View style={styles.timeRow}>
              <TextInput
                style={styles.timeInput}
                value={openingHours[key].open}
                onChangeText={v => updateOpeningHour(key, "open", v)}
                placeholder="09:00"
                placeholderTextColor="#999"
              />
              <Text style={styles.timeSeparator}>-</Text>
              <TextInput
                style={styles.timeInput}
                value={openingHours[key].close}
                onChangeText={v => updateOpeningHour(key, "close", v)}
                placeholder="22:00"
                placeholderTextColor="#999"
              />
            </View>
          )}
        </View>
      ))}
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.sectionTitle}>Servizi disponibili ({amenities.length})</Text>

      {AVAILABLE_AMENITIES.map(({ key, label, icon }) => (
        <View key={key} style={styles.amenityRow}>
          <View style={styles.amenityLeft}>
            <View style={[styles.amenityIcon, amenities.includes(key) && styles.amenityIconActive]}>
              <Ionicons name={icon as any} size={20} color={amenities.includes(key) ? "#2196F3" : "#666"} />
            </View>
            <Text style={styles.amenityLabel}>{label}</Text>
          </View>
          <Switch value={amenities.includes(key)} onValueChange={() => toggleAmenity(key)} />
        </View>
      ))}

      {customAmenities.map((customAmenity) => {
        const isActive = amenities.includes(customAmenity);
        
        return (
          <View key={customAmenity} style={styles.amenityRow}>
            <View style={styles.amenityLeft}>
              <View style={[styles.amenityIcon, isActive && styles.amenityIconActive]}>
                <Ionicons name="add-circle" size={20} color={isActive ? "#2196F3" : "#666"} />
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
                <Ionicons name="trash-outline" size={20} color="#E53935" />
              </Pressable>
            </View>
          </View>
        );
      })}

      <Pressable style={styles.addCustomButton} onPress={() => setShowCustomModal(true)}>
        <Ionicons name="add-circle-outline" size={20} color="#2196F3" />
        <Text style={styles.addCustomButtonText}>Aggiungi servizio personalizzato</Text>
      </Pressable>
    </>
  );

  const renderStep4 = () => (
    <>
      <Text style={styles.sectionTitle}>Campi sportivi</Text>
      {campi.map((campo, index) => {
        const getSurfaceLabel = () => {
          if (campo.sport === "beach_volley") {
            return campo.indoor ? "Sabbia (Indoor)" : "Sabbia (Outdoor)";
          }
          if (campo.sport === "volley") {
            return campo.indoor ? "PVC (Indoor)" : "Cemento (Outdoor)";
          }
          return "Seleziona prima lo sport";
        };

        const getPricingLabel = () => {
          if (campo.pricingRules.mode === "flat") {
            return `€${campo.pricingRules.flatPrices.oneHour}/h`;
          }
          const hasSlots = campo.pricingRules.timeSlotPricing.enabled && 
                          campo.pricingRules.timeSlotPricing.slots.length > 0;
          return hasSlots ? "Prezzi dinamici" : `€${campo.pricingRules.basePrices.oneHour}/h`;
        };

        return (
          <View key={campo.id} style={styles.campoCard}>
            <View style={styles.campoHeader}>
              <Text style={styles.campoTitle}>Campo {index + 1}</Text>
              <Pressable onPress={() => removeCampo(campo.id)} style={styles.deleteIconButton}>
                <Ionicons name="trash-outline" size={22} color="#E53935" />
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              value={campo.name}
              onChangeText={v => updateCampo(campo.id, "name", v)}
              placeholder="Nome campo"
              placeholderTextColor="#999"
            />

            <View style={styles.pickerRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.miniLabel}>Sport *</Text>
                <View style={styles.pickerContainer}>
                  {[
                    { value: "beach_volley", label: "Beach Volley" },
                    { value: "volley", label: "Volley" },
                  ].map(sport => (
                    <Pressable
                      key={sport.value}
                      style={[
                        styles.chip,
                        campo.sport === sport.value && styles.chipActive,
                      ]}
                      onPress={() => updateCampo(campo.id, "sport", sport.value)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          campo.sport === sport.value && styles.chipTextActive,
                        ]}
                      >
                        {sport.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.miniLabel}>Campo coperto</Text>
              </View>
              <Switch
                value={campo.indoor}
                onValueChange={v => updateCampo(campo.id, "indoor", v)}
              />
            </View>

            {campo.sport && (
              <View style={styles.surfaceDisplay}>
                <Ionicons
                  name={
                    campo.surface === "sand"
                      ? "beach"
                      : campo.surface === "pvc"
                      ? "layers"
                      : "construct"
                  }
                  size={20}
                  color="#4CAF50"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.surfaceDisplayLabel}>Superficie</Text>
                  <Text style={styles.surfaceDisplayText}>{getSurfaceLabel()}</Text>
                </View>
              </View>
            )}

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.miniLabel}>Max giocatori</Text>
                <TextInput
                  style={styles.input}
                  value={campo.maxPlayers.toString()}
                  onChangeText={v => updateCampo(campo.id, "maxPlayers", parseInt(v) || 4)}
                  placeholder="4"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* PRICING BUTTON */}
            <Pressable
              style={styles.pricingButton}
              onPress={() => openPricingModal(campo.id)}
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
          </View>
        );
      })}

      <Pressable style={styles.addCampoButton} onPress={addCampo}>
        <Ionicons name="add-circle" size={20} color="white" />
        <Text style={styles.addCampoText}>Aggiungi campo</Text>
      </Pressable>
    </>
  );

  /* =======================
     PRICING MODAL
  ======================= */

  const renderPricingModal = () => {
    if (!tempPricing) return null;

    return (
      <Modal visible={showPricingModal} animationType="slide">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowPricingModal(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </Pressable>
            <Text style={styles.modalHeaderTitle}>Configura Prezzi</Text>
            <Pressable onPress={savePricing} style={styles.saveModalButton}>
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
                  tempPricing.mode === "flat" && styles.radioOptionActive,
                ]}
                onPress={() => setTempPricing({ ...tempPricing, mode: "flat" })}
              >
                <View style={styles.radioCircle}>
                  {tempPricing.mode === "flat" && <View style={styles.radioCircleInner} />}
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
                  tempPricing.mode === "advanced" && styles.radioOptionActive,
                ]}
                onPress={() => setTempPricing({ ...tempPricing, mode: "advanced" })}
              >
                <View style={styles.radioCircle}>
                  {tempPricing.mode === "advanced" && <View style={styles.radioCircleInner} />}
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
            {tempPricing.mode === "flat" && (
              <View style={styles.modalCard}>
                <Text style={styles.modalCardTitle}>💵 Prezzi Fissi</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>1 ora</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.euroSign}>€</Text>
                    <TextInput
                      style={styles.priceInputField}
                      value={tempPricing.flatPrices.oneHour.toString()}
                      onChangeText={(v) => updateTempPricingFlat("oneHour", v)}
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
                      value={tempPricing.flatPrices.oneHourHalf.toString()}
                      onChangeText={(v) => updateTempPricingFlat("oneHourHalf", v)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* ADVANCED MODE */}
            {tempPricing.mode === "advanced" && (
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
                        value={tempPricing.basePrices.oneHour.toString()}
                        onChangeText={(v) => updateTempPricingBase("oneHour", v)}
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
                        value={tempPricing.basePrices.oneHourHalf.toString()}
                        onChangeText={(v) => updateTempPricingBase("oneHourHalf", v)}
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
                      value={tempPricing.timeSlotPricing.enabled}
                      onValueChange={toggleTempTimeSlot}
                    />
                  </View>

                  {tempPricing.timeSlotPricing.enabled && (
                    <>
                      {tempPricing.timeSlotPricing.slots.map((slot, index) => (
                        <View key={index} style={styles.timeSlotCard}>
                          <View style={styles.timeSlotHeader}>
                            <TextInput
                              style={styles.timeSlotLabelInput}
                              value={slot.label}
                              onChangeText={(v) => updateTempTimeSlot(index, "label", v)}
                              placeholder="Nome fascia"
                            />
                            <Pressable onPress={() => removeTempTimeSlot(index)}>
                              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                            </Pressable>
                          </View>

                          <View style={styles.timeSlotTimeRow}>
                            <View style={styles.timeInputWrapper}>
                              <Text style={styles.timeLabel}>Dalle</Text>
                              <TextInput
                                style={styles.timeInputModal}
                                value={slot.start}
                                onChangeText={(v) => updateTempTimeSlot(index, "start", v)}
                                placeholder="09:00"
                              />
                            </View>

                            <View style={styles.timeInputWrapper}>
                              <Text style={styles.timeLabel}>Alle</Text>
                              <TextInput
                                style={styles.timeInputModal}
                                value={slot.end}
                                onChangeText={(v) => updateTempTimeSlot(index, "end", v)}
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
                                    updateTempTimeSlot(index, "prices.oneHour", v)
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
                                    updateTempTimeSlot(index, "prices.oneHourHalf", v)
                                  }
                                  keyboardType="decimal-pad"
                                />
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}

                      <Pressable style={styles.addButton} onPress={addTempTimeSlot}>
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
  };

  /* =======================
     MAIN RENDER
  ======================= */

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Crea struttura</Text>
        <Text style={styles.stepIndicator}>
          Step {currentStep}/4
        </Text>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        <View style={styles.buttonRow}>
          {currentStep > 1 && (
            <Pressable
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setCurrentStep(currentStep - 1)}
            >
              <Text style={styles.buttonSecondaryText}>Indietro</Text>
            </Pressable>
          )}
          <Pressable
            style={[
              styles.button,
              styles.buttonPrimary,
              loading && styles.buttonDisabled,
              currentStep === 1 && { flex: 1 },
            ]}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={styles.buttonPrimaryText}>
              {loading
                ? "Creazione..."
                : currentStep === 4
                ? "Crea struttura"
                : "Avanti"}
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODALS */}
      {/* Custom Amenity Modal */}
      <Modal visible={showCustomModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => {
            setShowCustomModal(false);
            setCustomAmenityInput("");
          }} />
          
          <View style={styles.modalContentBottom}>
            <View style={styles.modalHeaderBottom}>
              <Text style={styles.modalTitleBottom}>Nuovo servizio</Text>
              <Pressable onPress={() => {
                setShowCustomModal(false);
                setCustomAmenityInput("");
              }}>
                <Ionicons name="close" size={28} color="#333" />
              </Pressable>
            </View>

            <TextInput
              style={styles.modalInput}
              value={customAmenityInput}
              onChangeText={setCustomAmenityInput}
              placeholder="Es: Campo da calcetto, Spazio bimbi..."
              placeholderTextColor="#999"
              autoFocus
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCustomModal(false);
                  setCustomAmenityInput("");
                }}
              >
                <Text style={styles.modalCancelText}>Annulla</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalAddButton,
                  !customAmenityInput.trim() && styles.modalAddButtonDisabled,
                ]}
                onPress={addCustomAmenity}
                disabled={!customAmenityInput.trim()}
              >
                <Text style={styles.modalAddText}>Aggiungi</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Pricing Modal */}
      {renderPricingModal()}
    </SafeAreaView>
  );
}

/* =======================
   STYLES
======================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7f9" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "white",
  },
  title: { fontSize: 22, fontWeight: "800" },
  stepIndicator: { fontSize: 14, color: "#007AFF", fontWeight: "600" },
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  section: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#333" },
  miniLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4, color: "#666" },
  inputWrapper: { position: "relative" },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  inputDisabled: { backgroundColor: "#f5f5f5", color: "#666" },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  row: { flexDirection: "row", marginTop: 12 },
  loadingContainer: { position: "absolute", right: 12, top: 12 },
  suggestionsContainer: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
  },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  suggestionText: { fontSize: 14, color: "#333" },
  dayRow: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayLabel: { fontSize: 16, fontWeight: "600" },
  timeRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  timeInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
    textAlign: "center",
    fontSize: 16,
  },
  timeSeparator: { marginHorizontal: 10, fontSize: 18, fontWeight: "700" },
  
  // AMENITIES
  amenityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  amenityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  amenityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  amenityIconActive: {
    backgroundColor: "#E3F2FD",
  },
  amenityLabel: { fontSize: 16, fontWeight: "600", flex: 1 },
  customBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FF9800",
  },
  amenityActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deleteButton: {
    padding: 4,
  },
  addCustomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2196F3",
    borderStyle: "dashed",
    marginTop: 8,
  },
  addCustomButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2196F3",
  },

  // CAMPI
  campoCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  campoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  campoTitle: { fontSize: 18, fontWeight: "700" },
  deleteIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerRow: { marginTop: 12 },
  pickerContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  chipActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  chipText: { fontSize: 14, color: "#666" },
  chipTextActive: { color: "white", fontWeight: "600" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
  switchDescription: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  surfaceDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  surfaceDisplayLabel: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "600",
    marginBottom: 2,
  },
  surfaceDisplayText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1B5E20",
  },
  pricingButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
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
  addCampoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  addCampoText: { color: "white", fontSize: 16, fontWeight: "700" },
  
  // BUTTONS
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  button: { flex: 1, padding: 16, borderRadius: 12, alignItems: "center" },
  buttonPrimary: { backgroundColor: "#007AFF" },
  buttonSecondary: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonPrimaryText: { color: "white", fontSize: 18, fontWeight: "700" },
  buttonSecondaryText: { color: "#333", fontSize: 18, fontWeight: "600" },

  // CUSTOM AMENITY MODAL (BOTTOM)
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContentBottom: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeaderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitleBottom: {
    fontSize: 20,
    fontWeight: "800",
  },
  modalInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  modalAddButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#2196F3",
    alignItems: "center",
  },
  modalAddButtonDisabled: {
    opacity: 0.5,
  },
  modalAddText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },

  // PRICING MODAL (FULL SCREEN)
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