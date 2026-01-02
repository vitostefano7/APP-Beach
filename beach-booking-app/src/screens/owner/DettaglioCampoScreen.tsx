import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";

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
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Dettaglio Campo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container}>
        {/* HEADER CAMPO */}
        <View style={styles.campoHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.campoName}>{campo.name}</Text>
            <Text style={styles.campoSport}>
              {SPORT_MAP[campo.sport]} • {SURFACE_MAP[campo.surface]}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              campo.isActive ? styles.statusActive : styles.statusInactive,
            ]}
          >
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

        {/* INFO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Informazioni</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sport</Text>
            <Text style={styles.infoValue}>{SPORT_MAP[campo.sport]}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Superficie</Text>
            <Text style={styles.infoValue}>
              {SURFACE_MAP[campo.surface]}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo</Text>
            <Text style={styles.infoValue}>
              {campo.indoor ? "Coperto" : "All'aperto"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Max giocatori</Text>
            <Text style={styles.infoValue}>{campo.maxPlayers}</Text>
          </View>
        </View>

        {/* PREZZI DETTAGLIATI */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Prezzi</Text>

          {/* Se FLAT MODE */}
          {campo.pricingRules?.mode === "flat" && (
            <>
              <View style={styles.priceDetailRow}>
                <Text style={styles.priceDetailLabel}>💵 Tariffa Fissa</Text>
              </View>
              <View style={styles.priceDetailRow}>
                <Text style={styles.priceDetailDuration}>1 ora</Text>
                <Text style={styles.priceDetailValue}>
                  €{campo.pricingRules.flatPrices?.oneHour || campo.pricePerHour || 20}
                </Text>
              </View>
              <View style={styles.priceDetailRow}>
                <Text style={styles.priceDetailDuration}>1.5 ore</Text>
                <Text style={styles.priceDetailValue}>
                  €{campo.pricingRules.flatPrices?.oneHourHalf || (campo.pricePerHour * 1.4) || 28}
                </Text>
              </View>
            </>
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
            </>
          )}

          {/* Fallback vecchio sistema */}
          {!campo.pricingRules && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Prezzo orario</Text>
              <Text style={styles.priceValue}>€{campo.pricePerHour}</Text>
            </View>
          )}
        </View>

        {/* AZIONI */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛠️ Azioni</Text>

          {/* 📅 CALENDARIO ANNUALE - PULSANTE PRINCIPALE */}
          <Pressable
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() =>
              navigation.navigate("CampoCalendarioGestione", {
                campoId: campo._id,
                campoName: campo.name,
                strutturaId: campo.struttura,
              })
            }
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
              📅 Gestisci Calendario Annuale
            </Text>
          </Pressable>

          {/* 💰 GESTIONE PREZZI */}
          <Pressable
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() =>
              navigation.navigate("ConfiguraPrezziCampo", {
                campoId: campo._id,
                campoName: campo.name,
                campoSport: campo.sport,
              })
            }
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
              💰 Gestisci Prezzi
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate("ModificaCampo", { campoId: campo._id })
            }
          >
            <Text style={styles.actionButtonText}>✏️ Modifica Info Campo</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={handleDelete}
          >
            <Text
              style={[
                styles.actionButtonText,
                styles.actionButtonDangerText,
              ]}
            >
              🗑️ Elimina Campo
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7f9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  back: { fontSize: 20, fontWeight: "800" },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  container: { flex: 1, padding: 16 },
  errorText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#666",
  },
  campoHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  campoName: { fontSize: 28, fontWeight: "800", marginBottom: 4 },
  campoSport: { fontSize: 16, color: "#666" },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusActive: { backgroundColor: "#E8F5E9" },
  statusInactive: { backgroundColor: "#FFEBEE" },
  statusText: { fontSize: 14, fontWeight: "600" },
  statusTextActive: { color: "#4CAF50" },
  statusTextInactive: { color: "#F44336" },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  infoLabel: { fontSize: 16, color: "#666" },
  infoValue: { fontSize: 16, fontWeight: "600" },
  priceValue: { fontSize: 15, fontWeight: "800", color: "#007AFF" },
  priceHierarchyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2196F3",
    marginTop: 16,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#E3F2FD",
  },
  priceSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  priceSectionHeader: {
    marginBottom: 8,
  },
  priceSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  priceSectionDate: {
    fontSize: 13,
    color: "#2196F3",
    fontWeight: "600",
  },
  priceSectionDays: {
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "600",
    marginTop: 2,
  },
  priceSectionSubtitle: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 8,
  },
  priceDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  priceDetailLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  priceDetailDuration: {
    fontSize: 14,
    color: "#666",
  },
  priceDetailValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#007AFF",
  },
  actionButton: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
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
  actionButtonText: { 
    fontSize: 16, 
    fontWeight: "600",
    color: "#333",
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