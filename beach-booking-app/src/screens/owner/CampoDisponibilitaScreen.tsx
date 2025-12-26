import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";

import API_URL from "../../config/api";

interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
}

interface Campo {
  _id: string;
  name: string;
  sport: string;
  weeklySchedule: Record<string, DaySchedule>;
}

const DAYS_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DAYS_LABEL: Record<string, string> = {
  monday: "Lunedì",
  tuesday: "Martedì",
  wednesday: "Mercoledì",
  thursday: "Giovedì",
  friday: "Venerdì",
  saturday: "Sabato",
  sunday: "Domenica",
};

export default function CampoDisponibilitaScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { campoId } = route.params;

  const [loading, setLoading] = useState(true);
  const [campo, setCampo] = useState<Campo | null>(null);

  useEffect(() => {
    loadDisponibilita();
  }, []);

  const loadDisponibilita = async () => {
    try {
      console.log("📡 Caricamento campo:", campoId);
      setLoading(true);
      
      const res = await fetch(`${API_URL}/campi/${campoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      console.log("✅ Campo caricato:", data.name);
      console.log("📅 weeklySchedule:", data.weeklySchedule);
      
      setCampo(data);
    } catch (err) {
      console.error("❌ Errore disponibilità:", err);
    } finally {
      setLoading(false);
    }
  };

  // Genera gli slot mezz'ora da open a close
  const generateSlots = (open: string, close: string): string[] => {
    const slots: string[] = [];
    let [h, m] = open.split(":").map(Number);

    while (true) {
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      if (time >= close) break;

      slots.push(time);

      m += 30;
      if (m >= 60) {
        h++;
        m = 0;
      }
    }

    return slots;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {campo?.name || "Disponibilità"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 40 }} />}

      {!loading && !campo && (
        <Text style={styles.empty}>Campo non trovato</Text>
      )}

      {!loading && campo && (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ️ Orari di apertura</Text>
            <Text style={styles.infoText}>
              Gli slot disponibili sono generati automaticamente in base agli orari
              di apertura settimanali del campo.
            </Text>
          </View>

          {DAYS_ORDER.map((day) => {
            const daySchedule = campo.weeklySchedule[day];
            
            if (!daySchedule) {
              console.warn(`⚠️ Nessun schedule per ${day}`);
              return null;
            }

            const slots = daySchedule.enabled
              ? generateSlots(daySchedule.open, daySchedule.close)
              : [];

            return (
              <View key={day} style={styles.dayBlock}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{DAYS_LABEL[day]}</Text>
                  {daySchedule.enabled && (
                    <Text style={styles.dayHours}>
                      {daySchedule.open} - {daySchedule.close}
                    </Text>
                  )}
                </View>

                {!daySchedule.enabled ? (
                  <View style={styles.closedBox}>
                    <Text style={styles.closed}>🔒 Chiuso</Text>
                  </View>
                ) : (
                  <View style={styles.slots}>
                    {slots.length === 0 ? (
                      <Text style={styles.noSlots}>Nessuno slot disponibile</Text>
                    ) : (
                      slots.map((time, i) => (
                        <View key={i} style={styles.slot}>
                          <Text style={styles.slotText}>{time}</Text>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7f9" },
  header: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  back: { fontSize: 20, fontWeight: "800" },
  headerTitle: { fontSize: 18, fontWeight: "800", flex: 1, textAlign: "center" },
  
  container: { padding: 16 },
  
  infoBox: {
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1976D2",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: "#1565C0",
    lineHeight: 18,
  },
  
  dayBlock: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
  },
  dayHours: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4CAF50",
    backgroundColor: "#E8F5E9",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  
  closedBox: {
    padding: 12,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    alignItems: "center",
  },
  closed: {
    color: "#C62828",
    fontWeight: "600",
    fontSize: 14,
  },
  
  slots: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slot: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  slotText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2E7D32",
  },
  
  noSlots: {
    color: "#999",
    fontStyle: "italic",
    fontSize: 13,
  },
  
  empty: {
    marginTop: 40,
    textAlign: "center",
    color: "#999",
    fontStyle: "italic",
    fontSize: 15,
  },
});