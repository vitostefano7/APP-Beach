import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Modal,
  Animated,
  Easing,
  RefreshControl,
  useWindowDimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  Linking,
  PanResponder,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import SportIcon from "../../../components/SportIcon";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Calendar, LocaleConfig } from 'react-native-calendars';
import API_URL from "../../../config/api";
import { AuthContext } from "../../../context/AuthContext";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import { useCityGeocode } from "../../../hooks/useCityGeocode";
import { resolveImageUrl } from "../../../utils/imageUtils";

// ✅ Import stili
import { styles } from "../styles-player/StruttureScreen.styles";
// ✅ Import utils e types
import {
  Struttura,
  FilterState,
  UserPreferences,
  calculateDistance,
  filterStrutture,
  countActiveFilters,
} from "../utils-player/StruttureScreen-utils"; 



// Tipo per i marker sulla mappa
type MapMarker = {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  struttura: Struttura;
  isCluster: boolean;
  count?: number;
  city?: string;
};

// Configurazione lingua italiana per il calendario
LocaleConfig.locales['it'] = {
  monthNames: ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'],
  monthNamesShort: ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'],
  dayNames: ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'],
  dayNamesShort: ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'],
  today: 'Oggi'
};
LocaleConfig.defaultLocale = 'it';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AdvancedFiltersModalProps = {
  visible: boolean;
  filters: FilterState;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  query: string;
  setQuery: (query: string) => void;
  sports: string[];
  loadingSports?: boolean;
  showAlert: (config: any) => void; // pass parent showAlert to display the app's custom modal
};

