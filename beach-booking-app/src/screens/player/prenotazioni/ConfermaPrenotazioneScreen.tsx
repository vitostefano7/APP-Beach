import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import API_URL from "../../../config/api";
import { getMaxPlayersRulesForSport, getTeamFormationLabel } from "../../../utils/matchSportRules";

export default function ConfermaPrenotazioneScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const {
    campoId,
    campoName,
    strutturaName,
    sport: rawSport,
    date,
    startTime,
    duration: durationNumber = 1, // 1 o 1.5 (ore)
    price,
    struttura,
  } = route.params;

  // Normalizza lo sport ("beach volley" -> "beach_volley")
  const sport = rawSport.replace(/ /g, "_");

  const [loading, setLoading] = useState(false);
  const [bookingType, setBookingType] = useState<"public" | "private">("public");
  const [paymentMode, setPaymentMode] = useState<"full" | "split">(() => {
    // Per entrambi gli sport, se la struttura permette split, default a split
    return (struttura?.isCostSplittingEnabled === true) ? "split" : "full";
  });
  const [maxPlayers, setMaxPlayers] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Determina le opzioni disponibili per lo sport
  const sportRules = sport === "beach_volley" || sport === "volley" 
    ? getMaxPlayersRulesForSport(sport === "beach_volley" ? "beach volley" : sport as "volley")
    : null;

  // DEBUG
  console.log("🔍 ConfermaPrenotazione DEBUG:");
  console.log("  rawSport:", rawSport);
  console.log("  sport (normalized):", sport);
  console.log("  sportRules:", sportRules);
  console.log("  maxPlayers:", maxPlayers);
  console.log("  struttura:", struttura);
  console.log("  canSplitCosts:", canSplitCosts);

  // Imposta il default al primo caricamento
  useEffect(() => {
    if (maxPlayers === null && sportRules) {
      const defaultValue = sportRules.fixed || sportRules.allowedValues[sportRules.allowedValues.length - 1];
      console.log("⚙️ Setting default maxPlayers:", defaultValue);
      setMaxPlayers(defaultValue);
    }
  }, [sportRules]);

  // Se la struttura non permette lo split dei costi, le partite pubbliche non sono disponibili
  const canSplitCosts = struttura?.isCostSplittingEnabled === true;

  // Se la struttura non permette split, forziamo il tipo "private"
  useEffect(() => {
    if (!canSplitCosts && bookingType === "public") {
      setBookingType("private");
    }
    // se la struttura non permette split, forziamo il pagamento "full"
    if (!canSplitCosts && paymentMode === "split") {
      setPaymentMode("full");
    }
  }, [canSplitCosts]);

  // Forza il pagamento "split" per partite pubbliche
  useEffect(() => {
    if (bookingType === 'public') {
      setPaymentMode('split');
    }
  }, [bookingType]);

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

  // Split/payment helpers
  const isVolley = sport === "volley";
  const isBeachVolley = sport === "beach_volley";
  const splitCount = isVolley ? 10 : (isBeachVolley ? maxPlayers : null);
  const isSplitSelected = paymentMode === "split" && canSplitCosts;
  const numericPrice = Number(price) || 0;
  const unitPrice = isSplitSelected && splitCount ? numericPrice / splitCount : null;

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
          bookingType,
          paymentMode,
          // beach_volley: sempre invia maxPlayers scelto; volley: 10 se split, altrimenti 10 di default
          numberOfPeople:
            sport === "beach_volley"
              ? maxPlayers || undefined
              : sport === "volley"
              ? 10
              : maxPlayers || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Errore nella prenotazione");
      }

      console.log("✅ Prenotazione creata:", data._id);

      setCreatedBookingId(data._id);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("❌ Errore prenotazione:", error);
      Alert.alert("Errore", error.message || "Impossibile completare la prenotazione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Card riepilogo */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <Ionicons name="checkmark-circle" size={36} color="#28a745" />
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryTitle}>Conferma i dettagli</Text>
              <Text style={styles.summarySubtitle}>
                Verifica che tutto sia corretto
              </Text>
            </View>
          </View>
        </View>

        {/* Tipo di prenotazione */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Tipo di Partita</Text>
          
          <View style={styles.bookingTypeContainer}>
            <Pressable
              style={[
                styles.bookingTypeOption,
                bookingType === "public" && styles.bookingTypeOptionSelected,
                !canSplitCosts && { opacity: 0.5 },
              ]}
              onPress={() => canSplitCosts && setBookingType("public")}
              disabled={!canSplitCosts}
            >
              <Ionicons
                name={bookingType === "public" ? "radio-button-on" : "radio-button-off"}
                size={24}
                color={bookingType === "public" ? "#2196F3" : "#999"}
              />
              <View style={styles.bookingTypeContent}>
                <Text style={[
                  styles.bookingTypeTitle,
                  bookingType === "public" && styles.bookingTypeTitleSelected,
                ]}>
                  🌍 Pubblica
                </Text>
                <Text style={styles.bookingTypeDescription}>
                  Altri giocatori possono trovare e unirsi alla tua partita
                </Text>
                {!canSplitCosts && (
                  <Text style={{ color: "#d00", marginTop: 6 }}>
                    La struttura non permette la divisione del prezzo. Le partite pubbliche non sono disponibili.
                  </Text>
                )}
              </View>
            </Pressable>

            <View style={styles.bookingTypeSeparator} />

            <Pressable
              style={[
                styles.bookingTypeOption,
                bookingType === "private" && styles.bookingTypeOptionSelected,
              ]}
              onPress={() => setBookingType("private")}
            >
              <Ionicons
                name={bookingType === "private" ? "radio-button-on" : "radio-button-off"}
                size={24}
                color={bookingType === "private" ? "#2196F3" : "#999"}
              />
              <View style={styles.bookingTypeContent}>
                <Text style={[
                  styles.bookingTypeTitle,
                  bookingType === "private" && styles.bookingTypeTitleSelected,
                ]}>
                  🔒 Privata
                </Text>
                <Text style={styles.bookingTypeDescription}>
                  Solo tu puoi invitare altri giocatori
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Dettagli prenotazione */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Struttura e Campo</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="business" size={20} color="#2563eb" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Struttura</Text>
              <Text style={styles.detailValue}>{strutturaName}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="tennisball" size={20} color="#f59e0b" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Campo</Text>
              <Text style={styles.detailValue}>{campoName}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="trophy" size={20} color="#eab308" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Sport</Text>
              <Text style={styles.detailValue}>{sport}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 Data e Orario</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={20} color="#3b82f6" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Data</Text>
              <Text style={styles.detailValue}>{formatDate(date)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time" size={20} color="#7c3aed" />
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

        {/* Selezione numero giocatori per Beach Volley - SEMPRE obbligatoria */}
        {sport === "beach_volley" && sportRules && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👥 Numero Giocatori *</Text>
            <Text style={styles.cardSubtitle}>
              Scegli quante persone parteciperanno alla partita
            </Text>
            {canSplitCosts && (
              <Text style={[styles.cardSubtitle, { color: "#FF9800", marginTop: 4 }]}>
                💡 Puoi scegliere di dividere il prezzo tra i giocatori
              </Text>
            )}
            
            <View style={styles.maxPlayersContainer}>
              {sportRules.allowedValues.map((players) => {
                const formation = getTeamFormationLabel(players);
                const isSelected = maxPlayers === players;
                const pricePerPlayer = canSplitCosts ? (numericPrice / players).toFixed(2) : null;
                
                return (
                  <Pressable
                    key={players}
                    style={[
                      styles.maxPlayersOption,
                      isSelected && styles.maxPlayersOptionSelected,
                    ]}
                    onPress={() => setMaxPlayers(players)}
                  >
                    <View style={styles.maxPlayersContent}>
                      <Text style={[
                        styles.maxPlayersNumber,
                        isSelected && styles.maxPlayersNumberSelected,
                      ]}>
                        {players}
                      </Text>
                      <Text style={[
                        styles.maxPlayersLabel,
                        isSelected && styles.maxPlayersLabelSelected,
                      ]}>
                        giocatori
                      </Text>
                      <Text style={[
                        styles.maxPlayersFormation,
                        isSelected && styles.maxPlayersFormationSelected,
                      ]}>
                        {formation}
                      </Text>
                      {canSplitCosts && pricePerPlayer && (
                        <Text style={[
                          styles.maxPlayersPrice,
                          isSelected && styles.maxPlayersPriceSelected,
                        ]}>
                          €{pricePerPlayer}/gioc.
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Pagamento</Text>

          {/* Opzione intero / diviso per sport che supportano split */}
          {(sport === "volley" || sport === "beach_volley") && bookingType === 'private' && canSplitCosts && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.cardSubtitle}>Scegli tipo pagamento</Text>

              <View style={[styles.bookingTypeContainer, { marginTop: 8 }]}> 
                <Pressable
                  style={[
                    styles.bookingTypeOption,
                    paymentMode === "full" && styles.bookingTypeOptionSelected,
                  ]}
                  onPress={() => setPaymentMode("full")}
                >
                  <Ionicons
                    name={paymentMode === "full" ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={paymentMode === "full" ? "#2196F3" : "#999"}
                  />
                  <View style={styles.bookingTypeContent}>
                    <Text style={[styles.bookingTypeTitle, paymentMode === "full" && styles.bookingTypeTitleSelected]}>Paga tutta la partita</Text>
                    <Text style={styles.bookingTypeDescription}>Paghi l'intero importo della prenotazione</Text>
                  </View>
                </Pressable>

                <View style={styles.bookingTypeSeparator} />

                <Pressable
                  style={[
                    styles.bookingTypeOption,
                    paymentMode === "split" && styles.bookingTypeOptionSelected,
                  ]}
                  onPress={() => setPaymentMode("split")}
                >
                  <Ionicons
                    name={paymentMode === "split" ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={paymentMode === "split" ? "#2196F3" : "#999"}
                  />
                  <View style={styles.bookingTypeContent}>
                    <Text style={[styles.bookingTypeTitle, paymentMode === "split" && styles.bookingTypeTitleSelected]}>Paga la tua quota</Text>
                    <Text style={styles.bookingTypeDescription}>Ogni giocatore paga la sua quota</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          )}

          {/* Per partite pubbliche, mostra solo "Paga la tua quota" */}
          {bookingType === 'public' && (sport === "volley" || sport === "beach_volley") && canSplitCosts && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.cardSubtitle}>Tipo pagamento</Text>

              <View style={[styles.bookingTypeContainer, { marginTop: 8 }]}>
                <View style={[styles.bookingTypeOption, styles.bookingTypeOptionSelected]}>
                  <Ionicons name="radio-button-on" size={20} color="#2196F3" />
                  <View style={styles.bookingTypeContent}>
                    <Text style={[styles.bookingTypeTitle, styles.bookingTypeTitleSelected]}>Paga la tua quota</Text>
                    <Text style={styles.bookingTypeDescription}>Ogni giocatore paga la sua quota</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {isSplitSelected ? "Prezzo (per giocatore)" : "Prezzo"}
            </Text>
            <Text style={styles.priceValue}>
              {isSplitSelected ? `€${unitPrice?.toFixed(2)}` : `€${price}`}
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Totale da pagare</Text>
            <Text style={styles.totalValue}>
              {isSplitSelected && unitPrice
                ? `€${unitPrice.toFixed(2)}`
                : `€${numericPrice.toFixed(2)}`}
            </Text>
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
          <Ionicons name="close" size={20} color="#dc3545" />
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
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.buttonPrimaryText}>Conferma Prenotazione</Text>
            </>
          )}
        </Pressable>
      </View>

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        bookingId={createdBookingId}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

const SuccessModal = ({ visible, onClose, bookingId, navigation }: any) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#28a745" />
          </View>
          
          <Text style={styles.modalTitle}>🎉 Prenotazione Completata!</Text>
          
          <Text style={styles.modalMessage}>
            La tua prenotazione è stata registrata con successo. Riceverai una conferma via email.
          </Text>
          
          <Pressable
            style={styles.modalButton}
            onPress={() => {
              onClose();
              navigation.reset({
                index: 0,
                routes: [{ name: "DettaglioPrenotazione", params: { bookingId } }],
              });
            }}
          >
            <Text style={styles.modalButtonText}>Vedi Dettagli Prenotazione</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafbfc" },
  
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

  container: { flex: 1, padding: 12 },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  summaryCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
  },

  summaryContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  summaryTextContainer: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 2,
  },

  summarySubtitle: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 16,
  },

  cardSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: -12,
    marginBottom: 8,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
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

  bookingTypeContainer: {
    gap: 12,
  },

  bookingTypeOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
  },

  bookingTypeOptionSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },

  bookingTypeContent: {
    flex: 1,
  },

  bookingTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },

  bookingTypeTitleSelected: {
    color: "#2196F3",
  },

  bookingTypeDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },

  bookingTypeSeparator: {
    height: 8,
  },

  maxPlayersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },

  maxPlayersOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
    marginHorizontal: 4,
  },

  maxPlayersOptionSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },

  maxPlayersContent: {
    alignItems: "center",
  },

  maxPlayersNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#212121",
  },

  maxPlayersNumberSelected: {
    color: "#2196F3",
  },

  maxPlayersLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
    marginTop: 2,
  },

  maxPlayersLabelSelected: {
    color: "#1976D2",
  },

  maxPlayersFormation: {
    fontSize: 10,
    fontWeight: "600",
    color: "#999",
    marginTop: 1,
  },

  maxPlayersFormationSelected: {
    color: "#2196F3",
  },

  maxPlayersPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
    marginTop: 1,
  },

  maxPlayersPriceSelected: {
    color: "#2196F3",
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
    paddingBottom: 28,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    gap: 12,
  },

  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },

  buttonSecondary: {
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#dc3545",
  },

  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#dc3545",
  },

  buttonPrimary: {
    backgroundColor: "#28a745",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 0,
  },

  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.5,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    maxWidth: 350,
  },

  successIconContainer: {
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 12,
  },

  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },

  modalButton: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },

  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
});