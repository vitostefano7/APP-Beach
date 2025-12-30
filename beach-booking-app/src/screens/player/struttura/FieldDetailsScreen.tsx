import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState, useContext } from "react";

import API_URL from "../../../config/api";
import { AuthContext } from "../../../context/AuthContext";

import { styles } from "../styles-player/FieldDetailsScreen.styles";
import {
  MONTHS,
  DAYS_SHORT,
  SPORT_LABELS,
  SURFACE_LABELS,
  getAmenitiesDisplay,
  getSportIcon,
  toLocalDateString,
  getMonthStr,
  isPastDate,
  isPastSlot,
} from "../utils-player/FieldDetailsScreen-utils";

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
  surface: "sand" | "hardcourt" | "grass" | "pvc" | "cement";
  indoor: boolean;
  pricePerHour: number;
  maxPlayers: number;
  isActive: boolean;
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
  const [selectedDuration, setSelectedDuration] = useState<Record<string, number>>({});
  const [isFavorite, setIsFavorite] = useState(false);

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

    if (token) loadFavoriteStatus();
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

  const toggleFavorite = async () => {
    if (!token) return;

    const wasFavorite = isFavorite;
    setIsFavorite(!wasFavorite);

    try {
      const url = `${API_URL}/users/preferences/favorites/${struttura._id}`;
      const res = await fetch(url, {
        method: wasFavorite ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setIsFavorite(wasFavorite);
      }
    } catch (error) {
      setIsFavorite(wasFavorite);
    }
  };

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

  const toggleCampo = (campoId: string) => {
    const isExpanding = expandedCampoId !== campoId;
    setExpandedCampoId(isExpanding ? campoId : null);

    if (isExpanding && !calendars[campoId]) {
      loadCalendar(campoId, currentMonths[campoId] || new Date());
    }
  };

  const changeMonth = (campoId: string, direction: 1 | -1) => {
    const currentMonth = currentMonths[campoId] || new Date();
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);

    setCurrentMonths((prev) => ({ ...prev, [campoId]: newMonth }));
    loadCalendar(campoId, newMonth);

    setSelectedDate((prev) => ({ ...prev, [campoId]: "" }));
    setSelectedSlot((prev) => ({ ...prev, [campoId]: "" }));
    setSelectedDuration((prev) => ({ ...prev, [campoId]: 0 }));
  };

  /**
   * Verifica se uno slot ha disponibilità consecutiva per la durata richiesta
   */
  const hasConsecutiveAvailability = (
    slots: Slot[],
    startIndex: number,
    durationHours: number
  ): boolean => {
    const slotsNeeded = durationHours * 2; // 1h = 2 slot, 1.5h = 3 slot

    if (startIndex + slotsNeeded > slots.length) {
      return false;
    }

    for (let i = 0; i < slotsNeeded; i++) {
      const slot = slots[startIndex + i];
      if (!slot || !slot.enabled) {
        return false;
      }
    }

    return true;
  };

  /**
   * Filtra gli slot mostrando solo quelli che hanno disponibilità consecutiva
   */
  const getAvailableSlots = (
    slots: Slot[],
    durationHours: number,
    dateStr: string
  ): Slot[] => {
    return slots.filter((slot, index) => {
      if (isPastSlot(dateStr, slot.time)) return false;
      if (!slot.enabled) return false;
      return hasConsecutiveAvailability(slots, index, durationHours);
    });
  };

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

  const images = useMemo(() => {
    return struttura.images?.length > 0 ? struttura.images : ["https://picsum.photos/600/400"];
  }, [struttura.images]);

  const todayStr = useMemo(() => toLocalDateString(new Date()), []);

  const activeAmenities = useMemo(() => {
    if (!struttura.amenities) return [];

    if (Array.isArray(struttura.amenities)) {
      return struttura.amenities;
    }

    return Object.entries(struttura.amenities)
      .filter(([_, value]) => value === true)
      .map(([key]) => key);
  }, [struttura.amenities]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
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

          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>

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

        {activeAmenities.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Servizi disponibili</Text>
            </View>

            <View style={styles.amenitiesGrid}>
              {getAmenitiesDisplay(activeAmenities).map(({ key, label, icon }) => (
                <View key={key} style={styles.amenityCard}>
                  <View style={styles.amenityIcon}>
                    <Ionicons name={icon as any} size={20} color="#2196F3" />
                  </View>
                  <Text style={styles.amenityLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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

                {isExpanded && (
                  <View style={styles.calendarContainer}>
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
                                      setSelectedDuration((prev) => ({ ...prev, [campo._id]: 0 }));
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
                                  setSelectedDuration((prev) => ({ ...prev, [campo._id]: 0 }));
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
                                {/* STEP 1: Selezione Durata */}
                                {!selectedDuration[campo._id] ? (
                                  <View style={styles.durationSelection}>
                                    <Text style={styles.durationTitle}>
                                      ⏱️ Seleziona la durata della partita
                                    </Text>
                                    <Text style={styles.durationSubtitle}>
                                      Scegli per quanto tempo vuoi prenotare il campo
                                    </Text>

                                    <View style={styles.durationButtons}>
                                      <Pressable
                                        style={styles.durationCard}
                                        onPress={() => {
                                          setSelectedDuration((prev) => ({ ...prev, [campo._id]: 1 }));
                                        }}
                                      >
                                        <View style={styles.durationCardHeader}>
                                          <Ionicons name="time" size={24} color="#2196F3" />
                                          <View style={styles.durationBadge}>
                                            <Text style={styles.durationBadgeText}>Popolare</Text>
                                          </View>
                                        </View>
                                        <Text style={styles.durationCardTitle}>1 Ora</Text>
                                        <Text style={styles.durationCardSubtitle}>Partita standard</Text>
                                        <View style={styles.durationCardPrice}>
                                          <Text style={styles.durationCardPriceAmount}>
                                            €{campo.pricePerHour}
                                          </Text>
                                          <Text style={styles.durationCardPriceLabel}>/ora</Text>
                                        </View>
                                        <View style={styles.durationCardFooter}>
                                          <Ionicons name="arrow-forward" size={16} color="#2196F3" />
                                        </View>
                                      </Pressable>

                                      <Pressable
                                        style={styles.durationCard}
                                        onPress={() => {
                                          setSelectedDuration((prev) => ({ ...prev, [campo._id]: 1.5 }));
                                        }}
                                      >
                                        <View style={styles.durationCardHeader}>
                                          <Ionicons name="time" size={24} color="#FF9800" />
                                        </View>
                                        <Text style={styles.durationCardTitle}>1h 30m</Text>
                                        <Text style={styles.durationCardSubtitle}>Partita lunga</Text>
                                        <View style={styles.durationCardPrice}>
                                          <Text style={styles.durationCardPriceAmount}>
                                            €{(campo.pricePerHour * 1.5).toFixed(2)}
                                          </Text>
                                          <Text style={styles.durationCardPriceLabel}>/1.5h</Text>
                                        </View>
                                        <View style={styles.durationCardFooter}>
                                          <Ionicons name="arrow-forward" size={16} color="#FF9800" />
                                        </View>
                                      </Pressable>
                                    </View>
                                  </View>
                                ) : (
                                  <>
                                    {/* STEP 2: Mostra Durata Selezionata */}
                                    <View style={styles.selectedDurationBanner}>
                                      <View style={styles.selectedDurationLeft}>
                                        <Ionicons name="time" size={20} color="#2196F3" />
                                        <Text style={styles.selectedDurationText}>
                                          Durata: {selectedDuration[campo._id] === 1 ? "1 ora" : "1 ora e 30 minuti"}
                                        </Text>
                                      </View>
                                      <Pressable
                                        onPress={() => {
                                          setSelectedDuration((prev) => ({ ...prev, [campo._id]: 0 }));
                                          setSelectedSlot((prev) => ({ ...prev, [campo._id]: "" }));
                                        }}
                                        style={styles.changeDurationBtn}
                                      >
                                        <Text style={styles.changeDurationText}>Cambia</Text>
                                      </Pressable>
                                    </View>

                                    {/* STEP 3: Mostra Solo Slot Disponibili */}
                                    <>
                                      {(() => {
                                        const availableSlots = getAvailableSlots(
                                          selectedDayData.slots,
                                          selectedDuration[campo._id],
                                          selectedDateStr
                                        );

                                        if (availableSlots.length === 0) {
                                          return (
                                            <View style={styles.noSlotsBox}>
                                              <Ionicons name="sad-outline" size={48} color="#FF9800" />
                                              <Text style={styles.noSlotsTitle}>
                                                Nessuno slot disponibile
                                              </Text>
                                              <Text style={styles.noSlotsText}>
                                                Non ci sono slot consecutivi disponibili per{" "}
                                                {selectedDuration[campo._id] === 1 ? "1 ora" : "1 ora e 30 minuti"}.
                                                {"\n"}Prova con una durata diversa o scegli un altro giorno.
                                              </Text>
                                              <Pressable
                                                style={styles.changeDurationBtn2}
                                                onPress={() => {
                                                  setSelectedDuration((prev) => ({ ...prev, [campo._id]: 0 }));
                                                }}
                                              >
                                                <Text style={styles.changeDurationText2}>
                                                  Cambia Durata
                                                </Text>
                                              </Pressable>
                                            </View>
                                          );
                                        }

                                        return (
                                          <>
                                            <Text style={styles.selectSlotHint}>
                                              Seleziona l'orario di inizio ({availableSlots.length} disponibili)
                                            </Text>

                                            <View style={styles.slotsGrid}>
                                              {availableSlots.map((slot, i) => {
                                                const isSlotSelected = selectedSlot[campo._id] === slot.time;

                                                // Calcola orario di fine
                                                const [h, m] = slot.time.split(":").map(Number);
                                                const totalMinutes = h * 60 + m + (selectedDuration[campo._id] * 60);
                                                const endH = Math.floor(totalMinutes / 60);
                                                const endM = totalMinutes % 60;
                                                const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

                                                return (
                                                  <Pressable
                                                    key={`${selectedDateStr}-${slot.time}-${i}`}
                                                    style={[
                                                      styles.slotChip,
                                                      styles.slotAvailable,
                                                      isSlotSelected && styles.slotSelected,
                                                    ]}
                                                    onPress={() => {
                                                      setSelectedSlot((prev) => ({
                                                        ...prev,
                                                        [campo._id]: isSlotSelected ? "" : slot.time,
                                                      }));
                                                    }}
                                                  >
                                                    <Ionicons
                                                      name={isSlotSelected ? "checkmark-circle" : "time-outline"}
                                                      size={14}
                                                      color={isSlotSelected ? "white" : "#4CAF50"}
                                                    />
                                                    <View style={styles.slotTimeContainer}>
                                                      <Text
                                                        style={[
                                                          styles.slotTime,
                                                          isSlotSelected && styles.slotTimeSelected,
                                                        ]}
                                                      >
                                                        {slot.time}
                                                      </Text>
                                                      <Text
                                                        style={[
                                                          styles.slotEndTime,
                                                          isSlotSelected && styles.slotEndTimeSelected,
                                                        ]}
                                                      >
                                                        → {endTime}
                                                      </Text>
                                                    </View>
                                                  </Pressable>
                                                );
                                              })}
                                            </View>

                                            {selectedSlot[campo._id] && (
                                              <Pressable
                                                style={styles.prenotaBtn}
                                                onPress={() => {
                                                  const [h, m] = selectedSlot[campo._id].split(":").map(Number);
                                                  const totalMinutes = h * 60 + m + (selectedDuration[campo._id] * 60);
                                                  const endH = Math.floor(totalMinutes / 60);
                                                  const endM = totalMinutes % 60;
                                                  const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

                                                  navigation.navigate("ConfermaPrenotazione", {
                                                    campoId: campo._id,
                                                    campoName: campo.name,
                                                    strutturaName: struttura.name,
                                                    sport: campo.sport,
                                                    date: selectedDateStr,
                                                    startTime: selectedSlot[campo._id],
                                                    endTime: endTime,
                                                    duration: selectedDuration[campo._id],
                                                    price: campo.pricePerHour * selectedDuration[campo._id],
                                                  });
                                                }}
                                              >
                                                <View style={styles.prenotaBtnLeft}>
                                                  <Ionicons name="calendar" size={20} color="white" />
                                                  <View>
                                                    <Text style={styles.prenotaBtnText}>Prenota ora</Text>
                                                    <Text style={styles.prenotaBtnTime}>
                                                      {selectedSlot[campo._id]} • {selectedDuration[campo._id] === 1 ? "1h" : "1h 30m"}
                                                    </Text>
                                                  </View>
                                                </View>
                                                <Text style={styles.prenotaBtnPrice}>
                                                  €{(campo.pricePerHour * selectedDuration[campo._id]).toFixed(2)}
                                                </Text>
                                              </Pressable>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </>
                                  </>
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

          <Pressable style={styles.openMapsBtn}>
            <Ionicons name="navigate" size={20} color="#2196F3" />
            <Text style={styles.openMapsBtnText}>Apri in Google Maps</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}