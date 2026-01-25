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
import { Calendar } from 'react-native-calendars';
import API_URL from "../../../config/api";
import { AuthContext } from "../../../context/AuthContext";
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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function StruttureScreen({ isTabMode = false }: { isTabMode?: boolean }) {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { token } = useContext(AuthContext);
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

      const filterCity = filters.city;
      const prefCity = preferencesRef.current?.preferredLocation?.city;
      
      console.log("=== DEBUG STRUTTURE ===");
      console.log("📍 Totale strutture caricate:", data.length);
      console.log("🏙️ Filtro città attivo:", filterCity);
      console.log("⭐ Città preferita:", prefCity);
      console.log("🚫 User cleared city:", userClearedCity);
      console.log("📍 Preferenze location:", preferencesRef.current?.preferredLocation);
      
      if (userClearedCity) {
        console.log("🎯 CASO: Utente ha rimosso il filtro città");
        setActiveCity(null);
        setActiveRadius(null);
      }
      else if (!filterCity && !prefCity) {
        console.log("🎯 CASO: Nessun filtro città e nessuna preferenza");
        setActiveCity(null);
        setActiveRadius(null);
      } 
      else if (filterCity && filterCity !== prefCity) {
        console.log("🎯 CASO: Filtro città diverso da preferenza - geocoding", filterCity);
        try {
          const geocodeUrl = 
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(filterCity)},Italia&` +
            `format=json&limit=1`;
          
          const geocodeRes = await fetch(geocodeUrl, {
            headers: { 'User-Agent': 'SportBookingApp/1.0' },
          });
          
          const geocodeData = await geocodeRes.json();
          console.log("   Geocode risposta:", geocodeData);
          
          if (geocodeData && geocodeData.length > 0) {
            const filterLat = parseFloat(geocodeData[0].lat);
            const filterLng = parseFloat(geocodeData[0].lon);
            const radius = preferences?.preferredLocation?.radius || 30;
            
            console.log("   Centro geocodato:", { lat: filterLat, lng: filterLng, radius });
            
            data = data.map((s) => {
              const distance = calculateDistance(filterLat, filterLng, s.location.lat, s.location.lng);
              console.log(`   📍 ${s.name}: ${distance.toFixed(2)} km ${distance <= radius ? "✅" : "❌"}`);
              return {
                ...s,
                distance
              };
            });
            
            const beforeFilter = data.length;
            data = data.filter((s) => (s.distance || 0) <= radius);
            console.log(`   Strutture entro ${radius}km: ${data.length}/${beforeFilter}`);
            data.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            
            setActiveCity(filterCity);
            setActiveRadius(radius);
          } else {
            console.log("   ⚠️ Geocoding fallito");
            setActiveCity(null);
            setActiveRadius(null);
          }
        } catch (geoError) {
          console.error("   ❌ Errore geocoding:", geoError);
          setActiveCity(null);
          setActiveRadius(null);
        }
      }
      else if (preferencesRef.current?.preferredLocation && filterCity) {
        console.log("🎯 CASO: Filtro per città preferita con coordinate");
        const city = filterCity;
        const radius = preferencesRef.current.preferredLocation.radius || 30;
        const prefLat = preferencesRef.current.preferredLocation.lat;
        const prefLng = preferencesRef.current.preferredLocation.lng;
        
        console.log("   Centro preferenze:", { lat: prefLat, lng: prefLng, radius });
        
        data = data.map((s) => {
          const distance = calculateDistance(prefLat, prefLng, s.location.lat, s.location.lng);
          console.log(`   📍 ${s.name} (${s.location.city}):`, {
            coords: `${s.location.lat}, ${s.location.lng}`,
            distanza: `${distance.toFixed(2)} km`,
            dentroRaggio: distance <= radius ? "✅ SÌ" : "❌ NO"
          });
          return {
            ...s,
            distance
          };
        });
        
        const beforeFilter = data.length;
        data = data.filter((s) => (s.distance || 0) <= radius);
        console.log(`   Strutture entro ${radius}km: ${data.length}/${beforeFilter}`);
        data.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        
        setActiveCity(city);
        setActiveRadius(radius);
      }

      if (preferencesRef.current?.favoriteStrutture) {
        data = data.map((s) => ({
          ...s,
          isFavorite: preferencesRef.current.favoriteStrutture.includes(s._id),
        }));
      }

      setStrutture(data);
    } catch (error) {
      console.error("Errore caricamento strutture:", error);
    } finally {
      isLoadingStruttureRef.current = false;
      setIsLoadingStrutture(false);
    }
  }, [filters, userClearedCity]);

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
    } catch (error) {
      console.log("Errore nel centrare sulla posizione:", error);
      Alert.alert(
        "Errore",
        "Si è verificato un errore durante la geolocalizzazione. Assicurati di avere il GPS attivo."
      );
    }
  };

  const filteredStrutture = filterStrutture(strutture, filters, query);
  const activeFiltersCount = countActiveFilters(filters);

  // Log delle strutture filtrate con dettagli
  console.log(`📋 Strutture filtrate: ${filteredStrutture.length}/${strutture.length}`);
  if (filteredStrutture.length > 0) {
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
  }

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
              <Text style={styles.favoritesTitle}>I tuoi preferiti</Text>
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

                      {/* Indicatori pallini per favoriti */}
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

      <View style={styles.resultsBar}>
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {filteredStrutture.length} strutture trovate
          </Text>
          <View style={styles.locationBadge}>
            <Ionicons name="filter" size={14} color="#2979ff" />
            <Text style={styles.locationBadgeText}>
              Filtri attivi: {activeFiltersCount}
            </Text>
          </View>
          {(() => {
            console.log('🔍 DEBUG LABEL:', {
              filtersCity: filters.city,
              activeCity,
              activeRadius,
              userClearedCity,
              prefCity: preferencesRef.current?.preferredLocation?.city
            });
            const shouldShowCity = filters.city;
            console.log('Should show city:', shouldShowCity, 'filters.city truthy:', !!filters.city);
            return shouldShowCity ? (
              <View style={styles.locationBadge}>
                <Ionicons name="location" size={14} color="#2979ff" />
                <Text style={styles.locationBadgeText}>
                  {filters.city}{activeRadius ? ` (${activeRadius} km)` : ''}
                </Text>
              </View>
            ) : (
              <View style={styles.locationBadgeAll}>
                <Ionicons name="globe-outline" size={14} color="#4CAF50" />
                <Text style={styles.locationBadgeTextAll}>Tutta Italia</Text>
              </View>
            );
          })()}
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {viewMode === "list" && (
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Cerca strutture..."
                placeholderTextColor="#999"
                value={query}
                onChangeText={setQuery}
              />
            </View>

            <Pressable
              style={styles.viewToggle}
              onPress={() => setViewMode("map")}
            >
              <Ionicons name="map-outline" size={24} color="white" />
            </Pressable>
          </View>
        </View>
      )}

      {viewMode === "list" ? (
        <FlatList
          data={filteredStrutture}
          renderItem={renderCard}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={
            isLoadingStrutture ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2979ff" />
                <Text style={styles.loadingText}>Caricamento strutture...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Nessuna struttura trovata</Text>
                <Text style={styles.emptySubtext}>Prova a modificare i filtri</Text>
              </View>
            )
          }
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          key={`${filters.city}-${activeCity}-${activeRadius}`}
        />
      ) : (
        <View style={styles.mapContainer}>
          {isLoadingStrutture && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2979ff" />
              <Text style={styles.loadingText}>Caricamento strutture...</Text>
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
                      mapRef.current?.animateToRegion(newRegion, 500);
                    } else {
                      setSelectedMarker(marker.struttura);
                    }
                  }}
                />
              ))}
            </MapView>

            {/* ✅ GRUPPO BOTTONI ALLINEATI */}
            <View style={styles.mapControlsContainer}>
              {/* Bottone Vista Lista - PIÙ CHIARO */}
              <Pressable 
                style={styles.mapControlButtonPrimary} 
                onPress={() => {
                  console.log('📋 Pulsante Lista premuto - posizione: top 30, right 16');
                  setViewMode("list");
                }}
              >
                <Ionicons name="list" size={22} color="white" />
                <Text style={styles.mapControlButtonText}>Lista</Text>
              </Pressable>
            </View>

            {/* Pulsante geolocalizzazione in vista mappa */}
            <Pressable 
              style={[
                styles.geolocationFab,
                isTabMode && { bottom: 75 + TAB_BAR_HEIGHT }
              ]}
              onPress={() => {
                console.log('🗺️ Pulsante geolocalizzazione premuto - posizione: bottom 75, right 15');
                centerOnUser();
              }}
            >
              <Ionicons name="locate" size={22} color="white" />
            </Pressable>

            {selectedMarker && (
              <Modal
                visible={true}
                animationType="fade"
                transparent
                onRequestClose={() => setSelectedMarker(null)}
              >
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
                        <Text style={styles.mapModalButtonText}>Vedi i dettagli e prenota</Text>
                        <Ionicons name="arrow-forward" size={18} color="white" />
                      </Pressable>
                    </View>
                  </Pressable>
                </Pressable>
              </Modal>
            )}
          </View>
        )
      }

      <AdvancedFiltersModal
        visible={showFilters}
        filters={filters}
        query={query}
        setQuery={setQuery}
        onClose={() => setShowFilters(false)}
        onApply={(newFilters) => {
          // Traccia se l'utente ha modificato manualmente la città
          if (newFilters.city !== filters.city) {
            if (newFilters.city === null) {
              // Utente ha rimosso il filtro città
              setUserClearedCity(true);
              setUserManuallyChangedCity(true);
            } else {
              // Utente ha impostato una città diversa
              setUserClearedCity(false);
              setUserManuallyChangedCity(true);
            }
          }
          
          setFilters(newFilters);
          setShowFilters(false);
        }}
      />

      <Pressable 
        style={[
          styles.fab,
          viewMode === "list" && styles.fabList,
          isTabMode && { bottom: 20 + TAB_BAR_HEIGHT }
        ]} 
        onPress={() => {
          console.log('🔍 Pulsante filtri premuto - posizione: bottom 20, right 15');
          setShowFilters(true);
        }}
      >
        <Ionicons name="options-outline" size={24} color="white" />
        {activeFiltersCount > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{activeFiltersCount}</Text>
          </View>
        )}
      </Pressable>

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
    </SafeAreaView>
  );
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

  const sports = ["Beach Volley", "Volley"];
  const timeSlots = [
    "Mattina (6:00 - 12:00)",
    "Pomeriggio (12:00 - 18:00)",
    "Sera (18:00 - 24:00)",
  ];

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return "Seleziona una data";
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('it-IT', options);
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtri Avanzati</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={28} color="#333" />
            </Pressable>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            scrollEnabled={true}
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
          >

            <Text style={styles.sectionTitle}>Città</Text>
            <View style={styles.cityInputContainer}>
              <TextInput
                style={styles.cityInput}
                placeholder="Lascia vuoto per vedere tutte le strutture"
                value={tempFilters.city || ""}
                onChangeText={(text) =>
                  setTempFilters((prev) => ({ ...prev, city: text || null }))
                }
              />
                <Pressable
                style={styles.geolocationButton}
                onPress={async () => {
                  try {
                    // Richiedi sempre i permessi quando l'utente clicca
                    const { status } = await Location.requestForegroundPermissionsAsync();

                    if (status !== "granted") {
                      // L'utente ha negato i permessi, mostra un alert
                      Alert.alert(
                        "Permessi GPS richiesti",
                        "Per utilizzare la geolocalizzazione è necessario abilitare i permessi GPS nelle impostazioni del dispositivo.",
                        [
                          {
                            text: "Annulla",
                            style: "cancel"
                          },
                          {
                            text: "Impostazioni",
                            onPress: () => {
                              if (Platform.OS === 'ios') {
                                Linking.openURL('app-settings:');
                              } else {
                                Linking.openSettings();
                              }
                            }
                          }
                        ]
                      );
                      return;
                    }

                    const location = await Location.getCurrentPositionAsync({});
                    const { latitude, longitude } = location.coords;

                    // Reverse geocoding per ottenere la città
                    const reverseGeoUrl =
                      `https://nominatim.openstreetmap.org/reverse?` +
                      `lat=${latitude}&lon=${longitude}&format=json`;

                    const response = await fetch(reverseGeoUrl, {
                      headers: { 'User-Agent': 'SportBookingApp/1.0' },
                    });

                    const data = await response.json();
                    const city = data.address?.city ||
                                 data.address?.town ||
                                 data.address?.village ||
                                 data.address?.municipality || '';

                    if (city) {
                      setTempFilters((prev) => ({ ...prev, city }));
                    } else {
                      Alert.alert(
                        "Errore",
                        "Non è stato possibile determinare la tua posizione. Riprova."
                      );
                    }
                  } catch (error) {
                    console.error("Errore geolocalizzazione:", error);
                    Alert.alert(
                      "Errore",
                      "Si è verificato un errore durante la geolocalizzazione. Assicurati di avere il GPS attivo."
                    );
                  }
                }}
              >
                <Ionicons name="location" size={20} color="#2196F3" />
              </Pressable>
            </View>
            {tempFilters.city ? (
              <View style={styles.cityHintContainer}>
                <Text style={styles.cityHint}>
                  📍 Strutture filtrate per: {tempFilters.city}
                </Text>
                <Pressable
                  style={styles.clearCityButton}
                  onPress={() => setTempFilters((prev) => ({ ...prev, city: null }))}
                >
                  <Ionicons name="close-circle" size={20} color="#FF5252" />
                  <Text style={styles.clearCityText}>Rimuovi</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.allStructuresHint}>
                🌍 Verranno mostrate TUTTE le strutture disponibili
              </Text>
            )}

            <Text style={styles.sectionTitle}>Sport</Text>
            <View style={styles.optionsGrid}>
              {sports.map((sport) => (
                <Pressable
                  key={sport}
                  style={[
                    styles.option,
                    tempFilters.sport === sport && styles.optionActive,
                  ]}
                  onPress={() =>
                    setTempFilters((prev) => ({
                      ...prev,
                      sport: prev.sport === sport ? null : sport,
                    }))
                  }
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

            <Text style={styles.sectionTitle}>Campo</Text>
            <View style={styles.optionsGrid}>
              {["Indoor", "Outdoor"].map((tipo) => (
                <Pressable
                  key={tipo}
                  style={[
                    styles.option,
                    (tempFilters.indoor === true && tipo === "Indoor") ||
                    (tempFilters.indoor === false && tipo === "Outdoor") && styles.optionActive,
                  ]}
                  onPress={() =>
                    setTempFilters((prev) => ({
                      ...prev,
                      indoor: tipo === "Indoor" ? (prev.indoor === true ? null : true) : (prev.indoor === false ? null : false),
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      (tempFilters.indoor === true && tipo === "Indoor") ||
                      (tempFilters.indoor === false && tipo === "Outdoor") && styles.optionTextActive,
                    ]}
                  >
                    {tipo}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Data</Text>
            <Pressable
              style={[
                styles.datePickerButton,
                tempFilters.date && styles.datePickerButtonActive
              ]}
              onPress={() => setShowCalendar(true)}
            >
              <Ionicons 
                name="calendar-outline" 
                size={20} 
                color={tempFilters.date ? "#2196F3" : "#666"} 
              />
              <Text style={[
                styles.datePickerText,
                tempFilters.date && styles.datePickerTextActive
              ]}>
                {formatDisplayDate(tempFilters.date)}
              </Text>
              {tempFilters.date && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    setTempFilters((prev) => ({ ...prev, date: null }));
                  }}
                  style={styles.clearDateButton}
                >
                  <Ionicons name="close-circle" size={20} color="#FF5252" />
                </Pressable>
              )}
            </Pressable>

            <Text style={styles.sectionTitle}>Fascia Oraria</Text>
            <View style={styles.timeSlots}>
              {timeSlots.map((slot) => (
                <Pressable
                  key={slot}
                  style={[
                    styles.timeSlot,
                    tempFilters.timeSlot === slot && styles.timeSlotActive,
                  ]}
                  onPress={() =>
                    setTempFilters((prev) => ({
                      ...prev,
                      timeSlot: prev.timeSlot === slot ? null : slot,
                    }))
                  }
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
                    {slot}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Pagamento Diviso</Text>
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