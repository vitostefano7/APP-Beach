import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import API_URL from "../../config/api";

export default function OwnerProfileScreen() {
  const { token, logout, user, updateUser } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null);
  const [stats, setStats] = useState({
    strutture: 0,
    prenotazioni: 0,
    incassoTotale: 0,
  });

  // ✅ Sincronizza avatarUrl quando user cambia nel context
  useEffect(() => {
    console.log("👤 Owner User context aggiornato, avatarUrl:", user?.avatarUrl);
    if (user?.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
    }
  }, [user?.avatarUrl]);

  useEffect(() => {
    fetchOwnerProfile();
  }, []);

  const fetchOwnerProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_URL}/users/me/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.log("OWNER PROFILE ERROR RESPONSE:", text);
        setError("Errore caricamento profilo");
        return;
      }

      const profileData = await res.json();
      
      // ✅ Aggiorna avatar se presente
      if (profileData.user?.avatarUrl) {
        console.log("✅ Owner Setting avatarUrl:", profileData.user.avatarUrl);
        setAvatarUrl(profileData.user.avatarUrl);
      }

      // Carica statistiche (opzionale)
      try {
        const [struttureRes, bookingsRes] = await Promise.all([
          fetch(`${API_URL}/strutture/owner/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/bookings/owner`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (struttureRes.ok && bookingsRes.ok) {
          const strutture = await struttureRes.json();
          const bookings = await bookingsRes.json();
          
          const incasso = bookings
            .filter((b: any) => b.status === "confirmed")
            .reduce((sum: number, b: any) => sum + (b.price || 0), 0);

          setStats({
            strutture: strutture.length,
            prenotazioni: bookings.length,
            incassoTotale: incasso,
          });
        }
      } catch (err) {
        console.log("Error loading stats:", err);
      }
    } catch (err) {
      console.log("OWNER PROFILE FETCH ERROR:", err);
      setError("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Funzione per cambiare avatar
  const changeAvatar = () => {
    if (avatarUrl) {
      Alert.alert(
        "Cambia immagine profilo",
        "Come vuoi caricare la tua foto?",
        [
          { text: "Annulla", onPress: () => {}, style: "cancel" as const },
          { text: "Galleria", onPress: pickImageFromGallery },
          { text: "Fotocamera", onPress: takePhotoWithCamera },
          { 
            text: "Rimuovi foto", 
            onPress: removeAvatar,
            style: "destructive" as const
          },
        ],
        { cancelable: true }
      );
    } else {
      Alert.alert(
        "Cambia immagine profilo",
        "Come vuoi caricare la tua foto?",
        [
          { text: "Annulla", onPress: () => {}, style: "cancel" as const },
          { text: "Galleria", onPress: pickImageFromGallery },
          { text: "Fotocamera", onPress: takePhotoWithCamera },
        ],
        { cancelable: true }
      );
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          "Permesso negato",
          "Devi concedere il permesso per accedere alle foto"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Errore selezione immagine:", error);
      Alert.alert("Errore", "Impossibile selezionare l'immagine");
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          "Permesso negato",
          "Devi concedere il permesso per usare la fotocamera"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Errore fotocamera:", error);
      Alert.alert("Errore", "Impossibile scattare la foto");
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    try {
      const formData = new FormData();
      
      const filename = imageUri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("avatar", {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await res.json();

      if (res.ok) {
        console.log("✅ Owner Avatar caricato:", json.avatarUrl);
        setAvatarUrl(json.avatarUrl);
        
        // ✅ Aggiorna il contesto user
        if (updateUser) {
          updateUser({ ...user, avatarUrl: json.avatarUrl });
        }
        
        Alert.alert("Successo", "Immagine profilo aggiornata!");
      } else {
        console.log("❌ Errore upload:", json.message);
        Alert.alert("Errore", json.message || "Impossibile caricare l'immagine");
      }
    } catch (error) {
      console.error("Upload avatar error:", error);
      Alert.alert("Errore", "Impossibile caricare l'immagine");
    }
  };

  const removeAvatar = async () => {
    try {
      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setAvatarUrl(null);
        
        // ✅ Aggiorna il contesto user
        if (updateUser) {
          updateUser({ ...user, avatarUrl: null });
        }
        
        Alert.alert("Successo", "Immagine profilo rimossa!");
      } else {
        Alert.alert("Errore", "Impossibile rimuovere l'immagine");
      }
    } catch (error) {
      console.error("Remove avatar error:", error);
      Alert.alert("Errore", "Impossibile rimuovere l'immagine");
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  /* =========================
     LOADING / ERROR
  ========================= */
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento profilo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={64} color="#E53935" />
          </View>
          <Text style={styles.errorTitle}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchOwnerProfile}>
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.retryText}>Riprova</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER CON AVATAR */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {/* ✅ AVATAR con immagine o iniziali */}
            <Pressable style={styles.avatar} onPress={changeAvatar}>
              {avatarUrl ? (
                <Image 
                  source={{ uri: `${API_URL}${avatarUrl}?t=${Date.now()}` }} 
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {getInitials(user.name)}
                  </Text>
                </View>
              )}
              <View style={styles.ownerBadge}>
                <Ionicons name="business" size={14} color="white" />
              </View>
            </Pressable>

            <View style={styles.headerInfo}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.email}>{user.email}</Text>
              <View style={styles.roleBadge}>
                <Ionicons name="star" size={12} color="#FFB800" />
                <Text style={styles.roleText}>Proprietario</Text>
              </View>
            </View>
          </View>
        </View>

        {/* STATISTICHE */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="business-outline"
            iconColor="#2196F3"
            iconBg="#E3F2FD"
            label="Strutture"
            value={stats.strutture.toString()}
          />
          <StatCard
            icon="calendar-outline"
            iconColor="#4CAF50"
            iconBg="#E8F5E9"
            label="Prenotazioni"
            value={stats.prenotazioni.toString()}
          />
          <StatCard
            icon="cash-outline"
            iconColor="#FF9800"
            iconBg="#FFF3E0"
            label="Incasso"
            value={`€${stats.incassoTotale}`}
          />
        </View>

        {/* GESTIONE RAPIDA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestione rapida</Text>
          
          <MenuCard
            icon="business"
            iconColor="#2196F3"
            iconBg="#E3F2FD"
            title="Le mie strutture"
            subtitle={stats.strutture === 1 ? "1 struttura attiva" : `${stats.strutture} strutture attive`}
            onPress={() => navigation.navigate("OwnerStrutture")}
          />

          <MenuCard
            icon="calendar"
            iconColor="#4CAF50"
            iconBg="#E8F5E9"
            title="Prenotazioni ricevute"
            subtitle={stats.prenotazioni === 1 ? "1 prenotazione" : `${stats.prenotazioni} prenotazioni`}
            onPress={() => navigation.navigate("OwnerBookings")}
          />

          <MenuCard
            icon="cash"
            iconColor="#FF9800"
            iconBg="#FFF3E0"
            title="Pagamenti e incassi"
            subtitle="Gestisci i tuoi pagamenti"
            onPress={() => {}}
          />
        </View>

        {/* ACCOUNT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <InfoCard
            icon="person-outline"
            label="Nome completo"
            value={user.name}
          />
          
          <InfoCard
            icon="mail-outline"
            label="Email"
            value={user.email}
          />
          
          <InfoCard
            icon="calendar-outline"
            label="Membro dal"
            value={new Date(user.createdAt).toLocaleDateString("it-IT", {
              month: "long",
              year: "numeric",
            })}
          />
        </View>

        {/* IMPOSTAZIONI */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Impostazioni</Text>
          
          <MenuCard
            icon="settings-outline"
            iconColor="#666"
            iconBg="#f5f5f5"
            title="Preferenze"
            subtitle="Gestisci le tue preferenze"
            onPress={() => {}}
          />

          <MenuCard
            icon="notifications-outline"
            iconColor="#666"
            iconBg="#f5f5f5"
            title="Notifiche"
            subtitle="Gestisci notifiche e avvisi"
            onPress={() => {}}
          />

          <MenuCard
            icon="shield-checkmark-outline"
            iconColor="#666"
            iconBg="#f5f5f5"
            title="Privacy e sicurezza"
            subtitle="Gestisci password e privacy"
            onPress={() => {}}
          />

          <MenuCard
            icon="help-circle-outline"
            iconColor="#666"
            iconBg="#f5f5f5"
            title="Supporto"
            subtitle="FAQ e contatti"
            onPress={() => {}}
          />
        </View>

        {/* LOGOUT */}
        <Pressable style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color="#E53935" />
          <Text style={styles.logoutText}>Esci dall'account</Text>
        </Pressable>

        <Text style={styles.version}>Versione App 2.4.0</Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================
   COMPONENTI
========================= */

const StatCard = ({ icon, iconColor, iconBg, label, value }: any) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={24} color={iconColor} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MenuCard = ({ icon, iconColor, iconBg, title, subtitle, onPress }: any) => (
  <Pressable style={styles.menuCard} onPress={onPress}>
    <View style={styles.menuLeft}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#ccc" />
  </Pressable>
);

const InfoCard = ({ icon, label, value }: any) => (
  <View style={styles.infoCard}>
    <View style={styles.infoLeft}>
      <Ionicons name={icon} size={20} color="#666" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#f8f9fa",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },

  errorIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E53935",
    marginBottom: 24,
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2196F3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  retryText: { 
    color: "white", 
    fontWeight: "700",
    fontSize: 16,
  },

  // HEADER
  header: {
    backgroundColor: "white",
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    position: "relative",
  },

  // ✅ NUOVO: per mostrare l'immagine avatar
  avatarImage: {
    width: "100%",
    height: "100%",
  },

  // ✅ NUOVO: placeholder quando non c'è immagine
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: { 
    fontSize: 32, 
    fontWeight: "800",
    color: "white",
  },

  ownerBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF9800",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "white",
  },

  headerInfo: {
    flex: 1,
  },

  name: { 
    fontSize: 22, 
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },

  email: { 
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },

  roleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF9800",
  },

  // STATISTICHE
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },

  // SEZIONI
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // MENU CARD
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  menuText: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },

  menuSubtitle: {
    fontSize: 13,
    color: "#666",
  },

  // INFO CARD
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  // LOGOUT
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 16,
    marginTop: 32,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFEBEE",
    borderWidth: 1.5,
    borderColor: "#E53935",
  },

  logoutText: { 
    color: "#E53935", 
    fontWeight: "800",
    fontSize: 16,
  },

  version: {
    textAlign: "center",
    color: "#999",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
});