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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

import API_URL from "../../config/api";

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

interface Campo {
  id: string;
  name: string;
  sport: "beach_volley" | "padel" | "tennis" | "";
  surface: "sand" | "hardcourt" | "grass" | "";
  maxPlayers: number;
  indoor: boolean;
  pricePerHour: string;
}

const DAYS = [
  { key: "monday", label: "Lunedì" },
  { key: "tuesday", label: "Martedì" },
  { key: "wednesday", label: "Mercoledì" },
  { key: "thursday", label: "Giovedì" },
  { key: "friday", label: "Venerdì" },
  { key: "saturday", label: "Sabato" },
  { key: "sunday", label: "Domenica" },
];

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
  const [amenities, setAmenities] = useState({
    toilets: false,
    lockerRoom: false,
    showers: false,
    parking: false,
    restaurant: false,
    bar: false,
  });

  // Step 4: Campi
  const [campi, setCampi] = useState<Campo[]>([]);

  const toggleAmenity = (key: keyof typeof amenities) => {
    setAmenities(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

  const addCampo = () => {
    const newCampo: Campo = {
      id: Date.now().toString(),
      name: "",
      sport: "",
      surface: "",
      maxPlayers: 4,
      indoor: false,
      pricePerHour: "",
    };
    setCampi([...campi, newCampo]);
  };

  const updateCampo = (id: string, field: keyof Campo, value: any) => {
    setCampi(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removeCampo = (id: string) => {
    setCampi(prev => prev.filter(c => c.id !== id));
  };

  // Autocomplete address
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
      if (!campo.name.trim() || !campo.sport || !campo.surface || !campo.pricePerHour) {
        Alert.alert("Errore", "Completa tutti i campi");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 4 && !validateStep4()) return;

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCreate();
    }
  };

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
      pricePerHour: parseFloat(c.pricePerHour),
    }));

    setLoading(true);

    try {
      // Step 1: Crea la struttura
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

      // Step 2: Crea i campi
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
      <Text style={styles.sectionTitle}>Servizi disponibili</Text>
      {Object.entries({
        toilets: "Bagni",
        lockerRoom: "Spogliatoi",
        showers: "Docce",
        parking: "Parcheggio",
        restaurant: "Ristorante",
        bar: "Bar",
      }).map(([key, label]) => (
        <View key={key} style={styles.amenityRow}>
          <Text style={styles.amenityLabel}>{label}</Text>
          <Switch
            value={amenities[key as keyof typeof amenities]}
            onValueChange={() => toggleAmenity(key as keyof typeof amenities)}
          />
        </View>
      ))}
    </>
  );

  const renderStep4 = () => (
    <>
      <Text style={styles.sectionTitle}>Campi sportivi</Text>
      {campi.map((campo, index) => (
        <View key={campo.id} style={styles.campoCard}>
          <View style={styles.campoHeader}>
            <Text style={styles.campoTitle}>Campo {index + 1}</Text>
            <Pressable onPress={() => removeCampo(campo.id)}>
              <Text style={styles.removeButton}>🗑️</Text>
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
              <Text style={styles.miniLabel}>Sport</Text>
              <View style={styles.pickerContainer}>
                {["beach_volley", "padel", "tennis"].map(sport => (
                  <Pressable
                    key={sport}
                    style={[
                      styles.chip,
                      campo.sport === sport && styles.chipActive,
                    ]}
                    onPress={() => updateCampo(campo.id, "sport", sport)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        campo.sport === sport && styles.chipTextActive,
                      ]}
                    >
                      {sport === "beach_volley" ? "Beach Volley" : sport === "padel" ? "Padel" : "Tennis"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.pickerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>Superficie</Text>
              <View style={styles.pickerContainer}>
                {["sand", "hardcourt", "grass"].map(surface => (
                  <Pressable
                    key={surface}
                    style={[
                      styles.chip,
                      campo.surface === surface && styles.chipActive,
                    ]}
                    onPress={() => updateCampo(campo.id, "surface", surface)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        campo.surface === surface && styles.chipTextActive,
                      ]}
                    >
                      {surface === "sand" ? "Sabbia" : surface === "hardcourt" ? "Cemento" : "Erba"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.miniLabel}>Prezzo/ora (€)</Text>
              <TextInput
                style={styles.input}
                value={campo.pricePerHour}
                onChangeText={v => updateCampo(campo.id, "pricePerHour", v)}
                placeholder="25"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
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

          <View style={styles.switchRow}>
            <Text style={styles.miniLabel}>Campo coperto</Text>
            <Switch
              value={campo.indoor}
              onValueChange={v => updateCampo(campo.id, "indoor", v)}
            />
          </View>
        </View>
      ))}

      <Pressable style={styles.addCampoButton} onPress={addCampo}>
        <Text style={styles.addCampoText}>+ Aggiungi campo</Text>
      </Pressable>
    </>
  );

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
    </SafeAreaView>
  );
}

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
  row: { flexDirection: "row" },
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
  amenityLabel: { fontSize: 16, fontWeight: "600" },
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
  removeButton: { fontSize: 20 },
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
  },
  addCampoButton: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  addCampoText: { color: "white", fontSize: 16, fontWeight: "700" },
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
});