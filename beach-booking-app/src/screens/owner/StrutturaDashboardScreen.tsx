import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useContext, useState, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";

const API_URL = "http://192.168.1.112:3000";

interface Struttura {
  _id: string;
  name: string;
  description?: string;
  location: { city: string };
  isActive: boolean;
}

interface Campo {
  _id: string;
  name: string;
  sport: string;
  surface: string;
  pricePerHour: number;
  isActive: boolean;
  indoor: boolean;
}

const SPORT_MAP: { [key: string]: string } = {
  beach_volley: "Beach Volley",
  padel: "Padel",
  tennis: "Tennis",
};

export default function StrutturaDashboardScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { token } = useContext(AuthContext);
  const { strutturaId } = route.params;

  const [loading, setLoading] = useState(true);
  const [struttura, setStruttura] = useState<Struttura | null>(null);
  const [campi, setCampi] = useState<Campo[]>([]);

  const loadData = useCallback(async () => {
    if (!token) {
      console.log("❌ Nessun token disponibile");
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Inizio caricamento dati per struttura:", strutturaId);

      // Carica struttura
      const strutturaUrl = `${API_URL}/strutture/${strutturaId}`;
      console.log("📞 Chiamata API struttura:", strutturaUrl);
      const strutturaRes = await fetch(strutturaUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("📡 Struttura response status:", strutturaRes.status);
      const strutturaData = await strutturaRes.json();
      console.log("✅ Struttura caricata:", strutturaData.name);
      setStruttura(strutturaData);

      // Carica TUTTI i campi (anche non attivi) per l'owner
      const campiUrl = `${API_URL}/campi/owner/struttura/${strutturaId}`;
      console.log("📞 Chiamata API campi:", campiUrl);
      
      const campiRes = await fetch(campiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("📡 Campi response status:", campiRes.status);
      const campiData = await campiRes.json();
      console.log("📋 Campi ricevuti dal server:");
      console.log("   - Numero totale:", campiData.length);
      console.log("   - Dettaglio:", JSON.stringify(campiData.map((c: any) => ({ 
        nome: c.name, 
        attivo: c.isActive 
      })), null, 2));
      
      setCampi(campiData);
      console.log("✅ State campi aggiornato, lunghezza:", campiData.length);
    } catch (error) {
      console.error("❌ Errore caricamento dati:", error);
    } finally {
      setLoading(false);
      console.log("✅ Caricamento completato");
    }
  }, [token, strutturaId]);

  useFocusEffect(
    useCallback(() => {
      console.log("👁️ Dashboard in focus");
      let isActive = true;

      if (isActive) {
        loadData();
      }

      return () => {
        isActive = false;
        console.log("👁️ Dashboard out of focus");
      };
    }, [loadData])
  );

  const handleDeleteStruttura = async () => {
    Alert.alert(
      "⚠️ Elimina struttura",
      `Sei sicuro di voler eliminare "${struttura?.name}"?\n\n` +
      `Verranno eliminati anche tutti i ${campi.length} campi associati.\n\n` +
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
              console.log("🗑️ Eliminazione struttura:", strutturaId);
              const response = await fetch(`${API_URL}/strutture/${strutturaId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              if (response.ok) {
                console.log("✅ Struttura eliminata con successo");
                Alert.alert("✅ Successo", "Struttura e campi eliminati con successo", [
                  {
                    text: "OK",
                    onPress: () => {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: "OwnerTabs" }],
                      });
                    },
                  },
                ]);
              } else {
                const error = await response.json();
                console.error("❌ Errore eliminazione:", error);
                Alert.alert("Errore", error.message || "Impossibile eliminare la struttura");
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

  console.log("🎨 Rendering dashboard - campi.length:", campi.length);

  if (loading) {
    console.log("⏳ Mostrando loading...");
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

  if (!struttura) {
    console.log("❌ Nessuna struttura trovata");
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>Struttura non trovata</Text>
      </SafeAreaView>
    );
  }

  const campiAttivi = campi.filter((c) => c.isActive);
  const campiNonAttivi = campi.filter((c) => !c.isActive);
  console.log("📊 Campi attivi:", campiAttivi.length, "- Non attivi:", campiNonAttivi.length);
  
  const prezzoMedio =
    campi.length > 0
      ? campi.reduce((sum, c) => sum + c.pricePerHour, 0) / campi.length
      : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Pressable onPress={loadData}>
            <Text style={styles.back}>🔄</Text>
          </Pressable>
        </View>

        <Text style={styles.strutturaNome}>{struttura.name}</Text>
        <Text style={styles.subtitle}>
          📍 {struttura.location.city} •{" "}
          {struttura.isActive ? (
            <Text style={styles.green}>Attiva</Text>
          ) : (
            <Text style={styles.red}>Non attiva</Text>
          )}
        </Text>

        {/* KPI */}
        <View style={styles.row}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>CAMPI TOTALI</Text>
            <Text style={styles.kpiValue}>{campi.length}</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>CAMPI ATTIVI</Text>
            <Text style={styles.kpiValue}>{campiAttivi.length}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PREZZO MEDIO</Text>
            <Text style={styles.kpiValue}>€{prezzoMedio.toFixed(0)}/h</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PRENOTAZIONI</Text>
            <Text style={styles.kpiValue}>0</Text>
            <Text style={styles.kpiSubtext}>Coming soon</Text>
          </View>
        </View>

        {/* STATO CAMPI */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>I tuoi campi</Text>
          {campi.length > 0 && (
            <Pressable
              style={styles.addButtonSmall}
              onPress={() =>
                navigation.navigate("AggiungiCampo", { strutturaId })
              }
            >
              <Text style={styles.addButtonTextSmall}>+ Aggiungi</Text>
            </Pressable>
          )}
        </View>

        {campi.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nessun campo disponibile</Text>
            <Pressable
              style={styles.addButton}
              onPress={() =>
                navigation.navigate("AggiungiCampo", { strutturaId })
              }
            >
              <Text style={styles.addButtonText}>+ Aggiungi campo</Text>
            </Pressable>
          </View>
        ) : (
          campi.map((campo) => {
            console.log("🎨 Rendering campo:", campo.name, "- attivo:", campo.isActive);
            return (
              <View key={campo._id} style={styles.campoCard}>
                <View style={styles.campoHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bold}>{campo.name}</Text>
                    <Text style={styles.gray}>
                      {SPORT_MAP[campo.sport] || campo.sport}
                      {campo.indoor ? " • Coperto" : " • All'aperto"}
                    </Text>
                  </View>
                  {campo.isActive ? (
                    <Text style={styles.green}>● Attivo</Text>
                  ) : (
                    <Text style={styles.red}>● Non attivo</Text>
                  )}
                </View>
                <View style={styles.campoFooter}>
                  <Text style={styles.priceText}>€{campo.pricePerHour}/h</Text>
                  <Pressable
                    onPress={() =>
                      navigation.navigate("DettaglioCampo", { campoId: campo._id })
                    }
                  >
                    <Text style={styles.linkText}>Dettagli →</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

        {/* AZIONI RAPIDE */}
        <Text style={styles.sectionTitle}>Azioni rapide</Text>
        
        <Pressable
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate("ModificaStruttura", { strutturaId })
          }
        >
          <Text style={styles.actionButtonText}>✏️ Modifica struttura</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => console.log("Visualizza prenotazioni")}
        >
          <Text style={styles.actionButtonText}>📅 Prenotazioni (coming soon)</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => console.log("Visualizza statistiche")}
        >
          <Text style={styles.actionButtonText}>📊 Statistiche (coming soon)</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.actionButtonDanger]}
          onPress={handleDeleteStruttura}
        >
          <Text style={[styles.actionButtonText, styles.actionButtonDangerText]}>
            🗑️ Elimina struttura
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7f9" },
  container: { padding: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  back: { fontSize: 20, fontWeight: "800" },
  headerTitle: { fontSize: 18, fontWeight: "800" },

  strutturaNome: { fontSize: 24, fontWeight: "900", marginBottom: 4 },
  subtitle: { color: "#666", marginBottom: 16, fontSize: 14 },

  row: { flexDirection: "row", gap: 12, marginBottom: 16 },

  kpiCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  kpiLabel: { color: "#666", fontWeight: "700", fontSize: 12 },
  kpiValue: { fontSize: 28, fontWeight: "900", marginTop: 6 },
  kpiSubtext: { color: "#999", fontSize: 11, marginTop: 2 },

  sectionTitle: { fontSize: 20, fontWeight: "800", marginBottom: 12 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  addButtonSmall: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  addButtonTextSmall: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },

  campoCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 12,
  },

  campoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  campoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  emptyCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },

  emptyText: {
    color: "#999",
    fontSize: 16,
    marginBottom: 16,
  },

  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },

  addButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  actionButton: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
  },

  actionButtonDanger: {
    borderColor: "#FF3B30",
  },

  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  actionButtonDangerText: {
    color: "#FF3B30",
  },

  bold: { fontWeight: "800", fontSize: 16 },
  gray: { color: "#666", marginTop: 4, fontSize: 14 },
  green: { color: "#1E9E5A", fontWeight: "700", fontSize: 14 },
  red: { color: "#E54848", fontWeight: "700", fontSize: 14 },
  blue: { color: "#2b8cee", fontWeight: "700", fontSize: 14 },

  priceText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#007AFF",
  },

  linkText: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 14,
  },

  errorText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#666",
  },
});