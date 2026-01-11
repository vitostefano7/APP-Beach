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
            <View style={styles.actionButtonIcon}>
              <Text style={styles.actionButtonIconText}>📅</Text>
            </View>
            <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
              Gestisci Calendario Annuale
            </Text>
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
            <View style={styles.actionButtonIcon}>
              <Text style={styles.actionButtonIconText}>💰</Text>
            </View>
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
              Gestisci Prezzi
            </Text>
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
            <View style={styles.actionButtonIcon}>
              <Text style={styles.actionButtonIconText}>✏️</Text>
            </View>
            <Text style={styles.actionButtonText}>Modifica Info Campo</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.actionButtonDanger,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={handleDelete}
          >
            <View style={styles.actionButtonIcon}>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  back: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "white",
  },
  container: {
    flex: 1,
    padding: 16,
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  campoHeaderContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  campoName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  sportRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  sportBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sportText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2196F3",
  },
  surfaceBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  surfaceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF9800",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusActive: {
    backgroundColor: "#E8F5E9",
  },
  statusInactive: {
    backgroundColor: "#FFEBEE",
  },
  statusIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusIcon: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusText: {
    fontSize: 11,
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  cardIcon: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },

  // INFO GRID
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EAED",
  },
  infoIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 4,
    textAlign: "center",
  },
  infoValue: {
    fontSize: 14,
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
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  priceModeLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2196F3",
  },
  priceHierarchyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2196F3",
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#E3F2FD",
  },
  priceSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  priceSectionHeader: {
    marginBottom: 8,
  },
  priceSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  priceSectionDate: {
    fontSize: 11,
    color: "#2196F3",
    fontWeight: "600",
  },
  priceSectionDays: {
    fontSize: 11,
    color: "#FF9800",
    fontWeight: "600",
    marginTop: 2,
  },
  priceSectionSubtitle: {
    fontSize: 11,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 8,
  },
  priceDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  priceDetailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  priceDetailDuration: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  priceDetailValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2196F3",
  },

  // ACTION BUTTONS
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E8EAED",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  actionButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  actionButtonPrimary: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  actionButtonSecondary: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  actionButtonDanger: {
    borderColor: "#FF3B30",
    backgroundColor: "#FFF5F5",
  },
  actionButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionButtonIconText: {
    fontSize: 18,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  actionButtonTextPrimary: {
    color: "white",
  },
  actionButtonTextSecondary: {
    color: "white",
  },
  actionButtonDangerText: {
    color: "#FF3B30",
  },
});