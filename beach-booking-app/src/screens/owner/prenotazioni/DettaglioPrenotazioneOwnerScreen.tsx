import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../../../config/api";
import { styles } from "../styles/DettaglioPrenotazioneOwnerScreen.styles";
import { getSportIcon } from "../utils/DettaglioPrenotazione.utils";

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

  const openChat = async () => {
    try {
      console.log('💬 Apertura chat con user:', booking.user._id);
      
      // ✅ NUOVO ENDPOINT: /api/conversations/user/:userId
      const res = await fetch(
        `${API_URL}/api/conversations/user/${booking.user._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        console.error('❌ Errore creazione conversazione:', res.status);
        throw new Error();
      }

      const conversation = await res.json();
      console.log('✅ Conversazione ottenuta:', conversation._id);

      // Naviga alla chat con i dati corretti
      navigation.navigate("Chat", {
        conversationId: conversation._id,
        strutturaName: booking.campo.struttura.name,
        userName: booking.user.name,
      });
    } catch (error) {
      console.error("❌ Errore apertura chat:", error);
      Alert.alert("Errore", "Impossibile aprire la chat");
    }
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>

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

        <View style={styles.content}>
          <View style={styles.mainCard}>
            <View style={styles.strutturaHeader}>
              <View style={styles.sportIconBox}>
                <Ionicons
                  name={getSportIcon(booking.campo?.sport) as any}
                  size={28}
                  color="#2196F3"
                />
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
              <Pressable style={styles.contactButton} onPress={openChat}>
                <Ionicons name="chatbubble-outline" size={20} color="#2196F3" />
              </Pressable>
            </View>
          </View>

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