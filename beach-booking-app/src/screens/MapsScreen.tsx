// MapsScreen.tsx
import { View, Text, StyleSheet, Pressable } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";

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

export default function MapsScreen() {
  const navigation = useNavigation<any>();
  const [strutture, setStrutture] = useState<Struttura[]>([]);
  const [selected, setSelected] = useState<Struttura | null>(null);

  const [region, setRegion] = useState<Region>({
    latitude: 45.4642,
    longitude: 9.19,
    latitudeDelta: 5,
    longitudeDelta: 5,
  });

  useEffect(() => {
    fetch(`${API_URL}/strutture`)
      .then(r => r.json())
      .then(setStrutture)
      .catch(console.log);
  }, []);

  return (
    <View style={styles.container}>
      <MapView
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

      {selected && (
        <View style={styles.card}>
          <Text style={styles.title}>{selected.name}</Text>
          <Text>€ {selected.pricePerHour} / ora</Text>

          <Pressable
            style={styles.button}
            onPress={() =>
              navigation.navigate("FieldDetails", {
                struttura: selected,
                from: "map",
              })
            }
          >
            <Text style={styles.buttonText}>Vedi dettagli</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

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
  title: { fontSize: 18, fontWeight: "700", marginBottom: 6 },

  button: {
    marginTop: 12,
    backgroundColor: "#2b8cee",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "700" },
});
