import { View, Text, StyleSheet, Pressable } from "react-native";
import MapView, { Marker, Circle, Region } from "react-native-maps";
import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "http://192.168.1.112:3000";

/* ---------- TYPES ---------- */

type Struttura = {
  _id: string;
  name: string;
  pricePerHour: number;
  location: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
  };
};

type MapsStackParamList = {
  Maps: undefined;
  FieldDetails: { struttura: Struttura };
};

/* ---------- UTILS ---------- */

function distanceInMeters(a: any, b: any) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function clusterStrutture(strutture: Struttura[], radius: number) {
  const clusters: any[] = [];

  strutture.forEach(s => {
    const point = { lat: s.location.lat, lng: s.location.lng };
    const found = clusters.find(
      c => distanceInMeters(c.center, point) < radius
    );

    if (found) found.items.push(s);
    else clusters.push({ center: point, items: [s] });
  });

  return clusters;
}

function getCircleRadius(latitudeDelta: number) {
  if (latitudeDelta > 4) return 15000;
  if (latitudeDelta > 2) return 10000;
  if (latitudeDelta > 1) return 6000;
  if (latitudeDelta > 0.5) return 3000;
  return 1500;
}

/* ---------- SCREEN ---------- */

export default function MapsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MapsStackParamList>>();

  const mapRef = useRef<MapView>(null);

  const [strutture, setStrutture] = useState<Struttura[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  

  const [region, setRegion] = useState<Region>({
    latitude: 45.4642,
    longitude: 9.19,
    latitudeDelta: 5,
    longitudeDelta: 5,
  });

  /* ---------- FETCH ---------- */

  useEffect(() => {
    fetch(`${API_URL}/strutture`)
      .then(r => r.json())
      .then(setStrutture)
      .catch(console.log);
  }, []);

  /* ---------- CLUSTERS ---------- */

  const isZoomedOut = region.latitudeDelta > 0.35;
  const circleRadius = getCircleRadius(region.latitudeDelta);

  const clusters = useMemo(() => {
    if (!isZoomedOut) return [];
    return clusterStrutture(strutture, circleRadius);
  }, [strutture, isZoomedOut, circleRadius]);

  const selected = strutture.find(s => s._id === selectedId);

  /* ---------- GPS ---------- */

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

  /* ---------- RENDER ---------- */

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={() => setSelectedId(null)}
      >
        {/* CLUSTERS */}
        {isZoomedOut &&
          clusters.map((c, i) => (
            <View key={i}>
              <Circle
                center={{ latitude: c.center.lat, longitude: c.center.lng }}
                radius={circleRadius}
                strokeColor="rgba(43,140,238,0.7)"
                fillColor="rgba(43,140,238,0.25)"
              />

              <Marker
                coordinate={{
                  latitude: c.center.lat,
                  longitude: c.center.lng,
                }}
                opacity={0}
                onPress={() =>
                  mapRef.current?.animateToRegion(
                    {
                      latitude: c.center.lat,
                      longitude: c.center.lng,
                      latitudeDelta: region.latitudeDelta * 0.2,
                      longitudeDelta: region.longitudeDelta * 0.2,
                    },
                    400
                  )
                }
              />
            </View>
          ))}

        {/* MARKERS */}
        {!isZoomedOut &&
          strutture.map(s => (
            <Marker
              key={s._id}
              coordinate={{
                latitude: s.location.lat,
                longitude: s.location.lng,
              }}
              pinColor={s._id === selectedId ? "red" : "#2b8cee"}
              onPress={() => setSelectedId(s._id)}
            />
          ))}
      </MapView>

      {/* GPS */}
      <Pressable style={styles.gpsButton} onPress={centerOnUser}>
        <Ionicons name="locate" size={22} color="#2b8cee" />
      </Pressable>

      {/* CARD */}
      {selected && !isZoomedOut && (
        <View style={styles.card}>
          <Text style={styles.title}>{selected.name}</Text>
          <Text>€ {selected.pricePerHour} / ora</Text>

          <Pressable
            style={styles.button}
            onPress={() =>
              navigation.navigate("FieldDetails", {
                struttura: selected,
              })
            }
          >
            <Text style={styles.buttonText}>Vedi dettagli</Text>
          </Pressable>

          <Pressable onPress={() => setSelectedId(null)}>
            <Text style={styles.close}>Chiudi</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  gpsButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 30,
    elevation: 4,
  },

  card: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    elevation: 4,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },

  button: {
    marginTop: 12,
    backgroundColor: "#2b8cee",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "700",
  },

  close: {
    marginTop: 8,
    textAlign: "center",
    color: "#888",
  },
});
