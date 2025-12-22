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

const DAYS = [
  { key: "monday", label: "Lunedì" },
  { key: "tuesday", label: "Martedì" },
  { key: "wednesday", label: "Mercoledì" },
  { key: "thursday", label: "Giovedì" },
  { key: "friday", label: "Venerdì" },
  { key: "saturday", label: "Sabato" },
  { key: "sunday", label: "Domenica" },
];

export default function ModificaCampoScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { campoId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [sport, setSport] = useState<"beach_volley" | "padel" | "tennis" | "">("");
  const [surface, setSurface] = useState<"sand" | "hardcourt" | "grass" | "">("");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [indoor, setIndoor] = useState(false);
  const [pricePerHour, setPricePerHour] = useState("");
  const [isActive, setIsActive] = useState(true);
  
  // Orari settimanali
  const [weeklySchedule, setWeeklySchedule] = useState({
    monday: { enabled: true, open: "09:00", close: "22:00" },
    tuesday: { enabled: true, open: "09:00", close: "22:00" },
    wednesday: { enabled: true, open: "09:00", close: "22:00" },
    thursday: { enabled: true, open: "09:00", close: "22:00" },
    friday: { enabled: true, open: "09:00", close: "22:00" },
    saturday: { enabled: true, open: "09:00", close: "22:00" },
    sunday: { enabled: true, open: "09:00", close: "22:00" },
  });

  useEffect(() => {
    loadCampo();
  }, []);

  const loadCampo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/campi/${campoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Campo non trovato");
      }

      const data = await response.json();

      setName(data.name || "");
      setSport(data.sport || "");
      setSurface(data.surface || "");
      setMaxPlayers(data.maxPlayers?.toString() || "4");
      setIndoor(data.indoor || false);
      setPricePerHour(data.pricePerHour?.toString() || "");
      setIsActive(data.isActive !== undefined ? data.isActive : true);
      
      // Carica orari settimanali
      if (data.weeklySchedule) {
        setWeeklySchedule(data.weeklySchedule);
      }
    } catch (error) {
      console.error("❌ Errore caricamento campo:", error);
      Alert.alert("Errore", "Impossibile caricare il campo", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDayEnabled = (day: string) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], enabled: !prev[day as keyof typeof prev].enabled },
    }));
  };

  const updateDayTime = (day: string, type: "open" | "close", value: string) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], [type]: value },
    }));
  };

  const handleSave = async () => {
    // Validazione
    if (!name.trim()) {
      Alert.alert("Errore", "Il nome del campo è obbligatorio");
      return;
    }
    if (!sport) {
      Alert.alert("Errore", "Seleziona uno sport");
      return;
    }
    if (!surface) {
      Alert.alert("Errore", "Seleziona una superficie");
      return;
    }
    if (!pricePerHour || parseFloat(pricePerHour) <= 0) {
      Alert.alert("Errore", "Inserisci un prezzo valido");
      return;
    }

    const updateData = {
      name,
      sport,
      surface,
      maxPlayers: parseInt(maxPlayers) || 4,
      indoor,
      pricePerHour: parseFloat(pricePerHour),
      isActive,
      weeklySchedule,
    };

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/campi/${campoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Campo aggiornato:", result);
        console.log("📊 isActive dopo update:", updateData.isActive);
        Alert.alert("Successo", "Campo aggiornato con successo!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        const error = await response.json();
        Alert.alert("Errore", error.message || "Impossibile aggiornare il campo");
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
        <Text style={styles.headerTitle}>Modifica Campo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

        <View style={styles.section}>
          <Text style={styles.label}>Sport *</Text>
          <View style={styles.chipContainer}>
            {[
              { value: "beach_volley", label: "Beach Volley" },
              { value: "padel", label: "Padel" },
              { value: "tennis", label: "Tennis" },
            ].map((item) => (
              <Pressable
                key={item.value}
                style={[
                  styles.chip,
                  sport === item.value && styles.chipActive,
                ]}
                onPress={() => setSport(item.value as any)}
              >
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

        <View style={styles.section}>
          <Text style={styles.label}>Superficie *</Text>
          <View style={styles.chipContainer}>
            {[
              { value: "sand", label: "Sabbia" },
              { value: "hardcourt", label: "Cemento" },
              { value: "grass", label: "Erba" },
            ].map((item) => (
              <Pressable
                key={item.value}
                style={[
                  styles.chip,
                  surface === item.value && styles.chipActive,
                ]}
                onPress={() => setSurface(item.value as any)}
              >
                <Text
                  style={[
                    styles.chipText,
                    surface === item.value && styles.chipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Prezzo/ora (€) *</Text>
            <TextInput
              style={styles.input}
              value={pricePerHour}
              onChangeText={setPricePerHour}
              placeholder="25"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
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
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Campo coperto</Text>
          <Switch value={indoor} onValueChange={setIndoor} />
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Campo attivo</Text>
            <Text style={styles.switchDescription}>
              {isActive
                ? "Il campo è visibile e prenotabile"
                : "Il campo non sarà prenotabile"}
            </Text>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>

        {/* Orari settimanali */}
        <Text style={styles.sectionTitle}>⏰ Orari settimanali</Text>
        
        {DAYS.map(({ key, label }) => (
          <View key={key} style={styles.dayRow}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{label}</Text>
              <Switch
                value={weeklySchedule[key as keyof typeof weeklySchedule].enabled}
                onValueChange={() => toggleDayEnabled(key)}
              />
            </View>
            {weeklySchedule[key as keyof typeof weeklySchedule].enabled && (
              <View style={styles.timeRow}>
                <TextInput
                  style={styles.timeInput}
                  value={weeklySchedule[key as keyof typeof weeklySchedule].open}
                  onChangeText={(v) => updateDayTime(key, "open", v)}
                  placeholder="09:00"
                  placeholderTextColor="#999"
                />
                <Text style={styles.timeSeparator}>-</Text>
                <TextInput
                  style={styles.timeInput}
                  value={weeklySchedule[key as keyof typeof weeklySchedule].close}
                  onChangeText={(v) => updateDayTime(key, "close", v)}
                  placeholder="22:00"
                  placeholderTextColor="#999"
                />
              </View>
            )}
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
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 16,
  },
  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#333" },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  row: { flexDirection: "row" },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  chipActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  chipText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "white",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  switchDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
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
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  timeInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
    textAlign: "center",
    fontSize: 16,
  },
  timeSeparator: {
    marginHorizontal: 10,
    fontSize: 18,
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
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