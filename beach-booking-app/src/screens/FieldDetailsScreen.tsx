import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState, useContext } from "react";

import API_URL from "../config/api";
import { AuthContext } from "../context/AuthContext";

const { width } = Dimensions.get("window");

/* =========================
   TYPES
========================= */
type Slot = {
  time: string;
  enabled: boolean;
  _id?: string;
};

type CalendarDay = {
  _id: string;
  campo: string;
  date: string;
  slots: Slot[];
  isClosed?: boolean;
};

type Campo = {
  _id: string;
  name: string;
  sport: "beach_volley" | "padel" | "tennis";
  surface: "sand" | "hardcourt" | "grass";
  indoor: boolean;
  pricePerHour: number;
  maxPlayers: number;
  isActive: boolean;
};

const MONTHS = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
const DAYS_SHORT = ["D", "L", "M", "M", "G", "V", "S"];

const SPORT_LABELS: Record<string, string> = {
  beach_volley: "Beach Volley",
  padel: "Padel",
  tennis: "Tennis",
};

const SURFACE_LABELS: Record<string, string> = {
  sand: "Sabbia",
  hardcourt: "Cemento",
  grass: "Erba",
};

/* =========================
   DATE UTILS
========================= */
const toLocalDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getMonthStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

export default function FieldDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { struttura } = route.params ?? {};
  const { token } = useContext(AuthContext);

  const [campi, setCampi] = useState<Campo[]>([]);
  const [expandedCampoId, setExpandedCampoId] = useState<string | null>(null);

  const [calendars, setCalendars] = useState<Record<string, CalendarDay[]>>({});
  const [loadingCalendars, setLoadingCalendars] = useState<Record<string, boolean>>({});
  const [currentMonths, setCurrentMonths] = useState<Record<string, Date>>({});

  const [selectedDate, setSelectedDate] = useState<Record<string, string>>({});
  const [selectedSlot, setSelectedSlot] = useState<Record<string, string>>({});

  // ✅ Stato preferito
  const [isFavorite, setIsFavorite] = useState(false);

  /* =========================
     GUARD
  ========================= */
  if (!struttura) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
          <Text style={styles.errorText}>Struttura non trovata</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* =========================
     FETCH CAMPI & PREFERITI
  ========================= */
  useEffect(() => {
    fetch(`${API_URL}/campi/struttura/${struttura._id}`)
      .then((res) => res.json())
      .then((data) => {
        const campiData = Array.isArray(data) ? data : [];
        setCampi(campiData);

        const initialMonths: Record<string, Date> = {};
        campiData.forEach((campo) => {
          initialMonths[campo._id] = new Date();
        });
        setCurrentMonths(initialMonths);
      })
      .catch(() => setCampi([]));

    // Carica stato preferito
    if (token) {
      loadFavoriteStatus();
    }
  }, [struttura._id, token]);

  const loadFavoriteStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/users/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const prefs = await res.json();
        const isFav = prefs.favoriteStrutture?.includes(struttura._id) || false;
        setIsFavorite(isFav);
      }
    } catch (error) {
      console.error("Errore caricamento preferiti:", error);
    }
  };

  /* =========================
     TOGGLE PREFERITO
  ========================= */
  const toggleFavorite = async () => {
    if (!token) return;

    const wasFavorite = isFavorite;

    // Optimistic update
    setIsFavorite(!wasFavorite);

    try {
      const url = wasFavorite
        ? `${API_URL}/users/preferences/favorites/${struttura._id}`
        : `${API_URL}/users/preferences/favorites/${struttura._id}`;

      const res = await fetch(url, {
        method: wasFavorite ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Rollback on error
        setIsFavorite(wasFavorite);
        console.error("Errore toggle preferito");
      }
    } catch (error) {
      // Rollback on error
      setIsFavorite(wasFavorite);
      console.error("Errore toggle preferito:", error);
    }
  };

  /* =========================
     FETCH CALENDARIO
  ========================= */
  const loadCalendar = async (campoId: string, month: Date) => {
    try {
      setLoadingCalendars((prev) => ({ ...prev, [campoId]: true }));

      const monthStr = getMonthStr(month);
      const res = await fetch(`${API_URL}/campi/${campoId}/calendar?month=${monthStr}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setCalendars((prev) => ({ ...prev, [campoId]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error("Errore calendario:", err);
      setCalendars((prev) => ({ ...prev, [campoId]: [] }));
    } finally {
      setLoadingCalendars((prev) => ({ ...prev, [campoId]: false }));
    }
  };

  /* =========================
     TOGGLE CAMPO
  ========================= */
  const toggleCampo = (campoId: string) => {
    const isExpanding = expandedCampoId !== campoId;
    setExpandedCampoId(isExpanding ? campoId : null);

    if (isExpanding && !calendars[campoId]) {
      loadCalendar(campoId, currentMonths[campoId] || new Date());
    }
  };

  /* =========================
     CAMBIO MESE
  ========================= */
  const changeMonth = (campoId: string, direction: 1 | -1) => {
    const currentMonth = currentMonths[campoId] || new Date();
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);

    setCurrentMonths((prev) => ({ ...prev, [campoId]: newMonth }));
    loadCalendar(campoId, newMonth);

    setSelectedDate((prev) => ({ ...prev, [campoId]: "" }));
    setSelectedSlot((prev) => ({ ...prev, [campoId]: "" }));
  };

  /* =========================
     PRENOTA SLOT
  ========================= */
  const handlePrenota = (campo: Campo, date: string, time: string) => {
    navigation.navigate("ConfermaPrenotazione", {
      campoId: campo._id,
      campoName: campo.name,
      strutturaName: struttura.name,
      sport: campo.sport,
      date,
      startTime: time,
      price: campo.pricePerHour,
    });
  };

  /* =========================
     CALENDAR UTILS
  ========================= */
  const getDaysInMonth = (campoId: string) => {
    const currentMonth = currentMonths[campoId];
    if (!currentMonth) return [];

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  const getDayData = (campoId: string, date: Date | null): CalendarDay | null => {
    if (!date) return null;

    const dateStr = toLocalDateString(date);
    const calendar = calendars[campoId] || [];

    return calendar.find((d) => d.date === dateStr) || null;
  };

  const getDayStatus = (dayData: CalendarDay | null) => {
    if (!dayData) return "unknown";
    if (dayData.isClosed || dayData.slots.length === 0) return "closed";

    const enabled = dayData.slots.filter((s) => s.enabled).length;
    const total = dayData.slots.length;

    if (enabled === 0) return "full";
    if (enabled === total) return "available";
    return "partial";
  };

  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate < today;
  };

  // ✅ Verifica se uno slot è nel passato
  const isPastSlot = (dateStr: string, timeStr: string): boolean => {
    const now = new Date();
    
    // Parse della data e ora dello slot
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotDate = new Date(dateStr + 'T00:00:00');
    slotDate.setHours(hours, minutes, 0, 0);
    
    // Lo slot è nel passato se è prima di adesso
    return slotDate < now;
  };

  /* =========================
     HELPERS
  ========================= */
  const getSportIcon = (sport: string) => {
    switch (sport) {
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

  const getAmenityIcon = (key: string) => {
    switch (key) {
      case "parking":
        return "car";
      case "toilets":
        return "man";
      case "showers":
        return "water";
      case "lockerRoom":
        return "lock-closed";
      case "restaurant":
        return "restaurant";
      case "bar":
        return "cafe";
      default:
        return "checkmark-circle";
    }
  };

  const getAmenityLabel = (key: string) => {
    switch (key) {
      case "parking":
        return "Parcheggio";
      case "toilets":
        return "Servizi igienici";
      case "showers":
        return "Docce";
      case "lockerRoom":
        return "Spogliatoi";
      case "restaurant":
        return "Ristorante";
      case "bar":
        return "Bar";
      default:
        return key;
    }
  };

  /* =========================
     CONST
  ========================= */
  const images = useMemo(() => {
    return struttura.images?.length > 0 ? struttura.images : ["https://picsum.photos/600/400"];
  }, [struttura.images]);

  const todayStr = useMemo(() => toLocalDateString(new Date()), []);

  const activeAmenities = useMemo(() => {
    if (!struttura.amenities) return [];
    return Object.entries(struttura.amenities)
      .filter(([_, value]) => value === true)
      .map(([key]) => key);
  }, [struttura.amenities]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* GALLERY */}
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.gallery}
          >
            {images.map((img: string, i: number) => (
              <Image key={i} source={{ uri: img }} style={styles.galleryImage} />
            ))}
          </ScrollView>

          {/* Back button */}
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>

          {/* ✅ Stellina preferiti */}
          {token && (
            <Pressable style={styles.favoriteButton} onPress={toggleFavorite}>
              <Ionicons
                name={isFavorite ? "star" : "star-outline"}
                size={28}
                color={isFavorite ? "#FFB800" : "white"}
              />
            </Pressable>
          )}
        </View>

        {/* Resto del codice rimane uguale... */}
        {/* INFO STRUTTURA */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{struttura.name}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color="#F44336" />
            <Text style={styles.address}>
              {struttura.location.address}, {struttura.location.city}
            </Text>
          </View>

          {struttura.description && (
            <Text style={styles.description}>{struttura.description}</Text>
          )}
        </View>

        {/* SERVIZI */}
        {activeAmenities.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Servizi disponibili</Text>
            </View>

            <View style={styles.amenitiesGrid}>
              {activeAmenities.map((amenity) => (
                <View key={amenity} style={styles.amenityCard}>
                  <View style={styles.amenityIcon}>
                    <Ionicons name={getAmenityIcon(amenity) as any} size={20} color="#2196F3" />
                  </View>
                  <Text style={styles.amenityLabel}>{getAmenityLabel(amenity)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CAMPI */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Campi disponibili</Text>
          </View>

          {campi.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="basketball-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nessun campo disponibile</Text>
            </View>
          )}

          {campi.map((campo) => {
            const isExpanded = expandedCampoId === campo._id;
            const currentMonth = currentMonths[campo._id] || new Date();
            const isLoading = loadingCalendars[campo._id];
            const calendar = calendars[campo._id] || [];

            const selectedDateStr = selectedDate[campo._id] || "";
            const selectedDayData = selectedDateStr
              ? calendar.find((d) => d.date === selectedDateStr) || null
              : null;

            return (
              <View key={campo._id} style={styles.campoCard}>
                {/* HEADER */}
                <Pressable onPress={() => toggleCampo(campo._id)}>
                  <View style={styles.campoHeader}>
                    <View style={styles.sportIconBox}>
                      <Ionicons
                        name={getSportIcon(campo.sport) as any}
                        size={24}
                        color="#2196F3"
                      />
                    </View>

                    <View style={styles.campoMainInfo}>
                      <Text style={styles.campoName}>{campo.name}</Text>
                      <View style={styles.campoMetaRow}>
                        <View style={styles.sportBadge}>
                          <Text style={styles.sportBadgeText}>
                            {SPORT_LABELS[campo.sport] || campo.sport}
                          </Text>
                        </View>
                        <View style={styles.surfaceBadge}>
                          <Text style={styles.surfaceBadgeText}>
                            {SURFACE_LABELS[campo.surface] || campo.surface}
                          </Text>
                        </View>
                        {campo.indoor && (
                          <View style={styles.indoorBadge}>
                            <Ionicons name="business" size={10} color="#666" />
                            <Text style={styles.indoorText}>Indoor</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.campoDetailsRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="people" size={14} color="#666" />
                          <Text style={styles.detailText}>Max {campo.maxPlayers}</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Ionicons name="cash" size={14} color="#4CAF50" />
                          <Text style={styles.priceText}>€{campo.pricePerHour}/ora</Text>
                        </View>
                      </View>
                    </View>

                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={24}
                      color="#999"
                    />
                  </View>
                </Pressable>

                {/* CALENDARIO */}
                {isExpanded && (
                  <View style={styles.calendarContainer}>
                    {/* SELETTORE MESE */}
                    <View style={styles.monthSelector}>
                      <Pressable
                        onPress={() => changeMonth(campo._id, -1)}
                        style={styles.monthBtn}
                        hitSlop={10}
                      >
                        <Ionicons name="chevron-back" size={22} color="#2196F3" />
                      </Pressable>

                      <Text style={styles.monthText}>
                        {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </Text>

                      <Pressable
                        onPress={() => changeMonth(campo._id, 1)}
                        style={styles.monthBtn}
                        hitSlop={10}
                      >
                        <Ionicons name="chevron-forward" size={22} color="#2196F3" />
                      </Pressable>
                    </View>

                    {/* LEGENDA */}
                    <View style={styles.legend}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: "#4CAF50" }]} />
                        <Text style={styles.legendText}>Libero</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: "#FF9800" }]} />
                        <Text style={styles.legendText}>Parziale</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: "#F44336" }]} />
                        <Text style={styles.legendText}>Pieno</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: "#999" }]} />
                        <Text style={styles.legendText}>Chiuso</Text>
                      </View>
                    </View>

                    {isLoading && (
                      <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#2196F3" />
                        <Text style={styles.loadingText}>Caricamento...</Text>
                      </View>
                    )}

                    {!isLoading && (
                      <>
                        {/* GRIGLIA CALENDARIO */}
                        <View style={styles.calendar}>
                          <View style={styles.weekHeader}>
                            {DAYS_SHORT.map((label, i) => (
                              <Text key={i} style={styles.weekDay}>
                                {label}
                              </Text>
                            ))}
                          </View>

                          <View style={styles.daysGrid}>
                            {getDaysInMonth(campo._id).map((date, index) => {
                              if (!date) {
                                return (
                                  <View key={`empty-${index}`} style={styles.dayCol}>
                                    <View style={styles.dayCellInner} />
                                  </View>
                                );
                              }

                              const dateStr = toLocalDateString(date);
                              const dayData = getDayData(campo._id, date);
                              const status = getDayStatus(dayData);

                              const isSelected = selectedDateStr === dateStr;
                              const isToday = dateStr === todayStr;
                              const isPast = isPastDate(date);

                              return (
                                <View key={dateStr} style={styles.dayCol}>
                                  <Pressable
                                    style={[
                                      styles.dayCellInner,
                                      isSelected && styles.dayCellSelected,
                                      isToday && !isSelected && styles.dayCellToday,
                                      isPast && styles.dayCellPast,
                                    ]}
                                    onPress={() => {
                                      if (isPast) return;
                                      setSelectedDate((prev) => ({
                                        ...prev,
                                        [campo._id]: isSelected ? "" : dateStr,
                                      }));
                                      setSelectedSlot((prev) => ({ ...prev, [campo._id]: "" }));
                                    }}
                                    disabled={isPast}
                                  >
                                    <Text
                                      style={[
                                        styles.dayNumber,
                                        isSelected && styles.dayNumberSelected,
                                        isToday && !isSelected && styles.dayNumberToday,
                                        isPast && styles.dayNumberPast,
                                      ]}
                                    >
                                      {date.getDate()}
                                    </Text>

                                    {dayData && !isPast && (
                                      <View
                                        style={[
                                          styles.dayIndicator,
                                          status === "available" && styles.indicatorAvailable,
                                          status === "partial" && styles.indicatorPartial,
                                          status === "full" && styles.indicatorFull,
                                          status === "closed" && styles.indicatorClosed,
                                        ]}
                                      />
                                    )}
                                  </Pressable>
                                </View>
                              );
                            })}
                          </View>
                        </View>

                        {/* DETTAGLIO GIORNO SELEZIONATO */}
                        {selectedDateStr && selectedDayData && (
                          <View style={styles.dayDetail}>
                            <View style={styles.dayDetailHeader}>
                              <View style={styles.dayDetailHeaderLeft}>
                                <Ionicons name="calendar" size={20} color="#2196F3" />
                                <Text style={styles.dayDetailTitle}>
                                  {new Date(selectedDateStr + "T12:00:00").toLocaleDateString(
                                    "it-IT",
                                    {
                                      weekday: "long",
                                      day: "numeric",
                                      month: "long",
                                    }
                                  )}
                                </Text>
                              </View>

                              <Pressable
                                onPress={() => {
                                  setSelectedDate((prev) => ({ ...prev, [campo._id]: "" }));
                                  setSelectedSlot((prev) => ({ ...prev, [campo._id]: "" }));
                                }}
                                style={styles.closeButton}
                              >
                                <Ionicons name="close" size={20} color="#999" />
                              </Pressable>
                            </View>

                            {selectedDayData.isClosed || selectedDayData.slots.length === 0 ? (
                              <View style={styles.closedBox}>
                                <Ionicons name="lock-closed" size={32} color="#F44336" />
                                <Text style={styles.closedText}>Giorno chiuso</Text>
                              </View>
                            ) : (
                              <>
                                <Text style={styles.selectSlotHint}>
                                  Seleziona un orario disponibile
                                </Text>

                                <View style={styles.slotsGrid}>
                                  {selectedDayData.slots.map((slot, i) => {
                                    const isSlotSelected = selectedSlot[campo._id] === slot.time;
                                    const isSlotPast = isPastSlot(selectedDateStr, slot.time);
                                    const isSlotDisabled = !slot.enabled || isSlotPast;

                                    return (
                                      <Pressable
                                        key={`${selectedDateStr}-${slot.time}-${i}`}
                                        style={[
                                          styles.slotChip,
                                          slot.enabled && !isSlotPast
                                            ? styles.slotAvailable
                                            : styles.slotUnavailable,
                                          isSlotSelected && styles.slotSelected,
                                          isSlotPast && styles.slotPast,
                                        ]}
                                        onPress={() => {
                                          if (isSlotDisabled) return;
                                          setSelectedSlot((prev) => ({
                                            ...prev,
                                            [campo._id]: isSlotSelected ? "" : slot.time,
                                          }));
                                        }}
                                        disabled={isSlotDisabled}
                                      >
                                        <Ionicons
                                          name={
                                            slot.enabled && !isSlotPast
                                              ? isSlotSelected
                                                ? "checkmark-circle"
                                                : "time-outline"
                                              : "close-circle"
                                          }
                                          size={16}
                                          color={
                                            isSlotSelected
                                              ? "white"
                                              : slot.enabled && !isSlotPast
                                              ? "#4CAF50"
                                              : "#999"
                                          }
                                        />
                                        <Text
                                          style={[
                                            styles.slotTime,
                                            isSlotDisabled && styles.slotTimeDisabled,
                                            isSlotSelected && styles.slotTimeSelected,
                                          ]}
                                        >
                                          {slot.time}
                                        </Text>
                                      </Pressable>
                                    );
                                  })}
                                </View>

                                {selectedSlot[campo._id] && (
                                  <Pressable
                                    style={styles.prenotaBtn}
                                    onPress={() =>
                                      handlePrenota(campo, selectedDateStr, selectedSlot[campo._id])
                                    }
                                  >
                                    <View style={styles.prenotaBtnLeft}>
                                      <Ionicons name="calendar" size={20} color="white" />
                                      <View>
                                        <Text style={styles.prenotaBtnText}>Prenota ora</Text>
                                        <Text style={styles.prenotaBtnTime}>
                                          {selectedSlot[campo._id]}
                                        </Text>
                                      </View>
                                    </View>
                                    <Text style={styles.prenotaBtnPrice}>€{campo.pricePerHour}</Text>
                                  </Pressable>
                                )}
                              </>
                            )}
                          </View>
                        )}
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* MAPPA */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="map" size={20} color="#F44336" />
            <Text style={styles.sectionTitle}>Come raggiungerci</Text>
          </View>

          <MapView
            style={styles.map}
            initialRegion={{
              latitude: struttura.location.lat,
              longitude: struttura.location.lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: struttura.location.lat,
                longitude: struttura.location.lng,
              }}
              title={struttura.name}
            />
          </MapView>

          <Pressable
            style={styles.openMapsBtn}
            onPress={() => {
              const address = `${struttura.location.address}, ${struttura.location.city}`;
              const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
              // Linking.openURL(url);
            }}
          >
            <Ionicons name="navigate" size={20} color="#2196F3" />
            <Text style={styles.openMapsBtnText}>Apri in Google Maps</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },

  galleryContainer: {
    position: "relative",
  },
  gallery: {
    height: 300,
  },
  galleryImage: {
    width: width,
    height: 300,
    backgroundColor: "#e9ecef",
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
  
  // ✅ Stellina preferiti
  favoriteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  infoSection: {
    backgroundColor: "white",
    padding: 20,
    marginTop: -24,
    marginHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  address: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  description: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    marginTop: 8,
  },

  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  amenityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
    minWidth: "45%",
  },
  amenityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  amenityLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },

  emptyState: {
    alignItems: "center",
    padding: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#999",
    fontWeight: "500",
  },

  campoCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  campoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sportIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  campoMainInfo: {
    flex: 1,
    gap: 6,
  },
  campoName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  campoMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  sportBadge: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  sportBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2196F3",
  },
  surfaceBadge: {
    backgroundColor: "#FFF3E0",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  surfaceBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F57C00",
  },
  indoorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F5F5F5",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  indoorText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
  },
  campoDetailsRow: {
    flexDirection: "row",
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  priceText: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "700",
  },

  calendarContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },

  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
  },
  monthBtn: {
    padding: 6,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },

  loadingBox: {
    alignItems: "center",
    padding: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  calendar: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#999",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  dayCol: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 3,
  },

  dayCell: {
    flex: 1,
  },

  dayCellInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderRadius: 10,
    backgroundColor: "white",
  },

  dayCellSelected: {
    backgroundColor: "#2196F3",
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  dayCellPast: {
    opacity: 0.3,
  },

  dayNumber: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  dayNumberSelected: {
    color: "white",
    fontWeight: "700",
  },
  dayNumberToday: {
    color: "#2196F3",
    fontWeight: "700",
  },
  dayNumberPast: {
    color: "#999",
  },

  dayIndicator: {
    position: "absolute",
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorAvailable: { backgroundColor: "#4CAF50" },
  indicatorPartial: { backgroundColor: "#FF9800" },
  indicatorFull: { backgroundColor: "#F44336" },
  indicatorClosed: { backgroundColor: "#999" },

  dayDetail: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  dayDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dayDetailHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dayDetailTitle: {
    fontSize: 15,
    fontWeight: "700",
    textTransform: "capitalize",
    color: "#1a1a1a",
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },

  selectSlotHint: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },

  closedBox: {
    padding: 24,
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  closedText: {
    color: "#F44336",
    fontWeight: "700",
    fontSize: 15,
  },

  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    minWidth: 90,
  },
  slotAvailable: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  slotUnavailable: {
    backgroundColor: "#F5F5F5",
    borderColor: "#e9ecef",
  },
  slotPast: {
    opacity: 0.4,
  },
  slotSelected: {
    backgroundColor: "#2196F3",
    borderColor: "#1976D2",
  },
  slotTime: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4CAF50",
  },
  slotTimeDisabled: {
    color: "#999",
  },
  slotTimeSelected: {
    color: "white",
  },

  prenotaBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  prenotaBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  prenotaBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  prenotaBtnTime: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  prenotaBtnPrice: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
  },

  map: {
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
  },
  openMapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "white",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  openMapsBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2196F3",
  },
});