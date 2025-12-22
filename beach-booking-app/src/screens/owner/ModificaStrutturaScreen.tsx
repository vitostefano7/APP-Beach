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

const API_URL = "http://192.168.1.112:3000";

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

  // Servizi
  const [amenities, setAmenities] = useState({
    toilets: false,
    lockerRoom: false,
    showers: false,
    parking: false,
    restaurant: false,
    bar: false,
  });

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

      if (data.openingHours && Object.keys(data.openingHours).length > 0) {
        setOpeningHours(data.openingHours);
      }

      if (data.amenities) {
        setAmenities(data.amenities);
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

  const toggleAmenity = (key: keyof typeof amenities) => {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Errore", "Il nome è obbligatorio");
      return;
    }

    const updateData = {
      name,
      description,
      amenities,
      openingHours,
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
          color="#007AFF"
          style={{ marginTop: 100 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Modifica Struttura</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
          <Text style={styles.infoText}>
            ℹ️ Indirizzo e posizione non possono essere modificati
          </Text>
          <Text style={styles.infoAddress}>
            {address || "Non disponibile"}, {city}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Orari di apertura</Text>

        {DAYS.map(({ key, label }) => (
          <View key={key} style={styles.dayRow}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{label}</Text>
              <Switch
                value={!openingHours[key]?.closed}
                onValueChange={() => toggleDayClosed(key)}
              />
            </View>
            {!openingHours[key]?.closed && (
              <View style={styles.timeRow}>
                <TextInput
                  style={styles.timeInput}
                  value={openingHours[key]?.open || "09:00"}
                  onChangeText={(v) => updateOpeningHour(key, "open", v)}
                  placeholder="09:00"
                  placeholderTextColor="#999"
                />
                <Text style={styles.timeSeparator}>-</Text>
                <TextInput
                  style={styles.timeInput}
                  value={openingHours[key]?.close || "22:00"}
                  onChangeText={(v) => updateOpeningHour(key, "close", v)}
                  placeholder="22:00"
                  placeholderTextColor="#999"
                />
              </View>
            )}
          </View>
        ))}

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

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
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
  safe: { flex: 1, backgroundColor: "#f6f7f9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  back: { fontSize: 20, fontWeight: "800" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  container: { flex: 1, padding: 16 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 16,
  },
  section: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#333" },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  infoBox: {
    backgroundColor: "#E8F4FD",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  infoText: {
    fontSize: 14,
    color: "#007AFF",
    marginBottom: 4,
    fontWeight: "600",
  },
  infoAddress: {
    fontSize: 14,
    color: "#666",
  },
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
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: "white", fontSize: 18, fontWeight: "700" },
});