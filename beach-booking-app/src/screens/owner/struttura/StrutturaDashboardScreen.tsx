import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useContext, useState, useCallback, useEffect } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { Ionicons, FontAwesome5, FontAwesome6 } from "@expo/vector-icons";

import API_URL from "../../../config/api";
import { resolveImageUrl } from "../../../utils/imageUtils";
import { sportIcons } from "../../../utils/sportIcons";

const { width } = Dimensions.get("window");

interface OpeningHours {
  [day: string]: {
    closed: boolean;
    slots?: { open: string; close: string }[];
  };
}

interface Struttura {
  _id: string;
  name: string;
  description?: string;
  location: { city: string };
  isActive: boolean;
  images?: string[];
  openingHours?: OpeningHours;
}

interface Campo {
  _id: string;
  name: string;
  sport: { name: string; code: string };
  surface: string;
  pricePerHour: number;
  isActive: boolean;
  indoor: boolean;
  pricingRules?: {
    mode?: "flat" | "advanced";
    flatPrices?: { oneHour?: number; oneHourHalf?: number };
    basePrices?: { oneHour?: number; oneHourHalf?: number };
  };
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

export default function StrutturaDashboardScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { token } = useContext(AuthContext);
  const { strutturaId } = route.params;

  // Controllo se strutturaId è presente
  if (!strutturaId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={56} color="#ddd" />
          <Text style={styles.errorText}>ID struttura mancante</Text>
        </View>
      </SafeAreaView>
    );
  }

  const [loading, setLoading] = useState(true);
  const [struttura, setStruttura] = useState<Struttura | null>(null);
  const [campi, setCampi] = useState<Campo[]>([]);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [showHours, setShowHours] = useState(false);

  // 🎠 Carosello automatico ogni 3 secondi (pausa se utente interagisce)
  useEffect(() => {
    if (!struttura?.images || struttura.images.length <= 1 || isUserInteracting) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === struttura.images!.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [struttura?.images, isUserInteracting]);

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
      if (!strutturaRes.ok) {
        throw new Error(`Errore caricamento struttura: ${strutturaRes.status}`);
      }
      const strutturaData = await strutturaRes.json();
      setStruttura(strutturaData);

      // Carica TUTTI i campi (anche non attivi) per l'owner
      const campiUrl = `${API_URL}/campi/owner/struttura/${strutturaId}`;
      const campiRes = await fetch(campiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!campiRes.ok) {
        console.warn(`Errore caricamento campi: ${campiRes.status}`);
        setCampi([]);
      } else {
        const campiData = await campiRes.json();
        setCampi(Array.isArray(campiData) ? campiData : []);
      }

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

  const handleImageSwipe = (direction: 'left' | 'right') => {
    if (!struttura?.images || struttura.images.length <= 1) return;

    setIsUserInteracting(true);
    setCurrentImageIndex((prevIndex) => {
      let newIndex: number;

      if (direction === 'left') {
        // Swipe a sinistra = immagine successiva
        newIndex = prevIndex === struttura.images!.length - 1 ? 0 : prevIndex + 1;
      } else {
        // Swipe a destra = immagine precedente
        newIndex = prevIndex === 0 ? struttura.images!.length - 1 : prevIndex - 1;
      }

      return newIndex;
    });

    // Riavvia il carosello automatico dopo 5 secondi di inattività
    setTimeout(() => {
      setIsUserInteracting(false);
    }, 5000);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10;
    },
    onPanResponderRelease: (_, gestureState) => {
      if (struttura?.images && struttura.images.length > 1) {
        if (gestureState.dx > 50) {
          // Swipe a destra
          handleImageSwipe('right');
        } else if (gestureState.dx < -50) {
          // Swipe a sinistra
          handleImageSwipe('left');
        }
      }
    },
  });

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

  const handleGoToBookings = () => {
    navigation.navigate("OwnerBookings", {
      filterStrutturaId: strutturaId,
    });
  };

  const handleGoToStatistics = () => {
    navigation.navigate("OwnerStatistics", {
      strutturaId,
    });
  };

  const renderSportIcon = (sportCode: string, size = 18, color = "#2196F3") => {
    const icon = sportIcons[sportCode];
    if (!icon) return <Ionicons name="help-circle" size={size} color={color} />;
    if (icon.library === "FontAwesome5") {
      return <FontAwesome5 name={icon.name} size={size} color={color} />;
    }
    if (icon.library === "FontAwesome6") {
      return <FontAwesome6 name={icon.name} size={size} color={color} />;
    }
    if (icon.library === "Ionicons") {
      return <Ionicons name={icon.name as any} size={size} color={color} />;
    }
    return <Ionicons name="help-circle" size={size} color={color} />;
  };

  const normalizeSurfaceName = (surface?: string) => {
    if (!surface) return "N/A";

    const normalizedKey = surface
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    const surfaceTranslations: Record<string, string> = {
      "synthetic grass": "Erba sintetica",
      "artificial grass": "Erba sintetica",
      "artificial turf": "Erba sintetica",
      "synthetic turf": "Erba sintetica",
      "grass": "Erba naturale",
      "natural grass": "Erba naturale",
      "clay": "Terra rossa",
      "red clay": "Terra rossa",
      "hard": "Cemento",
      "hard court": "Cemento",
      "concrete": "Cemento",
      "cement": "Cemento",
      "sand": "Sabbia",
      "beach": "Sabbia",
      "parquet": "Parquet",
      "wood": "Legno",
      "resin": "Resina",
      "rubber": "Gomma",
      "acrylic": "Acrilico",
      "carpet": "Moquette",
      "pvc": "PVC",
      "erba sintetica": "Erba sintetica",
      "erba naturale": "Erba naturale",
      "terra rossa": "Terra rossa",
      "cemento": "Cemento",
      "sabbia": "Sabbia",
      "resina": "Resina",
      "gomma": "Gomma",
    };

    if (surfaceTranslations[normalizedKey]) {
      return surfaceTranslations[normalizedKey];
    }

    return normalizedKey.replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const getCampoCardPrice = (campo: Campo) => {
    const mode = campo.pricingRules?.mode;

    if (mode === "flat") {
      return campo.pricingRules?.flatPrices?.oneHour ?? campo.pricePerHour;
    }

    if (mode === "advanced") {
      return campo.pricingRules?.basePrices?.oneHour ?? campo.pricePerHour;
    }

    return campo.pricePerHour;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator
          size="large"
          color="#2196F3"
          style={{ marginTop: 100 }}
        />
      </SafeAreaView>
    );
  }

  if (!struttura) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={56} color="#ddd" />
          <Text style={styles.errorText}>Struttura non trovata</Text>
        </View>
      </SafeAreaView>
    );
  }

  const campiAttivi = Array.isArray(campi) ? campi.filter((c) => c.isActive) : [];

  // ✅ URL immagine corrente
  const currentImageUri = struttura.images?.length
    ? resolveImageUrl(struttura.images[currentImageIndex])
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* FIXED HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Pressable 
          onPress={() => navigation.navigate("ModificaStruttura", { strutturaId })} 
          style={styles.settingsButton}
        >
          <Ionicons name="settings" size={20} color="#2196F3" />
        </Pressable>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* INFO STRUTTURA + IMMAGINI */}
        <View style={styles.strutturaCard}>
          {/* 🎠 CAROSELLO IMMAGINI */}
          {currentImageUri && (
            <View style={styles.imageContainer}>
              <View {...panResponder.panHandlers} style={styles.imageWrapper}>
                <Image 
                  source={{ uri: currentImageUri }} 
                  style={styles.strutturaImage}
                  resizeMode="cover"
                />
              </View>
              
              {/* Indicatori pallini */}
              {struttura.images && struttura.images.length > 1 && (
                <View style={styles.imageIndicators}>
                  {struttura.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        index === currentImageIndex && styles.indicatorActive,
                      ]}
                    />
                  ))}
                </View>
              )}
              
              {/* BADGE GESTISCI IMMAGINI */}
              <Pressable
                style={styles.manageImagesButton}
                onPress={() => navigation.navigate("GestisciImmaginiStruttura", {
                  strutturaId: struttura._id
                })}
              >
                <Ionicons name="images" size={13} color="white" />
                <Text style={styles.manageImagesText}>
                  {struttura.images!.length}
                </Text>
              </Pressable>
            </View>
          )}

          {/* HEADER STRUTTURA */}
          <View style={styles.strutturaHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.strutturaNome}>{struttura.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={12} color="#666" />
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

          {/* SE NON CI SONO IMMAGINI */}
          {!struttura.images?.length && (
            <Pressable
              style={styles.noImagesPrompt}
              onPress={() => navigation.navigate("GestisciImmaginiStruttura", {
                strutturaId: struttura._id
              })}
            >
              <Ionicons name="images-outline" size={28} color="#ddd" />
              <Text style={styles.noImagesText}>Aggiungi foto della struttura</Text>
              <View style={styles.addPhotoButton}>
                <Ionicons name="add" size={14} color="#2196F3" />
                <Text style={styles.addPhotoText}>Aggiungi foto</Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* KPI CARDS */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: "#EEF6FF" }]}>
              <Ionicons name="grid" size={14} color="#2196F3" />
            </View>
            <Text style={styles.kpiValue}>{campiAttivi.length}/{campi.length}</Text>
            <Text style={styles.kpiLabel}>Campi Attivi/Totali</Text>
          </View>

          <Pressable style={[styles.kpiCard, styles.kpiCardClickable]} onPress={handleGoToBookings}>
            <View style={[styles.kpiIcon, { backgroundColor: "#F3E5F5" }]}>
              <Ionicons name="calendar" size={14} color="#9C27B0" />
            </View>
            <Text style={styles.kpiValue}>{bookingsCount}</Text>
            <Text style={styles.kpiLabel}>Prenotazioni</Text>
            <View style={styles.tapHint}>
              <Ionicons name="arrow-forward" size={9} color="#9C27B0" />
            </View>
          </Pressable>

          <Pressable 
            style={[styles.kpiCard, styles.kpiCardClickable, showHours && styles.kpiCardActive]} 
            onPress={() => setShowHours(!showHours)}
          >
            <View style={[styles.kpiIcon, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="time" size={14} color="#FF9800" />
            </View>
            <Text style={styles.kpiValue}>
              {struttura.openingHours ? "7/7" : "N/A"}
            </Text>
            <Text style={styles.kpiLabel}>Orari</Text>
            <View style={styles.tapHint}>
              <Ionicons 
                name={showHours ? "chevron-up" : "chevron-down"} 
                size={9} 
                color="#FF9800" 
              />
            </View>
          </Pressable>
        </View>

        <Pressable style={styles.statisticsButton} onPress={handleGoToStatistics}>
          <Ionicons name="stats-chart" size={16} color="white" />
          <Text style={styles.statisticsButtonText}>Vai alle statistiche di questa struttura</Text>
          <Ionicons name="chevron-forward" size={16} color="white" />
        </Pressable>

        {/* SEZIONE ORARI (visibile solo se showHours è true) */}
        {showHours && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="time" size={18} color="#FF9800" />
                <Text style={styles.sectionTitle}>Orari di apertura</Text>
              </View>
              <Pressable
                style={styles.editHoursButton}
                onPress={() =>
                  navigation.navigate("ModificaStruttura", {
                    strutturaId,
                    scrollTo: "openingHours",
                  })
                }
              >
                <Ionicons name="create-outline" size={13} color="#FF9800" />
                <Text style={styles.editHoursText}>Modifica</Text>
              </Pressable>
            </View>

          {!struttura.openingHours ? (
            <View style={styles.emptyCard}>
              <Ionicons name="time-outline" size={42} color="#ddd" />
              <Text style={styles.emptyText}>Nessun orario configurato</Text>
              <Pressable
                style={[styles.addButton, { backgroundColor: "#FF9800" }]}
                onPress={() => navigation.navigate("ModificaStruttura", { strutturaId })}
              >
                <Ionicons name="add" size={16} color="white" />
                <Text style={styles.addButtonText}>Imposta orari</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.hoursCard}>
              {[
                { key: "monday", label: "Lunedì" },
                { key: "tuesday", label: "Martedì" },
                { key: "wednesday", label: "Mercoledì" },
                { key: "thursday", label: "Giovedì" },
                { key: "friday", label: "Venerdì" },
                { key: "saturday", label: "Sabato" },
                { key: "sunday", label: "Domenica" },
              ].map((day, index) => {
                const dayInfo = struttura.openingHours?.[day.key];
                const isClosed = !dayInfo || dayInfo.closed || !dayInfo.slots || dayInfo.slots.length === 0;
                const isLastDay = index === 6;

                // Prendi il primo slot se disponibile
                const firstSlot = dayInfo?.slots?.[0];

                return (
                  <View
                    key={day.key}
                    style={[
                      styles.hourRow,
                      !isLastDay && styles.hourRowBorder,
                    ]}
                  >
                    <View style={styles.dayLabelContainer}>
                      <Text style={styles.dayLabel}>{day.label}</Text>
                    </View>
                    {isClosed ? (
                      <View style={styles.closedBadge}>
                        <Ionicons name="close-circle" size={11} color="#999" />
                        <Text style={styles.closedText}>Chiuso</Text>
                      </View>
                    ) : (
                      <View style={styles.hourRange}>
                        <View style={styles.timeBlock}>
                          <Ionicons name="time-outline" size={11} color="#4CAF50" />
                          <Text style={styles.timeText}>{firstSlot?.open || "N/A"}</Text>
                        </View>
                        <Ionicons name="arrow-forward" size={10} color="#ccc" />
                        <View style={styles.timeBlock}>
                          <Ionicons name="time-outline" size={11} color="#F44336" />
                          <Text style={styles.timeText}>{firstSlot?.close || "N/A"}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
          </View>
        )}

        {/* SEZIONE CAMPI */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="grid" size={18} color="#2196F3" />
              <Text style={styles.sectionTitle}>Campi</Text>
            </View>
            {campi.length > 0 && (
              <Pressable
                style={styles.addButtonSmall}
                onPress={() => navigation.navigate("AggiungiCampo", { strutturaId })}
              >
                <Ionicons name="add" size={14} color="white" />
                <Text style={styles.addButtonTextSmall}>Aggiungi un nuovo campo</Text>
              </Pressable>
            )}
          </View>

          {campi.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="basketball-outline" size={42} color="#ddd" />
              <Text style={styles.emptyText}>Nessun campo disponibile</Text>
              <Pressable
                style={styles.addButton}
                onPress={() => navigation.navigate("AggiungiCampo", { strutturaId })}
              >
                <Ionicons name="add" size={16} color="white" />
                <Text style={styles.addButtonText}>Aggiungi campo</Text>
              </Pressable>
            </View>
          ) : (
            campi.map((campo) => (
              <View key={campo._id} style={styles.campoCard}>
                <View style={styles.campoHeader}>
                  <View style={styles.sportIcon}>
                    {renderSportIcon(campo.sport.code, 18, "#2196F3")}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.campoName}>{campo.name}</Text>
                    <View style={styles.campoMeta}>
                      <View style={styles.sportBadgeRow}>
                        {renderSportIcon(campo.sport.code, 10, "#2196F3")}
                        <Text style={styles.sportBadge}>{campo.sport.name}</Text>
                      </View>
                      <View style={styles.sportBadgeRow}>
                        <Ionicons name="layers-outline" size={10} color="#2196F3" />
                        <Text style={styles.sportBadge}>{normalizeSurfaceName(campo.surface)}</Text>
                      </View>
                      <View style={styles.indoorBadge}>
                        <Ionicons
                          name={campo.indoor ? "business" : "sunny-outline"}
                          size={9}
                          color="#2196F3"
                        />
                        <Text style={styles.indoorText}>
                          {campo.indoor ? "Indoor" : "Outdoor"}
                        </Text>
                      </View>
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
                  <Pressable
                    style={styles.detailsButton}
                    onPress={() => navigation.navigate("DettaglioCampo", { campoId: campo._id })}
                  >
                    <Text style={styles.detailsButtonText}>Dettagli</Text>
                    <Ionicons name="chevron-forward" size={14} color="white" />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f7fa"
  },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
    zIndex: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  refreshButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    padding: 14,
    paddingBottom: 100,
  },

  // STRUTTURA CARD + IMMAGINI
  strutturaCard: {
    backgroundColor: "white",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },

  // 🎠 IMMAGINI
  imageContainer: {
    width: "100%",
    height: 170,
    position: "relative",
  },
  strutturaImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f5f5f5",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
  },
  imageIndicators: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  indicatorActive: {
    backgroundColor: "white",
  },
  manageImagesButton: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  manageImagesText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  
  // NO IMAGES STATE
  noImagesPrompt: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
  },
  noImagesText: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 7,
    marginBottom: 10,
  },
  addPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EEF6FF",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2196F3",
  },

  strutturaHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
  },
  strutturaNome: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: "#E8F5E9",
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#F44336",
  },
  statusDotActive: {
    backgroundColor: "#4CAF50",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#F44336",
  },
  statusTextActive: {
    color: "#4CAF50",
  },

  // KPI ROW
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    position: "relative",
  },
  kpiCardClickable: {
    borderWidth: 1.5,
    borderColor: "#E1BEE7",
    backgroundColor: "#F9F3FA",
  },
  kpiCardActive: {
    borderColor: "#FFB74D",
    backgroundColor: "#FFF8E1",
  },
  kpiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 1,
  },
  kpiLabel: {
    color: "#999",
    fontWeight: "500",
    fontSize: 9,
  },
  tapHint: {
    position: "absolute",
    bottom: 5,
    right: 5,
  },
  statisticsButton: {
    marginBottom: 14,
    backgroundColor: "#2196F3",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  statisticsButtonText: {
    flex: 1,
    marginHorizontal: 8,
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },

  // SECTIONS
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },

  addButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#2196F3",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  addButtonTextSmall: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },

  // EMPTY STATE
  emptyCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyText: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
    marginTop: 6,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },

  // CAMPO CARD
  campoCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  campoHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  sportIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  campoName: {
    fontWeight: "600",
    fontSize: 14,
    color: "#1a1a1a",
    marginBottom: 3,
  },
  campoMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  sportBadge: {
    fontSize: 10,
    color: "#666",
    fontWeight: "600",
  },
  sportBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  indoorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  indoorText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#666",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  statusIndicatorActive: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  statusDotSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#F44336",
  },
  statusDotSmallActive: {
    backgroundColor: "#4CAF50",
  },
  statusTextSmall: {
    fontSize: 9,
    fontWeight: "600",
    color: "#F44336",
  },
  statusTextSmallActive: {
    color: "#4CAF50",
  },
  campoFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#2196F3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  detailsButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },

  // HOURS SECTION
  editHoursButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  editHoursText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF9800",
  },
  hoursCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  hourRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  hourRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  dayLabelContainer: {
    width: 85,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  closedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  closedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#999",
  },
  hourRange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1a1a1a",
  },

  // ERROR
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
});