import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

const API_URL = "http://192.168.1.112:3000";

/* =========================
   CARD PRENOTAZIONE
========================= */
function BookingCard({ item }: { item: any }) {
  const cancelled = item.status === "cancelled";

  const strutturaName =
    item.campo?.struttura?.name ?? "Struttura sconosciuta";

  const campoName =
    item.campo?.name ?? "Campo";

  const playerName =
    item.user?.name ?? "Utente";

  return (
    <View style={styles.card}>
      {/* BADGE */}
      <View
        style={[
          styles.badge,
          cancelled ? styles.badgeCancelled : styles.badgeConfirmed,
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            { color: cancelled ? "#E54848" : "#1E9E5A" },
          ]}
        >
          {cancelled ? "ANNULLATA" : "CONFERMATA"}
        </Text>
      </View>

      {/* DATA */}
      <Text style={styles.date}>
        {item.date} · {item.startTime} - {item.endTime}
      </Text>

      {/* STRUTTURA / CAMPO */}
      <Text style={styles.struttura}>{strutturaName}</Text>
      <Text style={styles.campo}>🏟️ {campoName}</Text>

      {/* PLAYER */}
      <Text style={styles.player}>👤 {playerName}</Text>

      {/* PREZZO */}
      <Text style={styles.price}>€ {item.price}</Text>
    </View>
  );
}

/* =========================
   SCREEN
========================= */
export default function OwnerBookingsScreen() {
  const { token } = useContext(AuthContext);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/bookings/owner`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setBookings(data);
        setLoading(false);
      })
      .catch(err => {
        console.log("❌ Errore fetch owner bookings", err);
        setLoading(false);
      });
  }, [token]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Prenotazioni ricevute</Text>

        {loading ? (
          <Text>Caricamento...</Text>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={item => item._id}
            renderItem={({ item }) => <BookingCard item={item} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.empty}>
                Nessuna prenotazione ricevuta
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f6f7f9",
  },

  container: {
    flex: 1,
    padding: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 16,
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
  },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },

  badgeConfirmed: {
    backgroundColor: "#E8F7EE",
  },

  badgeCancelled: {
    backgroundColor: "#FDECEC",
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  date: {
    fontSize: 16,
    fontWeight: "700",
  },

  struttura: {
    marginTop: 6,
    fontWeight: "700",
  },

  campo: {
    marginTop: 2,
    color: "#555",
  },

  player: {
    marginTop: 4,
    color: "#666",
  },

  price: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: "#2b8cee",
  },
});
