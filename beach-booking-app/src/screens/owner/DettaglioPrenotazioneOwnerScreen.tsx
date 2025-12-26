import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../config/api";

export default function OwnerDettaglioPrenotazioneScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { bookingId } = route.params;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    loadBooking();
  }, []);

  const loadBooking = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/bookings/owner/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("❌ Errore fetch booking:", res.status);
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ Booking caricato:", data);
      setBooking(data);
    } catch (error) {
      console.error("❌ Errore caricamento booking:", error);
      Alert.alert("Errore", "Impossibile caricare i dettagli");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Annulla prenotazione",
      "Sei sicuro di voler annullare questa prenotazione? Il cliente verrà notificato.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sì, annulla",
          style: "destructive",
          onPress: cancelBooking,
        },
      ]
    );
  };

  const cancelBooking = async () => {
    try {
      const res = await fetch(`${API_URL}/bookings/owner/${bookingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      Alert.alert("Successo", "Prenotazione cancellata", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert("Errore", "Impossibile cancellare la prenotazione");
    }
  };

  const openMaps = () => {
    const address = `${booking.campo.struttura.location.address}, ${booking.campo.struttura.location.city}`;
    const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const contactUser = () => {
    Alert.alert(
      "Contatta cliente",
      `Vuoi contattare ${booking.user?.name || "il cliente"}?${
        booking.user?.email ? `\n\nEmail: ${booking.user.email}` : ""
      }`,
      [
        { text: "Annulla", style: "cancel" },
        ...(booking.user?.email
          ? [
              {
                text: "Invia email",
                onPress: () => {
                  Linking.openURL(`mailto:${booking.user.email}`);
                },
              },
            ]
          : []),
      ]
    );
  };

  const goToInserisciRisultato = () => {
    navigation.navigate("InserisciRisultato", { bookingId });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) return null;

  const isCancelled = booking.status === "cancelled";
  const bookingDate = new Date(booking.date + "T00:00:00");
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const isUpcoming = bookingDate >= today;
  const isPast = bookingDate < today;
  const canInsertResult = !isCancelled && isPast && !booking.match;

  const getSportIcon = () => {
    switch (booking.campo?.sport) {
      case "beach_volley":
        return "fitness";
      case "padel":
        return "tennisball";
      case "tennis":
        return "tennisball";
      default:
        return "football";
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* IMMAGINE HEADER */}
        <View style={styles.imageContainer}>
          {booking.campo?.struttura?.images?.length > 0 ? (
            <Image
              source={{ uri: booking.campo.struttura.images[0] }}
              style={styles.headerImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="basketball" size={64} color="#ccc" />
            </View>
          )}
          <View style={styles.imageOverlay} />

          {/* Back button */}
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>

          {/* Status badge */}
          <View
            style={[
              styles.statusBadge,
              isCancelled
                ? styles.statusCancelled
                : isPast
                ? styles.statusPast
                : styles.statusConfirmed,
            ]}
          >
            <Ionicons
              name={
                isCancelled ? "close-circle" : isPast ? "checkmark-circle" : "checkmark-circle"
              }
              size={16}
              color="white"
            />
            <Text style={styles.statusBadgeText}>
              {isCancelled ? "Cancellata" : isPast ? "Conclusa" : "Confermata"}
            </Text>
          </View>
        </View>

        {/* CONTENUTO PRINCIPALE */}
        <View style={styles.content}>
          {/* STRUTTURA E CAMPO */}
          <View style={styles.mainCard}>
            <View style={styles.strutturaHeader}>
              <View style={styles.sportIconBox}>
                <Ionicons name={getSportIcon() as any} size={28} color="#2196F3" />
              </View>
              <View style={styles.strutturaInfo}>
                <Text style={styles.strutturaName}>
                  {booking.campo?.struttura?.name || "Struttura"}
                </Text>
                <Text style={styles.campoName}>{booking.campo?.name || "Campo"}</Text>
              </View>
            </View>

            <Pressable style={styles.locationCard} onPress={openMaps}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color="#F44336" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationAddress}>
                  {booking.campo?.struttura?.location?.address || "Indirizzo non disponibile"}
                </Text>
                <Text style={styles.locationCity}>
                  {booking.campo?.struttura?.location?.city || ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>
          </View>

          {/* CLIENTE */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={20} color="#2196F3" />
              <Text style={styles.cardTitle}>Cliente</Text>
            </View>

            <View style={styles.clientCard}>
              <View style={styles.clientAvatar}>
                <Ionicons name="person" size={28} color="#2196F3" />
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{booking.user?.name || "Utente"}</Text>
                {booking.user?.email && (
                  <Text style={styles.clientEmail}>{booking.user.email}</Text>
                )}
              </View>
              {booking.user?.email && (
                <Pressable style={styles.contactButton} onPress={contactUser}>
                  <Ionicons name="mail-outline" size={20} color="#2196F3" />
                </Pressable>
              )}
            </View>
          </View>

          {/* DATA E ORARIO */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={20} color="#2196F3" />
              <Text style={styles.cardTitle}>Data e Orario</Text>
            </View>

            <View style={styles.dateTimeContainer}>
              <View style={styles.dateBox}>
                <Text style={styles.dateDay}>
                  {bookingDate.toLocaleDateString("it-IT", { day: "numeric" })}
                </Text>
                <Text style={styles.dateMonth}>
                  {bookingDate.toLocaleDateString("it-IT", { month: "short" }).toUpperCase()}
                </Text>
              </View>

              <View style={styles.dateDetails}>
                <Text style={styles.dateFullText}>
                  {bookingDate.toLocaleDateString("it-IT", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.timeText}>
                    {booking.startTime} - {booking.endTime}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* RISULTATO PARTITA */}
          {booking.match ? (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="trophy-outline" size={20} color="#FFC107" />
                <Text style={styles.cardTitle}>Risultato Partita</Text>
              </View>

              <View style={styles.matchResult}>
                <View
                  style={[
                    styles.resultBadge,
                    booking.match.winner === "A" ? styles.winBadge : styles.loseBadge,
                  ]}
                >
                  <Text style={styles.resultBadgeText}>
                    VINCITORE: TEAM {booking.match.winner}
                  </Text>
                </View>

                <View style={styles.setsContainer}>
                  {booking.match.sets.map((s: any, i: number) => (
                    <View key={i} style={styles.setItem}>
                      <Text style={styles.setLabel}>Set {i + 1}</Text>
                      <View style={styles.setScore}>
                        <Text
                          style={[styles.setScoreText, s.teamA > s.teamB && styles.setScoreWin]}
                        >
                          {s.teamA}
                        </Text>
                        <Text style={styles.setScoreSeparator}>—</Text>
                        <Text
                          style={[styles.setScoreText, s.teamB > s.teamA && styles.setScoreWin]}
                        >
                          {s.teamB}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : canInsertResult ? (
            <Pressable style={styles.insertResultCard} onPress={goToInserisciRisultato}>
              <View style={styles.insertResultIcon}>
                <Ionicons name="clipboard-outline" size={24} color="#2196F3" />
              </View>
              <View style={styles.insertResultContent}>
                <Text style={styles.insertResultTitle}>Inserisci risultato</Text>
                <Text style={styles.insertResultSubtitle}>
                  La partita è conclusa, inserisci il punteggio
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#2196F3" />
            </Pressable>
          ) : isPast && !isCancelled ? (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="trophy-outline" size={20} color="#999" />
                <Text style={styles.cardTitle}>Risultato Partita</Text>
              </View>
              <View style={styles.noResultBox}>
                <Ionicons name="information-circle-outline" size={32} color="#999" />
                <Text style={styles.noResultText}>Nessun risultato disponibile</Text>
              </View>
            </View>
          ) : null}

          {/* INCASSO */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cash-outline" size={20} color="#4CAF50" />
              <Text style={styles.cardTitle}>Incasso</Text>
            </View>

            <View style={styles.incassoBox}>
              <Text style={styles.incassoLabel}>Totale prenotazione</Text>
              <Text style={styles.incassoAmount}>€{booking.price}</Text>
            </View>
          </View>

          {/* AZIONI */}
          {!isCancelled && isUpcoming && (
            <Pressable style={styles.cancelButton} onPress={handleCancel}>
              <Ionicons name="trash-outline" size={20} color="white" />
              <Text style={styles.cancelButtonText}>Annulla Prenotazione</Text>
            </Pressable>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },

  container: {
    flex: 1,
  },

  imageContainer: {
    height: 280,
    position: "relative",
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e9ecef",
    alignItems: "center",
    justifyContent: "center",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statusConfirmed: {
    backgroundColor: "#4CAF50",
  },
  statusCancelled: {
    backgroundColor: "#F44336",
  },
  statusPast: {
    backgroundColor: "#757575",
  },
  statusBadgeText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },

  content: {
    marginTop: -32,
    paddingHorizontal: 16,
  },

  mainCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },

  strutturaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sportIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  strutturaInfo: {
    flex: 1,
  },
  strutturaName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  campoName: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },

  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 12,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  locationCity: {
    fontSize: 13,
    color: "#666",
  },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },

  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 12,
  },
  clientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 13,
    color: "#666",
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },

  dateTimeContainer: {
    flexDirection: "row",
    gap: 16,
  },
  dateBox: {
    width: 64,
    height: 64,
    backgroundColor: "#2196F3",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dateDay: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  dateDetails: {
    flex: 1,
    justifyContent: "center",
  },
  dateFullText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    textTransform: "capitalize",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },

  matchResult: {
    gap: 16,
  },
  resultBadge: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  winBadge: {
    backgroundColor: "#E8F5E9",
  },
  loseBadge: {
    backgroundColor: "#FFEBEE",
  },
  resultBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#333",
  },

  setsContainer: {
    gap: 10,
  },
  setItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 12,
  },
  setLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },
  setScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  setScoreText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#999",
    minWidth: 28,
    textAlign: "center",
  },
  setScoreWin: {
    color: "#4CAF50",
    fontSize: 20,
  },
  setScoreSeparator: {
    fontSize: 16,
    color: "#ccc",
  },

  insertResultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#E3F2FD",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#2196F3",
    borderStyle: "dashed",
  },
  insertResultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  insertResultContent: {
    flex: 1,
  },
  insertResultTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2196F3",
    marginBottom: 2,
  },
  insertResultSubtitle: {
    fontSize: 13,
    color: "#1976D2",
  },

  noResultBox: {
    padding: 24,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  noResultText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    fontWeight: "500",
  },

  incassoBox: {
    backgroundColor: "#E8F5E9",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  incassoLabel: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "600",
    marginBottom: 8,
  },
  incassoAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: "#4CAF50",
  },

  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F44336",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#F44336",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
});