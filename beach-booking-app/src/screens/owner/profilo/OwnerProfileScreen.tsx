import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  useColorScheme,
  AppState,
  AppStateStatus,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useContext, useEffect, useState, useCallback, memo } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Network from 'expo-network';

import API_URL from "../../../config/api";
import { Avatar } from "../../../components/Avatar";
import { useAlert } from "../../../context/AlertContext";
import { AvatarPicker } from "../../../components/AvatarPicker";
import { resolveAvatarUrl } from "../../../utils/avatar";
import { useOwnerStats } from "../../../hooks/useOwnerStats";

// ==================== TIPI ====================
interface OwnerStats {
  strutture: number;
  prenotazioni: number;
  incassoTotale: number;
  incassoOggi: number;
  incassoSettimana: number;
  incassoMese: number;
  tassoOccupazione: number;
  nuoviClienti: number;
}

interface OwnerEarnings {
  totalEarnings: number;
  earnings: Array<{
    type: string;
    amount: number;
    description?: string;
    createdAt: string;
    bookingDetails?: any;
  }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  role: string;
}

interface ProfileResponse {
  user: User;
}

interface Booking {
  id: string;
  status: string;
  price: number;
  user?: {
    _id: string;
    name: string;
    surname?: string;
  };
  [key: string]: any;
}

interface Struttura {
  id: string;
  _id?: string;
  name?: string;
  openingHours?: any;
  [key: string]: any;
}

interface Campo {
  _id: string;
  name: string;
  struttura: string;
  weeklySchedule?: {
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
    saturday?: { open: string; close: string; closed?: boolean };
    sunday?: { open: string; close: string; closed?: boolean };
  };
  [key: string]: any;
}

// ==================== UTILITY FUNCTIONS ====================

