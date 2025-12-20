import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function StrutturaDashboardScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { strutturaId } = route.params;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.subtitle}>Struttura: {strutturaId}</Text>

        {/* KPI */}
        <View style={styles.row}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>OGGI</Text>
            <Text style={styles.kpiValue}>€450</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>SETTIMANA</Text>
            <Text style={styles.kpiValue}>€2.150</Text>
          </View>
        </View>

        {/* STATO CAMPI */}
        <Text style={styles.sectionTitle}>Stato Campi</Text>
        <View style={styles.row}>
          <View style={styles.smallCard}>
            <Text style={styles.bold}>Campo A</Text>
            <Text style={styles.green}>● Occupato</Text>
          </View>
          <View style={styles.smallCard}>
            <Text style={styles.bold}>Campo B</Text>
            <Text style={styles.blue}>● Libero</Text>
          </View>
        </View>

        {/* PROSSIME PRENOTAZIONI */}
        <Text style={styles.sectionTitle}>Prossime Prenotazioni</Text>
        <View style={styles.bookingCard}>
          <Text style={styles.bold}>Oggi 19:30</Text>
          <Text style={styles.gray}>Giulia Verdi · Campo B</Text>
        </View>
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

  subtitle: { color: "#666", marginBottom: 16 },

  row: { flexDirection: "row", gap: 12, marginBottom: 16 },

  kpiCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  kpiLabel: { color: "#666", fontWeight: "700" },
  kpiValue: { fontSize: 24, fontWeight: "900", marginTop: 6 },

  sectionTitle: { fontSize: 20, fontWeight: "800", marginBottom: 10 },

  smallCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },

  bookingCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },

  bold: { fontWeight: "800" },
  gray: { color: "#666", marginTop: 4 },
  green: { color: "#1E9E5A", marginTop: 8, fontWeight: "700" },
  blue: { color: "#2b8cee", marginTop: 8, fontWeight: "700" },
});
