import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

const API_URL = "http://192.168.1.112:3000";

export default function OwnerProfileScreen() {
  const { token, logout, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOwnerProfile();
  }, []);

  const fetchOwnerProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_URL}/users/me/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 🔴 backend non JSON / errore auth
      if (!res.ok) {
        const text = await res.text();
        console.log("OWNER PROFILE ERROR RESPONSE:", text);
        setError("Errore caricamento profilo");
        return;
      }

      // anche se non lo usiamo, forziamo JSON per coerenza
      await res.json();
    } catch (err) {
      console.log("OWNER PROFILE FETCH ERROR:", err);
      setError("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LOADING / ERROR
  ========================= */
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text>Caricamento profilo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text>{error}</Text>

          <Pressable style={styles.retry} onPress={fetchOwnerProfile}>
            <Text style={styles.retryText}>Riprova</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Profilo Proprietario</Text>
        </View>

        {/* AVATAR */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.subtitle}>{user.email}</Text>
        </View>

        {/* ACCOUNT */}
        <Section title="DATI ACCOUNT">
          <Row label="Nome" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row label="Ruolo" value="Proprietario" />
          <Row
            label="Iscritto dal"
            value={new Date(user.createdAt).getFullYear()}
          />
        </Section>

        {/* GESTIONE */}
        <Section title="GESTIONE">
          <Row label="Le mie strutture" arrow />
          <Row label="Prenotazioni ricevute" arrow />
          <Row label="Pagamenti" arrow />
        </Section>

        {/* LOGOUT */}
        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Esci dall'account</Text>
        </Pressable>

        <Text style={styles.version}>Versione App 2.4.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================
   COMPONENTI
========================= */

const Section = ({ title, children }: any) => (
  <>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </>
);

const Row = ({ label, value, arrow }: any) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.rowRight}>
      {value && <Text style={styles.value}>{value}</Text>}
      {arrow && <Text style={styles.arrow}>›</Text>}
    </View>
  </View>
);

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7f9" },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  retry: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#2b8cee",
    borderRadius: 8,
  },
  retryText: { color: "white", fontWeight: "700" },

  header: { padding: 16 },
  title: { fontSize: 20, fontWeight: "700" },

  avatarSection: { alignItems: "center", marginVertical: 20 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 32, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "700", marginTop: 8 },
  subtitle: { color: "#666", marginTop: 4 },

  sectionTitle: {
    marginTop: 24,
    marginLeft: 16,
    color: "#999",
    fontWeight: "700",
  },
  card: {
    backgroundColor: "white",
    margin: 16,
    borderRadius: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  label: { color: "#333" },
  value: { fontWeight: "600" },
  rowRight: { flexDirection: "row", gap: 8 },
  arrow: { color: "#999" },

  logoutButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fdecea",
    alignItems: "center",
  },
  logoutText: { color: "#e53935", fontWeight: "700" },

  version: {
    textAlign: "center",
    color: "#999",
    marginBottom: 20,
  },
});
