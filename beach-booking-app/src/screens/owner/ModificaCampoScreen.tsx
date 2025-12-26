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

/* =======================
   COSTANTI
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

/* =======================
   SCREEN
======================= */

export default function ModificaCampoScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { campoId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [sport, setSport] = useState<"beach_volley" | "volley" | "">("");
  const [surface, setSurface] = useState<"sand" | "cement" | "pvc" | "">("");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [indoor, setIndoor] = useState(false);
  const [pricePerHour, setPricePerHour] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [weeklySchedule, setWeeklySchedule] = useState({
    monday: { enabled: true, open: "09:00", close: "22:00" },
    tuesday: { enabled: true, open: "09:00", close: "22:00" },
    wednesday: { enabled: true, open: "09:00", close: "22:00" },
    thursday: { enabled: true, open: "09:00", close: "22:00" },
    friday: { enabled: true, open: "09:00", close: "22:00" },
    saturday: { enabled: true, open: "09:00", close: "22:00" },
    sunday: { enabled: true, open: "09:00", close: "22:00" },
  });

  /* =======================
     LOAD CAMPO
  ======================= */

  useEffect(() => {
    loadCampo();
  }, []);

  useEffect(() => {
    if (sport === "beach_volley") {
      setSurface("sand");
    } else if (sport === "volley") {
      setSurface(indoor ? "pvc" : "cement");
    }
  }, [sport, indoor]);

  const loadCampo = async () => {
    try {
      const response = await fetch(`${API_URL}/campi/${campoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error();

      const data = await response.json();

      setName(data.name);
      setSport(data.sport);
      setSurface(data.surface);
      setMaxPlayers(data.maxPlayers?.toString() || "4");
      setIndoor(data.indoor || false);
      setPricePerHour(data.pricePerHour?.toString() || "");
      setIsActive(data.isActive ?? true);
      if (data.weeklySchedule) setWeeklySchedule(data.weeklySchedule);
    } catch {
      Alert.alert("Errore", "Impossibile caricare il campo", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     WEEKLY
  ======================= */

  const toggleDayEnabled = (day: string) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        enabled: !prev[day as keyof typeof prev].enabled,
      },
    }));
  };

  const updateDayTime = (
    day: string,
    type: "open" | "close",
    value: string
  ) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], [type]: value },
    }));
  };

  /* =======================
     SAVE
  ======================= */

  const handleSave = async () => {
    if (!name.trim() || !pricePerHour) {
      Alert.alert("Errore", "Compila i campi obbligatori");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/campi/${campoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          sport,
          surface,
          maxPlayers: parseInt(maxPlayers) || 4,
          indoor,
          pricePerHour: parseFloat(pricePerHour),
          isActive,
          weeklySchedule,
        }),
      });

      if (!response.ok) throw new Error();

      Alert.alert("Successo", "Campo aggiornato", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert("Errore", "Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const surfaceLabel =
    sport === "beach_volley"
      ? indoor
        ? "Sabbia (Indoor)"
        : "Sabbia (Outdoor)"
      : indoor
      ? "PVC (Indoor)"
      : "Cemento (Outdoor)";

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Modifica Campo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* NOME */}
        <View style={styles.section}>
          <Text style={styles.label}>Nome campo *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
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
                style={[styles.chip, sport === item.value && styles.chipActive]}
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
        <View style={styles.section}>
          <View style={styles.switchCard}>
            <View style={styles.switchCardLeft}>
              <Ionicons
                name={indoor ? "business" : "sunny"}
                size={24}
                color={indoor ? "#2196F3" : "#FF9800"}
              />
              <View>
                <Text style={styles.switchCardTitle}>
                  {indoor ? "Campo coperto (Indoor)" : "Campo scoperto (Outdoor)"}
                </Text>
                <Text style={styles.switchCardSubtitle}>
                  Superficie: {surfaceLabel}
                </Text>
              </View>
            </View>
            <Switch value={indoor} onValueChange={setIndoor} />
          </View>
        </View>

        {/* SUPERFICIE */}
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
            <Text style={styles.surfaceDisplayText}>{surfaceLabel}</Text>
          </View>
        </View>

        {/* PREZZO / GIOCATORI */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Prezzo/ora (€)</Text>
            <TextInput
              style={styles.input}
              value={pricePerHour}
              onChangeText={setPricePerHour}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Max giocatori</Text>
            <TextInput
              style={styles.input}
              value={maxPlayers}
              onChangeText={setMaxPlayers}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* ATTIVO */}
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

        {/* ORARI */}
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
                />
                <Text style={styles.timeSeparator}>-</Text>
                <TextInput
                  style={styles.timeInput}
                  value={weeklySchedule[key as keyof typeof weeklySchedule].close}
                  onChangeText={(v) => updateDayTime(key, "close", v)}
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

/* =======================
   STYLES
======================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
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
  headerTitle: { fontSize: 18, fontWeight: "800" },
  container: { padding: 16 },
  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  input: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  row: { flexDirection: "row" },
  chipContainer: { flexDirection: "row", gap: 10 },
  chip: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
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
  chipText: { fontSize: 15, fontWeight: "600", color: "#666" },
  chipTextActive: { color: "white" },
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
  switchCardLeft: { flexDirection: "row", gap: 12, alignItems: "center" },
  switchCardTitle: { fontWeight: "700", fontSize: 15 },
  switchCardSubtitle: { fontSize: 13, color: "#666" },
  surfaceDisplay: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  surfaceDisplayText: { fontSize: 16, fontWeight: "700", color: "#2E7D32" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e9ecef",
    marginBottom: 20,
  },
  switchDescription: { fontSize: 13, color: "#666" },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  dayRow: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  dayHeader: { flexDirection: "row", justifyContent: "space-between" },
  dayLabel: { fontSize: 16, fontWeight: "600" },
  timeRow: { flexDirection: "row", marginTop: 10 },
  timeInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
    textAlign: "center",
  },
  timeSeparator: { marginHorizontal: 10, fontSize: 18 },
  saveButton: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: "white", fontSize: 18, fontWeight: "700" },
});
