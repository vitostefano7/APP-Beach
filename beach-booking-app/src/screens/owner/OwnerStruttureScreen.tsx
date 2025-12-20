import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

const API_URL = "http://192.168.1.112:3000";

function StrutturaCard({ item }: { item: any }) {
  const navigation = useNavigation<any>();

  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        navigation.navigate("StrutturaDashboard", { strutturaId: item._id })
      }
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.location}>📍 {item.location?.city}</Text>

      {!item.isActive && <Text style={styles.inactive}>Non attiva</Text>}
    </Pressable>
  );
}

export default function OwnerStruttureScreen() {
  const { token } = useContext(AuthContext);
  const [strutture, setStrutture] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/strutture/owner/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setStrutture)
      .catch(console.log);
  }, [token]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Le mie strutture</Text>

        <FlatList
          data={strutture}
          keyExtractor={item => item._id}
          renderItem={({ item }) => <StrutturaCard item={item} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>Nessuna struttura</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7f9" },
  container: { flex: 1, padding: 16 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 16 },
  empty: { textAlign: "center", marginTop: 40, color: "#888" },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  name: { fontSize: 18, fontWeight: "700" },
  location: { color: "#666", marginTop: 4 },
  inactive: { marginTop: 8, color: "#E54848", fontWeight: "700" },
});