// ==================== CUSTOM HOOKS ====================
const useOwnerProfile = (token: string | null) => {
  const [earnings, setEarnings] = useState<OwnerEarnings>({
    totalEarnings: 0,
    earnings: [],
  });
  const [strutture, setStrutture] = useState<Struttura[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [campi, setCampi] = useState<Campo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setError("Token non disponibile");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [profileRes, struttureRes, bookingsRes, earningsRes] = await Promise.all([
        fetch(`${API_URL}/users/me/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/strutture/owner/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/bookings/owner`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/users/me/earnings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Gestione errori
      if (!profileRes.ok) {
        const errorText = await profileRes.text();
        throw new Error(`HTTP ${profileRes.status}: ${errorText || "Errore caricamento profilo"}`);
      }

      const profileData: ProfileResponse = await profileRes.json();
      
      // Carica dati
      const struttureData: Struttura[] = struttureRes.ok ? await struttureRes.json() : [];
      const bookingsData: Booking[] = bookingsRes.ok ? await bookingsRes.json() : [];
      
      // Carica campi per ogni struttura
      const allCampi: Campo[] = [];
      for (const struttura of struttureData) {
        try {
          const campiRes = await fetch(
            `${API_URL}/campi/owner/struttura/${struttura._id || struttura.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (campiRes.ok) {
            const campiData = await campiRes.json();
            allCampi.push(...campiData);
          }
        } catch (err) {
          console.warn(`⚠️ Errore caricamento campi struttura ${struttura._id}:`, err);
        }
      }
      
      // Gestione earnings
      let earningsData: OwnerEarnings = { totalEarnings: 0, earnings: [] };
      if (earningsRes.ok) {
        try {
          earningsData = await earningsRes.json();
        } catch (err) {
          console.error("❌ Error parsing earnings:", err);
        }
      }

      setStrutture(struttureData);
      setBookings(bookingsData);
      setCampi(allCampi);
      setEarnings(earningsData);

      console.log("✅ Profile loaded:", {
        strutture: struttureData.length,
        bookings: bookingsData.length,
        campi: allCampi.length,
      });

      return profileData.user;
    } catch (err) {
      console.error("Fetch profile error:", err);
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { earnings, strutture, bookings, campi, loading, error, fetchProfile, setError };
};

const useAvatarManager = (
  token: string | null,
  user: User | null,
  updateUser: ((updatedUser: Partial<User>) => void) | null,
  showAlert: any,
  fetchProfile: () => Promise<void>
) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);

  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
      setAvatarError(false);
    }
  }, [user?.avatarUrl]);

  const validateImage = (size: number): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return size <= maxSize;
  };

  const uploadAvatar = useCallback(async (imageUri: string) => {
    if (!token) {
      showAlert({
        type: 'error',
        title: 'Errore',
        message: 'Token non disponibile',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    try {
      setUploading(true);

      // Validazione dimensioni immagine
      const response = await fetch(imageUri);
      const blob = await response.blob();

      if (!validateImage(blob.size)) {
        showAlert({
          type: 'warning',
          title: 'Immagine troppo grande',
          message: 'L\'immagine deve essere massimo 5MB',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

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
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();

      if (res.ok) {
        const newAvatarUrl = json.avatarUrl;
        setAvatarUrl(newAvatarUrl);
        setAvatarError(false);
        setAvatarRefreshKey(prev => prev + 1);

        if (updateUser && user) {
          updateUser({ ...user, avatarUrl: newAvatarUrl });
        }

        // ✅ Ricarica il profilo
        await fetchProfile();

        showAlert({
          type: 'success',
          title: 'Perfetto!',
          message: 'La tua immagine profilo è stata aggiornata con successo',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Ops!',
          message: json.message || 'Non siamo riusciti a caricare l\'immagine. Riprova.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error) {
      console.error("Upload avatar error:", error);
      showAlert({
        type: 'error',
        title: 'Errore di connessione',
        message: 'Verifica la tua connessione internet e riprova',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setUploading(false);
    }
  }, [token, user, updateUser, showAlert, fetchProfile]);

  const removeAvatar = useCallback(async () => {
    if (!token) {
      showAlert({
        type: 'error',
        title: 'Errore',
        message: 'Token non disponibile',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    try {
      setUploading(true);
      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setAvatarUrl(null);
        setAvatarError(false);
        setAvatarRefreshKey(prev => prev + 1);

        if (updateUser && user) {
          updateUser({ ...user, avatarUrl: undefined });
        }

        // ✅ Ricarica il profilo
        await fetchProfile();

        showAlert({
          type: 'success',
          title: 'Fatto!',
          message: 'La tua immagine profilo è stata rimossa',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Ops!',
          message: 'Non siamo riusciti a rimuovere l\'immagine',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error) {
      console.error("Remove avatar error:", error);
      showAlert({
        type: 'error',
        title: 'Errore',
        message: 'Non siamo riusciti a rimuovere l\'immagine',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setUploading(false);
    }
  }, [token, user, updateUser, showAlert, fetchProfile]);

  const handleAvatarError = useCallback(() => {
    console.warn("Failed to load avatar, falling back to placeholder");
    setAvatarError(true);
  }, []);

  return {
    avatarUrl,
    avatarError,
    avatarRefreshKey,
    uploading,
    uploadAvatar,
    removeAvatar,
    handleAvatarError,
  };
};

// Hook per controllo connessione (compatibile con React Native)
const useNetworkStatus = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkNetworkStatus = async () => {
      try {
        // Usa expo-network per controllare lo stato della connessione
        const networkState = await Network.getNetworkStateAsync();
        
        if (isMounted) {
          setIsOffline(!networkState.isConnected);
        }
      } catch (error) {
        console.error("Error checking network status:", error);
        if (isMounted) {
          setIsOffline(true);
        }
      }
    };

    // Controlla lo stato iniziale
    checkNetworkStatus();

    // Controlla periodicamente lo stato della rete (ogni 10 secondi)
    const intervalId = setInterval(checkNetworkStatus, 10000);

    // Usa AppState per ri-controllare quando l'app diventa attiva
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkNetworkStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      subscription.remove();
    };
  }, []);

  return isOffline;
};

// ==================== COMPONENTI MEMOIZZATI ====================
interface StatCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
}

const StatCard = memo<StatCardProps>(({ icon, iconColor, iconBg, label, value }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon as any} size={24} color={iconColor} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
));

StatCard.displayName = 'StatCard';

interface MenuCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const MenuCard = memo<MenuCardProps>(({ icon, iconColor, iconBg, title, subtitle, onPress }) => (
  <Pressable 
    style={styles.menuCard} 
    onPress={onPress}
    accessibilityLabel={title}
    accessibilityHint={`Premi per ${subtitle.toLowerCase()}`}
    accessibilityRole="button"
  >
    <View style={styles.menuLeft}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={24} color={iconColor} />
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#ccc" />
  </Pressable>
));

MenuCard.displayName = 'MenuCard';

interface InfoCardProps {
  icon: string;
  label: string;
  value: string;
}

const InfoCard = memo<InfoCardProps>(({ icon, label, value }) => (
  <View style={styles.infoCard}>
    <View style={styles.infoLeft}>
      <Ionicons name={icon as any} size={20} color="#666" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
));

InfoCard.displayName = 'InfoCard';

// ==================== SKELETON LOADER ====================
const SkeletonLoader = () => (
  <SafeAreaView style={styles.safe}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Skeleton Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={[styles.avatar, { backgroundColor: '#e0e0e0' }]} />
          <View style={styles.headerInfo}>
            <View style={[styles.skeletonLine, { width: '60%', marginBottom: 8 }]} />
            <View style={[styles.skeletonLine, { width: '80%', marginBottom: 12 }]} />
            <View style={[styles.skeletonLine, { width: '30%' }]} />
          </View>
        </View>
      </View>

      {/* Skeleton Stats */}
      <View style={styles.statsContainer}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#e0e0e0' }]} />
            <View style={[styles.skeletonLine, { width: '40%', marginBottom: 4 }]} />
            <View style={[styles.skeletonLine, { width: '60%' }]} />
          </View>
        ))}
      </View>

      {/* Skeleton Menu Items */}
      {[1, 2, 3].map((section) => (
        <View key={section} style={styles.section}>
          <View style={[styles.skeletonLine, { width: '40%', marginBottom: 16 }]} />
          {[1, 2, 3].map((item) => (
            <View key={item} style={[styles.menuCard, { backgroundColor: '#f0f0f0' }]}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#e0e0e0' }]} />
                <View style={styles.menuText}>
                  <View style={[styles.skeletonLine, { width: '70%', marginBottom: 4 }]} />
                  <View style={[styles.skeletonLine, { width: '50%' }]} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  </SafeAreaView>
);

// ==================== COMPONENTE PRINCIPALE ====================
export default function OwnerProfileScreen() {
  const { token, logout, user, updateUser } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const { showAlert } = useAlert();

  const { earnings, strutture, bookings, campi, loading, error, fetchProfile, setError } = useOwnerProfile(token);
  
  // Calcola statistiche usando il hook dedicato
  const stats = useOwnerStats(bookings, strutture, campi);
  const {
    avatarUrl,
    avatarError,
    avatarRefreshKey,
    uploading,
    uploadAvatar,
    removeAvatar,
    handleAvatarError,
  } = useAvatarManager(token, user, updateUser, showAlert, fetchProfile);

  const [refreshing, setRefreshing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  
  // Usa il nuovo hook per il controllo della connessione
  const isOffline = useNetworkStatus();

  // Fetch iniziale
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    if (isOffline) {
      Alert.alert("Offline", "Non sei connesso a Internet");
      return;
    }
    
    setRefreshing(true);
    try {
      await fetchProfile();
    } finally {
      setRefreshing(false);
    }
  }, [fetchProfile, isOffline]);

  const changeAvatar = useCallback(() => {
    if (uploading) return;
    setShowAvatarPicker(true);
  }, [uploading]);

  const pickImageFromGallery = useCallback(async () => {
    if (uploading) return;

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        showAlert({
          type: 'warning',
          title: 'Permesso necessario',
          message: 'Devi concedere il permesso per accedere alle tue foto',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      // ✅ CORREZIONE: usa ImagePicker.MediaType invece di ImagePicker.MediaTypeOptions
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images', // <-- Correzione qui
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Errore selezione immagine:", error);
      showAlert({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile selezionare l\'immagine',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  }, [uploadAvatar, uploading, showAlert]);

  const takePhotoWithCamera = useCallback(async () => {
    if (uploading) return;

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        showAlert({
          type: 'warning',
          title: 'Permesso necessario',
          message: 'Devi concedere il permesso per usare la fotocamera',
          buttons: [{ text: 'OK', style: 'default' }],
        });
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
      showAlert({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile scattare la foto',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  }, [uploadAvatar, uploading, showAlert]);


  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Cancella account",
      "Sei sicuro? Questa azione è irreversibile e cancellerà tutte le tue strutture e prenotazioni.",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Conferma cancellazione",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/users/me`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              
              if (res.ok) {
                Alert.alert("Account cancellato", "Il tuo account è stato cancellato con successo.");
                logout();
              } else {
                Alert.alert("Errore", "Impossibile cancellare l'account");
              }
            } catch (err) {
              console.error("Delete account error:", err);
              Alert.alert("Errore", "Impossibile cancellare l'account");
            }
          },
        },
      ]
    );
  }, [token, logout]);

  // ==================== RENDER ====================
  if (loading && !refreshing) {
    return <SkeletonLoader />;
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={64} color="#E53935" />
          </View>
          <Text style={styles.errorTitle}>{error}</Text>
          
          {isOffline && (
            <Text style={styles.offlineText}>
              ⚠️ Sei offline
            </Text>
          )}
          
          <Pressable 
            style={[styles.retryButton, isOffline && styles.disabledButton]} 
            onPress={fetchProfile}
            disabled={isOffline}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.retryText}>Riprova</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Calcola URL avatar finale
  const finalAvatarUrl = resolveAvatarUrl(avatarError ? null : avatarUrl);
  const shouldShowAvatar = finalAvatarUrl && !avatarError;

  return (
    <SafeAreaView style={styles.safe}>
      <AvatarPicker
        visible={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        onSelectGallery={pickImageFromGallery}
        onSelectCamera={takePhotoWithCamera}
        onRemovePhoto={removeAvatar}
        hasPhoto={!!avatarUrl && !avatarError}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2196F3"]}
            tintColor="#2196F3"
            enabled={!isOffline}
          />
        }
      >
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="wifi-outline" size={16} color="white" />
            <Text style={styles.offlineBannerText}>Sei offline</Text>
          </View>
        )}

        {/* HEADER BLU CON GRADIENTE */}
        <View style={styles.blueHeader}>
          {/* BOTTONE IMPOSTAZIONI */}
          <View style={styles.headerTopRow}>
            <View style={{ width: 40 }} />
            <Text style={styles.headerTitle}>Profilo Owner</Text>
            <Pressable 
              style={styles.settingsButton}
              onPress={() => navigation.navigate("Settings")}
            >
              <Ionicons name="settings-outline" size={22} color="white" />
            </Pressable>
          </View>

          {/* AVATAR CENTRATO */}
          <Pressable
            style={styles.avatarContainer}
            onPress={changeAvatar}
            accessibilityLabel="Cambia immagine profilo"
            accessibilityRole="button"
            disabled={uploading}
          >
            {shouldShowAvatar ? (
              <Image
                key={avatarRefreshKey}
                source={{ uri: finalAvatarUrl }}
                style={[styles.largeAvatar, uploading && styles.uploadingAvatar]}
                onError={handleAvatarError}
              />
            ) : (
              <View style={[styles.largeAvatarPlaceholder, uploading && styles.uploadingAvatar]}>
                <Ionicons name="business" size={50} color="white" />
              </View>
            )}
          </Pressable>

          <Text style={styles.ownerName}>{user?.name || "Caricamento..."}</Text>
          <Text style={styles.companyName}>Sunset Beach Club S.r.l.</Text>
        </View>

        {/* ACTION CARDS BLU */}
        <View style={styles.actionCardsContainer}>

          <Pressable 
            style={styles.actionCard}
            onPress={() => navigation.navigate("Strutture")}
          >
            <Ionicons name="business" size={32} color="white" />
            <Text style={styles.actionCardTitle}>Strutture</Text>
            <Text style={styles.actionCardSubtitle}>{stats.strutture} Centri</Text>
          </Pressable>

          <Pressable 
            style={styles.actionCard}
            onPress={() => navigation.navigate("OwnerBookings")}
          >
            <Ionicons name="calendar" size={32} color="white" />
            <Text style={styles.actionCardTitle}>Prenotazioni</Text>
            <Text style={styles.actionCardSubtitle}>{stats.prenotazioni} Totali</Text>
          </Pressable>
        </View>

        {/* STATISTICHE BUSINESS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Statistiche Business</Text>
            <Pressable
              style={styles.viewMoreButton}
              onPress={() => navigation.navigate("OwnerStatistics")}
            >
              <Text style={styles.viewMoreText}>Dettagli</Text>
              <Ionicons name="chevron-forward" size={16} color="#2196F3" />
            </Pressable>
          </View>
          
          {/* Card Guadagni - 3 Periodi */}
          <View style={styles.earningsGrid}>
            <Pressable 
              style={styles.earningsPeriodCard}
              onPress={() => navigation.navigate("EarningsStats", { 
                earnings: {
                  totalEarnings: stats.incassoOggi,
                  earnings: [],
                }
              })}
            >
              <View style={styles.earningsPeriodHeader}>
                <Ionicons name="calendar-outline" size={24} color="#4CAF50" />
                <Text style={styles.earningsPeriodLabel}>Oggi</Text>
              </View>
              <Text style={styles.earningsPeriodValue}>€{stats.incassoOggi.toFixed(0)}</Text>
            </Pressable>

            <Pressable 
              style={styles.earningsPeriodCard}
              onPress={() => navigation.navigate("EarningsStats", { 
                earnings: {
                  totalEarnings: stats.incassoSettimana,
                  earnings: [],
                }
              })}
            >
              <View style={styles.earningsPeriodHeader}>
                <Ionicons name="calendar" size={24} color="#2196F3" />
                <Text style={styles.earningsPeriodLabel}>Settimana</Text>
              </View>
              <Text style={styles.earningsPeriodValue}>€{stats.incassoSettimana.toFixed(0)}</Text>
            </Pressable>

            <Pressable 
              style={styles.earningsPeriodCard}
              onPress={() => navigation.navigate("EarningsStats", { 
                earnings: {
                  totalEarnings: stats.incassoMese,
                  earnings: [],
                }
              })}
            >
              <View style={styles.earningsPeriodHeader}>
                <Ionicons name="stats-chart" size={24} color="#FF9800" />
                <Text style={styles.earningsPeriodLabel}>Mese</Text>
              </View>
              <Text style={styles.earningsPeriodValue}>€{stats.incassoMese.toFixed(0)}</Text>
            </Pressable>
          </View>

          {/* Altre Statistiche */}
          <View style={styles.businessStatsCard}>
            <View style={styles.businessStat}>
              <Ionicons name="calendar" size={28} color="#4CAF50" />
              <Text style={styles.businessStatLabel}>Prenotazioni:</Text>
              <Text style={styles.businessStatValue}>{stats.prenotazioni}</Text>
            </View>
            <View style={styles.businessStat}>
              <Ionicons name="trending-up" size={28} color="#FF9800" />
              <Text style={styles.businessStatLabel}>Tasso Occupazione:</Text>
              <Text style={styles.businessStatValue}>{stats.tassoOccupazione}%</Text>
            </View>
            <View style={styles.businessStat}>
              <Ionicons name="people" size={28} color="#9C27B0" />
              <Text style={styles.businessStatLabel}>Clienti Unici:</Text>
              <Text style={styles.businessStatValue}>{stats.nuoviClienti}</Text>
            </View>
          </View>
        </View>

        {/* LE TUE STRUTTURE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Le Tue Strutture</Text>
          
          {strutture.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>Nessuna struttura trovata</Text>
            </View>
          ) : (
            strutture.map((struttura, index) => {
              const isOpen = struttura.isActive;
              const mainImage = struttura.images?.[0] || struttura.imageUrl;
              
              return (
                <Pressable 
                  key={struttura.id || `struttura-${index}`}
                  style={styles.strutturaCard}
                  onPress={() => navigation.navigate("StrutturaDashboard", { strutturaId: struttura._id || struttura.id })}
                >
                  <Image
                    source={{ uri: mainImage || 'https://via.placeholder.com/100x80' }}
                    style={styles.strutturaImage}
                  />
                  <View style={styles.strutturaInfo}>
                    <Text style={styles.strutturaName}>{struttura.name}</Text>
                    <Text style={styles.strutturaSubtitle}>
                      {struttura.address || struttura.city || 'Indirizzo non disponibile'}
                    </Text>
                  </View>
                  <View style={isOpen ? styles.statusBadgeOpen : styles.statusBadgeMaintenance}>
                    <Ionicons 
                      name={isOpen ? "checkmark-circle" : "time"} 
                      size={16} 
                      color={isOpen ? "#4CAF50" : "#FF9800"} 
                    />
                    <Text style={isOpen ? styles.statusTextOpen : styles.statusTextMaintenance}>
                      {isOpen ? "Attiva" : "Chiuso"}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* LOGOUT */}
        <Pressable 
          style={styles.logoutButton}
          onPress={logout}
          accessibilityLabel="Esci dall'account"
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={24} color="#E53935" />
          <Text style={styles.logoutText}>Esci dall'account</Text>
        </Pressable>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#f0f2f5",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },

  // Skeleton
  skeletonLine: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
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
  darkErrorIcon: {
    backgroundColor: "#3A1E1E",
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E53935",
    marginBottom: 24,
    textAlign: "center",
  },

  offlineText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  darkOfflineText: {
    color: "#aaa",
  },

  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF9800",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  offlineBannerText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
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
  disabledButton: {
    opacity: 0.5,
  },

  retryText: { 
    color: "white", 
    fontWeight: "700",
    fontSize: 16,
  },

  // HEADER BLU
  blueHeader: {
    backgroundColor: "#2979c1",
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
  },

  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },

  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 30,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },

  editButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },

  editButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#1e5a8e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "white",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  largeAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },

  largeAvatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#1e5a8e",
    alignItems: "center",
    justifyContent: "center",
  },

  uploadingAvatar: {
    opacity: 0.7,
  },

  ownerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 2,
  },

  companyName: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
  },

  // ACTION CARDS
  actionCardsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },

  actionCard: {
    flex: 1,
    backgroundColor: "#3c8fd3",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  messageBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#E53935",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
  },

  actionCardTitle: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
  },

  actionCardSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },

  // BUSINESS STATS
  businessStatsCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  businessStat: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  businessStatLabel: {
    fontSize: 12,
    color: "#666",
    marginLeft: 10,
    flex: 1,
  },

  businessStatValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  // SEZIONI
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  viewMoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2196F3",
  },

  // EARNINGS CARD
  earningsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },

  earningsHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  earningsIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  earningsContent: {
    flex: 1,
  },

  earningsLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
    fontWeight: "600",
  },

  earningsValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2196F3",
    marginBottom: 2,
  },

  earningsSubtext: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },

  // EARNINGS GRID - 3 periodi
  earningsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  earningsPeriodCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  earningsPeriodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },

  earningsPeriodLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },

  earningsPeriodValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
  },

  // STRUTTURE CARD
  strutturaCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  strutturaImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
  },

  strutturaInfo: {
    flex: 1,
    marginLeft: 12,
  },

  strutturaName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 3,
  },

  strutturaSubtitle: {
    fontSize: 12,
    color: "#666",
  },

  statusBadgeOpen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  statusTextOpen: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "700",
  },

  statusBadgeMaintenance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  statusTextMaintenance: {
    color: "#FF9800",
    fontSize: 12,
    fontWeight: "700",
  },

  // EMPTY STATE
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "white",
    borderRadius: 14,
  },

  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
    fontWeight: "600",
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

  darkText: {
    color: "#1a1a1a",
  },
  darkSubtext: {
    color: "#666",
  },
});