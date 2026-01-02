import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import API_URL from "../../../config/api";

export default function GestisciImmaginiStrutturaScreen() {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { strutturaId } = route.params;

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [strutturaNome, setStrutturaNome] = useState("");

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/strutture/${strutturaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Struttura non trovata");

      const data = await response.json();
      setImages(data.images || []);
      setStrutturaNome(data.name || "");
    } catch (error) {
      console.error("❌ Errore caricamento immagini:", error);
      Alert.alert("Errore", "Impossibile caricare le immagini");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permesso negato",
          "Serve il permesso per accedere alla galleria"
        );
        return;
      }

      const remainingSlots = 10 - images.length;
      if (remainingSlots <= 0) {
        Alert.alert("Limite raggiunto", "Puoi caricare massimo 10 immagini");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: remainingSlots,
      });

      if (!result.canceled && result.assets) {
        await uploadImages(result.assets);
      }
    } catch (error) {
      console.error("❌ Errore selezione immagine:", error);
      Alert.alert("Errore", "Errore durante la selezione dell'immagine");
    }
  };

  const uploadImages = async (assets: any[]) => {
    setUploading(true);

    try {
      for (const asset of assets) {
        console.log("🔄 Inizio upload per:", asset.uri);
        
        // ✅ Usa XMLHttpRequest invece di fetch (bug noto React Native + FormData)
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          const formData = new FormData();
          
          const filename = asset.uri.split("/").pop();
          const match = /\.(\w+)$/.exec(filename || "");
          const type = match ? `image/${match[1]}` : "image/jpeg";

          console.log("📝 Filename:", filename);
          console.log("📝 Type:", type);

          formData.append("image", {
            uri: asset.uri,
            type: type,
            name: filename || `struttura-${Date.now()}.jpg`,
          } as any);

          const url = `${API_URL}/strutture/${strutturaId}/images`;
          console.log("🌐 URL completa:", url);

          xhr.open("POST", url);
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);

          xhr.onload = () => {
            console.log("📡 Response status:", xhr.status);
            
            if (xhr.status >= 200 && xhr.status < 300) {
              console.log("✅ Upload successo:", xhr.responseText);
              resolve();
            } else {
              console.log("❌ Response error:", xhr.responseText);
              try {
                const error = JSON.parse(xhr.responseText);
                reject(new Error(error.message || "Errore upload"));
              } catch {
                reject(new Error(`Errore upload: ${xhr.status}`));
              }
            }
          };

          xhr.onerror = () => {
            console.error("❌ Network error");
            reject(new Error("Errore di rete durante l'upload"));
          };

          xhr.ontimeout = () => {
            console.error("❌ Timeout");
            reject(new Error("Timeout durante l'upload"));
          };

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100;
              console.log(`📤 Upload progress: ${percentComplete.toFixed(0)}%`);
            }
          };

          console.log("🚀 Sending request...");
          xhr.send(formData);
        });
      }

      Alert.alert("Successo", `${assets.length} immagine/i caricate!`);
      await loadImages();
    } catch (error: any) {
      console.error("❌ Errore upload:", error);
      console.error("❌ Error name:", error.name);
      console.error("❌ Error message:", error.message);
      if (error.stack) {
        console.error("❌ Stack:", error.stack);
      }
      Alert.alert("Errore", error.message || "Errore durante l'upload");
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageUrl: string) => {
    Alert.alert(
      "Elimina immagine",
      "Sei sicuro di voler eliminare questa immagine?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}/strutture/${strutturaId}/images`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ imageUrl }),
                }
              );

              if (!response.ok) {
                throw new Error("Errore durante l'eliminazione");
              }

              Alert.alert("Successo", "Immagine eliminata");
              await loadImages();
            } catch (error) {
              console.error("❌ Errore eliminazione:", error);
              Alert.alert("Errore", "Impossibile eliminare l'immagine");
            }
          },
        },
      ]
    );
  };

  const setMainImage = async (imageUrl: string) => {
    try {
      const response = await fetch(
        `${API_URL}/strutture/${strutturaId}/images/main`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ imageUrl }),
        }
      );

      if (!response.ok) {
        throw new Error("Errore durante l'impostazione");
      }

      Alert.alert("Successo", "Immagine principale impostata");
      await loadImages();
    } catch (error) {
      console.error("❌ Errore impostazione principale:", error);
      Alert.alert("Errore", "Impossibile impostare l'immagine principale");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9C27B0" />
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Gestisci Immagini</Text>
          <Text style={styles.headerSubtitle}>{strutturaNome}</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* INFO BOX */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#9C27B0" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Come funziona</Text>
            <Text style={styles.infoText}>
              • Carica fino a 10 foto{"\n"}
              • La prima immagine sarà quella principale{"\n"}
              • Clicca sulla stella per cambiare la principale
            </Text>
          </View>
        </View>

        {/* ADD BUTTON */}
        <Pressable
          style={[
            styles.addButton,
            (images.length >= 10 || uploading) && styles.addButtonDisabled,
          ]}
          onPress={pickImage}
          disabled={images.length >= 10 || uploading}
        >
          <View style={styles.addButtonIconContainer}>
            {uploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="add" size={24} color="white" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addButtonText}>
              {uploading
                ? "Caricamento in corso..."
                : images.length >= 10
                ? "Limite raggiunto (10/10)"
                : `Aggiungi immagini (${images.length}/10)`}
            </Text>
            {!uploading && images.length < 10 && (
              <Text style={styles.addButtonSubtext}>
                Puoi aggiungerne ancora {10 - images.length}
              </Text>
            )}
          </View>
          {!uploading && images.length < 10 && (
            <Ionicons name="chevron-forward" size={20} color="white" />
          )}
        </Pressable>

        {/* IMAGES GRID */}
        {images.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="images-outline" size={64} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>Nessuna immagine</Text>
            <Text style={styles.emptyText}>
              Aggiungi delle foto per rendere la tua struttura più attraente
            </Text>
          </View>
        ) : (
          <View style={styles.imagesGrid}>
            {images.map((img, index) => (
              <View key={index} style={styles.imageCard}>
                <Image
                  source={{ uri: `${API_URL}${img}` }}
                  style={styles.image}
                  resizeMode="cover"
                />

                {/* MAIN BADGE */}
                {index === 0 && (
                  <View style={styles.mainBadge}>
                    <Ionicons name="star" size={12} color="white" />
                    <Text style={styles.mainBadgeText}>Principale</Text>
                  </View>
                )}

                {/* ACTIONS */}
                <View style={styles.imageActions}>
                  {index !== 0 && (
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => setMainImage(img)}
                    >
                      <Ionicons name="star-outline" size={20} color="white" />
                    </Pressable>
                  )}
                  <Pressable
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => deleteImage(img)}
                  >
                    <Ionicons name="trash" size={20} color="white" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
  },

  // INFO BOX
  infoBox: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#F3E5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#9C27B0",
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
  },

  infoText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },

  // ADD BUTTON
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#9C27B0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#9C27B0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  addButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0.1,
  },

  addButtonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },

  addButtonSubtext: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },

  // EMPTY STATE
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },

  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 40,
  },

  // IMAGES GRID
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  imageCard: {
    width: "48%",
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  // MAIN BADGE
  mainBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFB800",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  mainBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },

  // ACTIONS
  imageActions: {
    position: "absolute",
    top: 8,
    right: 8,
    gap: 6,
  },

  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  deleteButton: {
    backgroundColor: "rgba(244,67,54,0.9)",
  },
});