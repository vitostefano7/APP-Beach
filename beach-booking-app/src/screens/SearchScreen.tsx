import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const API_URL = "http://192.168.1.112:3000";

/* ---------- TYPES ---------- */
type Struttura = {
  _id: string;
  name: string;
  pricePerHour: number;
  indoor: boolean;
  location: {
    address: string;
    city: string;
  };
  rating?: {
    average: number;
    count: number;
  };
  images: string[];
};

/* ---------- SCREEN ---------- */
export default function SearchScreen() {
  const navigation = useNavigation<any>();

  const [strutture, setStrutture] = useState<Struttura[]>([]);
  const [query, setQuery] = useState("");
  const [filterIndoor, setFilterIndoor] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/strutture`)
      .then(r => r.json())
      .then(setStrutture)
      .catch(console.log);
  }, []);

  const filtered = strutture.filter(s => {
    if (filterIndoor !== null && s.indoor !== filterIndoor) return false;
    if (
      query &&
      !`${s.name} ${s.location.city}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
      return false;
    return true;
  });

  const renderItem = ({ item }: { item: Struttura }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        navigation.navigate("Mappa", {
          screen: "FieldDetails",
          params: { struttura: item, from: "search" },
        })
      }
    >
      <Image
        source={{
          uri: item.images?.[0] ?? "https://picsum.photos/600/400",
        }}
        style={styles.image}
      />

      {item.rating && (
        <View style={styles.rating}>
          <Ionicons name="star" size={14} color="#f5a623" />
          <Text style={styles.ratingText}>
            {item.rating.average} ({item.rating.count})
          </Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.row}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.price}>€{item.pricePerHour}/ora</Text>
        </View>

        <Text style={styles.address}>
          📍 {item.location.address}, {item.location.city}
        </Text>

        <View style={styles.row}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: item.indoor ? "#eaf3ff" : "#fff0e5",
              },
            ]}
          >
            <Text
              style={{
                color: item.indoor ? "#2b8cee" : "#ff7a00",
                fontSize: 12,
              }}
            >
              {item.indoor ? "Indoor" : "Outdoor"}
            </Text>
          </View>

          <View style={styles.button}>
            <Text style={styles.buttonText}>Prenota</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#888" />
          <TextInput
            placeholder="Cerca città o nome del campo"
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
        </View>

        {/* FILTERS */}
        <View style={styles.filters}>
          <Pressable
            style={[
              styles.filter,
              filterIndoor === null && styles.filterActive,
            ]}
            onPress={() => setFilterIndoor(null)}
          >
            <Text style={filterIndoor === null && styles.filterTextActive}>
              Tutti
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filter,
              filterIndoor === true && styles.filterActive,
            ]}
            onPress={() => setFilterIndoor(true)}
          >
            <Text style={filterIndoor === true && styles.filterTextActive}>
              Indoor
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filter,
              filterIndoor === false && styles.filterActive,
            ]}
            onPress={() => setFilterIndoor(false)}
          >
            <Text style={filterIndoor === false && styles.filterTextActive}>
              Outdoor
            </Text>
          </Pressable>
        </View>

        {/* LIST */}
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>
    </SafeAreaView>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 16 },

  searchBox: {
    flexDirection: "row",
    backgroundColor: "#f1f1f1",
    padding: 6,
    borderRadius: 100,
    alignItems: "center",
    marginBottom: 10,
  },
  input: { marginLeft: 8, flex: 1, fontSize: 15 },

  filters: { flexDirection: "row", marginBottom: 12 },

  filter: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginRight: 8,
  },
  filterActive: { backgroundColor: "#2b8cee" },
  filterTextActive: { color: "white", fontWeight: "600" },

  card: {
    backgroundColor: "white",
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
  },
  image: { height: 170, width: "100%" },

  rating: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: { marginLeft: 4, fontSize: 12 },

  cardContent: { padding: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 16, fontWeight: "700" },
  price: { fontSize: 16, fontWeight: "700", color: "#2b8cee" },
  address: { color: "#666", marginVertical: 6 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },

  button: {
    backgroundColor: "#2b8cee",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 14,
  },
  buttonText: { color: "white", fontWeight: "700" },
});
