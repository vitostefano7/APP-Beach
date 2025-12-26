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
import { AuthContext } from "../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../config/api";

export default function DettaglioPrenotazioneScreen() {
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
      const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setBooking(data);
    } catch {
      Alert.alert("Errore", "Impossibile caricare i dettagli");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Annulla prenotazione",
      "Sei sicuro di voler annullare questa prenotazione?",
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
      const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* IMMAGINE HEADER CON OVERLAY */}
        <View style={styles.imageContainer}>
          {booking.campo.struttura.images?.length > 0 ? (
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
          <Pressable 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>

          {/* Status badge */}
          <View style={[
            styles.statusBadge,
            isCancelled ? styles.statusCancelled : styles.statusConfirmed
          ]}>
            <Ionicons
              name={isCancelled ? "close-circle" : "checkmark-circle"}
              size={16}
              color="white"
            />
            <Text style={styles.statusBadgeText}>
              {isCancelled ? "Cancellata" : "Confermata"}
            </Text>
          </View>
        </View>

        {/* CONTENUTO PRINCIPALE */}
        <View style={styles.content}>
          {/* STRUTTURA */}
          <View style={styles.mainCard}>
            <Text style={styles.strutturaName}>
              {booking.campo.struttura.name}
            </Text>
            
            <View style={styles.campoRow}>
              <View style={styles.sportIcon}>
                <Ionicons 
                  name={
                    booking.campo.sport === "calcio" ? "football" :
                    booking.campo.sport === "tennis" ? "tennisball" :
                    booking.campo.sport === "basket" ? "basketball" :
                    "fitness"
                  } 
                  size={20} 
                  color="#2196F3" 
                />
              </View>
              <View style={styles.campoInfo}>
                <Text style={styles.campoName}>{booking.campo.name}</Text>
                <Text style={styles.sportText}>{booking.campo.sport}</Text>
              </View>
              <View style={styles.priceTag}>
                <Text style={styles.priceAmount}>€{booking.price}</Text>
              </View>
            </View>

            <Pressable style={styles.locationCard} onPress={openMaps}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color="#F44336" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationAddress}>
                  {booking.campo.struttura.location.address}
                </Text>
                <Text style={styles.locationCity}>
                  {booking.campo.struttura.location.city}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>
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
                <View style={[
                  styles.resultBadge,
                  booking.match.winner === "A" ? styles.winBadge : styles.loseBadge
                ]}>
                  <Text style={styles.resultBadgeText}>
                    {booking.match.winner === "A" ? "VITTORIA" : "SCONFITTA"}
                  </Text>
                </View>

                <View style={styles.setsContainer}>
                  {booking.match.sets.map((s: any, i: number) => (
                    <View key={i} style={styles.setItem}>
                      <Text style={styles.setLabel}>Set {i + 1}</Text>
                      <View style={styles.setScore}>
                        <Text style={[
                          styles.setScoreText,
                          s.teamA > s.teamB && styles.setScoreWin
                        ]}>
                          {s.teamA}
                        </Text>
                        <Text style={styles.setScoreSeparator}>—</Text>
                        <Text style={[
                          styles.setScoreText,
                          s.teamB > s.teamA && styles.setScoreWin
                        ]}>
                          {s.teamB}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : canInsertResult ? (
            <Pressable 
              style={styles.insertResultCard}
              onPress={goToInserisciRisultato}
            >
              <View style={styles.insertResultIcon}>
                <Ionicons name="clipboard-outline" size={24} color="#2196F3" />
              </View>
              <View style={styles.insertResultContent}>
                <Text style={styles.insertResultTitle}>
                  Inserisci risultato
                </Text>
                <Text style={styles.insertResultSubtitle}>
                  La partita è conclusa, inserisci il punteggio
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#2196F3" />
            </Pressable>
          ) : null}

          {/* AZIONI */}
          {!isCancelled && isUpcoming && (
            <Pressable 
              style={styles.cancelButton} 
              onPress={handleCancel}
            >
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
    backgroundColor: "#f8f9fa" 
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
    flex: 1 
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
  },
  strutturaName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 16,
  },

  campoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sportIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  campoInfo: {
    flex: 1,
  },
  campoName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  sportText: {
    fontSize: 13,
    color: "#666",
    textTransform: "capitalize",
  },
  priceTag: {
    backgroundColor: "#E8F5E9",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4CAF50",
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
    marginTop: 16,
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
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
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
    marginTop: 16,
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

  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F44336",
    marginTop: 16,
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