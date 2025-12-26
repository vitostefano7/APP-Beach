import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import API_URL from "../../config/api";

function StrutturaCard({ item }: { item: any }) {
  const navigation = useNavigation<any>();
  
  const imageUri = item.images?.[0] || "https://images.unsplash.com/photo-1545262810-77515befe149?w=400";
  
  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        navigation.navigate("StrutturaDashboard", { strutturaId: item._id })
      }
    >
      {/* Immagine */}
      <Image 
        source={{ uri: imageUri }} 
        style={styles.cardImage}
        /*defaultSource={require('../../assets/placeholder.png')} */ // Opzionale
      />
      
      {/* Badge Stato */}
      <View style={[styles.statusBadge, !item.isActive && styles.statusBadgeInactive]}>
        <View style={[styles.statusDot, !item.isActive && styles.statusDotInactive]} />
        <Text style={[styles.statusText, !item.isActive && styles.statusTextInactive]}>
          {item.isActive ? "Attiva" : "Non attiva"}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        
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
                {item.campiCount || 0} {item.campiCount === 1 ? 'campo' : 'campi'}
              </Text>
            </View>
          )}
        </View>

        {/* Footer con azione */}
        <View style={styles.cardFooter}>
          <View style={styles.statsRow}>
            {item.bookingsCount !== undefined && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.bookingsCount || 0}</Text>
                <Text style={styles.statLabel}>Prenotazioni</Text>
              </View>
            )}
          </View>
          
          <View style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>Gestisci</Text>
            <Ionicons name="chevron-forward" size={16} color="#2196F3" />
          </View>
        </View>
      </View>
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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Le mie strutture</Text>
            <Text style={styles.subtitle}>
              {strutture.length} {strutture.length === 1 ? 'struttura' : 'strutture'}
            </Text>
          </View>
          <Pressable
            style={styles.addButton}
            onPress={() => navigation.navigate("CreaStruttura")}
          >
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        </View>

        {/* Lista */}
        <FlatList
          data={strutture}
          keyExtractor={item => item._id}
          renderItem={({ item }) => <StrutturaCard item={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="business-outline" size={64} color="#ccc" />
              </View>
              <Text style={styles.emptyTitle}>Nessuna struttura</Text>
              <Text style={styles.emptyText}>
                Crea la tua prima struttura per iniziare a gestire prenotazioni
              </Text>
              <Pressable
                style={styles.emptyButton}
                onPress={() => navigation.navigate("CreaStruttura")}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.emptyButtonText}>Crea struttura</Text>
              </Pressable>
            </View>
          }
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#2196F3"
              colors={["#2196F3"]}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#f8f9fa",
  },
  
  container: { 
    flex: 1,
  },

  // HEADER
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },

  title: { 
    fontSize: 28, 
    fontWeight: "800",
    color: "#1a1a1a",
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
    fontWeight: "500",
  },

  addButton: {
    backgroundColor: "#2196F3",
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // LISTA
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // CARD
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  cardImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#f0f0f0",
  },

  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },

  statusBadgeInactive: {
    backgroundColor: "rgba(229, 57, 53, 0.95)",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
  },

  statusDotInactive: {
    backgroundColor: "white",
  },

  statusText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  statusTextInactive: {
    color: "white",
  },

  cardContent: {
    padding: 16,
  },

  cardName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 10,
  },

  cardInfo: {
    gap: 8,
    marginBottom: 12,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  infoText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },

  statsRow: {
    flexDirection: "row",
    gap: 16,
  },

  statItem: {
    gap: 2,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  statLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
  },

  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  viewDetailsText: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "700",
  },

  // EMPTY STATE
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },

  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },

  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2196F3",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  emptyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});