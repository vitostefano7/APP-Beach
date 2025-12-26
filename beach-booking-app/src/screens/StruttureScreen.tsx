import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MapView, { Marker, Circle, Region } from "react-native-maps";
import * as Location from "expo-location";
import API_URL from "../config/api";

/* =========================
   TYPES
========================= */
type Struttura = {
  _id: string;
  name: string;
  pricePerHour: number;
  indoor: boolean;
  location: {
    address: string;
    city: string;
    lat: number;
    lng: number;
  };
  rating?: {
    average: number;
    count: number;
  };
  images: string[];
  sports?: string[]; // Sport disponibili
};

type Cluster = {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  strutture: Struttura[];
  radius: number;
};

type FilterState = {
  indoor: boolean | null;
  sport: string | null;
  date: Date | null;
  timeSlot: string | null;
};

/* =========================
   SCREEN
========================= */
export default function StruttureScreen() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [strutture, setStrutture] = useState<Struttura[]>([]);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedMarker, setSelectedMarker] = useState<Struttura | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: 45.4642,
    longitude: 9.19,
    latitudeDelta: 5,
    longitudeDelta: 5,
  });

  // Filtri avanzati
  const [filters, setFilters] = useState<FilterState>({
    indoor: null,
    sport: null,
    date: null,
    timeSlot: null,
  });

  /* -------- FETCH -------- */
  useEffect(() => {
    fetch(`${API_URL}/strutture`)
      .then(r => r.json())
      .then(setStrutture)
      .catch(console.error);
  }, []);

  /* -------- FILTER -------- */
  const filtered = strutture.filter(s => {
    // Filtro indoor/outdoor
    if (filters.indoor !== null && s.indoor !== filters.indoor) return false;

    // Filtro sport
    if (filters.sport) {
      console.log(`Filtro sport attivo: ${filters.sport}`);
      console.log(`Struttura ${s.name} ha sports:`, s.sports);
      
      if (!s.sports || s.sports.length === 0) {
        console.log(`❌ ${s.name} esclusa (nessuno sport disponibile)`);
        return false; // Escludi strutture senza sport definiti
      }
      
      if (!s.sports.includes(filters.sport)) {
        console.log(`❌ ${s.name} esclusa (non ha ${filters.sport})`);
        return false;
      }
      
      console.log(`✅ ${s.name} inclusa (ha ${filters.sport})`);
    }

    // Filtro ricerca testuale
    if (
      query &&
      !`${s.name} ${s.location.city}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
      return false;

    // TODO: Filtro per data e fascia oraria
    // Qui dovresti chiamare un'API che verifica la disponibilità effettiva
    // Per ora il filtro per data/timeSlot non viene applicato
    // if (filters.date && filters.timeSlot) {
    //   // Chiamare API per verificare disponibilità
    // }

    return true;
  });

  /* -------- GEOLOCATION -------- */
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

  /* =========================
     CLUSTER LOGIC
  ========================= */
  const zoomDelta = Math.max(region.latitudeDelta, region.longitudeDelta);
  const shouldShowClusters = zoomDelta > 0.1;

  useEffect(() => {
    if (shouldShowClusters) {
      setSelectedMarker(null);
    }
  }, [shouldShowClusters]);

  const clusters: Cluster[] = [];

  if (shouldShowClusters) {
    const gridSize = region.latitudeDelta * 0.2;
    const grid: Record<string, Struttura[]> = {};

    filtered.forEach(s => {
      const x = Math.floor(s.location.lat / gridSize);
      const y = Math.floor(s.location.lng / gridSize);
      const key = `${x}_${y}`;

      if (!grid[key]) grid[key] = [];
      grid[key].push(s);
    });

    Object.values(grid).forEach((items, index) => {
      if (items.length === 0) return;

      const avgLat =
        items.reduce((sum, s) => sum + s.location.lat, 0) / items.length;
      const avgLng =
        items.reduce((sum, s) => sum + s.location.lng, 0) / items.length;

      clusters.push({
        id: `cluster-${index}`,
        coordinate: { latitude: avgLat, longitude: avgLng },
        strutture: items,
        radius: Math.max(region.latitudeDelta * 3000, 1000),
      });
    });
  }

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

  /* -------- ACTIVE FILTERS COUNT -------- */
  const activeFiltersCount = [
    filters.indoor !== null,
    filters.sport !== null,
    filters.date !== null,
    filters.timeSlot !== null,
  ].filter(Boolean).length;

  /* -------- RESET FILTERS -------- */
  const resetFilters = () => {
    setFilters({
      indoor: null,
      sport: null,
      date: null,
      timeSlot: null,
    });
  };

  /* =========================
     LIST ITEM
  ========================= */
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

      {/* Badge Indoor/Outdoor */}
      <View style={[styles.badge, item.indoor ? styles.badgeIndoor : styles.badgeOutdoor]}>
        <Ionicons 
          name={item.indoor ? "business" : "sunny"} 
          size={12} 
          color="white" 
        />
        <Text style={styles.badgeText}>
          {item.indoor ? "Indoor" : "Outdoor"}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color="#2979ff" />
              <Text style={styles.address}>
                {item.location.city}
              </Text>
            </View>
          </View>

          {/* Rating */}
          {item.rating && (
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.ratingText}>
                {item.rating.average.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Sports Tags */}
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

        {/* Price */}
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

  /* -------- HEADER ANIMATION -------- */
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [80, 70],
    extrapolate: 'clamp',
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

      {/* RESULTS COUNT */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          {filtered.length} {filtered.length === 1 ? "struttura" : "strutture"} trovate
        </Text>
      </View>

      {/* CONTENT */}
      <View style={styles.container}>
        {viewMode === "list" ? (
          <Animated.FlatList
            data={filtered}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 120 }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
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
                clusters.map(cluster => (
                  <Marker
                    key={cluster.id}
                    coordinate={cluster.coordinate}
                    onPress={() => handleClusterPress(cluster)}
                  >
                    <Ionicons
                      name="location-sharp"
                      size={36}
                      color="#2979ff"
                    />
                  </Marker>
                ))
              ) : (
                filtered.map(s => {
                  const isSelected = selectedMarker?._id === s._id;

                  return (
                    <Marker
                      key={s._id}
                      coordinate={{
                        latitude: s.location.lat,
                        longitude: s.location.lng,
                      }}
                      onPress={e => {
                        e.stopPropagation();
                        setSelectedMarker(s);
                      }}
                    >
                      <Ionicons
                        name="location-sharp"
                        size={isSelected ? 40 : 34}
                        color={isSelected ? "#2979ff" : "#FF5252"}
                      />
                    </Marker>
                  );
                })
              )}
            </MapView>

            {/* GPS */}
            <Pressable style={styles.geoButton} onPress={centerOnUser}>
              <Ionicons name="navigate" size={22} color="#2979ff" />
            </Pressable>

            {/* CARD MAPPA */}
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

      {/* ADVANCED FILTERS MODAL */}
      <AdvancedFiltersModal
        visible={showFilters}
        filters={filters}
        onClose={() => setShowFilters(false)}
        onApply={newFilters => {
          setFilters(newFilters);
          setShowFilters(false);
        }}
      />

      {/* FLOATING ACTION BUTTON - FILTRI */}
      <Pressable 
        style={styles.fab}
        onPress={() => setShowFilters(true)}
      >
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

  const sports = ["Beach Volley", "Volley"]; // ✅ Sport effettivi dal database
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
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtri Avanzati</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={28} color="#333" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Sport */}
            <Text style={styles.sectionTitle}>Sport</Text>
            <View style={styles.optionsGrid}>
              {sports.map(sport => (
                <Pressable
                  key={sport}
                  style={[
                    styles.option,
                    tempFilters.sport === sport && styles.optionActive,
                  ]}
                  onPress={() =>
                    setTempFilters(prev => ({
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

            {/* Data */}
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
                      setTempFilters(prev => ({
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

            {/* Fascia Oraria */}
            <Text style={styles.sectionTitle}>Fascia Oraria</Text>
            <View style={styles.timeSlots}>
              {timeSlots.map(slot => (
                <Pressable
                  key={slot}
                  style={[
                    styles.timeSlot,
                    tempFilters.timeSlot === slot && styles.timeSlotActive,
                  ]}
                  onPress={() =>
                    setTempFilters(prev => ({
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
                      tempFilters.timeSlot === slot && styles.timeSlotTextActive,
                    ]}
                  >
                    {slot}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <Pressable
              style={styles.resetModalButton}
              onPress={() =>
                setTempFilters({
                  indoor: null,
                  sport: null,
                  date: null,
                  timeSlot: null,
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

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#FAFAFA" 
  },

  // HEADER
  header: {
    backgroundColor: "#2979ff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    height: 50,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  input: { 
    flex: 1, 
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },

  viewToggle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },

  // QUICK FILTERS
  quickFilters: {
    maxHeight: 54,
    marginTop: 4,
  },

  quickFiltersContent: {
    gap: 10,
    paddingRight: 16,
  },

  advancedFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "white",
    gap: 6,
    borderWidth: 2,
    borderColor: "#D0D0D0",
  },

  advancedFilterText: {
    fontSize: 14,
    color: "#2979ff",
    fontWeight: "700",
  },

  filterBadge: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: 2,
  },

  filterBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
  },

  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "white",
    gap: 6,
    borderWidth: 2,
    borderColor: "#D0D0D0",
  },

  quickChipActive: {
    backgroundColor: "#2979ff",
    borderColor: "#2979ff",
  },

  quickChipText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "700",
  },

  quickChipTextActive: {
    color: "white",
    fontWeight: "700",
  },

  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#FF5252",
  },

  resetButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },

  // RESULTS
  resultsBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  resultsText: {
    fontSize: 13,
    color: "#999",
    fontWeight: "600",
  },

  // CONTAINER
  container: { 
    flex: 1, 
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // CARD
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  image: { 
    height: 180, 
    width: "100%",
    backgroundColor: "#F5F5F5",
  },

  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  badgeIndoor: {
    backgroundColor: "rgba(41,121,255,0.95)",
  },

  badgeOutdoor: {
    backgroundColor: "rgba(76,175,80,0.95)",
  },

  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },

  cardContent: { 
    padding: 16,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  title: { 
    fontSize: 18, 
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 6,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  address: { 
    color: "#666",
    fontSize: 13,
    fontWeight: "500",
  },

  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  ratingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    flexWrap: "wrap",
  },

  sportTag: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  sportTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },

  moreText: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  priceLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
  },

  price: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A",
  },

  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2979ff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#2979ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  bookButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },

  // MAP
  mapContainer: {
    flex: 1,
    marginHorizontal: -16,
    marginBottom: -16,
    marginTop: -16,
  },

  map: { 
    flex: 1,
  },

  geoButton: {
    position: "absolute",
    right: 20,
    bottom: 160,
    backgroundColor: "white",
    padding: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  mapCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "white",
    padding: 18,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },

  mapCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  mapTitle: { 
    fontSize: 18, 
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 4,
  },

  mapAddress: {
    fontSize: 13,
    color: "#666",
  },

  mapRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  mapRatingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  mapBookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2979ff",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#2979ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  mapBookButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "85%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
    marginTop: 20,
    marginBottom: 12,
  },

  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  option: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "transparent",
  },

  optionActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2979ff",
  },

  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },

  optionTextActive: {
    color: "#2979ff",
    fontWeight: "700",
  },

  dateRow: {
    flexDirection: "row",
    gap: 10,
  },

  dateOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  dateOptionActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2979ff",
  },

  dateOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },

  dateOptionTextActive: {
    color: "#2979ff",
    fontWeight: "700",
  },

  timeSlots: {
    gap: 10,
  },

  timeSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "transparent",
  },

  timeSlotActive: {
    backgroundColor: "#2979ff",
    borderColor: "#2979ff",
  },

  timeSlotText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },

  timeSlotTextActive: {
    color: "white",
    fontWeight: "700",
  },

  modalFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },

  resetModalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },

  resetModalText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#666",
  },

  applyButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#2979ff",
    alignItems: "center",
    shadowColor: "#2979ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  applyButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },

  // FAB (Floating Action Button)
  fab: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2979ff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  fabBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF5252",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 3,
    borderColor: "white",
  },

  fabBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
  },
});