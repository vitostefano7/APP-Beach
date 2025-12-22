import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";

const API_URL = "http://192.168.1.112:3000";

interface Campo {
  _id: string;
  name: string;
  sport: string;
  surface: string;
  maxPlayers: number;
  indoor: boolean;
  pricePerHour: number;
  isActive: boolean;
  struttura: string;
}

const SPORT_MAP: { [key: string]: string } = {
  beach_volley: "Beach Volley",
  padel: "Padel",
  tennis: "Tennis",
};

const SURFACE_MAP: { [key: string]: string } = {
  sand: "Sabbia",
  hardcourt: "Cemento",
  grass: "Erba",
};

const DAYS_MAP: { [key: string]: string } = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mer",
  thursday: "Gio",
  friday: "Ven",
  saturday: "Sab",
  sunday: "Dom",
};

export default function DettaglioCampoScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { campoId } = route.params;

  const [loading, setLoading] = useState(true);
  const [campo, setCampo] = useState<Campo | null>(null);

  useEffect(() => {
    loadCampo();
  }, []);

  // Ricarica quando la schermata torna in focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("🔄 DettaglioCampo in focus - ricarico");
      loadCampo();
    });

    return unsubscribe;
  }, [navigation]);

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
      console.log("📋 Campo caricato:", data.name, "- isActive:", data.isActive);
      setCampo(data);
    } catch (error) {
      console.error("❌ Errore caricamento campo:", error);
      Alert.alert("Errore", "Impossibile caricare il campo", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "⚠️ Elimina campo",
      `Sei sicuro di voler eliminare "${campo?.name}"?\n\n` +
      `Questa azione NON può essere annullata.`,
      [
        { 
          text: "Annulla", 
          style: "cancel",
          onPress: () => console.log("❌ Eliminazione annullata")
        },
        {
          text: "Elimina definitivamente",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🗑️ Eliminazione campo:", campoId);
              const response = await fetch(`${API_URL}/campi/${campoId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              console.log("📡 Response status:", response.status);

              if (response.ok) {
                console.log("✅ Campo eliminato con successo");
                Alert.alert("✅ Successo", "Campo eliminato con successo", [
                  { text: "OK", onPress: () => navigation.goBack() },
                ]);
              } else {
                const error = await response.json();
                console.error("❌ Errore eliminazione:", error);
                Alert.alert("Errore", error.message || "Impossibile eliminare il campo");
              }
            } catch (error) {
              console.error("❌ Errore connessione:", error);
              Alert.alert("Errore", "Errore di connessione");
            }
          },
        },
      ]
    );
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

  if (!campo) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>Campo non trovato</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Dettaglio Campo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Campo */}
        <View style={styles.campoHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.campoName}>{campo.name}</Text>
            <Text style={styles.campoSport}>
              {SPORT_MAP[campo.sport]} • {SURFACE_MAP[campo.surface]}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              campo.isActive ? styles.statusActive : styles.statusInactive,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                campo.isActive ? styles.statusTextActive : styles.statusTextInactive,
              ]}
            >
              {campo.isActive ? "Attivo" : "Non attivo"}
            </Text>
          </View>
        </View>

        {/* Dettagli */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Informazioni</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sport</Text>
            <Text style={styles.infoValue}>{SPORT_MAP[campo.sport]}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Superficie</Text>
            <Text style={styles.infoValue}>{SURFACE_MAP[campo.surface]}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo</Text>
            <Text style={styles.infoValue}>
              {campo.indoor ? "Coperto" : "All'aperto"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Max giocatori</Text>
            <Text style={styles.infoValue}>{campo.maxPlayers}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prezzo orario</Text>
            <Text style={styles.priceValue}>€{campo.pricePerHour}</Text>
          </View>
        </View>

        {/* Stato - Solo visualizzazione */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚙️ Stato campo</Text>
          <View style={styles.statusRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusLabel}>Stato attuale</Text>
              <Text style={campo.isActive ? styles.statusActiveText : styles.statusInactiveText}>
                {campo.isActive ? "● Attivo" : "● Non attivo"}
              </Text>
              <Text style={styles.statusDescription}>
                {campo.isActive
                  ? "Il campo è visibile e prenotabile"
                  : "Il campo non è prenotabile"}
              </Text>
            </View>
          </View>
          <Text style={styles.modifyHint}>
            💡 Per modificare lo stato, vai su "Modifica campo"
          </Text>
        </View>

        {/* Orari settimanali */}
        {campo.weeklySchedule && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⏰ Orari settimanali</Text>
            <View style={styles.scheduleGrid}>
              {Object.entries(campo.weeklySchedule).map(([day, schedule]: [string, any]) => (
                <View key={day} style={styles.scheduleItem}>
                  <Text style={styles.scheduleDay}>{DAYS_MAP[day]}</Text>
                  {schedule.enabled ? (
                    <Text style={styles.scheduleTime}>
                      {schedule.open} - {schedule.close}
                    </Text>
                  ) : (
                    <Text style={styles.scheduleClosed}>Chiuso</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Statistiche (placeholder) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Statistiche</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Prenotazioni oggi</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Questa settimana</Text>
            </View>
          </View>
          <Text style={styles.comingSoon}>Coming soon...</Text>
        </View>

        {/* Azioni */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛠️ Azioni</Text>

          <Pressable
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate("ModificaCampo", { campoId: campo._id })
            }
          >
            <Text style={styles.actionButtonText}>✏️ Modifica campo</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={handleDelete}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonDangerText]}>
              🗑️ Elimina campo
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
  errorText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#666",
  },
  campoHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  campoName: { fontSize: 28, fontWeight: "800", marginBottom: 4 },
  campoSport: { fontSize: 16, color: "#666" },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusActive: { backgroundColor: "#E8F5E9" },
  statusInactive: { backgroundColor: "#FFEBEE" },
  statusText: { fontSize: 14, fontWeight: "600" },
  statusTextActive: { color: "#4CAF50" },
  statusTextInactive: { color: "#F44336" },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  infoLabel: { fontSize: 16, color: "#666" },
  infoValue: { fontSize: 16, fontWeight: "600", color: "#333" },
  priceValue: { fontSize: 18, fontWeight: "800", color: "#007AFF" },
  statusRow: {
    paddingVertical: 8,
  },
  statusLabel: { fontSize: 14, color: "#666", marginBottom: 8 },
  statusActiveText: { fontSize: 18, fontWeight: "700", color: "#4CAF50", marginBottom: 8 },
  statusInactiveText: { fontSize: 18, fontWeight: "700", color: "#F44336", marginBottom: 8 },
  statusDescription: { fontSize: 14, color: "#666" },
  modifyHint: { 
    fontSize: 13, 
    color: "#007AFF", 
    marginTop: 12, 
    fontStyle: "italic",
    textAlign: "center" 
  },
  scheduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  scheduleItem: {
    width: "31%",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  scheduleDay: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 11,
    color: "#333",
  },
  scheduleClosed: {
    fontSize: 11,
    color: "#F44336",
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  switchLabel: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  switchDescription: { fontSize: 14, color: "#666" },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: { fontSize: 24, fontWeight: "800", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#666", textAlign: "center" },
  comingSoon: { fontSize: 12, color: "#999", textAlign: "center", fontStyle: "italic" },
  actionButton: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  actionButtonDanger: {
    borderColor: "#FF3B30",
  },
  actionButtonText: { fontSize: 16, fontWeight: "600", color: "#333" },
  actionButtonDangerText: { color: "#FF3B30" },
});