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
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  Linking,
  PanResponder,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Calendar, LocaleConfig } from 'react-native-calendars';
import API_URL from "../../../config/api";
import { AuthContext } from "../../../context/AuthContext";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
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
};

function AdvancedFiltersModal({
  visible,
  filters,
  onClose,
  onApply,
  query,
  setQuery,
}: AdvancedFiltersModalProps) {
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);
  const [showCalendar, setShowCalendar] = useState(false);

  const sports = ["Volley", "Beach Volley", "Beach Tennis", "Tennis", "Padel", "Calcio", "Calcetto", "Calciotto", "Calcio a 7", "Basket"];

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtri Avanzati</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingHorizontal: 24 }}>
            <Text style={styles.sectionTitle}>Città</Text>
            <TextInput
              style={styles.cityInput}
              placeholder="Inserisci città"
              value={tempFilters.city || ""}
              onChangeText={(text) => setTempFilters((prev) => ({ ...prev, city: text || null }))}
            />

            <Text style={styles.sectionTitle}>Sport</Text>
            <View style={styles.optionsGrid}>
              {sports.map((sport) => (
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
                  <Text
                    style={[
                      styles.optionText,
                      tempFilters.sport === sport && styles.optionTextActive,
                    ]}
                  >
                    {sport}
                  </Text>
                </Pressable>
              ))}
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
                  <Text
                    style={[
                      styles.optionText,
                      ((tempFilters.indoor === true && tipo === "Indoor") ||
                      (tempFilters.indoor === false && tipo === "Outdoor")) ? styles.optionTextActive : null,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Data</Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => setShowCalendar(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
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
                    color={tempFilters.timeSlot === slot ? "white" : "#666"}
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
                  color={tempFilters.splitPayment === true ? "white" : "#666"}
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
                  color={tempFilters.openGames === true ? "white" : "#666"}
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
        </View>
      </View>

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
  const [sortType, setSortType] = useState<'recommended' | 'distance' | 'price'>('recommended');
  const [showSortMenu, setShowSortMenu] = useState(false);
  
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

  // Reset sortType to 'recommended' if 'distance' is selected but no city filter is set
  useEffect(() => {
    if (sortType === 'distance' && !filters.city) {
      setSortType('recommended');
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
      // Costruisci URL con parametri di query per filtri data/fascia oraria
      let url = `${API_URL}/strutture`;
      const params = new URLSearchParams();
      
      if (filters.date) {
        const formattedDate = formatDate(filters.date);
        if (formattedDate) {
          params.append('date', formattedDate);
        }
      }
      if (filters.timeSlot) {
        params.append('timeSlot', filters.timeSlot);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('🌐 URL richiesta:', url);
      const res = await fetch(url);
      console.log('📡 Risposta HTTP:', res.status, res.statusText);
      
      let data: Struttura[] = await res.json();
      console.log('📦 Dati ricevuti:', data.length, 'strutture');

      // 🆕 SISTEMA FALLBACK A 3 LIVELLI
      const filterCity = filters.city;
      const primaryCity = preferencesRef.current?.preferredLocation?.city;
      const suggestedCity = preferencesRef.current?.preferredLocation?.suggestedCity;
      const suggestedLat = preferencesRef.current?.preferredLocation?.suggestedLat;
      const suggestedLng = preferencesRef.current?.preferredLocation?.suggestedLng;
      
      // Determina quale città usare (priorità: filtro manuale > primaria > suggerita)
      const activeCity = filterCity || primaryCity || suggestedCity || null;
      
      console.log("=== NUOVO SISTEMA FALLBACK ===");
      console.log("📍 Totale strutture caricate:", data.length);
      console.log("🔍 Filtro manuale città:", filterCity);
      console.log("⭐ Città preferita primaria:", primaryCity);
      console.log("🤖 Città suggerita automatica:", suggestedCity);
      console.log("✅ Città attiva finale:", activeCity);
      
      if (activeCity) {
        // Usa GPS se disponibile, altrimenti usa coordinate preferenze o suggested
        let centerLat: number | null = null;
        let centerLng: number | null = null;
        let citySource = '';
        
        if (isUsingGPS && gpsLat && gpsLng) {
          centerLat = gpsLat;
          centerLng = gpsLng;
          citySource = 'GPS';
        } else if (filterCity === primaryCity && preferencesRef.current?.preferredLocation?.lat) {
          centerLat = preferencesRef.current.preferredLocation.lat;
          centerLng = preferencesRef.current.preferredLocation.lng;
          citySource = 'Preferenza primaria';
        } else if (!filterCity && !primaryCity && suggestedLat && suggestedLng) {
          centerLat = suggestedLat;
          centerLng = suggestedLng;
          citySource = 'Suggerita automatica';
        }
        
        // Se abbiamo coordinate, usa quelle; altrimenti geocodifica
        if (centerLat && centerLng) {
          console.log(`🎯 Usando coordinate da: ${citySource}`, { lat: centerLat, lng: centerLng });
          const radius = preferencesRef.current?.preferredLocation?.radius || 30;
          
          data = data.map((s) => ({
            ...s,
            distance: calculateDistance(centerLat!, centerLng!, s.location.lat, s.location.lng)
          }));
          
          const beforeFilter = data.length;
          data = data.filter((s) => (s.distance || 0) <= radius);
          console.log(`✅ Strutture entro ${radius}km: ${data.length}/${beforeFilter}`);
          data.sort((a, b) => (a.distance || 0) - (b.distance || 0));
          
          setActiveCity(activeCity);
          setActiveRadius(radius);
        } else {
          // Geocodifica città
          console.log("🗺️ Geocodifica necessaria per:", activeCity);
          try {
            const geocodeUrl = 
              `https://nominatim.openstreetmap.org/search?` +
              `q=${encodeURIComponent(activeCity)},Italia&` +
              `format=json&limit=1`;
            
            const geocodeRes = await fetch(geocodeUrl, {
              headers: { 'User-Agent': 'SportBookingApp/1.0' },
            });
            
            const geocodeData = await geocodeRes.json();
            
            if (geocodeData && geocodeData.length > 0) {
              const filterLat = parseFloat(geocodeData[0].lat);
              const filterLng = parseFloat(geocodeData[0].lon);
              const radius = 30;
              
              console.log("✅ Geocoding riuscito:", { lat: filterLat, lng: filterLng });
              
              data = data.map((s) => ({
                ...s,
                distance: calculateDistance(filterLat, filterLng, s.location.lat, s.location.lng)
              }));
              
              const beforeFilter = data.length;
              data = data.filter((s) => (s.distance || 0) <= radius);
              console.log(`✅ Strutture entro ${radius}km: ${data.length}/${beforeFilter}`);
              data.sort((a, b) => (a.distance || 0) - (b.distance || 0));
              
              setActiveCity(activeCity);
              setActiveRadius(radius);
            } else {
              console.log("⚠️ Geocoding fallito, mostro tutte le strutture");
              setActiveCity(null);
              setActiveRadius(null);
            }
          } catch (geoError) {
            console.error("❌ Errore geocoding:", geoError);
            setActiveCity(null);
            setActiveRadius(null);
          }
        }
      } else {
        // Caso rarissimo: nessuna città disponibile
        console.log("⚠️ Nessuna città disponibile (nessun filtro, preferenza o suggerimento)");
        setActiveCity(null);
        setActiveRadius(null);
      }

      if (preferencesRef.current?.favoriteStrutture) {
        data = data.map((s) => ({
          ...s,
          isFavorite: preferencesRef.current.favoriteStrutture.includes(s._id),
        }));
      }

      setStrutture(data);
      
      // Estrai sport unici dalle strutture (tutti gli sport, non solo il primo)
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

  useFocusEffect(
    useCallback(() => {
      console.log('🎯 useFocusEffect triggered, token:', !!token);
      loadPreferences();
      return () => {};
    }, [token, loadPreferences])
  );

  // Aggiorna città preferita dall'ultimo luogo visitato
  useEffect(() => {
    console.log('🔄 [useEffect] lastVisitedCity cambiato:', lastVisitedCity, 'token presente:', !!token);
    if (lastVisitedCity && token && !preferences?.preferredLocation?.city) {
      console.log('📍 [useEffect] Chiamo updatePreferredLocation per:', lastVisitedCity);
      updatePreferredLocation(lastVisitedCity, 0, 0); // Coordinate placeholder, forse geocodare
    }
  }, [lastVisitedCity, token, preferences?.preferredLocation?.city]);

  useEffect(() => {
    if (!token || !preferencesLoaded) return;
    loadStrutture();
  }, [token, loadStrutture, preferencesLoaded]);

  const loadFavorites = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/users/preferences/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setFavoriteStrutture(data);
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
          { text: "Annulla", style: "cancel" },
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
      case 'recommended':
        // Ordina per rating medio (VIP)
        return sorted.sort((a, b) => {
          const aRating = a.rating?.average || 0;
          const bRating = b.rating?.average || 0;
          return bRating - aRating;
        });
      
      case 'distance':
        // Ordina per distanza (se disponibile)
        return sorted.sort((a, b) => {
          const aDistance = a.distance ?? Infinity;
          const bDistance = b.distance ?? Infinity;
          return aDistance - bDistance;
        });
      
      case 'price':
        // Ordina per prezzo crescente
        return sorted.sort((a, b) => {
          return (a.pricePerHour || 0) - (b.pricePerHour || 0);
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
      if (struttura.distance !== undefined) {
        console.log(`   📏 Distanza: ${struttura.distance.toFixed(1)} km`);
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
      case 'recommended':
        return 'Consigliati';
      case 'distance':
        return 'Distanza';
      case 'price':
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
            {item.distance !== undefined && (
              <Text style={styles.distance}>📍 {item.distance.toFixed(1)} km</Text>
            )}
          </View>

          <View>
            <Text style={styles.priceLabel}>A partire da</Text>
            <Text style={styles.price}>€{item.pricePerHour}</Text>
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
          style={styles.inlineSortButton}
          onPress={() => setShowSortMenu(true)}
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
          onRequestClose={() => setShowSortMenu(false)}
        >
          <Pressable 
            style={styles.sortMenuOverlay}
            onPress={() => setShowSortMenu(false)}
          >
            <Pressable 
              style={styles.sortMenuContent}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.sortMenuTitle}>Sort by</Text>
              
              <Pressable
                style={[
                  styles.sortMenuItem,
                  sortType === 'recommended' && styles.sortMenuItemActive
                ]}
                onPress={() => {
                  setSortType('recommended');
                  setShowSortMenu(false);
                }}
              >
                <View style={styles.sortMenuItemLeft}>
                  <Ionicons name="star" size={20} color={sortType === 'recommended' ? '#2979ff' : '#666'} />
                  <View>
                    <Text style={[
                      styles.sortMenuItemText,
                      sortType === 'recommended' && styles.sortMenuItemTextActive
                    ]}>Recommended</Text>
                    <Text style={styles.sortMenuItemSubtext}>Most popular structures</Text>
                  </View>
                </View>
                {sortType === 'recommended' && (
                  <Ionicons name="checkmark" size={24} color="#2979ff" />
                )}
              </Pressable>

              {filters.city && (
              <Pressable
                style={[
                  styles.sortMenuItem,
                  sortType === 'distance' && styles.sortMenuItemActive
                ]}
                onPress={() => {
                  setSortType('distance');
                  setShowSortMenu(false);
                }}
              >
                <View style={styles.sortMenuItemLeft}>
                  <Ionicons name="location" size={20} color={sortType === 'distance' ? '#2979ff' : '#666'} />
                  <View>
                    <Text style={[
                      styles.sortMenuItemText,
                      sortType === 'distance' && styles.sortMenuItemTextActive
                    ]}>Distance</Text>
                    <Text style={styles.sortMenuItemSubtext}>Closest to you</Text>
                  </View>
                </View>
                {sortType === 'distance' && (
                  <Ionicons name="checkmark" size={24} color="#2979ff" />
                )}
              </Pressable>
              )}

              <Pressable
                style={[
                  styles.sortMenuItem,
                  sortType === 'price' && styles.sortMenuItemActive
                ]}
                onPress={() => {
                  setSortType('price');
                  setShowSortMenu(false);
                }}
              >
                <View style={styles.sortMenuItemLeft}>
                  <Ionicons name="cash" size={20} color={sortType === 'price' ? '#2979ff' : '#666'} />
                  <View>
                    <Text style={[
                      styles.sortMenuItemText,
                      sortType === 'price' && styles.sortMenuItemTextActive
                    ]}>Price</Text>
                    <Text style={styles.sortMenuItemSubtext}>Lowest first</Text>
                  </View>
                </View>
                {sortType === 'price' && (
                  <Ionicons name="checkmark" size={24} color="#2979ff" />
                )}
              </Pressable>

              <Pressable
                style={styles.sortMenuCloseButton}
                onPress={() => setShowSortMenu(false)}
              >
                <Text style={styles.sortMenuCloseText}>Close</Text>
              </Pressable>
            </Pressable>
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
                <Ionicons name="search-outline" size={20} color="#999" />
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
                <Ionicons name="options-outline" size={22} color="#666" />
                {activeFiltersCount > 0 && (
                  <View style={styles.filterBadge} />
                )}
              </Pressable>
            </View>

            {/* Location + Show Map */}
            <View style={styles.locationRow}>
              <Pressable style={styles.locationSelector}>
                <Ionicons name="location-outline" size={18} color="#666" />
                <Text style={styles.locationText}>
                  {filters.city || preferences?.preferredLocation?.city || "Roma, Italy"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
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
            style={styles.mapBackButton}
            onPress={() => setViewMode("list")}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
            <Text style={styles.mapBackText}>Torna alla lista</Text>
          </Pressable>

          <Pressable 
            style={styles.mapFilterButton} 
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options-outline" size={24} color="#333" />
            {activeFiltersCount > 0 && (
              <View style={styles.mapFilterBadge}>
                <Text style={styles.mapFilterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </Pressable>

          <Pressable style={styles.mapLocationButton} onPress={centerOnUser}>
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
                        <Text style={styles.mapModalPrice}>€{selectedMarker.pricePerHour}</Text>
                      </View>
                    </View>

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
      />

      {/* Modal selezione città iniziale */}
      <Modal
        visible={showCitySelectionModal}
        animationType="fade"
        transparent
        onRequestClose={() => {}}
      >
        <View style={styles.permissionModalOverlay}>
          <View style={styles.permissionModalContent}>
            <View style={styles.permissionModalIcon}>
              <Ionicons name="location-outline" size={48} color="#2979ff" />
            </View>
            
            <Text style={styles.permissionModalTitle}>Seleziona la tua città</Text>
            
            <Text style={styles.permissionModalMessage}>
              Per mostrarti le strutture più rilevanti, seleziona la città in cui giochi più spesso.
            </Text>
            
            <TextInput
              style={styles.cityInput}
              placeholder="Inserisci città"
              value={filters.city || ""}
              onChangeText={(text) => setFilters(prev => ({ ...prev, city: text || null }))}
            />
            
            <View style={styles.permissionModalButtons}>
              <Pressable
                style={styles.permissionModalSettingsButton}
                onPress={() => {
                  if (filters.city) {
                    updatePreferredLocation(filters.city, 0, 0);
                    setShowCitySelectionModal(false);
                  }
                }}
              >
                <Text style={styles.permissionModalSettingsText}>Conferma</Text>
              </Pressable>
            </View>
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
