import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useCallback, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import API_URL from "../../config/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

const SPORT_ICONS: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  beach_volley: "football-outline",
  padel: "tennisball-outline",
  tennis: "tennisball-outline",
  volley: "football-outline",
};

const SPORT_COLORS: { [key: string]: readonly [string, string] } = {
  beach_volley: ["#FF9800", "#FB8C00"],
  padel: ["#2196F3", "#1976D2"],
  tennis: ["#4CAF50", "#43A047"],
  volley: ["#F44336", "#E53935"],
};

const SURFACE_MAP: { [key: string]: string } = {
  sand: "Sabbia",
  hardcourt: "Cemento",
  grass: "Erba",
  pvc: "PVC",
  cement: "Cemento",
};

const SURFACE_ICONS: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  sand: "sunny-outline",
  hardcourt: "grid-outline",
  grass: "leaf-outline",
  pvc: "layers-outline",
  cement: "grid-outline",
};

export default function DettaglioCampoScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { campoId } = route.params;

  const [loading, setLoading] = useState(true);
  const [campo, setCampo] = useState<Campo | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
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
      fadeAnim.setValue(0);
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
        <LinearGradient
          colors={["#2196F3", "#1976D2"]}
          style={styles.loadingContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Caricamento campo...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!campo) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient
          colors={["#2196F3", "#1976D2"]}
          style={styles.loadingContainer}
        >
          <Ionicons name="alert-circle-outline" size={60} color="white" />
          <Text style={styles.errorText}>Campo non trovato</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* HEADER */}
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
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>{campo.name}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <Animated.ScrollView
        style={[styles.container, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >

        {/* QUICK STATS */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatCard}>
              <LinearGradient
                colors={["#F44336", "#E53935"]}
                style={styles.quickStatGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="people-outline" size={24} color="white" />
              </LinearGradient>
              <Text style={styles.quickStatValue}>{campo.maxPlayers}</Text>
              <Text style={styles.quickStatLabel}>Giocatori max</Text>
            </View>

            <View style={styles.quickStatCard}>
              <LinearGradient
                colors={["#2196F3", "#1976D2"]}
                style={styles.quickStatGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name={campo.indoor ? "home-outline" : "sunny-outline"}
                  size={24}
                  color="white"
                />
              </LinearGradient>
              <Text style={styles.quickStatValue}>
                {campo.indoor ? "Indoor" : "Outdoor"}
              </Text>
              <Text style={styles.quickStatLabel}>Ambiente</Text>
            </View>
          </View>

          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatCard}>
              <LinearGradient
                colors={SPORT_COLORS[campo.sport] || ["#2196F3", "#1976D2"]}
                style={styles.quickStatGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={SPORT_ICONS[campo.sport] || "football-outline"} size={24} color="white" />
              </LinearGradient>
              <Text style={styles.quickStatValue}>{SPORT_MAP[campo.sport]}</Text>
              <Text style={styles.quickStatLabel}>Sport</Text>
            </View>

            <View style={styles.quickStatCard}>
              <LinearGradient
                colors={["#FF9800", "#FB8C00"]}
                style={styles.quickStatGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={SURFACE_ICONS[campo.surface] || "ellipse-outline"} size={24} color="white" />
              </LinearGradient>
              <Text style={styles.quickStatValue}>{SURFACE_MAP[campo.surface]}</Text>
              <Text style={styles.quickStatLabel}>Materiale</Text>
            </View>
          </View>
        </View>


        {/* SEZIONE PREZZI */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <LinearGradient
                colors={["#FF9800", "#FB8C00"]}
                style={styles.sectionIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="pricetag-outline" size={18} color="white" />
              </LinearGradient>
            </View>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Tariffe e Prezzi</Text>
              <Text style={styles.sectionSubtitle}>Configurazione pricing attiva</Text>
            </View>
          </View>

          {/* Se FLAT MODE */}
          {campo.pricingRules?.mode === "flat" && (
            <View style={styles.pricingCard}>
              <View style={styles.pricingModeTag}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.pricingModeText}>Tariffa Fissa</Text>
              </View>
              <View style={styles.priceRowsContainer}>
                <View style={styles.priceRow}>
                  <View style={styles.priceRowLeft}>
                    <Ionicons name="time-outline" size={18} color="#2196F3" />
                    <Text style={styles.priceRowLabel}>1 ora</Text>
                  </View>
                  <Text style={styles.priceRowValue}>
                    €{campo.pricingRules.flatPrices?.oneHour || campo.pricePerHour || 20}
                  </Text>
                </View>
                <View style={styles.priceRowDivider} />
                <View style={styles.priceRow}>
                  <View style={styles.priceRowLeft}>
                    <Ionicons name="time-outline" size={18} color="#2196F3" />
                    <Text style={styles.priceRowLabel}>1.5 ore</Text>
                  </View>
                  <Text style={styles.priceRowValue}>
                    €{campo.pricingRules.flatPrices?.oneHourHalf || (campo.pricePerHour * 1.4) || 28}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Se ADVANCED MODE */}
          {campo.pricingRules?.mode === "advanced" && (
            <View style={styles.advancedPricingContainer}>
              {/* Date Speciali */}
              {campo.pricingRules.dateOverrides?.enabled &&
                campo.pricingRules.dateOverrides.dates?.length > 0 && (
                  <View style={styles.pricingCategory}>
                    <View style={styles.pricingCategoryHeader}>
                      <View style={[styles.priorityBadge, { backgroundColor: "#F44336" }]}>
                        <Text style={styles.priorityBadgeText}>P1</Text>
                      </View>
                      <Text style={styles.pricingCategoryTitle}>Date Speciali</Text>
                    </View>
                    {campo.pricingRules.dateOverrides.dates.map(
                      (dateOv: any, index: number) => (
                        <View key={index} style={styles.pricingItem}>
                          <View style={styles.pricingItemHeader}>
                            <Ionicons name="calendar" size={16} color="#F44336" />
                            <Text style={styles.pricingItemTitle}>{dateOv.label}</Text>
                            <Text style={styles.pricingItemBadge}>{dateOv.date}</Text>
                          </View>
                          <View style={styles.pricingItemPrices}>
                            <View style={styles.miniPriceBox}>
                              <Text style={styles.miniPriceLabel}>1h</Text>
                              <Text style={styles.miniPriceValue}>€{dateOv.prices?.oneHour || 20}</Text>
                            </View>
                            <View style={styles.miniPriceBox}>
                              <Text style={styles.miniPriceLabel}>1.5h</Text>
                              <Text style={styles.miniPriceValue}>€{dateOv.prices?.oneHourHalf || 28}</Text>
                            </View>
                          </View>
                        </View>
                      )
                    )}
                  </View>
                )}

              {/* Periodi Speciali */}
              {campo.pricingRules.periodOverrides?.enabled &&
                campo.pricingRules.periodOverrides.periods?.length > 0 && (
                  <View style={styles.pricingCategory}>
                    <View style={styles.pricingCategoryHeader}>
                      <View style={[styles.priorityBadge, { backgroundColor: "#2196F3" }]}>
                        <Text style={styles.priorityBadgeText}>P2</Text>
                      </View>
                      <Text style={styles.pricingCategoryTitle}>Periodi Speciali</Text>
                    </View>
                    {campo.pricingRules.periodOverrides.periods.map(
                      (period: any, index: number) => (
                        <View key={index} style={styles.pricingItem}>
                          <View style={styles.pricingItemHeader}>
                            <Ionicons name="calendar-outline" size={16} color="#2196F3" />
                            <Text style={styles.pricingItemTitle}>{period.label}</Text>
                          </View>
                          <Text style={styles.pricingItemDateRange}>
                            {period.startDate} → {period.endDate}
                          </Text>
                          <View style={styles.pricingItemPrices}>
                            <View style={styles.miniPriceBox}>
                              <Text style={styles.miniPriceLabel}>1h</Text>
                              <Text style={styles.miniPriceValue}>€{period.prices?.oneHour || 20}</Text>
                            </View>
                            <View style={styles.miniPriceBox}>
                              <Text style={styles.miniPriceLabel}>1.5h</Text>
                              <Text style={styles.miniPriceValue}>€{period.prices?.oneHourHalf || 28}</Text>
                            </View>
                          </View>
                        </View>
                      )
                    )}
                  </View>
                )}

              {/* Fasce Orarie */}
              {campo.pricingRules.timeSlotPricing?.enabled &&
                campo.pricingRules.timeSlotPricing.slots?.length > 0 && (
                  <View style={styles.pricingCategory}>
                    <View style={styles.pricingCategoryHeader}>
                      <View style={[styles.priorityBadge, { backgroundColor: "#4CAF50" }]}>
                        <Text style={styles.priorityBadgeText}>P3</Text>
                      </View>
                      <Text style={styles.pricingCategoryTitle}>Fasce Orarie</Text>
                    </View>
                    {campo.pricingRules.timeSlotPricing.slots.map(
                      (slot: any, index: number) => {
                        const daysLabels = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
                        const hasDays = slot.daysOfWeek && slot.daysOfWeek.length > 0;
                        const daysText = hasDays
                          ? slot.daysOfWeek.map((d: number) => daysLabels[d]).join(", ")
                          : "Tutti i giorni";

                        return (
                          <View key={index} style={styles.pricingItem}>
                            <View style={styles.pricingItemHeader}>
                              <Ionicons name="time" size={16} color="#4CAF50" />
                              <Text style={styles.pricingItemTitle}>
                                {slot.label}
                              </Text>
                              <Text style={styles.pricingItemTime}>
                                {slot.start}-{slot.end}
                              </Text>
                            </View>
                            <Text style={styles.pricingItemDays}>{daysText}</Text>
                            <View style={styles.pricingItemPrices}>
                              <View style={styles.miniPriceBox}>
                                <Text style={styles.miniPriceLabel}>1h</Text>
                                <Text style={styles.miniPriceValue}>€{slot.prices?.oneHour || 20}</Text>
                              </View>
                              <View style={styles.miniPriceBox}>
                                <Text style={styles.miniPriceLabel}>1.5h</Text>
                                <Text style={styles.miniPriceValue}>€{slot.prices?.oneHourHalf || 28}</Text>
                              </View>
                            </View>
                          </View>
                        );
                      }
                    )}
                  </View>
                )}

              {/* Prezzo Base */}
              <View style={styles.pricingCategory}>
                <View style={styles.pricingCategoryHeader}>
                  <View style={[styles.priorityBadge, { backgroundColor: "#A8A8A8" }]}>
                    <Text style={styles.priorityBadgeText}>P5</Text>
                  </View>
                  <Text style={styles.pricingCategoryTitle}>Prezzo Base</Text>
                </View>
                <View style={styles.basePriceCard}>
                  <Text style={styles.basePriceNote}>
                    Applicato quando nessuna regola specifica corrisponde
                  </Text>
                  <View style={styles.pricingItemPrices}>
                    <View style={[styles.miniPriceBox, styles.miniPriceBoxBase]}>
                      <Text style={styles.miniPriceLabel}>1h</Text>
                      <Text style={styles.miniPriceValue}>
                        €{campo.pricingRules.basePrices?.oneHour || campo.pricePerHour || 20}
                      </Text>
                    </View>
                    <View style={[styles.miniPriceBox, styles.miniPriceBoxBase]}>
                      <Text style={styles.miniPriceLabel}>1.5h</Text>
                      <Text style={styles.miniPriceValue}>
                        €{campo.pricingRules.basePrices?.oneHourHalf || (campo.pricePerHour * 1.4) || 28}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Prezzi per Numero Giocatori */}
              {campo.pricingRules.playerCountPricing?.enabled &&
                campo.pricingRules.playerCountPricing.prices?.length > 0 && (
                  <View style={styles.pricingCategory}>
                    <View style={styles.pricingCategoryHeader}>
                      <View style={[styles.priorityBadge, { backgroundColor: "#F44336" }]}>
                        <Ionicons name="people" size={10} color="white" />
                      </View>
                      <Text style={styles.pricingCategoryTitle}>Per Numero Giocatori</Text>
                    </View>
                    {campo.pricingRules.playerCountPricing.prices
                      .sort((a: any, b: any) => a.count - b.count)
                      .map((playerPrice: any, index: number) => (
                        <View key={index} style={styles.pricingItem}>
                          <View style={styles.pricingItemHeader}>
                            <Ionicons name="people-outline" size={16} color="#F44336" />
                            <Text style={styles.pricingItemTitle}>{playerPrice.label}</Text>
                            <View style={styles.playerCountBadge}>
                              <Text style={styles.playerCountText}>{playerPrice.count}</Text>
                            </View>
                          </View>
                          <View style={styles.pricingItemPrices}>
                            <View style={styles.miniPriceBox}>
                              <Text style={styles.miniPriceLabel}>1h</Text>
                              <Text style={styles.miniPriceValue}>€{playerPrice.prices?.oneHour || 20}</Text>
                            </View>
                            <View style={styles.miniPriceBox}>
                              <Text style={styles.miniPriceLabel}>1.5h</Text>
                              <Text style={styles.miniPriceValue}>€{playerPrice.prices?.oneHourHalf || 28}</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                  </View>
                )}
            </View>
          )}

          {/* Fallback vecchio sistema */}
          {!campo.pricingRules && (
            <View style={styles.pricingCard}>
              <View style={styles.pricingModeTag}>
                <Ionicons name="information-circle" size={14} color="#FF9800" />
                <Text style={[styles.pricingModeText, { color: "#FF9800" }]}>Sistema Legacy</Text>
              </View>
              <View style={styles.priceRowsContainer}>
                <View style={styles.priceRow}>
                  <View style={styles.priceRowLeft}>
                    <Ionicons name="time-outline" size={18} color="#2196F3" />
                    <Text style={styles.priceRowLabel}>Tariffa oraria</Text>
                  </View>
                  <Text style={styles.priceRowValue}>€{campo.pricePerHour}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* SEZIONE AZIONI */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <LinearGradient
                colors={["#2196F3", "#1976D2"]}
                style={styles.sectionIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="settings-outline" size={18} color="white" />
              </LinearGradient>
            </View>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Gestione Campo</Text>
              <Text style={styles.sectionSubtitle}>Azioni rapide disponibili</Text>
            </View>
          </View>

          {/* CALENDARIO - AZIONE PRINCIPALE */}
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              styles.actionCardPrimary,
              pressed && styles.actionCardPressed,
            ]}
            onPress={() =>
              navigation.navigate("CampoCalendarioGestione", {
                campoId: campo._id,
                campoName: campo.name,
                strutturaId: campo.struttura,
              })
            }
          >
            <LinearGradient
              colors={["#2196F3", "#1976D2"]}
              style={styles.actionCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.actionCardContent}>
                <View style={styles.actionCardIconLarge}>
                  <Ionicons name="calendar" size={28} color="white" />
                </View>
                <View style={styles.actionCardTextContainer}>
                  <Text style={styles.actionCardTitlePrimary}>
                    Calendario Annuale
                  </Text>
                  <Text style={styles.actionCardDescPrimary}>
                    Gestisci disponibilità e prenotazioni
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
              </View>
            </LinearGradient>
          </Pressable>

          {/* ALTRE AZIONI */}
          <View style={styles.actionGrid}>
            <Pressable
              style={({ pressed }) => [
                styles.actionGridItem,
                pressed && styles.actionCardPressed,
              ]}
              onPress={() =>
                navigation.navigate("ConfiguraPrezziCampo", {
                  campoId: campo._id,
                  campoName: campo.name,
                  campoSport: campo.sport,
                })
              }
            >
              <View style={[styles.actionGridIcon, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="cash-outline" size={22} color="#4CAF50" />
              </View>
              <Text style={styles.actionGridTitle}>Prezzi</Text>
              <Text style={styles.actionGridDesc}>Configura tariffe</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionGridItem,
                pressed && styles.actionCardPressed,
              ]}
              onPress={() =>
                navigation.navigate("ModificaCampo", { campoId: campo._id })
              }
            >
              <View style={[styles.actionGridIcon, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="create-outline" size={22} color="#2196F3" />
              </View>
              <Text style={styles.actionGridTitle}>Modifica</Text>
              <Text style={styles.actionGridDesc}>Informazioni campo</Text>
            </Pressable>
          </View>

          {/* DANGER ZONE */}
          <View style={styles.dangerZone}>
            <Text style={styles.dangerZoneTitle}>Zona Pericolosa</Text>
            <Pressable
              style={({ pressed }) => [
                styles.dangerButton,
                pressed && styles.dangerButtonPressed,
              ]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              <Text style={styles.dangerButtonText}>Elimina Campo</Text>
            </Pressable>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  
  // LOADING & ERROR
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  errorText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },

  // MAIN CONTAINER
  container: {
    flex: 1,
  },

  // CAMPO HEADER CARD
  campoHeaderCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 18,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  campoHeaderContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  campoName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  sportRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  sportBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    fontSize: 11,
    fontWeight: "700",
  },
  statusTextActive: {
    color: "#4CAF50",
  },
  statusTextInactive: {
    color: "#F44336",
  },

  // QUICK STATS
  quickStatsContainer: {
    flexDirection: "column",
    paddingHorizontal: 16,
    paddingTop: 25,
    gap: 10,
  },
  quickStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#2196F3",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  quickStatGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 9,
    fontWeight: "500",
    color: "#999",
    textAlign: "center",
  },

  // SECTIONS
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionIconGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },

  // PRICING CARD (FLAT MODE)
  pricingCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pricingModeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  pricingModeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },
  priceRowsContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    overflow: "hidden",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  priceRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  priceRowLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4A5568",
  },
  priceRowValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2196F3",
  },
  priceRowDivider: {
    height: 1,
    backgroundColor: "#E8ECF4",
    marginHorizontal: 14,
  },

  // ADVANCED PRICING
  advancedPricingContainer: {
    gap: 16,
  },
  pricingCategory: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pricingCategoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  priorityBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "white",
  },
  pricingCategoryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },
  pricingItem: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  pricingItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  pricingItemTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  pricingItemBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2196F3",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pricingItemTime: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4CAF50",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pricingItemDateRange: {
    fontSize: 11,
    color: "#999",
    marginBottom: 8,
  },
  pricingItemDays: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
    marginBottom: 8,
  },
  pricingItemPrices: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  miniPriceBox: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8ECF4",
  },
  miniPriceBoxBase: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E8ECF4",
  },
  miniPriceLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#999",
    marginBottom: 2,
  },
  miniPriceValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2196F3",
  },
  basePriceCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
  },
  basePriceNote: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
    marginBottom: 10,
    textAlign: "center",
  },
  playerCountBadge: {
    backgroundColor: "#FCE4EC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  playerCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F44336",
  },

  // ACTION CARDS
  actionCard: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#2196F3",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  actionCardPrimary: {},
  actionCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  actionCardGradient: {
    padding: 20,
  },
  actionCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionCardIconLarge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionCardTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  actionCardTitlePrimary: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  actionCardDescPrimary: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 3,
  },

  // ACTION GRID
  actionGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  actionGridItem: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionGridIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionGridTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  actionGridDesc: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
  },

  // DANGER ZONE
  dangerZone: {
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    borderStyle: "dashed",
  },
  dangerZoneTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF3B30",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  dangerButtonPressed: {
    backgroundColor: "#FFEBEE",
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF3B30",
  },
});