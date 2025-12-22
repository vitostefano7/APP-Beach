import { View, Text, StyleSheet, Pressable } from "react-native";
import MapView, { Marker, Circle, Region } from "react-native-maps";
import { useEffect, useState, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "http://192.168.1.112:3000";

type Struttura = {
  _id: string;
  name: string;
  pricePerHour: number;
  location: {
    lat: number;
    lng: number;
  };
};

const DEFAULT_REGION: Region = {
  latitude: 45.4642,
  longitude: 9.19,
  latitudeDelta: 5,
  longitudeDelta: 5,
};

export default function MapsScreen() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);

  const [strutture, setStrutture] = useState<Struttura[]>([]);
  const [selected, setSelected] = useState<Struttura | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);

  useEffect(() => {
    fetch(`${API_URL}/strutture`)
      .then(r => r.json())
      .then(setStrutture)
      .catch(console.log);
  }, []);

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

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={() => setSelected(null)}
      >
        {strutture.map(s => (
          <Marker
            key={s._id}
            coordinate={{
              latitude: s.location.lat,
              longitude: s.location.lng,
            }}
            onPress={() => setSelected(s)}
          />
        ))}
      </MapView>

      <Pressable style={styles.gpsButton} onPress={centerOnUser}>
        <Ionicons name="locate" size={22} color="#2b8cee" />
      </Pressable>

      {selected && (
        <View style={styles.card}>
          <Text style={styles.title}>{selected.name}</Text>
          <Text>€ {selected.pricePerHour} / ora</Text>

          <Pressable
            style={styles.button}
            onPress={() =>
              navigation.navigate("FieldDetails", {
                struttura: selected, from: "map",
              })
            }
          >
            <Text style={styles.buttonText}>Vedi dettagli</Text>
          </Pressable>

          <Pressable onPress={() => setSelected(null)}>
            <Text style={styles.close}>Chiudi</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

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
    elevation: 6,
  },

  title: { fontSize: 18, fontWeight: "700" },

  button: {
    marginTop: 12,
    backgroundColor: "#2b8cee",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: { color: "white", fontWeight: "700" },
  close: { marginTop: 8, textAlign: "center", color: "#888" },
});
