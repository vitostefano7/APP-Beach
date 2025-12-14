import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  FlatList,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function FieldDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { struttura } = route.params;

  const images = [
    "https://picsum.photos/600/400",
    "https://picsum.photos/601/400",
    "https://picsum.photos/602/400",
  ];

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </Pressable>
        <Pressable>
          <Ionicons name="heart-outline" size={24} />
        </Pressable>
      </View>

      {/* CONTENT */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* GALLERY */}
        <FlatList
          data={images}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item, index }) => (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: item }} style={styles.image} />
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {index + 1}/{images.length}
                </Text>
              </View>
            </View>
          )}
        />

        {/* TITLE */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{struttura.name}</Text>
            <View style={styles.rating}>
              <Ionicons name="star" size={14} color="#2b8cee" />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>

          <Text style={styles.address}>
            📍 {struttura.location.address}, {struttura.location.city}
          </Text>
        </View>

        {/* AMENITIES */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips}>
            {["Doccia Calda", "Luci Notturne", "Bar"].map(a => (
              <View key={a} style={styles.chip}>
                <Text style={styles.chipText}>{a}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* DESCRIZIONE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrizione</Text>
          <Text style={styles.description}>
            Campo da beach volley con sabbia professionale e servizi completi.
          </Text>
          <Text style={styles.readMore}>Leggi di più</Text>
        </View>

        {/* ORARI */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orari Disponibili</Text>
          <View style={styles.times}>
            {["09:00", "10:00", "11:00", "12:00", "14:00", "15:00"].map(t => (
              <View
                key={t}
                style={[
                  styles.timeSlot,
                  t === "14:00" && styles.timeSlotSelected,
                ]}
              >
                <Text
                  style={[
                    styles.timeText,
                    t === "14:00" && styles.timeTextSelected,
                  ]}
                >
                  {t}
                </Text>
              </View>
            ))}
          </View>
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
        <View>
          <Text style={styles.totalLabel}>Totale (1h)</Text>
          <Text style={styles.totalPrice}>€ {struttura.pricePerHour}</Text>
        </View>

        <Pressable style={styles.bookButton}>
          <Text style={styles.bookText}>Prenota Ora →</Text>
        </Pressable>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  imageWrapper: {
    width: 300,
    marginRight: 12,
    borderRadius: 16,
    overflow: "hidden",
  },

  image: { width: "100%", height: 200 },

  imageCounter: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  imageCounterText: { color: "#fff", fontSize: 12 },

  section: { paddingHorizontal: 16, paddingVertical: 12 },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: { fontSize: 22, fontWeight: "700" },

  rating: {
    flexDirection: "row",
    backgroundColor: "#eaf3ff",
    padding: 6,
    borderRadius: 8,
  },

  ratingText: { color: "#2b8cee", fontWeight: "700", marginLeft: 4 },

  address: { color: "#666", marginTop: 4 },

  chips: { flexDirection: "row", paddingHorizontal: 16 },

  chip: {
    backgroundColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },

  chipText: { fontSize: 12 },

  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },

  description: { color: "#555", lineHeight: 20 },

  readMore: { color: "#2b8cee", marginTop: 6 },

  times: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  timeSlot: {
    width: "30%",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },

  timeSlotSelected: {
    backgroundColor: "#2b8cee",
    borderColor: "#2b8cee",
  },

  timeText: { fontWeight: "500" },
  timeTextSelected: { color: "#fff", fontWeight: "700" },

  map: { height: 180, borderRadius: 16 },

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

  totalLabel: { fontSize: 12, color: "#666" },
  totalPrice: { fontSize: 20, fontWeight: "700" },

  bookButton: {
    backgroundColor: "#2b8cee",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },

  bookText: { color: "#fff", fontWeight: "700" },
});
