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
            <Ionicons name="location" size={14} color="#666" />
            <Text style={styles.infoText}>
              {item.location?.city || "Città non specificata"}
            </Text>
          </View>

          {item.campiCount !== undefined && (
            <View style={styles.infoRow}>
              <Ionicons name="basketball" size={14} color="#666" />
              <Text style={styles.infoText}>
                {item.campiCount}{" "}
                {item.campiCount === 1 ? "campo" : "campi"}
              </Text>
            </View>
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.cardFooter}>
          {item.bookingsCount !== undefined && (
            <View>
              <Text style={styles.statValue}>
                {item.bookingsCount || 0}
              </Text>
              <Text style={styles.statLabel}>Prenotazioni</Text>
            </View>
          )}

          <View style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>Gestisci</Text>
            <Ionicons name="chevron-forward" size={16} color="white" />
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
            <Ionicons name="add" size={24} color="white" />
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
                size={64}
                color="#ccc"
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
                  size={20}
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
  safe: { flex: 1, backgroundColor: "#f8f9fa" },
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  title: { 
    fontSize: 24, 
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  subtitle: { 
    fontSize: 13, 
    color: "#666",
    fontWeight: "600",
    marginTop: 2,
  },

  addButton: {
    backgroundColor: "#2196F3",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 20 },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },

  cardImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#eee",
  },

  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    backgroundColor: "rgba(76,175,80,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: "center",
  },

  statusBadgeInactive: {
    backgroundColor: "rgba(229,57,53,0.95)",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
    marginRight: 6,
  },

  statusDotInactive: {
    backgroundColor: "white",
  },

  statusText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },

  statusTextInactive: {
    color: "white",
  },

  cardContent: { padding: 14 },
  cardName: { 
    fontSize: 17, 
    fontWeight: "800", 
    marginBottom: 8,
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },

  cardInfo: { gap: 6, marginBottom: 12 },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  infoText: { fontSize: 14, color: "#666" },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
    marginTop: 2,
  },

  statValue: { 
    fontSize: 18, 
    fontWeight: "800",
    color: "#2196F3",
  },
  statLabel: { 
    fontSize: 11, 
    color: "#999",
    fontWeight: "600",
    marginTop: 1,
  },

  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2196F3",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  viewDetailsText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 14,
    color: "#1a1a1a",
  },

  emptyText: {
    fontSize: 14,
    color: "#666",
    marginVertical: 8,
    textAlign: "center",
    lineHeight: 20,
  },

  emptyButton: {
    marginTop: 16,
    backgroundColor: "#2196F3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },

  emptyButtonText: {
    color: "white",
    fontWeight: "700",
  },
});