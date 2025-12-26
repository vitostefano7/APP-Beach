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
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import API_URL from "../../config/api";

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
  const [pricePerHour, setPricePerHour] = useState("");

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

  /* =======================
     LABEL SUPERFICIE
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

        {/* PREZZO / GIOCATORI */}
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
  row: {
    flexDirection: "row",
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
  createButton: {
    backgroundColor: "#2196F3",
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