function AdvancedFiltersModal({
  visible,
  filters,
  onClose,
  onApply,
  query,
  setQuery,
  sports,
  showAlert,
}: AdvancedFiltersModalProps) {
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);
  const [showCalendar, setShowCalendar] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  
  // Animazioni modal
  const [modalVisible, setModalVisible] = useState(visible);
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalSlide = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Use the sports passed from parent (derived from server/model). If none available, show empty state.
  const sportsList = sports && sports.length > 0 ? sports : [];

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  // Gestione animazioni apertura/chiusura
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.sequence([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(modalOpacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.spring(modalSlide, {
            toValue: 1,
            bounciness: 10,
            speed: 8,
            useNativeDriver: true,
          }),
          Animated.spring(modalScale, {
            toValue: 1,
            bounciness: 8,
            speed: 10,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      closeModal();
    }
  }, [visible]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(modalSlide, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      onClose();
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return "Seleziona una data";
    return date.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const modalTranslateY = modalSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal
      visible={modalVisible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={closeModal}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: backdropOpacity }]}>
        <Pressable style={styles.modalBackdrop} onPress={closeModal} />
        
        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: modalOpacity,
              transform: [
                { translateY: modalTranslateY },
                { scale: modalScale },
              ],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtri Avanzati</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingHorizontal: 24 }}>
            <Text style={styles.sectionTitle}>Città</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[styles.cityInput, { flex: 1 }]}
                placeholder="Inserisci città"
                value={tempFilters.city || ""}
                onChangeText={(text) => setTempFilters((prev) => ({ ...prev, city: text || null }))}
              />

              <Pressable
                style={{ marginLeft: 10, padding: 8 }}
                onPress={async () => {
                  try {
                    setGpsLoading(true);
                    // Request permission
                    const { status } = await Location.requestForegroundPermissionsAsync();

                    if (status !== 'granted') {
                      // User denied permissions — use custom modal to show friendly message
                      showAlert({
                        type: 'warning',
                        title: 'Permessi GPS necessari',
                        message: 'Devi concedere i permessi di localizzazione per usare questa funzione.',
                        buttons: [
                          { text: 'Apri impostazioni', onPress: () => Linking.openSettings(), style: 'default' },
                          { text: 'OK', style: 'cancel' },
                        ],
                      });
                      return;
                    }

                    // Try to get location — if device settings (GPS off) prevent it this may throw
                    const loc = await Location.getCurrentPositionAsync({});

                    const reverseGeocodeUrl =
                      `https://nominatim.openstreetmap.org/reverse?` +
                      `lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&` +
                      `format=json&addressdetails=1`;

                    const reverseRes = await fetch(reverseGeocodeUrl, {
                      headers: { 'User-Agent': 'SportBookingApp/1.0' },
                    });

                    const reverseData = await reverseRes.json();
                    const city = reverseData.address?.city || reverseData.address?.town || reverseData.address?.village || reverseData.address?.municipality;

                    if (city) {
                      setTempFilters((prev) => ({ ...prev, city }));
                    } else {
                      showAlert({
                        type: 'info',
                        title: 'Città non trovata',
                        message: 'Impossibile determinare la città dalla posizione.',
                        buttons: [{ text: 'OK' }],
                      });
                    }
                  } catch (err: any) {
                    // Handle specific common location errors gracefully without raising a red-box
                    const msg = err?.message || '';
                    if (msg.includes('unsatisfied device settings') || msg.includes('No location provider') || msg.includes('Location request failed')) {
                      showAlert({
                        type: 'error',
                        title: 'GPS non disponibile',
                        message: 'Impossibile ottenere la posizione. Controlla che il GPS sia attivo e che l\'app abbia i permessi di localizzazione.',
                        buttons: [
                          { text: 'Apri impostazioni', onPress: () => Linking.openSettings() },
                          { text: 'OK', style: 'cancel' },
                        ],
                      });
                    } else {
                      showAlert({ type: 'error', title: 'Errore GPS', message: 'Impossibile rilevare la posizione. Riprova più tardi.' });
                    }
                    // Use warn (non-red) so developer logs are preserved without triggering a red error overlay
                    console.warn('Errore GPS (modal filtri):', err);
                  } finally {
                    setGpsLoading(false);
                  }
                }}
              >
                {gpsLoading ? (
                  <ActivityIndicator size="small" color="#2979ff" />
                ) : (
                  <Ionicons name="navigate" size={20} color="#2979ff" />
                )}
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Sport</Text>
            <View style={styles.optionsGrid}>
              {sportsList.length > 0 ? (
                sportsList.map((sport) => (
                  <Pressable
                    key={sport}
                    style={[
                      styles.option,
                      tempFilters.sport === sport && styles.optionActive,
                    ]}
                    onPress={() => setTempFilters((prev) => ({
                      ...prev,
                      sport: prev.sport === sport ? null : sport,
                    }))}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <SportIcon sport={sport} size={16} color={tempFilters.sport === sport ? 'white' : '#2979ff'} />
                      <Text
                        style={[
                          styles.optionText,
                          { marginLeft: 8 },
                          tempFilters.sport === sport && styles.optionTextActive,
                        ]}
                      >
                        {sport}
                      </Text>
                    </View>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.emptySubtext}>Nessuno sport disponibile</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Tipo Campo</Text>
            <View style={styles.optionsGrid}>
              {[
                { tipo: "Indoor", label: "Interno" },
                { tipo: "Outdoor", label: "Esterno" },
              ].map(({ tipo, label }) => (
                <Pressable
                  key={tipo}
                  style={[
                    styles.option,
                    ((tempFilters.indoor === true && tipo === "Indoor") ||
                    (tempFilters.indoor === false && tipo === "Outdoor")) ? styles.optionActive : null,
                  ]}
                  onPress={() => setTempFilters((prev) => ({
                    ...prev,
                    indoor: tipo === "Indoor" ? (prev.indoor === true ? null : true) : (prev.indoor === false ? null : false),
                  }))}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name={tipo === "Indoor" ? "business-outline" : "sunny-outline"}
                      size={16}
                      color={((tempFilters.indoor === true && tipo === "Indoor") || (tempFilters.indoor === false && tipo === "Outdoor")) ? 'white' : '#2979ff'}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        { marginLeft: 8 },
                        ((tempFilters.indoor === true && tipo === "Indoor") ||
                        (tempFilters.indoor === false && tipo === "Outdoor")) ? styles.optionTextActive : null,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Data</Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => setShowCalendar(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#2979ff" />
              <Text style={styles.dateText}>
                {formatDisplayDate(tempFilters.date)}
              </Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Orario</Text>
            <View style={styles.timeSlots}>
              {[
                { slot: "mattina", label: "Mattina" },
                { slot: "pomeriggio", label: "Pomeriggio" },
                { slot: "sera", label: "Sera" },
              ].map(({ slot, label }) => (
                <Pressable
                  key={slot}
                  style={[
                    styles.timeSlot,
                    tempFilters.timeSlot === slot && styles.timeSlotActive,
                  ]}
                  onPress={() => setTempFilters((prev) => ({
                    ...prev,
                    timeSlot: prev.timeSlot === slot ? null : slot,
                  }))}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={tempFilters.timeSlot === slot ? "white" : "#2979ff"}
                  />
                  <Text
                    style={[
                      styles.timeSlotText,
                      tempFilters.timeSlot === slot &&
                        styles.timeSlotTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Pagamenti</Text>
            <View style={styles.timeSlots}>
              <Pressable
                style={[
                  styles.timeSlot,
                  tempFilters.splitPayment === true && styles.timeSlotActive,
                ]}
                onPress={() =>
                  setTempFilters((prev) => ({
                    ...prev,
                    splitPayment: prev.splitPayment === true ? null : true,
                  }))
                }
              >
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={tempFilters.splitPayment === true ? "white" : "#2979ff"}
                />
                <Text
                  style={[
                    styles.timeSlotText,
                    tempFilters.splitPayment === true &&
                      styles.timeSlotTextActive,
                  ]}
                >
                  Split payment
                </Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Partite Aperte</Text>
            <View style={styles.timeSlots}>
              <Pressable
                style={[
                  styles.timeSlot,
                  tempFilters.openGames === true && styles.timeSlotActive,
                ]}
                onPress={() =>
                  setTempFilters((prev) => ({
                    ...prev,
                    openGames: prev.openGames === true ? null : true,
                  }))
                }
              >
                <Ionicons
                  name="football-outline"
                  size={20}
                  color={tempFilters.openGames === true ? "white" : "#2979ff"}
                />
                <Text
                  style={[
                    styles.timeSlotText,
                    tempFilters.openGames === true &&
                      styles.timeSlotTextActive,
                  ]}
                >
                  Partite aperte
                </Text>
              </Pressable>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              style={styles.resetModalButton}
              onPress={() =>
                setTempFilters({
                  indoor: null,
                  sport: null,
                  date: null,
                  timeSlot: null,
                  city: null,
                  splitPayment: null,
                  openGames: null,
                })
              }
            >
              <Text style={styles.resetModalText}>Reset</Text>
            </Pressable>

            <Pressable
              style={styles.applyButton}
              onPress={() => onApply(tempFilters)}
            >
              <Text style={styles.applyButtonText}>Applica filtri</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>

      <Modal
        visible={showCalendar}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCalendar(false)}
      >
        <Pressable 
          style={styles.calendarOverlay}
          onPress={() => setShowCalendar(false)}
        >
          <Pressable 
            style={styles.calendarContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Seleziona una data</Text>
              <Pressable onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </Pressable>
            </View>
            
            <Calendar
              current={formatDate(tempFilters.date) || formatDate(new Date()) || undefined}
              minDate={formatDate(new Date()) || undefined}
              onDayPress={(day) => {
                setTempFilters((prev) => ({
                  ...prev,
                  date: new Date(day.dateString),
                }));
                setShowCalendar(false);
              }}
              markedDates={
                formatDate(tempFilters.date) 
                  ? {
                      [formatDate(tempFilters.date)!]: {
                        selected: true,
                        selectedColor: '#2979ff',
                      },
                    }
                  : {}
              }
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#666',
                selectedDayBackgroundColor: '#2979ff',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#2979ff',
                dayTextColor: '#1A1A1A',
                textDisabledColor: '#d9d9d9',
                dotColor: '#2979ff',
                selectedDotColor: '#ffffff',
                arrowColor: '#2979ff',
                monthTextColor: '#1A1A1A',
                indicatorColor: '#2979ff',
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 15,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 13,
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}

export default function StruttureScreen({ isTabMode = false }: { isTabMode?: boolean }) {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { token } = useContext(AuthContext);
  const { showAlert, AlertComponent } = useCustomAlert();
  const preferencesRef = useRef<UserPreferences | null>(null);
  const isLoadingStruttureRef = useRef(false);
  const lastRegionRef = useRef<Region | null>(null);
  const insets = useSafeAreaInsets();
  
  // Costante per l'altezza del tab bar
  const TAB_BAR_HEIGHT = 65;
  
  console.log('🔍 StruttureScreen - isTabMode:', isTabMode);

  const [strutture, setStrutture] = useState<Struttura[]>([]);
  const [favoriteStrutture, setFavoriteStrutture] = useState<Struttura[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedMarker, setSelectedMarker] = useState<Struttura | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  const [isLoadingStrutture, setIsLoadingStrutture] = useState(false);
  
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeRadius, setActiveRadius] = useState<number | null>(null);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [availableSports, setAvailableSports] = useState<string[]>([]);
  const [sportsList, setSportsList] = useState<string[]>([]);
  const [loadingSports, setLoadingSports] = useState<boolean>(false);
  const [sortType, setSortType] = useState<'Consigliati' | 'distanza' | 'prezzo'>('Consigliati');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortButtonRef = useRef<View | null>(null);
  const [sortMenuPosition, setSortMenuPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const animatedSortMenu = useRef(new Animated.Value(0)).current;
  const MENU_WIDTH = 260;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const openSortMenuAtButton = () => {
    if (sortButtonRef.current && (sortButtonRef.current as any).measureInWindow) {
      (sortButtonRef.current as any).measureInWindow((x: number, y: number, w: number, h: number) => {
        setSortMenuPosition({ x, y, width: w, height: h });
        setShowSortMenu(true);
        Animated.timing(animatedSortMenu, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      });
    } else {
      setShowSortMenu(true);
      Animated.timing(animatedSortMenu, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    }
  };

  const closeSortMenu = () => {
    Animated.timing(animatedSortMenu, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setShowSortMenu(false);
      setSortMenuPosition(null);
    });
  }; 
  
  const [region, setRegion] = useState<Region>({
    latitude: 45.4642,
    longitude: 9.19,
    latitudeDelta: 5,
    longitudeDelta: 5,
  });

  const [filters, setFilters] = useState<FilterState>({
    indoor: null,
    sport: null,
    date: null,
    timeSlot: null,
    city: null,
    splitPayment: null,
    openGames: null,
  });

  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [userClearedCity, setUserClearedCity] = useState(false);
  const [userManuallyChangedCity, setUserManuallyChangedCity] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [lastPreferredCity, setLastPreferredCity] = useState<string | null>(null);
  
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);

  // ✅ Stati per logica città migliorata
  const [lastVisitedCity, setLastVisitedCity] = useState<string | null>(null);
  const [playHistory, setPlayHistory] = useState<Record<string, number>>({});
  const [showCitySelectionModal, setShowCitySelectionModal] = useState(false);
  const [hasForcedCitySelection, setHasForcedCitySelection] = useState(false);
  const [lastPlayedCity, setLastPlayedCity] = useState<string | null>(null);

  // ✅ State per GPS
  const [isUsingGPS, setIsUsingGPS] = useState(false);
  const [gpsCity, setGpsCity] = useState<string | null>(null);
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);

  // ✅ State per carousel immagini
  const [currentImageIndexes, setCurrentImageIndexes] = useState<Record<string, number>>({});

  // ✅ Hook per geocoding e suggerimenti città
  const {
    cityValidation,
    citySuggestions,
    showSuggestions,
    searchCitySuggestions,
    selectCity,
    resetValidation,
  } = useCityGeocode();

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  const handleRegionChangeComplete = useCallback((nextRegion: Region) => {
    const last = lastRegionRef.current;
    if (
      last &&
      Math.abs(last.latitude - nextRegion.latitude) < 0.0001 &&
      Math.abs(last.longitude - nextRegion.longitude) < 0.0001 &&
      Math.abs(last.latitudeDelta - nextRegion.latitudeDelta) < 0.0001 &&
      Math.abs(last.longitudeDelta - nextRegion.longitudeDelta) < 0.0001
    ) {
      return;
    }

    lastRegionRef.current = nextRegion;
    setRegion(nextRegion);
  }, []);

  useEffect(() => {
    const preferredCity = preferences?.preferredLocation?.city;
    
    // Primo caricamento: imposta il filtro dalla città preferita
    if (isFirstLoad && preferredCity) {
      setFilters(prev => ({
        ...prev,
        city: preferredCity,
      }));
      setLastPreferredCity(preferredCity);
      setIsFirstLoad(false);
    }
    // Auto-aggiornamento: se la città preferita è cambiata E l'utente non ha modificato manualmente
    else if (!isFirstLoad && preferredCity && preferredCity !== lastPreferredCity && !userManuallyChangedCity) {
      console.log('🔄 Auto-aggiornamento filtro città:', lastPreferredCity, '->', preferredCity);
      setFilters(prev => ({
        ...prev,
        city: preferredCity,
      }));
      setLastPreferredCity(preferredCity);
      setUserClearedCity(false);
    }
  }, [preferences, isFirstLoad, lastPreferredCity, userManuallyChangedCity]);

  // Reset sortType to 'Consigliati' if 'distanza' is selected but no city filter is set
  useEffect(() => {
    if (sortType === 'distanza' && !filters.city) {
      setSortType('Consigliati');
    }
  }, [filters.city, sortType]);

  // ✅ TEMPORANEAMENTE DISABILITATO - Carousel automatico per le immagini
  // const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // useEffect(() => {
  //   const startCarousel = () => {
  //     if (carouselIntervalRef.current) {
  //       clearInterval(carouselIntervalRef.current);
  //     }
      
  //     carouselIntervalRef.current = setInterval(() => {
  //       setCurrentImageIndexes((prev) => {
  //         const newIndexes = { ...prev };
  //         filteredStrutture.forEach((struttura) => {
  //           if (struttura.images && struttura.images.length > 1) {
  //             const currentIndex = prev[struttura._id] || 0;
  //             newIndexes[struttura._id] = 
  //               currentIndex === struttura.images.length - 1 ? 0 : currentIndex + 1;
  //           }
  //         });
  //         return newIndexes;
  //       });
  //     }, 3000);
  //   };

  //   startCarousel();

  //   return () => {
  //     if (carouselIntervalRef.current) {
  //       clearInterval(carouselIntervalRef.current);
  //       carouselIntervalRef.current = null;
  //     }
  //   };
  // }, [filteredStrutture]);

  const loadPreferences = useCallback(async () => {
    console.log('⚙️ Caricamento preferenze...');
    if (!token) {
      console.log('❌ Nessun token disponibile');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('📡 Risposta preferenze:', res.status);
      
      if (res.ok) {
        const prefs = await res.json();
        console.log('✅ Preferenze caricate:', prefs);
        setPreferences(prefs);
        setPreferencesLoaded(true);

        // Carica tracciamento città
        if (prefs.lastVisitedCity) {
          setLastVisitedCity(prefs.lastVisitedCity);
        }
        if (prefs.playHistory) {
          setPlayHistory(prefs.playHistory);
        }

        if (prefs.preferredLocation) {
          const newRegion = {
            latitude: prefs.preferredLocation.lat,
            longitude: prefs.preferredLocation.lng,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          };
          lastRegionRef.current = newRegion;
          setRegion(newRegion);
        }
      } else {
        console.log('❌ Errore caricamento preferenze:', res.statusText);
      }
    } catch (error) {
      console.error("Errore caricamento preferenze:", error);
    }
  }, [token]);

  const updatePreferredLocation = useCallback(async (city: string, lat: number, lng: number) => {
    console.log('📡 [updatePreferredLocation] Inizio chiamata con:', { city, lat, lng });
    if (!token) {
      console.log('❌ [updatePreferredLocation] Nessun token disponibile');
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/users/preferences/location`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          city,
          lat,
          lng,
          radius: 30, // Default radius
        }),
      });
      
      console.log('📡 [updatePreferredLocation] Risposta HTTP:', res.status, res.statusText);
      
      if (res.ok) {
        console.log('✅ [updatePreferredLocation] Città preferita aggiornata:', city);
        // Ricarica preferenze per aggiornare lo stato
        await loadPreferences();
      } else {
        const errorText = await res.text();
        console.error('❌ [updatePreferredLocation] Errore aggiornamento:', res.status, errorText);
      }
    } catch (error) {
      console.error('❌ [updatePreferredLocation] Errore di rete:', error);
    }
  }, [token, loadPreferences]);

  const loadStrutture = useCallback(async () => {
    if (isLoadingStruttureRef.current) return;
    isLoadingStruttureRef.current = true;
    setIsLoadingStrutture(true);
    console.log('🏗️ Iniziando caricamento strutture...');
    try {
      // 🆕 Costruisci URL con parametri geografici E di disponibilità
      const params = new URLSearchParams();
      
      // ✅ Filtri data/fascia oraria
      if (filters.date) {
        const formattedDate = formatDate(filters.date);
        if (formattedDate) {
          params.append('date', formattedDate);
        }
      }
      if (filters.timeSlot) {
        params.append('timeSlot', filters.timeSlot);
      }
      
      // 🌍 Filtri geografici: priorità GPS > città filtro > città preferita > città suggerita
      const filterCity = filters.city;
      const primaryCity = preferencesRef.current?.preferredLocation?.city;
      const suggestedCity = preferencesRef.current?.preferredLocation?.suggestedCity;
      const suggestedLat = preferencesRef.current?.preferredLocation?.suggestedLat;
      const suggestedLng = preferencesRef.current?.preferredLocation?.suggestedLng;
      
      const activeCity = filterCity || primaryCity || suggestedCity || null;
      
      console.log("=== 🆕 FILTRI GEOGRAFICI SERVER-SIDE ===");
      console.log("🔍 Filtro manuale città:", filterCity);
      console.log("⭐ Città preferita primaria:", primaryCity);
      console.log("🤖 Città suggerita automatica:", suggestedCity);
      console.log("✅ Città attiva finale:", activeCity);
      
      if (isUsingGPS && gpsLat && gpsLng) {
        // Usa coordinate GPS
        params.append('lat', String(gpsLat));
        params.append('lng', String(gpsLng));
        params.append('radius', String(preferencesRef.current?.preferredLocation?.radius || 30));
        console.log(`📍 Usando GPS: lat=${gpsLat}, lng=${gpsLng}, radius=30km`);
      } else if (activeCity) {
        // Usa coordinate salvate per città preferita o geocodifica
        let centerLat: number | null = null;
        let centerLng: number | null = null;
        let citySource = '';
        
        if (filterCity === primaryCity && preferencesRef.current?.preferredLocation?.lat) {
          centerLat = preferencesRef.current.preferredLocation.lat;
          centerLng = preferencesRef.current.preferredLocation.lng;
          citySource = 'Preferenza primaria';
        } else if (!filterCity && !primaryCity && suggestedLat && suggestedLng) {
          centerLat = suggestedLat;
          centerLng = suggestedLng;
          citySource = 'Suggerita automatica';
        }
        
        if (centerLat && centerLng) {
          // Abbiamo coordinate salvate
          params.append('lat', String(centerLat));
          params.append('lng', String(centerLng));
          params.append('radius', String(preferencesRef.current?.preferredLocation?.radius || 30));
          console.log(`🎯 Usando coordinate da ${citySource}:`, { lat: centerLat, lng: centerLng });
        } else {
          // Usa filtro città diretto (backend filtrerà per nome città)
          params.append('city', activeCity);
          console.log(`🏙️ Usando filtro città:`, activeCity);
        }
      }
      
      const url = `${API_URL}/strutture?${params.toString()}`;
      console.log('🌐 URL richiesta:', url);
      
      const res = await fetch(url);
      console.log('📡 Risposta HTTP:', res.status, res.statusText);
      
      let data: Struttura[] = await res.json();
      console.log('📦 Dati ricevuti:', data.length, 'strutture (già filtrate dal server)');
      
      // 🔧 Normalizza campi per compatibilità client
      data = data.map((s: any) => {
        // Normalizza prezzo
        const prezzoPerHour = s.prezzoPerHour ?? s.pricePerHour ?? s.price ?? 0;
        
        // 🆕 Normalizza sports da diverse fonti
        const fromArray = s.sports || [];
        const fromSingular = s.sport ? [s.sport] : [];
        const fromCampi = (s.campi || []).flatMap((c: any) => {
          return [c?.sport?.name, c?.sport?.code, c?.sport].filter(Boolean);
        });
        const sports = Array.from(new Set([...fromArray, ...fromSingular, ...fromCampi])).filter(Boolean);
        
        return { 
          ...s, 
          prezzoPerHour,
          sports,
        };
      });

      // ✅ Aggiungi flag favoriti
      if (preferencesRef.current?.favoriteStrutture) {
        data = data.map((s) => ({
          ...s,
          isFavorite: preferencesRef.current!.favoriteStrutture.includes(s._id),
        }));
      }

      setStrutture(data);
      setActiveCity(activeCity);
      setActiveRadius(preferencesRef.current?.preferredLocation?.radius || 30);
      
      // 🏐 Estrai sport disponibili dalle strutture ricevute
      const allSports = data.flatMap(s => s.sports || []);
      const sports = Array.from(new Set(allSports)).filter(Boolean);
      console.log('🏐 Sport disponibili:', sports);
      setAvailableSports(sports);
    } catch (error) {
      console.error("Errore caricamento strutture:", error);
    } finally {
      isLoadingStruttureRef.current = false;
      setIsLoadingStrutture(false);
    }
  }, [filters, userClearedCity, isUsingGPS, gpsLat, gpsLng]);

  const geocodeAndCenterMap = useCallback(async (city: string) => {
    try {
      const geocodeUrl = 
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(city)},Italia&` +
        `format=json&limit=1`;
      
      const geocodeRes = await fetch(geocodeUrl, {
        headers: { 'User-Agent': 'SportBookingApp/1.0' },
      });
      
      const geocodeData = await geocodeRes.json();
      console.log("🗺️ Geocode per centrare mappa:", geocodeData);
      
      if (geocodeData && geocodeData.length > 0) {
        const lat = parseFloat(geocodeData[0].lat);
        const lng = parseFloat(geocodeData[0].lon);
        
        const newRegion: Region = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        };
        
        lastRegionRef.current = newRegion;
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
        console.log("🗺️ Mappa centrata su:", city, { lat, lng });
      }
    } catch (error) {
      console.error("❌ Errore geocoding per mappa:", error);
    }
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return date.toISOString().split('T')[0];
  };

  const formatCurrency = (value: number | string | undefined | null) => {
    if (value === undefined || value === null || value === '') return '—';
    const num = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
    try {
      return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(num);
    } catch (e) {
      return `€${Math.round(num)}`;
    }
  };

  useEffect(() => {
    console.log('🔄 Vista cambiata a:', viewMode);
    if (viewMode === "list") {
      console.log('📱 Vista lista: FAB filtri visibile a bottom 14');
    } else {
      console.log('🗺️ Vista mappa: Pulsante Lista visibile a top 30, FAB geolocalizzazione a bottom 75');
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === "map" && filters.city) {
      console.log('🗺️ Cambio città filtro in vista mappa:', filters.city);
      geocodeAndCenterMap(filters.city);
    }
  }, [filters.city, viewMode, geocodeAndCenterMap]);

  // Carica lista sport dal backend (log dettagliati)
  const loadSports = useCallback(async () => {
    setLoadingSports(true);
    try {
      const res = await fetch(`${API_URL}/sports`);
      const text = await res.text();
      let body: any = null;
      try {
        body = JSON.parse(text);
      } catch (e) {
        body = text;
      }

      if (res.ok && body && body.data) {
        const list = body.data.map((s: any) => s.name).filter(Boolean);
        setSportsList(list);
      } else {
        console.warn('⚠️ Impossibile caricare sport dal server, response:', body);
      }
    } catch (error) {
      console.error('❌ Errore caricamento sport:', error);
    } finally {
      setLoadingSports(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('🎯 useFocusEffect triggered, token:', !!token);
      loadPreferences();
      loadSports();
      return () => {};
    }, [token, loadPreferences, loadSports])
  );

  // Aggiorna città preferita dall'ultimo luogo visitato
  useEffect(() => {
    console.log('🔄 [useEffect] lastVisitedCity cambiato:', lastVisitedCity, 'token presente:', !!token);
    if (lastVisitedCity && token && !preferences?.preferredLocation?.city) {
      console.log('📍 [useEffect] Chiamo updatePreferredLocation per:', lastVisitedCity);
      updatePreferredLocation(lastVisitedCity, 0, 0); // Coordinate placeholder, forse geocodare
    }
  }, [lastVisitedCity, token, preferences?.preferredLocation?.city]);

  // 🆕 Mostra modal selezione città al primo accesso
  useEffect(() => {
    if (preferencesLoaded && !preferences?.preferredLocation?.city && !showCitySelectionModal) {
      console.log('🎯 Primo accesso: mostro modal selezione città obbligatoria');
      setShowCitySelectionModal(true);
    }
  }, [preferencesLoaded, preferences?.preferredLocation?.city, showCitySelectionModal]);

  useEffect(() => {
    if (!token || !preferencesLoaded) return;
    
    // ❌ NON caricare strutture se non c'è nessuna città selezionata
    const hasCity = filters.city || 
                    preferences?.preferredLocation?.city || 
                    preferences?.preferredLocation?.suggestedCity;
    
    if (!hasCity) {
      console.log('⚠️ Nessuna città disponibile, skip caricamento strutture');
      setStrutture([]);
      return;
    }
    
    loadStrutture();
  }, [token, loadStrutture, preferencesLoaded, filters.city, preferences?.preferredLocation?.city, preferences?.preferredLocation?.suggestedCity]);

  const loadFavorites = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/users/preferences/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const normalizedFavorites = data.map((s: any) => ({
          ...s,
          prezzoPerHour: s.prezzoPerHour ?? s.pricePerHour ?? s.price ?? 0,
        }));
        setFavoriteStrutture(normalizedFavorites);
      }
    } catch (error) {
      console.error("Errore caricamento preferiti:", error);
    }
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPreferences();
    if (token) await loadFavorites();
    setRefreshing(false);
  };

  const toggleFavorite = async (strutturaId: string) => {
    if (!token) {
      alert("Devi essere loggato per aggiungere ai preferiti");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/users/preferences/favorites/${strutturaId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.ok) {
        await loadPreferences();
        if (token) await loadFavorites();
      }
    } catch (error) {
      console.error("Errore toggle preferiti:", error);
    }
  };

  const toggleFavoritesExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFavoritesExpanded(!favoritesExpanded);
  };

  const onApply = (newFilters: FilterState) => {
    console.log('🔄 Utente ha impostato città:', newFilters.city);
    
    if (newFilters.city !== filters.city) {
      setUserManuallyChangedCity(true);
      if (!newFilters.city) {
        console.log('🔄 Utente ha rimosso filtro città, setUserClearedCity(true)');
        setUserClearedCity(true);
      } else {
        setUserClearedCity(false);
      }
    }
    
    setFilters(newFilters);
    setShowFilters(false);
  };

  const centerOnUser = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setShowLocationPermissionModal(true);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const newRegion: Region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      lastRegionRef.current = newRegion;
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 500);

      // Reverse geocoding per ottenere la città
      try {
        const reverseGeocodeUrl = 
          `https://nominatim.openstreetmap.org/reverse?` +
          `lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&` +
          `format=json&addressdetails=1`;
        
        const reverseRes = await fetch(reverseGeocodeUrl, {
          headers: { 'User-Agent': 'SportBookingApp/1.0' },
        });
        
        const reverseData = await reverseRes.json();
        console.log("🗺️ Reverse geocoding:", reverseData);
        
        const city = reverseData.address?.city || reverseData.address?.town || reverseData.address?.village;
        if (city) {
          setGpsCity(city);
          setGpsLat(loc.coords.latitude);
          setGpsLng(loc.coords.longitude);
          setIsUsingGPS(true);
          
          // Imposta filtri temporanei basati su GPS
          setFilters(prev => ({
            ...prev,
            city: city,
          }));
          
          // Se non ha città preferita, salvala come tale
          if (!preferences?.preferredLocation?.city) {
            await updatePreferredLocation(city, loc.coords.latitude, loc.coords.longitude);
          }
          
          console.log("📍 GPS attivato, città:", city);
        } else {
          console.log("⚠️ Città non trovata dal reverse geocoding");
        }
      } catch (geoError) {
        console.error("❌ Errore reverse geocoding:", geoError);
      }
    } catch (error) {
      console.log("Errore nel centrare sulla posizione:", error);
      showAlert({
        type: 'error',
        title: 'GPS non disponibile',
        message: 'La posizione corrente non è disponibile. Assicurati che i servizi di localizzazione siano abilitati nelle impostazioni del dispositivo.',
        buttons: [
          { text: "Annulla", style: "cancel", onPress: () => {} },
          { text: "Apri Impostazioni", onPress: () => Linking.openSettings() }
        ]
      });
    }
  };

  const filteredStrutture = filterStrutture(strutture, filters, query);
  const activeFiltersCount = countActiveFilters(filters);

  // Funzione per ordinare le strutture
  const sortedStrutture = React.useMemo(() => {
    const sorted = [...filteredStrutture];
    
    switch (sortType) {
      case 'Consigliati':
        // Ordina per rating medio (VIP)
        return sorted.sort((a, b) => {
          const aRating = a.rating?.average || 0;
          const bRating = b.rating?.average || 0;
          return bRating - aRating;
        });
      
      case 'distanza':
        // Ordina per distanza (se disponibile)
        return sorted.sort((a, b) => {
          const adistanza = a.distanza ?? Infinity;
          const bdistanza = b.distanza ?? Infinity;
          return adistanza - bdistanza;
        });
      
      case 'prezzo':
        // Ordina per prezzo crescente
        return sorted.sort((a, b) => {
          return (a.prezzoPerHour || 0) - (b.prezzoPerHour || 0);
        });
      
      default:
        return sorted;
    }
  }, [filteredStrutture, sortType]);

  // Log delle strutture filtrate con dettagli
  console.log(`📋 Strutture filtrate: ${filteredStrutture.length}/${strutture.length}`);
  /*if (filteredStrutture.length > 0) {
    console.log("=== DETTAGLI STRUTTURE MOSTRATE ===");
    filteredStrutture.forEach((struttura, index) => {
      console.log(`${index + 1}. ${struttura.name}`);
      console.log(`   📍 Città: ${struttura.location.city}`);
      console.log(`   🏓 Sport: ${struttura.sport || 'N/A'}`);
      console.log(`   💰 Rating: ${struttura.rating?.average || 'N/A'} (${struttura.rating?.count || 0} recensioni)`);
      console.log(`   💳 Split Payment: ${struttura.isCostSplittingEnabled ? '✅' : '❌'}`);
      console.log(`   🎯 Partite Aperte: ${struttura.openGamesCount || 0}`);
      console.log(`   🖼️ Immagini: ${struttura.images?.length || 0}`);
      if (struttura.distanza !== undefined) {
        console.log(`   📏 Distanza: ${struttura.distanza.toFixed(1)} km`);
      }
      console.log('');
    });
  }*/

  const getMarkersForZoom = () => {
    const zoomLevel = region.latitudeDelta;
    
    if (filteredStrutture.length === 0) return [];
    
    // ZOOM VICINO - Tutti i marker individuali (< 0.05° ≈ 5km)
    if (zoomLevel < 0.05) {
      return filteredStrutture.map((struttura) => ({
        id: struttura._id,
        coordinate: {
          latitude: struttura.location.lat,
          longitude: struttura.location.lng,
        },
        struttura: struttura,
        isCluster: false,
      }));
    }
    
    // ZOOM MEDIO - Cluster per zona (0.05° - 2°)
    if (zoomLevel < 2) {
      const gridSize = Math.max(zoomLevel * 0.15, 0.03);
      const grid: Record<string, Struttura[]> = {};
      
      filteredStrutture.forEach((s) => {
        const x = Math.floor(s.location.lat / gridSize);
        const y = Math.floor(s.location.lng / gridSize);
        const key = `${x}_${y}`;
        
        if (!grid[key]) grid[key] = [];
        grid[key].push(s);
      });
      
      return Object.entries(grid).map(([key, strutture]) => {
        const avgLat = strutture.reduce((sum, s) => sum + s.location.lat, 0) / strutture.length;
        const avgLng = strutture.reduce((sum, s) => sum + s.location.lng, 0) / strutture.length;
        
        return {
          id: `cluster-${key}`,
          coordinate: {
            latitude: avgLat,
            longitude: avgLng,
          },
          struttura: strutture[0],
          isCluster: true,
          count: strutture.length,
        };
      });
    }
    
    // ZOOM LONTANO - Cluster per CITTÀ (> 2°)
    const cityGroups: Record<string, Struttura[]> = {};
    
    filteredStrutture.forEach((s) => {
      const city = s.location.city;
      if (!cityGroups[city]) cityGroups[city] = [];
      cityGroups[city].push(s);
    });
    
    return Object.entries(cityGroups).map(([city, strutture]) => {
      const avgLat = strutture.reduce((sum, s) => sum + s.location.lat, 0) / strutture.length;
      const avgLng = strutture.reduce((sum, s) => sum + s.location.lng, 0) / strutture.length;
      
      return {
        id: `cluster-city-${city}`,
        coordinate: {
          latitude: avgLat,
          longitude: avgLng,
        },
        struttura: strutture[0],
        isCluster: true,
        count: strutture.length,
        city: city,
      };
    });
  };

  const markers = viewMode === "map" ? getMarkersForZoom() : [];

  const getSortLabel = () => {
    switch (sortType) {
      case 'Consigliati':
        return 'Consigliati';
      case 'distanza':
        return 'Distanza';
      case 'prezzo':
        return 'Prezzo';
      default:
        return 'Consigliati';
    }
  };

  const handleImageSwipe = (strutturaId: string, direction: 'left' | 'right', totalImages: number) => {
    setCurrentImageIndexes((prev) => {
      const currentIndex = prev[strutturaId] || 0;
      let newIndex: number;

      if (direction === 'left') {
        // Swipe a sinistra = immagine successiva
        newIndex = currentIndex === totalImages - 1 ? 0 : currentIndex + 1;
      } else {
        // Swipe a destra = immagine precedente
        newIndex = currentIndex === 0 ? totalImages - 1 : currentIndex - 1;
      }

      return { ...prev, [strutturaId]: newIndex };
    });
  };

  const renderCard = ({ item }: { item: Struttura }) => {
    const currentIndex = currentImageIndexes[item._id] || 0;
    const imageUri = item.images?.length
      ? resolveImageUrl(item.images[currentIndex])
      : null;

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (item.images && item.images.length > 1) {
          if (gestureState.dx > 50) {
            // Swipe a destra
            handleImageSwipe(item._id, 'right', item.images.length);
          } else if (gestureState.dx < -50) {
            // Swipe a sinistra
            handleImageSwipe(item._id, 'left', item.images.length);
          }
        }
      },
    });

    // Create an array of active badges to render dynamically
    const badges = [];
    if (item.indoor !== undefined) {
      badges.push({
        icon: item.indoor ? "business-outline" : "sunny-outline",
        text: item.indoor ? "Indoor" : "Outdoor",
        style: item.indoor ? styles.badgeIndoor : styles.badgeOutdoor,
      });
    }
    if (item.isCostSplittingEnabled) {
      badges.push({
        icon: "card-outline",
        text: "Split Payment",
        style: styles.badgeSplitPayment,
      });
    }
    if (item.hasOpenGames) {
      badges.push({
        icon: "football-outline",
        text: "Partite Aperte",
        style: styles.badgeOpenGames,
      });
    }

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          navigation.navigate("FieldDetails", {
            struttura: item,
            from: "list",
          })
        }
      >
        <View {...panResponder.panHandlers} style={styles.imageContainer}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.image} />
          )}

          {/* Indicatori pallini */}
          {item.images && item.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {item.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentIndex && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

      <Pressable
        style={styles.favoriteButton}
        onPress={() => toggleFavorite(item._id)}
      >
        <Ionicons
          name={item.isFavorite ? "heart" : "heart-outline"}
          size={20}
          color={item.isFavorite ? "#FFB800" : "white"}
        />
      </Pressable>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.address} numberOfLines={1}>
                {item.location.address}, {item.location.city}
              </Text>
            </View>
            {item.distanza !== undefined && (
              <Text style={styles.distanza}>📍 {item.distanza.toFixed(1)} km</Text>
            )}
          </View>

          <View style={styles.pricePill}>
            <Text style={styles.priceLabel}>A partire da</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <Text style={styles.price}>{formatCurrency(item.prezzoPerHour ?? (item as any).pricePerHour ?? (item as any).price)}</Text>
              <Text style={styles.priceUnit}>/h</Text>
            </View>
          </View>
        </View>

        {/* Add badges row here in the descriptive part */}
        {badges.length > 0 && (
          <View style={styles.badgesRow}>
            {badges.map((badge, index) => (
              <View key={index} style={[styles.badge, badge.style]}>
                <Ionicons name={badge.icon} size={14} color="white" />
                <Text style={styles.badgeText}>{badge.text}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.tagsRow}>
          {item.sports?.slice(0, 2).map((sport, idx) => (
            <View key={idx} style={[styles.sportTag, { flexDirection: 'row', alignItems: 'center' }]}>
              <FontAwesome5 name="volleyball-ball" size={12} color="#666" style={{ marginRight: 5 }} />
              <Text style={styles.sportTagText}>{sport}</Text>
            </View>
          ))}
          {item.sports && item.sports.length > 2 && (
            <Text style={styles.moreText}>+{item.sports.length - 2}</Text>
          )}
        </View>

        <Pressable 
          style={styles.bookButton}
          onPress={() =>
            navigation.navigate("FieldDetails", {
              struttura: item,
              from: "list",
            })
          }
        >
          <Text style={styles.bookButtonText}>Prenota</Text>
          <Ionicons name="arrow-forward" size={14} color="white" />
        </Pressable>
      </View>
    </Pressable>
  );
};

  const renderListHeader = () => (
    <>
      {favoriteStrutture.length > 0 && (
        <View style={styles.favoritesSection}>
          <Pressable
            style={styles.favoritesSectionHeader}
            onPress={toggleFavoritesExpanded}
          >
            <View style={styles.favoritesHeaderLeft}>
              <Ionicons name="heart" size={18} color="#FFB800" />
              <Text style={styles.favoritesTitle}>Your favorites</Text>
              <View style={styles.favoritesCount}>
                <Text style={styles.favoritesCountText}>
                  {favoriteStrutture.length}
                </Text>
              </View>
            </View>
            <Ionicons
              name={favoritesExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </Pressable>

          {favoritesExpanded && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favoritesScroll}
            >
              {favoriteStrutture.map((fav) => {
                const currentIndex = currentImageIndexes[fav._id] || 0;
                const imageUri = fav.images?.length
                  ? resolveImageUrl(fav.images[currentIndex])
                  : null;

                const favPanResponder = PanResponder.create({
                  onStartShouldSetPanResponder: () => true,
                  onMoveShouldSetPanResponder: (_, gestureState) => {
                    return Math.abs(gestureState.dx) > 10;
                  },
                  onPanResponderRelease: (_, gestureState) => {
                    if (fav.images && fav.images.length > 1) {
                      if (gestureState.dx > 50) {
                        handleImageSwipe(fav._id, 'right', fav.images.length);
                      } else if (gestureState.dx < -50) {
                        handleImageSwipe(fav._id, 'left', fav.images.length);
                      }
                    }
                  },
                });

                return (
                  <Pressable
                    key={fav._id}
                    style={styles.favoriteCard}
                    onPress={() =>
                      navigation.navigate("FieldDetails", {
                        struttura: fav,
                        from: "favorites",
                      })
                    }
                  >
                    <View {...favPanResponder.panHandlers} style={styles.favoriteImageContainer}>
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.favoriteImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.favoriteImage} />
                      )}

                      {fav.images && fav.images.length > 1 && (
                        <View style={styles.favoriteImageIndicators}>
                          {fav.images.map((_, index) => (
                            <View
                              key={index}
                              style={[
                                styles.favoriteIndicator,
                                index === currentIndex && styles.favoriteIndicatorActive,
                              ]}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                    <View style={styles.favoriteContent}>
                      <Text style={styles.favoriteTitle} numberOfLines={1}>
                        {fav.name}
                      </Text>
                      <Text style={styles.favoriteCity} numberOfLines={1}>
                        {fav.location.city}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* Riga contatore e ordinamento */}
      <View style={styles.inlineResultsRow}>
        <Text style={styles.resultsCount}>
          {sortedStrutture.length} STRUTTURE TROVATE
        </Text>
        <Pressable 
          ref={sortButtonRef}
          style={styles.inlineSortButton}
          onPress={() => openSortMenuAtButton()}
        >
          <Text style={styles.inlineSortText}>{getSortLabel()}</Text>
          <Ionicons name="chevron-down" size={14} color="#2979ff" />
        </Pressable> 
      </View>

      {/* Menu ordinamento */}
      {showSortMenu && (
        <Modal
          visible={showSortMenu}
          animationType="fade"
          transparent
          onRequestClose={() => closeSortMenu()}
        >
          <Pressable 
            style={styles.sortMenuOverlay}
            onPress={() => closeSortMenu()}
          >
            <Animated.View
              style={[
                styles.anchoredSortMenu,
                sortMenuPosition ? {
                  top: Math.min(sortMenuPosition.y + sortMenuPosition.height + 0, windowHeight - 16),
                  left: Math.max(8, Math.min(sortMenuPosition.x + sortMenuPosition.width / 2 - MENU_WIDTH / 2, windowWidth - MENU_WIDTH - 8)),
                  width: MENU_WIDTH,
                  transform: [{ translateY: animatedSortMenu.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }) }],
                  opacity: animatedSortMenu,
                } : {
                  // fallback centered modal
                  top: windowHeight / 2 - 160,
                  left: (windowWidth - MENU_WIDTH) / 2,
                  width: MENU_WIDTH,
                  transform: [{ translateY: animatedSortMenu.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }) }],
                  opacity: animatedSortMenu,
                }
              ]}
            >
              {/* Triangolo che punta al pulsante */}
              {sortMenuPosition && (() => {
                const menuLeft = Math.max(8, Math.min(sortMenuPosition.x + sortMenuPosition.width / 2 - MENU_WIDTH / 2, windowWidth - MENU_WIDTH - 8));
                const buttonCenter = sortMenuPosition.x + sortMenuPosition.width / 2;
                const caretLeft = buttonCenter - menuLeft - 8;
                return <View style={[styles.sortMenuCaret, { left: caretLeft }]} />;
              })()}
              
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View style={styles.sortMenuHeader}>
                  <Text style={styles.sortMenuTitle}>Sort by</Text>
                  <Pressable
                    onPress={() => closeSortMenu()}
                    style={styles.sortMenuHeaderClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Chiudi"
                    accessibilityRole="button"
                  >
                    <Text style={styles.sortMenuHeaderCloseText}>✕</Text>
                  </Pressable>
                </View> 
              
                <Pressable
                  style={[
                    styles.sortMenuItem,
                    sortType === 'Consigliati' && styles.sortMenuItemActive
                  ]}
                  onPress={() => {
                    setSortType('Consigliati');
                    closeSortMenu();
                  }}
                >
                  <View style={styles.sortMenuItemLeft}>
                    <Ionicons name="star" size={20} color={sortType === 'Consigliati' ? '#2979ff' : '#666'} />
                    <View>
                      <Text style={[
                        styles.sortMenuItemText,
                        sortType === 'Consigliati' && styles.sortMenuItemTextActive
                      ]}>Consigliati</Text>
                      <Text style={styles.sortMenuItemSubtext}>Strutture più popolari</Text>
                    </View>
                  </View>
                  {sortType === 'Consigliati' && (
                    <Ionicons name="checkmark" size={24} color="#2979ff" />
                  )}
                </Pressable>

                {filters.city && (
                  <Pressable
                    style={[
                      styles.sortMenuItem,
                      sortType === 'distanza' && styles.sortMenuItemActive
                    ]}
                    onPress={() => {
                      setSortType('distanza');
                      closeSortMenu();
                    }}
                  >
                    <View style={styles.sortMenuItemLeft}>
                      <Ionicons name="location" size={20} color={sortType === 'distanza' ? '#2979ff' : '#666'} />
                      <View>
                        <Text style={[
                          styles.sortMenuItemText,
                          sortType === 'distanza' && styles.sortMenuItemTextActive
                        ]}>Distanza</Text>
                        <Text style={styles.sortMenuItemSubtext}>Più vicine a te</Text>
                      </View>
                    </View>
                    {sortType === 'distanza' && (
                      <Ionicons name="checkmark" size={24} color="#2979ff" />
                    )}
                  </Pressable>
                )}

                <Pressable
                  style={[
                    styles.sortMenuItem,
                    sortType === 'prezzo' && styles.sortMenuItemActive
                  ]}
                  onPress={() => {
                    setSortType('prezzo');
                    closeSortMenu();
                  }}
                >
                  <View style={styles.sortMenuItemLeft}>
                    <Ionicons name="cash" size={20} color={sortType === 'prezzo' ? '#2979ff' : '#666'} />
                    <View>
                      <Text style={[
                        styles.sortMenuItemText,
                        sortType === 'prezzo' && styles.sortMenuItemTextActive
                      ]}>Prezzo</Text>
                      <Text style={styles.sortMenuItemSubtext}>Più economiche</Text>
                    </View>
                  </View>
                  {sortType === 'prezzo' && (
                    <Ionicons name="checkmark" size={24} color="#2979ff" />
                  )}
                </Pressable>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {viewMode === "list" ? (
        <View style={{ flex: 1 }}>
          {/* Header con search e filtri */}
          <View style={styles.newHeader}>
            {/* Search Bar */}
            <View style={styles.newSearchRow}>
              <View style={styles.newSearchBox}>
                <Ionicons name="search-outline" size={20} color="#2979ff" />
                <TextInput
                  style={styles.newSearchInput}
                  placeholder="Cerca una struttura.."
                  placeholderTextColor="#999"
                  value={query}
                  onChangeText={setQuery}
                />
              </View>
              <Pressable
                style={styles.filterIconButton}
                onPress={() => setShowFilters(true)}
              >
                <Ionicons name="options-outline" size={22} color="#2979ff" />
                {activeFiltersCount > 0 && (
                  <View style={styles.filterBadge} />
                )}
              </Pressable>
            </View>

            {/* Location + Show Map */}
            <View style={styles.locationRow}>
              <Pressable 
                style={styles.locationSelector}
                onPress={() => setShowFilters(true)}
              >
                <Ionicons name="location-outline" size={18} color="#2979ff" />
                <Text style={styles.locationText}>
                  {filters.city || preferences?.preferredLocation?.city || "Seleziona città"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.showMapButton}
                onPress={() => setViewMode("map")}
              >
                <Ionicons name="map" size={16} color="#2979ff" />
                <Text style={styles.showMapText}>Mappa</Text>
              </Pressable>
            </View>

            {/* Sport Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sportChipsContainer}
              contentContainerStyle={styles.sportChipsContent}
            >
              {availableSports.map((sport) => {
                const isActive = selectedSport === sport;
                
                const getSportIcon = (sportName: string) => {
                  const lower = sportName.toLowerCase();
                  if (lower.includes('padel')) return 'tennisball';
                  if (lower.includes('tennis')) return 'tennisball';
                  if (lower.includes('football') || lower.includes('calcio')) return 'football';
                  if (lower.includes('volley')) return 'basketball';
                  return 'fitness';
                };
                
                const icon = getSportIcon(sport);
                
                return (
                  <Pressable
                    key={sport}
                    style={[
                      styles.sportChip,
                      isActive && styles.sportChipActive,
                    ]}
                    onPress={() => {
                      if (isActive) {
                        setSelectedSport(null);
                        setFilters(prev => ({ ...prev, sport: null }));
                      } else {
                        setSelectedSport(sport);
                        setFilters(prev => ({ ...prev, sport }));
                      }
                    }}
                  >
                    <Ionicons name={icon as any} size={18} color={isActive ? 'white' : '#2979ff'} />
                    <Text style={[
                      styles.sportChipText,
                      isActive && styles.sportChipTextActive,
                    ]}>
                      {sport}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Lista strutture con header */}
          <FlatList
            data={sortedStrutture}
            keyExtractor={(item) => item._id}
            renderItem={renderCard}
            ListHeaderComponent={renderListHeader}
            contentContainerStyle={{ paddingBottom: isTabMode ? TAB_BAR_HEIGHT + 80 : 80 }}
            onRefresh={onRefresh}
            refreshing={refreshing}
            ListEmptyComponent={
              isLoadingStrutture ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="large" color="#2979ff" />
                  <Text style={styles.emptyText}>Caricamento strutture...</Text>
                </View>
              ) : !filters.city && !preferences?.preferredLocation?.city ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="location-outline" size={64} color="#CCC" />
                  <Text style={styles.emptyText}>Seleziona una città</Text>
                  <Text style={styles.emptySubtext}>
                    Clicca sul pulsante filtri per scegliere dove cercare strutture
                  </Text>
                  <Pressable
                    style={[styles.bookButton, { marginTop: 16, paddingHorizontal: 24 }]}
                    onPress={() => setShowCitySelectionModal(true)}
                  >
                    <Ionicons name="location" size={16} color="white" style={{ marginRight: 6 }} />
                    <Text style={styles.bookButtonText}>Seleziona città</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={64} color="#CCC" />
                  <Text style={styles.emptyText}>Nessuna struttura trovata</Text>
                  <Text style={styles.emptySubtext}>
                    Prova a modificare i filtri di ricerca
                  </Text>
                </View>
              )
            }
          />
        </View>
      ) : (
        /* Vista Mappa */
        <View style={styles.mapContainer}>
          {isLoadingStrutture && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2979ff" />
              <Text style={styles.loadingText}>Caricamento Strutture...</Text>
            </View>
          )}
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {markers.map((marker) => (
              <Marker
                key={marker.id}
                coordinate={marker.coordinate}
                pinColor="#2979ff"
                onPress={() => {
                  if (marker.isCluster) {
                    const newRegion: Region = {
                      latitude: marker.coordinate.latitude,
                      longitude: marker.coordinate.longitude,
                      latitudeDelta: region.latitudeDelta * 0.15,
                      longitudeDelta: region.longitudeDelta * 0.15,
                    };
                    setRegion(newRegion);
                    mapRef.current?.animateToRegion(newRegion, 500);
                  } else {
                    setSelectedMarker(marker.struttura);
                  }
                }}
              >
                <View
                  style={[
                    styles.markerContainer,
                    marker.isCluster && styles.clusterMarker,
                  ]}
                >
                  {marker.isCluster ? (
                    <Text style={styles.clusterText}>{(marker as any).count}</Text>
                  ) : (
                    <Ionicons name="location" size={24} color="#2979ff" />
                  )}
                </View>
              </Marker>
            ))}
          </MapView>

          <Pressable 
            style={[
              styles.mapFilterButton,
              { top: insets.top + 16, right: insets.right + 16 }
            ]} 
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options-outline" size={24} color="#333" />
            {activeFiltersCount > 0 && (
              <View style={styles.mapFilterBadge}>
                <Text style={styles.mapFilterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[
              styles.mapBackButton,
              { top: insets.top + 74, right: insets.right + 16 }
            ]}
            onPress={() => setViewMode("list")}
          >
            <Ionicons name="list" size={24} color="#333" />
            <Text style={styles.mapBackText}>Lista</Text>
          </Pressable>

          <Pressable 
            style={[
              styles.mapLocationButton,
              { 
                bottom: (isTabMode ? TAB_BAR_HEIGHT : 0) + insets.bottom + 16,
                right: insets.right + 16
              }
            ]} 
            onPress={centerOnUser}
          >
            <Ionicons name="locate" size={24} color="#2979ff" />
          </Pressable>

          {selectedMarker && (
            <Modal visible={true} transparent animationType="fade">
              <Pressable
                style={styles.mapModalOverlay}
                onPress={() => setSelectedMarker(null)}
              >
                <Pressable 
                  style={styles.mapModalCard}
                  onPress={(e) => e.stopPropagation()}
                >
                  <Pressable
                    style={styles.mapModalClose}
                    onPress={() => setSelectedMarker(null)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </Pressable>

                  {selectedMarker.images?.length ? (
                    <Image
                      source={{ uri: resolveImageUrl(selectedMarker.images[0]) }}
                      style={styles.mapModalImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.mapModalImage} />
                  )}

                  <View style={styles.mapModalContent}>
                    <View style={styles.mapModalHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mapModalTitle}>{selectedMarker.name}</Text>
                        <View style={styles.mapModalLocation}>
                          <Ionicons name="location-outline" size={14} color="#666" />
                          <Text style={styles.mapModalAddress}>
                            {selectedMarker.location.city}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.mapModalPriceBox}>
                        <Text style={styles.mapModalPriceLabel}>da</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                          <Text style={styles.mapModalPrice}>{formatCurrency(selectedMarker.prezzoPerHour ?? (selectedMarker as any).pricePerHour ?? (selectedMarker as any).price)}</Text>
                          <Text style={styles.mapModalPriceUnit}>/h</Text>
                        </View>
                      </View>
                    </View>

                    {/* Badges (same as list view) */}
                    {(selectedMarker.indoor !== undefined || selectedMarker.isCostSplittingEnabled || selectedMarker.hasOpenGames) && (
                      <View style={styles.badgesRow}>
                        {selectedMarker.indoor !== undefined && (
                          <View style={[styles.badge, selectedMarker.indoor ? styles.badgeIndoor : styles.badgeOutdoor]}>
                            <Ionicons name={selectedMarker.indoor ? "business-outline" : "sunny-outline"} size={14} color="white" />
                            <Text style={styles.badgeText}>{selectedMarker.indoor ? "Indoor" : "Outdoor"}</Text>
                          </View>
                        )}

                        {selectedMarker.isCostSplittingEnabled && (
                          <View style={[styles.badge, styles.badgeSplitPayment]}>
                            <Ionicons name="card-outline" size={14} color="white" />
                            <Text style={styles.badgeText}>Split Payment</Text>
                          </View>
                        )}

                        {selectedMarker.hasOpenGames && (
                          <View style={[styles.badge, styles.badgeOpenGames]}>
                            <Ionicons name="football-outline" size={14} color="white" />
                            <Text style={styles.badgeText}>Partite Aperte</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Sport tags (same as list view) */}
                    {selectedMarker.sports && selectedMarker.sports.length > 0 && (
                      <View style={styles.tagsRow}>
                        {selectedMarker.sports.slice(0, 2).map((sport, idx) => (
                          <View key={idx} style={styles.sportTag}>
                            <Text style={styles.sportTagText}>{sport}</Text>
                          </View>
                        ))}
                        {selectedMarker.sports.length > 2 && (
                          <Text style={styles.moreText}>+{selectedMarker.sports.length - 2}</Text>
                        )}
                      </View>
                    )}

                    <Pressable
                      style={styles.mapModalButton}
                      onPress={() => {
                        setSelectedMarker(null);
                        navigation.navigate("FieldDetails", {
                          struttura: selectedMarker,
                          from: "map",
                          openCampiDisponibili: true,
                        });
                      }}
                    >
                      <Text style={styles.mapModalButtonText}>Vedi dettagli</Text>
                      <Ionicons name="arrow-forward" size={16} color="white" />
                    </Pressable>
                  </View>
                </Pressable>
              </Pressable>
            </Modal>
          )}
        </View>
      )}

      {/* Modals */}
      <AdvancedFiltersModal
        visible={showFilters}
        filters={filters}
        onClose={() => setShowFilters(false)}
        onApply={onApply}
        query={query}
        setQuery={setQuery}
        sports={sportsList.length ? sportsList : availableSports}
        showAlert={showAlert}
      />

      {/* Modal selezione città iniziale */}
      <Modal
        visible={showCitySelectionModal}
        animationType="slide"
        transparent
        onRequestClose={() => {}}
      >
        <View style={styles.citySelectionOverlay}>
          <View style={styles.citySelectionContent}>
            {/* Header con icona */}
            <View style={styles.citySelectionHeader}>
              <View style={styles.citySelectionIconContainer}>
                <Ionicons name="location" size={32} color="white" />
              </View>
              <Text style={styles.citySelectionTitle}>Benvenuto! 🎾</Text>
              <Text style={styles.citySelectionSubtitle}>
                Seleziona la tua città per scoprire le strutture sportive disponibili
              </Text>
            </View>
            
            {/* Opzione GPS */}
            <Pressable
              style={styles.gpsButton}
              onPress={async () => {
                try {
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  if (status !== "granted") {
                    showAlert({
                      type: 'error',
                      title: 'Permessi GPS necessari',
                      message: 'Abilita i permessi di localizzazione nelle impostazioni.',
                    });
                    return;
                  }

                  const loc = await Location.getCurrentPositionAsync({});
                  
                  // Reverse geocoding
                  const reverseGeocodeUrl = 
                    `https://nominatim.openstreetmap.org/reverse?` +
                    `lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&` +
                    `format=json&addressdetails=1`;
                  
                  const reverseRes = await fetch(reverseGeocodeUrl, {
                    headers: { 'User-Agent': 'SportBookingApp/1.0' },
                  });
                  
                  const reverseData = await reverseRes.json();
                  const city = reverseData.address?.city || reverseData.address?.town || reverseData.address?.village;
                  
                  if (city) {
                    await updatePreferredLocation(city, loc.coords.latitude, loc.coords.longitude);
                    setFilters(prev => ({ ...prev, city }));
                    setShowCitySelectionModal(false);
                    console.log('✅ Città GPS salvata:', city);
                  } else {
                    showAlert({
                      type: 'error',
                      title: 'Città non trovata',
                      message: 'Inserisci manualmente la città.',
                    });
                  }
                } catch (error) {
                  console.error('Errore GPS:', error);
                  showAlert({
                    type: 'error',
                    title: 'Errore GPS',
                    message: 'Impossibile rilevare la posizione. Inserisci manualmente la città.',
                  });
                }
              }}
            >
              <View style={styles.gpsButtonContent}>
                <View style={styles.gpsIconCircle}>
                  <Ionicons name="navigate" size={22} color="#2979ff" />
                </View>
                <View style={styles.gpsButtonTextContainer}>
                  <Text style={styles.gpsButtonTitle}>Usa la mia posizione</Text>
                  <Text style={styles.gpsButtonSubtext}>Rileva automaticamente</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            </Pressable>
            
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>oppure</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <View style={styles.manualInputWrapper}>
              <View style={[
                styles.manualInputContainer,
                cityValidation.isValid === true && styles.manualInputValid,
              ]}>
                <View style={styles.manualInputIconContainer}>
                  <Ionicons name="search-outline" size={20} color="#2979ff" />
                </View>
                <TextInput
                  style={styles.manualCityInput}
                  placeholder="Cerca la tua città..."
                  placeholderTextColor="#999"
                  value={filters.city || ""}
                  onChangeText={(text) => {
                    setFilters(prev => ({ ...prev, city: text || null }));
                    searchCitySuggestions(text);
                  }}
                  autoCapitalize="words"
                />
                
                {/* Feedback visivo validazione */}
                <View style={styles.cityValidationFeedback}>
                  {cityValidation.isValidating && (
                    <ActivityIndicator size="small" color="#2979ff" />
                  )}
                  {!cityValidation.isValidating && cityValidation.isValid === true && (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  )}
                </View>
              </View>
              
              {/* Lista suggerimenti città */}
              {showSuggestions && citySuggestions.length > 0 && (
                <View style={styles.citySuggestionsContainer}>
                  {citySuggestions.map((suggestion, index) => (
                    <Pressable
                      key={index}
                      style={styles.citySuggestionItem}
                      onPress={() => {
                        const selected = selectCity(suggestion);
                        setFilters(prev => ({ ...prev, city: selected.city }));
                      }}
                    >
                      <Ionicons name="location" size={20} color="#2979ff" />
                      <View style={styles.citySuggestionText}>
                        <Text style={styles.citySuggestionCity}>{suggestion.name}</Text>
                        {suggestion.region && (
                          <Text style={styles.citySuggestionRegion}>{suggestion.region}</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#999" />
                    </Pressable>
                  ))}
                </View>
              )}
              
            </View>
            
            <Pressable
              style={[
                styles.confirmCityButton, 
                (!filters.city || cityValidation.isValid !== true) && styles.confirmCityButtonDisabled
              ]}
              disabled={!filters.city || cityValidation.isValid !== true}
              onPress={async () => {
                if (filters.city && cityValidation.coordinates) {
                  try {
                    await updatePreferredLocation(
                      filters.city, 
                      cityValidation.coordinates.lat, 
                      cityValidation.coordinates.lng
                    );
                    setShowCitySelectionModal(false);
                    resetValidation();
                    console.log('✅ Città salvata:', filters.city);
                  } catch (error) {
                    console.error('Errore salvataggio città:', error);
                    showAlert({
                      type: 'error',
                      title: 'Errore',
                      message: 'Impossibile salvare la città. Riprova.',
                    });
                  }
                }
              }}
            >
                <Text style={styles.confirmCityButtonText}>
                  {filters.city ? `Conferma: ${filters.city}` : 'Inserisci una città'}
                </Text>
                {filters.city && (
                  <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginLeft: 8 }} />
                )}
              </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal permessi GPS */}
      <Modal
        visible={showLocationPermissionModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowLocationPermissionModal(false)}
      >
        <View style={styles.permissionModalOverlay}>
          <View style={styles.permissionModalContent}>
            <View style={styles.permissionModalIcon}>
              <Ionicons name="location-outline" size={48} color="#2979ff" />
            </View>
            
            <Text style={styles.permissionModalTitle}>Permessi GPS richiesti</Text>
            
            <Text style={styles.permissionModalMessage}>
              Per centrare la mappa sulla tua posizione attuale, abbiamo bisogno dell'accesso alla geolocalizzazione.
            </Text>
            
            <View style={styles.permissionModalButtons}>
              <Pressable
                style={styles.permissionModalCancelButton}
                onPress={() => setShowLocationPermissionModal(false)}
              >
                <Text style={styles.permissionModalCancelText}>Annulla</Text>
              </Pressable>
              
              <Pressable
                style={styles.permissionModalSettingsButton}
                onPress={() => {
                  setShowLocationPermissionModal(false);
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }}
              >
                <Text style={styles.permissionModalSettingsText}>Vai alle impostazioni</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <AlertComponent />
    </SafeAreaView>
  );
}
