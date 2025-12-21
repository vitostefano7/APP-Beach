import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";

const API_URL = "http://192.168.1.112:3000";

export default function ProfileScreen() {
  const { token, logout, user } = useContext(AuthContext);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const res = await fetch(`${API_URL}/users/me/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setData(json);
  };

  if (!data) return null;

  const { profile, preferences, payments } = data;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Il mio profilo</Text>
          <Pressable>
            <Text style={styles.save}>Salva</Text>
          </Pressable>
        </View>

        {/* AVATAR */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0)}
            </Text>
          </View>

          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.subtitle}>
            Livello {profile.level} • Membro dal{" "}
            {new Date(user.createdAt).getFullYear()}
          </Text>
        </View>

        {/* STATS */}
        <View style={styles.stats}>
          <StatBox label="PARTITE" value={profile.matchesPlayed} />
          <StatBox label="RATING" value={profile.ratingAverage} star />
        </View>

        {/* DATI PERSONALI */}
        <Section title="DATI PERSONALI">
          <Row label="Nome" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row label="Telefono" value={user.phone ?? "-"} />
        </Section>

        {/* PAGAMENTI */}
        <Section title="PAGAMENTI">
          {payments?.[0] && (
            <Row
              label={`Visa •••• ${payments[0].last4}`}
              value={`Scade ${payments[0].expMonth}/${payments[0].expYear}`}
              arrow
            />
          )}
        </Section>

        {/* PREFERENZE */}
        <View style={styles.preferences}>
          <PrefRow label="Notifiche Push" value={preferences.pushNotifications} />
          <PrefRow label="Modalità Scura" value={preferences.darkMode} />
          <Row
            label="Campo preferito"
            value={profile.favoriteCampo?.name ?? "-"}
            arrow
          />
          <Row label="Privacy e Sicurezza" arrow />
        </View>

        {/* LOGOUT */}
        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Esci dall'account</Text>
        </Pressable>

        <Text style={styles.version}>Versione App 2.4.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const StatBox = ({ label, value, star }: any) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>
      {star ? `⭐ ${value}` : value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

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
      {arrow && <Text>›</Text>}
    </View>
  </View>
);

const PrefRow = ({ label, value }: any) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Switch value={value} />
  </View>
);
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7f9" },

  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: { fontSize: 20, fontWeight: "700" },
  save: { color: "#007aff", fontWeight: "600" },

  avatarSection: { alignItems: "center", marginVertical: 20 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 32, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "700", marginTop: 8 },
  subtitle: { color: "#666", marginTop: 4 },

  stats: { flexDirection: "row", gap: 12, paddingHorizontal: 16 },
  statBox: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { color: "#999", marginTop: 4 },

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

  preferences: {
    backgroundColor: "white",
    margin: 16,
    borderRadius: 12,
  },

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
