import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import API_URL from "../../../config/api";

export default function ConfermaPrenotazioneScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const {
    campoId,
    campoName,
    strutturaName,
    sport,
    date,
    startTime,
    duration: durationNumber = 1, // 1 o 1.5 (ore)
    price,
  } = route.params;

  const [loading, setLoading] = useState(false);

  // Converte il numero in formato API ("1h" o "1.5h")
  const duration = durationNumber === 1.5 ? "1.5h" : "1h";

  // Calcola endTime in base alla durata
  const calculateEndTime = (time: string, durationHours: number) => {
    const [h, m] = time.split(":").map(Number);
    const durationMinutes = durationHours * 60;
    
    let endH = h;
    let endM = m + durationMinutes;
    
    if (endM >= 60) {
      endH += Math.floor(endM / 60);
      endM = endM % 60;
    }
    
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  };

  const endTime = calculateEndTime(startTime, durationNumber);

  // Formatta la data
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      console.log("📝 Creazione prenotazione...");

      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campoId,
          date,
          startTime,
          duration, // "1h" o "1.5h"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Errore nella prenotazione");
      }

      console.log("✅ Prenotazione creata:", data._id);

      Alert.alert(
        "✅ Prenotazione confermata!",
        "La tua prenotazione è stata registrata con successo.",
        [
          {
            text: "Vedi prenotazioni",
            onPress: () => navigation.navigate("LeMiePrenotazioni"),
          },
          {
            text: "OK",
            onPress: () => navigation.navigate("Strutture"),
          },
        ]
      );
    } catch (error: any) {
      console.error("❌ Errore prenotazione:", error);
      Alert.alert("Errore", error.message || "Impossibile completare la prenotazione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>

      <ScrollView style={styles.container}>
        {/* Card riepilogo */}
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
          </View>

          <Text style={styles.title}>Conferma i dettagli</Text>
          <Text style={styles.subtitle}>
            Verifica che le informazioni siano corrette prima di confermare
          </Text>
        </View>

        {/* Dettagli prenotazione */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Struttura e Campo</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="business" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Struttura</Text>
              <Text style={styles.detailValue}>{strutturaName}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="tennisball" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Campo</Text>
              <Text style={styles.detailValue}>{campoName}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="trophy" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Sport</Text>
              <Text style={styles.detailValue}>{sport}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 Data e Orario</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Data</Text>
              <Text style={styles.detailValue}>{formatDate(date)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Orario</Text>
              <Text style={styles.detailValue}>
                {startTime} - {endTime}
              </Text>
              <Text style={styles.detailHint}>
                ({durationNumber === 1 ? "1 ora" : "1 ora e 30 minuti"})
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Pagamento</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Prezzo</Text>
            <Text style={styles.priceValue}>€{price}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Totale da pagare</Text>
            <Text style={styles.totalValue}>€{price}</Text>
          </View>

          <Text style={styles.paymentNote}>
            💳 Il pagamento verrà effettuato direttamente presso la struttura
          </Text>
        </View>

        {/* Note */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            Riceverai una conferma via email. Potrai cancellare la prenotazione
            dalla sezione "Le mie prenotazioni".
          </Text>
        </View>
      </ScrollView>

      {/* Footer con pulsanti */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.buttonSecondaryText}>Annulla</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.buttonPrimaryText}>Conferma Prenotazione</Text>
            </>
          )}
        </Pressable>
      </View>
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#212121" },

  container: { flex: 1, padding: 16 },

  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#212121",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    lineHeight: 20,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 16,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },

  detailContent: { flex: 1 },

  detailLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },

  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },

  detailHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  priceLabel: {
    fontSize: 14,
    color: "#666",
  },

  priceValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },

  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
  },

  totalValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#4CAF50",
  },

  paymentNote: {
    fontSize: 12,
    color: "#666",
    marginTop: 12,
    fontStyle: "italic",
  },

  infoBox: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1565C0",
    lineHeight: 18,
  },

  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 12,
  },

  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },

  buttonSecondary: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#DDD",
  },

  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },

  buttonPrimary: {
    backgroundColor: "#4CAF50",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});