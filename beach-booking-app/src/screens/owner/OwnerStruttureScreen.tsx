import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState, useCallback } from "react";
import  {AuthContext } from "../../context/AuthContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import API_URL from "../../config/api";

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
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  // Funzione per caricare le strutture
  const loadStrutture = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/strutture/owner/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log("📋 Strutture caricate:", data.length);
      setStrutture(data);
    } catch (error) {
      console.error("❌ Errore caricamento strutture:", error);
    }
  }, [token]);

  // Carica le strutture quando la schermata è in focus
  useFocusEffect(
    useCallback(() => {
      console.log("🔄 Schermata in focus - ricarico strutture");
      loadStrutture();
    }, [loadStrutture])
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStrutture();
    setRefreshing(false);
  }, [loadStrutture]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Le mie strutture</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => navigation.navigate("CreaStruttura")}
          >
            <Text style={styles.addButtonText}>+ Nuova</Text>
          </Pressable>
        </View>
        <FlatList
          data={strutture}
          keyExtractor={item => item._id}
          renderItem={({ item }) => <StrutturaCard item={item} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>Nessuna struttura</Text>}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7f9" },
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: "800" },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
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