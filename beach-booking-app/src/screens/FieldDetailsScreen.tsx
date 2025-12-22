import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function FieldDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { struttura, from } = route.params ?? {};

  /* =========================
     GUARD
  ========================= */
  if (!struttura) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text>Struttura non trovata</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* =========================
     BACK LOGIC (CORRETTA)
  ========================= */
  const handleBack = () => {
    if (from === "search") {
      // ⬅️ torna al TAB Cerca
      navigation.getParent()?.navigate("Cerca");
      return;
    }

    // ⬅️ default: torna alla mappa
    navigation.goBack();
  };

  /* =========================
     IMAGES
  ========================= */
  const images =
    struttura.images && struttura.images.length > 0
      ? struttura.images
      : [
          "https://picsum.photos/600/400",
          "https://picsum.photos/601/400",
        ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} />
          </Pressable>
        </View>

        {/* CONTENT */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* GALLERY */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {images.map((img: string, index: number) => (
              <Image key={index} source={{ uri: img }} style={styles.image} />
            ))}
          </ScrollView>

          {/* INFO */}
          <View style={styles.section}>
            <Text style={styles.title}>{struttura.name}</Text>
            <Text style={styles.address}>
              📍 {struttura.location.address}, {struttura.location.city}
            </Text>
          </View>

          {/* MAP */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Posizione</Text>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: struttura.location.lat,
                longitude: struttura.location.lng,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
            >
              <Marker
                coordinate={{
                  latitude: struttura.location.lat,
                  longitude: struttura.location.lng,
                }}
              />
            </MapView>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* BOTTOM BAR */}
        <View style={styles.bottomBar}>
          <Text style={styles.price}>
            € {struttura.pricePerHour} / ora
          </Text>

          <Pressable style={styles.bookButton}>
            <Text style={styles.bookText}>Prenota Ora</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },

  container: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  image: {
    width: 300,
    height: 200,
    borderRadius: 16,
    marginRight: 12,
  },

  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
  },

  address: {
    color: "#666",
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },

  map: {
    height: 180,
    borderRadius: 16,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  price: {
    fontSize: 18,
    fontWeight: "700",
  },

  bookButton: {
    backgroundColor: "#2b8cee",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },

  bookText: {
    color: "white",
    fontWeight: "700",
  },
});
