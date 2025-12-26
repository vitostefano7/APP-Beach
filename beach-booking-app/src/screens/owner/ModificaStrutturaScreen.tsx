import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import API_URL from "../../config/api";

// ✅ AMENITIES DISPONIBILI (dinamiche - puoi aggiungerne)
const AVAILABLE_AMENITIES = [
  { key: "toilets", label: "Bagni", icon: "man" },
  { key: "lockerRoom", label: "Spogliatoi", icon: "shirt" },
  { key: "showers", label: "Docce", icon: "water" },
  { key: "parking", label: "Parcheggio", icon: "car" },
  { key: "restaurant", label: "Ristorante", icon: "restaurant" },
  { key: "bar", label: "Bar/Caffè", icon: "cafe" },
  { key: "wifi", label: "WiFi", icon: "wifi" },
  { key: "airConditioning", label: "Aria condizionata", icon: "snow" },
  { key: "lighting", label: "Illuminazione notturna", icon: "bulb" },
  { key: "gym", label: "Palestra", icon: "barbell" },
  { key: "store", label: "Negozio sportivo", icon: "storefront" },
  { key: "firstAid", label: "Pronto soccorso", icon: "medical" },
];

interface OpeningHours {
  [key: string]: { open: string; close: string; closed: boolean };
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

export default function ModificaStrutturaScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { strutturaId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dati struttura
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Orari
  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    monday: { open: "09:00", close: "22:00", closed: false },
    tuesday: { open: "09:00", close: "22:00", closed: false },
    wednesday: { open: "09:00", close: "22:00", closed: false },
    thursday: { open: "09:00", close: "22:00", closed: false },
    friday: { open: "09:00", close: "22:00", closed: false },
    saturday: { open: "09:00", close: "22:00", closed: false },
    sunday: { open: "09:00", close: "22:00", closed: false },
  });

  // ✅ Servizi - Array di stringhe (dinamico)
  const [amenities, setAmenities] = useState<string[]>([]);
  
  // ✅ Custom amenity input
  const [showCustomAmenityInput, setShowCustomAmenityInput] = useState(false);
  const [customAmenityInput, setCustomAmenityInput] = useState("");

  useEffect(() => {
    loadStruttura();
  }, []);

  const loadStruttura = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/strutture/${strutturaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Struttura non trovata");
      }

      const data = await response.json();

      setName(data.name || "");
      setDescription(data.description || "");
      setAddress(data.location?.address || "");
      setCity(data.location?.city || "");
      setIsActive(data.isActive !== false);

      if (data.openingHours && Object.keys(data.openingHours).length > 0) {
        setOpeningHours(data.openingHours);
      }

      // ✅ Converti amenities da oggetto a array
      if (data.amenities) {
        if (Array.isArray(data.amenities)) {
          // Già array
          setAmenities(data.amenities);
        } else {
          // Oggetto { toilets: true, bar: false } → ["toilets"]
          const activeAmenities = Object.entries(data.amenities)
            .filter(([_, value]) => value === true)
            .map(([key]) => key);
          setAmenities(activeAmenities);
        }
      }
    } catch (error) {
      console.error("❌ Errore caricamento struttura:", error);
      Alert.alert("Errore", "Impossibile caricare la struttura", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Toggle amenity dinamico
  const toggleAmenity = (key: string) => {
    setAmenities((prev) =>
      prev.includes(key)
        ? prev.filter((a) => a !== key)
        : [...prev, key]
    );
  };

  // ✅ Aggiungi custom amenity
  const addCustomAmenity = () => {
    const trimmed = customAmenityInput.trim();
    
    if (!trimmed) {
      Alert.alert("Errore", "Inserisci il nome del servizio");
      return;
    }

    if (amenities.includes(trimmed)) {
      Alert.alert("Attenzione", "Questo servizio è già presente");
      return;
    }

    setAmenities((prev) => [...prev, trimmed]);
    setCustomAmenityInput("");
    setShowCustomAmenityInput(false);
  };

  // ✅ Rimuovi custom amenity
  const removeCustomAmenity = (amenity: string) => {
    Alert.alert(
      "Rimuovi servizio",
      `Vuoi rimuovere "${amenity}"?`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Rimuovi",
          style: "destructive",
          onPress: () => setAmenities(prev => prev.filter(a => a !== amenity))
        }
      ]
    );
  };

  const toggleDayClosed = (day: string) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day].closed },
    }));
  };

  const updateOpeningHour = (
    day: string,
    type: "open" | "close",
    value: string
  ) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [type]: value },
    }));
  };

  const handleToggleActive = () => {
    if (isActive) {
      Alert.alert(
        "Disattiva struttura",
        "Disattivando la struttura, non sarà più visibile agli utenti e non potranno essere effettuate nuove prenotazioni. Continuare?",
        [
          { text: "Annulla", style: "cancel" },
          {
            text: "Disattiva",
            style: "destructive",
            onPress: () => setIsActive(false),
          },
        ]
      );
    } else {
      setIsActive(true);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Errore", "Il nome è obbligatorio");
      return;
    }

    const updateData = {
      name,
      description,
      amenities, // ✅ Array di stringhe
      openingHours,
      isActive,
    };

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/strutture/${strutturaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        Alert.alert("Successo", "Struttura aggiornata con successo!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        const error = await response.json();
        Alert.alert(
          "Errore",
          error.message || "Impossibile aggiornare la struttura"
        );
      }
    } catch (error) {
      Alert.alert("Errore", "Errore di connessione");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator
          size="large"
          color="#2196F3"
          style={{ marginTop: 100 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Modifica Struttura</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* STATO STRUTTURA */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusIcon, isActive ? styles.statusIconActive : styles.statusIconInactive]}>
                <Ionicons
                  name={isActive ? "checkmark-circle" : "close-circle"}
                  size={24}
                  color={isActive ? "#4CAF50" : "#E53935"}
                />
              </View>
              <View>
                <Text style={styles.statusTitle}>
                  Struttura {isActive ? "attiva" : "non attiva"}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {isActive
                    ? "Visibile agli utenti"
                    : "Nascosta agli utenti"}
                </Text>
              </View>
            </View>
            <Switch
              value={isActive}
              onValueChange={handleToggleActive}
              trackColor={{ false: "#E0E0E0", true: "#4CAF50" }}
              thumbColor={isActive ? "white" : "#f4f3f4"}
            />
          </View>
          {!isActive && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color="#FF9800" />
              <Text style={styles.warningText}>
                La struttura è nascosta. Gli utenti non possono vederla o prenotare.
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Informazioni base</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Nome struttura *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nome struttura"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Descrizione</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Descrizione..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoText}>
              Indirizzo e posizione non possono essere modificati
            </Text>
            <Text style={styles.infoAddress}>
              {address || "Non disponibile"}, {city}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Orari di apertura</Text>

        {DAYS.map(({ key, label }) => (
          <View key={key} style={styles.dayRow}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{label}</Text>
              <View style={styles.dayToggle}>
                <Text style={styles.dayToggleLabel}>
                  {openingHours[key]?.closed ? "Chiuso" : "Aperto"}
                </Text>
                <Switch
                  value={!openingHours[key]?.closed}
                  onValueChange={() => toggleDayClosed(key)}
                  trackColor={{ false: "#E0E0E0", true: "#2196F3" }}
                />
              </View>
            </View>
            {!openingHours[key]?.closed && (
              <View style={styles.timeRow}>
                <View style={styles.timeInputContainer}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <TextInput
                    style={styles.timeInput}
                    value={openingHours[key]?.open || "09:00"}
                    onChangeText={(v) => updateOpeningHour(key, "open", v)}
                    placeholder="09:00"
                    placeholderTextColor="#999"
                  />
                </View>
                <Text style={styles.timeSeparator}>→</Text>
                <View style={styles.timeInputContainer}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <TextInput
                    style={styles.timeInput}
                    value={openingHours[key]?.close || "22:00"}
                    onChangeText={(v) => updateOpeningHour(key, "close", v)}
                    placeholder="22:00"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            )}
          </View>
        ))}

        <Text style={styles.sectionTitle}>
          Servizi disponibili ({amenities.length})
        </Text>

        {/* ✅ Render dinamico amenities predefinite */}
        {AVAILABLE_AMENITIES.map(({ key, label, icon }) => (
          <View key={key} style={styles.amenityRow}>
            <View style={styles.amenityLeft}>
              <View style={[
                styles.amenityIcon,
                amenities.includes(key) && styles.amenityIconActive
              ]}>
                <Ionicons 
                  name={icon as any} 
                  size={20} 
                  color={amenities.includes(key) ? "#2196F3" : "#666"}
                />
              </View>
              <Text style={styles.amenityLabel}>{label}</Text>
            </View>
            <Switch
              value={amenities.includes(key)}
              onValueChange={() => toggleAmenity(key)}
              trackColor={{ false: "#E0E0E0", true: "#2196F3" }}
            />
          </View>
        ))}

        {/* ✅ Amenities custom (aggiunte dall'owner) */}
        {amenities
          .filter(a => !AVAILABLE_AMENITIES.find(av => av.key === a))
          .map((customAmenity) => (
            <View key={customAmenity} style={styles.amenityRow}>
              <View style={styles.amenityLeft}>
                <View style={[styles.amenityIcon, styles.amenityIconActive]}>
                  <Ionicons name="add-circle" size={20} color="#2196F3" />
                </View>
                <Text style={styles.amenityLabel}>{customAmenity}</Text>
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>Custom</Text>
                </View>
              </View>
              <Pressable onPress={() => removeCustomAmenity(customAmenity)}>
                <Ionicons name="trash-outline" size={20} color="#E53935" />
              </Pressable>
            </View>
          ))}

        {/* ✅ Aggiungi amenity custom */}
        <Pressable
          style={styles.addCustomButton}
          onPress={() => setShowCustomAmenityInput(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#2196F3" />
          <Text style={styles.addCustomButtonText}>
            Aggiungi servizio personalizzato
          </Text>
        </Pressable>

        {/* ✅ Input per custom amenity */}
        {showCustomAmenityInput && (
          <View style={styles.customInputContainer}>
            <TextInput
              style={styles.customInput}
              value={customAmenityInput}
              onChangeText={setCustomAmenityInput}
              placeholder="Es: Campo da calcetto, Spazio bimbi..."
              placeholderTextColor="#999"
              autoFocus
            />
            <View style={styles.customInputActions}>
              <Pressable
                style={styles.customInputCancel}
                onPress={() => {
                  setShowCustomAmenityInput(false);
                  setCustomAmenityInput("");
                }}
              >
                <Text style={styles.customInputCancelText}>Annulla</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.customInputAdd,
                  !customAmenityInput.trim() && styles.customInputAddDisabled
                ]}
                onPress={addCustomAmenity}
                disabled={!customAmenityInput.trim()}
              >
                <Text style={styles.customInputAddText}>Aggiungi</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text style={styles.saveButtonText}>
            {saving ? "Salvataggio..." : "Salva modifiche"}
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f9fa" },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "800",
    color: "#1a1a1a",
  },
  
  container: { 
    flex: 1, 
    padding: 16,
  },

  // STATO STRUTTURA
  statusCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  statusIconActive: {
    backgroundColor: "#E8F5E9",
  },

  statusIconInactive: {
    backgroundColor: "#FFEBEE",
  },

  statusTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  statusSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },

  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#E65100",
    fontWeight: "500",
  },

  // SEZIONI
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 16,
    color: "#1a1a1a",
  },
  
  section: { 
    marginBottom: 16,
  },
  
  label: { 
    fontSize: 14, 
    fontWeight: "700", 
    marginBottom: 8, 
    color: "#1a1a1a",
  },
  
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1a1a1a",
  },
  
  textArea: { 
    minHeight: 100, 
    textAlignVertical: "top",
  },
  
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  
  infoText: {
    fontSize: 13,
    color: "#1976D2",
    fontWeight: "600",
    marginBottom: 4,
  },
  
  infoAddress: {
    fontSize: 13,
    color: "#666",
  },

  // ORARI
  dayRow: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  dayLabel: { 
    fontSize: 16, 
    fontWeight: "700",
    color: "#1a1a1a",
  },

  dayToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  dayToggleLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  
  timeRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginTop: 12,
    gap: 12,
  },

  timeInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  
  timeInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  
  timeSeparator: { 
    fontSize: 18, 
    fontWeight: "700",
    color: "#2196F3",
  },

  // SERVIZI
  amenityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },

  amenityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  
  amenityLabel: { 
    fontSize: 16, 
    fontWeight: "600",
    color: "#1a1a1a",
  },

  customBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },

  customBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FF9800",
  },

  addCustomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#2196F3",
    borderStyle: "dashed",
  },

  addCustomButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2196F3",
  },

  customInputContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2196F3",
  },

  customInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#1a1a1a",
    marginBottom: 12,
  },

  customInputActions: {
    flexDirection: "row",
    gap: 12,
  },

  customInputCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },

  customInputCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },

  customInputAdd: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#2196F3",
    alignItems: "center",
  },

  customInputAddDisabled: {
    opacity: 0.5,
  },

  customInputAddText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },

  // SALVA
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  
  saveButtonDisabled: { 
    opacity: 0.5,
  },
  
  saveButtonText: { 
    color: "white", 
    fontSize: 18, 
    fontWeight: "700",
  },
});