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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import API_URL from "../config/api";
import { AuthContext } from "../context/AuthContext";

// ✅ Import stili
import { styles } from "./styles-player/StruttureScreen.styles";

// ✅ Import utils e types
import {
  Struttura,
  Cluster,
  FilterState,
  UserPreferences,
  calculateDistance,
  createClusters,
  filterStrutture,
  countActiveFilters,
} from "./utils-player/StruttureScreen-utils";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function StruttureScreen() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { token } = useContext(AuthContext);

  const [strutture, setStrutture] = useState<Struttura[]>([]);
  const [favoriteStrutture, setFavoriteStrutture] = useState<Struttura[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedMarker, setSelectedMarker] = useState<Struttura | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  
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
  });

  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [userClearedCity, setUserClearedCity] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    if (isFirstLoad && preferences?.preferredLocation?.city) {
      setFilters(prev => ({
        ...prev,
        city: preferences.preferredLocation!.city,
      }));
      setIsFirstLoad(false);
    }
  }, [preferences, isFirstLoad]);

  useFocusEffect(
    useCallback(() => {
      if (!preferencesLoaded) {
        loadPreferences();
      }
      return () => {};
    }, [preferencesLoaded])
  );

  const loadPreferences = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/users/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const prefs = await res.json();
        setPreferences(prefs);
        setPreferencesLoaded(true);

        if (prefs.preferredLocation) {
          setRegion({
            latitude: prefs.preferredLocation.lat,
            longitude: prefs.preferredLocation.lng,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          });
        }
      }
    } catch (error) {
      console.error("Errore caricamento preferenze:", error);
    }
  };

  useEffect(() => {
    if (preferencesLoaded) {
      loadStrutture();
      if (token) loadFavorites();
    }
  }, [filters, preferences, preferencesLoaded, token]);

  const loadStrutture = async () => {
    try {
      const res = await fetch(`${API_URL}/strutture`);
      let data: Struttura[] = await res.json();

      const filterCity = filters.city;
      const prefCity = preferences?.preferredLocation?.city;
      
      if (userClearedCity) {
        setActiveCity(null);
        setActiveRadius(null);
      }
      else if (!filterCity && !prefCity) {
        setActiveCity(null);
        setActiveRadius(null);
      } 
      else if (filterCity && filterCity !== prefCity) {
        try {
          const geocodeUrl = 
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(filterCity)},Italia&` +
            `format=json&limit=1`;
          
          const geocodeRes = await fetch(geocodeUrl, {
            headers: { 'User-Agent': 'SportBookingApp/1.0' },
          });
          
          const geocodeData = await geocodeRes.json();
          
          if (geocodeData && geocodeData.length > 0) {
            const filterLat = parseFloat(geocodeData[0].lat);
            const filterLng = parseFloat(geocodeData[0].lon);
            const radius = preferences?.preferredLocation?.radius || 30;
            
            data = data.map((s) => ({
              ...s,
              distance: calculateDistance(filterLat, filterLng, s.location.lat, s.location.lng),
            }));
            
            data = data.filter((s) => (s.distance || 0) <= radius);
            data.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            
            setActiveCity(filterCity);
            setActiveRadius(radius);
          } else {
            setActiveCity(null);
            setActiveRadius(null);
          }
        } catch (geoError) {
          setActiveCity(null);
          setActiveRadius(null);
        }
      }
      else if (preferences?.preferredLocation && filterCity) {
        const city = filterCity;
        const radius = preferences.preferredLocation.radius || 30;
        
        data = data.map((s) => ({
          ...s,
          distance: calculateDistance(
            preferences.preferredLocation!.lat,
            preferences.preferredLocation!.lng,
            s.location.lat,
            s.location.lng
          ),
        }));
        
        data = data.filter((s) => (s.distance || 0) <= radius);
        data.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        
        setActiveCity(city);
        setActiveRadius(radius);
      }

      if (preferences?.favoriteStrutture) {
        data = data.map((s) => ({
          ...s,
          isFavorite: preferences.favoriteStrutture.includes(s._id),
        }));
      }

      setStrutture(data);
    } catch (error) {
      console.error("Errore caricamento strutture:", error);
    }
  };

  const loadFavorites = async () => {
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
  };

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

    const struttura = strutture.find((s) => s._id === strutturaId);
    if (!struttura) return;

    const isFav = struttura.isFavorite;

    setStrutture((prev) =>
      prev.map((s) =>
        s._id === strutturaId ? { ...s, isFavorite: !isFav } : s
      )
    );

    try {
      const res = await fetch(
        `${API_URL}/users/preferences/favorites/${strutturaId}`,
        {
          method: isFav ? "DELETE" : "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
        }
      );

      if (res.ok) {
        await loadFavorites();
      } else {
        setStrutture((prev) =>
          prev.map((s) =>
            s._id === strutturaId ? { ...s, isFavorite: isFav } : s
          )
        );
        alert("Errore durante l'operazione");
      }
    } catch (error) {
      console.error("Errore toggle preferito:", error);
      setStrutture((prev) =>
        prev.map((s) =>
          s._id === strutturaId ? { ...s, isFavorite: isFav } : s
        )
      );
      alert("Errore di rete");
    }
  };

  // ✅ Usa funzione esterna per filtering
  const filtered = filterStrutture(strutture, filters, query);

  const centerOnUser = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion(
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      500
    );
  };

  const zoomDelta = Math.max(region.latitudeDelta, region.longitudeDelta);
  const shouldShowClusters = zoomDelta > 0.1;

  useEffect(() => {
    if (shouldShowClusters) {
      setSelectedMarker(null);
    }
  }, [shouldShowClusters]);

  // ✅ Usa funzione esterna per clustering
  const clusters = shouldShowClusters ? createClusters(filtered, region) : [];

  const handleClusterPress = (cluster: Cluster) => {
    mapRef.current?.animateToRegion(
      {
        latitude: cluster.coordinate.latitude,
        longitude: cluster.coordinate.longitude,
        latitudeDelta: region.latitudeDelta * 0.4,
        longitudeDelta: region.longitudeDelta * 0.4,
      },
      500
    );
  };

  // ✅ Usa funzione esterna per contare filtri
  const activeFiltersCount = countActiveFilters(filters);

  const renderItem = ({ item }: { item: Struttura }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        navigation.navigate("FieldDetails", {
          struttura: item,
          from: "search",
        })
      }
    >
      <Image
        source={{
          uri: item.images?.[0] ?? "https://picsum.photos/600/400",
        }}
        style={styles.image}
      />

      <View
        style={[
          styles.badge,
          item.indoor ? styles.badgeIndoor : styles.badgeOutdoor,
        ]}
      >
        <Ionicons
          name={item.indoor ? "business" : "sunny"}
          size={12}
          color="white"
        />
        <Text style={styles.badgeText}>
          {item.indoor ? "Indoor" : "Outdoor"}
        </Text>
      </View>

      <Pressable
        style={styles.favoriteButton}
        onPress={() => toggleFavorite(item._id)}
      >
        <Ionicons
          name={item.isFavorite ? "star" : "star-outline"}
          size={24}
          color={item.isFavorite ? "#FFB800" : "white"}
        />
      </Pressable>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color="#2979ff" />
              <Text style={styles.address}>{item.location.city}</Text>
              {item.distance !== undefined && (
                <Text style={styles.distance}>• {item.distance.toFixed(1)} km</Text>
              )}
            </View>
          </View>

          {item.rating && (
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.ratingText}>
                {item.rating.average.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {item.sports && item.sports.length > 0 && (
          <View style={styles.tagsRow}>
            {item.sports.slice(0, 3).map((sport, idx) => (
              <View key={idx} style={styles.sportTag}>
                <Text style={styles.sportTagText}>{sport}</Text>
              </View>
            ))}
            {item.sports.length > 3 && (
              <Text style={styles.moreText}>+{item.sports.length - 3}</Text>
            )}
          </View>
        )}

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>da</Text>
            <Text style={styles.price}>€{item.pricePerHour}</Text>
          </View>

          <Pressable
            style={styles.bookButton}
            onPress={() =>
              navigation.navigate("FieldDetails", {
                struttura: item,
                from: "search",
                openCampiDisponibili: true,
              })
            }
          >
            <Text style={styles.bookButtonText}>Prenota</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [80, 70],
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* ANIMATED HEADER */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              placeholder="Cerca città o struttura..."
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholderTextColor="#999"
            />
          </View>

          <Pressable
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === "list" ? "map" : "list")}
          >
            <Ionicons
              name={viewMode === "list" ? "map" : "list"}
              size={22}
              color="white"
            />
          </Pressable>
        </View>
      </Animated.View>

      {/* ✅ FAVORITES SECTION - COLLAPSIBLE */}
      {favoriteStrutture.length > 0 && viewMode === "list" && (
        <View style={styles.favoritesSection}>
          <Pressable 
            style={styles.favoritesSectionHeader}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setFavoritesExpanded(!favoritesExpanded);
            }}
            hitSlop={10}
          >
            <View style={styles.favoritesHeaderLeft}>
              <Ionicons name="star" size={18} color="#FFB800" />
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
              {favoriteStrutture.map((item) => (
                <Pressable
                  key={item._id}
                  style={styles.favoriteCard}
                  onPress={() =>
                    navigation.navigate("FieldDetails", {
                      struttura: item,
                      from: "favorites",
                    })
                  }
                >
                  <Image
                    source={{
                      uri: item.images?.[0] ?? "https://picsum.photos/300/200",
                    }}
                    style={styles.favoriteImage}
                  />
                  <View style={styles.favoriteContent}>
                    <Text style={styles.favoriteTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.favoriteCity}>{item.location.city}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* RESULTS COUNT */}
      <View style={styles.resultsBar}>
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {filtered.length} {filtered.length === 1 ? "struttura" : "strutture"}{" "}
            {filtered.length === 1 ? "trovata" : "trovate"}
          </Text>
          
          {activeCity && activeRadius && (
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={12} color="#2979ff" />
              <Text style={styles.locationBadgeText}>
                {activeCity} ({activeRadius} km)
              </Text>
            </View>
          )}
          
          {!activeCity && !activeRadius && (
            <View style={styles.locationBadgeAll}>
              <Ionicons name="globe" size={12} color="#4CAF50" />
              <Text style={styles.locationBadgeTextAll}>Tutte</Text>
            </View>
          )}
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.container}>
        {viewMode === "list" ? (
          <Animated.FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 120 }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={region}
              onRegionChangeComplete={setRegion}
              onPress={() => setSelectedMarker(null)}
            >
              {shouldShowClusters ? (
                clusters.map((cluster) => (
                  <Marker
                    key={cluster.id}
                    coordinate={cluster.coordinate}
                    onPress={() => handleClusterPress(cluster)}
                  >
                    <Ionicons name="location-sharp" size={36} color="#2979ff" />
                  </Marker>
                ))
              ) : (
                filtered.map((s) => {
                  const isSelected = selectedMarker?._id === s._id;

                  return (
                    <Marker
                      key={s._id}
                      coordinate={{
                        latitude: s.location.lat,
                        longitude: s.location.lng,
                      }}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedMarker(s);
                      }}
                    >
                      <Ionicons
                        name={s.isFavorite ? "star" : "location-sharp"}
                        size={isSelected ? 40 : 34}
                        color={
                          s.isFavorite
                            ? "#FFB800"
                            : isSelected
                            ? "#2979ff"
                            : "#FF5252"
                        }
                      />
                    </Marker>
                  );
                })
              )}
            </MapView>

            <Pressable style={styles.geoButton} onPress={centerOnUser}>
              <Ionicons name="navigate" size={22} color="#2979ff" />
            </Pressable>

            {selectedMarker && !shouldShowClusters && (
              <View style={styles.mapCard}>
                <View style={styles.mapCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mapTitle}>{selectedMarker.name}</Text>
                    <Text style={styles.mapAddress}>
                      {selectedMarker.location.address}
                    </Text>
                  </View>
                  {selectedMarker.rating && (
                    <View style={styles.mapRating}>
                      <Ionicons name="star" size={16} color="#FFB800" />
                      <Text style={styles.mapRatingText}>
                        {selectedMarker.rating.average.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>

                <Pressable
                  style={styles.mapBookButton}
                  onPress={() =>
                    navigation.navigate("FieldDetails", {
                      struttura: selectedMarker,
                      from: "map",
                      openCampiDisponibili: true,
                    })
                  }
                >
                  <Text style={styles.mapBookButtonText}>Prenota ora</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>

      <AdvancedFiltersModal
        visible={showFilters}
        filters={filters}
        onClose={() => setShowFilters(false)}
        onApply={(newFilters) => {
          if (newFilters.city === null && filters.city !== null) {
            setUserClearedCity(true);
          } else if (newFilters.city !== null) {
            setUserClearedCity(false);
          }
          
          setFilters(newFilters);
          setShowFilters(false);
        }}
      />

      <Pressable style={styles.fab} onPress={() => setShowFilters(true)}>
        <Ionicons name="options-outline" size={26} color="white" />
        {activeFiltersCount > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{activeFiltersCount}</Text>
          </View>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

/* =========================
   ADVANCED FILTERS MODAL  
========================= */
type AdvancedFiltersModalProps = {
  visible: boolean;
  filters: FilterState;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
};

function AdvancedFiltersModal({
  visible,
  filters,
  onClose,
  onApply,
}: AdvancedFiltersModalProps) {
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);

  const sports = ["Beach Volley", "Volley"];
  const timeSlots = [
    "Mattina (6:00 - 12:00)",
    "Pomeriggio (12:00 - 18:00)",
    "Sera (18:00 - 24:00)",
  ];

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtri Avanzati</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={28} color="#333" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Città</Text>
            <TextInput
              style={styles.cityInput}
              placeholder="Lascia vuoto per vedere tutte le strutture"
              value={tempFilters.city || ""}
              onChangeText={(text) =>
                setTempFilters((prev) => ({ ...prev, city: text || null }))
              }
            />
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

            <Text style={styles.sectionTitle}>Data</Text>
            <View style={styles.dateRow}>
              {["Oggi", "Domani", "Questo weekend"].map((label, idx) => {
                const date = new Date();
                if (idx === 1) date.setDate(date.getDate() + 1);
                if (idx === 2) {
                  const day = date.getDay();
                  const daysUntilSaturday = (6 - day + 7) % 7;
                  date.setDate(date.getDate() + daysUntilSaturday);
                }

                const isSelected =
                  tempFilters.date?.toDateString() === date.toDateString();

                return (
                  <Pressable
                    key={label}
                    style={[
                      styles.dateOption,
                      isSelected && styles.dateOptionActive,
                    ]}
                    onPress={() =>
                      setTempFilters((prev) => ({
                        ...prev,
                        date: isSelected ? null : date,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.dateOptionText,
                        isSelected && styles.dateOptionTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

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
    </Modal>
  );
}