import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  FlatList,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useEffect, useMemo, useState, useContext, useRef } from "react";

import { AuthContext } from "../../../../context/AuthContext";
import { styles } from "../../styles-player/FieldDetailsScreen.styles";
import API_URL from "../../../../config/api";
import { resolveImageUrl } from "../../../../utils/imageUtils";
import OpenMatchCard from "../../dashboard/components/OpenMatchCard";
import SportIcon from "../../../../components/SportIcon";

import {
  MONTHS,
  DAYS_SHORT,
  SPORT_LABELS,
  SURFACE_LABELS,
  getAmenitiesDisplay,
  toLocalDateString,
  getMonthStr,
  isPastDate,
  isPastSlot,
} from "../../utils-player/FieldDetailsScreen-utils";

import {
  calculatePrice,
  getPriceLabel,
  getPriceLabelForDate,
  getPricingLabel,
} from "./pricing/pricing.utils";

import {
  getAvailableSlots,
  getDaysInMonth,
  getDayData,
  getDayStatus,
} from "./calendar/calendar.utils";

import {
  fetchCampiByStruttura,
  fetchCampoById,
  fetchCampoCalendar,
  fetchUserPreferences,
  toggleFavoriteStruttura,
  openStrutturaChat,
} from "./api/fieldDetails.api";

import { Campo, CalendarDay } from "./types/field";

const { width } = Dimensions.get("window");

const DAYS_OF_WEEK = [
  { key: "monday", label: "Lunedì" },
  { key: "tuesday", label: "Martedì" },
  { key: "wednesday", label: "Mercoledì" },
  { key: "thursday", label: "Giovedì" },
  { key: "friday", label: "Venerdì" },
  { key: "saturday", label: "Sabato" },
  { key: "sunday", label: "Domenica" },
];

