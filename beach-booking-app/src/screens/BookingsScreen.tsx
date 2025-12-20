import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";

const API_URL = "http://192.168.1.112:3000";

/* =========================
   UTILS
========================= */
function formatDateIT(date: string) {
  return new Date(date).toLocaleDateString("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

/* =========================
   BOOKING CARD
========================= */
function BookingCard({
  booking,
  onCancel,
}: {
  booking: any;
  onCancel: (id: string) => void;
}) {
  const isCancelled = booking.status === "cancelled";

  // 🔥 FIX FONDAMENTALE
  const struttura = booking.campo?.struttura;

  if (!struttura) {
    return (
      <View style={[styles.card, styles.cardUnavailable]}>
        <Text style={styles.unavailableText}>
          Struttura non più disponibile
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        {/* STATUS */}
        <View
          style={[
            styles.badge,
            isCancelled ? styles.badgeCancelled : styles.badgeConfirmed,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: isCancelled ? "#E54848" : "#1E9E5A" },
            ]}
          >
            {isCancelled ? "ANNULLATA" : "CONFERMATA"}
          </Text>
        </View>

        {/* DATA */}
        <Text style={styles.date}>{formatDateIT(booking.date)}</Text>

        {/* ORA */}
        <Text style={styles.time}>
          {booking.startTime} - {booking.endTime}
        </Text>

        {/* STRUTTURA */}
        <Text style={styles.location}>
          {struttura.name} – {struttura.location.city}
        </Text>

        {/* AZIONI */}
        {!isCancelled && (
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={() => onCancel(booking._id)}>
              <Text style={{ color: "#E54848", fontWeight: "600" }}>
                Annulla
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* IMMAGINE */}
      <Image
        source={{
          uri: struttura.images?.[0] ?? "https://placehold.co/120x120",
        }}
        style={styles.image}
      />
    </View>
  );
}

/* =========================
   SCREEN
========================= */
export default function BookingsScreen() {
  const { token, loading } = useContext(AuthContext);
  const [bookings, setBookings] = useState<any[]>([]);
  const [tab, setTab] = useState<"active" | "past">("active");

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/bookings/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(setBookings)
      .catch(console.log);
  }, [token]);

  if (loading) return null;

  const now = new Date();

  const filtered = bookings.filter(b => {
    const d = new Date(`${b.date}T${b.startTime}`);
    return tab === "active"
      ? d >= now && b.status !== "cancelled"
      : d < now || b.status === "cancelled";
  });

  const cancelBooking = async (id: string) => {
    await fetch(`${API_URL}/bookings/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setBookings(prev =>
      prev.map(b =>
        b._id === id ? { ...b, status: "cancelled" } : b
      )
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Le mie prenotazioni</Text>

        {/* TABS */}
        <View style={styles.tabs}>
          {["active", "past"].map(t => (
            <Pressable
              key={t}
              onPress={() => setTab(t as any)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text
                style={{
                  fontWeight: "700",
                  color: tab === t ? "#2b8cee" : "#888",
                }}
              >
                {t === "active" ? "Attuali" : "Passate"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* LIST */}
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <BookingCard booking={item} onCancel={cancelBooking} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      </View>
    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 16 },

  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 16,
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#F2F2F2",
    borderRadius: 14,
    marginBottom: 16,
  },

  tab: {
    flex: 1,
    padding: 12,
    alignItems: "center",
  },

  tabActive: {
    backgroundColor: "#dbeefe",
    borderRadius: 14,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#d1dbdb",
  },

  cardUnavailable: {
    borderColor: "#E54848",
    backgroundColor: "#FDECEC",
  },

  unavailableText: {
    color: "#E54848",
    fontWeight: "700",
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },

  badgeConfirmed: { backgroundColor: "#E8F7EE" },
  badgeCancelled: { backgroundColor: "#FDECEC" },

  badgeText: { fontSize: 12, fontWeight: "700" },

  date: { fontSize: 18, fontWeight: "700" },
  time: { marginVertical: 4 },
  location: { color: "#666", marginBottom: 10 },

  actions: { flexDirection: "row" },

  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E54848",
  },

  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginLeft: 10,
  },
});
