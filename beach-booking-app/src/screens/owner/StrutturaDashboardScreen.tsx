import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useContext, useState, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

import API_URL from "../../config/api";

interface Struttura {
  _id: string;
  name: string;
  description?: string;
  location: { city: string };
  isActive: boolean;
}

interface Campo {
  _id: string;
  name: string;
  sport: string;
  surface: string;
  pricePerHour: number;
  isActive: boolean;
  indoor: boolean;
}

interface Booking {
  _id: string;
  campo: {
    _id: string;
    struttura: {
      _id: string;
    };
  };
  status: string;
}

const SPORT_MAP: { [key: string]: string } = {
  beach_volley: "Beach Volley",
  padel: "Padel",
  tennis: "Tennis",
  volley: "Volley",
};

export default function StrutturaDashboardScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { token } = useContext(AuthContext);
  const { strutturaId } = route.params;

  const [loading, setLoading] = useState(true);
  const [struttura, setStruttura] = useState<Struttura | null>(null);
  const [campi, setCampi] = useState<Campo[]>([]);
  const [bookingsCount, setBookingsCount] = useState(0);

  const loadData = useCallback(async () => {
    if (!token) {
      console.log("❌ Nessun token disponibile");
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Inizio caricamento dati per struttura:", strutturaId);

      // Carica struttura
      const strutturaUrl = `${API_URL}/strutture/${strutturaId}`;
      const strutturaRes = await fetch(strutturaUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const strutturaData = await strutturaRes.json();
      setStruttura(strutturaData);

      // Carica TUTTI i campi (anche non attivi) per l'owner
      const campiUrl = `${API_URL}/campi/owner/struttura/${strutturaId}`;
      const campiRes = await fetch(campiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const campiData = await campiRes.json();
      setCampi(campiData);

      // Carica prenotazioni per questa struttura
      try {
        const bookingsUrl = `${API_URL}/bookings/owner`;
        const bookingsRes = await fetch(bookingsUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (bookingsRes.ok) {
          const allBookings = await bookingsRes.json();
          
          // Filtra solo le prenotazioni confermate per questa struttura
          const strutturaBookings = allBookings.filter((booking: Booking) => 
            booking.status === "confirmed" && 
            booking.campo?.struttura?._id === strutturaId
          );
          
          setBookingsCount(strutturaBookings.length);
        }
      } catch (error) {
        console.error("⚠️ Errore caricamento prenotazioni:", error);
        setBookingsCount(0);
      }
    } catch (error) {
      console.error("❌ Errore caricamento dati:", error);
    } finally {
      setLoading(false);
    }
  }, [token, strutturaId]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      if (isActive) {
        loadData();
      }

      return () => {
        isActive = false;
      };
    }, [loadData])
  );

  const handleDeleteStruttura = async () => {
    Alert.alert(
      "Elimina struttura",
      `Sei sicuro di voler eliminare "${struttura?.name}"?\n\n` +
      `Verranno eliminati anche tutti i ${campi.length} campi associati.\n\n` +
      `Questa azione NON può essere annullata.`,
      [
        { 
          text: "Annulla", 
          style: "cancel",
        },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/strutture/${strutturaId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              if (response.ok) {
                Alert.alert("Successo", "Struttura eliminata con successo", [
                  {
                    text: "OK",
                    onPress: () => {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: "OwnerTabs" }],
                      });
                    },
                  },
                ]);
              } else {
                const error = await response.json();
                Alert.alert("Errore", error.message || "Impossibile eliminare la struttura");
              }
            } catch (error) {
              Alert.alert("Errore", "Errore di connessione");
            }
          },
        },
      ]
    );
  };

  const handleGoToBookings = () => {
    navigation.navigate("OwnerBookings", {
      filterStrutturaId: strutturaId,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={{ marginTop: 100 }}
        />
      </SafeAreaView>
    );
  }

  if (!struttura) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
          <Text style={styles.errorText}>Struttura non trovata</Text>
        </View>
      </SafeAreaView>
    );
  }

  const campiAttivi = campi.filter((c) => c.isActive);

  return (
    <SafeAreaView style={styles.safe}>
      {/* FIXED HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Pressable onPress={loadData} style={styles.refreshButton}>
          <Ionicons name="reload" size={22} color="#007AFF" />
        </Pressable>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* INFO STRUTTURA */}
        <View style={styles.strutturaCard}>
          <View style={styles.strutturaHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.strutturaNome}>{struttura.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color="#666" />
                <Text style={styles.locationText}>{struttura.location.city}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, struttura.isActive && styles.statusBadgeActive]}>
              <View style={[styles.statusDot, struttura.isActive && styles.statusDotActive]} />
              <Text style={[styles.statusText, struttura.isActive && styles.statusTextActive]}>
                {struttura.isActive ? "Attiva" : "Non attiva"}
              </Text>
            </View>
          </View>
        </View>

        {/* KPI CARDS */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons name="grid" size={18} color="#2196F3" />
            </View>
            <Text style={styles.kpiValue}>{campi.length}</Text>
            <Text style={styles.kpiLabel}>Campi totali</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
            </View>
            <Text style={styles.kpiValue}>{campiAttivi.length}</Text>
            <Text style={styles.kpiLabel}>Campi attivi</Text>
          </View>

          <Pressable style={[styles.kpiCard, styles.kpiCardClickable]} onPress={handleGoToBookings}>
            <View style={[styles.kpiIcon, { backgroundColor: "#F3E5F5" }]}>
              <Ionicons name="calendar" size={18} color="#9C27B0" />
            </View>
            <Text style={styles.kpiValue}>{bookingsCount}</Text>
            <Text style={styles.kpiLabel}>Prenotazioni</Text>
            <View style={styles.tapHint}>
              <Ionicons name="arrow-forward" size={10} color="#9C27B0" />
            </View>
          </Pressable>
        </View>

        {/* SEZIONE CAMPI */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="basketball" size={20} color="#2196F3" />
              <Text style={styles.sectionTitle}>Campi</Text>
            </View>
            {campi.length > 0 && (
              <Pressable
                style={styles.addButtonSmall}
                onPress={() => navigation.navigate("AggiungiCampo", { strutturaId })}
              >
                <Ionicons name="add" size={16} color="white" />
                <Text style={styles.addButtonTextSmall}>Aggiungi</Text>
              </Pressable>
            )}
          </View>

          {campi.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="basketball-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nessun campo disponibile</Text>
              <Pressable
                style={styles.addButton}
                onPress={() => navigation.navigate("AggiungiCampo", { strutturaId })}
              >
                <Ionicons name="add" size={18} color="white" />
                <Text style={styles.addButtonText}>Aggiungi campo</Text>
              </Pressable>
            </View>
          ) : (
            campi.map((campo) => (
              <View key={campo._id} style={styles.campoCard}>
                <View style={styles.campoHeader}>
                  <View style={styles.sportIcon}>
                    <Ionicons 
                      name={campo.sport === "beach_volley" ? "basketball" : "tennisball"} 
                      size={20} 
                      color="#2196F3" 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.campoName}>{campo.name}</Text>
                    <View style={styles.campoMeta}>
                      <Text style={styles.sportBadge}>
                        {SPORT_MAP[campo.sport] || campo.sport}
                      </Text>
                      {campo.indoor && (
                        <View style={styles.indoorBadge}>
                          <Ionicons name="business" size={10} color="#666" />
                          <Text style={styles.indoorText}>Indoor</Text>
                        </View>
                      )}
                      <View style={[styles.statusIndicator, campo.isActive && styles.statusIndicatorActive]}>
                        <View style={[styles.statusDotSmall, campo.isActive && styles.statusDotSmallActive]} />
                        <Text style={[styles.statusTextSmall, campo.isActive && styles.statusTextSmallActive]}>
                          {campo.isActive ? "Attivo" : "Non attivo"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                <View style={styles.campoFooter}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceValue}>€{campo.pricePerHour}</Text>
                    <Text style={styles.priceLabel}>/ora</Text>
                  </View>
                  <Pressable
                    style={styles.detailsButton}
                    onPress={() => navigation.navigate("DettaglioCampo", { campoId: campo._id })}
                  >
                    <Text style={styles.detailsButtonText}>Dettagli</Text>
                    <Ionicons name="chevron-forward" size={16} color="#007AFF" />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {/* AZIONI RAPIDE */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="flash" size={20} color="#FF9800" />
            <Text style={styles.sectionTitle}>Azioni rapide</Text>
          </View>
          
          <Pressable
            style={styles.actionButton}
            onPress={() => navigation.navigate("ModificaStruttura", { strutturaId })}
          >
            <View style={styles.actionButtonLeft}>
              <View style={[styles.actionIcon, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="create" size={18} color="#2196F3" />
              </View>
              <Text style={styles.actionButtonText}>Modifica struttura</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={handleDeleteStruttura}
          >
            <View style={styles.actionButtonLeft}>
              <View style={[styles.actionIcon, { backgroundColor: "#FFEBEE" }]}>
                <Ionicons name="trash" size={18} color="#F44336" />
              </View>
              <Text style={[styles.actionButtonText, { color: "#F44336" }]}>
                Elimina struttura
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#F44336" />
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
  },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { 
    fontSize: 17, 
    fontWeight: "700",
    color: "#1a1a1a",
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: { 
    padding: 16,
  },

  // STRUTTURA CARD
  strutturaCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  strutturaHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  strutturaNome: { 
    fontSize: 20, 
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: { 
    color: "#666", 
    fontSize: 13,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: "#E8F5E9",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F44336",
  },
  statusDotActive: {
    backgroundColor: "#4CAF50",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F44336",
  },
  statusTextActive: {
    color: "#4CAF50",
  },

  // KPI ROW
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  kpiCardClickable: {
    borderWidth: 1,
    borderColor: "#9C27B0",
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  kpiValue: { 
    fontSize: 22, 
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  kpiLabel: { 
    color: "#666", 
    fontWeight: "600", 
    fontSize: 10,
  },
  tapHint: {
    position: "absolute",
    bottom: 6,
    right: 6,
  },

  // SECTIONS
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { 
    fontSize: 17, 
    fontWeight: "700",
    color: "#1a1a1a",
  },

  addButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addButtonTextSmall: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
  },

  // EMPTY STATE
  emptyCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    color: "#999",
    fontSize: 14,
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },

  // CAMPO CARD
  campoCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  campoHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  sportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  campoName: { 
    fontWeight: "700", 
    fontSize: 15,
    color: "#1a1a1a",
    marginBottom: 4,
  },
  campoMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  sportBadge: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
  },
  indoorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  indoorText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#666",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statusDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#F44336",
  },
  statusDotSmallActive: {
    backgroundColor: "#4CAF50",
  },
  statusTextSmall: {
    fontSize: 10,
    fontWeight: "700",
    color: "#F44336",
  },
  statusTextSmallActive: {
    color: "#4CAF50",
  },
  campoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4CAF50",
  },
  priceLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailsButtonText: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 13,
  },

  // ACTION BUTTONS
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButtonDanger: {
    borderWidth: 1,
    borderColor: "#FFEBEE",
  },
  actionButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },

  // ERROR
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
});