export default function FieldDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { struttura } = route.params ?? {};
  const { token } = useContext(AuthContext);
  const scrollViewRef = useRef<ScrollView>(null);
  const galleryScrollViewRef = useRef<ScrollView>(null);
  const contentViewRef = useRef<View>(null);
  const dayDetailRefs = useRef<Record<string, View>>({});
  const location = struttura?.location;
  const hasLocation = Boolean(location?.lat && location?.lng);

  const [campi, setCampi] = useState<Campo[]>([]);
  const [expandedCampoId, setExpandedCampoId] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<Record<string, CalendarDay[]>>({});
  const [loadingCalendars, setLoadingCalendars] = useState<Record<string, boolean>>({});
  const [currentMonths, setCurrentMonths] = useState<Record<string, Date>>({});
  const [selectedDate, setSelectedDate] = useState<Record<string, string>>({});
  const [selectedSlot, setSelectedSlot] = useState<Record<string, string>>({});
  const [selectedDuration, setSelectedDuration] = useState<Record<string, number>>({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // ✅ Carousel immagini
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // ✅ Dropdown orari apertura
  const [openingHoursExpanded, setOpeningHoursExpanded] = useState(true);
  
  // ✅ Navigation chips
  const [activeChip, setActiveChip] = useState<'info' | 'campi' | 'partite'>('campi');
  const [openMatches, setOpenMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [sportFilter, setSportFilter] = useState<string | 'all'>('all');

  /* =======================
     INIT
  ======================= */

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!struttura?._id) return;

    // Debug: verifica presenza openingHours
    console.log('=== DEBUG STRUTTURA ===');
    console.log('Struttura ID:', struttura._id);
    console.log('Struttura name:', struttura.name);
    console.log('OpeningHours presente:', !!struttura.openingHours);
    console.log('OpeningHours:', JSON.stringify(struttura.openingHours, null, 2));

    fetchCampiByStruttura(struttura._id)
      .then((data) => {
        setCampi(data);
        const months: Record<string, Date> = {};
        data.forEach((c) => (months[c._id] = new Date()));
        setCurrentMonths(months);
      })
      .catch(() => setCampi([]));

    if (token) {
      fetchUserPreferences(token)
        .then((prefs) =>
          setIsFavorite(prefs.favoriteStrutture?.includes(struttura._id))
        )
        .catch(() => {});
    }
  }, [struttura?._id, token]);

  // Auto-scroll to dayDetail when date is selected
  useEffect(() => {
    console.log('useEffect triggered, selectedDate:', selectedDate);
    Object.keys(selectedDate).forEach(campoId => {
      if (selectedDate[campoId] && dayDetailRefs.current[campoId] && contentViewRef.current) {
        // Delay to ensure layout is stable
        setTimeout(() => {
          dayDetailRefs.current[campoId].measureLayout(
            contentViewRef.current as any,
            (x, y, width, height) => {
              console.log('measureLayout for campo:', campoId, 'y:', y, 'height:', height);
              const targetY = Math.max(0, y - 100);
              console.log('Scrolling to targetY:', targetY);
              scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
            },
            (error) => {
              console.log('measureLayout error:', error);
            }
          );
        }, 150);
      }
    });
  }, [selectedDate]);

  /* =======================
     ACTIONS
  ======================= */

  const loadCalendar = async (campoId: string, month: Date) => {
    try {
      setLoadingCalendars((p) => ({ ...p, [campoId]: true }));
      const data = await fetchCampoCalendar(campoId, getMonthStr(month));
      setCalendars((p) => ({ ...p, [campoId]: data }));
    } finally {
      setLoadingCalendars((p) => ({ ...p, [campoId]: false }));
    }
  };

  const toggleCampo = async (campoId: string) => {
    const expanding = expandedCampoId !== campoId;
    setExpandedCampoId(expanding ? campoId : null);

    if (!expanding) return;

    try {
      const campo = await fetchCampoById(campoId);
      setCampi((prev) =>
        prev.map((c) => (c._id === campoId ? campo : c))
      );
    } catch {}

    if (!calendars[campoId]) {
      loadCalendar(campoId, currentMonths[campoId] ?? new Date());
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchCampiByStruttura(struttura._id);
      setCampi(data);

      if (expandedCampoId) {
        await loadCalendar(
          expandedCampoId,
          currentMonths[expandedCampoId] ?? new Date()
        );
      }
    } finally {
      setRefreshing(false);
    }
  };

  const changeMonth = (campoId: string, direction: 1 | -1) => {
    const currentMonth = currentMonths[campoId] || new Date();
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + direction,
      1
    );

    setCurrentMonths((prev) => ({ ...prev, [campoId]: newMonth }));
    loadCalendar(campoId, newMonth);

    setSelectedDate((prev) => ({ ...prev, [campoId]: "" }));
    setSelectedSlot((prev) => ({ ...prev, [campoId]: "" }));
    setSelectedDuration((prev) => ({ ...prev, [campoId]: 0 }));
  };

  const startChat = async () => {
    if (!token) {
      alert("Effettua il login per chattare con la struttura");
      return;
    }

    try {
      const conversation = await openStrutturaChat(struttura._id, token);
      navigation.navigate("Chat", {
        conversationId: conversation._id,
        strutturaName: struttura.name,
        struttura: struttura,
      });
    } catch (error) {
      alert("Impossibile aprire la chat. Riprova più tardi.");
    }
  };

  const fetchOpenMatches = async () => {
    if (!token) return;
    
    try {
      setLoadingMatches(true);
      const res = await fetch(`${API_URL}/matches?status=open`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const rawMatches = Array.isArray(data) ? data : Array.isArray(data.matches) ? data.matches : [];
        
        const now = new Date();
        
        // Filter by struttura and availability
        const filtered = rawMatches.filter((match: any) => {
          // Filter by struttura
          if (match.booking?.campo?.struttura?._id !== struttura._id) {
            return false;
          }
          
          // Exclude completed, cancelled, full
          if (match.status && ['completed', 'cancelled', 'full'].includes(match.status)) {
            return false;
          }
          
          // Only public matches
          if (match.isPublic === false) {
            return false;
          }

          // Check available spots
          const confirmedPlayers = match.players?.filter((p: any) => p.status === 'confirmed').length || 0;
          const maxPlayers = match.maxPlayers || 0;
          if (maxPlayers <= 0 || confirmedPlayers >= maxPlayers) {
            return false;
          }

          // Exclude matches starting soon (< 30 minutes)
          const start = match.booking?.date && match.booking?.startTime
            ? new Date(`${match.booking.date}T${match.booking.startTime}`)
            : null;
          if (start && start.getTime() - now.getTime() <= 30 * 60 * 1000) {
            return false;
          }

          return true;
        });

        setOpenMatches(filtered.slice(0, 10)); // Limit to 10
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoadingMatches(false);
    }
  };

  /* =======================
     MEMO
  ======================= */

  const images = useMemo(
    () =>
      struttura?.images?.length
        ? struttura.images.map((img: string) => resolveImageUrl(img))
        : ["https://picsum.photos/600/400"],
    [struttura?.images]
  );

  // ✅ Fetch open matches when switching to partite chip
  useEffect(() => {
    if (activeChip === 'partite' && openMatches.length === 0 && !loadingMatches) {
      fetchOpenMatches();
    }
  }, [activeChip]);

  const todayStr = useMemo(() => toLocalDateString(new Date()), []);

  const activeAmenities = useMemo(() => {
    if (!struttura?.amenities) return [];
    if (Array.isArray(struttura.amenities)) return struttura.amenities;

    return Object.entries(struttura.amenities)
      .filter(([, v]) => v === true)
      .map(([k]) => k);
  }, [struttura?.amenities]);

  /* =======================
     RENDER
  ======================= */

  if (!struttura) {
    return (
      <View style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
          <Text style={styles.errorText}>Struttura non trovata</Text>
        </View>
      </View>
    );
  }

  const handleJoinMatch = async (match: any) => {
    const bookingId = match.booking?._id;
    if (!bookingId) {
      Alert.alert("Errore", "ID prenotazione non disponibile");
      return;
    }
    navigation.navigate('DettaglioPrenotazione', { bookingId, openJoinModal: true });
  };

  return (
    <View style={styles.safe}>
      <ScrollView
        ref={scrollViewRef}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2196F3"]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View ref={contentViewRef} collapsable={false}>
        {/* GALLERY CON CAROUSEL */}
        <View style={styles.galleryContainer}>
          <ScrollView
            ref={galleryScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.gallery}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(
                event.nativeEvent.contentOffset.x / width
              );
              setCurrentImageIndex(newIndex);
            }}
          >
            {images.map((img, i) => (
              <Image
                key={i}
                source={{ uri: img }}
                style={styles.galleryImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Indicatori pagina */}
          {images.length > 1 && (
            <View style={styles.pagination}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.paginationDot,
                    i === currentImageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Bottone indietro */}
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>

          {/* Bottone preferiti */}
          {token && (
            <Pressable
              style={styles.favoriteButton}
              onPress={() =>
                toggleFavoriteStruttura(struttura._id, token, isFavorite)
                  .then(() => setIsFavorite((p) => !p))
                  .catch(() => {})
              }
            >
              <Ionicons
                name={isFavorite ? "star" : "star-outline"}
                size={28}
                color={isFavorite ? "#FFB800" : "white"}
              />
            </Pressable>
          )}

          {/* Bottone community */}
          {token && (
            <Pressable
              style={styles.communityButton}
              onPress={() => navigation.navigate("StrutturaDetail", { strutturaId: struttura._id })}
            >
              <Ionicons name="people" size={24} color="white" />
            </Pressable>
          )}
        </View>

        {/* INFO SECTION */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.title}>{struttura.name}</Text>
            {token && (
              <Pressable style={styles.chatButtonCompact} onPress={startChat}>
                <Ionicons name="chatbubble-outline" size={24} color="#2196F3" />
              </Pressable>
            )}
          </View>
        </View>



        {/* NAVIGATION CHIPS */}
        <View style={styles.chipsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            <Pressable
              style={[
                styles.chip,
                activeChip === 'info' && styles.chipActive,
              ]}
              onPress={() => setActiveChip('info')}
            >
              <Ionicons
                name="information-circle"
                size={16}
                color={activeChip === 'info' ? 'white' : '#2196F3'}
              />
              <Text
                style={[
                  styles.chipText,
                  activeChip === 'info' && styles.chipTextActive,
                ]}
              >
                Informazioni
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.chip,
                activeChip === 'campi' && styles.chipActive,
              ]}
              onPress={() => setActiveChip('campi')}
            >
              <Ionicons
                name="list"
                size={16}
                color={activeChip === 'campi' ? 'white' : '#2196F3'}
              />
              <Text
                style={[
                  styles.chipText,
                  activeChip === 'campi' && styles.chipTextActive,
                ]}
              >
                Prenota Campo
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.chip,
                activeChip === 'partite' && styles.chipActive,
              ]}
              onPress={() => setActiveChip('partite')}
            >
              <Ionicons
                name="people"
                size={16}
                color={activeChip === 'partite' ? 'white' : '#2196F3'}
              />
              <Text
                style={[
                  styles.chipText,
                  activeChip === 'partite' && styles.chipTextActive,
                ]}
              >
                Partite Aperte
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* INFORMAZIONI SECTION */}
        {activeChip === 'info' && (
          <View style={styles.infoCardsContainer}>
            {/* BASIC INFO - NAME */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🏢 Nome struttura</Text>
              <Text style={styles.title}>{struttura.name}</Text>
            </View>

            {/* MAP */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Indirizzo</Text>
          <Text style={styles.address}>
                {location?.address && location?.city
                  ? `${location.address}, ${location.city}`
                  : "Indirizzo non disponibile"}
              </Text>

          {hasLocation ? (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location!.lat,
                longitude: location!.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: location!.lat,
                  longitude: location!.lng,
                }}
                title={struttura.name}
              />
            </MapView>
          ) : (
            <Text style={styles.emptyText}>Posizione non disponibile</Text>
          )}

          <Pressable style={styles.openMapsBtn} disabled={!hasLocation}>
            <Ionicons name="navigate" size={20} color="#2196F3" />
            <Text style={styles.openMapsBtnText}>Apri in Google Maps</Text>
          </Pressable>
        </View>

            {/* BASIC INFO - DESCRIPTION */}
            {struttura.description && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📝 Descrizione</Text>
                <Text style={styles.description}>{struttura.description}</Text>
              </View>
            )}

            {/* OPENING HOURS */}
            <View style={styles.card}>
              <Pressable 
                style={styles.dropdownHeader}
                onPress={() => setOpeningHoursExpanded(!openingHoursExpanded)}
              >
                <Text style={styles.cardTitle}>🕒 Orari di apertura</Text>
                <Ionicons 
                  name={openingHoursExpanded ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color="#666" 
                />
              </Pressable>

              {openingHoursExpanded && (
                <View style={styles.openingHoursContainer}>
                  {struttura.openingHours ? (
                    DAYS_OF_WEEK.map(({ key, label }) => {
                      const dayHours = struttura.openingHours[key];
                      if (!dayHours) return null;
                      const isClosed = dayHours.closed === true;

                      // Gli orari sono dentro un array "slots"
                      const slots = dayHours.slots || [];
                      const hasSlots = slots.length > 0;

                      return (
                        <View key={key} style={styles.openingHourRow}>
                          <Text style={styles.dayName}>{label}</Text>
                          {isClosed || !hasSlots ? (
                            <Text style={styles.closedLabel}>Chiuso</Text>
                          ) : (
                            <View style={styles.slotsContainer}>
                              {slots.map((slot: any, index: number) => (
                                <Text key={index} style={styles.hoursLabel}>
                                  {slot.open} - {slot.close}
                                </Text>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.emptyText}>Orari non disponibili</Text>
                  )}
                </View>
              )}
            </View>

        {/* AMENITIES */}
        {activeAmenities.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✅ Servizi disponibili</Text>

            <View style={styles.amenitiesGrid}>
              {getAmenitiesDisplay(activeAmenities).map(
                ({ key, label, icon }) => (
                  <View key={key} style={styles.amenityCard}>
                    <View style={styles.amenityIcon}>
                      <Ionicons name={icon as any} size={16} color="#2196F3" />
                    </View>
                    <Text style={styles.amenityLabel}>{label}</Text>
                  </View>
                )
              )}
            </View>
          </View>
        )}

        
          </View>
        )}

        {/* CAMPI DISPONIBILI */}
        {activeChip === 'campi' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Campi disponibili</Text>
          </View>

          {/* FILTRI SPORT */}
          {campi.length > 0 && (
            <View style={styles.sportFiltersContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sportFiltersScroll}
              >
                <Pressable
                  style={[
                    styles.sportFilterChip,
                    sportFilter === 'all' && styles.sportFilterChipActive,
                  ]}
                  onPress={() => setSportFilter('all')}
                >
                  <Text
                    style={[
                      styles.sportFilterText,
                      sportFilter === 'all' && styles.sportFilterTextActive,
                    ]}
                  >
                    Tutti
                  </Text>
                </Pressable>
                {Array.from(new Set(campi.map(c => c.sport))).map((sport) => (
                  <Pressable
                    key={sport}
                    style={[
                      styles.sportFilterChip,
                      sportFilter === sport && styles.sportFilterChipActive,
                    ]}
                    onPress={() => setSportFilter(sport)}
                  >
                    <SportIcon
                      sport={sport}
                      size={14}
                      color={sportFilter === sport ? 'white' : '#2196F3'}
                    />
                    <Text
                      style={[
                        styles.sportFilterText,
                        sportFilter === sport && styles.sportFilterTextActive,
                      ]}
                    >
                      {SPORT_LABELS[sport] || sport}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {campi.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="basketball-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nessun campo disponibile</Text>
            </View>
          )}

          {campi
            .filter(campo => sportFilter === 'all' || campo.sport === sportFilter)
            .map((campo) => {
            const isExpanded = expandedCampoId === campo._id;
            const currentMonth = currentMonths[campo._id] || new Date();
            const isLoading = loadingCalendars[campo._id];
            const calendar = calendars[campo._id] || [];

            const selectedDateStr = selectedDate[campo._id] || "";
            const selectedDayData = selectedDateStr
              ? getDayData(calendar, new Date(selectedDateStr + "T12:00:00"))
              : null;

            // Helpers for split pricing (used in duration cards, slot labels and button)
            const isVolleyCampo = campo.sport === "beach_volley" || campo.sport === "volley";
            const canSplitCampo = struttura?.isCostSplittingEnabled === true;
            const playerPricingCampo = (campo as any).pricingRules?.playerCountPricing;
            const getUnitPrice = (count: number, dur: number) => {
              if (!playerPricingCampo || !playerPricingCampo.prices) return null;
              const m = playerPricingCampo.prices.find((p: any) => p.count === count);
              if (!m) return null;
              return dur === 1 ? m.prices.oneHour : m.prices.oneHourHalf;
            };

            return (
              <View key={campo._id} style={styles.campoCard}>
                {/* CAMPO HEADER */}
                <Pressable onPress={() => toggleCampo(campo._id)}>
                  <View style={styles.campoHeader}>
                    <View style={styles.sportIconBox}>
                      <SportIcon
                        sport={campo.sport}
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
                        <View style={styles.indoorBadge}>
                          <Ionicons name={campo.indoor ? "business" : "sunny"} size={10} color="#666" />
                          <Text style={styles.indoorText}>{campo.indoor ? "Indoor" : "Outdoor"}</Text>
                        </View>
                      </View>

                      <View style={styles.campoDetailsRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="cash" size={14} color="#4CAF50" />
                          <Text style={styles.priceText}>
                            {getPriceLabel(campo, 1)}/ora
                          </Text>
                        </View>
                        {/* Split payment indicator */}
                        {canSplitCampo && (
                          <View style={styles.detailItem}>
                            <Ionicons name="wallet" size={14} color="#FF9800" />
                            <Text style={styles.detailText}>Split Payment</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={24}
                      color="#999"
                    />
                  </View>
                </Pressable>

                {/* CALENDAR EXPANDED */}
                {isExpanded && (
                  <View style={styles.calendarContainer}>
                    {/* Month Selector */}
                    <View style={styles.monthSelector}>
                      <Pressable
                        onPress={() => changeMonth(campo._id, -1)}
                        style={styles.monthBtn}
                        hitSlop={10}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={22}
                          color="#2196F3"
                        />
                      </Pressable>

                      <Text style={styles.monthText}>
                        {MONTHS[currentMonth.getMonth()]}{" "}
                        {currentMonth.getFullYear()}
                      </Text>

                      <Pressable
                        onPress={() => changeMonth(campo._id, 1)}
                        style={styles.monthBtn}
                        hitSlop={10}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={22}
                          color="#2196F3"
                        />
                      </Pressable>
                    </View>

                    {/* Legend */}
                    <View style={styles.legend}>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendDot,
                            { backgroundColor: "#4CAF50" },
                          ]}
                        />
                        <Text style={styles.legendText}>Libero</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendDot,
                            { backgroundColor: "#FF9800" },
                          ]}
                        />
                        <Text style={styles.legendText}>Parziale</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendDot,
                            { backgroundColor: "#F44336" },
                          ]}
                        />
                        <Text style={styles.legendText}>Pieno</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendDot,
                            { backgroundColor: "#999" },
                          ]}
                        />
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
                        {/* Calendar Grid */}
                        <View style={styles.calendar}>
                          <View style={styles.weekHeader}>
                            {DAYS_SHORT.map((label, i) => (
                              <Text key={i} style={styles.weekDay}>
                                {label}
                              </Text>
                            ))}
                          </View>

                          <View style={styles.daysGrid}>
                            {getDaysInMonth(currentMonth).map((date, index) => {
                              if (!date) {
                                return (
                                  <View
                                    key={`empty-${index}`}
                                    style={styles.dayCol}
                                  >
                                    <View style={styles.dayCellInner} />
                                  </View>
                                );
                              }

                              const dateStr = toLocalDateString(date);
                              const dayData = getDayData(calendar, date);
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
                                      isToday &&
                                        !isSelected &&
                                        styles.dayCellToday,
                                      isPast && styles.dayCellPast,
                                    ]}
                                    onPress={() => {
                                      if (isPast) return;
                                      console.log('Selecting date:', dateStr, 'for campo:', campo._id);
                                      setSelectedDate((prev) => ({
                                        ...prev,
                                        [campo._id]: isSelected ? "" : dateStr,
                                      }));
                                      setSelectedSlot((prev) => ({
                                        ...prev,
                                        [campo._id]: "",
                                      }));
                                      setSelectedDuration((prev) => ({
                                        ...prev,
                                        [campo._id]: 0,
                                      }));
                                    }}
                                    disabled={isPast}
                                  >
                                    <Text
                                      style={[
                                        styles.dayNumber,
                                        isSelected && styles.dayNumberSelected,
                                        isToday &&
                                          !isSelected &&
                                          styles.dayNumberToday,
                                        isPast && styles.dayNumberPast,
                                      ]}
                                    >
                                      {date.getDate()}
                                    </Text>

                                    {dayData && !isPast && (
                                      <View
                                        style={[
                                          styles.dayIndicator,
                                          status === "available" &&
                                            styles.indicatorAvailable,
                                          status === "partial" &&
                                            styles.indicatorPartial,
                                          status === "full" &&
                                            styles.indicatorFull,
                                          status === "closed" &&
                                            styles.indicatorClosed,
                                        ]}
                                      />
                                    )}
                                  </Pressable>
                                </View>
                              );
                            })}
                          </View>
                        </View>

                        {/* DAY DETAIL */}
                        {selectedDateStr && selectedDayData && (
                          <View 
                            style={styles.dayDetail}
                            ref={(ref) => { if (ref) dayDetailRefs.current[campo._id] = ref; }}
                          >
                            <View style={styles.dayDetailHeader}>
                              <View style={styles.dayDetailHeaderLeft}>
                                <Ionicons
                                  name="calendar"
                                  size={20}
                                  color="#2196F3"
                                />
                                <Text style={styles.dayDetailTitle}>
                                  {new Date(
                                    selectedDateStr + "T12:00:00"
                                  ).toLocaleDateString("it-IT", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                  })}
                                </Text>
                              </View>

                              <Pressable
                                onPress={() => {
                                  setSelectedDate((prev) => ({
                                    ...prev,
                                    [campo._id]: "",
                                  }));
                                  setSelectedSlot((prev) => ({
                                    ...prev,
                                    [campo._id]: "",
                                  }));
                                  setSelectedDuration((prev) => ({
                                    ...prev,
                                    [campo._id]: 0,
                                  }));
                                }}
                                style={styles.closeButton}
                              >
                                <Ionicons name="close" size={20} color="#999" />
                              </Pressable>
                            </View>

                            {selectedDayData.isClosed ||
                            selectedDayData.slots.length === 0 ? (
                              <View style={styles.closedBox}>
                                <Ionicons
                                  name="lock-closed"
                                  size={32}
                                  color="#F44336"
                                />
                                <Text style={styles.closedText}>
                                  Non disponibile per prenotazioni
                                </Text>
                              </View>
                            ) : (
                              <>
                                {/* DURATION SELECTION */}
                                {!selectedDuration[campo._id] ? (
                                  <View style={styles.durationSelection}>
                                    <Text style={styles.durationTitle}>
                                      ⏱️ Seleziona la durata della partita
                                    </Text>
                                    <Text style={styles.durationSubtitle}>
                                      Scegli per quanto tempo vuoi prenotare il
                                      campo
                                    </Text>

                                    <View style={styles.durationButtons}>
                                      {/* CARD 1 ORA */}
                                      {(() => {
                                        const slots1h = getAvailableSlots(
                                          selectedDayData.slots,
                                          1,
                                          selectedDateStr
                                        );
                                        const priceLabel1h =
                                          getPriceLabelForDate(
                                            campo,
                                            1,
                                            selectedDateStr,
                                            slots1h
                                          );

                                        const isVolleyCard = campo.sport === "beach_volley" || campo.sport === "volley";
                                        const canSplitCard = struttura?.isCostSplittingEnabled === true;
                                        const playerPricingCard = (campo as any).pricingRules?.playerCountPricing;
                                        const unitPrice1h =
                                          isVolleyCard && canSplitCard && playerPricingCard?.enabled
                                            ? (() => {
                                                const m = playerPricingCard.prices?.find((p: any) => p.count === 4);
                                                return m ? m.prices.oneHour : null;
                                              })()
                                            : null;

                                        return (
                                          <Pressable
                                            style={styles.durationCard}
                                            onPress={() => {
                                              setSelectedDuration((prev) => ({
                                                ...prev,
                                                [campo._id]: 1,
                                              }));
                                            }}
                                            disabled={slots1h.length === 0}
                                          >
                                            <View
                                              style={
                                                styles.durationCardHeader
                                              }
                                            >
                                              <Ionicons
                                                name="time"
                                                size={24}
                                                color="#2196F3"
                                              />
                                            </View>
                                            <Text
                                              style={styles.durationCardTitle}
                                            >
                                              1 Ora
                                            </Text>
                                            <Text
                                              style={
                                                styles.durationCardSubtitle
                                              }
                                            >
                                              Partita standard
                                            </Text>
                                            <View
                                              style={styles.durationCardPrice}
                                            >
                                              <Text
                                                style={
                                                  styles.durationCardPriceAmount
                                                }
                                              >
                                                {slots1h.length > 0 ? (
                                                  unitPrice1h != null ? `€${unitPrice1h.toFixed(2)} / gioc.` : priceLabel1h
                                                ) : (
                                                  "Non disponibile"
                                                )}
                                              </Text>
                                            </View>
                                            <View
                                              style={
                                                styles.durationCardFooter
                                              }
                                            >
                                              <Ionicons
                                                name={
                                                  slots1h.length > 0
                                                    ? "arrow-forward"
                                                    : "close-circle"
                                                }
                                                size={16}
                                                color={
                                                  slots1h.length > 0
                                                    ? "#2196F3"
                                                    : "#999"
                                                }
                                              />
                                            </View>
                                          </Pressable>
                                        );
                                      })()}

                                      {/* CARD 1.5 ORE */}
                                      {(() => {
                                        const slots15h = getAvailableSlots(
                                          selectedDayData.slots,
                                          1.5,
                                          selectedDateStr
                                        );
                                        const priceLabel15h =
                                          getPriceLabelForDate(
                                            campo,
                                            1.5,
                                            selectedDateStr,
                                            slots15h
                                          );

                                        return (
                                          <Pressable
                                            style={styles.durationCard}
                                            onPress={() => {
                                              setSelectedDuration((prev) => ({
                                                ...prev,
                                                [campo._id]: 1.5,
                                              }));
                                            }}
                                            disabled={slots15h.length === 0}
                                          >
                                            <View
                                              style={
                                                styles.durationCardHeader
                                              }
                                            >
                                              <Ionicons
                                                name="time"
                                                size={24}
                                                color="#FF9800"
                                              />
                                            </View>
                                            <Text
                                              style={styles.durationCardTitle}
                                            >
                                              1h 30m
                                            </Text>
                                            <Text
                                              style={
                                                styles.durationCardSubtitle
                                              }
                                            >
                                              Partita lunga
                                            </Text>
                                            <View
                                              style={styles.durationCardPrice}
                                            >
                                              <Text
                                                style={
                                                  styles.durationCardPriceAmount
                                                }
                                              >
                                                {slots15h.length > 0 ? (
                                                  (() => {
                                                    const isVolleyCard = campo.sport === "beach_volley" || campo.sport === "volley";
                                                    const canSplitCard = struttura?.isCostSplittingEnabled === true;
                                                    const playerPricingCard = (campo as any).pricingRules?.playerCountPricing;
                                                    const unit = isVolleyCard && canSplitCard && playerPricingCard?.enabled
                                                      ? (() => {
                                                          const m = playerPricingCard.prices?.find((p: any) => p.count === 4);
                                                          return m ? m.prices.oneHourHalf : null;
                                                        })()
                                                      : null;

                                                    return unit != null ? `€${unit.toFixed(2)} / gioc.` : priceLabel15h;
                                                  })()
                                                ) : (
                                                  "Non disponibile"
                                                )}
                                              </Text>
                                            </View>
                                            <View
                                              style={
                                                styles.durationCardFooter
                                              }
                                            >
                                              <Ionicons
                                                name={
                                                  slots15h.length > 0
                                                    ? "arrow-forward"
                                                    : "close-circle"
                                                }
                                                size={16}
                                                color={
                                                  slots15h.length > 0
                                                    ? "#FF9800"
                                                    : "#999"
                                                }
                                              />
                                            </View>
                                          </Pressable>
                                        );
                                      })()}
                                    </View>
                                  </View>
                                ) : (
                                  <>
                                    {/* DURATION BANNER */}
                                    <View style={styles.selectedDurationBanner}>
                                      <View
                                        style={styles.selectedDurationLeft}
                                      >
                                        <Ionicons
                                          name="time"
                                          size={20}
                                          color="#2196F3"
                                        />
                                        <Text
                                          style={styles.selectedDurationText}
                                        >
                                          Durata:{" "}
                                          {selectedDuration[campo._id] === 1
                                            ? "1 ora"
                                            : "1 ora e 30 minuti"}
                                        </Text>
                                      </View>
                                      <Pressable
                                        onPress={() => {
                                          setSelectedDuration((prev) => ({
                                            ...prev,
                                            [campo._id]: 0,
                                          }));
                                          setSelectedSlot((prev) => ({
                                            ...prev,
                                            [campo._id]: "",
                                          }));
                                        }}
                                        style={styles.changeDurationBtn}
                                      >
                                        <Text
                                          style={styles.changeDurationText}
                                        >
                                          Cambia
                                        </Text>
                                      </Pressable>
                                    </View>

                                    {/* SLOTS */}
                                    {(() => {
                                      const availableSlots = getAvailableSlots(
                                        selectedDayData.slots,
                                        selectedDuration[campo._id],
                                        selectedDateStr
                                      );

                                      if (availableSlots.length === 0) {
                                        return (
                                          <View style={styles.noSlotsBox}>
                                            <Ionicons
                                              name="sad-outline"
                                              size={48}
                                              color="#FF9800"
                                            />
                                            <Text style={styles.noSlotsTitle}>
                                              Nessuno slot disponibile
                                            </Text>
                                            <Text style={styles.noSlotsText}>
                                              Non ci sono slot consecutivi
                                              disponibili per{" "}
                                              {selectedDuration[campo._id] === 1
                                                ? "1 ora"
                                                : "1 ora e 30 minuti"}
                                              .{"\n"}Prova con una durata
                                              diversa o scegli un altro giorno.
                                            </Text>
                                            <Pressable
                                              style={styles.changeDurationBtn2}
                                              onPress={() => {
                                                setSelectedDuration((prev) => ({
                                                  ...prev,
                                                  [campo._id]: 0,
                                                }));
                                              }}
                                            >
                                              <Text
                                                style={
                                                  styles.changeDurationText2
                                                }
                                              >
                                                Cambia Durata
                                              </Text>
                                            </Pressable>
                                          </View>
                                        );
                                      }

                                      return (
                                        <>
                                          <Text style={styles.selectSlotHint}>
                                            Seleziona l'orario di inizio (
                                            {availableSlots.length} disponibili)
                                          </Text>

                                          <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={
                                              false
                                            }
                                            contentContainerStyle={
                                              styles.slotsScrollContent
                                            }
                                            style={styles.slotsScroll}
                                          >
                                            {availableSlots.map((slot, i) => {
                                              const isSlotSelected =
                                                selectedSlot[campo._id] ===
                                                slot.time;

                                              const [h, m] = slot.time
                                                .split(":")
                                                .map(Number);
                                              const totalMinutes =
                                                h * 60 +
                                                m +
                                                selectedDuration[campo._id] *
                                                  60;
                                              const endH = Math.floor(
                                                totalMinutes / 60
                                              );
                                              const endM = totalMinutes % 60;
                                              const endTime = `${String(
                                                endH
                                              ).padStart(2, "0")}:${String(
                                                endM
                                              ).padStart(2, "0")}`;

                                              const slotPrice = calculatePrice(
                                                campo,
                                                selectedDuration[campo._id],
                                                selectedDateStr,
                                                slot.time
                                              );

                                              const pricingLabel =
                                                getPricingLabel(
                                                  campo,
                                                  selectedDateStr,
                                                  slot.time
                                                );

                                              // Determine if we should show per-player price (volley + struttura allows split)
                                              const isVolley = campo.sport === "beach_volley" || campo.sport === "volley";
                                              const canSplit = struttura?.isCostSplittingEnabled === true;
                                              const playerPricing = (campo as any).pricingRules?.playerCountPricing;

                                              const getUnitPriceForCount = (count: number, dur: number) => {
                                                if (!playerPricing || !playerPricing.prices) return null;
                                                const match = playerPricing.prices.find((p: any) => p.count === count);
                                                if (!match) return null;
                                                return dur === 1 ? match.prices.oneHour : match.prices.oneHourHalf;
                                              };

                                              return (
                                                <Pressable
                                                  key={`${selectedDateStr}-${slot.time}-${i}`}
                                                  style={[
                                                    styles.slotChip,
                                                    styles.slotAvailable,
                                                    isSlotSelected &&
                                                      styles.slotSelected,
                                                  ]}
                                                  onPress={() => {
                                                    setSelectedSlot((prev) => ({
                                                      ...prev,
                                                      [campo._id]:
                                                        isSlotSelected
                                                          ? ""
                                                          : slot.time,
                                                    }));
                                                  }}
                                                >
                                                  <View
                                                    style={
                                                      styles.slotMainContent
                                                    }
                                                  >
                                                    <Ionicons
                                                      name={
                                                        isSlotSelected
                                                          ? "checkmark-circle"
                                                          : "time-outline"
                                                      }
                                                      size={14}
                                                      color={
                                                        isSlotSelected
                                                          ? "white"
                                                          : "#4CAF50"
                                                      }
                                                    />
                                                    <View
                                                      style={
                                                        styles.slotTimeContainer
                                                      }
                                                    >
                                                      <Text
                                                        style={[
                                                          styles.slotTime,
                                                          isSlotSelected &&
                                                            styles.slotTimeSelected,
                                                        ]}
                                                      >
                                                        {slot.time}
                                                      </Text>
                                                      <Text
                                                        style={[
                                                          styles.slotEndTime,
                                                          isSlotSelected &&
                                                            styles.slotEndTimeSelected,
                                                        ]}
                                                      >
                                                        → {endTime}
                                                      </Text>
                                                    </View>
                                                  </View>
                                                  <View
                                                    style={
                                                      styles.slotPriceContainer
                                                    }
                                                  >
                                                    {isVolley && canSplit && playerPricing?.enabled ? (
                                                      (() => {
                                                        const unit = getUnitPriceForCount(4, selectedDuration[campo._id]);
                                                        if (unit != null) {
                                                          return (
                                                            <>
                                                              <Text
                                                                style={[
                                                                  styles.slotPrice,
                                                                  isSlotSelected &&
                                                                    styles.slotPriceSelected,
                                                                ]}
                                                              >
                                                                €{unit.toFixed(2)} / gioc.
                                                              </Text>
                                                              {pricingLabel && (
                                                                <Text
                                                                  style={[
                                                                    styles.slotPricingLabel,
                                                                    isSlotSelected &&
                                                                      styles.slotPricingLabelSelected,
                                                                  ]}
                                                                >
                                                                  {pricingLabel}
                                                                </Text>
                                                              )}
                                                            </>
                                                          );
                                                        }

                                                        // fallback to full price
                                                        return (
                                                          <>
                                                            <Text
                                                              style={[
                                                                styles.slotPrice,
                                                                isSlotSelected &&
                                                                  styles.slotPriceSelected,
                                                              ]}
                                                            >
                                                              €{slotPrice.toFixed(2)}
                                                            </Text>
                                                            {pricingLabel && (
                                                              <Text
                                                                style={[
                                                                  styles.slotPricingLabel,
                                                                  isSlotSelected &&
                                                                    styles.slotPricingLabelSelected,
                                                                ]}
                                                              >
                                                                {pricingLabel}
                                                              </Text>
                                                            )}
                                                          </>
                                                        );
                                                      })()
                                                    ) : (
                                                      <>
                                                        <Text
                                                          style={[
                                                            styles.slotPrice,
                                                            isSlotSelected &&
                                                              styles.slotPriceSelected,
                                                          ]}
                                                        >
                                                          €{slotPrice.toFixed(2)}
                                                        </Text>
                                                        {pricingLabel && (
                                                          <Text
                                                            style={[
                                                              styles.slotPricingLabel,
                                                              isSlotSelected &&
                                                                styles.slotPricingLabelSelected,
                                                            ]}
                                                          >
                                                            {pricingLabel}
                                                          </Text>
                                                        )}
                                                      </>
                                                    )}
                                                  </View>
                                                </Pressable>
                                              );
                                            })}
                                          </ScrollView>

                                          {selectedSlot[campo._id] && (
                                            <Pressable
                                              style={styles.prenotaBtn}
                                              onPress={() => {
                                                const [h, m] = selectedSlot[
                                                  campo._id
                                                ]
                                                  .split(":")
                                                  .map(Number);
                                                const totalMinutes =
                                                  h * 60 +
                                                  m +
                                                  selectedDuration[campo._id] *
                                                    60;
                                                const endH = Math.floor(
                                                  totalMinutes / 60
                                                );
                                                const endM = totalMinutes % 60;
                                                const endTime = `${String(
                                                  endH
                                                ).padStart(2, "0")}:${String(
                                                  endM
                                                ).padStart(2, "0")}`;

                                                const finalPrice =
                                                  calculatePrice(
                                                    campo,
                                                    selectedDuration[campo._id],
                                                    selectedDateStr,
                                                    selectedSlot[campo._id]
                                                  );

                                                navigation.navigate(
                                                  "ConfermaPrenotazione",
                                                  {
                                                    campoId: campo._id,
                                                    campoName: campo.name,
                                                    strutturaName:
                                                      struttura.name,
                                                    struttura: struttura,
                                                    sport: campo.sport,
                                                    date: selectedDateStr,
                                                    startTime:
                                                      selectedSlot[campo._id],
                                                    endTime: endTime,
                                                    duration:
                                                      selectedDuration[
                                                        campo._id
                                                      ],
                                                    price: finalPrice,
                                                  }
                                                );
                                              }}
                                            >
                                              <View style={styles.prenotaBtnLeft}>
                                                <Ionicons
                                                  name="calendar"
                                                  size={20}
                                                  color="white"
                                                />
                                                <View>
                                                  <Text
                                                    style={
                                                      styles.prenotaBtnText
                                                    }
                                                  >
                                                    Prenota ora
                                                  </Text>
                                                  <Text
                                                    style={
                                                      styles.prenotaBtnTime
                                                    }
                                                  >
                                                    {selectedSlot[campo._id]} •{" "}
                                                    {selectedDuration[
                                                      campo._id
                                                    ] === 1
                                                      ? "1h"
                                                      : "1h 30m"}
                                                  </Text>
                                                </View>
                                              </View>
                                              <Text
                                                style={styles.prenotaBtnPrice}
                                              >
                                                {(() => {
                                                  const total = calculatePrice(
                                                    campo,
                                                    selectedDuration[campo._id],
                                                    selectedDateStr,
                                                    selectedSlot[campo._id]
                                                  );
                                                  if (isVolleyCampo && canSplitCampo && playerPricingCampo?.enabled) {
                                                    const unit = getUnitPrice(4, selectedDuration[campo._id]);
                                                    if (unit != null) return `€${unit.toFixed(2)} / gioc.`;
                                                  }
                                                  return `€${total.toFixed(2)}`;
                                                })()}
                                              </Text>
                                            </Pressable>
                                          )}
                                        </>
                                      );
                                    })()}
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
        )}

        {/* PARTITE APERTE SECTION */}
        {activeChip === 'partite' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={20} color="#2196F3" />
              <Text style={styles.sectionTitle}>Partite aperte in questa struttura</Text>
            </View>

            {loadingMatches ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.emptyText}>Caricamento partite...</Text>
              </View>
            ) : openMatches.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Nessuna partita aperta al momento</Text>
                <Text style={styles.emptySubtext}>
                  Le partite pubbliche create per questa struttura appariranno qui
                </Text>
              </View>
            ) : (
              <FlatList
                data={openMatches}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <OpenMatchCard
                    match={item}
                    onPress={() => {
                      const bookingId = item.booking?._id;
                      if (bookingId) {
                        navigation.navigate('DettaglioPrenotazione', { bookingId, fromOpenMatch: true });
                      } else {
                        alert('ID prenotazione non disponibile');
                      }
                    }}
                    onJoin={() => handleJoinMatch(item)}
                  />
                )}
                scrollEnabled={false}
                contentContainerStyle={{ gap: 12 }}
              />
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}
