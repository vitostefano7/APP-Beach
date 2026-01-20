import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useCallback, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import API_URL from "../../config/api";

/* =========================
   STRUTTURA CARD
========================= */

function StrutturaCard({ item }: { item: any }) {
  const navigation = useNavigation<any>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ✅ URL assoluto per React Native
  const getImageUri = (index: number) => {
    if (!item.images || item.images.length === 0) {
      return "https://images.unsplash.com/photo-1545262810-77515befe149?w=400";
    }
    
    const imagePath = item.images[index];
    // Se l'immagine è già un URL completo, restituiscila così com'è
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Altrimenti, aggiungi l'API_URL
    // Rimuovi eventuali doppi slash
    const baseUrl = API_URL.replace(/\/$/, '');
    const cleanImagePath = imagePath.replace(/^\//, '');
    
    return `${baseUrl}/${cleanImagePath}`;
  };

  const imageUri = getImageUri(currentImageIndex);

  // 🎠 Carosello automatico ogni 3 secondi
  useEffect(() => {
    if (!item.images || item.images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === item.images.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [item.images]);

  // Debug logging
  useEffect(() => {
    console.log("Image Url: ", imageUri);
    console.log("ITEM images:", item.images);
  }, [imageUri, item.images]);

  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        navigation.navigate("StrutturaDashboard", {
          strutturaId: item._id,
        })
      }
    >
      {/* IMMAGINE */}
      <Image 
        source={{ uri: imageUri }} 
        style={styles.cardImage}
        onError={(e) => console.log("Image loading error:", e.nativeEvent.error)}
        //defaultSource={require('../../assets/default-struttura.jpg')} // Aggiungi un'immagine di fallback se vuoi
      />

      {/* BADGE STATO */}
      <View
        style={[
          styles.statusBadge,
          !item.isActive && styles.statusBadgeInactive,
        ]}
      >
        <View
          style={[
            styles.statusDot,
            !item.isActive && styles.statusDotInactive,
          ]}
        />
        <Text
          style={[
            styles.statusText,
            !item.isActive && styles.statusTextInactive,
          ]}
        >
          {item.isActive ? "Attiva" : "Non attiva"}
        </Text>
      </View>

      {/* CONTENUTO */}
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={10} color="#666" />
            <Text style={styles.infoText}>
              {item.location?.city || "Città non specificata"}
            </Text>
          </View>

          {item.location?.address && (
            <View style={styles.infoRow}>
              <Ionicons name="map" size={10} color="#666" />
              <Text style={styles.infoText} numberOfLines={1}>
                {item.location.address}
              </Text>
            </View>
          )}

          {item.campiCount !== undefined && (
            <View style={styles.infoRow}>
              <Ionicons name="basketball" size={10} color="#666" />
              <Text style={styles.infoText}>
                {item.campiCount}{" "}
                {item.campiCount === 1 ? "campo" : "campi"}
              </Text>
            </View>
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.cardFooter}>
          <View style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>Gestisci</Text>
            <Ionicons name="chevron-forward" size={11} color="white" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/* =========================
   MAIN SCREEN
========================= */

export default function OwnerStruttureScreen() {
  const { token } = useContext(AuthContext);
  const [strutture, setStrutture] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const loadStrutture = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/strutture/owner/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      // Debug per vedere i dati ricevuti
      console.log("Strutture data received:", data);
      if (data.length > 0) {
        console.log("First struttura images:", data[0].images);
      }
      
      setStrutture(data);
    } catch (error) {
      console.error("❌ Errore caricamento strutture:", error);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadStrutture();
    }, [loadStrutture])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStrutture();
    setRefreshing(false);
  }, [loadStrutture]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Le mie strutture</Text>
            <Text style={styles.subtitle}>
              {strutture.length}{" "}
              {strutture.length === 1 ? "struttura" : "strutture"}
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() => navigation.navigate("CreaStruttura")}
          >
            <Ionicons name="add" size={18} color="white" />
          </Pressable>
        </View>

        {/* LISTA */}
        <FlatList
          data={strutture}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <StrutturaCard item={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2196F3"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="business-outline"
                size={42}
                color="#ddd"
              />
              <Text style={styles.emptyTitle}>Nessuna struttura</Text>
              <Text style={styles.emptyText}>
                Crea la tua prima struttura per iniziare
              </Text>
              <Pressable
                style={styles.emptyButton}
                onPress={() => navigation.navigate("CreaStruttura")}
              >
                <Ionicons
                  name="add-circle"
                  size={14}
                  color="white"
                />
                <Text style={styles.emptyButtonText}>
                  Crea struttura
                </Text>
              </Pressable>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f7fa" },
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 9,
    color: "#999",
    fontWeight: "500",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  addButton: {
    backgroundColor: "#2196F3",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },

  listContent: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14 },

  card: {
    backgroundColor: "white",
    borderRadius: 18,
    marginBottom: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },

  cardImage: {
    width: "100%",
    height: 110,
    backgroundColor: "#f8f8f8",
  },

  statusBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    flexDirection: "row",
    backgroundColor: "rgba(33,150,243,0.95)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: "center",
  },

  statusBadgeInactive: {
    backgroundColor: "rgba(139,139,139,0.90)",
  },

  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#75ec79",
    marginRight: 3,
  },

  statusDotInactive: {
    backgroundColor: "red",
  },

  statusText: {
    color: "white",
    fontSize: 8,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  statusTextInactive: {
    color: "white",
  },

  cardContent: { padding: 9 },
  cardName: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 5,
    color: "#1a1a1a",
    letterSpacing: 0.2,
  },

  cardInfo: { gap: 3, marginBottom: 7 },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  infoText: { fontSize: 10, color: "#666" },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
    paddingTop: 7,
    marginTop: 2,
  },

  statValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2196F3",
  },
  statLabel: {
    fontSize: 8,
    color: "#999",
    fontWeight: "500",
    marginTop: 1,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#2196F3",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },

  viewDetailsText: {
    color: "white",
    fontWeight: "600",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
    color: "#1a1a1a",
    letterSpacing: 0.2,
  },

  emptyText: {
    fontSize: 11,
    color: "#999",
    marginVertical: 5,
    textAlign: "center",
    lineHeight: 16,
  },

  emptyButton: {
    marginTop: 10,
    backgroundColor: "#2196F3",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },

  emptyButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});