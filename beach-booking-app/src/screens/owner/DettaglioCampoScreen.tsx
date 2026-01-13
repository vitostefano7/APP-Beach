import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import API_URL from "../../config/api";

interface Campo {
  _id: string;
  name: string;
  sport: string;
  surface: string;
  maxPlayers: number;
  indoor: boolean;
  pricePerHour: number;
  isActive: boolean;
  struttura: string;
  pricingRules?: any;
}

const SPORT_MAP: { [key: string]: string } = {
  beach_volley: "Beach Volley",
  padel: "Padel",
  tennis: "Tennis",
  volley: "Volley",
};

const SURFACE_MAP: { [key: string]: string } = {
  sand: "Sabbia",
  hardcourt: "Cemento",
  grass: "Erba",
  pvc: "PVC",
  cement: "Cemento",
};

export default function DettaglioCampoScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { campoId } = route.params;

  const [loading, setLoading] = useState(true);
  const [campo, setCampo] = useState<Campo | null>(null);

  const loadCampo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/campi/${campoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Campo non trovato");
      }

      const data = await response.json();
      setCampo(data);
    } catch (error) {
      Alert.alert("Errore", "Impossibile caricare il campo", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [campoId, token]);

  useFocusEffect(
    useCallback(() => {
      loadCampo();
    }, [loadCampo])
  );

  const handleDelete = async () => {
    Alert.alert(
      "⚠️ Elimina campo",
      `Sei sicuro di voler eliminare "${campo?.name}"?\n\nQuesta azione NON può essere annullata.`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina definitivamente",
          style: "destructive",
          onPress: async () => {
            const response = await fetch(`${API_URL}/campi/${campoId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
              Alert.alert("Successo", "Campo eliminato", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!campo) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>Campo non trovato</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* HEADER CON GRADIENTE */}
      <LinearGradient
        colors={["#2196F3", "#1976D2"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Dettaglio Campo</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER CAMPO CON CARD */}
        <View style={styles.campoHeaderCard}>
          <View style={styles.campoHeaderContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.campoName}>{campo.name}</Text>
              <View style={styles.sportRow}>
                <View style={styles.sportBadge}>
                  <Text style={styles.sportText}>
                    {SPORT_MAP[campo.sport]}
                  </Text>
                </View>
                <View style={styles.surfaceBadge}>
                  <Text style={styles.surfaceText}>
                    {SURFACE_MAP[campo.surface]}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                campo.isActive ? styles.statusActive : styles.statusInactive,
              ]}
            >
              <View style={styles.statusIconContainer}>
                <Text style={styles.statusIcon}>
                  {campo.isActive ? "✓" : "✕"}
                </Text>
              </View>
              <Text
                style={[
                  styles.statusText,
                  campo.isActive
                    ? styles.statusTextActive
                    : styles.statusTextInactive,
                ]}
              >
                {campo.isActive ? "Attivo" : "Non attivo"}
              </Text>
            </View>
          </View>
        </View>

        {/* INFO */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconCircle}>
              <Text style={styles.cardIcon}>📋</Text>
            </View>
            <Text style={styles.cardTitle}>Informazioni Campo</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>🏃</Text>
              <Text style={styles.infoLabel}>Sport</Text>
              <Text style={styles.infoValue}>{SPORT_MAP[campo.sport]}</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>🏖️</Text>
              <Text style={styles.infoLabel}>Superficie</Text>
              <Text style={styles.infoValue}>
                {SURFACE_MAP[campo.surface]}
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>
                {campo.indoor ? "🏠" : "☀️"}
              </Text>
              <Text style={styles.infoLabel}>Tipo</Text>
              <Text style={styles.infoValue}>
                {campo.indoor ? "Coperto" : "All'aperto"}
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>👥</Text>
              <Text style={styles.infoLabel}>Max giocatori</Text>
              <Text style={styles.infoValue}>{campo.maxPlayers}</Text>
            </View>
          </View>
        </View>

        {/* PREZZI DETTAGLIATI */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: "#FFF3E0" }]}>
              <Text style={styles.cardIcon}>💰</Text>
            </View>
            <Text style={styles.cardTitle}>Prezzi</Text>
          </View>

          {/* Se FLAT MODE */}
          {campo.pricingRules?.mode === "flat" && (
            <View style={styles.priceModeContainer}>
              <View style={styles.priceModeHeader}>
                <Text style={styles.priceModeLabel}>💵 Tariffa Fissa</Text>
              </View>
              <View style={styles.priceDetailRow}>
                <Text style={styles.priceDetailDuration}>⏱️ 1 ora</Text>
                <Text style={styles.priceDetailValue}>
                  €{campo.pricingRules.flatPrices?.oneHour || campo.pricePerHour || 20}
                </Text>
              </View>
              <View style={styles.priceDetailRow}>
                <Text style={styles.priceDetailDuration}>⏱️ 1.5 ore</Text>
                <Text style={styles.priceDetailValue}>
                  €{campo.pricingRules.flatPrices?.oneHourHalf || (campo.pricePerHour * 1.4) || 28}
                </Text>
              </View>
            </View>
          )}

          {/* Se ADVANCED MODE */}
          {campo.pricingRules?.mode === "advanced" && (
            <>
              {/* Date Speciali */}
              {campo.pricingRules.dateOverrides?.enabled &&
                campo.pricingRules.dateOverrides.dates?.length > 0 && (
                  <>
                    <Text style={styles.priceHierarchyTitle}>📅 Date Speciali (Priorità 1)</Text>
                    {campo.pricingRules.dateOverrides.dates.map(
                      (dateOv: any, index: number) => (
                        <View key={index} style={styles.priceSection}>
                          <View style={styles.priceSectionHeader}>
                            <Text style={styles.priceSectionTitle}>
                              {dateOv.label}
                            </Text>
                            <Text style={styles.priceSectionDate}>{dateOv.date}</Text>
                          </View>
                          <View style={styles.priceDetailRow}>
                            <Text style={styles.priceDetailDuration}>1 ora</Text>
                            <Text style={styles.priceDetailValue}>
                              €{dateOv.prices?.oneHour || 20}
                            </Text>
                          </View>
                          <View style={styles.priceDetailRow}>
                            <Text style={styles.priceDetailDuration}>1.5 ore</Text>
                            <Text style={styles.priceDetailValue}>
                              €{dateOv.prices?.oneHourHalf || 28}
                            </Text>
                          </View>
                        </View>
                      )
                    )}
                  </>
                )}

              {/* Periodi Speciali */}
              {campo.pricingRules.periodOverrides?.enabled &&
                campo.pricingRules.periodOverrides.periods?.length > 0 && (
                  <>
                    <Text style={styles.priceHierarchyTitle}>📆 Periodi Speciali (Priorità 2)</Text>
                    {campo.pricingRules.periodOverrides.periods.map(
                      (period: any, index: number) => (
                        <View key={index} style={styles.priceSection}>
                          <View style={styles.priceSectionHeader}>
                            <Text style={styles.priceSectionTitle}>
                              {period.label}
                            </Text>
                            <Text style={styles.priceSectionDate}>
                              {period.startDate} → {period.endDate}
                            </Text>
                          </View>
                          <View style={styles.priceDetailRow}>
                            <Text style={styles.priceDetailDuration}>1 ora</Text>
                            <Text style={styles.priceDetailValue}>
                              €{period.prices?.oneHour || 20}
                            </Text>
                          </View>
                          <View style={styles.priceDetailRow}>
                            <Text style={styles.priceDetailDuration}>1.5 ore</Text>
                            <Text style={styles.priceDetailValue}>
                              €{period.prices?.oneHourHalf || 28}
                            </Text>
                          </View>
                        </View>
                      )
                    )}
                  </>
                )}

              {/* Fasce Orarie */}
              {campo.pricingRules.timeSlotPricing?.enabled &&
                campo.pricingRules.timeSlotPricing.slots?.length > 0 && (
                  <>
                    <Text style={styles.priceHierarchyTitle}>⏰ Fasce Orarie (Priorità 3-4)</Text>
                    {campo.pricingRules.timeSlotPricing.slots.map(
                      (slot: any, index: number) => {
                        const daysLabels = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
                        const hasDays = slot.daysOfWeek && slot.daysOfWeek.length > 0;
                        const daysText = hasDays
                          ? slot.daysOfWeek.map((d: number) => daysLabels[d]).join(", ")
                          : "Tutti i giorni";

                        return (
                          <View key={index} style={styles.priceSection}>
                            <View style={styles.priceSectionHeader}>
                              <Text style={styles.priceSectionTitle}>
                                {slot.label} ({slot.start}-{slot.end})
                              </Text>
                              <Text style={styles.priceSectionDays}>{daysText}</Text>
                            </View>
                            <View style={styles.priceDetailRow}>
                              <Text style={styles.priceDetailDuration}>1 ora</Text>
                              <Text style={styles.priceDetailValue}>
                                €{slot.prices?.oneHour || 20}
                              </Text>
                            </View>
                            <View style={styles.priceDetailRow}>
                              <Text style={styles.priceDetailDuration}>1.5 ore</Text>
                              <Text style={styles.priceDetailValue}>
                                €{slot.prices?.oneHourHalf || 28}
                              </Text>
                            </View>
                          </View>
                        );
                      }
                    )}
                  </>
                )}

              {/* Prezzo Base */}
              <Text style={styles.priceHierarchyTitle}>💵 Prezzo Base (Priorità 5)</Text>
              <View style={styles.priceSection}>
                <Text style={styles.priceSectionSubtitle}>
                  Quando nessuna regola specifica si applica
                </Text>
                <View style={styles.priceDetailRow}>
                  <Text style={styles.priceDetailDuration}>1 ora</Text>
                  <Text style={styles.priceDetailValue}>
                    €{campo.pricingRules.basePrices?.oneHour || campo.pricePerHour || 20}
                  </Text>
                </View>
                <View style={styles.priceDetailRow}>
                  <Text style={styles.priceDetailDuration}>1.5 ore</Text>
                  <Text style={styles.priceDetailValue}>
                    €{campo.pricingRules.basePrices?.oneHourHalf || (campo.pricePerHour * 1.4) || 28}
                  </Text>
                </View>
              </View>

              {/* Prezzi per Numero Giocatori */}
              {campo.pricingRules.playerCountPricing?.enabled &&
                campo.pricingRules.playerCountPricing.prices?.length > 0 && (
                  <>
                    <Text style={styles.priceHierarchyTitle}>👥 Prezzi per Numero Giocatori</Text>
                    <Text style={styles.priceSectionSubtitle}>
                      Prezzi specifici in base al numero di partecipanti alla partita
                    </Text>
                    {campo.pricingRules.playerCountPricing.prices
                      .sort((a: any, b: any) => a.count - b.count)
                      .map((playerPrice: any, index: number) => (
                        <View key={index} style={styles.priceSection}>
                          <View style={styles.priceSectionHeader}>
                            <Text style={styles.priceSectionTitle}>
                              👥 {playerPrice.label}
                            </Text>
                            <Text style={styles.priceSectionDays}>
                              {playerPrice.count} giocatori
                            </Text>
                          </View>
                          <View style={styles.priceDetailRow}>
                            <Text style={styles.priceDetailDuration}>1 ora</Text>
                            <Text style={styles.priceDetailValue}>
                              €{playerPrice.prices?.oneHour || 20}
                            </Text>
                          </View>
                          <View style={styles.priceDetailRow}>
                            <Text style={styles.priceDetailDuration}>1.5 ore</Text>
                            <Text style={styles.priceDetailValue}>
                              €{playerPrice.prices?.oneHourHalf || 28}
                            </Text>
                          </View>
                        </View>
                      ))}
                  </>
                )}
            </>
          )}

          {/* Fallback vecchio sistema */}
          {!campo.pricingRules && (
            <View style={styles.priceModeContainer}>
              <View style={styles.priceDetailRow}>
                <Text style={styles.priceDetailDuration}>Prezzo orario</Text>
                <Text style={styles.priceDetailValue}>€{campo.pricePerHour}</Text>
              </View>
            </View>
          )}
        </View>

        {/* AZIONI */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: "#F3E5F5" }]}>
              <Text style={styles.cardIcon}>🛠️</Text>
            </View>
            <Text style={styles.cardTitle}>Azioni</Text>
          </View>

          {/* 📅 CALENDARIO ANNUALE - PULSANTE PRINCIPALE */}
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.actionButtonPrimary,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() =>
              navigation.navigate("CampoCalendarioGestione", {
                campoId: campo._id,
                campoName: campo.name,
                strutturaId: campo.struttura,
              })
            }
          >
            <View style={styles.actionButtonLeft}>
              <View style={[styles.actionButtonIcon, styles.actionButtonIconPrimary]}>
                <Text style={styles.actionButtonIconText}>📅</Text>
              </View>
              <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                Gestisci Calendario Annuale
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#2196F3" style={styles.actionButtonChevron} />
          </Pressable>

          {/* 💰 GESTIONE PREZZI */}
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.actionButtonSecondary,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() =>
              navigation.navigate("ConfiguraPrezziCampo", {
                campoId: campo._id,
                campoName: campo.name,
                campoSport: campo.sport,
              })
            }
          >
            <View style={styles.actionButtonLeft}>
              <View style={[styles.actionButtonIcon, styles.actionButtonIconSecondary]}>
                <Text style={styles.actionButtonIconText}>💰</Text>
              </View>
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                Gestisci Prezzi
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#4CAF50" style={styles.actionButtonChevron} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() =>
              navigation.navigate("ModificaCampo", { campoId: campo._id })
            }
          >
            <View style={styles.actionButtonLeft}>
              <View style={styles.actionButtonIcon}>
                <Text style={styles.actionButtonIconText}>✏️</Text>
              </View>
              <Text style={styles.actionButtonText}>Modifica Info Campo</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" style={styles.actionButtonChevron} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.actionButtonDanger,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={handleDelete}
          >
            <View style={styles.actionButtonLeft}>
              <View style={[styles.actionButtonIcon, styles.actionButtonIconDanger]}>
                <Text style={styles.actionButtonIconText}>🗑️</Text>
              </View>
              <Text
                style={[
                  styles.actionButtonText,
                  styles.actionButtonDangerText,
                ]}
              >
                Elimina Campo
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FF3B30" style={styles.actionButtonChevron} />
          </Pressable>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  back: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },
  container: {
    flex: 1,
    padding: 14,
  },
  errorText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 14,
    color: "#666",
  },

  // HEADER CAMPO
  campoHeaderCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  campoHeaderContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  campoName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 10,
  },
  sportRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  sportBadge: {
    backgroundColor: "#EEF6FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  sportText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2196F3",
  },
  surfaceBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  surfaceText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF9800",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 5,
  },
  statusActive: {
    backgroundColor: "#E8F5E9",
  },
  statusInactive: {
    backgroundColor: "#FFEBEE",
  },
  statusIconContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusIcon: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusTextActive: {
    color: "#4CAF50",
  },
  statusTextInactive: {
    color: "#F44336",
  },

  // CARDS
  card: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  cardIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EEF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  cardIcon: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },

  // INFO GRID
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  infoBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F8F9FA",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EAED",
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 10,
    color: "#666",
    marginBottom: 3,
    textAlign: "center",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
  },

  // PREZZI
  priceModeContainer: {
    marginTop: 4,
  },
  priceModeHeader: {
    backgroundColor: "#F8F9FA",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  priceModeLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
  },
  priceValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2196F3",
  },
  priceHierarchyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2196F3",
    marginTop: 16,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#EEF6FF",
  },
  priceSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  priceSectionHeader: {
    marginBottom: 6,
  },
  priceSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
    marginBottom: 3,
  },
  priceSectionDate: {
    fontSize: 10,
    color: "#2196F3",
    fontWeight: "600",
  },
  priceSectionDays: {
    fontSize: 10,
    color: "#FF9800",
    fontWeight: "600",
    marginTop: 2,
  },
  priceSectionSubtitle: {
    fontSize: 10,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 6,
  },
  priceDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  priceDetailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  priceDetailDuration: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  priceDetailValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2196F3",
  },

  // ACTION BUTTONS - STILE MODERNO
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  actionButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.99 }],
  },
  actionButtonPrimary: {
    backgroundColor: "#EEF6FF",
    borderColor: "#2196F3",
  },
  actionButtonSecondary: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  actionButtonDanger: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FFCDD2",
  },
  actionButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  actionButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  actionButtonIconPrimary: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  actionButtonIconSecondary: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  actionButtonIconDanger: {
    backgroundColor: "#FF3B30",
    borderColor: "#FF3B30",
  },
  actionButtonIconText: {
    fontSize: 16,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  actionButtonTextPrimary: {
    color: "#2196F3",
  },
  actionButtonTextSecondary: {
    color: "#4CAF50",
  },
  actionButtonDangerText: {
    color: "#FF3B30",
  },
  actionButtonChevron: {
    marginLeft: 8,
  },
});