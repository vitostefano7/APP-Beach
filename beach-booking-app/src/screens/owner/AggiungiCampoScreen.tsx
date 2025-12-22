import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";

const API_URL = "http://192.168.1.112:3000";

export default function AggiungiCampoScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { strutturaId } = route.params;

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [sport, setSport] = useState<"beach_volley" | "padel" | "tennis" | "">("");
  const [surface, setSurface] = useState<"sand" | "hardcourt" | "grass" | "">("");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [indoor, setIndoor] = useState(false);
  const [pricePerHour, setPricePerHour] = useState("");

  const handleCreate = async () => {
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

    const campoData = {
      name,
      sport,
      surface,
      maxPlayers: parseInt(maxPlayers) || 4,
      indoor,
      pricePerHour: parseFloat(pricePerHour),
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Aggiungi Campo</Text>
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

        <Pressable
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? "Aggiunta in corso..." : "Aggiungi campo"}
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
  createButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
});